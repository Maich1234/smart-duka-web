'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, ShoppingCart, TrendingUp, CreditCard, Banknote,
  Star, BarChart2, Package, Users,
} from 'lucide-react';
import api from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import Spinner from '@/components/ui/Spinner';

// ── Types ────────────────────────────────────────────────────────────────────

type Period = 'daily' | 'weekly' | 'monthly';
type Tab = 'overview' | 'revenue' | 'products' | 'staff';

interface SeriesPoint {
  label: string;
  date: string;
  total: number;
  cashTotal: number;
  mpesaTotal: number;
  transactionCount: number;
}

interface ReportData {
  period: string;
  rangeStart: string;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    cashTotal: number;
    mpesaTotal: number;
    averageSale: number;
    expenseTotal: number;
    netProfit: number;
  };
  series: SeriesPoint[];
  topProducts: { productName: string; quantitySold: number; revenue: number }[];
  byStaff: { staffName: string; total: number; transactionCount: number }[];
  ratingSummary: { avgStars: number; totalRatings: number };
}

interface StaffRating {
  staffId: string;
  staffName: string;
  avgStars: number;
  totalRatings: number;
}

interface RatingsSummaryData {
  avgStars: number;
  totalRatings: number;
  distribution: { stars: number; count: number }[];
  byStaff: StaffRating[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const TEAL = '#0F766E';
const GOLD = '#C8932A';
const CORAL = '#F43F5E';
const BLUE = '#3B82F6';

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Last 7 days',
  weekly: 'Last 4 weeks',
  monthly: 'Last 6 months',
};

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'staff', label: 'Staff & Ratings', icon: Users },
];

const ttStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };
const fmtK = (v: number) => `${(v / 1000).toFixed(1)}k`;
const fmtKES = (v: number) => `KES ${v.toLocaleString()}`;

// ── Small helpers ─────────────────────────────────────────────────────────────

