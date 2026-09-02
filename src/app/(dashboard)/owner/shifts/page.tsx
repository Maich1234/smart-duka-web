'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table, { type Column } from '@/components/ui/Table';
import EndShiftModal from '@/components/shifts/EndShiftModal';
import { getShifts, type Shift } from '@/services/shifts';
import { useShop } from '@/hooks/useShop';
import { useMoney } from '@/lib/money';

const PAGE_SIZE = 15;



const staffName = (shift: Shift) =>
  typeof shift.staff === 'object' && shift.staff ? shift.staff.name : 'Unknown';

export default function ShiftsPage() {
  const router = useRouter();
  const fmt = useMoney();
  const { shiftManagementEnabled, isLoading: shopLoading } = useShop();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [forceCloseId, setForceCloseId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['shifts', page, status],
    queryFn: () =>
      getShifts({ page, limit: PAGE_SIZE, ...(status === 'all' ? {} : { status }) }),
  });

  const shifts = data?.data ?? [];
  const pages = data?.pagination?.pages ?? 1;

  const columns: Column<Shift>[] = [
    {
      key: 'staff',
      header: '',
      className: 'w-8',
      render: () => <Clock className="w-4 h-4 text-gray-400" />,
    },
    {
      key: 'name',
      header: 'Staff',
      render: (shift) => (
        <>
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{staffName(shift)}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(shift.startedAt), 'd MMM, HH:mm')}
            {shift.endedAt ? ` → ${format(new Date(shift.endedAt), 'HH:mm')}` : ''}
          </p>
        </>
      ),
    },
    {
      key: 'sales',
      header: 'Sales',
      className: 'text-right',
      render: (shift) =>
        shift.summary ? (
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#0F172A' }}>{fmt(shift.summary.grossSales)}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (shift) => {
        const discrepancy = shift.summary?.cashDiscrepancy;
        if (shift.status === 'active') return <Badge color="green">Open</Badge>;
        if (discrepancy == null) return <Badge color="gray">Not counted</Badge>;
        if (discrepancy === 0) return <Badge color="green">Balanced</Badge>;
        return <Badge color="yellow">{discrepancy > 0 ? 'Over' : 'Short'} {fmt(Math.abs(discrepancy))}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (shift) =>
        shift.status === 'active' ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => setForceCloseId(shift._id)}>Close</Button>
          </div>
        ) : null,
    },
  ];

  if (!shopLoading && !shiftManagementEnabled) {
    return (
      <Card>
        <p className="text-sm text-gray-600">
          Shift management is switched off for this shop. Turn it on under{' '}
          <Link href="/owner/profile" className="font-semibold underline" style={{ color: '#0F766E' }}>
            Profile → Shop Features
          </Link>{' '}
          to have staff clock in and count the drawer.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Shifts</h1>
          <p className="text-gray-500 text-sm mt-1">Who was on the till, and how the drawer balanced</p>
        </div>
        <div className="flex gap-1 p-1 rounded-control" style={{ backgroundColor: '#F1F5F9' }}>
          {(['all', 'active', 'closed'] as const).map((option) => (
            <button
              key={option}
              onClick={() => { setStatus(option); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors"
              style={
                status === option
                  ? { backgroundColor: 'white', color: '#0F172A' }
                  : { color: '#64748B' }
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <Table<Shift>
          columns={columns}
          data={shifts}
          keyExtractor={(shift) => shift._id}
          loading={isLoading}
          onRowClick={(shift) => router.push(`/owner/shifts/${shift._id}`)}
          emptyMessage="No shifts recorded yet."
        />
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Owner force-close. Keyed so reopening for a different shift starts
          clean rather than showing the previous one's summary. */}
      {forceCloseId && (
        <EndShiftModal
          key={forceCloseId}
          isOpen
          shiftId={forceCloseId}
          onClose={() => setForceCloseId(null)}
        />
      )}
    </div>
  );
}
