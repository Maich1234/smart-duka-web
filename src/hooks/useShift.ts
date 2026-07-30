import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveShift } from '@/services/shifts';
import { useAuthStore } from '@/store/authStore';

export const ACTIVE_SHIFT_QUERY_KEY = ['activeShift'] as const;

/**
 * Whether the shop enforces shifts, and whether this person has one open.
 *
 * `enabled` comes from the endpoint's own field, deliberately **not** from
 * `useShop().shiftManagementEnabled`. The difference matters: this value
 * decides whether the till is locked, and it defaults to false while loading
 * *and* on error. A deployed backend has previously been missing this route
 * entirely, and the till staying open when we can't tell is far better than a
 * shop that can't sell because one endpoint 404s.
 *
 * The same reasoning is why `retry: false` — a locked till is not worth
 * three round trips of waiting for.
 */
export const useShift = () => {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ACTIVE_SHIFT_QUERY_KEY,
    queryFn: getActiveShift,
    enabled: !!user,
    staleTime: 30_000,
    retry: false,
  });

  return {
    /** False while loading and on any error — never lock on missing data. */
    enabled: query.data?.enabled ?? false,
    shift: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

/** Invalidate after start/end so every gate and banner updates together. */
export const useInvalidateShift = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ACTIVE_SHIFT_QUERY_KEY });
};
