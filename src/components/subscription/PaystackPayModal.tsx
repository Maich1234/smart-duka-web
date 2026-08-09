'use client';

import { useState } from 'react';
import { CreditCard, Check, XCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useStkPoll, type StkStatus } from '@/hooks/useStkPoll';
import { openPaystackPopup } from '@/hooks/usePaystackInline';
import { useAuthStore } from '@/store/authStore';
import {
  initiateSubscriptionPayment,
  getSubscriptionPaymentStatus,
  recheckSubscriptionPayment,
  validatePromo,
  type BillingCycle,
} from '@/services/subscription';

type Stage = 'input' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

interface Promo {
  code: string;
  title: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

interface PaystackPayModalProps {
  isOpen: boolean;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  planSlug?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const POLL_INTERVAL_MS = 3000;
// Longer than the M-Pesa modal's window — Paystack's popup waits on the
// owner typing card/bank details, not a phone PIN prompt with its own
// short-lived expiry.
const POLL_TIMEOUT_MS = 180_000;

const fmt = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`;

/**
 * Card / bank transfer subscription payment via Paystack's inline popup.
 * Structurally a sibling of SubscriptionPayModal (same useStkPoll state
 * machine, same promo-code UI) but the "prompt" step is a Paystack popup
 * instead of a phone PIN, so there's no phone number and no SMS-recovery
 * step — "check status again" against Paystack directly is recovery enough.
 */
export default function PaystackPayModal({
  isOpen,
  amount,
  currency,
  billingCycle,
  planSlug,
  onClose,
  onSuccess,
}: PaystackPayModalProps) {
  const email = useAuthStore((s) => s.user?.email);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);

  const stk = useStkPoll({
    initiate: async (idempotencyKey) => {
      const res = await initiateSubscriptionPayment(
        { billingCycle, planSlug, promoCode: promo?.code, provider: 'bank' },
        idempotencyKey
      );
      const { paymentId, status, publicKey, providerRef, amount: amt, currency: cur } = res.data;
      if (status !== 'pending') {
        return { id: paymentId, status: status as StkStatus };
      }
      if (!publicKey) {
        throw new Error('Card and bank payments are not configured yet. Please pay with M-Pesa for now.');
      }

      const reference = await openPaystackPopup({
        publicKey,
        email: email ?? '',
        amount: Math.round(amt * 100),
        currency: cur,
        reference: providerRef,
      });

      if (!reference) {
        return { id: paymentId, status: 'cancelled', errorMessage: 'Payment window closed before it was completed.' };
      }

      // The popup's own success callback isn't proof of anything by itself —
      // it only means Paystack told the browser it went through. Nudge the
      // server to verify directly right away instead of waiting for the next
      // poll tick or the async webhook to catch up.
      recheckSubscriptionPayment(paymentId).catch(() => {});
      return { id: paymentId, status: 'pending' };
    },
    poll: async (paymentId) => {
      const res = await getSubscriptionPaymentStatus(paymentId);
      return {
        status: res.data.status as StkStatus,
        receipt: res.data.receipt,
        errorMessage: res.data.errorMessage,
      };
    },
    intervalMs: POLL_INTERVAL_MS,
    timeoutMs: POLL_TIMEOUT_MS,
  });

  const stage: Stage = stk.stage === 'idle' ? 'input' : stk.stage;
  const receipt = stk.receipt;
  const errorMessage = localError ?? stk.errorMessage;

  const reset = () => {
    stk.reset();
    setLocalError(null);
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const handleSuccess = () => {
    reset();
    onSuccess();
  };

  const pay = () => {
    setLocalError(null);
    stk.start();
  };

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code || promoChecking) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const res = await validatePromo(code);
      setPromo(res.data);
      setPromoInput('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPromoError(e.response?.data?.message ?? 'That promo code is invalid or has expired.');
    } finally {
      setPromoChecking(false);
    }
  };

  const discount = promo
    ? promo.discountType === 'percentage'
      ? Math.round(amount * (promo.discountValue / 100))
      : Math.min(Math.round(promo.discountValue), amount)
    : 0;
  const payable = Math.max(0, amount - discount);

  const recheck = async () => {
    if (!stk.id || rechecking) return;
    setRechecking(true);
    setLocalError(null);
    try {
      const res = await recheckSubscriptionPayment(stk.id);
      if (res.data.status === 'success') {
        stk.resolveExternally({ status: 'success', receipt: res.data.receipt });
      } else if (res.data.status !== 'pending') {
        stk.resolveExternally({ status: res.data.status as StkStatus, errorMessage: res.data.errorMessage });
      } else {
        setLocalError('Still not confirmed with Paystack. Try again in a moment.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setLocalError(e.response?.data?.message ?? 'Could not check the payment status.');
    } finally {
      setRechecking(false);
    }
  };

  const isBusy = stage === 'initiating' || stage === 'pending';
  const isTerminalFailure = stage === 'failed' || stage === 'cancelled' || stage === 'timeout';

  return (
    <Modal isOpen={isOpen} onClose={isBusy ? () => {} : handleClose} title="Pay with card or bank">
      {stage === 'input' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#0F766E' }}>
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            A secure Paystack window will open for{' '}
            <span className="font-semibold" style={{ color: '#0F172A' }}>{fmt(amount, currency)}</span>.
          </p>

          {promo ? (
            <div className="w-full flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ backgroundColor: '#E6F4EA' }}>
              <Check className="w-4 h-4 shrink-0" style={{ color: '#15803D' }} />
              <span className="flex-1 text-left text-sm font-semibold" style={{ color: '#15803D' }}>
                {promo.code} · −{fmt(discount, currency)}
              </span>
              <button
                onClick={() => { setPromo(null); setPromoError(null); }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="w-full mb-4">
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                  placeholder="Promo code (optional)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                  style={{ color: '#0F172A' }}
                />
                <button
                  onClick={applyPromo}
                  disabled={!promoInput.trim() || promoChecking}
                  className="px-4 rounded-xl border text-sm font-semibold disabled:opacity-40"
                  style={{ color: '#0F766E', borderColor: '#0F766E' }}
                >
                  {promoChecking ? '…' : 'Apply'}
                </button>
              </div>
              {promoError && <p className="mt-2 text-left text-xs text-red-600">{promoError}</p>}
            </div>
          )}

          <Button onClick={pay} className="w-full">{`Pay ${fmt(payable, currency)}`}</Button>
          <button onClick={handleClose} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Not now</button>
        </div>
      )}

      {isBusy && (
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#0F766E' }}>
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>
            {stage === 'initiating' ? 'Complete your payment' : 'Confirming payment…'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {stage === 'initiating'
              ? `Finish paying ${fmt(amount, currency)} in the window that opened.`
              : 'This updates automatically once Paystack confirms.'}
          </p>
          {stage === 'pending' && (
            <button
              onClick={recheck}
              disabled={rechecking}
              className="text-sm font-semibold hover:underline disabled:opacity-50"
              style={{ color: '#0F766E' }}
            >
              {rechecking ? 'Checking…' : 'Check status now'}
            </button>
          )}
          {errorMessage && <p className="mt-3 text-xs text-red-600">{errorMessage}</p>}
        </div>
      )}

      {stage === 'success' && (
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-green-600">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Payment received</h3>
          <p className="text-sm text-gray-500 mb-4">
            {fmt(amount, currency)} paid{receipt ? ` · Ref ${receipt}` : ''}.<br />Your subscription is active.
          </p>
          <Button onClick={handleSuccess} className="w-full">Done</Button>
        </div>
      )}

      {isTerminalFailure && (
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-red-50">
            {stage === 'cancelled' ? <XCircle className="w-8 h-8 text-red-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>
            {stage === 'cancelled' ? 'Payment cancelled' : stage === 'timeout' ? 'Taking longer than expected' : 'Payment failed'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {errorMessage ?? (stage === 'cancelled' ? 'The payment window was closed.' : 'The payment did not go through. No money was taken.')}
          </p>
          <Button onClick={reset} className="w-full">Try again</Button>
          {stage === 'timeout' && (
            <button
              onClick={recheck}
              disabled={rechecking}
              className="mt-3 text-sm font-semibold hover:underline disabled:opacity-50"
              style={{ color: '#0F766E' }}
            >
              {rechecking ? 'Checking…' : 'I already paid — check again'}
            </button>
          )}
          <button onClick={handleClose} className="mt-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
        </div>
      )}
    </Modal>
  );
}
