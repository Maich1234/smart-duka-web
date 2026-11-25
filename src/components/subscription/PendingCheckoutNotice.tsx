'use client';

import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { usePendingSubscriptionCheckout } from '@/hooks/usePendingSubscriptionCheckout';
import { recordCheckoutStatus, rememberServerCheckout, type CheckoutProvider } from '@/lib/pendingSubscriptionCheckout';
import { getSubscriptionPaymentStatus, getUnfinishedSubscriptionCheckout, recheckSubscriptionPayment } from '@/services/subscription';

export default function PendingCheckoutNotice({ onResume }: { onResume: (provider: CheckoutProvider) => void }) {
  const { scope, pending, error } = usePendingSubscriptionCheckout();
  const query = useQuery({
    queryKey: ['unfinished-subscription-checkout', scope],
    enabled: !!scope,
    queryFn: getUnfinishedSubscriptionCheckout,
    staleTime: 0,
    retry: false,
    refetchInterval: pending ? 30_000 : false,
  });
  const paymentId = pending?.paymentId;
  useQuery({
    queryKey: ['pending-subscription-payment-status', scope, paymentId],
    enabled: Boolean(scope && paymentId),
    queryFn: () => getSubscriptionPaymentStatus(paymentId!),
    refetchInterval: 10_000,
    retry: false,
  });

  const olderPayment = query.data?.data.olderPayment;
  const recheck = useMutation({
    mutationFn: recheckSubscriptionPayment,
    onSuccess: () => { void query.refetch(); },
  });
  useEffect(() => {
    // Cached recovery data may describe an attempt that has since completed.
    // Only adopt a successful lookup completed during this mount.
    if (!query.isFetchedAfterMount || query.isFetching || query.isError) return;
    const checkout = query.data?.data.checkout;
    if (scope && olderPayment?.checkoutReleased) {
      try { recordCheckoutStatus(scope, olderPayment.paymentId, 'expired'); } catch { /* Storage errors appear in the notice. */ }
    }
    if (checkout && scope) {
      try { rememberServerCheckout(scope, checkout); } catch { /* Show the storage error below. */ }
    }
  }, [query.data, query.isFetchedAfterMount, query.isFetching, query.isError, scope, olderPayment]);
  if (error) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">{error}</div>;
  if (pending) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" role="status">
    <p className="text-sm font-semibold text-amber-900">Your {pending.provider === 'bank' ? 'Paystack' : 'M-Pesa'} payment is still being checked.</p>
    <p className="mt-1 text-sm text-amber-900">You can leave this page. If the payment fails or the checkout window expires, you can try again here.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {paymentId && <Button type="button" loading={recheck.isPending} onClick={() => recheck.mutate(paymentId)}>Check payment now</Button>}
      <Button type="button" variant={paymentId ? 'outline' : undefined} onClick={() => onResume(pending.provider)}>View payment status</Button>
    </div>
    {recheck.isError && <p className="mt-2 text-sm" role="alert">Could not check the payment. Try again.</p>}
  </div>;
  if (query.isError) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
    <p>We could not check your previous payment.</p>
    <button type="button" onClick={() => { query.refetch(); }} className="mt-2 font-semibold underline">Check again</button>
  </div>;
  if (olderPayment || recheck.data) {
    const checked = recheck.data?.data;
    const result = checked?.paymentId === olderPayment?.paymentId || !olderPayment ? checked : undefined;
    const reference = olderPayment?.reference ?? result?.receipt ?? result?.paymentId;
    const extraPayment = !!(olderPayment?.duplicateOf || result?.duplicateOf);
    const showCheck = olderPayment?.checkoutReleased && (!result || result.checkoutReleased);
    const message = extraPayment
      ? 'An extra payment was received and flagged for review. Your subscription was applied once.'
      : result?.status === 'success'
        ? 'Your previous payment was confirmed. Check your subscription before paying again.'
        : result?.errorMessage ?? olderPayment?.errorMessage ?? 'Your previous payment is no longer pending.';
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
      <p>{message}</p>
      {reference && <p className="mt-1 break-all">Payment reference {reference}</p>}
      {showCheck && <Button type="button" loading={recheck.isPending} onClick={() => recheck.mutate(olderPayment.paymentId)} className="mt-3">Check previous payment</Button>}
      {recheck.isError && <p className="mt-2" role="alert">Could not check the payment. Try again.</p>}
    </div>;
  }
  return null;
}
