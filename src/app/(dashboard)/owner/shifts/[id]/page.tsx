'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ShiftSummaryView from '@/components/shifts/ShiftSummaryView';
import { getShiftById } from '@/services/shifts';

export default function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shift', id],
    queryFn: () => getShiftById(id),
  });

  const shift = data?.data;
  // An open shift has no stored summary yet; the endpoint computes a live one
  // so the owner can see where a running till stands.
  const summary = shift?.summary ?? data?.liveSummary ?? null;
  const staffName = typeof shift?.staff === 'object' && shift.staff ? shift.staff.name : 'Unknown';

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/owner/shifts">
          <span className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Shift</h1>
          {shift && <p className="text-gray-500 text-sm">{staffName}</p>}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError || !shift ? (
        <Card><p className="text-sm text-gray-500 py-4 text-center">Couldn&apos;t load this shift.</p></Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {shift.status === 'active' ? <Badge color="green">Open</Badge> : <Badge color="gray">Closed</Badge>}
              <span className="text-sm text-gray-500">
                {format(new Date(shift.startedAt), 'd MMM yyyy, HH:mm')}
                {shift.endedAt ? ` → ${format(new Date(shift.endedAt), 'HH:mm')}` : ''}
              </span>
              {shift.summary?.durationMinutes != null && (
                <span className="text-sm text-gray-400">
                  {Math.floor(shift.summary.durationMinutes / 60)}h {shift.summary.durationMinutes % 60}m
                </span>
              )}
            </div>

            {summary ? (
              <ShiftSummaryView
                summary={summary}
                openingFloat={shift.openingFloat}
                closingCount={shift.closingCount}
              />
            ) : (
              <p className="text-sm text-gray-500">No activity recorded for this shift.</p>
            )}
          </Card>

          {(shift.openingNote || shift.closingNote) && (
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Notes</h3>
              {shift.openingNote && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Opening:</span> {shift.openingNote}
                </p>
              )}
              {shift.closingNote && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Closing:</span> {shift.closingNote}
                </p>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
