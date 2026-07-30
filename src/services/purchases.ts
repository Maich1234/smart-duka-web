import api from '@/lib/api';
import type { MoneyOutMethod } from '@/constants/paymentMethods';

/**
 * Stock purchases.
 *
 * Note the optional money fields throughout: the server strips unitCost,
 * totalCost, amount, productsTotal, additionalCostsTotal and grandTotal from
 * responses for staff without `view_purchase_prices`. They are `number |
 * undefined` rather than `number` on purpose — rendering `?? '—'` instead of
 * a confident zero is the difference between "you can't see this" and a lie.
 */

export type PurchaseCostCategory =
  | 'transport' | 'delivery' | 'fuel' | 'loading' | 'offloading'
  | 'packaging' | 'market_fee' | 'brokerage' | 'insurance' | 'other';

export type PurchaseAllocationMethod = 'quantity' | 'value' | 'none';
export type PurchaseStatus = 'completed' | 'pending_approval' | 'cancelled';

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  variantId?: string;
  variantName?: string;
  unitOfMeasure?: string;
}

export interface PurchaseCost {
  _id: string;
  category: PurchaseCostCategory;
  description?: string;
  amount?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  _id: string;
  shop: string;
  supplier?: { _id: string; name: string; phone?: string; email?: string; location?: string } | string;
  supplierName: string;
  items: PurchaseItem[];
  additionalCosts: PurchaseCost[];
  productsTotal?: number;
  additionalCostsTotal?: number;
  grandTotal?: number;
  /** Absent on purchases predating the field — treat as 'cash'. */
  paymentMethod?: MoneyOutMethod;
  allocationMethod: PurchaseAllocationMethod;
  status: PurchaseStatus;
  inventoryUpdated: boolean;
  staff: { _id: string; name: string };
  purchaseDate: string;
  cancelledAt?: string;
  cancelledBy?: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseItemData {
  productId: string;
  quantity: number;
  unitCost: number;
  /** Required for 'configurable' products. */
  variantId?: string;
}

export interface CreatePurchaseCostData {
  category: PurchaseCostCategory;
  description?: string;
  amount: number;
  notes?: string;
}

export interface CreatePurchaseData {
  /** Omitted for walk-in purchases with no supplier on file. */
  supplierId?: string;
  /** Free-text label used when there's no supplierId. */
  supplierName?: string;
  items: CreatePurchaseItemData[];
  additionalCosts?: CreatePurchaseCostData[];
  paymentMethod?: MoneyOutMethod;
  purchaseDate?: string;
}

export interface PurchaseStats {
  purchaseCount: number;
  totalSpend: number;
  productsPurchased: number;
  suppliersUsed: number;
  recentPurchases: Purchase[];
}

export interface PurchaseTrendPoint {
  label: string;
  date: string;
  productsTotal: number;
  additionalCostsTotal: number;
  grandTotal: number;
  purchaseCount: number;
}

export interface PurchaseAnalytics {
  period: 'daily' | 'weekly' | 'monthly';
  rangeStart: string;
  series: PurchaseTrendPoint[];
  summary: {
    totalInventoryPurchased: number;
    totalAdditionalCosts: number;
    totalProcurementCost: number;
    averageProcurementCost: number;
  };
  costBreakdown: { category: PurchaseCostCategory; amount: number }[];
  topProducts: { _id: string; productName: string; quantity: number; totalCost: number }[];
  supplierSpend: { _id: string; supplierName?: string; purchaseCount: number; totalSpend: number }[];
}

export async function createPurchase(data: CreatePurchaseData): Promise<Purchase> {
  const res = await api.post('/purchases', data);
  return res.data.data;
}

export async function getPurchases(params?: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  supplierId?: string;
  status?: PurchaseStatus;
  search?: string;
  sort?: 'newest' | 'oldest' | 'highest_cost' | 'lowest_cost';
  page?: number;
  limit?: number;
}): Promise<{
  data: Purchase[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const res = await api.get('/purchases', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getPurchase(id: string): Promise<Purchase> {
  const res = await api.get(`/purchases/${id}`);
  return res.data.data;
}

/**
 * Stock is corrected by delta — the old quantities are undone and the new
 * ones applied — rather than retroactively recosting history.
 */
export async function updatePurchase(id: string, data: Partial<CreatePurchaseData>): Promise<Purchase> {
  const res = await api.put(`/purchases/${id}`, data);
  return res.data.data;
}

/** Soft-cancel: stock is reversed, the record stays as history. */
export async function deletePurchase(id: string): Promise<void> {
  await api.delete(`/purchases/${id}`);
}

/** Owner-only: releases a pending purchase's stock and cost impact. */
export async function approvePurchase(id: string): Promise<Purchase> {
  const res = await api.post(`/purchases/${id}/approve`, {});
  return res.data.data;
}

export async function getPurchaseStats(): Promise<PurchaseStats> {
  const res = await api.get('/purchases/stats');
  return res.data.data;
}

export async function getPurchaseAnalytics(params?: {
  period?: 'daily' | 'weekly' | 'monthly';
}): Promise<PurchaseAnalytics> {
  const res = await api.get('/purchases/analytics', { params });
  return res.data.data;
}
