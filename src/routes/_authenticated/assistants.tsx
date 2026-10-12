import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { useAssistantSession } from "@/hooks/useAssistantSession";
import {
  fetchAssistantAccess,
  linkAssistantIdentity,
  unlinkAssistantIdentity,
  revokeAssistantGrant,
} from "@/lib/assistant.functions";

export const Route = createFileRoute("/_authenticated/assistants")({
  head: () => ({ meta: [{ title: "Connected assistants — Pattern" }] }),
  component: AssistantsPage,
});
const names: Record<string, string> = {
  today: "Today and timing",
  pattern: "Pattern and chapters",
  journal: "Journal",
};
export function AssistantsPage() {
  const { user } = Route.useRouteContext();
  const access = useQuery({
    queryKey: ["assistant-access", user.userId],
    queryFn: () => fetchAssistantAccess(),
  });
  const { session, loading, error: sessionError } = useAssistantSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await access.refetch();
      setMessage(success);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "The change could not be saved. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const authLink = (
    <Button asChild variant="outline" className="min-h-11">
      <Link to="/assistant-auth" search={{ next: "/assistants", recovery: false }}>
        {session ? "Change assistant sign-in" : "Sign in for assistants"}
      </Link>
    </Button>
  );
  return (
    <Shell>
      <div className="max-w-2xl">
        <p className="technical text-muted-foreground">Your account</p>
        <h1 className="mt-3 text-3xl">Connected assistants</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Let an assistant read selected saved content from Pattern. You choose the areas for each
          assistant, and can stop access here at any time.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        )}
        {access.isPending ? (
          <p role="status" className="mt-6">
            Loading connections…
          </p>
        ) : access.error ? (
          <div role="alert" className="mt-6">
            <p>Connections could not load.</p>
            <Button variant="outline" className="mt-3 min-h-11" onClick={() => access.refetch()}>
              Retry connections
            </Button>
          </div>
        ) : (
          <>
            {!access.data.enabled && (
              <p role="status" className="mt-6 border border-rule p-4 text-sm">
                Assistant connections are not available yet. You can still remove an existing link
                or revoke access.
              </p>
            )}
            <section
              aria-labelledby="assistant-identity"
              className="mt-8 border-y border-rule py-6"
            >
              <h2 id="assistant-identity" className="text-xl">
                Your assistant sign-in
              </h2>
              {access.data.link ? (
                <>
                  <p className="mt-3 break-words text-sm">
                    Linked to {access.data.link.email ?? "your confirmed assistant account"}.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Unlinking immediately removes every assistant’s access. You can do this even if
                    you lose access to that sign-in.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 min-h-11"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () =>
                          unlinkAssistantIdentity({
                            data: session ? { accessToken: session.access_token } : {},
                          }),
                        "Assistant sign-in unlinked. All assistant access has stopped.",
                      )
                    }
                  >
                    Unlink and stop all access
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-muted-foreground">
                    First, sign in to an assistant account, then link it to this Pattern account.
                    Confirm its email address or use Google. Linking alone shares nothing.
                  </p>
                  {loading ? (
                    <p role="status" className="mt-4 text-sm">
                      Checking assistant sign-in…
                    </p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {sessionError && (
                        <p role="alert" className="text-sm">
                          {sessionError}
                        </p>
                      )}
                      {session && (
                        <p className="break-words text-sm">
                          Assistant account: {session.user.email}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {authLink}
                        {session && (
                          <Button
                            className="min-h-11"
                            disabled={busy || !access.data.enabled}
                            onClick={() =>
                              act(
                                () =>
                                  linkAssistantIdentity({
                                    data: { accessToken: session.access_token },
                                  }),
                                "Sign-in linked. Connect from your assistant to choose what to share.",
                              )
                            }
                          >
                            Link this assistant account
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
            <section aria-labelledby="assistant-grants" className="mt-8">
              <h2 id="assistant-grants" className="text-xl">
                Assistants with access
              </h2>
              {!access.data.grants.length && (
                <p className="mt-3 text-sm text-muted-foreground">
                  No assistants have access. After linking your sign-in, add Pattern in your
                  assistant and approve the areas it can read.
                </p>
              )}
              <ul className="mt-4 space-y-4">
                {access.data.grants.map((grant) => (
                  <li
                    key={grant.clientId}
                    className="flex flex-wrap items-start justify-between gap-4 border border-rule bg-card p-4"
                  >
                    <div className="min-w-0">
                      <h3 className="break-words font-medium">
                        {grant.clientName || "Unnamed assistant"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {grant.scopes.map((s) => names[s]).join(" · ")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={busy}
                      onClick={() =>
                        act(
                          () =>
                            revokeAssistantGrant({
                              data: {
                                clientId: grant.clientId,
                                ...(session ? { accessToken: session.access_token } : {}),
                              },
                            }),
                          "Access revoked. This assistant can no longer read Pattern.",
                        )
                      }
                    >
                      Revoke access
                      <span className="sr-only"> for {grant.clientName || "this assistant"}</span>
                    </Button>
                  </li>
                ))}
              </ul>
              {access.data.enabled && access.data.link && (
                <div className="mt-6 text-sm">
                  <p className="text-muted-foreground">For assistants that ask for a server URL:</p>
                  <code className="mt-2 block break-all rounded-sm border border-rule bg-card p-3">
                    {typeof window !== "undefined" ? `${window.location.origin}/mcp` : "/mcp"}
                  </code>
                </div>
              )}
            </section>
          </>
        )}
        <p className="mt-8 text-sm text-muted-foreground">
          Assistant access is read-only.{" "}
          <Link to="/privacy" className="underline underline-offset-4">
            Learn what is shared
          </Link>
          .
        </p>
      </div>
    </Shell>
  );
}
