'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import StatsCard from '@/components/dashboard/StatsCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import TrialBanner from '@/components/subscription/TrialBanner';
import DailyBrief from '@/components/dashboard/DailyBrief';
import NeedsAttention from '@/components/dashboard/NeedsAttention';
import QuickActions from '@/components/dashboard/QuickActions';
import DepletionSection from '@/components/dashboard/DepletionSection';
import { useOwnerAttention } from '@/hooks/useAttention';
import { buildDailyBrief } from '@/utils/dailyBrief';
import { getOwnerDashboard, type OwnerDashboardData } from '@/services/dashboard';
import { useShop } from '@/hooks/useShop';

export default function OwnerDashboardPage() {
  const { currency, purchasingEnabled } = useShop();
  const { data, isLoading } = useQuery<OwnerDashboardData>({
    queryKey: ['owner-dashboard'],
    queryFn: getOwnerDashboard,
  });

  // Shops price in their own currency; this used to say KES to everyone.
  const fmt = (n?: number) => `${currency} ${(n ?? 0).toLocaleString()}`;

  const brief = buildDailyBrief(data, fmt);
  const attention = useOwnerAttention(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <TrialBanner />

      <NeedsAttention items={attention} />

      <QuickActions purchasingEnabled={purchasingEnabled} />

      <DailyBrief bullets={brief} />

      {/* Stats */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            icon={TrendingUp}
            label="Today's Sales"
            value={fmt(data?.todaySalesTotal)}
            iconColor="#0F766E"
            iconBg="#CCFBF1"
          />
          <StatsCard
            icon={ShoppingCart}
            label="Transactions"
            value={data?.transactionsToday || 0}
            iconColor="#C8932A"
            iconBg="#FEF3C7"
          />
          <StatsCard
            icon={Package}
            label="Total Products"
            value={data?.totalProducts || 0}
            iconColor="#14B8A6"
            iconBg="#CCFBF1"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>Recent Transactions</h2>
            <Link href="/owner/sales" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#0F766E' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (data?.recentTransactions || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No transactions yet today.</p>
          ) : (
            <div className="space-y-3">
              {(data?.recentTransactions || []).map((tx) => (
                <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
                      <ShoppingCart className="w-4 h-4" style={{ color: '#0F766E' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
                        {tx.items?.[0]?.productName || 'Sale'}
                        {(tx.items?.length ?? 0) > 1 ? ` +${tx.items!.length - 1} more` : ''}
                      </p>
                      <p className="text-xs text-gray-400">{format(new Date(tx.createdAt), 'HH:mm')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#0F766E' }}>
                      {fmt(tx.totalAmount)}
                    </p>
                    <Badge color={tx.paymentMethod === 'mpesa' ? 'teal' : 'gray'}>
                      {tx.paymentMethod || 'cash'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>Low Stock</h2>
            </div>
            <Link href="/owner/inventory" className="text-xs font-semibold flex items-center gap-1" style={{ color: '#0F766E' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (data?.lowStockItems || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">All products are well-stocked!</p>
          ) : (
            <div className="space-y-3">
              {(data?.lowStockItems || []).slice(0, 6).map((product) => (
                <div key={product._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium truncate max-w-35" style={{ color: '#0F172A' }}>{product.name}</p>
                    <p className="text-xs text-gray-400">{fmt(product.sellingPrice)}</p>
                  </div>
                  <Badge color={product.quantity === 0 ? 'red' : 'yellow'}>
                    {product.quantity} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <DepletionSection />
    </div>
  );
}
