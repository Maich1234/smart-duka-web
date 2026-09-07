import api from '@/lib/api';

/**
 * Real, platform-wide vanity metrics for the marketing site's stat tiles.
 * Unauthenticated — see backend `GET /public/stats`.
 */
export interface PublicStats {
  shopCount: number;
  transactionCount: number;
  rating: { average: number; count: number } | null;
}

export async function getPublicStats(): Promise<PublicStats> {
  const res = await api.get('/public/stats');
  return res.data.data;
}

/**
 * A subscription plan as shown to a visitor with no shop yet — no
 * staff-count to price against, so `monthlyPrice` is the plan's own base
 * rate (what a `per_staff` plan charges for one seat; what a `flat` plan
 * charges outright).
 */
export interface PublicPlan {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  billingType: 'per_staff' | 'flat';
  monthlyPrice: number;
  maxStaff: number;
  extraStaffPrice?: number;
  trialDays: number;
  currency: string;
  highlights: string[];
  badge?: string;
}

export async function getPublicPlans(): Promise<PublicPlan[]> {
  const res = await api.get('/public/plans');
  return res.data.data.plans;
}
