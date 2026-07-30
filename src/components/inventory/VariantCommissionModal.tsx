'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import type { VariantForm } from './ProductForm';

type CommissionPatch = Pick<
  VariantForm,
  'commissionEnabled' | 'commissionBasePrice' | 'commissionEmployeeSharePercent'
>;

/**
 * Per-variant employee commission.
 *
 * The model is a floor, not a percentage of the sale: `basePrice` is what the
 * shop wants to keep, and whatever the variant sells for above it is split
 * with the seller by `employeeSharePercent`. That's why the worked example
 * below matters — "70% commission" sounds like 70% of the price, and it isn't.
 */
export default function VariantCommissionModal({
  isOpen,
  variant,
  currency,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  variant: VariantForm;
  currency: string;
  onClose: () => void;
  onSave: (patch: CommissionPatch) => void;
}) {
  const [enabled, setEnabled] = useState(variant.commissionEnabled);
  const [basePrice, setBasePrice] = useState(variant.commissionBasePrice);
  const [share, setShare] = useState(variant.commissionEmployeeSharePercent || '100');
  const [error, setError] = useState('');

  const sellingPrice = parseFloat(variant.sellingPrice) || 0;
  const parsedBase = parseFloat(basePrice);
  const parsedShare = parseFloat(share);
  const validBase = !isNaN(parsedBase) && parsedBase >= 0;
  const validShare = !isNaN(parsedShare) && parsedShare >= 0 && parsedShare <= 100;

  const excess = validBase ? Math.max(0, sellingPrice - parsedBase) : 0;
  const employeeAmount = validBase && validShare ? Math.round(excess * (parsedShare / 100) * 100) / 100 : 0;
  const shopAmount = validBase ? Math.round((sellingPrice - employeeAmount) * 100) / 100 : 0;

  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;

  const handleSave = () => {
    if (!enabled) {
      onSave({ commissionEnabled: false, commissionBasePrice: '', commissionEmployeeSharePercent: '100' });
      return;
    }
    if (!validBase) return setError('Enter a valid base price.');
    if (parsedBase > sellingPrice) {
      return setError(`Base price can't be more than the selling price (${fmt(sellingPrice)}).`);
    }
    if (!validShare) return setError('Employee share must be between 0 and 100%.');
    setError('');
    onSave({
      commissionEnabled: true,
      commissionBasePrice: basePrice,
      commissionEmployeeSharePercent: share,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Commission · ${variant.name || 'Variant'}`} size="sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Pay commission on this variant</p>
            <p className="text-xs text-gray-500 mt-0.5">
              The seller earns a share of anything above your base price.
            </p>
          </div>
          <Toggle label="Pay commission" checked={enabled} onChange={setEnabled} />
        </div>

        {enabled && (
          <>
            <Input
              label={`Base price (${currency})`}
              type="number"
              step="0.01"
              hint="What the shop keeps before any split"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
            <Input
              label="Employee share (%)"
              type="number"
              min="0"
              max="100"
              hint="Their cut of the amount above base"
              value={share}
              onChange={(e) => setShare(e.target.value)}
            />

            {validBase && validShare && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#F0FDFA' }}>
                <p className="font-semibold mb-1.5" style={{ color: '#0F766E' }}>
                  Selling at {fmt(sellingPrice)}
                </p>
                <div className="flex justify-between text-gray-600">
                  <span>Staff earns</span>
                  <span className="font-semibold tabular-nums">{fmt(employeeAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shop keeps</span>
                  <span className="font-semibold tabular-nums">{fmt(shopAmount)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
