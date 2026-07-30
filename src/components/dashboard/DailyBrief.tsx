'use client';

import {
  Box, Check, Minus, Receipt, Star, Sun, TrendingDown, TrendingUp, Wallet,
  type LucideIcon,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import type { BriefBullet, BriefIcon, BriefTone } from '@/utils/dailyBrief';

const ICONS: Record<BriefIcon, LucideIcon> = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  flat: Minus,
  receipt: Receipt,
  sun: Sun,
  star: Star,
  wallet: Wallet,
  box: Box,
  check: Check,
};

const TONE_COLOR: Record<BriefTone, string> = {
  positive: '#15803D',
  neutral: '#64748B',
  warning: '#B45309',
};

export default function DailyBrief({ bullets }: { bullets: BriefBullet[] }) {
  if (bullets.length === 0) return null;

  return (
    <Card>
      <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Today at a glance</h2>
      <ul className="space-y-2.5">
        {bullets.map((bullet) => {
          const Icon = ICONS[bullet.icon];
          return (
            <li key={bullet.id} className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: TONE_COLOR[bullet.tone] }} />
              <span className="text-sm text-gray-600 leading-relaxed">{bullet.text}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
