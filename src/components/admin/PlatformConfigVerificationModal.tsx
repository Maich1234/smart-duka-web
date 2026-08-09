'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { requestPlatformConfigVerification, verifyPlatformConfigCode } from '@/services/platformConfigVerification';

/**
 * Approval-relay gate in front of platform Daraja/Paystack credentials.
 *
 * Unlike the shop-level VerificationModal (payments/VerificationModal.tsx),
 * there's no channel choice: the code is always emailed to a fixed approver
 * inbox, never to the admin viewing this modal. The admin has to get the
 * code from that approver out of band, so there's a single step here —
 * request, then enter whatever code they were given.
 */
export default function PlatformConfigVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (token: string) => void;
}) {
  const [sessionId, setSessionId] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(false);

  // Guards against firing the request twice: React 18 StrictMode (on by
  // default in Next.js dev) double-invokes effect setup on mount, and a
  // plain `let cancelled` closure per-invocation would discard the response
  // that belongs to the call that actually went out. `firedRef` survives
  // across that double-invoke; `generationRef` still protects against a
  // stale response winning if the modal is closed and genuinely reopened
  // (e.g. the token expired mid-session) before the first request settles.
  const firedRef = useRef(false);
  const generationRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      firedRef.current = false;
      setSessionId('');
      setCode('');
      setError('');
      setRequested(false);
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    const generation = ++generationRef.current;
    setBusy(true);
    setError('');
    requestPlatformConfigVerification()
      .then((session) => {
        if (generationRef.current !== generation) return;
        setSessionId(session.sessionId);
        setRequested(true);
      })
      .catch((err) => {
        if (generationRef.current !== generation) return;
        firedRef.current = false; // let the admin retry
        setError(describe(err, 'Could not send the code. Try again.'));
      })
      .finally(() => {
        if (generationRef.current === generation) setBusy(false);
      });
  }, [isOpen]);

  const describe = (err: unknown, fallback: string) => {
    const e = err as { response?: { status?: number; data?: { message?: string } } };
    // The limiter's own message says how long to wait, so pass it through
    // rather than replacing it with something vaguer.
    if (e.response?.status === 429) return e.response.data?.message || 'Too many attempts. Try again shortly.';
    return e.response?.data?.message || fallback;
  };

  const submit = async () => {
    if (code.trim().length < 6) return;
    setBusy(true);
    setError('');
    try {
      const token = await verifyPlatformConfigCode(sessionId, code.trim());
      onVerified(token);
    } catch (err) {
      setError(describe(err, 'That code was not accepted.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} title="Confirm platform access" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
          <p className="text-sm text-gray-600 leading-relaxed">
            These credentials collect money on Dukana&apos;s own behalf, so a code has been sent to the
            platform&apos;s security approver — not to you. Ask them for it, then enter it below.
            Delivery can take up to 30 seconds.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        <Input
          label="Approval code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          disabled={!requested || busy}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        <div className="flex justify-end pt-1">
          <Button loading={busy} disabled={!requested || code.trim().length < 6} onClick={submit}>
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
}
