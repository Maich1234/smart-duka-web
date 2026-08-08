'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Users, ScrollText, ChevronLeft, ChevronRight, DollarSign, Receipt, ShoppingBag, Wallet,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Spinner from '@/components/ui/Spinner';
import StatsCard from '@/components/dashboard/StatsCard';
import { useShop } from '@/hooks/useShop';
import { useMoney } from '@/lib/money';
import {
  getCashierReconciliation,
  getMonthlyReconciliation,
  type CashierReconciliation,
  type ReconciliationPeriod,
} from '@/services/reconciliation';

type Tab = 'cashiers' | 'monthly';

const TEAL = '#0F766E';
const GOLD = '#C8932A';
const CORAL = '#F43F5E';

const PERIOD_LABELS: Record<ReconciliationPeriod, string> = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
};

const ttStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-bold mb-5" style={{ color: '#0F172A' }}>{title}</h2>
      {children}
    </div>
  );
}

function CashiersTab() {
  const fmt = useMoney();
  const { shiftManagementEnabled, isLoading: shopLoading } = useShop();
  const [period, setPeriod] = useState<ReconciliationPeriod>('day');

  const { data, isLoading } = useQuery({
    queryKey: ['reconciliation-cashiers', period],
    queryFn: () => getCashierReconciliation({ period }),
    enabled: shiftManagementEnabled,
  });

  if (!shopLoading && !shiftManagementEnabled) {
    return (
      <Card>
        <p className="text-sm text-gray-600">
          Cashier reconciliation needs shift management. Turn it on under{' '}
          <Link href="/owner/profile" className="font-semibold underline" style={{ color: '#0F766E' }}>
            Profile → Shop Features
          </Link>{' '}
          to have staff clock in and count the drawer.
        </p>
      </Card>
    );
  }

  const cashiers = data?.data.cashiers ?? [];

  return (
    <div className="space-y-4">
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

      <SectionCard title="Cashier Reconciliation">
        <Table<CashierReconciliation>
          columns={[
            {
              key: 'staffName', header: 'Cashier', render: (c) => (
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: '#0F172A' }}>{c.staffName}</span>
                  {c.unclosedCount > 0 && <Badge color="yellow">{c.unclosedCount} open</Badge>}
                </div>
              ),
            },
            { key: 'shiftsCount', header: 'Shifts' },
            { key: 'salesCount', header: 'Sales' },
            { key: 'grossSales', header: 'Gross Sales', render: (c) => fmt(c.grossSales) },
            { key: 'cash', header: 'Cash In', render: (c) => fmt(c.byMethod.cash) },
            { key: 'expected', header: 'Expected Cash', render: (c) => fmt(c.expectedCashTotal) },
            { key: 'actual', header: 'Actual Cash', render: (c) => fmt(c.actualCashTotal) },
            {
              key: 'discrepancy', header: 'Discrepancy', render: (c) => {
                if (c.shiftsCount === 0) return <span className="text-gray-400">—</span>;
                if (c.cashDiscrepancyTotal === 0) return <Badge color="green">Balanced</Badge>;
                return (
                  <Badge color="yellow">
                    {c.cashDiscrepancyTotal > 0 ? 'Over' : 'Short'} {fmt(Math.abs(c.cashDiscrepancyTotal))}
                  </Badge>
                );
              },
            },
            {
              key: 'voids', header: 'Voids', render: (c) => c.voids.count > 0
                ? <span className="font-medium" style={{ color: '#DC2626' }}>{c.voids.count} · {fmt(c.voids.total)}</span>
                : <span className="text-gray-400">0</span>,
            },
          ]}
          data={cashiers}
          keyExtractor={(c) => c.staffId}
          loading={isLoading}
          emptyMessage="No closed shifts in this period yet."
        />
      </SectionCard>
    </div>
  );
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function MonthlyTab() {
  const fmt = useMoney();
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const isCurrentMonth = monthKey(monthDate) === monthKey(new Date());

  const { data, isLoading } = useQuery({
    queryKey: ['reconciliation-monthly', monthKey(monthDate)],
    // A date-only string, not monthDate.toISOString(): the backend parses
    // this as UTC, but toISOString() would convert the browser's *local*
    // midnight to UTC first — for any shop east of UTC (Kenya, Uganda,
    // Tanzania, Rwanda...) that shifts the 1st back into the previous UTC
    // day, so "August" would silently fetch July's numbers.
    queryFn: () => getMonthlyReconciliation({ date: `${monthKey(monthDate)}-01` }),
  });

  const d = data?.data;
  const chartData = [
    { label: 'Revenue', value: d?.revenue ?? 0, fill: TEAL },
    { label: 'Expenses', value: d?.expenses ?? 0, fill: CORAL },
    { label: 'Purchases', value: d?.purchases ?? 0, fill: GOLD },
  ];
  const netPositive = (d?.netCashPosition ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMonthDate((cur) => new Date(cur.getFullYear(), cur.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold min-w-[9rem] text-center" style={{ color: '#0F172A' }}>
          {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setMonthDate((cur) => new Date(cur.getFullYear(), cur.getMonth() + 1, 1))}
          disabled={isCurrentMonth}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard icon={DollarSign} label="Revenue" value={fmt(d?.revenue ?? 0)} iconColor={TEAL} iconBg="#CCFBF1" />
            <StatsCard icon={Receipt} label="Expenses" value={fmt(d?.expenses ?? 0)} iconColor={CORAL} iconBg="#FEE2E2" />
            <StatsCard icon={ShoppingBag} label="Purchases" value={fmt(d?.purchases ?? 0)} iconColor={GOLD} iconBg="#FEF3C7" />
            <StatsCard
              icon={Wallet}
              label="Net Position"
              value={fmt(d?.netCashPosition ?? 0)}
              iconColor={netPositive ? '#16a34a' : CORAL}
              iconBg={netPositive ? '#dcfce7' : '#fee2e2'}
            />
          </div>

          <SectionCard title="Sales vs. Expenses vs. Purchases">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip contentStyle={ttStyle} formatter={(v: number) => [fmt(v)]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Expenses by Category">
            {(d?.expensesByCategory.length ?? 0) === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No expenses recorded this month.</p>
            ) : (
              <div className="space-y-3">
                {d!.expensesByCategory.map((c) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600">{c.category}</span>
                    <span className="font-semibold" style={{ color: '#0F172A' }}>{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

export default function ReconciliationPage() {
  const [tab, setTab] = useState<Tab>('cashiers');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Reconciliation</h1>
        <p className="text-gray-500 text-sm mt-1">Match sales to cashiers, and the month&apos;s books to what actually moved</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'cashiers' as const, label: 'Cashiers', icon: Users },
          { id: 'monthly' as const, label: 'Month Financials', icon: ScrollText },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? 'bg-white shadow-sm text-[#0F766E]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'cashiers' ? <CashiersTab /> : <MonthlyTab />}
    </div>
  );
}
