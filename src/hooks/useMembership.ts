import { useQuery } from "@tanstack/react-query";
import { fetchMembership } from "@/lib/billing.functions";
import { useAuth } from "./useAuth";

export function useMembership() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["membership", session?.userId],
    queryFn: () => fetchMembership(),
    enabled: Boolean(session),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
  });
}
