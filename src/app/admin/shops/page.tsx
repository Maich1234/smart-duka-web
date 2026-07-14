'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import adminApi from '@/lib/adminApi';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import ShopSubscriptionModal from '@/components/admin/ShopSubscriptionModal';

interface ShopRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  staffCount: number;
  plan: { name: string; slug: string } | null;
  access: { state: 'none' | 'trialing' | 'active' | 'grace' | 'locked'; daysLeft: number; graceDaysLeft: number };
}

const ACCESS_COLOR: Record<ShopRow['access']['state'], 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  none: 'gray',
  trialing: 'blue',
  active: 'green',
  grace: 'yellow',
  locked: 'red',
};

export default function ShopsPage() {
  const [page, setPage] = useState(1);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'shops', page],
    queryFn: async () =>
      (await adminApi.get('/shops', { params: { page, limit: 20 } })).data as {
        data: ShopRow[];
        pagination: { page: number; limit: number; total: number; pages: number };
      },
  });
  const shops = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Shops</h1>
        <p className="text-gray-500 text-sm mt-1">Every tenant on the platform and their subscription status</p>
      </div>

      <Table<ShopRow>
        columns={[
          { key: 'name', header: 'Shop', render: (s) => (
            <div>
              <p className="font-semibold" style={{ color: '#0F172A' }}>{s.name}</p>
              <p className="text-xs text-gray-400">{s.email}</p>
            </div>
          ) },
          { key: 'plan', header: 'Plan', render: (s) => s.plan?.name ?? '—' },
          { key: 'access', header: 'Access', render: (s) => (
            <Badge color={ACCESS_COLOR[s.access.state]}>
              {s.access.state}{s.access.state === 'trialing' && s.access.daysLeft > 0 ? ` · ${s.access.daysLeft}d left` : ''}
              {s.access.state === 'grace' && s.access.graceDaysLeft > 0 ? ` · ${s.access.graceDaysLeft}d left` : ''}
            </Badge>
          ) },
          { key: 'staffCount', header: 'Staff' },
          { key: 'isActive', header: 'Shop Status', render: (s) => <Badge color={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Deactivated'}</Badge> },
          { key: 'createdAt', header: 'Joined', render: (s) => format(new Date(s.createdAt), 'MMM d, yyyy') },
          { key: 'actions', header: '', render: (s) => (
            <button
              onClick={() => setSelectedShopId(s._id)}
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              View subscription
            </button>
          ) },
        ]}
        data={shops}
        keyExtractor={(s) => s._id}
        loading={isLoading}
        emptyMessage="No shops yet"
      />

      <ShopSubscriptionModal shopId={selectedShopId} onClose={() => setSelectedShopId(null)} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">← Previous</button>
          <span className="text-xs font-semibold text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">Next →</button>
        </div>
      )}
    </div>
  );
}
