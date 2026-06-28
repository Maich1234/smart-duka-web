'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Shield, X } from 'lucide-react';
import api from '@/lib/api';

type ModalStatus = 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';
type MpesaTransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

interface Props {
  open: boolean;
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  currency?: string;
  onSuccess: (transactionId: string, mpesaReceiptNumber: string) => void;
  onCancel: () => void;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 90000;

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

function formatCurrency(n: number, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);
}

export default function MpesaPaymentModal({ open, phoneNumber, amount, accountReference, currency = 'KES', onSuccess, onCancel }: Props) {
  const [status, setStatus] = useState<ModalStatus>('initiating');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pulse, setPulse] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const idempotencyKeyRef = useRef<string>('');

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const beginPolling = useCallback((txId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startTimeRef.current > MAX_POLL_MS) {
        stopPolling();
        setStatus('timeout');
        return;
      }
      try {
        const res = await api.get(`/mpesa/status/${txId}`);
        const s: MpesaTransactionStatus = res.data.data.status;
        if (s !== 'pending') {
          stopPolling();
          if (s === 'success') {
            setReceiptNumber(res.data.data.mpesaReceiptNumber);
            setStatus('success');
          } else if (s === 'cancelled') {
            setStatus('cancelled');
          } else if (s === 'timeout') {
            setStatus('timeout');
          } else {
            setErrorMessage(res.data.data.errorMessage ?? 'Payment was not completed.');
            setStatus('failed');
          }
        }
      } catch { /* network hiccup — keep polling */ }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const sendSTKPush = useCallback(async (key: string) => {
    setStatus('initiating');
    setTransactionId(null);
    setReceiptNumber(null);
    setErrorMessage(null);
    setShowVerifyInput(false);
    setVerifyCode('');
    try {
      const res = await api.post('/mpesa/initiate',
        { phoneNumber, amount, accountReference },
        key ? { headers: { 'Idempotency-Key': key } } : undefined
      );
      const data = res.data;
      setTransactionId(data.data.transactionId);
      if (data.idempotent && data.data.status !== 'pending') {
        const s: MpesaTransactionStatus = data.data.status;
        if (s === 'success') { setReceiptNumber(data.data.mpesaReceiptNumber ?? null); setStatus('success'); }
        else if (s === 'cancelled') setStatus('cancelled');
        else if (s === 'timeout') setStatus('timeout');
        else { setErrorMessage(data.data.errorMessage ?? 'Payment not completed.'); setStatus('failed'); }
        return;
      }
      setStatus('pending');
      startTimeRef.current = Date.now();
      beginPolling(data.data.transactionId);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(e.response?.data?.message || e.message || 'Failed to send payment request');
      setStatus('failed');
    }
  }, [phoneNumber, amount, accountReference, beginPolling]);

  useEffect(() => {
    if (!open) { stopPolling(); return; }
    idempotencyKeyRef.current = generateIdempotencyKey();
    sendSTKPush(idempotencyKeyRef.current);
    return () => stopPolling();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse animation for pending state
  useEffect(() => {
    if (status !== 'pending') { setPulse(false); return; }
    const id = setInterval(() => setPulse((p) => !p), 800);
    return () => clearInterval(id);
  }, [status]);

  const handleVerifyReceipt = async () => {
    const code = verifyCode.trim().toUpperCase();
    if (code.length < 6) return;
    setVerifying(true);
    try {
      const res = await api.post('/mpesa/verify-receipt', { receiptNumber: code });
      const d = res.data.data;
      if (d.status === 'success') {
        setReceiptNumber(d.mpesaReceiptNumber);
        setTransactionId(d.transactionId);
        setStatus('success');
      } else {
        alert(`Transaction found but status is "${d.status}". ${res.data.message}`);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Receipt code not found. Double-check and try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!open) return null;

  const isTerminal = ['failed', 'cancelled', 'timeout'].includes(status);
  const maskedPhone = formatPhone(phoneNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={isTerminal || status === 'success' ? onCancel : undefined}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Close button — only when not mid-payment */}
        {(isTerminal || status === 'success') && (
          <button onClick={onCancel} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-7 flex flex-col items-center text-center">

          {/* INITIATING */}
          {status === 'initiating' && (
            <>
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #0F766E, #14B8A6)' }}>
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Sending Request...</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Initiating M-Pesa payment of <strong>{formatCurrency(amount, currency)}</strong> to {maskedPhone}
              </p>
              <div className="flex gap-1.5 mt-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#0F766E', animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </>
          )}

          {/* PENDING */}
          {status === 'pending' && (
            <>
              <div
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 shadow-lg transition-transform duration-700"
                style={{
                  background: 'linear-gradient(135deg, #0F766E, #14B8A6)',
                  transform: pulse ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: pulse ? '0 0 0 12px rgba(15,118,110,0.15)' : '0 8px 24px rgba(15,118,110,0.3)',
                }}
              >
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                <Clock className="w-3 h-3" /> Waiting for customer
              </span>
              <p className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Payment Request Sent</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                An M-Pesa prompt has been sent to<br />
                <strong style={{ color: '#0F172A' }}>{maskedPhone}</strong><br />
                Ask the customer to enter their M-Pesa PIN.
              </p>
              <div className="px-8 py-4 rounded-xl border mb-5 w-full" style={{ backgroundColor: '#F0FDFA', borderColor: 'rgba(15,118,110,0.2)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#0F766E' }}>Amount</p>
                <p className="text-2xl font-bold" style={{ color: '#0F766E' }}>{formatCurrency(amount, currency)}</p>
              </div>
              <div className="flex gap-1.5 mb-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: '#0F766E', animationDelay: `${i * 160}ms` }} />
                ))}
              </div>
              <button onClick={onCancel} className="text-sm text-gray-400 underline hover:text-gray-600 transition-colors">
                Cancel transaction
              </button>
            </>
          )}

          {/* SUCCESS */}
          {status === 'success' && (
            <>
              <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #15803D, #16A34A)' }}>
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                <CheckCircle className="w-3 h-3" /> Payment Confirmed
              </span>
              <p className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>Payment Successful</p>
              <p className="text-sm text-gray-500 mb-4">{formatCurrency(amount, currency)} received from {maskedPhone}</p>
              {receiptNumber && (
                <div className="w-full px-5 py-4 rounded-xl border mb-5 text-center" style={{ backgroundColor: '#DCFCE7', borderColor: 'rgba(21,128,61,0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#15803D' }}>M-Pesa Reference</p>
                  <p className="text-xl font-bold tracking-widest" style={{ color: '#15803D' }}>{receiptNumber}</p>
                </div>
              )}
              <button
                onClick={() => onSuccess(transactionId!, receiptNumber!)}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all"
                style={{ backgroundColor: '#0F766E' }}
              >
                Complete Sale
              </button>
            </>
          )}

          {/* FAILED / CANCELLED / TIMEOUT */}
          {isTerminal && (
            <>
              <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#FEE2E2' }}>
                {status === 'cancelled'
                  ? <XCircle className="w-9 h-9 text-red-500" />
                  : status === 'timeout'
                  ? <Clock className="w-9 h-9 text-red-500" />
                  : <AlertCircle className="w-9 h-9 text-red-500" />}
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-red-50 text-red-600">
                {status === 'cancelled' ? 'Payment Cancelled' : status === 'timeout' ? 'Request Timed Out' : 'Payment Failed'}
              </span>
              <p className="text-lg font-bold mb-2" style={{ color: '#0F172A' }}>
                {status === 'cancelled' ? 'Customer Cancelled' : status === 'timeout' ? 'No Response' : 'Payment Not Completed'}
              </p>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                {errorMessage || (
                  status === 'cancelled' ? 'The customer dismissed the M-Pesa prompt.' :
                  status === 'timeout' ? 'The customer did not respond within 90 seconds.' :
                  'The payment could not be processed.'
                )}
              </p>
              <div className="flex gap-3 w-full mb-4">
                <button
                  onClick={() => sendSTKPush(idempotencyKeyRef.current)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all"
                  style={{ backgroundColor: '#0F766E' }}
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl font-semibold border-2 transition-all"
                  style={{ color: '#0F766E', borderColor: '#0F766E' }}
                >
                  Cancel
                </button>
              </div>

              {/* Verify by receipt code */}
              <button
                onClick={() => setShowVerifyInput((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium underline mb-3 transition-colors"
                style={{ color: '#0F766E' }}
              >
                <Shield className="w-3.5 h-3.5" />
                {showVerifyInput ? 'Hide verification' : 'Customer already paid? Verify with M-Pesa code'}
              </button>

              {showVerifyInput && (
                <div className="w-full rounded-2xl p-4 border" style={{ backgroundColor: '#F0FDFA', borderColor: 'rgba(15,118,110,0.2)' }}>
                  <p className="text-sm font-semibold mb-1 text-left" style={{ color: '#0F172A' }}>Enter M-Pesa Transaction Code</p>
                  <p className="text-xs text-gray-500 mb-3 text-left leading-relaxed">
                    Ask the customer for their M-Pesa confirmation SMS code (e.g. QGR12345XY)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                      placeholder="e.g. QGR12345XY"
                      maxLength={20}
                      className="flex-1 px-3 py-2.5 rounded-xl border text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-teal-200"
                      style={{ borderColor: '#e2e8f0', backgroundColor: 'white' }}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyReceipt()}
                    />
                    <button
                      onClick={handleVerifyReceipt}
                      disabled={verifyCode.trim().length < 6 || verifying}
                      className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60 transition-all"
                      style={{ backgroundColor: '#0F766E' }}
                    >
                      {verifying ? '...' : 'Verify'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
