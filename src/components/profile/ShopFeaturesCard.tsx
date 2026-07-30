'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import { useInvalidateShop, useShop } from '@/hooks/useShop';
import { updateShopConfig, type UpdateShopConfigData } from '@/services/shop';

/**
 * The owner's feature switches, mirroring the toggles on the mobile app's
 * profile screen.
 *
 * Each one saves on its own the moment it's flipped, rather than waiting for
 * a Save button: PUT /shop merges field-by-field (the controller guards every
 * field with `!== undefined`), so a single-field payload can't disturb the
 * rest of the shop record.
 *
 * AI has its own card above this one — it carries subscription upsell and a
 * data-sharing explanation, which don't belong in a plain list of switches.
 */

interface FlagRow {
  key: keyof UpdateShopConfigData;
  title: string;
  description: string;
}

const FLAGS: FlagRow[] = [
  {
    key: 'shiftManagementEnabled',
    title: 'Shift management',
    description: 'Staff clock in before selling and count their cash drawer at the end of a shift.',
  },
  {
    key: 'showStaffCommission',
    title: 'Staff commission',
    description: 'Staff see what they earn on a sale, and can review their own totals.',
  },
  {
    key: 'purchasingEnabled',
    title: 'Purchasing',
    description: 'Record stock purchases and suppliers, and let costs update your average buying price.',
  },
];

const ALLOCATION_OPTIONS: { value: 'quantity' | 'value' | 'none'; label: string; hint: string }[] = [
  { value: 'quantity', label: 'By quantity', hint: 'Split evenly across every unit bought.' },
  { value: 'value', label: 'By value', hint: 'Costlier products absorb a larger share.' },
  { value: 'none', label: "Don't spread", hint: 'Track extra costs for reporting only.' },
];

export default function ShopFeaturesCard() {
  const { shop, purchasingEnabled, purchaseCostAllocationMethod } = useShop();
  const invalidateShop = useInvalidateShop();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (patch: UpdateShopConfigData) => updateShopConfig(patch),
    onSuccess: () => {
      setError('');
      invalidateShop();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? 'Could not save that. Try again.');
    },
  });

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
          <SlidersHorizontal className="w-5 h-5" style={{ color: '#0F766E' }} />
        </div>
        <h2 className="font-bold" style={{ color: '#0F172A' }}>Shop Features</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-5">
        {FLAGS.map((flag) => {
          const checked = Boolean(shop?.[flag.key as keyof typeof shop]);
          return (
            <div key={flag.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{flag.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>
              </div>
              <Toggle
                label={flag.title}
                checked={checked}
                disabled={mutation.isPending || !shop}
                onChange={(next) => mutation.mutate({ [flag.key]: next })}
              />
            </div>
          );
        })}

        {/* Only meaningful once purchasing is on, and hiding it keeps the card
            from explaining a setting that currently does nothing. */}
        {purchasingEnabled && (
          <div className="pt-5 border-t border-gray-100">
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Extra purchase costs</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              How transport, packaging and similar costs are blended into each product&apos;s average
              buying price. Saved with each purchase, so changing this never rewrites past records.
            </p>
            <div className="space-y-2">
              {ALLOCATION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={{
                    borderColor: purchaseCostAllocationMethod === option.value ? '#0F766E' : '#E5E7EB',
                    backgroundColor: purchaseCostAllocationMethod === option.value ? '#F0FDFA' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="purchaseCostAllocationMethod"
                    className="mt-0.5"
                    checked={purchaseCostAllocationMethod === option.value}
                    disabled={mutation.isPending}
                    onChange={() => mutation.mutate({ purchaseCostAllocationMethod: option.value })}
                  />
                  <span>
                    <span className="block text-sm font-medium" style={{ color: '#0F172A' }}>{option.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
