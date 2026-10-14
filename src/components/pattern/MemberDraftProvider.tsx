import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentSession } from "@/lib/auth.shared";
import { useAuth } from "@/hooks/useAuth";
import { MemberDraftController, type DraftInput } from "@/lib/member-draft-controller";
import {
  type DraftBaseline,
  type DraftKind,
  type DraftSubmission,
  type DraftValuesMap,
  type WellnessPermission,
} from "@/lib/member-drafts";
import { createIsomorphicFn } from "@tanstack/react-start";
const openMemberDraftStore = createIsomorphicFn()
  .server(async () => {
    throw new Error("Local drafts are available in the browser.");
  })
  .client(async () => (await import("@/lib/member-draft-store.client")).openMemberDraftStore());

type ContextValue = {
  controller: MemberDraftController;
  ownerId: string | null;
  broadcast: (value: unknown) => void;
  purgeAccountDrafts: (options?: { resume?: boolean }) => Promise<void>;
};
const DraftContext = createContext<ContextValue | null>(null);
const CLEANUP_MARKER = "pattern-draft-cleanup-needed";
export function MemberDraftProvider({ children }: { children: ReactNode }) {
  const auth = useAuth(),
    qc = useQueryClient();
  const [draftEpoch, setDraftEpoch] = useState(0);
  const [cleanupError, setCleanupError] = useState(false);
  const [cleanupReady, setCleanupReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [controller] = useState(() => new MemberDraftController(openMemberDraftStore));
  const channel = useRef<BroadcastChannel | null>(null);
  const pendingPurges = useRef(new Set<string>());
  const held = useRef(false),
    verification = useRef(0);
  const ownerId = auth.session?.userId ?? null;
  const verifiedOwner = useRef(ownerId);
  verifiedOwner.current = ownerId;
  const broadcast = useCallback((message: unknown) => {
    try {
      channel.current?.postMessage(message);
    } catch {
      /* Focus revalidation is the fallback. */
    }
  }, []);
  const marker = useCallback((owner: string | null) => {
    try {
      if (owner) sessionStorage.setItem(CLEANUP_MARKER, owner);
      else sessionStorage.removeItem(CLEANUP_MARKER);
    } catch {
      setCleanupError(true);
    }
  }, []);
  const verifyAfterPurge = useCallback(async () => {
    const token = ++verification.current;
    held.current = true;
    setRefreshing(true);
    setRefreshFailed(false);
    try {
      const result = await qc.fetchQuery({
        queryKey: ["session"],
        queryFn: () => currentSession(),
        staleTime: 0,
      });
      if (token !== verification.current || pendingPurges.current.size) return;
      // Explicitly reactivate even if the authenticated account id is unchanged.
      await controller.setOwner(result.session?.userId ?? null);
      if (token !== verification.current || pendingPurges.current.size) return;
      held.current = false;
      setRefreshing(false);
    } catch {
      if (token === verification.current) setRefreshFailed(true);
    }
  }, [controller, qc]);
  useEffect(() => {
    let live = true;
    void (async () => {
      let pending: string | null = null;
      try {
        pending = sessionStorage.getItem(CLEANUP_MARKER);
      } catch {
        if (live) setCleanupError(true);
      }
      if (pending) {
        held.current = true;
        setRefreshing(true);
        try {
          const store = await openMemberDraftStore();
          try {
            await store.purgeOwner(pending);
            marker(null);
          } finally {
            store.close();
          }
          held.current = false;
          if (live) setRefreshing(false);
        } catch {
          if (live) {
            setCleanupError(true);
            setRefreshFailed(true);
          }
        }
      }
      if (live) setCleanupReady(true);
    })();
    return () => {
      live = false;
    };
  }, [marker]);
  useEffect(() => {
    if (
      cleanupReady &&
      !held.current &&
      (auth.status === "authenticated" || auth.status === "anonymous")
    )
      void controller.setOwner(ownerId);
  }, [cleanupReady, auth.status, ownerId, controller]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const message = event.data;
      if (!message || message.ownerId !== verifiedOwner.current) return;
      if (message.type === "purge-start" && typeof message.id === "string") {
        pendingPurges.current.add(message.id);
        ++verification.current;
        held.current = true;
        setRefreshing(true);
        setRefreshFailed(false);
        void controller.setOwner(null);
      }
      if (message.type === "purge-complete" && typeof message.id === "string") {
        pendingPurges.current.delete(message.id);
        if (message.failed) {
          marker(message.ownerId);
          setCleanupError(true);
        }
        if (!pendingPurges.current.size) void verifyAfterPurge();
      }
      if (
        message.type === "consent" &&
        typeof message.sleep === "boolean" &&
        typeof message.stress === "boolean"
      )
        void controller.setWellnessPermission(message);
    };
    try {
      channel.current =
        typeof BroadcastChannel !== "undefined"
          ? new BroadcastChannel("pattern-member-drafts")
          : null;
    } catch {
      channel.current = null;
    }
    channel.current?.addEventListener("message", receive);
    const flush = () => {
      void controller.flush();
    };
    const revalidate = async () => {
      if (document.visibilityState === "hidden" || held.current) return;
      try {
        const result = await qc.fetchQuery({
          queryKey: ["session"],
          queryFn: () => currentSession(),
          staleTime: 0,
        });
        if (!held.current && (await controller.revalidateOwner(result.session?.userId ?? null)))
          setDraftEpoch((value) => value + 1);
      } catch {
        /* A failed check keeps only this page's already verified in-memory state. */
      }
    };
    const before = (event: BeforeUnloadEvent) => {
      if (controller.hasUndurable()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("beforeunload", before);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      channel.current?.removeEventListener("message", receive);
      channel.current?.close();
      channel.current = null;
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [controller, marker, verifyAfterPurge, qc]);
  const purgeAccountDrafts = useCallback(
    async (options: { resume?: boolean } = {}) => {
      if (!ownerId) return;
      const id = crypto.randomUUID();
      pendingPurges.current.add(id);
      ++verification.current;
      held.current = true;
      setRefreshing(true);
      setRefreshFailed(false);
      broadcast({ type: "purge-start", ownerId, id });
      let failed = false;
      try {
        await controller.purgeAccountDrafts(ownerId);
        marker(null);
      } catch (error) {
        failed = true;
        marker(ownerId);
        setCleanupError(true);
        throw error;
      } finally {
        pendingPurges.current.delete(id);
        broadcast({ type: "purge-complete", ownerId, id, failed });
        if (options.resume) await verifyAfterPurge();
      }
    },
    [ownerId, controller, broadcast, marker, verifyAfterPurge],
  );
  const value = useMemo(
    () => ({ controller, ownerId, broadcast, purgeAccountDrafts }),
    [controller, ownerId, broadcast, purgeAccountDrafts],
  );
  return (
    <DraftContext.Provider value={value}>
      {cleanupError && (
        <p role="alert" className="border border-destructive p-4">
          Device draft cleanup could not be verified. Browser storage may be blocked. Clear this
          site’s data in your browser settings if needed.
        </p>
      )}
      {refreshing ? (
        <div role="status" className="p-6">
          <p>
            {refreshFailed
              ? "Your account could not be checked. Reload to continue."
              : "Refreshing your account…"}
          </p>
          {refreshFailed && (
            <button
              type="button"
              className="mt-3 min-h-11 underline"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          )}
        </div>
      ) : (
        <Fragment key={draftEpoch}>{children}</Fragment>
      )}
    </DraftContext.Provider>
  );
}
export function useMemberDraft<K extends DraftKind>(input: DraftInput<K>) {
  const context = useContext(DraftContext);
  if (!context) throw new Error("Member drafts require the root provider.");
  const { controller, ownerId } = context;
  useSyncExternalStore(controller.subscribe, controller.snapshot, () => 0);
  const draft = controller.get(ownerId, input.kind, input.entityKey);
  return {
    draft,
    recoveryCandidates: controller.candidates(ownerId, input.kind),
    durability: draft ? controller.durability(draft.draftId) : null,
    error: controller.error,
    current: () => controller.get(ownerId, input.kind, input.entityKey),
    update: (values: DraftValuesMap[K]) => controller.update(ownerId!, { ...input, values }),
    resume: (id: string) => {
      if (ownerId) controller.resume(ownerId, id);
    },
    discard: (id: string) => (ownerId ? controller.discard(ownerId, id) : Promise.resolve()),
    checkpointSubmission: (values: DraftValuesMap[K], operationId?: string) =>
      controller.submit(ownerId!, { ...input, values }, operationId),
    reconcileAcknowledgement: (
      submitted: DraftSubmission<K>,
      canonical: DraftValuesMap[K],
      version: string | null,
    ) => {
      if (ownerId)
        controller.acknowledge(ownerId, input.kind, input.entityKey, submitted, canonical, version);
    },
    rebase: (values: DraftValuesMap[K], baseline: DraftBaseline<K>) => {
      if (ownerId) controller.rebase(ownerId, input.kind, input.entityKey, values, baseline);
    },
    flush: () => controller.flush(draft?.draftId),
  };
}
export function useMemberDraftLifecycle() {
  const context = useContext(DraftContext);
  if (!context) throw new Error("Member drafts require the root provider.");
  const { controller, ownerId, broadcast, purgeAccountDrafts } = context;
  useSyncExternalStore(controller.subscribe, controller.snapshot, () => 0);
  const invalidateConsentFields = useCallback(
    async (permission: WellnessPermission) => {
      if (!ownerId) return;
      await controller.setOwner(ownerId);
      if (controller.ownerId !== ownerId) return;
      broadcast({ type: "consent", ownerId, ...permission });
      await controller.setWellnessPermission(permission);
    },
    [controller, ownerId, broadcast],
  );
  return {
    error: controller.error,
    discardJournalDrafts: (entryId: string) =>
      ownerId ? controller.discardEntity(ownerId, "journal-edit", entryId) : Promise.resolve(),
    purgeAccountDrafts,
    invalidateConsentFields,
  };
}
