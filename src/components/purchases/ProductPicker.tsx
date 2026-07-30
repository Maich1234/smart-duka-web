'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import { getProducts, type Product } from '@/services/products';
import type { PurchaseCartLine } from '@/store/purchaseCartStore';

/**
 * Pick a product, then say how many and at what cost.
 *
 * Unit cost defaults to what the product last cost, since most restocking is
 * at the same price — but it's always editable, because the whole reason to
 * record a purchase is that prices move.
 */
export default function ProductPicker({
  isOpen,
  currency,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  currency: string;
  onClose: () => void;
  onAdd: (line: Omit<PurchaseCartLine, 'key'>) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => getProducts({ search: search || undefined }),
    enabled: isOpen,
  });

  const reset = () => {
    setSelected(null);
    setVariantId('');
    setQuantity('1');
    setUnitCost('');
    setSearch('');
  };

  const close = () => { reset(); onClose(); };

  const pick = (product: Product) => {
    setSelected(product);
    const firstVariant = product.variants?.[0];
    setVariantId(product.productType === 'configurable' ? firstVariant?._id ?? '' : '');
    setUnitCost(String(firstVariant?.costPrice ?? product.costPrice ?? ''));
  };

  const variant = selected?.variants?.find((v) => v._id === variantId);
  const qty = parseFloat(quantity) || 0;
  const cost = parseFloat(unitCost) || 0;
  const canAdd = !!selected && qty > 0 && cost >= 0 &&
    (selected.productType !== 'configurable' || !!variantId);

  const submit = () => {
    if (!selected || !canAdd) return;
    onAdd({
      productId: selected._id,
      productName: selected.name,
      variantId: variantId || undefined,
      variantName: variant?.name,
      unitOfMeasure: selected.unitOfMeasure,
      quantity: qty,
      unitCost: cost,
    });
    close();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={selected ? selected.name : 'Add a product'}>
      {!selected ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1">
              {(data?.data ?? []).map((product) => (
                <button
                  key={product._id}
                  onClick={() => pick(product)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                      {product.name}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {product.quantity} {product.unitOfMeasure} in stock
                    </span>
                  </span>
                </button>
              ))}
              {(data?.data.length ?? 0) === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">No products match that.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {selected.productType === 'configurable' && (selected.variants?.length ?? 0) > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Variant</label>
              <div className="flex flex-wrap gap-2">
                {selected.variants!.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => { setVariantId(v._id!); setUnitCost(String(v.costPrice ?? '')); }}
                    className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
                    style={{
                      borderColor: variantId === v._id ? '#0F766E' : '#E5E7EB',
                      backgroundColor: variantId === v._id ? '#F0FDFA' : 'white',
                      color: variantId === v._id ? '#0F766E' : '#64748B',
                    }}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Quantity${selected.unitOfMeasure ? ` (${selected.unitOfMeasure})` : ''}`}
              type="number"
              min="0"
              step="any"
              autoFocus
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              label={`Unit cost (${currency})`}
              type="number"
              min="0"
              step="0.01"
              hint="What you paid per unit"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>

          <div className="flex items-baseline justify-between p-3 rounded-xl" style={{ backgroundColor: '#F0FDFA' }}>
            <span className="text-sm text-gray-600">Line total</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: '#0F766E' }}>
              {currency} {(qty * cost).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="ghost" onClick={reset}>Back</Button>
            <Button disabled={!canAdd} onClick={submit}>Add to purchase</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
