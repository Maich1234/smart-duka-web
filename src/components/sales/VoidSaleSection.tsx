'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useMoney } from '@/lib/money';

export interface VoidableSale {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  status?: 'completed' | 'voided' | 'refund_pending' | 'refunded';
  voidedAt?: string;
  voidReason?: string;
}



/**
 * Void action for a sale detail modal, alongside RefundSaleSection.
 *
 * Void and refund are not the same thing and the difference matters at the
 * counter: voiding cancels a sale that shouldn't have been recorded at all —
 * a mis-scan, a customer who changed their mind before paying — and no money
 * moves. A refund gives money back on a sale that really happened. Both
 * restore stock, but only one of them is an admission that cash left the till.
 *
 * The server only allows voiding a sale still in 'completed' status, so this
 * renders nothing once a refund is in progress or done.
 */
export default function VoidSaleSection({
  sale,
  canVoid,
  onDone,
}: {
  sale: VoidableSale;
  canVoid: boolean;
  onDone?: () => void;
}) {
  const fmt = useMoney();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const status = sale.status ?? 'completed';

  const voidMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/sales/${sale._id}/void`, reason.trim() ? { reason: reason.trim() } : {});
      return res.data as { message?: string };
    },
    onSuccess: () => {
      setDone(true);
      setConfirming(false);
      // Same set RefundSaleSection invalidates — a void moves revenue totals
      // and stock exactly as a refund does.
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-sales'] });
      queryClient.invalidateQueries({ queryKey: ['products-sale'] });
      onDone?.();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Could not void the sale. Try again.');
    },
  });

  if (done || status === 'voided') {
    return (
      <div className="p-3 rounded-xl border flex items-start gap-2" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
        <p className="text-xs font-medium text-gray-600">
          Voided
          {sale.voidedAt ? ` on ${new Date(sale.voidedAt).toLocaleDateString()}` : ''} — stock restored.
          {sale.voidReason ? ` ${sale.voidReason}` : ''}
        </p>
      </div>
    );
  }

  // Refunded or mid-refund sales can't be voided, and someone without the
  // permission shouldn't see a button that will only 403.
  if (status !== 'completed' || !canVoid) return null;

  return (
    <div className="space-y-2">
      {!confirming ? (
        <button
          onClick={() => { setError(''); setConfirming(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
        >
          <Ban className="w-4 h-4" /> Void Sale
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
            Void #{sale.invoiceNumber} for {fmt(sale.totalAmount)}?
          </p>
          <p className="text-xs text-gray-500">
            Use this for a sale that shouldn&apos;t have been recorded. It comes out of your revenue
            totals and the stock goes back. If the customer paid and wants their money back, refund
            it instead. This cannot be undone.
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Reason (optional)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-100"
          />

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">{error}</div>
          )}

          <button
            onClick={() => { setError(''); voidMutation.mutate(); }}
            disabled={voidMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all"
            style={{ backgroundColor: '#475569' }}
          >
            <Ban className="w-4 h-4" />
            {voidMutation.isPending ? 'Voiding…' : 'Confirm void'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={voidMutation.isPending}
            className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Keep sale
          </button>
        </div>
      )}
    </div>
  );
}
