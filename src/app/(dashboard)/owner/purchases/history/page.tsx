'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { getPurchases, type PurchaseStatus } from '@/services/purchases';
import { useShop } from '@/hooks/useShop';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { MONEY_OUT_METHOD_LABELS } from '@/constants/paymentMethods';

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: 'all' | PurchaseStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending_approval', label: 'Awaiting approval' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PurchaseHistoryPage() {
  const { currency } = useShop();
  const user = useAuthStore((s) => s.user);
  const canSeePrices = hasPermission(user, 'view_purchase_prices');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | PurchaseStatus>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest_cost' | 'lowest_cost'>('newest');

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, search, status, sort],
    queryFn: () =>
      getPurchases({
        page,
        limit: PAGE_SIZE,
        sort,
        search: search || undefined,
        ...(status === 'all' ? {} : { status }),
      }),
  });

  const purchases = data?.data ?? [];
  const pages = data?.pagination?.pages ?? 1;
  const fmt = (n?: number) =>
    n == null ? '—' : `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/owner/purchases">
          <span className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>All Purchases</h1>
          <p className="text-gray-500 text-sm">{data?.pagination?.total ?? 0} recorded</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search supplier or product…"
            aria-label="Search purchases"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
          aria-label="Sort purchases"
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-200"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          {/* Sorting by a number they can't see would be a strange offer. */}
          {canSeePrices && <option value="highest_cost">Highest cost</option>}
          {canSeePrices && <option value="lowest_cost">Lowest cost</option>}
        </select>
      </div>

      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: '#F1F5F9' }}>
        {STATUS_FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => { setStatus(option.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            style={
              status === option.value
                ? { backgroundColor: 'white', color: '#0F172A' }
                : { color: '#64748B' }
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : purchases.length === 0 ? (
        <Card><p className="text-sm text-gray-500 py-6 text-center">No purchases match that.</p></Card>
      ) : (
        <div className="space-y-2">
          {purchases.map((purchase) => (
            <Link key={purchase._id} href={`/owner/purchases/${purchase._id}`}>
              <Card padding="sm" className="hover:border-teal-200 transition-colors">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex-1 min-w-[10rem]">
                    <span className="block text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
                      {purchase.supplierName || 'No supplier'}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {format(new Date(purchase.purchaseDate), 'd MMM yyyy')} ·{' '}
                      {purchase.items.length} item{purchase.items.length === 1 ? '' : 's'}
                      {purchase.paymentMethod ? ` · ${MONEY_OUT_METHOD_LABELS[purchase.paymentMethod]}` : ''}
                    </span>
                  </span>
                  {purchase.status === 'pending_approval' && <Badge color="yellow">Awaiting approval</Badge>}
                  {purchase.status === 'cancelled' && <Badge color="gray">Cancelled</Badge>}
                  <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>
                    {canSeePrices ? fmt(purchase.grandTotal) : '—'}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
