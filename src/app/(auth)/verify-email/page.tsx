'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import api from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const verify = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setIsVerifying(true);
    setError('');
    try {
      await api.post('/auth/verify-email', { email, code });
      setSuccess('Email verified successfully! Redirecting to login…');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [otp, email, router]);

  useEffect(() => {
    if (otp.every((d) => d !== '')) {
      verify();
    }
  }, [otp, verify]);

  const resend = async () => {
    if (!canResend) return;
    setIsResending(true);
    setError('');
    try {
      await api.post('/auth/resend-verification-email', { email });
      setCountdown(60);
      setCanResend(false);
      setSuccess('OTP resent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#CCFBF1' }}>
        <MailCheck className="w-8 h-8" style={{ color: '#0F766E' }} />
      </div>

      <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#0F172A' }}>Check your email</h1>
      <p className="text-gray-500 text-sm mb-2">We sent a 6-digit code to</p>
      <p className="font-semibold mb-8" style={{ color: '#0F766E' }}>{email || 'your email'}</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 text-left">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 text-left">
          {success}
        </div>
      )}

      <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none"
            style={{
              borderColor: digit ? '#0F766E' : '#e2e8f0',
              backgroundColor: 'white',
              color: '#0F172A',
            }}
          />
        ))}
      </div>

      <button
        onClick={verify}
        disabled={isVerifying || otp.some((d) => !d)}
        className="w-full py-3 rounded-xl font-semibold text-white mb-6 flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ backgroundColor: '#0F766E' }}
      >
        {isVerifying ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Email'}
      </button>

      <p className="text-sm text-gray-500">
        Didn&apos;t receive it?{' '}
        {canResend ? (
          <button
            onClick={resend}
            disabled={isResending}
            className="font-semibold"
            style={{ color: '#0F766E' }}
          >
            {isResending ? 'Resending…' : 'Resend code'}
          </button>
        ) : (
          <span className="text-gray-400">Resend in {countdown}s</span>
        )}
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
