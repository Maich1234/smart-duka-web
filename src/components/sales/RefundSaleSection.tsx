'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Smartphone, Banknote, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export interface RefundInfo {
  amount?: number;
  method?: 'cash' | 'mpesa';
  reason?: string;
  requestedAt?: string;
  completedAt?: string;
  failureReason?: string;
}

export interface RefundableSale {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'mpesa' | 'card';
  status?: 'completed' | 'voided' | 'refund_pending' | 'refunded';
  refund?: RefundInfo;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);

/**
 * Status banner + refund action for a sale detail modal.
 * Renders nothing when the viewer can't refund and there is no status to show.
 * M-Pesa sales are refunded through Safaricom's reversal API (async — the sale
 * shows "refund in progress" until the callback settles it); any sale can also
 * be refunded in cash over the counter.
 */
export default function RefundSaleSection({ sale, canRefund, onDone }: {
  sale: RefundableSale;
  canRefund: boolean;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const status = sale.status ?? 'completed';

  // Whether the shop has the Daraja initiator credentials needed for reversals
  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => { const res = await api.get('/payment-config/status'); return res.data.data?.mpesa; },
    enabled: canRefund && sale.paymentMethod === 'mpesa' && status === 'completed',
  });
  const mpesaRefundsReady = paymentStatus?.refundsConfigured ?? false;

  const refundMutation = useMutation({
    mutationFn: async (method?: 'cash') => {
      const res = await api.post(`/sales/${sale._id}/refund`, {
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        ...(method ? { method } : {}),
      });
      return res.data as { message?: string };
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message ?? 'Refund processed.');
      setConfirming(false);
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-sales'] });
      queryClient.invalidateQueries({ queryKey: ['products-sale'] });
      onDone?.();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Refund failed. Try again.');
    },
  });

  if (successMessage) {
    return (
      <div className="p-3 rounded-xl border flex items-start gap-2" style={{ backgroundColor: '#F0FDF4', borderColor: 'rgba(21,128,61,0.25)' }}>
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#15803D' }} />
        <p className="text-xs font-medium" style={{ color: '#15803D' }}>{successMessage}</p>
      </div>
    );
  }

  if (status === 'refunded') {
    return (
      <div className="p-3 rounded-xl border flex items-start gap-2" style={{ backgroundColor: '#F0FDF4', borderColor: 'rgba(21,128,61,0.25)' }}>
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#15803D' }} />
        <p className="text-xs font-medium" style={{ color: '#15803D' }}>
          Refunded {sale.refund?.method === 'mpesa' ? 'via M-Pesa' : 'in cash'}
          {sale.refund?.completedAt ? ` on ${new Date(sale.refund.completedAt).toLocaleDateString()}` : ''} — stock restored.
        </p>
      </div>
    );
  }

  if (status === 'refund_pending') {
    return (
      <div className="p-3 rounded-xl border flex items-start gap-2 bg-amber-50 border-amber-200">
        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <p className="text-xs font-medium text-amber-700">
          M-Pesa is returning {fmt(sale.refund?.amount ?? sale.totalAmount)} to the customer. Stock is restored once the refund completes.
        </p>
      </div>
    );
  }

  if (status === 'voided' || !canRefund) return null;

  return (
    <div className="space-y-2">
      {sale.refund?.failureReason && (
        <div className="p-3 rounded-xl border flex items-start gap-2 bg-red-50 border-red-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <p className="text-xs font-medium text-red-600">Last refund attempt failed: {sale.refund.failureReason}</p>
        </div>
      )}

      {!confirming ? (
        <button onClick={() => { setError(''); setConfirming(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 border-rose-200 text-rose-600 hover:bg-rose-50 transition-all">
          <RotateCcw className="w-4 h-4" /> Refund Sale
        </button>
      ) : (
        <div className="rounded-xl border border-rose-200 p-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
            Refund {fmt(sale.totalAmount)} for #{sale.invoiceNumber}?
          </p>
          <p className="text-xs text-gray-500">
            The sale is removed from your revenue totals and its stock is restored. This cannot be undone.
          </p>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
            placeholder="Reason (optional)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-rose-100" />

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{error}</div>
          )}

          {sale.paymentMethod === 'mpesa' ? (
            <div className="space-y-2">
              <button onClick={() => { setError(''); refundMutation.mutate(undefined); }}
                disabled={refundMutation.isPending || !mpesaRefundsReady}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#E11D48' }}>
                <Smartphone className="w-4 h-4" />
                {refundMutation.isPending ? 'Processing…' : 'Send back via M-Pesa'}
              </button>
              {!mpesaRefundsReady && (
                <p className="text-xs text-amber-600">
                  M-Pesa refunds need the Initiator credentials from the Daraja portal (set them in the app under Profile → Payments). You can still refund in cash.
                </p>
              )}
              <button onClick={() => { setError(''); refundMutation.mutate('cash'); }} disabled={refundMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-all">
                <Banknote className="w-4 h-4" /> Refund in cash instead
              </button>
            </div>
          ) : (
            <button onClick={() => { setError(''); refundMutation.mutate('cash'); }} disabled={refundMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all"
              style={{ backgroundColor: '#E11D48' }}>
              <Banknote className="w-4 h-4" />
              {refundMutation.isPending ? 'Processing…' : 'Confirm cash refund'}
            </button>
          )}

          <button onClick={() => setConfirming(false)} disabled={refundMutation.isPending}
            className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            Keep sale
          </button>
        </div>
      )}
    </div>
  );
}

/** Small status chip for sales lists/tables. Renders nothing for completed sales. */
export function SaleStatusBadge({ status }: { status?: string }) {
  if (!status || status === 'completed') return null;
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    voided: { bg: '#F1F5F9', color: '#64748B', label: 'Voided' },
    refunded: { bg: '#FFF1F2', color: '#E11D48', label: 'Refunded' },
    refund_pending: { bg: '#FFFBEB', color: '#B45309', label: 'Refund pending' },
  };
  const s = styles[status];
  if (!s) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}
