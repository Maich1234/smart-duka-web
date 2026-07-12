'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import adminApi from '@/lib/adminApi';
import Table from '@/components/ui/Table';

interface AuditLogRow {
  _id: string;
  shopId: { _id: string; name: string } | null;
  userId: { _id: string; name: string; email: string } | null;
  action: string;
  entityType: string | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', page],
    queryFn: async () =>
      (await adminApi.get('/audit', { params: { page, limit: 30 } })).data as {
        data: AuditLogRow[];
        pagination: { page: number; limit: number; total: number; pages: number };
      },
  });
  const logs = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Audit Log</h1>
        <p className="text-gray-500 text-sm mt-1">Every sensitive payment/subscription action across all shops — read only</p>
      </div>

      <Table<AuditLogRow>
        columns={[
          { key: 'createdAt', header: 'When', render: (l) => format(new Date(l.createdAt), 'MMM d, HH:mm') },
          { key: 'shopId', header: 'Shop', render: (l) => l.shopId?.name ?? '—' },
          { key: 'userId', header: 'User', render: (l) => l.userId?.name ?? '—' },
          { key: 'action', header: 'Action', render: (l) => <span className="font-mono text-xs">{l.action}</span> },
          { key: 'entityType', header: 'Entity' },
        ]}
        data={logs}
        keyExtractor={(l) => l._id}
        loading={isLoading}
        emptyMessage="No audit log entries yet"
      />

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
