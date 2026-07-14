'use client';

import Link from 'next/link';
import { Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Info, ArrowRight, Activity, Bell, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { BusinessSnapshot, AiInsight } from '@/services/aiInsight';

const fmt = (amount: number, currency?: string) => `${currency ?? 'KES'} ${amount.toLocaleString()}`;

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: '#0F766E' }} />
      </div>
      <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>{title}</h3>
    </div>
  );
}

// ─── HealthScoreCard ──────────────────────────────────────────────────────────

const COMPONENT_LABELS: Record<keyof BusinessSnapshot['health']['components'], string> = {
  revenue: 'Revenue',
  profit: 'Profit',
  inventory: 'Inventory',
  cashFlow: 'Cash Flow',
  staff: 'Staff',
};

const scoreColor = (score: number) => (score >= 75 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626');

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 104;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-extrabold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export function HealthScoreCard({ health }: { health: BusinessSnapshot['health'] }) {
  const color = scoreColor(health.score);
  return (
    <div>
      <SectionHeader icon={Activity} title="Business Health" />
      <Card>
        <div className="flex items-center gap-6">
          <ScoreRing score={health.score} color={color} />
          <div className="flex-1 space-y-2.5">
            {(Object.keys(COMPONENT_LABELS) as (keyof typeof COMPONENT_LABELS)[]).map((key) => (
              <div key={key}>
                <p className="text-[11px] font-semibold text-gray-400 mb-1">{COMPONENT_LABELS[key]}</p>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, health.components[key]))}%`, backgroundColor: scoreColor(health.components[key]) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── AiNarrativeCard ──────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<AiInsight['priority'], { fg: string; bg: string; label: string }> = {
  high: { fg: '#DC2626', bg: '#FEE2E2', label: 'High priority' },
  medium: { fg: '#B45309', bg: '#FEF3C7', label: 'Medium priority' },
  low: { fg: '#16A34A', bg: '#DCFCE7', label: 'Low priority' },
};

export function AiNarrativeCard({ insight, cachedNote }: { insight: AiInsight; cachedNote?: string }) {
  const tone = PRIORITY_STYLE[insight.priority];
  return (
    <div>
      <SectionHeader icon={Sparkles} title="Smart Duka Says" />
      <Card className="space-y-3">
        <span className="inline-flex self-start px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: tone.fg, backgroundColor: tone.bg }}>
          {tone.label}
        </span>
        <p className="text-sm leading-relaxed" style={{ color: '#0F172A' }}>{insight.summary}</p>
        {insight.actions.length > 0 && (
          <div className="space-y-2 pt-1">
            {insight.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                <span className="text-sm" style={{ color: '#0F172A' }}>{action}</span>
              </div>
            ))}
          </div>
        )}
        {cachedNote && <p className="text-[11px] text-gray-400 pt-1">{cachedNote}</p>}
      </Card>
    </div>
  );
}

// ─── AlertsList ───────────────────────────────────────────────────────────────

const ALERT_STYLE: Record<BusinessSnapshot['alerts'][number]['severity'], { fg: string; bg: string; icon: React.ElementType }> = {
  critical: { fg: '#DC2626', bg: '#FEE2E2', icon: AlertCircle },
  warning: { fg: '#B45309', bg: '#FEF3C7', icon: AlertTriangle },
  info: { fg: '#2563EB', bg: '#DBEAFE', icon: Info },
};

export function AlertsList({ alerts }: { alerts: BusinessSnapshot['alerts'] }) {
  if (alerts.length === 0) return null;
  return (
    <div>
      <SectionHeader icon={Bell} title="Alerts" />
      <Card padding="none" className="overflow-hidden">
        {alerts.map((alert, i) => {
          const tone = ALERT_STYLE[alert.severity];
          const Icon = tone.icon;
          return (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < alerts.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tone.bg }}>
                <Icon className="w-4 h-4" style={{ color: tone.fg }} />
              </div>
              <p className="text-sm" style={{ color: '#0F172A' }}>{alert.message}</p>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── TrendSummary ─────────────────────────────────────────────────────────────

export function TrendSummary({ trend, currency }: { trend: BusinessSnapshot['trend']; currency?: string }) {
  return (
    <div>
      <SectionHeader icon={TrendingUp} title="Trend" />
      <Card className="space-y-4">
        {(['week', 'month'] as const).map((range, i) => (
          <div key={range} className={`flex items-center gap-3 ${i === 0 ? 'pb-4 border-b border-gray-100' : ''}`}>
            <span className="flex-1 text-xs font-semibold text-gray-400">{range === 'week' ? 'Last 7 days' : 'Last 30 days'}</span>
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{fmt(trend[range].revenue, currency)}</p>
              <p className="text-[10px] text-gray-400">revenue</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{fmt(trend[range].profit, currency)}</p>
              <p className="text-[10px] text-gray-400">profit</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── ReportsShortcut ──────────────────────────────────────────────────────────

export function ReportsShortcut() {
  return (
    <Link
      href="/owner/reports"
      className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors"
      style={{ color: '#0F766E', backgroundColor: '#F0FDFA' }}
    >
      Full Reports
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}

// ─── UpsellCard ───────────────────────────────────────────────────────────────

export function UpsellCard() {
  return (
    <Link href="/owner/subscription" className="block">
      <Card className="flex flex-col items-center text-center py-10">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#FEF3C7' }}>
          <Sparkles className="w-6 h-6" style={{ color: '#B45309' }} />
        </div>
        <h2 className="text-lg font-bold mb-1.5" style={{ color: '#0F172A' }}>Unlock AI Insights</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-4">
          Get a daily business health score and a plain-language explanation of what changed and what to do next — included with any active subscription.
        </p>
        <span className="inline-flex px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#0F766E' }}>
          Activate Subscription
        </span>
      </Card>
    </Link>
  );
}
