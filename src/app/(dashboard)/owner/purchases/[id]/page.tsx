'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Building2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { approvePurchase, deletePurchase, getPurchase } from '@/services/purchases';
import { purchaseCostCategoryLabel } from '@/constants/purchaseCostCategories';
import { MONEY_OUT_METHOD_LABELS } from '@/constants/paymentMethods';
import { useShop } from '@/hooks/useShop';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

const ALLOCATION_LABEL: Record<string, string> = {
  quantity: 'spread evenly across every unit',
  value: 'spread by value',
  none: 'tracked separately, not blended into cost',
};

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { currency } = useShop();
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === 'owner';
  const canSeePrices = hasPermission(user, 'view_purchase_prices');
  const canCancel = hasPermission(user, 'delete_purchases');

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');

  const { data: purchase, isLoading, isError } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => getPurchase(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase', id] });
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
    queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approvePurchase(id),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Could not approve that purchase.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => deletePurchase(id),
    onSuccess: () => { setConfirmCancel(false); invalidate(); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setConfirmCancel(false);
      setError(e?.response?.data?.message || 'Could not cancel that purchase.');
    },
  });

  const fmt = (n?: number) =>
    n == null ? '—' : `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const supplierId =
    purchase?.supplier && typeof purchase.supplier === 'object' ? purchase.supplier._id : undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/owner/purchases/history">
          <span className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Purchase</h1>
          {purchase && (
            <p className="text-gray-500 text-sm">
              {format(new Date(purchase.purchaseDate), 'd MMM yyyy')} · recorded by {purchase.staff?.name}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError || !purchase ? (
        <Card><p className="text-sm text-gray-500 py-4 text-center">Couldn&apos;t load this purchase.</p></Card>
      ) : (
        <>
          {purchase.status === 'pending_approval' && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ color: '#92400E' }}>Waiting for approval</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Stock hasn&apos;t changed yet. Approving applies it and updates average cost.
                  </p>
                </div>
                {isOwner && (
                  <Button loading={approveMutation.isPending} onClick={() => { setError(''); approveMutation.mutate(); }}>
                    Approve
                  </Button>
                )}
              </div>
            </Card>
          )}

          {purchase.status === 'cancelled' && (
            <Card>
              <p className="text-sm text-gray-600">
                Cancelled
                {purchase.cancelledAt ? ` on ${format(new Date(purchase.cancelledAt), 'd MMM yyyy')}` : ''}
                {purchase.cancelledBy?.name ? ` by ${purchase.cancelledBy.name}` : ''}. Any stock it added
                has been reversed; the record is kept for your books.
              </p>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Building2 className="w-4 h-4 text-gray-400" />
              {supplierId ? (
                <Link
                  href={`/owner/purchases/suppliers/${supplierId}`}
                  className="text-sm font-semibold underline"
                  style={{ color: '#0F766E' }}
                >
                  {purchase.supplierName}
                </Link>
              ) : (
                <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                  {purchase.supplierName || 'No supplier'}
                </span>
              )}
              {purchase.paymentMethod && (
                <Badge color="gray">{MONEY_OUT_METHOD_LABELS[purchase.paymentMethod]}</Badge>
              )}
              {purchase.inventoryUpdated && <Badge color="green">Stock updated</Badge>}
            </div>

            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Items</h2>
            <div className="divide-y divide-gray-50">
              {purchase.items.map((item, index) => (
                <div key={`${item.productId}-${item.variantId ?? index}`} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm" style={{ color: '#0F172A' }}>
                      {item.productName}
                      {item.variantName ? ` · ${item.variantName}` : ''}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {item.quantity} {item.unitOfMeasure ?? ''}
                      {canSeePrices && item.unitCost != null ? ` × ${fmt(item.unitCost)}` : ''}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: '#0F172A' }}>
                    {canSeePrices ? fmt(item.totalCost) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {purchase.additionalCosts.length > 0 && (
            <Card>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Extra costs</h2>
              <p className="text-xs text-gray-500 mb-3">
                {ALLOCATION_LABEL[purchase.allocationMethod] ?? ''} — as set when this purchase was recorded.
              </p>
              <div className="divide-y divide-gray-50">
                {purchase.additionalCosts.map((cost) => (
                  <div key={cost._id} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-sm" style={{ color: '#0F172A' }}>
                        {purchaseCostCategoryLabel(cost.category)}
                      </span>
                      {cost.description && (
                        <span className="block text-xs text-gray-400">{cost.description}</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: '#0F172A' }}>
                      {canSeePrices ? fmt(cost.amount) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {canSeePrices && (
            <Card>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-600">Products</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                    {fmt(purchase.productsTotal)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-600">Extra costs</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                    {fmt(purchase.additionalCostsTotal)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-2 mt-2 border-t border-gray-100">
                  <span className="font-bold" style={{ color: '#0F172A' }}>Total</span>
                  <span className="text-xl font-bold tabular-nums" style={{ color: '#0F766E' }}>
                    {fmt(purchase.grandTotal)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {canCancel && purchase.status !== 'cancelled' && (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => { setError(''); setConfirmCancel(true); }}>
                Cancel this purchase
              </Button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this purchase?" size="sm">
        <p className="text-sm text-gray-600">
          Any stock it added is taken back out. The record stays in your books marked cancelled — it
          isn&apos;t deleted.
        </p>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="ghost" onClick={() => setConfirmCancel(false)}>Keep it</Button>
          <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
            Cancel purchase
          </Button>
        </div>
      </Modal>
    </div>
  );
}
