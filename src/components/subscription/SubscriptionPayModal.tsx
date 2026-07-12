'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, Check, XCircle, Clock, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  initiateSubscriptionPayment,
  getSubscriptionPaymentStatus,
  type BillingCycle,
} from '@/services/subscription';

type Stage = 'input' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

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
  const [stage, setStage] = useState<Stage>('input');
  const [digits, setDigits] = useState(() => (defaultPhone ?? '').replace(/^\+?254/, '').replace(/\D/g, '').slice(0, 9));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const reset = () => {
    stopPolling();
    setStage('input');
    setErrorMessage(null);
    setReceipt(null);
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

  const startPolling = (paymentId: string) => {
    startedAtRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setStage('timeout');
        setErrorMessage('The payment request expired before it was confirmed.');
        return;
      }
      try {
        const res = await getSubscriptionPaymentStatus(paymentId);
        const { status, receipt: rcpt, errorMessage: err } = res.data;
        if (status === 'pending') return;
        stopPolling();
        setReceipt(rcpt);
        setErrorMessage(err);
        setStage(status);
      } catch {
        // Network jitter — keep polling silently until the timeout.
      }
    }, POLL_INTERVAL_MS);
  };

  const pay = async () => {
    if (!phoneValid) return;
    setStage('initiating');
    setErrorMessage(null);
    try {
      const res = await initiateSubscriptionPayment(
        { phoneNumber: `+254${digits}`, billingCycle, planSlug },
        crypto.randomUUID()
      );
      if (res.data.status === 'pending') {
        setStage('pending');
        startPolling(res.data.paymentId);
      } else {
        setStage(res.data.status);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setStage('failed');
      setErrorMessage(e.response?.data?.message ?? 'Could not start the payment. Check your connection and try again.');
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
          <Button onClick={pay} disabled={!phoneValid} className="w-full">{`Pay ${fmt(amount, currency)}`}</Button>
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
          <Button onClick={() => setStage('input')} className="w-full">Try again</Button>
          <button onClick={handleClose} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Close</button>
        </div>
      )}
    </Modal>
  );
}
