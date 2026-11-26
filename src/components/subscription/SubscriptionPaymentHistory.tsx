'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { getSubscriptionPaymentHistory, recheckSubscriptionPayment } from '@/services/subscription';

const statuses = {
  success: ['Paid', 'text-teal-800'],
  pending: ['Pending', 'text-slate-700'],
  failed: ['Failed', 'text-red-700'],
  cancelled: ['Cancelled', 'text-slate-600'],
  timeout: ['Unconfirmed', 'text-amber-800'],
  review: ['Under review', 'text-amber-800'],
};
const methods = { mpesa: 'M-Pesa', card: 'Card', airtel: 'Airtel Money', bank: 'Paystack', free: 'Discount' };

export default function SubscriptionPaymentHistory() {
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['subscription-payment-history'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getSubscriptionPaymentHistory(pageParam),
    getNextPageParam: (page) => page.next ?? undefined,
    retry: false,
  });
  const recheck = useMutation({
    mutationFn: recheckSubscriptionPayment,
    onSuccess: async () => {
      await Promise.all([
        query.refetch(),
        client.invalidateQueries({ queryKey: ['subscription'] }),
        client.invalidateQueries({ queryKey: ['unfinished-subscription-checkout'] }),
      ]);
    },
  });
  const payments = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="subscription-payment-history">
      <h2 id="subscription-payment-history" className="text-lg font-semibold text-slate-950">Payment history</h2>
      <p className="mt-1 text-sm text-slate-600">Share the payment ID with support if you need help with a charge.</p>
      {query.isPending ? (
        <div className="mt-4 space-y-3" role="status">
          <span className="sr-only">Loading payment history</span>
          <div aria-hidden="true" className="h-12 rounded-lg bg-slate-100 motion-safe:animate-pulse" />
          <div aria-hidden="true" className="h-12 rounded-lg bg-slate-100 motion-safe:animate-pulse" />
        </div>
      ) : query.isError && !payments.length ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="text-sm text-slate-600">Couldn’t load payment history.</p>
          <Button size="sm" variant="outline" onClick={() => { void query.refetch(); }}>Retry</Button>
        </div>
      ) : payments.length ? (
        <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
          {payments.map((payment) => {
            const [status, tone] = statuses[payment.status] ?? statuses.pending;
            return (
              <li key={payment.paymentId} className="grid gap-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="font-medium text-slate-950">{methods[payment.provider] ?? 'Payment'} · {new Date(payment.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                  <p className="mt-1 break-all text-xs text-slate-600">Payment ID {payment.paymentId}</p>
                  {payment.reference !== payment.paymentId && <p className="mt-1 break-all text-xs text-slate-600">Reference {payment.reference}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">
                  <span className="font-medium tabular-nums text-slate-950">{payment.currency} {payment.amount.toLocaleString('en-KE')}</span>
                  <span className={'font-medium ' + tone}>{status}</span>
                  {['pending', 'timeout'].includes(payment.status) && (
                    <Button size="sm" type="button" variant="ghost" disabled={recheck.isPending} onClick={() => recheck.mutate(payment.paymentId)}>
                      {recheck.isPending && recheck.variables === payment.paymentId ? 'Checking…' : 'Check status'}
                    </Button>
                  )}
                </div>
                {recheck.variables === payment.paymentId && recheck.isError && <p role="alert" className="text-red-700">Couldn’t check this payment. Try again.</p>}
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-4 text-sm text-slate-600">No payment attempts yet.</p>}
      {query.hasNextPage && <Button variant="outline" size="sm" className="mt-4" loading={query.isFetchingNextPage} onClick={() => { void query.fetchNextPage(); }}>{query.isFetchNextPageError ? 'Retry loading more' : 'Load more'}</Button>}
    </section>
  );
}


  return res.data;
}
