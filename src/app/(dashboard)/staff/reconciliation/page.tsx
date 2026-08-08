'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { useShop } from '@/hooks/useShop';
import { useMoney } from '@/lib/money';
import { getCashierReconciliation, type ReconciliationPeriod } from '@/services/reconciliation';

const PERIOD_LABELS: Record<ReconciliationPeriod, string> = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
};

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={clsx('text-sm', muted ? 'text-gray-400' : 'text-gray-600')}>{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>{value}</span>
    </div>
  );
}

export default function MyReconciliationPage() {
  const fmt = useMoney();
  const { shiftManagementEnabled, isLoading: shopLoading } = useShop();
  const [period, setPeriod] = useState<ReconciliationPeriod>('day');

  const { data, isLoading } = useQuery({
    queryKey: ['my-reconciliation', period],
    queryFn: () => getCashierReconciliation({ period }),
    enabled: shiftManagementEnabled,
  });

  // The server scopes a non-owner caller to their own data regardless of any
  // staffId — this is always at most one row.
  const mine = data?.data.cashiers[0];

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>My Reconciliation</h1>
        <p className="text-gray-500 text-sm mt-1">Your sales and drawer, matched up</p>
      </div>

      {!shopLoading && !shiftManagementEnabled ? (
        <Card>
          <p className="text-sm text-gray-600 py-2">
            Your shop hasn&apos;t switched on shift management, so there&apos;s no drawer to reconcile yet.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F1F5F9' }}>
            {(Object.keys(PERIOD_LABELS) as ReconciliationPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={period === p ? { backgroundColor: 'white', color: '#0F172A' } : { color: '#64748B' }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : !mine || mine.shiftsCount === 0 ? (
            <Card>
              <p className="text-sm text-gray-500 py-4 text-center">
                No closed shifts in this period yet.
                {mine && mine.unclosedCount > 0 ? ' You have a shift still open.' : ''}
              </p>
            </Card>
          ) : (
            <Card>
              <div className="space-y-4">
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Sales</h4>
                  <Row label={`Shifts (${mine.shiftsCount})`} value={`${mine.salesCount} sales`} />
                  <Row label="Gross sales" value={fmt(mine.grossSales)} />
                  <Row label="Cash" value={fmt(mine.byMethod.cash)} />
                  <Row label="M-Pesa" value={fmt(mine.byMethod.mpesa)} />
                  {mine.byMethod.card > 0 && <Row label="Card" value={fmt(mine.byMethod.card)} />}
                </section>

                {(mine.refunds.count > 0 || mine.voids.count > 0) && (
                  <section className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Out</h4>
                    {mine.refunds.count > 0 && (
                      <Row label={`Refunds (${mine.refunds.count})`} value={`−${fmt(mine.refunds.total)}`} />
                    )}
                    {mine.voids.count > 0 && (
                      <Row label={`Voided (${mine.voids.count})`} value={`−${fmt(mine.voids.total)}`} muted />
                    )}
                  </section>
                )}

                <section className="pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Drawer</h4>
                  <Row label="Expected cash" value={fmt(mine.expectedCashTotal)} />
                  <Row label="Counted" value={fmt(mine.actualCashTotal)} />
                </section>

                <div
                  className="rounded-xl p-3 flex items-baseline justify-between gap-4"
                  style={{ backgroundColor: mine.cashDiscrepancyTotal === 0 ? '#F0FDF4' : '#FEF3C7' }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: mine.cashDiscrepancyTotal === 0 ? '#15803D' : '#92400E' }}
                  >
                    {mine.cashDiscrepancyTotal === 0 ? 'Balanced' : mine.cashDiscrepancyTotal > 0 ? 'Over by' : 'Short by'}
                  </span>
                  <span
                    className="text-base font-bold tabular-nums"
                    style={{ color: mine.cashDiscrepancyTotal === 0 ? '#15803D' : '#92400E' }}
                  >
                    {fmt(Math.abs(mine.cashDiscrepancyTotal))}
                  </span>
                </div>

                {mine.unclosedCount > 0 && (
                  <p className="text-xs text-gray-400 text-center">
                    You have {mine.unclosedCount} shift{mine.unclosedCount > 1 ? 's' : ''} still open, not counted above.
                  </p>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
