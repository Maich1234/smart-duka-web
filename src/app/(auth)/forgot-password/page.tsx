'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type Step = 'email' | 'otp' | 'password' | 'done';

const emailSchema = z.object({ email: z.string().email('Enter a valid email') });
const passwordSchema = z.object({
  password: z.string().min(6, 'At least 6 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

type EmailData = z.infer<typeof emailSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (step === 'otp') {
      setCanResend(true);
    }
  }, [countdown, step]);

  const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const handleEmailSubmit = async (data: EmailData) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setStep('otp');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: code });
      setStep('password');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordData) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otp.join(''), newPassword: data.password });
      setStep('done');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setCountdown(60);
      setCanResend(false);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#CCFBF1' }}>
          <CheckCircle className="w-8 h-8" style={{ color: '#0F766E' }} />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#0F172A' }}>Password Reset!</h1>
        <p className="text-gray-500 text-sm mb-8">Your password has been reset successfully.</p>
        <Link href="/login" className="block w-full py-3 rounded-xl font-semibold text-white text-center" style={{ backgroundColor: '#0F766E' }}>
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: step === s ? '#0F766E' : ['email','otp','password'].indexOf(step) > i ? '#CCFBF1' : '#e2e8f0',
                color: step === s ? 'white' : '#0F766E',
              }}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-0.5" style={{ backgroundColor: ['email','otp','password'].indexOf(step) > i ? '#0F766E' : '#e2e8f0' }} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {step === 'email' && (
        <div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#CCFBF1' }}>
            <Mail className="w-6 h-6" style={{ color: '#0F766E' }} />
          </div>
          <h1 className="text-2xl font-extrabold mb-2 text-center" style={{ color: '#0F172A' }}>Forgot password?</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Enter your email and we&apos;ll send a reset code.</p>

          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Email address</label>
              <input
                {...emailForm.register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
                style={{ borderColor: emailForm.formState.errors.email ? '#ef4444' : '#e2e8f0' }}
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0F766E' }}
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Code'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            <Link href="/login" className="font-semibold" style={{ color: '#0F766E' }}>Back to Sign In</Link>
          </p>
        </div>
      )}

      {step === 'otp' && (
        <div className="text-center">
          <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#0F172A' }}>Enter reset code</h1>
          <p className="text-gray-500 text-sm mb-2">Code sent to <strong>{email}</strong></p>
          <div className="flex justify-center gap-3 my-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 focus:outline-none"
                style={{ borderColor: digit ? '#0F766E' : '#e2e8f0', backgroundColor: 'white', color: '#0F172A', height: '52px' }}
              />
            ))}
          </div>
          <button
            onClick={verifyOtp}
            disabled={loading || otp.some((d) => !d)}
            className="w-full py-3 rounded-xl font-semibold text-white mb-4 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#0F766E' }}
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
          </button>
          <p className="text-sm text-gray-500">
            {canResend ? (
              <button onClick={resend} className="font-semibold" style={{ color: '#0F766E' }}>Resend code</button>
            ) : (
              <span className="text-gray-400">Resend in {countdown}s</span>
            )}
          </p>
        </div>
      )}

      {step === 'password' && (
        <div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#CCFBF1' }}>
            <Lock className="w-6 h-6" style={{ color: '#0F766E' }} />
          </div>
          <h1 className="text-2xl font-extrabold mb-2 text-center" style={{ color: '#0F172A' }}>Set new password</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Choose a strong password for your account.</p>

          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>New password</label>
              <div className="relative">
                <input
                  {...passwordForm.register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none bg-white pr-11"
                  style={{ borderColor: passwordForm.formState.errors.password ? '#ef4444' : '#e2e8f0' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.password && <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Confirm password</label>
              <input
                {...passwordForm.register('confirm')}
                type={showPass ? 'text' : 'password'}
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
                style={{ borderColor: passwordForm.formState.errors.confirm ? '#ef4444' : '#e2e8f0' }}
              />
              {passwordForm.formState.errors.confirm && <p className="mt-1 text-xs text-red-500">{passwordForm.formState.errors.confirm.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0F766E' }}
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
