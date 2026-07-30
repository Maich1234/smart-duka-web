import api from '@/lib/api';

/**
 * Shifts — clock in, sell, count the drawer, clock out.
 *
 * Only meaningful when the shop has switched shift management on. Read that
 * from GET /shifts/active's own `enabled` field rather than the shop config,
 * for the reason in hooks/useShift.ts.
 */

export interface ShiftMethodTotals {
  count: number;
  total: number;
}

export interface ShiftSummary {
  salesCount: number;
  grossSales: number;
  discounts: number;
  byMethod: {
    cash: ShiftMethodTotals;
    mpesa: ShiftMethodTotals;
    card: ShiftMethodTotals;
  };
  refunds: { count: number; total: number; cashTotal: number };
  voids: { count: number; total: number };
  cashExpenses: { count: number; total: number };
  stockAdjustments: number;
  /** Opening float + cash sales − cash refunds − cash expenses. */
  expectedCash: number;
  /** Counted minus expected. Null until a closing count is entered. */
  cashDiscrepancy: number | null;
  durationMinutes?: number;
}

export interface Shift {
  _id: string;
  shop: string;
  staff: string | { _id: string; name: string };
  status: 'active' | 'closed';
  startedAt: string;
  endedAt?: string;
  endedBy?: string | { _id: string; name: string };
  device?: { platform?: string; name?: string; appVersion?: string };
  openingFloat: number;
  closingCount?: number;
  openingNote?: string;
  closingNote?: string;
  summary?: ShiftSummary;
}

export interface DailySummaryData {
  _id: string;
  date: string;
  totals: {
    revenue: number;
    transactions: number;
    discounts: number;
    grossProfit: number;
    expenses: number;
  };
  byMethod: {
    cash?: ShiftMethodTotals;
    mpesa?: ShiftMethodTotals;
    card?: ShiftMethodTotals;
  };
  refunds: { count: number; total: number };
  voids: { count: number; total: number };
  shifts: { count: number; totalDiscrepancy: number; unclosed: number };
  inventory: { lowStockCount: number; adjustments: number; stockValue: number };
  bestSellers: { productId: string; name: string; quantity: number; revenue: number }[];
  slowMovers: { productId: string; name: string; quantity: number; stock: number }[];
  staffPerformance: { staffId: string; name: string; salesCount: number; revenue: number }[];
  mpesaReconciliation: { salesTotal: number; confirmedTotal: number; delta: number };
  insights: string[];
  generatedAt: string;
}

/** Recorded against the shift so reports show which till ran it. */
const deviceInfo = () => ({
  platform: 'web' as const,
  name: typeof navigator !== 'undefined' ? 'Web Browser' : undefined,
});

export async function getActiveShift(): Promise<{
  success: boolean;
  data: Shift | null;
  enabled: boolean;
}> {
  const res = await api.get('/shifts/active');
  return res.data;
}

export async function startShift(payload: {
  openingFloat: number;
  openingNote?: string;
}): Promise<{ success: boolean; data: Shift; message?: string }> {
  const res = await api.post('/shifts/start', { ...payload, device: deviceInfo() });
  return res.data;
}

/** Pass 'current' to close the caller's own shift; an id force-closes someone else's. */
export async function endShift(
  id: string,
  payload: { closingCount?: number; closingNote?: string }
): Promise<{ success: boolean; data: Shift; message?: string }> {
  const res = await api.post(`/shifts/${id}/end`, payload);
  return res.data;
}

export async function getShifts(params?: {
  staffId?: string;
  status?: 'active' | 'closed';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: Shift[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const res = await api.get('/shifts', { params });
  return res.data;
}

export async function getShiftById(
  id: string
): Promise<{ success: boolean; data: Shift; liveSummary: ShiftSummary | null }> {
  const res = await api.get(`/shifts/${id}`);
  return res.data;
}

export async function getDailySummary(
  date: string
): Promise<{ success: boolean; data: DailySummaryData }> {
  const res = await api.get(`/summaries/daily/${date}`);
  return res.data;
}

export async function listDailySummaries(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: DailySummaryData[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const res = await api.get('/summaries/daily', { params });
  return res.data;
}
