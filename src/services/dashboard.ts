import api from '@/lib/api';

/**
 * Dashboard aggregates.
 *
 * Several fields are optional because they were added to the backend later —
 * an older deployment simply won't return them. Every consumer has to degrade
 * rather than render `undefined`, which is why the brief and the attention
 * list both check before using them.
 */

export interface TopProduct {
  _id: string;
  name: string;
  quantity: number;
}

export interface OwnerDashboardData {
  todaySalesTotal: number;
  cashSalesTotal: number;
  mpesaSalesTotal: number;
  transactionsToday: number;
  yesterdaySalesTotal?: number;
  todayProfit?: number;
  todayExpensesTotal?: number;
  topProduct?: TopProduct | null;
  openShiftsCount?: number;
  totalProducts: number;
  currentStockValue: number;
  lowStockItems: { _id: string; name: string; quantity: number; lowStockAlert: number; sellingPrice?: number }[];
  recentTransactions: {
    _id: string;
    invoiceNumber?: string;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
    staff?: { name: string };
    items?: { productName: string }[];
  }[];
  ratingSummary?: { average: number; count: number };
}

export async function getOwnerDashboard(): Promise<OwnerDashboardData> {
  const res = await api.get('/dashboard/owner');
  return res.data.data;
}
