import api from '@/lib/api';

/**
 * Staff commission. Only meaningful when the shop has switched
 * `showStaffCommission` on — otherwise the server answers 403 and the UI
 * shouldn't be offering it at all.
 */

export interface CommissionBreakdownEntry {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  commission: number;
  unitsSold: number;
}

export interface CommissionSummary {
  totalCommission: number;
  totalRevenue: number;
  salesCount: number;
  byProduct: CommissionBreakdownEntry[];
}

export type CommissionPeriod = 'today' | 'week' | 'month';

/** Local-time boundaries — a shop's "today" is its own day, not UTC's. */
export function getCommissionPeriodRange(period: CommissionPeriod): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  let start: Date;
  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    // Weeks start Monday.
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

/** The caller's own commission. */
export async function getMyCommission(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<CommissionSummary> {
  const res = await api.get('/sales/commissions/me', { params });
  return res.data.data;
}

/** One staff member's commission, for the owner's staff detail page. */
export async function getStaffCommission(
  staffId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<CommissionSummary> {
  const res = await api.get(`/staff/${staffId}/commission`, { params });
  return res.data.data;
}
