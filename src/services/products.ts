import api from '@/lib/api';

/**
 * Products, mirroring the backend's Product model.
 *
 * The type list is wider than most shops use, but it's the enum the server
 * actually accepts — and the till already knows how to sell all of them, so
 * the editor has to be able to create them.
 */
export type ProductType =
  | 'standard'
  | 'variable'
  | 'weighted'
  | 'refillable'
  | 'service'
  | 'bundle'
  | 'configurable';

export interface VariantCommission {
  enabled: boolean;
  /**
   * The shop's floor for this variant. Anything it sells for above this is
   * split with the seller by employeeSharePercent; the rest stays with the
   * shop on top of basePrice.
   */
  basePrice?: number;
  employeeSharePercent?: number;
}

export interface ProductVariant {
  _id?: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  sku?: string;
  lowStockAlert?: number;
  commission?: VariantCommission;
}

export interface BundleItem {
  product: string | { _id: string; name: string };
  quantity: number;
}

export interface Promotion {
  _id?: string;
  label?: string;
  buyQty: number;
  freeQty: number;
  isActive?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  lowStockAlert: number;
  productType: ProductType;
  trackInventory: boolean;
  unitOfMeasure: string;
  minPrice?: number;
  maxPrice?: number;
  allowPriceOverride?: boolean;
  bundleItems?: BundleItem[];
  promotions?: Promotion[];
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPayload {
  name: string;
  description?: string;
  category: string;
  productType: ProductType;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  lowStockAlert: number;
  trackInventory: boolean;
  unitOfMeasure?: string;
  minPrice?: number;
  maxPrice?: number;
  allowPriceOverride?: boolean;
  bundleItems?: { product: string; quantity: number }[];
  variants?: Omit<ProductVariant, '_id'>[];
  promotions?: Promotion[];
}

export async function getProducts(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Product[]; pagination?: { page: number; pages: number; total: number } }> {
  const res = await api.get('/products', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await api.get(`/products/${id}`);
  return res.data.data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const res = await api.post('/products', payload);
  return res.data.data;
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  const res = await api.put(`/products/${id}`, payload);
  return res.data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}
