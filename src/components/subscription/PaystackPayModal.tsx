'use client';

import { useRef, useState } from 'react';
import { CreditCard, XCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SubscriptionPaymentReceipt from './SubscriptionPaymentReceipt';
import Button from '@/components/ui/Button';
import { useStkPoll, type StkStatus } from '@/hooks/useStkPoll';
import { useRestoreSubscriptionCheckout } from '@/hooks/usePendingSubscriptionCheckout';
import { openPaystackPopup } from '@/hooks/usePaystackInline';
import { useAuthStore } from '@/store/authStore';
import {
  initiateSubscriptionPayment,
  getSubscriptionPaymentStatus,
  recheckSubscriptionPayment,
  type BillingCycle,
} from '@/services/subscription';

type Stage = 'input' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

interface PaystackPayModalProps {
  isOpen: boolean;
  /** Already final — the subscription page applies any promo before this is passed in. */
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  planSlug?: string;
  /** Validated on the subscription page; carried through so the owner isn't asked twice. */
  promoCode?: string;
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
 * machine) but the "prompt" step is a Paystack popup instead of a phone PIN,
 * so there's no phone number and no SMS-recovery step — "check status again"
 * against Paystack directly is recovery enough.
 */
export default function PaystackPayModal({
  isOpen,
  amount,
  currency,
  billingCycle,
  planSlug,
  promoCode,
  onClose,
  onSuccess,
}: PaystackPayModalProps) {
  const email = useAuthStore((s) => s.user?.email);
  const [localError, setLocalError] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const recheckRef = useRef(false);

  const stk = useStkPoll({
    initiate: async (idempotencyKey) => {
      const res = await initiateSubscriptionPayment(
        { billingCycle, planSlug, promoCode, provider: 'bank' },
        idempotencyKey
      );
      const { paymentId, status, publicKey, providerRef, amount: amt, currency: cur } = res.data;
      if (status !== 'pending') {
        return { id: paymentId, status: status as StkStatus };
      }
      if (res.data.provider && !['bank', 'free'].includes(res.data.provider)) {
        return { id: paymentId, status: 'pending', errorMessage: 'Please continue checking your existing M-Pesa payment.' };
      }
      if (!publicKey || !providerRef) {
        return { id: paymentId, status: 'pending', errorMessage: 'Payment recorded. Check its status before starting another payment.' };
      }

      try {
        const reference = await openPaystackPopup({
          publicKey,
          email: email ?? '',
          amount: Math.round(amt * 100),
          currency: cur,
          reference: providerRef,
        });
        if (!reference) {
          recheckSubscriptionPayment(paymentId).catch(() => {});
          return { id: paymentId, status: 'pending', errorMessage: 'Payment window closed. Check this attempt before starting another payment.' };
        }
      } catch {
        // The server already reserved this attempt. Preserve its ID even
        // when the external widget cannot load or closes unexpectedly.
        return { id: paymentId, status: 'pending', errorMessage: 'The payment window could not complete. Check this payment’s status before starting another.' };
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
    protectUnconfirmedAttempts: true,
  });

  useRestoreSubscriptionCheckout(isOpen, 'bank', stk);

  const stage: Stage = stk.stage === 'idle' ? 'input' : stk.stage;
  const errorMessage = localError ?? stk.errorMessage;

  const reset = () => {
    stk.reset();
    setLocalError(null);
  };
  const handleClose = () => {
    const confirmed = stage === 'success';
    if (!stk.isUnconfirmed) reset();
    else setLocalError(null);
    if (confirmed) onSuccess();
    else onClose();
  };
  const handleSuccess = () => {
    reset();
    onSuccess();
  };

  const pay = () => {
    setLocalError(null);
    stk.start();
  };

  const recheck = async () => {
    if (!stk.id || recheckRef.current) return;
    recheckRef.current = true;
    setRechecking(true);
    setLocalError(null);
    try {
      const res = await recheckSubscriptionPayment(stk.id);
      stk.resolveExternally({ id: res.data.paymentId, status: res.data.status as StkStatus, receipt: res.data.receipt, errorMessage: res.data.errorMessage });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setLocalError(e.response?.data?.message ?? 'Could not check the payment status.');
    } finally {
      recheckRef.current = false;
      setRechecking(false);
    }
  };

  const isBusy = stage === 'initiating' || stage === 'pending';
  const isTerminalFailure = stage === 'failed' || stage === 'cancelled' || stage === 'timeout';

  return (
    <Modal isOpen={isOpen} onClose={isBusy || rechecking ? () => {} : handleClose} title="Pay with card or bank">
      {stage === 'input' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#0F766E' }}>
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            A secure Paystack window will open for{' '}
            <span className="font-semibold" style={{ color: '#0F172A' }}>{fmt(amount, currency)}</span>.
          </p>

          <Button onClick={pay} className="w-full">{`Pay ${fmt(amount, currency)}`}</Button>
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
          {errorMessage && <p className="mt-3 text-xs text-amber-700" role="status">{errorMessage}</p>}
        </div>
      )}

      {stage === 'success' && <SubscriptionPaymentReceipt paymentId={stk.id} provider="Paystack" onDone={handleSuccess} />}

      {isTerminalFailure && (
        <div className="flex flex-col items-center text-center py-2" role={stk.isUnconfirmed ? 'status' : 'alert'}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${stk.isUnconfirmed ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            {stage === 'cancelled' ? <XCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>
            {stk.isUnconfirmed ? 'Still awaiting confirmation' : stage === 'cancelled' ? 'Payment cancelled' : 'Payment failed'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {errorMessage ?? (stage === 'cancelled' ? 'The payment window was closed.' : 'We could not confirm this payment. If you were charged, check its status before trying again.')}
          </p>
          {stk.id ? (
            <Button onClick={recheck} disabled={rechecking} className="w-full">{rechecking ? 'Checking…' : 'Check payment status'}</Button>
          ) : stk.initiationUncertain ? (
            <Button onClick={() => { setLocalError(null); stk.start(); }} className="w-full">Recover payment request</Button>
          ) : null}
          {!stk.isUnconfirmed && <Button onClick={reset} disabled={rechecking} className="w-full mt-3">Start another payment</Button>}
          <button onClick={handleClose} disabled={rechecking} className="mt-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
        </div>
      )}
    </Modal>
  );
}
