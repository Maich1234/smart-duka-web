'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { requestOtp, verifyOtp, type OtpMethod } from '@/services/paymentConfig';

/**
 * Proves it's really the owner before showing or changing Daraja
 * credentials. Hands the caller a short-lived verification token.
 *
 * The mobile equivalent is ~900 lines, almost all animation; the flow itself
 * is: pick a channel → enter the code → get a token.
 */
export default function VerificationModal({
  isOpen,
  onClose,
  onVerified,
}: {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (token: string) => void;
}) {
  const [step, setStep] = useState<'choose' | 'code'>('choose');
  const [sessionId, setSessionId] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep('choose');
      setSessionId('');
      setSentTo('');
      setCode('');
      setError('');
    }
  }, [isOpen]);

  const describe = (err: unknown, fallback: string) => {
    const e = err as { response?: { status?: number; data?: { message?: string } } };
    // The limiter's own message says how long to wait, so pass it through
    // rather than replacing it with something vaguer.
    if (e.response?.status === 429) return e.response.data?.message || 'Too many attempts. Try again shortly.';
    return e.response?.data?.message || fallback;
  };

  const send = async (method: OtpMethod) => {
    setBusy(true);
    setError('');
    try {
      const session = await requestOtp(method);
      setSessionId(session.sessionId);
      setSentTo(session.sentTo);
      setStep('code');
    } catch (err) {
      setError(describe(err, 'Could not send the code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    setError('');
    try {
      const token = await verifyOtp(sessionId, code.trim());
      onVerified(token);
    } catch (err) {
      setError(describe(err, 'That code was not accepted.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} title="Confirm it's you" size="sm">
      {step === 'choose' ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
            <p className="text-sm text-gray-600 leading-relaxed">
              These credentials can move your shop&apos;s money, so we&apos;ll send you a one-time code
              before showing or changing them.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => send('sms')}
              className="p-4 rounded-xl border border-gray-200 hover:border-teal-300 transition-colors disabled:opacity-50"
            >
              <MessageSquare className="w-5 h-5 mx-auto mb-2" style={{ color: '#0F766E' }} />
              <span className="block text-sm font-semibold" style={{ color: '#0F172A' }}>Text me</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => send('email')}
              className="p-4 rounded-xl border border-gray-200 hover:border-teal-300 transition-colors disabled:opacity-50"
            >
              <Mail className="w-5 h-5 mx-auto mb-2" style={{ color: '#0F766E' }} />
              <span className="block text-sm font-semibold" style={{ color: '#0F172A' }}>Email me</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We sent a code to <strong style={{ color: '#0F172A' }}>{sentTo}</strong>.
          </p>

          <Input
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-between items-center pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => { setStep('choose'); setCode(''); setError(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Use a different method
            </button>
            <Button loading={busy} disabled={code.trim().length < 4} onClick={submit}>
              Continue
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
