'use client';

const SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js';

declare global {
  interface Window {
    PaystackPop?: {
      setup(options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        channels?: string[];
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }): { openIframe: () => void };
    };
  }
}

let loadPromise: Promise<void> | null = null;

/**
 * Paystack's inline popup script, loaded once and cached. Every subsequent
 * call reuses the same promise instead of injecting the script tag again.
 */
function loadPaystackScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Paystack requires a browser.'));
  if (window.PaystackPop) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Could not load the Paystack payment widget. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/**
 * Opens Paystack's popup for a transaction the server has already priced
 * (amount/reference/currency all come from initiateSubscriptionPayment, not
 * from anything typed here). Resolves once the popup closes — with a
 * reference on success, or null if the owner dismissed it without paying.
 */
export async function openPaystackPopup(options: {
  publicKey: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
}): Promise<string | null> {
  await loadPaystackScript();
  if (!window.PaystackPop) throw new Error('Paystack widget failed to load.');

  return new Promise((resolve) => {
    const handler = window.PaystackPop!.setup({
      key: options.publicKey,
      email: options.email,
      amount: options.amount,
      currency: options.currency,
      ref: options.reference,
      // This is the 'bank' provider (see bankProvider.js) — card is a
      // separate, still-unbuilt provider (cardProvider.js), so don't let
      // Paystack's default popup offer it even if it's enabled on the
      // merchant account.
      channels: ['bank', 'bank_transfer', 'ussd', 'mobile_money'],
      callback: (response) => resolve(response.reference),
      onClose: () => resolve(null),
    });
    handler.openIframe();
  });
}
