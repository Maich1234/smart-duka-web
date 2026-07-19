import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMySubscription } from '@/services/subscription';
import { useAuthStore } from '@/store/authStore';

/**
 * The shop's subscription + derived access state (trialing/active/grace/
 * locked) — drives the trial banner and the paywall lock. `access` stays
 * undefined while loading so callers never lock on missing data.
 */
export const useSubscription = () => {
  const user = useAuthStore((s) => s.user);
  const query = useQuery({
    queryKey: ['subscription'],
    queryFn: getMySubscription,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const subscription = query.data?.data?.subscription ?? null;
  const plan = subscription?.plan && typeof subscription.plan === 'object' ? subscription.plan : null;

  return {
    subscription,
    /** The populated plan doc (chatLimits, features, pricing, ...) — null while loading or if plan is unpopulated. */
    plan,
    access: query.data?.data?.access,
    renewal: query.data?.data?.renewal ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

/** Invalidate after trial activation / payment / cancellation so the banner and lock update. */
export const useInvalidateSubscription = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['subscription'] });
};
