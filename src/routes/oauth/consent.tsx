import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/pattern/Shell";
import { Button } from "@/components/ui/button";
import { useAssistantSession } from "@/hooks/useAssistantSession";
import {
  fetchAssistantAuthorization,
  decideAssistantAuthorization,
} from "@/lib/assistant.functions";
import type { AssistantScope } from "@/lib/assistant.server";

export const Route = createFileRoute("/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search["authorization_id"] === "string" &&
      /^[a-zA-Z0-9_-]{1,200}$/.test(search["authorization_id"])
        ? search["authorization_id"]
        : "",
  }),
  head: () => ({
    meta: [{ title: "Connect an assistant — Pattern" }, { name: "robots", content: "noindex" }],
  }),
  component: ConsentPage,
});
const areas: { id: AssistantScope; title: string; description: string }[] = [
  {
    id: "today",
    title: "Today and timing",
    description:
      "Saved chart-only readings and timing windows. Readings framed by check-ins and older readings are withheld.",
  },
  {
    id: "pattern",
    title: "Pattern and chapters",
    description: "Your saved chart summary and chapters that have already been written.",
  },
  {
    id: "journal",
    title: "Journal",
    description:
      "Your written titles and entry text. This can include sensitive details you wrote yourself. Only turn this on if you want this assistant to receive them.",
  },
];
const identityPermissions: Record<string, string> = {
  openid: "An identity token confirming your assistant account",
  email: "Your email address and its verification status",
  profile: "Profile information, such as your name and picture",
  phone: "Your phone number and its verification status, if present",
  offline_access: "Keep the connection active by renewing access tokens until you revoke access",
};
export function ConsentPage() {
  const { authorization_id: authorizationId } = Route.useSearch();
  const { session, loading, error: sessionError } = useAssistantSession();
  const [scopes, setScopes] = useState<AssistantScope[]>(["today", "pattern"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const details = useQuery({
    queryKey: ["assistant-authorization", authorizationId, session?.user.id],
    queryFn: () =>
      fetchAssistantAuthorization({
        data: { accessToken: session!.access_token, authorizationId },
      }),
    enabled: Boolean(session && authorizationId),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const next = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
  async function decide(action: "approve" | "deny") {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const result = await decideAssistantAuthorization({
        data: {
          accessToken: session.access_token,
          authorizationId,
          scopes: action === "approve" ? scopes : [],
          action,
        },
      });
      window.location.assign(result.redirectUrl);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The request could not be completed. Connect again from your assistant.",
      );
      setBusy(false);
    }
  }
  return (
    <Shell signedIn={false}>
      <div className="mx-auto max-w-xl">
        <p className="technical text-muted-foreground">You choose what to share</p>
        <h1 className="mt-3 text-3xl">Connect an assistant</h1>
        {(error || sessionError) && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error || sessionError}
          </p>
        )}
        {!authorizationId ? (
          <p role="alert" className="mt-6">
            This connection link is missing or invalid. Start again from your assistant.
          </p>
        ) : loading ? (
          <p role="status" className="mt-6">
            Checking assistant sign-in…
          </p>
        ) : !session ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to the assistant account you linked inside Pattern to review this request.
            </p>
            <Button asChild className="min-h-11">
              <Link to="/assistant-auth" search={{ next, recovery: false }}>
                Sign in to review request
              </Link>
            </Button>
          </div>
        ) : details.isPending ? (
          <p role="status" className="mt-6">
            Loading the authorization request…
          </p>
        ) : details.error ? (
          <p role="alert" className="mt-6 text-sm">
            This request could not be verified. It may have expired or already been used. Start a
            new connection from your assistant.
          </p>
        ) : details.data.kind === "redirect" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm">
              This sign-in was already approved. Continuing uses only the permissions currently
              saved in Pattern; it does not restore revoked access or add new areas.
            </p>
            <p className="break-all text-sm text-muted-foreground">
              Return to {details.data.redirectOrigin}.
            </p>
            <Button asChild className="min-h-11">
              <a href={details.data.redirectUrl}>Return to assistant</a>
            </Button>
            <p className="text-sm text-muted-foreground">
              To change or restore access, clear this assistant’s remembered approval in Connected
              assistants, then start a new connection from your assistant.
            </p>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/assistants">Manage remembered approvals</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-5 break-words text-sm">
              <strong>{details.data.clientName}</strong> wants to read from your Pattern account.
            </p>
            <p className="mt-2 break-all text-xs text-muted-foreground">
              After your decision, return to {details.data.redirectOrigin}.
            </p>
            <p className="mt-2 break-words text-xs text-muted-foreground">
              Assistant sign-in: {details.data.email}
            </p>
            <section
              className="mt-6 border border-rule p-4 text-sm"
              aria-labelledby="identity-permissions"
            >
              <h2 id="identity-permissions" className="font-medium">
                Assistant sign-in information
              </h2>
              <p className="mt-2 text-muted-foreground">
                This connection also shares information from your separate assistant sign-in,
                including its account ID, email and any profile or phone information saved with it.
                The assistant requests these identity permissions:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {details.data.identityScopes.map((scope) => (
                  <li key={scope} className="break-words">
                    {identityPermissions[scope] ?? `Unsupported permission: ${scope}`}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-muted-foreground">
                The sign-in provider also lets a connected assistant edit profile information on
                this separate assistant account. Pattern content access remains read-only and
                limited to the areas you choose below.
              </p>
              <p className="mt-3 text-muted-foreground">
                These sign-in permissions are approved together. Deny the request if you do not want
                to share them. Choose your Pattern content separately below.
              </p>
              {details.data.unsupportedScopes.length > 0 && (
                <p role="alert" className="mt-3">
                  This request includes unsupported permissions and cannot be approved.
                </p>
              )}
            </section>
            {details.data.linked && !details.data.memberMatches && (
              <div className="mt-6 border border-rule p-4 text-sm">
                <p>
                  Sign in to the Pattern account linked to this assistant sign-in. Both sign-ins are
                  needed to approve access.
                </p>
                <Button asChild variant="outline" className="mt-4 min-h-11">
                  <Link to="/auth" search={{ next }}>
                    Sign in to Pattern to approve
                  </Link>
                </Button>
              </div>
            )}
            {!details.data.linked ? (
              <div className="mt-6 border border-rule p-4 text-sm">
                <p>
                  This assistant sign-in is not linked to a Pattern account. Deny this request, then
                  link it from Connected assistants before starting a new connection.
                </p>
                <Button variant="outline" asChild className="mt-4 min-h-11">
                  <Link to="/assistants">Open Connected assistants</Link>
                </Button>
              </div>
            ) : (
              <fieldset disabled={busy} className="mt-6 space-y-3">
                <legend className="mb-3 text-sm font-medium">Allow access to</legend>
                {areas.map((area) => (
                  <label
                    key={area.id}
                    className="flex cursor-pointer items-start gap-3 border border-rule bg-card p-4"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0 accent-primary"
                      checked={scopes.includes(area.id)}
                      onChange={(e) =>
                        setScopes((old) =>
                          e.target.checked ? [...old, area.id] : old.filter((s) => s !== area.id),
                        )
                      }
                      aria-describedby={`scope-${area.id}`}
                    />
                    <span>
                      <span className="font-medium">{area.title}</span>
                      <span
                        id={`scope-${area.id}`}
                        className="mt-1 block text-sm text-muted-foreground"
                      >
                        {area.description}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            <p className="mt-5 text-sm text-muted-foreground">
              These tools cannot change your Pattern data or generate readings. Structured birth
              details, coordinates and check-ins are excluded. Shared chart interpretations and
              journal text remain personal information. The assistant’s own privacy policy governs
              copies it receives.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Revoke access from Connected assistants at any time. Revoking stops future reads; it
              cannot recall copies already received.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="min-h-11"
                disabled={
                  busy ||
                  !details.data.linked ||
                  !details.data.memberMatches ||
                  !scopes.length ||
                  details.data.unsupportedScopes.length > 0
                }
                onClick={() => decide("approve")}
              >
                {busy ? "Saving decision…" : "Approve selected access"}
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={busy}
                onClick={() => decide("deny")}
              >
                Deny
              </Button>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
