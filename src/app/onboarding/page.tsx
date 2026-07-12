'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Package, CreditCard, Users, ChevronRight, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const SLIDES = [
  {
    icon: ShoppingBag,
    title: 'Welcome to Smart Duka',
    subtitle: 'Run your shop smarter — manage stock, sales and staff all in one place.',
    color: '#0F766E',
    bg: '#CCFBF1',
  },
  {
    icon: Package,
    title: 'Track Your Inventory',
    subtitle: 'Get real-time stock counts and low-stock alerts so you never run out.',
    color: '#B45309',
    bg: '#FEF3C7',
  },
  {
    icon: CreditCard,
    title: 'Sell in Seconds',
    subtitle: 'Record sales with Cash or M-Pesa and keep your books up to date automatically.',
    color: '#1D4ED8',
    bg: '#DBEAFE',
  },
  {
    icon: Users,
    title: 'Manage Your Team',
    subtitle: 'Add staff accounts and control what each team member can access.',
    color: '#6D28D9',
    bg: '#EDE9FE',
  },
];

export default function OnboardingPage() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const finish = () => {
    router.replace(user?.role === 'owner' ? '/owner/dashboard' : '/staff/dashboard');
  };

  const next = () => {
    if (index === SLIDES.length - 1) {
      finish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Skip */}
      <button
        onClick={finish}
        className="absolute top-6 right-6 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
      >
        Skip
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 absolute top-6 left-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-lg" style={{ color: '#0F172A' }}>Smart Duka</span>
      </div>

      {/* Slide */}
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm"
          style={{ backgroundColor: slide.bg }}
        >
          <Icon className="w-16 h-16" style={{ color: slide.color }} />
        </div>

        <h1 className="text-2xl font-extrabold mb-3" style={{ color: '#0F172A' }}>
          {slide.title}
        </h1>
        <p className="text-gray-500 leading-relaxed mb-10">
          {slide.subtitle}
        </p>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="transition-all rounded-full"
              style={{
                width: i === index ? 24 : 8,
                height: 8,
                backgroundColor: i === index ? '#0F766E' : '#D1D5DB',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => i - 1)}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#0F766E' }}
          >
            {isLast ? (
              <>Get Started <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
