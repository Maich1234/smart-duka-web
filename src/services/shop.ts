import api from '@/lib/api';
import type { ShopPaymentMethod } from '@/lib/paymentMethods';

/**
 * The shop document, mirroring the mobile app's services/shop.ts so the two
 * clients agree on what a shop is.
 */
export interface Shop {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  country: string;
  currency: string;
  isActive: boolean;
  county?: string;
  subCounty?: string;
  receiptThankYouNote?: string;
  logoUrl?: string;
  motto?: string;
  /** Owner feature flag: staff must clock in before selling. */
  shiftManagementEnabled?: boolean;
  /** Owner feature flag: staff can preview commission while selling and view their own earnings. */
  showStaffCommission?: boolean;
  /** Owner feature flag: the whole Purchasing module is hidden from navigation until this is on. */
  purchasingEnabled?: boolean;
  /**
   * Shop-wide default for spreading additional purchase costs (transport,
   * packaging, ...) across a purchase's products when updating their average
   * cost. Snapshotted per-purchase, so changing this later never rewrites
   * history. 'none' = costs are tracked for reporting but never blended in.
   */
  purchaseCostAllocationMethod?: 'quantity' | 'value' | 'none';
  /**
   * Owner feature flag: Gemini-powered features (Daily Insight, business
   * chat) are available. Independent of subscription tier — a subscriber can
   * still opt out of AI processing for their shop.
   */
  aiEnabled?: boolean;
  /**
   * The till's payment buttons, owner-managed and ordered. Absent on shops
   * predating the setting — read it through resolveSaleMethods(), which falls
   * back to Cash + M-PESA.
   */
  paymentMethods?: ShopPaymentMethod[];
  /** ISO timestamp — earliest possible sale date, used to bound date pickers. */
  createdAt?: string;
}

export interface ShopConfigResponse {
  success: boolean;
  data: Shop;
}

/**
 * Every field is optional and the server merges rather than replaces: the
 * controller guards each one with `!== undefined` (see shopController.js
 * updateShopConfig). So sending just the field you changed is safe and will
 * not blank out the rest.
 *
 * The one exception is `paymentMethods`, which is sent whole and stored
 * whole — a partial merge would make removing a button impossible.
 */
export interface UpdateShopConfigData {
  name?: string;
  address?: string;
  county?: string;
  subCounty?: string;
  phone?: string;
  email?: string;
  taxRate?: number;
  country?: string;
  currency?: string;
  receiptThankYouNote?: string;
  logoUrl?: string;
  motto?: string;
  shiftManagementEnabled?: boolean;
  showStaffCommission?: boolean;
  purchasingEnabled?: boolean;
  purchaseCostAllocationMethod?: 'quantity' | 'value' | 'none';
  aiEnabled?: boolean;
  paymentMethods?: ShopPaymentMethod[];
}

export async function getShopConfig(): Promise<Shop> {
  const res = await api.get<ShopConfigResponse>('/shop');
  return res.data.data;
}

export async function updateShopConfig(data: UpdateShopConfigData): Promise<Shop> {
  const res = await api.put<ShopConfigResponse>('/shop', data);
  return res.data.data;
}

/** Multipart upload; the backend stores it on Cloudinary and returns the URL. */
export async function uploadShopLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append('logo', file);
  const res = await api.post<{ success: boolean; data: { logoUrl: string } }>('/shop/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.logoUrl;
}
