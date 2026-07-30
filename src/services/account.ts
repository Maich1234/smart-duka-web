import api from '@/lib/api';

/**
 * Account closure, mirroring the mobile app's services/auth.ts.
 *
 * Google Play requires an app offering account creation to provide deletion
 * both in-app and at a public web URL. /delete-account covers the public
 * half; this covers the signed-in half.
 */

export interface AccountDeletionPreview {
  role: 'owner' | 'staff';
  /** True when deleting also destroys the shop and every staff account in it. */
  cascades: boolean;
  staffAccountsRemoved: number;
  shopName: string | null;
  retainedForBookkeeping: string[];
  /** Cooling-off window before anything is actually destroyed. */
  graceDays: number;
  /** Set once a closure is scheduled and counting down. */
  deletionScheduledAt: string | null;
  /** True for staff: the shop owner signs off before the clock starts. */
  requiresOwnerApproval: boolean;
  /** How long the owner has to answer before the request proceeds anyway. */
  approvalWindowDays: number;
  /** A staff request is filed and sitting with the owner. */
  awaitingOwnerApproval: boolean;
  deletionRequestedAt: string | null;
}

export interface DeleteAccountResult {
  success: boolean;
  message: string;
  data: {
    deletionScheduledAt: string | null;
    graceDays: number;
    awaitingOwnerApproval?: boolean;
    deletionRequestedAt?: string;
    approvalWindowDays?: number;
  };
}

/**
 * What closing this account will actually destroy. Owners are routinely
 * unaware it takes the whole shop and every staff account with it, so the
 * confirmation states real consequences instead of a generic warning.
 */
export async function previewAccountDeletion(): Promise<AccountDeletionPreview> {
  const res = await api.get('/auth/me/deletion-preview');
  return res.data.data;
}

/**
 * Schedules closure. Nothing is destroyed today — the account keeps working
 * through the grace window and can be restored with one click.
 *
 * For staff this only *files* the request; the owner approves it before the
 * clock starts, signalled by `awaitingOwnerApproval` with a null
 * `deletionScheduledAt`.
 *
 * Shares the password-reset rate limiter (5 attempts / 15 min), so a few
 * wrong passwords produce a 429 rather than another "incorrect password".
 */
export async function deleteAccount(password: string): Promise<DeleteAccountResult> {
  const res = await api.delete('/auth/me', { data: { password, confirm: 'DELETE' } });
  return res.data;
}

/**
 * Calls off a scheduled closure, or withdraws a staff request the owner
 * hasn't answered. No password: the user is already signed in, and backing
 * out of something destructive should be effortless.
 */
export async function cancelAccountDeletion(): Promise<{ success: boolean; message: string }> {
  const res = await api.post('/auth/me/restore');
  return res.data;
}
