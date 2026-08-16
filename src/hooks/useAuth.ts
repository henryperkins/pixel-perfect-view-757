import { useCallback, useEffect, useState } from "react";

import { currentSession, type SessionShape } from "@/lib/auth.client";

export function useAuth() {
  const [session, setSession] = useState<SessionShape>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { session: next } = await currentSession();
      setSession(next);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { session, user: session, loading, refresh };
}