function StarDisplay({ value, size = 'sm' }: { value: number; size?: 'sm' | 'lg' }) {
  const w = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={w}
          fill={s <= Math.round(value) ? '#F59E0B' : '#E5E7EB'}
          stroke="none"
        />
      ))}
    </div>
  );
}

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <h2 className="text-base font-bold mb-5" style={{ color: '#0F172A' }}>{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <p className="text-center text-gray-400 py-12 text-sm">{message}</p>;
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: ReportData | undefined }) {
  const s = data?.summary;
  const netPositive = (s?.netProfit || 0) >= 0;
  const hasPayments = (s?.cashTotal || 0) + (s?.mpesaTotal || 0) > 0;

  const payPie = [
    { name: 'Cash', value: s?.cashTotal || 0, color: TEAL },
    { name: 'M-Pesa', value: s?.mpesaTotal || 0, color: GOLD },
  ];

  const finData = [
    { label: 'Revenue', value: s?.totalRevenue || 0, fill: TEAL },
    { label: 'Expenses', value: s?.expenseTotal || 0, fill: CORAL },
    { label: 'Net Profit', value: s?.netProfit || 0, fill: BLUE },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard icon={DollarSign} label="Total Revenue" value={`KES ${(s?.totalRevenue || 0).toLocaleString()}`} iconColor={TEAL} iconBg="#CCFBF1" />
        <StatsCard icon={ShoppingCart} label="Transactions" value={s?.totalTransactions || 0} iconColor={GOLD} iconBg="#FEF3C7" />
        <StatsCard icon={TrendingUp} label="Avg Sale" value={`KES ${(s?.averageSale || 0).toFixed(0)}`} iconColor={BLUE} iconBg="#EFF6FF" />
        <StatsCard icon={Banknote} label="Cash" value={`KES ${(s?.cashTotal || 0).toLocaleString()}`} iconColor={TEAL} iconBg="#CCFBF1" />
        <StatsCard icon={CreditCard} label="M-Pesa" value={`KES ${(s?.mpesaTotal || 0).toLocaleString()}`} iconColor={GOLD} iconBg="#FEF3C7" />
        <StatsCard icon={DollarSign} label="Net Profit" value={`KES ${(s?.netProfit || 0).toLocaleString()}`} iconColor={netPositive ? '#16a34a' : CORAL} iconBg={netPositive ? '#dcfce7' : '#fee2e2'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Payment Method Split">
          {!hasPayments ? <EmptyChart message="No payment data" /> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="52%" height={190}>
                <PieChart>
                  <Pie data={payPie} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {payPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} formatter={(v: number) => [fmtKES(v)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-4">
                {payPie.map((d) => {
                  const total = (s?.cashTotal || 0) + (s?.mpesaTotal || 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={d.name}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-sm text-gray-600">{d.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{pct}%</span>
                      </div>
                      <p className="text-base font-extrabold pl-4.5" style={{ color: '#0F172A' }}>KES {d.value.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Financial Overview">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={finData} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtK} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} width={72} />
              <Tooltip contentStyle={ttStyle} formatter={(v: number) => [fmtKES(v)]} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {finData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
            {finData.map((d) => (
              <span key={d.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.label}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function RevenueTab({ data }: { data: ReportData | undefined }) {
  const series = data?.series || [];

  return (
    <div className="space-y-6">
      <SectionCard title="Revenue Trend — Cash vs M-Pesa">
        {series.length === 0 ? <EmptyChart message="No data for selected period" /> : (
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMpesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtK} />
              <Tooltip
                contentStyle={ttStyle}
                formatter={(v: number, name: string) => [fmtKES(v), name === 'cashTotal' ? 'Cash' : 'M-Pesa']}
              />
              <Legend formatter={(v) => (v === 'cashTotal' ? 'Cash' : 'M-Pesa')} />
              <Area type="monotone" dataKey="cashTotal" stroke={TEAL} strokeWidth={2} fill="url(#gradCash)" />
              <Area type="monotone" dataKey="mpesaTotal" stroke={GOLD} strokeWidth={2} fill="url(#gradMpesa)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <SectionCard title="Daily Transaction Count">
        {series.length === 0 ? <EmptyChart message="No data for selected period" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={ttStyle}
                formatter={(v: number) => [v, 'Transactions']}
              />
              <Bar dataKey="transactionCount" name="Transactions" fill={BLUE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </div>
  );
}

function ProductsTab({ data }: { data: ReportData | undefined }) {
  const topProducts = (data?.topProducts || []).slice(0, 10);

  return (
    <SectionCard title="Top Products by Revenue">
      {topProducts.length === 0 ? <EmptyChart message="No product sales data" /> : (
        <ResponsiveContainer width="100%" height={Math.max(220, topProducts.length * 52)}>
          <BarChart data={topProducts} layout="vertical" barSize={16} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtK} />
            <YAxis type="category" dataKey="productName" tick={{ fontSize: 11, fill: '#64748b' }} width={145} />
            <Tooltip
              contentStyle={ttStyle}
              formatter={(v: number, name: string) => [
                name === 'revenue' ? fmtKES(v) : `${v} units`,
                name === 'revenue' ? 'Revenue' : 'Units Sold',
              ]}
            />
            <Legend formatter={(v) => (v === 'revenue' ? 'Revenue' : 'Units Sold')} />
            <Bar dataKey="revenue" name="revenue" fill={TEAL} radius={[0, 6, 6, 0]} />
            <Bar dataKey="quantitySold" name="quantitySold" fill={GOLD} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

function StaffTab({
  reportData,
  ratingsData,
  ratingsLoading,
}: {
  reportData: ReportData | undefined;
  ratingsData: RatingsSummaryData | undefined;
  ratingsLoading: boolean;
}) {
  const byStaff = reportData?.byStaff || [];
  const staffRatings = ratingsData?.byStaff || [];
  const distribution = ratingsData?.distribution || [];

  // Build distribution chart data (fill missing stars with 0)
  const distData = [1, 2, 3, 4, 5].map((star) => {
    const found = distribution.find((d) => d.stars === star);
    return { label: `${star}★`, count: found?.count || 0 };
  });

  return (
    <div className="space-y-6">
      {/* Staff Sales Performance */}
      <SectionCard title="Staff Sales Performance">
        {byStaff.length === 0 ? <EmptyChart message="No staff sales data for selected period" /> : (
          <ResponsiveContainer width="100%" height={Math.max(220, byStaff.length * 60)}>
            <BarChart data={byStaff} layout="vertical" barSize={18} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtK} />
              <YAxis type="category" dataKey="staffName" tick={{ fontSize: 12, fill: '#64748b' }} width={110} />
              <Tooltip
                contentStyle={ttStyle}
                formatter={(v: number, name: string) => [
                  name === 'total' ? fmtKES(v) : `${v} sales`,
                  name === 'total' ? 'Revenue' : 'Transactions',
                ]}
              />
              <Legend formatter={(v) => (v === 'total' ? 'Revenue' : 'Transactions')} />
              <Bar dataKey="total" name="total" fill={TEAL} radius={[0, 6, 6, 0]} />
              <Bar dataKey="transactionCount" name="transactionCount" fill={BLUE} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Per-Staff Ratings — fetched lazily when this tab opens */}
      {ratingsLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <>
          {/* Overall rating + distribution */}
          {ratingsData && ratingsData.totalRatings > 0 && (
            <div className="grid lg:grid-cols-2 gap-4">
              <SectionCard title="Overall Customer Rating">
                <div className="flex items-center gap-5 mb-6">
                  <div className="text-center">
                    <p className="text-5xl font-extrabold" style={{ color: '#0F172A' }}>
                      {ratingsData.avgStars.toFixed(1)}
                    </p>
                    <StarDisplay value={ratingsData.avgStars} size="lg" />
                    <p className="text-sm text-gray-400 mt-2">{ratingsData.totalRatings} reviews</p>
                  </div>
                </div>
                {/* Star distribution mini bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const d = distData.find((x) => x.label === `${star}★`);
                    const count = d?.count || 0;
                    const pct = ratingsData.totalRatings > 0 ? (count / ratingsData.totalRatings) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-0.5 w-14 shrink-0">
                          <Star className="w-3.5 h-3.5" fill="#F59E0B" stroke="none" />
                          <span className="text-gray-500">{star}</span>
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: '#F59E0B' }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-400 text-xs">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Rating Distribution">
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={distData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip contentStyle={ttStyle} formatter={(v: number) => [v, 'Reviews']} />
                    <Bar dataKey="count" name="Reviews" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>
          )}

          {/* Per-staff rating cards */}
          {staffRatings.length > 0 && (
            <SectionCard title="Ratings by Employee">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffRatings.map((sr) => (
                  <div
                    key={sr.staffId}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: TEAL }}
                    >
                      {sr.staffName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: '#0F172A' }}>{sr.staffName}</p>
                      <StarDisplay value={sr.avgStars} />
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sr.avgStars.toFixed(1)} avg · {sr.totalRatings} {sr.totalRatings === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {ratingsData && ratingsData.totalRatings === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
              <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No customer ratings yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [tab, setTab] = useState<Tab>('overview');

  const { data: reportData, isLoading: reportLoading } = useQuery<ReportData>({
    queryKey: ['reports', period],
    queryFn: async () => {
      const res = await api.get(`/reports/sales?period=${period}`);
      return res.data.data;
    },
  });

  const { data: ratingsData, isLoading: ratingsLoading } = useQuery<RatingsSummaryData>({
    queryKey: ['ratings-summary'],
    queryFn: async () => {
      const res = await api.get('/ratings/summary');
      return res.data.data;
    },
    enabled: tab === 'staff',
    staleTime: 5 * 60 * 1000,
  });

  const showPeriod = tab !== 'staff';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Business performance & insights</p>
        </div>
        {showPeriod && (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p ? 'bg-white shadow-sm text-[#0F766E]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 rounded-xl p-1 scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
              tab === id
                ? 'bg-white shadow-sm text-[#0F766E]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {reportLoading && tab !== 'staff' ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {tab === 'overview' && <OverviewTab data={reportData} />}
          {tab === 'revenue' && <RevenueTab data={reportData} />}
          {tab === 'products' && <ProductsTab data={reportData} />}
          {tab === 'staff' && (
            <StaffTab
              reportData={reportData}
              ratingsData={ratingsData}
              ratingsLoading={ratingsLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
