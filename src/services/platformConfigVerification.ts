import adminApi from '@/lib/adminApi';

/**
 * Step-up gate for platform Daraja/Paystack credentials (Dukana's own, not a
 * shop's). Unlike the shop-level flow in services/paymentConfig.ts, the code
 * is emailed to a fixed approver inbox — never the requesting admin's own —
 * so the admin here must obtain it from that approver out of band.
 *
 * The returned token lives in React state only. Persisting it would defeat
 * the point of re-verifying each session.
 */

export async function requestPlatformConfigVerification(): Promise<{ sessionId: string }> {
  const res = await adminApi.post('/platform-config/verification/request');
  return res.data.data;
}

/** Rate limited to 8 attempts / 30 minutes. Returns the platform-config token. */
export async function verifyPlatformConfigCode(sessionId: string, code: string): Promise<string> {
  const res = await adminApi.post('/platform-config/verification/verify', { sessionId, code });
  return res.data.data.verificationToken;
}
