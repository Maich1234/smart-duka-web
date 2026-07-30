import api from '@/lib/api';

/**
 * Stock depletion — how fast things are selling and when they'll run out.
 *
 * Gated on the plan's `advanced_analytics` feature, so a 403 here is a plan
 * limit rather than a fault. Callers hide the section instead of erroring.
 */

export interface DepletionItem {
  _id: string;
  name: string;
  quantity: number;
  averageDailySales: number;
  daysUntilDepletion: number | null;
  lowStockAlert?: number;
}

export interface DepletionAnalytics {
  items: DepletionItem[];
  generatedAt?: string;
}

export async function getDepletionAnalytics(): Promise<DepletionAnalytics> {
  const res = await api.get('/analytics/depletion');
  const data = res.data.data;
  // The endpoint has returned both a bare array and an object across
  // versions; normalise so callers only handle one shape.
  return Array.isArray(data) ? { items: data } : data;
}
