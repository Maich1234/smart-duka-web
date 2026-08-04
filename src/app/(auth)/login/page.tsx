'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getDeviceInfo } from '@/utils/deviceId';
import { hasCompletedOnboarding } from '@/store/onboardingStore';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

const UNVERIFIED_MESSAGE = 'Please verify your email before logging in.';

/**
 * Why the previous session ended, handed over by SessionExpiredHandler as a
 * query param. It has to travel through the URL rather than the store,
 * because getting here means the store was just cleared.
 */
const EXPIRY_NOTICES: Record<string, string> = {
  expired: 'Your session expired. Please sign in again.',
  revoked_elsewhere: 'You were signed out because this account was used on another device.',
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [expiryNotice, setExpiryNotice] = useState('');

  // Read from window rather than useSearchParams: this page is otherwise
  // statically prerenderable, and useSearchParams would force a Suspense
  // boundary around it for no benefit.
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason && EXPIRY_NOTICES[reason]) setExpiryNotice(EXPIRY_NOTICES[reason]);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setUnverifiedEmail('');
    setExpiryNotice('');
    try {
      const res = await api.post('/auth/login', { ...data, device: getDeviceInfo() });
      const userData = res.data.data;
      // The refresh token is what keeps this session alive past the access
      // token's one hour. Dropping it here was why web users were signed out
      // hourly.
      login(userData, userData.token, userData.refreshToken);
      if (userData.role !== 'owner') {
        router.push('/staff/dashboard');
        return;
      }
      // Registration returns no token — email verification comes first — so
      // onboarding can't run post-register. It runs on an owner's first
      // sign-in instead, and only once. A shop with no country set has never
      // been through setup, which covers signing in on a new browser.
      const needsOnboarding = !hasCompletedOnboarding() && !userData.shop?.country;
      router.push(needsOnboarding ? '/onboarding/setup' : '/owner/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setServerError(message);
      if (message === UNVERIFIED_MESSAGE) setUnverifiedEmail(data.email);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#0F172A' }}>Welcome back</h1>
      <p className="text-gray-500 text-sm mb-8">Sign in to your Dukana account</p>

      {expiryNotice && !serverError && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          {expiryNotice}
        </div>
      )}

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {serverError}
          {unverifiedEmail && (
            <>
              {' '}
              <Link href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} className="font-semibold underline">
                Verify email
              </Link>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Email address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: errors.email ? '#ef4444' : '#e2e8f0',
              backgroundColor: 'white',
            }}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Password</label>
            <Link href="/forgot-password" className="text-xs font-medium" style={{ color: '#0F766E' }}>Forgot password?</Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 pr-11"
              style={{
                borderColor: errors.password ? '#ef4444' : '#e2e8f0',
                backgroundColor: 'white',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{ backgroundColor: '#0F766E' }}
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In
            </>
          )}
        </button>
      </form>

      {/* The backend allows a staff member one device at a time and revokes
          the previous session on login (owners are exempt). Said up front,
          because discovering it as a surprise logout on the shop phone
          mid-shift is a much worse way to learn it. */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        Staff accounts can only be signed in on one device at a time — signing in here will
        end the session on your phone.
      </p>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold" style={{ color: '#0F766E' }}>
          Create one free
        </Link>
      </p>

      {/* Reachable, not a gate. Consent is captured once at registration; a
          checkbox here would block returning users without collecting any
          consent they hadn't already given. */}
      <p className="mt-4 text-center text-xs text-gray-400">
        <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
        {' · '}
        <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
      </p>
    </div>
  );
}
