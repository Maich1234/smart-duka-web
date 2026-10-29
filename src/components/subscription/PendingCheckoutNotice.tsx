'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { usePendingSubscriptionCheckout } from '@/hooks/usePendingSubscriptionCheckout';
import { rememberServerCheckout, type CheckoutProvider } from '@/lib/pendingSubscriptionCheckout';
import { getUnfinishedSubscriptionCheckout } from '@/services/subscription';

export default function PendingCheckoutNotice({ onResume }: { onResume: (provider: CheckoutProvider) => void }) {
  const { scope, pending, error } = usePendingSubscriptionCheckout();
  const query = useQuery({
    queryKey: ['unfinished-subscription-checkout', scope],
    enabled: !!scope,
    queryFn: getUnfinishedSubscriptionCheckout,
    staleTime: 0,
    retry: false,
  });
  useEffect(() => {
    // Cached recovery data may describe an attempt that has since completed.
    // Only adopt a successful lookup completed during this mount.
    if (!query.isFetchedAfterMount || query.isFetching || query.isError) return;
    const checkout = query.data?.data.checkout;
    if (checkout && scope) {
      try { rememberServerCheckout(scope, checkout); } catch { /* Show the storage error below. */ }
    }
  }, [query.data, query.isFetchedAfterMount, query.isFetching, query.isError, scope]);
  if (error) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">{error}</div>;
  if (pending) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" role="status">
    <p className="text-sm text-amber-900">You have an unfinished {pending.provider === 'bank' ? 'bank' : 'M-Pesa'} payment. Check it before starting another.</p>
    <Button type="button" onClick={() => onResume(pending.provider)} className="mt-3">Continue payment check</Button>
  </div>;
  if (query.isError) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
    <p>We could not check your previous payment.</p>
    <button type="button" onClick={() => { query.refetch(); }} className="mt-2 font-semibold underline">Check again</button>
  </div>;
  return null;
}
