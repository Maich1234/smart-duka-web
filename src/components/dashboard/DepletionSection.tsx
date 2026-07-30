'use client';

import { useQuery } from '@tanstack/react-query';
import { TimerReset } from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { getDepletionAnalytics } from '@/services/analytics';

/**
 * How long current stock will last at the recent rate of sale.
 *
 * Needs `advanced_analytics` in the plan. A 403 means the plan doesn't
 * include it, which is not an error worth showing — the section simply
 * doesn't appear, the same way the AI cards handle their gate.
 */
export default function DepletionSection({ limit = 6 }: { limit?: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['depletion'],
    queryFn: getDepletionAnalytics,
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return <Card><div className="flex justify-center py-8"><Spinner /></div></Card>;
  }

  // Covers the plan gate and a missing endpoint alike — neither is something
  // the owner can act on, so neither earns a red box.
  if (isError || !data?.items?.length) return null;

  const soonest = [...data.items]
    .filter((item) => item.daysUntilDepletion != null)
    .sort((a, b) => (a.daysUntilDepletion ?? 0) - (b.daysUntilDepletion ?? 0))
    .slice(0, limit);

  if (soonest.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <TimerReset className="w-4 h-4" style={{ color: '#0F766E' }} />
        <h2 className="font-bold" style={{ color: '#0F172A' }}>Running out soon</h2>
      </div>
      <div className="space-y-1.5">
        {soonest.map((item) => {
          const days = item.daysUntilDepletion ?? 0;
          return (
            <div key={item._id} className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-gray-600 truncate">
                {item.name}
                <span className="text-gray-400"> · {item.quantity} left</span>
              </span>
              <span
                className="text-sm font-semibold tabular-nums shrink-0"
                style={{ color: days <= 3 ? '#B91C1C' : days <= 7 ? '#B45309' : '#0F172A' }}
              >
                {days <= 0 ? 'Out now' : `~${Math.round(days)} day${Math.round(days) === 1 ? '' : 's'}`}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
