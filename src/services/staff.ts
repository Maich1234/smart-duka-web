import api from '@/lib/api';

export interface StaffActiveSession {
  deviceName: string | null;
  platform: 'ios' | 'android' | 'web' | null;
  lastActiveAt: string;
}

export interface Staff {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'staff';
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  /** Null when the staff member currently has no active device session. */
  activeSession: StaffActiveSession | null;
  /**
   * Set when this member has asked to close their account. With
   * `deletionScheduledAt` still null it's waiting on the owner's approval;
   * once both are set the closure is approved and counting down.
   */
  deletionRequestedAt?: string | null;
  deletionScheduledAt?: string | null;
}

export interface StaffDeletionRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  deletionRequestedAt: string;
  /** The request proceeds on its own if the owner never answers by this date. */
  autoApprovesAt: string;
}

export interface StaffDraft {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export type SeatPaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

export interface SeatPaymentState {
  paymentId: string;
  status: SeatPaymentStatus;
  amount: number;
  currency: string;
  receipt: string | null;
  errorMessage: string | null;
  staff: Staff | null;
}

export type InitiateSeatPaymentResult =
  | { mode: 'created'; staff: Staff }
  | { mode: 'payment_pending'; paymentId: string; amount: number; currency: string };

/**
 * Starts an M-Pesa STK Push for the seat this staff member would occupy. If
 * the seat turns out to be free by the time this runs (e.g. someone else was
 * just removed), the backend creates the staff directly instead — check
 * `mode` on the response.
 */
export async function initiateSeatPayment(
  data: StaffDraft & { phoneNumber: string },
  idempotencyKey?: string
): Promise<{ success: boolean; data: InitiateSeatPaymentResult; message?: string }> {
  const res = await api.post(
    '/staff/seat-payment',
    data,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined
  );
  return res.data;
}

export async function getSeatPaymentStatus(paymentId: string): Promise<{ success: boolean; data: SeatPaymentState }> {
  const res = await api.get(`/staff/seat-payment/${paymentId}`);
  return res.data;
}

/** Re-verifies a specific seat payment directly against M-Pesa — "I definitely paid, check again." */
export async function recheckSeatPayment(paymentId: string): Promise<{ success: boolean; data: SeatPaymentState }> {
  const res = await api.post(`/staff/seat-payment/${paymentId}/recheck`);
  return res.data;
}

/** Recovery path: the owner pastes their M-Pesa confirmation SMS to unblock a seat payment that never activated. */
export async function reconcileSeatPaymentByMessage(message: string): Promise<{ success: boolean; data: SeatPaymentState; message: string }> {
  const res = await api.post('/staff/seat-payment/reconcile', { message });
  return res.data;
}

/** Ends a staff member's active device session immediately (single-device-per-staff enforcement). */
export async function forceLogoutStaff(id: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post(`/staff/${id}/force-logout`);
  return res.data;
}

/** Checks whether an email is already taken — used for the system-generated email field's onBlur check. */
export async function checkStaffEmailAvailability(email: string): Promise<{ available: boolean }> {
  const res = await api.get('/staff/check-email', { params: { email } });
  return res.data.data;
}

/**
 * Staff account-closure requests waiting on the owner.
 *
 * A staff member's records are the shop's books, so closing their account is
 * the owner's call — but only for as long as `meta.approvalWindowDays`, after
 * which an unanswered request goes ahead by itself.
 */
export async function getStaffDeletionRequests(): Promise<{
  success: boolean;
  data: StaffDeletionRequest[];
  meta: { graceDays: number; approvalWindowDays: number };
}> {
  const res = await api.get('/staff/deletion-requests');
  return res.data;
}

/** Approves a closure request, which starts the 14-day cooling-off window. */
export async function approveStaffDeletion(
  id: string
): Promise<{ success: boolean; message: string; data?: { deletionScheduledAt: string; graceDays: number } }> {
  const res = await api.post(`/staff/${id}/deletion-request/approve`);
  return res.data;
}

/**
 * Declines a closure request. The reason is relayed verbatim to the staff
 * member, who is free to ask again.
 */
export async function declineStaffDeletion(
  id: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const res = await api.post(`/staff/${id}/deletion-request/decline`, { reason: reason ?? '' });
  return res.data;
}
