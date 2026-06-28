'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        shopName: data.shopName,
      });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#0F172A' }}>Create your account</h1>
      <p className="text-gray-500 text-sm mb-8">Start managing your shop today — it&apos;s free</p>

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Full name</label>
          <input
            {...register('name')}
            type="text"
            placeholder="Jane Wanjiku"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white"
            style={{ borderColor: errors.name ? '#ef4444' : '#e2e8f0' }}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Shop name</label>
          <input
            {...register('shopName')}
            type="text"
            placeholder="My Duka"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white"
            style={{ borderColor: errors.shopName ? '#ef4444' : '#e2e8f0' }}
          />
          {errors.shopName && <p className="mt-1 text-xs text-red-500">{errors.shopName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Email address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white"
            style={{ borderColor: errors.email ? '#ef4444' : '#e2e8f0' }}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white pr-11"
              style={{ borderColor: errors.password ? '#ef4444' : '#e2e8f0' }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Confirm password</label>
          <input
            {...register('confirmPassword')}
            type={showPass ? 'text' : 'password'}
            placeholder="Repeat your password"
            className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white"
            style={{ borderColor: errors.confirmPassword ? '#ef4444' : '#e2e8f0' }}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-2"
          style={{ backgroundColor: '#0F766E' }}
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Create Account
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: '#0F766E' }}>Sign in</Link>
      </p>
      <p className="mt-3 text-center text-xs text-gray-400">
        By creating an account you agree to our{' '}
        <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
