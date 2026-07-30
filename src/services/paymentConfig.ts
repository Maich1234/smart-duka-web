import api from '@/lib/api';

/**
 * M-Pesa Business (Daraja) credentials.
 *
 * Reading or changing these needs an `X-Verification-Token` on top of the
 * normal session — a short-lived JWT with `purpose: 'payment_config'` that
 * the owner gets by passing an OTP. The credentials can move a shop's money,
 * so a borrowed signed-in browser isn't enough on its own.
 *
 * The token lives in React state only. Persisting it would defeat the point
 * of re-verifying.
 */

export type OtpMethod = 'sms' | 'email';

export interface MpesaConfigStatus {
  enabled: boolean;
  environment: 'sandbox' | 'production' | null;
  businessName: string | null;
  shortcode: string | null;
  isConfigured: boolean;
  /** True when the initiator credentials needed for refunds are set. */
  refundsConfigured?: boolean;
}

export interface MpesaConfigDetails {
  enabled: boolean;
  environment: 'sandbox' | 'production';
  businessName: string;
  shortcode: string;
  consumerKeySet: boolean;
  consumerSecretSet: boolean;
  passkeySet: boolean;
  consumerKeyMasked: string | null;
  consumerSecretMasked: string | null;
  passkeyMasked: string | null;
  initiatorName?: string;
  securityCredentialSet?: boolean;
  securityCredentialMasked?: string | null;
  configuredAt: string | null;
}

export interface SaveMpesaConfigPayload {
  environment: 'sandbox' | 'production';
  businessName: string;
  shortcode: string;
  consumerKey?: string;
  consumerSecret?: string;
  passkey?: string;
  /** Daraja operator username — required for refunds. */
  initiatorName?: string;
  /** RSA-encrypted initiator password from the Daraja portal. */
  securityCredential?: string;
}

/** Connected or not. No credentials, so any authenticated user may read it. */
export async function getPaymentStatus(): Promise<MpesaConfigStatus> {
  const res = await api.get('/payment-config/status');
  return res.data.data?.mpesa;
}

export async function getPaymentConfig(verificationToken: string): Promise<MpesaConfigDetails> {
  const res = await api.get('/payment-config', {
    headers: { 'X-Verification-Token': verificationToken },
  });
  return res.data.data.mpesa;
}

export async function saveMpesaConfig(
  payload: SaveMpesaConfigPayload,
  verificationToken: string
): Promise<{ success: boolean; message: string }> {
  const res = await api.put('/payment-config/mpesa', payload, {
    headers: { 'X-Verification-Token': verificationToken },
  });
  return res.data;
}

export async function disconnectMpesa(
  verificationToken: string
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete('/payment-config/mpesa', {
    headers: { 'X-Verification-Token': verificationToken },
  });
  return res.data;
}

/** Rate limited to 3 per 10 minutes per user — surface a 429, don't retry. */
export async function requestOtp(method: OtpMethod): Promise<{
  sessionId: string;
  sentTo: string;
  method: OtpMethod;
}> {
  const res = await api.post('/otp/request', { method });
  return res.data.data;
}

/** Rate limited to 10 per 10 minutes. Returns the payment-config token. */
export async function verifyOtp(sessionId: string, code: string): Promise<string> {
  const res = await api.post('/otp/verify', { sessionId, code });
  return res.data.data.verificationToken;
}
