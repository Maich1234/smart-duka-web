'use client';

import { useRouter } from 'next/navigation';
import { Gift, Clock, AlertCircle, Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

type Tone = 'info' | 'warn' | 'urgent';

const PALETTE: Record<Tone, { bg: string; fg: string }> = {
  info: { bg: '#E6F4F2', fg: '#115E59' },
  warn: { bg: '#FEF3C7', fg: '#92400E' },
  urgent: { bg: '#FEE2E2', fg: '#DC2626' },
};

/**
 * Owner-dashboard subscription nudge, ported from the mobile app's
 * TrialBanner. Quiet by design: nothing during a healthy trial or paid
 * period — only appears when the trial is inside the reminder window, the
 * shop is in grace, or no trial was ever activated.
 */
export default function TrialBanner() {
  const router = useRouter();
  const { access, isLoading } = useSubscription();
  if (isLoading || !access) return null;

  let Icon = Gift;
  let text = '';
  let tone: Tone = 'info';
  let cta = 'Activate';

  if (access.state === 'none') {
    Icon = Gift;
    text = 'Your free trial is waiting — activate Smart Duka.';
    tone = 'info';
    cta = 'Activate';
  } else if (access.state === 'trialing' && access.daysLeft <= 7 && !access.cancelled) {
    Icon = Clock;
    text = `${access.daysLeft} day${access.daysLeft === 1 ? '' : 's'} left in your free trial.`;
    tone = access.daysLeft <= 3 ? 'warn' : 'info';
    cta = 'View';
  } else if (access.state === 'grace') {
    Icon = AlertCircle;
    text = `Subscription expired — ${access.graceDaysLeft} day${access.graceDaysLeft === 1 ? '' : 's'} left before your shop pauses.`;
    tone = 'urgent';
    cta = 'Pay now';
  } else if (access.state === 'locked') {
    Icon = Lock;
    text = 'Subscription expired. Pay now to keep selling.';
    tone = 'urgent';
    cta = 'Pay now';
  } else {
    return null;
  }

  const palette = PALETTE[tone];

  return (
    <button
      onClick={() => router.push('/owner/subscription')}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-left transition-opacity hover:opacity-90"
      style={{ backgroundColor: palette.bg }}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: palette.fg }} />
      <span className="flex-1 text-sm font-semibold" style={{ color: palette.fg }}>{text}</span>
      <span className="px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0" style={{ borderColor: palette.fg, color: palette.fg }}>
        {cta}
      </span>
    </button>
  );
}
