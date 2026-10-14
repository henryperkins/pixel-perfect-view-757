import { useCallback, useContext, useState } from "react";
import { QueryClient, QueryClientContext, useQuery } from "@tanstack/react-query";
import { currentSession } from "@/lib/auth.shared";
export function useAuth() {
  const inherited = useContext(QueryClientContext);
  const [standalone] = useState(() => inherited ?? new QueryClient());
  const query = useQuery(
    {
      queryKey: ["session"],
      queryFn: () => currentSession(),
      retry: false,
      staleTime: 15000,
      refetchOnWindowFocus: "always",
    },
    inherited ?? standalone,
  );
  const session = query.data?.session ?? null;
  const status = query.isPending
    ? "loading"
    : query.isError
      ? "unavailable"
      : session
        ? "authenticated"
        : "anonymous";
  const { refetch } = query;
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  return {
    session,
    user: session,
    isAdmin: session?.isAdmin ?? false,
    loading: query.isPending,
    status,
    refresh,
  };
}
