import api from '@/lib/api';

export interface SaleListItem {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodLabel?: string;
  createdAt: string;
  status?: 'completed' | 'voided' | 'refund_pending' | 'refunded';
  staff?: { _id: string; name: string };
}

/** GET /sales — shared across the sales history table and any staff-scoped sales list (e.g. staff/[id]'s Sales & Shifts card). */
export async function getSales(params?: {
  staffId?: string;
  status?: 'completed' | 'voided' | 'refund_pending' | 'refunded';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: SaleListItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const res = await api.get('/sales', { params });
  return res.data;
}
