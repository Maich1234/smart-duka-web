'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { getSubscriptionPaymentHistory, recheckSubscriptionPayment } from '@/services/subscription';

const statuses = {
  success: ['Paid', 'bg-teal-50 text-teal-900'],
  pending: ['Pending', 'bg-slate-100 text-slate-700'],
  failed: ['Failed', 'bg-red-50 text-red-800'],
  cancelled: ['Cancelled', 'bg-slate-100 text-slate-700'],
  timeout: ['Unconfirmed', 'bg-amber-50 text-amber-900'],
  review: ['Under review', 'bg-amber-50 text-amber-900'],
};
const methods = { mpesa: 'M-Pesa', card: 'Card', airtel: 'Airtel Money', bank: 'Paystack', free: 'Discount' };

export default function SubscriptionPaymentHistory() {
  const client = useQueryClient();
  const list = useRef<HTMLUListElement>(null);
  const [focusPaymentId, setFocusPaymentId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!focusPaymentId) return;
    const row = list.current?.querySelector<HTMLElement>('[data-payment-id="' + CSS.escape(focusPaymentId) + '"]');
    row?.focus();
    setFocusPaymentId(null);
  }, [focusPaymentId]);

  const loadOlderPayments = async () => {
    if (query.isFetching) return;
    const result = await query.fetchNextPage({ cancelRefetch: false });
    if (!result.isFetchNextPageError && (result.data?.pages.length ?? 0) > (query.data?.pages.length ?? 0)) {
      setFocusPaymentId(result.data?.pages.at(-1)?.items[0]?.paymentId ?? null);
    }
  };

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="subscription-payment-history">
      <h2 id="subscription-payment-history" className="text-xl font-semibold tracking-tight text-slate-950">Payment history</h2>
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
        <ul ref={list} className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
          {payments.map((payment) => {
            const [status, tone] = statuses[payment.status] ?? statuses.pending;
            return (
              <li key={payment.paymentId} data-payment-id={payment.paymentId} tabIndex={-1} className="grid scroll-mt-20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 gap-x-5 gap-y-2 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{methods[payment.provider] ?? 'Payment'} · {new Date(payment.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                  <p className="mt-1 break-all text-xs text-slate-600">Payment ID {payment.paymentId}</p>
                  {payment.reference !== payment.paymentId && <p className="mt-1 break-all text-xs text-slate-600">Reference {payment.reference}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end sm:self-center">
                  <span className="font-medium tabular-nums text-slate-950">{payment.currency} {payment.amount.toLocaleString('en-KE')}</span>
                  <span className={'rounded-md px-2 py-1 text-xs font-semibold ' + tone}>{status}</span>
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
      {payments.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600" role="status">
            {payments.length} {payments.length === 1 ? 'payment' : 'payments'} shown
            {query.hasNextPage ? '' : ' · End of history'}
          </p>
          {query.isFetchNextPageError && <p className="text-sm text-red-700" role="alert">Couldn’t load older payments.</p>}
          {query.hasNextPage && (
            <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto"
              aria-disabled={query.isFetching} onClick={() => { void loadOlderPayments(); }}>
              {query.isFetchingNextPage ? 'Loading older payments…' : query.isFetchNextPageError ? 'Retry older payments' : 'Load older payments'}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
