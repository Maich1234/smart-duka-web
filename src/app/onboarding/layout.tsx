'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Spinner from '@/components/ui/Spinner';

/**
 * Onboarding is for a signed-in owner setting up their shop, so it needs the
 * same auth guard as the dashboard but none of its chrome — no sidebar to
 * wander off into before the shop exists.
 *
 * Staff never see it: their shop is already configured by whoever hired them.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) router.replace('/login');
    else if (user?.role === 'staff') router.replace('/staff/dashboard');
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || user?.role === 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
            <ShoppingBag className="w-5 h-5 text-white" />
          </span>
          <span className="font-extrabold text-lg" style={{ color: '#0F172A' }}>Smart Duka</span>
        </div>
        {children}
      </div>
    </div>
  );
}
