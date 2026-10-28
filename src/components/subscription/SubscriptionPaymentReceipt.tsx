'use client';

import { useQuery } from '@tanstack/react-query';
import DocumentPrinter from '@/components/documents/DocumentPrinter';
import Button from '@/components/ui/Button';
import { getSubscriptionPaymentStatus } from '@/services/subscription';

/** Mounted only after server-confirmed success. Read the settled amount rather
 * than presenting the checkout estimate as the amount actually paid. */
export default function SubscriptionPaymentReceipt({ paymentId, provider, onDone }: {
  paymentId: string | null;
  provider: 'M-Pesa' | 'Paystack';
  onDone: () => void;
}) {
  const query = useQuery({
    queryKey: ['subscription-payment-receipt', paymentId],
    enabled: !!paymentId,
    networkMode: 'always',
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await getSubscriptionPaymentStatus(paymentId!);
      if (result.data.status !== 'success') throw new Error('The payment receipt is not ready yet. Please check again.');
      return result.data;
    },
  });
  const payment = query.data;
  const amount = payment ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: payment.currency }).format(payment.amount) : undefined;
  return <div>
    <p className="mb-5 text-center text-sm text-slate-600" role="status">Your subscription payment was confirmed.</p>
    <DocumentPrinter kind="receipt" state={!paymentId || query.isError ? 'error' : query.isPending ? 'loading' : 'ready'}
      shopName="DuQana subscription" total={amount}
      error={!paymentId ? 'Receipt details are unavailable. You can still continue to your subscription.' : query.error?.message}
      onRetry={paymentId ? () => { query.refetch(); } : undefined}>
      {payment && <>
        <header className="mb-5 text-center"><p className="text-[10px] tracking-widest text-slate-500">SUBSCRIPTION</p><h2 className="mt-1 text-base font-bold">{payment.amount === 0 ? 'No payment required' : 'Payment received'}</h2></header>
        <dl className="space-y-3 border-y border-dashed border-slate-300 py-5">
          <div className="flex justify-between gap-4"><dt>{payment.amount === 0 ? 'Covered by' : 'Paid via'}</dt><dd className="text-right">{payment.amount === 0 ? 'Subscription discount' : provider}</dd></div>
          <div className="flex justify-between gap-4"><dt>Reference</dt><dd className="min-w-0 text-right">{payment.receipt || payment.paymentId}</dd></div>
          {payment.periodEnd && <div className="flex justify-between gap-4"><dt>Period ends</dt><dd className="text-right">{new Date(payment.periodEnd).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</dd></div>}
        </dl>
        <div className="flex flex-wrap justify-between gap-3 pt-5 text-base font-bold"><span>Total paid</span><span>{amount}</span></div>
        <p className="mt-6 text-center text-xs text-slate-500">Thank you for choosing DuQana.</p>
      </>}
    </DocumentPrinter>
    <Button onClick={onDone} className="mt-7 w-full">Done</Button>
  </div>;
}
