'use client';

import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, TrendingUp, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import api from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';

interface StaffStats {
  todaySalesTotal: number;
  transactionsToday: number;
  recentSales: Sale[];
}

interface Sale {
  _id: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: { productName: string }[];
}

export default function StaffDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading: statsLoading } = useQuery<StaffStats>({
    queryKey: ['staff-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/staff');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {statsLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            icon={TrendingUp}
            label="My Sales Today"
            value={`KES ${(stats?.todaySalesTotal || 0).toLocaleString()}`}
            iconColor="#0F766E"
            iconBg="#CCFBF1"
          />
          <StatsCard
            icon={ShoppingCart}
            label="Transactions"
            value={stats?.transactionsToday || 0}
            iconColor="#C8932A"
            iconBg="#FEF3C7"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <h2 className="font-bold mb-4" style={{ color: '#0F172A' }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/staff/sales', icon: ShoppingCart, label: 'New Sale', color: '#0F766E', bg: '#CCFBF1' },
              { href: '/staff/inventory', icon: Package, label: 'View Products', color: '#C8932A', bg: '#FEF3C7' },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <div className="p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: a.bg }}>
                    <a.icon className="w-5 h-5" style={{ color: a.color }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{a.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Sales */}
        <Card>
          <h2 className="font-bold mb-4" style={{ color: '#0F172A' }}>My Recent Sales</h2>
          {statsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (stats?.recentSales || []).length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No sales yet today. Go make some sales!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(stats?.recentSales || []).map((sale) => (
                <div key={sale._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
                      {sale.items?.[0]?.productName || 'Sale'}
                      {sale.items?.length > 1 ? ` +${sale.items.length - 1}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{format(new Date(sale.createdAt), 'HH:mm')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#0F766E' }}>KES {sale.totalAmount?.toLocaleString()}</p>
                    <Badge color={sale.paymentMethod === 'mpesa' ? 'teal' : 'gray'} className="text-xs">
                      {sale.paymentMethod || 'cash'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
