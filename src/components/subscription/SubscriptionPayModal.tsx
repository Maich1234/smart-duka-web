'use client';

import { useState } from 'react';
import { Smartphone, Check, XCircle, Clock, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useStkPoll, type StkStatus } from '@/hooks/useStkPoll';
import {
  initiateSubscriptionPayment,
  getSubscriptionPaymentStatus,
  reconcileSubscriptionByMessage,
  validatePromo,
  type BillingCycle,
} from '@/services/subscription';

/**
 * The STK stages come from useStkPoll; 'input' and 'recover' are this
 * screen's own steps either side of it.
 */
type Stage = 'input' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout' | 'recover';

interface Promo {
  code: string;
  title: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

interface SubscriptionPayModalProps {
  isOpen: boolean;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  planSlug?: string;
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
  defaultPhone,
  onClose,
  onSuccess,
}: SubscriptionPayModalProps) {
  const [digits, setDigits] = useState(() => (defaultPhone ?? '').replace(/^\+?254/, '').replace(/\D/g, '').slice(0, 9));
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  // Kept so the recovery path can tell the owner which attempt it is chasing.
  const [smsText, setSmsText] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const stk = useStkPoll({
    initiate: async (idempotencyKey) => {
      const res = await initiateSubscriptionPayment(
        { phoneNumber: `+254${digits}`, billingCycle, planSlug, promoCode: promo?.code },
        idempotencyKey
      );
      return { id: res.data.paymentId, status: res.data.status as StkStatus };
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

  // The hook owns the STK stages; 'input' and 'recover' sit either side of it.
  const stage: Stage = recoverOpen ? 'recover' : stk.stage === 'idle' ? 'input' : stk.stage;
  const receipt = stk.receipt;
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
    reset();
    onClose();
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

  // Display-only. The server recomputes the real amount from the code itself,
  // so a tampered discount here changes nothing that gets charged.
  const discount = promo
    ? promo.discountType === 'percentage'
      ? Math.round(amount * (promo.discountValue / 100))
      : Math.min(Math.round(promo.discountValue), amount)
    : 0;
  const payable = Math.max(0, amount - discount);

  /**
   * Last-resort recovery: the owner pastes their M-Pesa confirmation SMS.
   * The text only helps the server find the right pending payment — it always
   * re-verifies with Safaricom directly, so a forged message proves nothing.
   */
  const recoverFromSms = async () => {
    if (!smsText.trim() || recovering) return;
    setRecovering(true);
    setLocalError(null);
    try {
      const res = await reconcileSubscriptionByMessage(smsText);
      if (res.data.status === 'success') {
        setRecoverOpen(false);
        stk.resolveExternally({ status: 'success', receipt: res.data.receipt });
      } else {
        setLocalError(res.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setLocalError(e.response?.data?.message ?? 'We could not verify that payment. Please contact support.');
    } finally {
      setRecovering(false);
    }
  };

  const isBusy = stage === 'initiating' || stage === 'pending';
  const isTerminalFailure = stage === 'failed' || stage === 'cancelled' || stage === 'timeout';

  return (
    <Modal isOpen={isOpen} onClose={isBusy ? () => {} : handleClose} title="Pay with M-Pesa">
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
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
              style={{ color: '#0F172A' }}
            />
          </div>
          {/* Promo code. Only the code travels to the server; the discount
              shown here is presentational. */}
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

          <Button onClick={pay} disabled={!phoneValid} className="w-full">{`Pay ${fmt(payable, currency)}`}</Button>
          <button onClick={handleClose} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Not now</button>
        </div>
      )}

      {isBusy && (
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#0F766E' }}>
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>{stage === 'initiating' ? 'Sending request…' : 'Check your phone'}</h3>
          <p className="text-sm text-gray-500">
            {stage === 'initiating'
              ? `Starting an M-Pesa payment of ${fmt(amount, currency)}.`
              : `Enter your M-Pesa PIN on +254${digits} to pay ${fmt(amount, currency)}.`}
          </p>
        </div>
      )}

      {stage === 'success' && (
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-green-600">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Payment received</h3>
          <p className="text-sm text-gray-500 mb-4">
            {fmt(amount, currency)} paid{receipt ? ` · Receipt ${receipt}` : ''}.<br />Your subscription is active.
          </p>
          <Button onClick={handleSuccess} className="w-full">Done</Button>
        </div>
      )}

      {isTerminalFailure && (
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-red-50">
            {stage === 'cancelled' ? <XCircle className="w-8 h-8 text-red-600" /> : stage === 'timeout' ? <Clock className="w-8 h-8 text-red-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>
            {stage === 'cancelled' ? 'Payment cancelled' : stage === 'timeout' ? 'Request timed out' : 'Payment failed'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {errorMessage ?? (stage === 'cancelled' ? 'The M-Pesa prompt was dismissed.' : 'The payment did not go through. No money was taken.')}
          </p>
          <Button onClick={backToInput} className="w-full">Try again</Button>
          {/* The failure that actually strands people is a Safaricom callback
              that never arrives: money left the till but the subscription
              stayed locked. This is the way out. */}
          <button
            onClick={() => { setLocalError(null); setRecoverOpen(true); }}
            className="mt-3 text-sm font-semibold hover:underline"
            style={{ color: '#0F766E' }}
          >
            I already paid — verify my payment
          </button>
          <button onClick={handleClose} className="mt-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
        </div>
      )}

      {stage === 'recover' && (
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 mb-3">
            Paste the confirmation SMS Safaricom sent you. We&apos;ll check the payment directly with M-Pesa.
          </p>
          <textarea
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
          <button onClick={backToInput} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Back</button>
        </div>
      )}
    </Modal>
  );
}
