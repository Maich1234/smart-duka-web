import type { BillingCycle } from '@/services/subscription';

export type CheckoutProvider = 'mpesa' | 'bank';
export interface CheckoutParams {
  provider?: 'mpesa' | 'bank' | 'card';
  phoneNumber?: string;
  billingCycle: BillingCycle;
  planSlug?: string;
  promoCode?: string;
}
export interface PendingCheckout {
  version: 1;
  key: string;
  provider: CheckoutProvider;
  params: CheckoutParams;
  paymentId?: string;
}
export const CHECKOUT_EVENT = 'duqana:checkout-changed';
const prefix = 'duqana:subscription-checkout:v1:';
const unavailable = '!unavailable!';
export const checkoutScope = (user: { _id: string; role: string; shop: { _id: string } } | null) =>
  user?.role === 'owner' && user._id && user.shop?._id ? `${user._id}:${user.shop._id}` : '';
const storageKey = (scope: string) => prefix + encodeURIComponent(scope);

export function checkoutSnapshot(scope: string): string | null {
  if (!scope || typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(storageKey(scope)); } catch { return unavailable; }
}

export function parseCheckout(raw: string | null): PendingCheckout | null {
  if (raw === null) return null;
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1 || typeof p.key !== 'string' || !p.key || p.key.length > 128
      || !['mpesa', 'bank'].includes(p.provider) || !p.params
      || !['monthly', 'quarterly', 'yearly'].includes(p.params.billingCycle)
      || (p.paymentId != null && (typeof p.paymentId !== 'string' || !/^[a-f\d]{24}$/i.test(p.paymentId)))) throw new Error();
    return p;
  } catch {
    const message = raw === unavailable ? 'Checkout cannot access site storage. Please allow site storage before paying.' : 'We could not restore your payment request. Check your previous payment with support before paying again.';
    throw Object.assign(new Error(message), { response: { status: 409, data: { message } } });
  }
}

export const readCheckout = (scope: string) => parseCheckout(checkoutSnapshot(scope));
function writeCheckout(scope: string, entry: PendingCheckout | null) {
  if (!scope || typeof window === 'undefined') throw new Error('Please sign in again before paying.');
  try {
    if (entry) window.localStorage.setItem(storageKey(scope), JSON.stringify(entry));
    else window.localStorage.removeItem(storageKey(scope));
  } catch {
    throw new Error('Checkout could not save this request. Please allow site storage and try again.');
  }
  window.dispatchEvent(new window.Event(CHECKOUT_EVENT));
}

export function prepareCheckout(scope: string, params: CheckoutParams, key: string): PendingCheckout {
  const existing = readCheckout(scope);
  if (existing) return existing;
  if (params.provider === 'card') throw new Error('Please choose M-Pesa or bank checkout.');
  const entry: PendingCheckout = { version: 1, key, provider: params.provider ?? 'mpesa', params: { ...params } };
  try {
    writeCheckout(scope, entry); // Save before sending any payment request.
  } catch (err) {
    const message = (err as Error).message;
    // This failure occurred before dispatch, unlike a later metadata failure.
    throw Object.assign(new Error(message), { response: { status: 400, data: { message } } });
  }
  return entry;
}

export function recordCheckout(scope: string, key: string, data: { paymentId: string; status: string; provider?: string }) {
  const entry = readCheckout(scope);
  if (!entry || entry.key !== key) return;
  const provider = data.provider === 'bank' ? 'bank' : data.provider === 'mpesa' ? 'mpesa' : entry.provider;
  const updated = { ...entry, provider, paymentId: data.paymentId };
  // Only a fresh server response decides completion; stored data is not proof.
  writeCheckout(scope, ['success', 'failed', 'cancelled'].includes(data.status) ? null : updated);
}

export function recordCheckoutStatus(scope: string, paymentId: string, status: string) {
  const entry = readCheckout(scope);
  if (entry?.paymentId === paymentId && ['success', 'failed', 'cancelled'].includes(status)) writeCheckout(scope, null);
}

export function rememberServerCheckout(scope: string, data: { paymentId: string; provider?: string; billingCycle?: BillingCycle }) {
  // Do not replace a newer local request with an older recovery response.
  const raw = checkoutSnapshot(scope);
  if (raw !== null) {
    try { if (parseCheckout(raw)) return; }
    catch { if (raw === unavailable) return; }
    // An authenticated server record can repair a damaged local copy.
  }
  const provider = data.provider === 'bank' ? 'bank' : 'mpesa';
  writeCheckout(scope, {
    version: 1, key: crypto.randomUUID(), provider,
    params: { provider, billingCycle: data.billingCycle ?? 'monthly' },
    paymentId: data.paymentId,
  });
}
