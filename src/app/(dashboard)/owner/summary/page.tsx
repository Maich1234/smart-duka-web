'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { getDailySummary } from '@/services/shifts';
import { useMoney } from '@/lib/money';



const today = () => new Date().toISOString().slice(0, 10);

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card padding="sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </Card>
  );
}

/**
 * The day's close-out — the Z-report an owner checks before locking up.
 *
 * Generated nightly by a cron job, so asking for today mid-afternoon may
 * legitimately have nothing yet. That's an empty state, not an error.
 */
export default function DailySummaryPage() {
  const fmt = useMoney();
  const [date, setDate] = useState(today());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dailySummary', date],
    queryFn: () => getDailySummary(date),
    retry: false,
  });

  const summary = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Daily Summary</h1>
          <p className="text-gray-500 text-sm mt-1">How the day closed out</p>
        </div>
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Summary date"
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-100"
          style={{ color: '#0F172A' }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError || !summary ? (
        <Card>
          <p className="text-sm text-gray-500 py-4 text-center">
            No summary for {format(new Date(date), 'd MMM yyyy')} yet. Summaries are generated
            overnight, so today&apos;s appears tomorrow morning.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Revenue" value={fmt(summary.totals.revenue)} hint={`${summary.totals.transactions} sales`} />
            <Stat label="Gross profit" value={fmt(summary.totals.grossProfit)} />
            <Stat label="Expenses" value={fmt(summary.totals.expenses)} />
            <Stat
              label="Shifts"
              value={String(summary.shifts.count)}
              hint={summary.shifts.unclosed > 0 ? `${summary.shifts.unclosed} left open` : 'all closed'}
            />
          </div>

          {summary.insights.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4" style={{ color: '#B45309' }} />
                <h2 className="font-bold" style={{ color: '#0F172A' }}>Worth noticing</h2>
              </div>
              <ul className="space-y-2">
                {summary.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-gray-600 leading-relaxed">• {insight}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Taken by method</h2>
              <div className="space-y-1.5">
                {(['cash', 'mpesa', 'card'] as const).map((method) => {
                  const totals = summary.byMethod[method];
                  if (!totals || totals.count === 0) return null;
                  return (
                    <div key={method} className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {method === 'mpesa' ? 'M-Pesa' : method} ({totals.count})
                      </span>
                      <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                        {fmt(totals.total)}
                      </span>
                    </div>
                  );
                })}
                {summary.refunds.count > 0 && (
                  <div className="flex items-baseline justify-between pt-1.5 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Refunds ({summary.refunds.count})</span>
                    <span className="text-sm font-semibold tabular-nums text-rose-600">−{fmt(summary.refunds.total)}</span>
                  </div>
                )}
                {summary.voids.count > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-400">Voided ({summary.voids.count})</span>
                    <span className="text-sm text-gray-400 tabular-nums">−{fmt(summary.voids.total)}</span>
                  </div>
                )}
              </div>

              {summary.mpesaReconciliation.delta !== 0 && (
                <div className="mt-3 p-3 rounded-xl text-xs" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  M-Pesa recorded at the till and confirmed by Safaricom differ by{' '}
                  <strong>{fmt(Math.abs(summary.mpesaReconciliation.delta))}</strong>.
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Staff</h2>
              {summary.staffPerformance.length === 0 ? (
                <p className="text-sm text-gray-500">No sales recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {summary.staffPerformance.map((s) => (
                    <div key={s.staffId} className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-600">{s.name} ({s.salesCount})</span>
                      <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                        {fmt(s.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: '#15803D' }} />
                <h2 className="font-bold" style={{ color: '#0F172A' }}>Best sellers</h2>
              </div>
              {summary.bestSellers.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing sold.</p>
              ) : (
                <div className="space-y-1.5">
                  {summary.bestSellers.map((p) => (
                    <div key={p.productId} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-gray-600 truncate">{p.name}</span>
                      <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: '#0F172A' }}>
                        {p.quantity} · {fmt(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-gray-400" />
                <h2 className="font-bold" style={{ color: '#0F172A' }}>Slow movers</h2>
              </div>
              {summary.slowMovers.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing stalling.</p>
              ) : (
                <div className="space-y-1.5">
                  {summary.slowMovers.map((p) => (
                    <div key={p.productId} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-gray-600 truncate">{p.name}</span>
                      <span className="text-sm text-gray-400 tabular-nums shrink-0">{p.stock} in stock</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
