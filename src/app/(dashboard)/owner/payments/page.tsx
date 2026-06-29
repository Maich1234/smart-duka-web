'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Smartphone, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

type TxStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'timeout';

interface MpesaTransaction {
  _id: string;
  phoneNumber: string;
  amount: number;
  status: TxStatus;
  mpesaReceiptNumber: string | null;
  accountReference: string | null;
  errorMessage: string | null;
  transactionDate: string | null;
  createdAt: string;
  saleId?: { _id: string; invoiceNumber: string; totalAmount: number } | null;
  requestedBy?: { _id: string; name: string; email: string } | null;
}

interface Stats {
  totalVolume: number;
  successRate: number;
  successCount: number;
  totalCount: number;
}

type StatusFilter = TxStatus | 'all';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Success', value: 'success' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const STATUS_CONFIG: Record<TxStatus, { bg: string; text: string; dot: string; label: string }> = {
  success:   { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A', label: 'Success' },
  pending:   { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Pending' },
  failed:    { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626', label: 'Failed' },
  cancelled: { bg: '#F3F4F6', text: '#64748B', dot: '#94A3B8', label: 'Cancelled' },
  timeout:   { bg: '#F3F4F6', text: '#64748B', dot: '#94A3B8', label: 'Timeout' },
};

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('254') && d.length === 12) return `+254 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return phone;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);

// ─── Transaction Detail Modal ────────────────────────────────────────────────
function TxDetailModal({ tx, onClose }: { tx: MpesaTransaction; onClose: () => void }) {
  const cfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.failed;

  const rows = [
    { label: 'Phone Number', value: formatPhone(tx.phoneNumber) },
    ...(tx.mpesaReceiptNumber ? [{ label: 'M-Pesa Receipt', value: tx.mpesaReceiptNumber, highlight: true }] : []),
    ...(tx.saleId ? [{ label: 'Invoice', value: tx.saleId.invoiceNumber }] : []),
    ...(tx.accountReference ? [{ label: 'Reference', value: tx.accountReference }] : []),
    ...(tx.requestedBy ? [{ label: 'Cashier', value: tx.requestedBy.name }] : []),
    { label: 'Date & Time', value: format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm') },
    { label: 'Status', value: cfg.label },
    ...(tx.errorMessage ? [{ label: 'Note', value: tx.errorMessage }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
            <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>{cfg.label} Transaction</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount hero */}
        <div className="text-center py-5 px-6" style={{ backgroundColor: '#F8FAFC' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Amount</p>
          <p className="text-3xl font-extrabold tracking-tight" style={{ color: '#0F172A' }}>{fmt(tx.amount)}</p>
        </div>

        {/* Detail rows */}
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between items-center px-5 py-3">
              <span className="text-sm text-gray-500">{row.label}</span>
              <span
                className="text-sm font-semibold text-right max-w-[55%]"
                style={{ color: row.highlight ? '#15803D' : '#0F172A', letterSpacing: row.highlight ? 0.5 : 0 }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="p-5">
          <button onClick={onClose} className="w-full py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: '#0F766E' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<MpesaTransaction | null>(null);

  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    setPage(1);
    return {
      limit: 10,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    };
  }, [statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['mpesa-transactions', queryParams, page],
    queryFn: async () => {
      const res = await api.get('/mpesa/transactions', { params: { ...queryParams, page } });
      return res.data as {
        data: MpesaTransaction[];
        stats: Stats;
        pagination: { page: number; limit: number; total: number; pages: number };
      };
    },
  });

  const transactions = data?.data ?? [];
  const stats = data?.stats;
  const totalPages = data?.pagination?.pages ?? 1;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>M-Pesa Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lipa na M-Pesa transaction ledger</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#0F766E] hover:border-[#0F766E] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hero stats card — dark gradient matching mobile */}
      <div className="rounded-2xl p-6 relative overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #0B1D1B 0%, #0F2E2A 100%)' }}>
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #14B8A6, transparent)', transform: 'translate(30%, -30%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(20,184,166,0.15)' }}>
              <Smartphone className="w-4 h-4" style={{ color: '#14B8A6' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Lipa Na M-Pesa</p>
          </div>

          <p className="text-3xl font-extrabold text-white tracking-tight mb-1">
            {fmt(stats?.totalVolume ?? 0)}
          </p>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>Total confirmed volume</p>

          <div className="h-px mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Transactions', value: String(stats?.totalCount ?? 0) },
              { label: 'Success Rate', value: `${stats?.successRate ?? 0}%` },
              { label: 'Successful', value: String(stats?.successCount ?? 0) },
            ].map((s, i) => (
              <div key={s.label} className={`text-center ${i > 0 ? 'border-l' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by phone number or receipt code…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-200 transition-all"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${statusFilter === value ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#0F766E]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions label */}
      <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Transactions</p>

      {/* Transaction list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Smartphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-400">No M-Pesa transactions</p>
          <p className="text-sm text-gray-400 mt-1">
            {statusFilter !== 'all' ? 'Try a different status filter' : 'M-Pesa payments made at checkout will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const cfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.failed;
            return (
              <button
                key={tx._id}
                onClick={() => setSelectedTx(tx)}
                className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-[#0F766E] hover:shadow-md transition-all text-left"
              >
                {/* Status dot */}
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: cfg.dot }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{formatPhone(tx.phoneNumber)}</p>
                  {tx.mpesaReceiptNumber && (
                    <p className="text-xs text-gray-500 font-mono tracking-wide mt-0.5">{tx.mpesaReceiptNumber}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                </div>

                {/* Right side */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{fmt(tx.amount)}</p>
                  <span
                    className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                    style={{ backgroundColor: cfg.bg, color: cfg.text }}
                  >
                    {cfg.label}
                  </span>
                  {tx.saleId && (
                    <p className="text-xs text-gray-400 mt-0.5">#{tx.saleId.invoiceNumber}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">← Previous</button>
          <span className="text-xs font-semibold text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">Next →</button>
        </div>
      )}

      {/* Detail modal */}
      {selectedTx && (
        <TxDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
}
