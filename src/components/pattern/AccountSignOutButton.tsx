import { useState } from "react";
import { signOut } from "@/lib/auth.shared";
import { Button } from "@/components/ui/button";
import { useMemberDraftLifecycle } from "./MemberDraftProvider";

export function AccountSignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const { purgeAccountDrafts } = useMemberDraftLifecycle();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  async function leaveAccount() {
    setLeaving(true);
    setError("");
    try {
      await signOut();
      try {
        await purgeAccountDrafts();
      } catch {
        // The root retries local cleanup after redirect.
      }
      window.location.replace("/auth");
    } catch {
      setError("Sign-out could not complete. Please try again.");
      setLeaving(false);
    }
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        disabled={leaving}
        onClick={() => void leaveAccount()}
        className="min-h-11 text-muted-foreground"
      >
        {leaving ? "Signing out…" : label}
      </Button>
      {error ? <p role="alert" className="max-w-xs text-sm text-destructive">{error}</p> : null}
    </div>
  );
}