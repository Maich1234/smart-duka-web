'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { getPurchaseAnalytics } from '@/services/purchases';
import { purchaseCostCategoryLabel } from '@/constants/purchaseCostCategories';
import { useShop } from '@/hooks/useShop';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

/** Sequential teals, so a longer breakdown never runs out of distinct slices. */
const SLICE_COLORS = ['#0F766E', '#14B8A6', '#5EEAD4', '#C8932A', '#F59E0B', '#94A3B8'];

export default function PurchaseReportsPage() {
  const { currency } = useShop();
  const user = useAuthStore((s) => s.user);
  const canSeePrices = hasPermission(user, 'view_purchase_prices');
  const [period, setPeriod] = useState<Period>('monthly');

  const { data, isLoading } = useQuery({
    queryKey: ['purchaseAnalytics', period],
    queryFn: () => getPurchaseAnalytics({ period }),
    enabled: canSeePrices,
  });

  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Every number on this page is money, so without the permission there is
  // nothing left to show — better to say so than render a page of dashes.
  if (!canSeePrices) {
    return (
      <Card>
        <p className="text-sm text-gray-600">
          These reports are all cost figures, which your permissions don&apos;t include.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/owner/purchases">
            <span className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Purchase Reports</h1>
            <p className="text-gray-500 text-sm">Where your buying money goes</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
          {PERIODS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
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
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !data ? (
        <Card><p className="text-sm text-gray-500 py-6 text-center">No purchase data yet.</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Stock bought</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {fmt(data.summary.totalInventoryPurchased)}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Extra costs</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {fmt(data.summary.totalAdditionalCosts)}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F766E' }}>
                {fmt(data.summary.totalProcurementCost)}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Average</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {fmt(data.summary.averageProcurementCost)}
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="font-bold mb-4" style={{ color: '#0F172A' }}>Spending over time</h2>
            {data.series.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing in this period.</p>
            ) : (
              <div className="h-64 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series}>
                    <defs>
                      <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F766E" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#0F766E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Area
                      type="monotone"
                      dataKey="grandTotal"
                      name="Total"
                      stroke="#0F766E"
                      strokeWidth={2}
                      fill="url(#spendFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <h2 className="font-bold mb-4" style={{ color: '#0F172A' }}>Extra costs by type</h2>
              {data.costBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">No extra costs recorded.</p>
              ) : (
                <>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.costBreakdown.map((c) => ({
                            name: purchaseCostCategoryLabel(c.category),
                            value: c.amount,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={78}
                          paddingAngle={2}
                        >
                          {data.costBreakdown.map((_, i) => (
                            <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => fmt(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {data.costBreakdown.map((cost, i) => (
                      <div key={cost.category} className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
                        />
                        <span className="flex-1 text-sm text-gray-600">
                          {purchaseCostCategoryLabel(cost.category)}
                        </span>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                          {fmt(cost.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card>
              <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Most bought</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.topProducts.map((product) => (
                    <div key={product._id} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-gray-600 truncate">
                        {product.productName}
                        <span className="text-gray-400"> ×{product.quantity}</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: '#0F172A' }}>
                        {fmt(product.totalCost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Spend by supplier</h2>
            {data.supplierSpend.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing yet.</p>
            ) : (
              <div className="space-y-1.5">
                {data.supplierSpend.map((supplier) => (
                  <div key={supplier._id ?? supplier.supplierName} className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-gray-600 truncate">
                      {supplier.supplierName || 'No supplier'}
                      <span className="text-gray-400"> · {supplier.purchaseCount} purchase{supplier.purchaseCount === 1 ? '' : 's'}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: '#0F172A' }}>
                      {fmt(supplier.totalSpend)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
