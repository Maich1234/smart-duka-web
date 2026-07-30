import api from '@/lib/api';

/**
 * Suppliers. Unlike /purchases, these endpoints carry no requirePaidShop —
 * a locked shop can still keep its supplier book in order.
 */

export interface Supplier {
  _id: string;
  shop: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierStats {
  purchaseCount: number;
  totalSpend: number;
  averagePurchaseCost: number;
  lastPurchaseDate: string | null;
}

export interface SupplierDetail extends Supplier {
  stats: SupplierStats;
  recentPurchases: { _id: string; grandTotal: number; createdAt: string; status: string }[];
}

export interface SupplierPayload {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
  isActive?: boolean;
}

/** Owner, or staff with view_purchases. */
export async function getSuppliers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: Supplier[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const res = await api.get('/suppliers', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

/** Includes spend/average/last-purchase stats computed on demand. */
export async function getSupplier(id: string): Promise<SupplierDetail> {
  const res = await api.get(`/suppliers/${id}`);
  return res.data.data;
}

export async function createSupplier(data: SupplierPayload): Promise<Supplier> {
  const res = await api.post('/suppliers', data);
  return res.data.data;
}

export async function updateSupplier(id: string, data: SupplierPayload): Promise<Supplier> {
  const res = await api.put(`/suppliers/${id}`, data);
  return res.data.data;
}

/**
 * Soft-delete. The supplier stays attached to past purchases and simply
 * disappears from the picker — deleting one must never rewrite history.
 */
export async function deleteSupplier(id: string): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}
