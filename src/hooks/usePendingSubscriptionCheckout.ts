'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store/authStore';
import { CHECKOUT_EVENT, checkoutScope, checkoutSnapshot, parseCheckout, readCheckout, type CheckoutProvider } from '@/lib/pendingSubscriptionCheckout';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHECKOUT_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHECKOUT_EVENT, onChange);
  };
}
const serverSnapshot = () => null;

export function usePendingSubscriptionCheckout() {
  const scope = useAuthStore(s => checkoutScope(s.user));
  const raw = useSyncExternalStore(subscribe, () => checkoutSnapshot(scope), serverSnapshot);
  return useMemo(() => {
    try { return { scope, pending: parseCheckout(raw), error: null }; }
    catch (err) { return { scope, pending: null, error: (err as Error).message }; }
  }, [raw, scope]);
}

/** Restore only when opening or changing account, never from a stored paid flag. */
export function useRestoreSubscriptionCheckout(isOpen: boolean, provider: CheckoutProvider, actions: {
  reset: () => void;
  restoreUnconfirmed: (paymentId?: string) => void;
}) {
  const scope = useAuthStore(s => checkoutScope(s.user));
  const previousScope = useRef(scope);
  const restored = useRef<string | null>(null);
  const { reset, restoreUnconfirmed } = actions;
  useEffect(() => {
    if (previousScope.current !== scope) {
      previousScope.current = scope;
      restored.current = null;
      reset();
    }
    if (!isOpen) {
      restored.current = null;
      reset();
      return;
    }
    if (!scope) return;
    try {
      const entry = readCheckout(scope);
      if (entry?.provider === provider && entry.key !== restored.current) {
        restored.current = entry.key;
        restoreUnconfirmed(entry.paymentId);
      }
    } catch { /* Checkout preparation reports storage errors before dispatch. */ }
  }, [scope, isOpen, provider, reset, restoreUnconfirmed]);
}
