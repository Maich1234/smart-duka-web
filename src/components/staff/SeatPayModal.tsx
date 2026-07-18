'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, Check, XCircle, Clock, AlertCircle, MessageSquareText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  initiateSeatPayment,
  getSeatPaymentStatus,
  recheckSeatPayment,
  reconcileSeatPaymentByMessage,
  type StaffDraft,
  type Staff,
  type SeatPaymentStatus,
} from '@/services/staff';
import { useAuthStore } from '@/store/authStore';
import { isSystemGeneratedEmail } from '@/utils/staffEmailSlug';

type Stage = 'input' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

interface SeatPayModalProps {
  isOpen: boolean;
  amount: number;
  currency: string;
  staffDraft: StaffDraft;
  /** Prefill — the owner usually pays with their own line. */
  defaultPhone?: string;
  onClose: () => void;
  /** Called once the staff member has actually been created (paid, or free if the seat opened up). */
  onSuccess: (staff: Staff) => void;
}

const POLL_INTERVAL_MS = 3500;
const POLL_TIMEOUT_MS = 120_000;

const fmt = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`;

/**
 * Owner-facing M-Pesa STK Push flow for buying one additional staff seat —
 * ported from SubscriptionPayModal's pattern, plus a "paste M-Pesa message"
 * recovery step (the subscription modal doesn't have one yet; this one does).
 * The amount is displayed but never sent — the server recomputes it, and if
 * the seat turns out to already be covered by the time this runs, the staff
 * is created directly with no charge at all.
 */
export default function SeatPayModal({
  isOpen,
  amount,
  currency,
  staffDraft,
  defaultPhone,
  onClose,
  onSuccess,
}: SeatPayModalProps) {
  const shopName = useAuthStore((s) => s.user?.shop?.name) ?? '';
  const canSignInImmediately = isSystemGeneratedEmail(staffDraft.email, shopName);
  const [stage, setStage] = useState<Stage>('input');
  const [digits, setDigits] = useState(() => (defaultPhone ?? '').replace(/^\+?254/, '').replace(/\D/g, '').slice(0, 9));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const [showPasteSheet, setShowPasteSheet] = useState(false);
  const [pastedMessage, setPastedMessage] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [verifyingPaste, setVerifyingPaste] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const createdStaffRef = useRef<Staff | null>(null);

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
    setPaymentId(null);
    setRechecking(false);
    setShowPasteSheet(false);
    setPastedMessage('');
    setPasteError(null);
    setVerifyingPaste(false);
    createdStaffRef.current = null;
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const handleSuccess = () => {
    const staff = createdStaffRef.current;
    reset();
    if (staff) onSuccess(staff);
  };

  const phoneValid = /^[17]\d{8}$/.test(digits);

  const startPolling = (id: string) => {
    startedAtRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setStage('timeout');
        setErrorMessage('The payment request expired before it was confirmed.');
        return;
      }
      try {
        const res = await getSeatPaymentStatus(id);
        const { status, receipt: rcpt, errorMessage: err, staff } = res.data;
        if (status === 'pending') return;
        stopPolling();
        setReceipt(rcpt);
        setErrorMessage(err);
        if (staff) createdStaffRef.current = staff;
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
      const res = await initiateSeatPayment(
        { ...staffDraft, phoneNumber: `+254${digits}` },
        crypto.randomUUID()
      );
      if (res.data.mode === 'created') {
        // The seat was free by the time this ran — no charge needed.
        createdStaffRef.current = res.data.staff;
        setStage('success');
        return;
      }
      setPaymentId(res.data.paymentId);
      setStage('pending');
      startPolling(res.data.paymentId);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setStage('failed');
      setErrorMessage(e.response?.data?.message ?? 'Could not start the payment. Check your connection and try again.');
    }
  };

  const applyResult = (result: { status: SeatPaymentStatus; receipt: string | null; errorMessage: string | null; staff: Staff | null }) => {
    if (result.status === 'pending') return false;
    setReceipt(result.receipt);
    setErrorMessage(result.errorMessage);
    if (result.staff) createdStaffRef.current = result.staff;
    setStage(result.status);
    return result.status === 'success';
  };

  /** "I definitely paid, check again" — re-verifies this exact attempt directly with M-Pesa. */
  const handleRecheck = async () => {
    if (!paymentId || rechecking) return;
    setRechecking(true);
    try {
      const res = await recheckSeatPayment(paymentId);
      const becameSuccess = applyResult(res.data);
      if (!becameSuccess) {
        setErrorMessage(res.data.errorMessage ?? "We checked with M-Pesa but this payment isn't confirmed yet. Try again in a minute.");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(e.response?.data?.message ?? 'Could not recheck the payment. Try again shortly.');
    } finally {
      setRechecking(false);
    }
  };

  /** Recovery path when there's no live paymentId to recheck (e.g. reopened the page after paying). */
  const handleVerifyPastedMessage = async () => {
    const text = pastedMessage.trim();
    if (!text || verifyingPaste) return;
    setVerifyingPaste(true);
    setPasteError(null);
    try {
      const res = await reconcileSeatPaymentByMessage(text);
      setShowPasteSheet(false);
      const becameSuccess = applyResult(res.data);
      if (!becameSuccess) setErrorMessage(res.message);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPasteError(e.response?.data?.message ?? "Couldn't verify that message. Check it's the full M-Pesa SMS and try again.");
    } finally {
      setVerifyingPaste(false);
    }
  };

  const isBusy = stage === 'initiating' || stage === 'pending';
  const isTerminalFailure = stage === 'failed' || stage === 'cancelled' || stage === 'timeout';

  return (
    <Modal isOpen={isOpen} onClose={isBusy ? () => {} : handleClose} title="Pay for new seat">
      {stage === 'input' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#0F766E' }}>
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Adding {staffDraft.name || 'this team member'} raises your bill. We&apos;ll send a payment prompt of{' '}
            <span className="font-semibold" style={{ color: '#0F172A' }}>{fmt(amount, currency)}</span> to your phone.
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
          <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Staff member added</h3>
          <p className="text-sm text-gray-500 mb-4">
            {paymentId ? `${fmt(amount, currency)} paid${receipt ? ` · Receipt ${receipt}` : ''}.` : 'No extra charge — this seat was already covered.'}
            <br />
            {canSignInImmediately
              ? `${staffDraft.name || 'They'} can now sign in.`
              : `${staffDraft.name || 'They'} can verify their email to sign in.`}
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
            {errorMessage ?? (stage === 'cancelled' ? 'The M-Pesa prompt was dismissed.' : 'The payment did not go through. No money was taken, and the staff member was not added.')}
          </p>

          {paymentId && (
            <Button onClick={handleRecheck} loading={rechecking} className="w-full mb-3">I already paid — recheck</Button>
          )}

          {showPasteSheet ? (
            <div className="w-full text-left mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Paste the M-Pesa confirmation SMS</label>
              <textarea
                value={pastedMessage}
                onChange={(e) => {
                  setPastedMessage(e.target.value);
                  if (pasteError) setPasteError(null);
                }}
                placeholder="QGH7XXXXX Confirmed. Ksh500.00 sent to..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 mb-2"
                style={{ color: '#0F172A' }}
              />
              {pasteError && <p className="text-xs text-red-600 mb-2">{pasteError}</p>}
              <Button onClick={handleVerifyPastedMessage} loading={verifyingPaste} disabled={!pastedMessage.trim()} className="w-full">
                Verify payment
              </Button>
            </div>
          ) : (
            <button onClick={() => setShowPasteSheet(true)} className="flex items-center gap-1.5 text-sm text-[#0F766E] hover:text-[#115E59] mb-3">
              <MessageSquareText className="w-3.5 h-3.5" />
              Paste M-Pesa message instead
            </button>
          )}

          <Button onClick={() => setStage('input')} className="w-full">Try again</Button>
          <button onClick={handleClose} className="mt-3 text-sm text-gray-500 hover:text-gray-700">Close</button>
        </div>
      )}
    </Modal>
  );
}
