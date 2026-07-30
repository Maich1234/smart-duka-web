'use client';

import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import type { CommissionPeriod, CommissionSummary } from '@/services/commission';

const PERIODS: { value: CommissionPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

interface CommissionCardProps {
  data?: CommissionSummary;
  isLoading: boolean;
  /** Set when the shop hasn't switched commission visibility on. */
  forbidden?: boolean;
  period: CommissionPeriod;
  onPeriodChange: (next: CommissionPeriod) => void;
  currency: string;
}

export default function CommissionCard({
  data,
  isLoading,
  forbidden,
  period,
  onPeriodChange,
  currency,
}: CommissionCardProps) {
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  if (forbidden) {
    return (
      <Card>
        <p className="text-sm text-gray-600 py-2">
          Your shop doesn&apos;t show commission to staff. Ask the owner if you think that&apos;s wrong.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ backgroundColor: '#F1F5F9' }}>
        {PERIODS.map((option) => (
          <button
            key={option.value}
            onClick={() => onPeriodChange(option.value)}
            className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              period === option.value
                ? { backgroundColor: 'white', color: '#0F172A' }
                : { color: '#64748B' }
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !data || data.salesCount === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          No commission earned in this period yet.
        </p>
      ) : (
        <>
          <div className="text-center py-2 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">You earned</p>
            <p className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color: '#0F766E' }}>
              {fmt(data.totalCommission)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              from {data.salesCount} sale{data.salesCount === 1 ? '' : 's'} worth {fmt(data.totalRevenue)}
            </p>
          </div>

          {data.byProduct.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Where it came from
              </h3>
              <div className="space-y-1.5">
                {data.byProduct.map((entry) => (
                  <div
                    key={`${entry.productId}:${entry.variantId ?? ''}`}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="text-sm text-gray-600 truncate">
                      {entry.productName}
                      {entry.variantName ? ` · ${entry.variantName}` : ''}
                      <span className="text-gray-400"> ×{entry.unitsSold}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: '#0F172A' }}>
                      {fmt(entry.commission)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
