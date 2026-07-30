'use client';

import { Plus, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PURCHASE_COST_CATEGORIES } from '@/constants/purchaseCostCategories';
import type { CreatePurchaseCostData, PurchaseAllocationMethod } from '@/services/purchases';

const ALLOCATION_NOTE: Record<PurchaseAllocationMethod, string> = {
  quantity: 'These are spread evenly across every unit bought, raising each product’s average cost.',
  value: 'These are spread by value, so costlier products absorb a larger share of them.',
  none: 'These are recorded for reporting only — they won’t change any product’s average cost.',
};

/**
 * Transport, loading, market fees — the costs that make stock cost more than
 * the invoice says.
 *
 * How they're blended into average cost is a shop-wide setting, not a
 * per-purchase one, so this only states what will happen rather than
 * offering the choice here. The chosen method is snapshotted with the
 * purchase, so changing it later never rewrites history.
 */
export default function AdditionalCostsCard({
  costs,
  currency,
  allocationMethod,
  onChange,
}: {
  costs: CreatePurchaseCostData[];
  currency: string;
  allocationMethod: PurchaseAllocationMethod;
  onChange: (next: CreatePurchaseCostData[]) => void;
}) {
  const patch = (index: number, next: Partial<CreatePurchaseCostData>) =>
    onChange(costs.map((c, i) => (i === index ? { ...c, ...next } : c)));

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: '#0F172A' }}>Extra costs</h2>
          <p className="text-xs text-gray-500 mt-0.5">{ALLOCATION_NOTE[allocationMethod]}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange([...costs, { category: 'transport', amount: 0, description: '' }])}
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {costs.length === 0 ? (
        <p className="text-sm text-gray-500 mt-3">None added.</p>
      ) : (
        <div className="space-y-2 mt-4">
          {costs.map((cost, index) => (
            <div key={index} className="flex flex-wrap gap-2 items-center">
              <select
                value={cost.category}
                onChange={(e) => patch(index, { category: e.target.value as CreatePurchaseCostData['category'] })}
                aria-label="Cost category"
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
              >
                {PURCHASE_COST_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                value={cost.description ?? ''}
                onChange={(e) => patch(index, { description: e.target.value })}
                placeholder="Note (optional)"
                className="flex-1 min-w-[8rem] px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">{currency}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost.amount || ''}
                  onChange={(e) => patch(index, { amount: parseFloat(e.target.value) || 0 })}
                  aria-label="Amount"
                  className="w-28 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                />
              </div>
              <button
                type="button"
                aria-label="Remove cost"
                onClick={() => onChange(costs.filter((_, i) => i !== index))}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
