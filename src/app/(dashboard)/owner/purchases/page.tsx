'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BarChart3, Building2, History, Plus, ShoppingBag } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { getPurchaseStats } from '@/services/purchases';
import { useShop } from '@/hooks/useShop';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

const LINKS = [
  { href: '/owner/purchases/history', icon: History, label: 'All purchases', hint: 'Everything you’ve bought' },
  { href: '/owner/purchases/suppliers', icon: Building2, label: 'Suppliers', hint: 'Who you buy from' },
  { href: '/owner/purchases/reports', icon: BarChart3, label: 'Reports', hint: 'Where the money goes' },
];

export default function PurchasingHomePage() {
  const { purchasingEnabled, currency, isLoading: shopLoading } = useShop();
  const user = useAuthStore((s) => s.user);
  const canCreate = hasPermission(user, 'create_purchases');
  const canSeePrices = hasPermission(user, 'view_purchase_prices');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['purchaseStats'],
    queryFn: getPurchaseStats,
    enabled: purchasingEnabled,
  });

  const fmt = (n?: number) =>
    n == null ? '—' : `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  if (!shopLoading && !purchasingEnabled) {
    return (
      <Card>
        <p className="text-sm text-gray-600">
          Purchasing is switched off for this shop. Turn it on under{' '}
          <Link href="/owner/profile" className="font-semibold underline" style={{ color: '#0F766E' }}>
            Profile → Shop Features
          </Link>{' '}
          to record stock purchases and suppliers.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Purchasing</h1>
          <p className="text-gray-500 text-sm mt-1">Stock coming in, and what it cost you</p>
        </div>
        {canCreate && (
          <Link href="/owner/purchases/new">
            <Button><Plus className="w-4 h-4" /> Record purchase</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Purchases</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {stats?.purchaseCount ?? 0}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total spend</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {canSeePrices ? fmt(stats?.totalSpend) : '—'}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Products</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {stats?.productsPurchased ?? 0}
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Suppliers</p>
              <p className="text-xl font-bold mt-1 tabular-nums" style={{ color: '#0F172A' }}>
                {stats?.suppliersUsed ?? 0}
              </p>
            </Card>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {LINKS.map(({ href, icon: Icon, label, hint }) => (
              <Link key={href} href={href}>
                <Card padding="sm" className="h-full hover:border-teal-200 transition-colors">
                  <Icon className="w-5 h-5 mb-2" style={{ color: '#0F766E' }} />
                  <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <h2 className="font-bold mb-3" style={{ color: '#0F172A' }}>Recent purchases</h2>
            {(stats?.recentPurchases.length ?? 0) === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">Nothing recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats!.recentPurchases.map((purchase) => (
                  <Link
                    key={purchase._id}
                    href={`/owner/purchases/${purchase._id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50 transition-colors -mx-2 px-2 rounded-lg"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                        {purchase.supplierName || 'No supplier'}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {format(new Date(purchase.purchaseDate), 'd MMM yyyy')} · {purchase.items.length} item
                        {purchase.items.length === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      {purchase.status === 'pending_approval' && <Badge color="yellow">Awaiting approval</Badge>}
                      {purchase.status === 'cancelled' && <Badge color="gray">Cancelled</Badge>}
                      <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                        {canSeePrices ? fmt(purchase.grandTotal) : '—'}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
