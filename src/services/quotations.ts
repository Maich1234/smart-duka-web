import api from '@/lib/api';

/**
 * Service quotations: draft → declined/converted, plus the customer they
 * were drafted for. Shared by the list/create page (Task 13) and the detail
 * page (Task 14) — every write the detail page needs (decline/delete/
 * convert/email) lives here too, not just what this task's own page calls.
 */

export interface QuotationItem {
  /** Present for a catalog line, absent for a free-text custom line. */
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quotation {
  _id: string;
  customer: string;
  // Captured at creation time, so a later edit to the Customer record never
  // rewrites a quotation already shared with someone — see Quotation.js.
  customerSnapshot: { name: string; phone?: string; email?: string };
  quoteNumber: string;
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  validUntil: string;
  status: 'draft' | 'declined' | 'converted';
  convertedSale?: string | null;
  createdBy: string;
  createdByName: string;
  /** Signs into the public /q/[token] view — never a raw customer-facing id. */
  publicToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationItemInput {
  productId?: string;
  name?: string;
  description?: string;
  quantity: number;
  /** Required for a custom line (no productId); optional override for a catalog line. */
  unitPrice?: number;
}

export interface CreateQuotationInput {
  customerId: string;
  items: CreateQuotationItemInput[];
  notes?: string;
  /** ISO date string, e.g. '2026-10-17'. */
  validUntil: string;
}

export async function getQuotations(params?: {
  status?: 'draft' | 'declined' | 'converted';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: Quotation[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const res = await api.get('/quotations', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getQuotation(id: string): Promise<Quotation> {
  const res = await api.get(`/quotations/${id}`);
  return res.data.data;
}

export async function createQuotation(data: CreateQuotationInput): Promise<Quotation> {
  const res = await api.post('/quotations', data);
  return res.data.data;
}

// PATCH /quotations/:id — backend-only for now, no UI calls this yet. The
// design spec grants create_quotation "draft, edit, delete/archive" and the
// backend's updateQuotationSchema is identical to createQuotationSchema
// (edit is only allowed while status: 'draft'), so this mirrors
// createQuotation's shape exactly. Added so the capability exists in the
// client layer rather than being silently absent; wiring up an actual edit
// UI is out of scope for this fix wave.
export async function updateQuotation(id: string, data: CreateQuotationInput): Promise<Quotation> {
  const res = await api.patch(`/quotations/${id}`, data);
  return res.data.data;
}

export async function declineQuotation(id: string): Promise<Quotation> {
  const res = await api.patch(`/quotations/${id}/decline`);
  return res.data.data;
}

/** Refused server-side once a quotation has been converted. */
export async function deleteQuotation(id: string): Promise<void> {
  await api.delete(`/quotations/${id}`);
}

export interface ConvertQuotationPayload {
  paymentMethod: string;
  mpesaTransactionId?: string;
  mpesaReceiptNumber?: string;
}

export interface ConvertQuotationResult {
  sale: Record<string, unknown>;
  /** The backend's own success copy — e.g. credit conversions get "Sale recorded on X's account." instead of the generic message. */
  message: string;
}

export async function convertQuotation(
  id: string,
  payload: ConvertQuotationPayload
): Promise<ConvertQuotationResult> {
  const res = await api.post(`/quotations/${id}/convert`, payload);
  return { sale: res.data.data, message: res.data.message };
}

/** Emails the customer the quotation PDF + a public link. Requires an email on file. */
export async function sendQuotationEmail(id: string): Promise<string> {
  const res = await api.post(`/quotations/${id}/send-email`);
  return res.data.message;
}
