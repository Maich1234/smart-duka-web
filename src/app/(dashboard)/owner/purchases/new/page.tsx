'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Plus, Save, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SupplierPicker from '@/components/purchases/SupplierPicker';
import ProductPicker from '@/components/purchases/ProductPicker';
import AdditionalCostsCard from '@/components/purchases/AdditionalCostsCard';
import { purchaseTotals, usePurchaseCartStore } from '@/store/purchaseCartStore';
import { createPurchase } from '@/services/purchases';
import { useShop } from '@/hooks/useShop';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { MONEY_OUT_METHODS, MONEY_OUT_METHOD_LABELS } from '@/constants/paymentMethods';

export default function NewPurchasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currency, purchaseCostAllocationMethod } = useShop();
  const user = useAuthStore((s) => s.user);
  const needsApproval = hasPermission(user, 'require_purchase_approval') && user?.role !== 'owner';

  const cart = usePurchaseCartStore();
  const [pickingSupplier, setPickingSupplier] = useState(false);
  const [pickingProduct, setPickingProduct] = useState(false);
  const [error, setError] = useState('');

  const totals = purchaseTotals(cart.lines, cart.additionalCosts);
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const mutation = useMutation({
    mutationFn: () =>
      createPurchase({
        supplierId: cart.supplierId,
        supplierName: cart.supplierId ? undefined : cart.supplierName || undefined,
        items: cart.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCost: l.unitCost,
          variantId: l.variantId,
        })),
        additionalCosts: cart.additionalCosts.filter((c) => c.amount > 0),
        paymentMethod: cart.paymentMethod,
        purchaseDate: cart.purchaseDate,
      }),
    onSuccess: (purchase) => {
      cart.reset();
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push(`/owner/purchases/${purchase._id}`);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Could not record that purchase.');
    },
  });

  const canSubmit = cart.lines.length > 0 && !mutation.isPending;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/owner/purchases">
          <span className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Record Purchase</h1>
          <p className="text-gray-500 text-sm">Stock you&apos;ve bought, and what it cost</p>
        </div>
      </div>

      {needsApproval && (
        <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
          This will be saved for the owner to approve. Stock won&apos;t change until they do.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Supplier &amp; payment</h2>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setPickingSupplier(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 text-left hover:border-teal-300 transition-colors"
          >
            <Building2 className="w-4 h-4 shrink-0 text-gray-400" />
            <span className="flex-1 text-sm" style={{ color: cart.supplierName ? '#0F172A' : '#94A3B8' }}>
              {cart.supplierName || 'Choose a supplier (optional)'}
            </span>
          </button>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>How you paid</label>
            <div className="flex flex-wrap gap-2">
              {MONEY_OUT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => cart.setPaymentMethod(method)}
                  className="px-3 py-2 rounded-xl border text-sm font-medium transition-colors"
                  style={{
                    borderColor: cart.paymentMethod === method ? '#0F766E' : '#E5E7EB',
                    backgroundColor: cart.paymentMethod === method ? '#F0FDFA' : 'white',
                    color: cart.paymentMethod === method ? '#0F766E' : '#64748B',
                  }}
                >
                  {MONEY_OUT_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Purchase date"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={cart.purchaseDate}
            onChange={(e) => cart.setPurchaseDate(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>What you bought</h2>
          <Button size="sm" variant="outline" onClick={() => setPickingProduct(true)}>
            <Plus className="w-3.5 h-3.5" /> Add product
          </Button>
        </div>

        {cart.lines.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Nothing added yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {cart.lines.map((line) => (
              <div key={line.key} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex-1 min-w-[10rem]">
                  <span className="block text-sm font-medium" style={{ color: '#0F172A' }}>
                    {line.productName}
                    {line.variantName ? ` · ${line.variantName}` : ''}
                  </span>
                  <span className="block text-xs text-gray-400">
                    {line.quantity} {line.unitOfMeasure ?? ''} × {fmt(line.unitCost)}
                  </span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={line.quantity}
                  onChange={(e) => cart.updateLine(line.key, { quantity: parseFloat(e.target.value) || 0 })}
                  aria-label={`Quantity of ${line.productName}`}
                  className="w-20 px-2 py-2 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitCost}
                  onChange={(e) => cart.updateLine(line.key, { unitCost: parseFloat(e.target.value) || 0 })}
                  aria-label={`Unit cost of ${line.productName}`}
                  className="w-24 px-2 py-2 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                />
                <span className="w-24 text-sm font-semibold text-right tabular-nums" style={{ color: '#0F172A' }}>
                  {fmt(line.quantity * line.unitCost)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${line.productName}`}
                  onClick={() => cart.removeLine(line.key)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AdditionalCostsCard
        costs={cart.additionalCosts}
        currency={currency}
        allocationMethod={purchaseCostAllocationMethod}
        onChange={cart.setAdditionalCosts}
      />

      <Card>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Products</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
              {fmt(totals.productsTotal)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Extra costs</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
              {fmt(totals.additionalCostsTotal)}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2 mt-2 border-t border-gray-100">
            <span className="font-bold" style={{ color: '#0F172A' }}>Total</span>
            <span className="text-xl font-bold tabular-nums" style={{ color: '#0F766E' }}>
              {fmt(totals.grandTotal)}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => { cart.reset(); router.push('/owner/purchases'); }}>
          Discard
        </Button>
        <Button disabled={!canSubmit} loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(); }}>
          <Save className="w-4 h-4" />
          {needsApproval ? 'Send for approval' : 'Record purchase'}
        </Button>
      </div>

      <SupplierPicker
        isOpen={pickingSupplier}
        onClose={() => setPickingSupplier(false)}
        onSelect={cart.setSupplier}
      />
      <ProductPicker
        isOpen={pickingProduct}
        currency={currency}
        onClose={() => setPickingProduct(false)}
        onAdd={cart.addLine}
      />
    </div>
  );
}
