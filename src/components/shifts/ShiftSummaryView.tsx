import clsx from 'clsx';
import type { ShiftSummary } from '@/services/shifts';
import { useMoney } from '@/lib/money';



function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={clsx('text-sm', muted ? 'text-gray-400' : 'text-gray-600')}>{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>{value}</span>
    </div>
  );
}

/**
 * What happened during a shift. Shared by the closing dialog and the shift
 * detail page so the numbers a cashier signs off on are the same ones the
 * owner reviews later.
 */
export default function ShiftSummaryView({
  summary,
  openingFloat,
  closingCount,
}: {
  summary: ShiftSummary;
  openingFloat?: number;
  closingCount?: number;
}) {
  const fmt = useMoney();
  const discrepancy = summary.cashDiscrepancy;

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Sales</h4>
        <Row label={`Sales (${summary.salesCount})`} value={fmt(summary.grossSales)} />
        {summary.discounts > 0 && <Row label="Discounts" value={`−${fmt(summary.discounts)}`} />}
        <Row label={`Cash (${summary.byMethod.cash.count})`} value={fmt(summary.byMethod.cash.total)} />
        <Row label={`M-Pesa (${summary.byMethod.mpesa.count})`} value={fmt(summary.byMethod.mpesa.total)} />
        {summary.byMethod.card.count > 0 && (
          <Row label={`Card (${summary.byMethod.card.count})`} value={fmt(summary.byMethod.card.total)} />
        )}
      </section>

      {(summary.refunds.count > 0 || summary.voids.count > 0 || summary.cashExpenses.count > 0) && (
        <section className="pt-3 border-t border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Out</h4>
          {summary.refunds.count > 0 && (
            <Row label={`Refunds (${summary.refunds.count})`} value={`−${fmt(summary.refunds.total)}`} />
          )}
          {summary.voids.count > 0 && (
            <Row label={`Voided (${summary.voids.count})`} value={`−${fmt(summary.voids.total)}`} muted />
          )}
          {summary.cashExpenses.count > 0 && (
            <Row label={`Cash expenses (${summary.cashExpenses.count})`} value={`−${fmt(summary.cashExpenses.total)}`} />
          )}
        </section>
      )}

      <section className="pt-3 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Drawer</h4>
        {openingFloat != null && <Row label="Opening float" value={fmt(openingFloat)} />}
        <Row label="Expected in drawer" value={fmt(summary.expectedCash)} />
        {closingCount != null && <Row label="Counted" value={fmt(closingCount)} />}
      </section>

      {discrepancy != null && (
        <div
          className="rounded-xl p-3 flex items-baseline justify-between gap-4"
          style={{
            // Exact is the only good outcome; over and short are both worth
            // a second look, so neither gets a reassuring colour.
            backgroundColor: discrepancy === 0 ? '#F0FDF4' : '#FEF3C7',
          }}
        >
          <span className="text-sm font-semibold" style={{ color: discrepancy === 0 ? '#15803D' : '#92400E' }}>
            {discrepancy === 0 ? 'Balanced' : discrepancy > 0 ? 'Over by' : 'Short by'}
          </span>
          <span className="text-base font-bold tabular-nums" style={{ color: discrepancy === 0 ? '#15803D' : '#92400E' }}>
            {discrepancy === 0 ? fmt(0) : fmt(Math.abs(discrepancy))}
          </span>
        </div>
      )}
    </div>
  );
}
