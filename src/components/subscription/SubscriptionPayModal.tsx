'use client';

import { useRef, useState } from 'react';
import { Smartphone, XCircle, Clock, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import SubscriptionPaymentReceipt from './SubscriptionPaymentReceipt';
import Button from '@/components/ui/Button';
import { useStkPoll, type StkStatus } from '@/hooks/useStkPoll';
import {
  initiateSubscriptionPayment,
  getSubscriptionPaymentStatus,
  recheckSubscriptionPayment,
  reconcileSubscriptionByMessage,
  type BillingCycle,
} from '@/services/subscription';

/**
 * The STK stages come from useStkPoll; 'input' and 'recover' are this
 * screen's own steps either side of it.
 */
type Stage = 'input' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout' | 'recover';

interface SubscriptionPayModalProps {
  isOpen: boolean;
  /** Already final — the subscription page applies any promo before this is passed in. */
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  planSlug?: string;
  /** Validated on the subscription page; carried through so the owner isn't asked twice. */
  promoCode?: string;
  /** Prefill — the owner usually pays with their own line. */
  defaultPhone?: string;
  onClose: () => void;
  /** Called after the user acknowledges a successful payment. */
  onSuccess: () => void;
}

const POLL_INTERVAL_MS = 3500;
const POLL_TIMEOUT_MS = 120_000;

const fmt = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`;

/**
 * Owner-facing M-PESA STK Push flow for subscription payments, ported from
 * the mobile app's SubscriptionPayModal. The amount is displayed but never
 * sent — the server recomputes it. One idempotency key per attempt so a
 * retried initiate never double-prompts the phone.
 */
export default function SubscriptionPayModal({
  isOpen,
  amount,
  currency,
  billingCycle,
  planSlug,
  promoCode,
  defaultPhone,
  onClose,
  onSuccess,
}: SubscriptionPayModalProps) {
  const [digits, setDigits] = useState(() => (defaultPhone ?? '').replace(/^\+?254/, '').replace(/\D/g, '').slice(0, 9));
  // Kept so the recovery path can tell the owner which attempt it is chasing.
  const [smsText, setSmsText] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const verificationRef = useRef(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const stk = useStkPoll({
    initiate: async (idempotencyKey) => {
      const res = await initiateSubscriptionPayment(
        { phoneNumber: `+254${digits}`, billingCycle, planSlug, promoCode },
        idempotencyKey
      );
      return { id: res.data.paymentId, status: res.data.status as StkStatus, receipt: res.data.receipt, errorMessage: res.data.errorMessage };
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

  // The hook owns the STK stages; 'input' and 'recover' sit either side of it.
  const stage: Stage = recoverOpen ? 'recover' : stk.stage === 'idle' ? 'input' : stk.stage;
  const errorMessage = localError ?? stk.errorMessage;

  const backToInput = () => {
    stk.reset();
    setRecoverOpen(false);
    setLocalError(null);
  };

  const reset = () => {
    backToInput();
    setSmsText('');
  };
  const handleClose = () => {
    const confirmed = stage === 'success';
    if (!stk.isUnconfirmed) reset();
    else { setRecoverOpen(false); setLocalError(null); }
    if (confirmed) onSuccess();
    else onClose();
  };
  const handleSuccess = () => {
    reset();
    onSuccess();
  };

  const phoneValid = /^[17]\d{8}$/.test(digits);

  const pay = () => {
    if (!phoneValid) return;
    setLocalError(null);
    stk.start();
  };

  /**
   * Last-resort recovery: the owner pastes their M-Pesa confirmation SMS.
   * The text only helps the server find the right pending payment — it always
   * re-verifies with Safaricom directly, so a forged message proves nothing.
   */
  const recoverFromSms = async () => {
    if (!smsText.trim() || verificationRef.current) return;
    verificationRef.current = true;
    setRecovering(true);
    setLocalError(null);
    try {
      const res = await reconcileSubscriptionByMessage(smsText);
      if (res.data.status === 'success') {
        setRecoverOpen(false);
        stk.resolveExternally({ id: res.data.paymentId, status: 'success', receipt: res.data.receipt });
      } else {
        setLocalError(res.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setLocalError(e.response?.data?.message ?? 'We could not verify that payment. Please contact support.');
    } finally {
      verificationRef.current = false;
      setRecovering(false);
    }
  };

  const recheck = async () => {
    if (!stk.id || verificationRef.current) return;
    verificationRef.current = true;
    setRechecking(true);
    setLocalError(null);
    try {
      const res = await recheckSubscriptionPayment(stk.id);
      stk.resolveExternally({ id: res.data.paymentId, status: res.data.status as StkStatus, receipt: res.data.receipt, errorMessage: res.data.errorMessage });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setLocalError(e.response?.data?.message ?? 'We could not check this payment. Please try checking again.');
    } finally {
      verificationRef.current = false;
      setRechecking(false);
    }
  };

  const isBusy = stage === 'initiating' || stage === 'pending';
  const isTerminalFailure = stage === 'failed' || stage === 'cancelled' || stage === 'timeout';

  return (
    <Modal isOpen={isOpen} onClose={isBusy || rechecking || recovering ? () => {} : handleClose} title="Pay with M-Pesa">
      {stage === 'input' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#0F766E' }}>
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            We&apos;ll send a payment prompt of <span className="font-semibold" style={{ color: '#0F172A' }}>{fmt(amount, currency)}</span> to your phone.
          </p>
          <div className="flex gap-2 w-full mb-4">
            <div className="flex items-center px-4 rounded-xl border border-gray-200 bg-gray-50">
              <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>+254</span>
            </div>
            <input
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="712345678"
              inputMode="numeric"
              maxLength={9}
              autoFocus
              aria-label="M-Pesa phone number"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
              style={{ color: '#0F172A' }}
            />
          </div>
          <Button onClick={pay} disabled={!phoneValid} className="w-full">{`Pay ${fmt(amount, currency)}`}</Button>
          <button onClick={handleClose} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Not now</button>
        </div>
      )}

      {isBusy && (
        <div className="flex flex-col items-center text-center py-2" role="status" aria-live="polite">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#0F766E' }}>
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>{stage === 'initiating' ? 'Checking payment request…' : 'Awaiting payment confirmation'}</h3>
          <p className="text-sm text-gray-500">
            {stage === 'initiating'
              ? 'Please wait while we check your payment request.'
              : errorMessage ?? 'If an M-Pesa prompt appears, enter your PIN. We will confirm the payment here.'}
          </p>
          {stk.id && <Button onClick={recheck} disabled={rechecking} className="w-full mt-4">{rechecking ? 'Checking…' : 'Check payment status'}</Button>}
        </div>
      )}

      {stage === 'success' && <SubscriptionPaymentReceipt paymentId={stk.id} provider="M-Pesa" onDone={handleSuccess} />}

      {isTerminalFailure && (
        <div className="flex flex-col items-center text-center py-2" role={stk.isUnconfirmed ? 'status' : 'alert'}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${stk.isUnconfirmed ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            {stage === 'cancelled' ? <XCircle className="w-8 h-8" /> : stage === 'timeout' ? <Clock className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>
            {stk.isUnconfirmed ? 'Still awaiting confirmation' : stage === 'cancelled' ? 'Payment cancelled' : 'Payment failed'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {errorMessage ?? (stage === 'cancelled' ? 'The M-Pesa prompt was dismissed.' : 'We could not confirm this payment. If you were charged, check its status before trying again.')}
          </p>
          {stk.id ? (
            <Button onClick={recheck} disabled={rechecking} className="w-full">{rechecking ? 'Checking…' : 'Check payment status'}</Button>
          ) : stk.initiationUncertain ? (
            <Button onClick={() => { setLocalError(null); stk.start(); }} className="w-full">Recover payment request</Button>
          ) : null}
          {!stk.isUnconfirmed && <Button onClick={backToInput} disabled={rechecking} className="w-full mt-3">Start another payment</Button>}
          {/* The failure that actually strands people is a Safaricom callback
              that never arrives: money left the till but the subscription
              stayed locked. This is the way out. */}
          <button
            onClick={() => { if (!verificationRef.current) { setLocalError(null); setRecoverOpen(true); } }}
            disabled={rechecking}
            className="mt-3 text-sm font-semibold hover:underline"
            style={{ color: '#0F766E' }}
          >
            I already paid: verify my payment
          </button>
          <button onClick={handleClose} disabled={rechecking} className="mt-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
        </div>
      )}

      {stage === 'recover' && (
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 mb-3">
            Paste the confirmation SMS Safaricom sent you. We&apos;ll check the payment directly with M-Pesa.
          </p>
          <textarea
            aria-label="M-Pesa confirmation SMS"
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            rows={4}
            placeholder="QWE1RT2Y3U Confirmed. Ksh1,000.00 sent to…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
            style={{ color: '#0F172A' }}
          />
          {errorMessage && <p className="mt-2 text-xs text-red-600">{errorMessage}</p>}
          <Button onClick={recoverFromSms} disabled={!smsText.trim() || recovering} className="w-full mt-4">
            {recovering ? 'Checking with M-Pesa…' : 'Verify payment'}
          </Button>
          <button onClick={() => { setRecoverOpen(false); setLocalError(null); }} disabled={recovering} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Back</button>
        </div>
      )}
    </Modal>
  );
}
