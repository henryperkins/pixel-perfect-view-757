import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** This session never substitutes for Pattern's HttpOnly member cookie. */
export function useAssistantSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, value) => {
        if (!alive) return;
        setSession(value);
        setLoading(false);
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (!alive) return;
          setSession(data.session);
          setError(error ? "Assistant sign-in could not be loaded. Please sign in again." : "");
          setLoading(false);
        })
        .catch(() => {
          if (alive) {
            setError("Assistant sign-in is unavailable.");
            setLoading(false);
          }
        });
    } catch {
      setError("Assistant sign-in is not configured yet.");
      setLoading(false);
    }
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);
  return { session, loading, error, recovery };
}
