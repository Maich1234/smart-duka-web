'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type AccessState = 'none' | 'trialing' | 'active' | 'grace' | 'locked';
type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

interface Payment {
  _id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider: string;
  receipt: string | null;
  periodEnd: string | null;
  errorMessage: string | null;
  createdAt: string;
  plan: { name: string } | null;
}

interface SubscriptionDetail {
  shop: { _id: string; name: string; email: string };
  subscription: { status: string; currentPeriodEnd: string | null; trialEnd: string | null } | null;
  access: { state: AccessState; daysLeft: number; graceDaysLeft: number };
  payments: Payment[];
}

const ACCESS_COLOR: Record<AccessState, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  none: 'gray',
  trialing: 'blue',
  active: 'green',
  grace: 'yellow',
  locked: 'red',
};

const STATUS_COLOR: Record<PaymentStatus, 'gray' | 'green' | 'red' | 'yellow'> = {
  pending: 'yellow',
  success: 'green',
  failed: 'red',
  cancelled: 'gray',
  timeout: 'gray',
};

/** A payment stuck exactly the way the "paid but locked out" bug produces it: marked success, but the subscription was never actually activated. */
const isStuck = (p: Payment) => p.status === 'success' && !p.periodEnd;

export default function ShopSubscriptionModal({ shopId, onClose }: { shopId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reconcileError, setReconcileError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'shopSubscription', shopId],
    queryFn: async () => (await adminApi.get(`/shops/${shopId}/subscription`)).data.data as SubscriptionDetail,
    enabled: Boolean(shopId),
  });

  const reconcileMutation = useMutation({
    mutationFn: (paymentId: string) => adminApi.post(`/subscriptions/payments/${paymentId}/reconcile`),
    onSuccess: () => {
      setReconcileError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'shopSubscription', shopId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setReconcileError(e.response?.data?.message || 'Failed to reconcile payment');
    },
  });

  return (
    <Modal isOpen={Boolean(shopId)} onClose={onClose} title={data?.shop.name ?? 'Shop subscription'} size="lg">
      {isLoading || !data ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0F766E] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{data.shop.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                {data.subscription?.currentPeriodEnd
                  ? `Paid through ${format(new Date(data.subscription.currentPeriodEnd), 'MMM d, yyyy')}`
                  : data.subscription?.trialEnd
                  ? `Trial ends ${format(new Date(data.subscription.trialEnd), 'MMM d, yyyy')}`
                  : 'No subscription yet'}
              </p>
            </div>
            <Badge color={ACCESS_COLOR[data.access.state]}>{data.access.state}</Badge>
          </div>

          {reconcileError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{reconcileError}</p>
          )}

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent payments</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100" style={{ backgroundColor: '#F8FAFC' }}>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Receipt</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {data.payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No payments yet</td>
                    </tr>
                  ) : (
                    data.payments.map((p) => (
                      <tr key={p._id} className={isStuck(p) ? 'bg-amber-50/60' : undefined}>
                        <td className="px-4 py-2 text-gray-700">{format(new Date(p.createdAt), 'MMM d, HH:mm')}</td>
                        <td className="px-4 py-2 text-gray-700">{p.currency} {p.amount.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <Badge color={STATUS_COLOR[p.status]}>{p.status}</Badge>
                          {isStuck(p) && (
                            <span className="block text-[11px] text-amber-700 mt-1">success but never activated</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{p.receipt ?? '—'}</td>
                        <td className="px-4 py-2 text-right">
                          {!p.periodEnd && p.status !== 'cancelled' && p.status !== 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              loading={reconcileMutation.isPending && reconcileMutation.variables === p._id}
                              onClick={() => reconcileMutation.mutate(p._id)}
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reconcile
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
