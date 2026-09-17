import api from '@/lib/api';

/**
 * Customers — search + quick-create only. The web app has no customer/credit
 * directory yet (that's mobile-only so far); this is just enough to pick or
 * add the person a quotation is for. GET /customers is scoped server-side to
 * whoever may sell (record_sale) or manage credit, and always to this shop.
 */

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

export async function getCustomers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: Customer[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const res = await api.get('/customers', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
}

export async function createCustomer(data: CreateCustomerInput): Promise<Customer> {
  const res = await api.post('/customers', data);
  return res.data.data;
}

/**
 * Mirrors creditService.js's summariseAccount() — present on GET /customers/:id
 * for a caller who may see credit (owner, or make_credit_sale/record_credit_payment/
 * view_all_credit/view_own_credit), absent otherwise.
 */
export interface CustomerAccount {
  creditLimit: number;
  outstanding: number;
  availableCredit: number;
  overdueAmount: number;
  blocked: boolean;
  blockedReason: string;
  status: 'none' | 'current' | 'overdue' | 'paid';
  /** Why the till would refuse a credit sale right now, computed server-side. */
  canTakeCredit: boolean;
}

export interface CustomerWithAccount extends Customer {
  account?: CustomerAccount;
}

/** Used by the quotation detail page's credit-sale confirm step. */
export async function getCustomerById(id: string): Promise<CustomerWithAccount> {
  const res = await api.get(`/customers/${id}`);
  return res.data.data;
}
