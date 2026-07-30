import type { PurchaseCostCategory } from '@/services/purchases';

/**
 * The landed-cost categories a purchase can carry, in the order they're
 * offered. Shared by the new-purchase form, the purchase detail breakdown and
 * the procurement report, so a cost reads identically wherever it appears.
 */
export interface PurchaseCostCategoryMeta {
  value: PurchaseCostCategory;
  label: string;
}

export const PURCHASE_COST_CATEGORIES: PurchaseCostCategoryMeta[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'loading', label: 'Loading' },
  { value: 'offloading', label: 'Offloading' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'market_fee', label: 'Market fee' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

/** Falls back to 'Other', so a category added server-side never renders blank. */
export const purchaseCostCategoryLabel = (value: string): string =>
  PURCHASE_COST_CATEGORIES.find((c) => c.value === value)?.label ?? 'Other';
