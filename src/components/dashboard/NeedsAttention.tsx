'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronRight, Info } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { AttentionItem, AttentionSeverity } from '@/hooks/useAttention';

const SEVERITY_STYLE: Record<AttentionSeverity, { bg: string; color: string }> = {
  critical: { bg: '#FEE2E2', color: '#B91C1C' },
  warning: { bg: '#FEF3C7', color: '#B45309' },
  info: { bg: '#F1F5F9', color: '#64748B' },
};

/**
 * Renders nothing when there's nothing to do — no "all clear" card.
 * A dashboard that always shows a panel demanding attention teaches people
 * to stop reading the panel.
 */
export default function NeedsAttention({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Needs your attention</h2>
      <div className="space-y-2">
        {items.map((item) => {
          const style = SEVERITY_STYLE[item.severity];
          const Icon = item.severity === 'info' ? Info : AlertTriangle;
          const body = (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: style.bg }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: style.color }} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold" style={{ color: style.color }}>{item.title}</span>
                <span className="block text-xs mt-0.5" style={{ color: style.color, opacity: 0.85 }}>
                  {item.subtitle}
                </span>
              </span>
              {item.href && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: style.color }} />}
            </div>
          );
          return item.href ? (
            <Link key={item.id} href={item.href} className="block">{body}</Link>
          ) : (
            <div key={item.id}>{body}</div>
          );
        })}
      </div>
    </Card>
  );
}
