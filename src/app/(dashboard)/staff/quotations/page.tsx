'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { ArrowRight, Plus, Search, Trash2, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Table, { type Column } from '@/components/ui/Table';
import { useMoney } from '@/lib/money';
import {
  getQuotations, createQuotation, type Quotation, type CreateQuotationItemInput,
} from '@/services/quotations';
import { getCustomers, createCustomer, type Customer } from '@/services/customers';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'draft' | 'declined' | 'converted';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'declined', label: 'Declined' },
  { value: 'converted', label: 'Converted' },
];

/** Only the fields the line-item picker needs from a service product. */
interface ServiceProduct {
  _id: string;
  name: string;
  sellingPrice: number;
}

type LineMode = 'catalog' | 'custom';
interface LineItem {
  key: string;
  mode: LineMode;
  productId?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

let lineKeySeq = 0;
const newLineKey = () => `line-${++lineKeySeq}`;
const blankLine = (): LineItem => ({
  key: newLineKey(), mode: 'catalog', productId: undefined, name: '', description: '', quantity: 1, unitPrice: 0,
});

/** draft/declined/converted, plus 'expired' — a draft past its own validUntil. The server never stores this status. */
function displayStatus(q: Quotation): 'draft' | 'declined' | 'converted' | 'expired' {
  if (q.status === 'draft' && new Date(q.validUntil) < new Date()) return 'expired';
  return q.status;
}

function QuotationStatusBadge({ status }: { status: 'draft' | 'declined' | 'converted' | 'expired' }) {
  const map = {
    draft: { color: 'blue' as const, label: 'Draft' },
    declined: { color: 'red' as const, label: 'Declined' },
    converted: { color: 'green' as const, label: 'Converted' },
    expired: { color: 'gold' as const, label: 'Expired' },
  };
  const { color, label } = map[status];
  return <Badge color={color}>{label}</Badge>;
}

// ─── Create Quotation Modal ─────────────────────────────────────────────────
function CreateQuotationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const fmt = useMoney();
  const queryClient = useQueryClient();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [lines, setLines] = useState<LineItem[]>([blankLine()]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState(() => format(addDays(new Date(), 30), 'yyyy-MM-dd'));

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers-picker', customerSearch],
    queryFn: () => getCustomers({ search: customerSearch || undefined, limit: 20 }),
    enabled: !customer,
  });

  // Not services.ts's getProducts — that helper has no includeTypes param, and
  // owner/sales/page.tsx already fetches products the same ad hoc way (a
  // local type + a direct api.get), so this matches that convention rather
  // than growing a shared helper for a single caller.
  const { data: serviceProducts } = useQuery({
    queryKey: ['service-products'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { includeTypes: 'service', limit: 100 } });
      return res.data.data as ServiceProduct[];
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: () => createCustomer({ name: newCustomerName.trim(), phone: newCustomerPhone.trim() || undefined }),
    onSuccess: (created) => {
      setCustomer(created);
      setAddingCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    },
  });

  const updateLine = (key: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const setLineMode = (key: string, mode: LineMode) =>
    setLines((prev) => prev.map((l) => (l.key === key
      ? { ...l, mode, productId: undefined, name: '', description: '', unitPrice: 0 }
      : l)));

  const selectProduct = (key: string, productId: string) => {
    const product = serviceProducts?.find((p) => p._id === productId);
    updateLine(key, { productId, unitPrice: product?.sellingPrice ?? 0, name: product?.name ?? '' });
  };

  const addLine = () => setLines((prev) => [...prev, blankLine()]);
  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  // Recomputed on every keystroke, purely so the person filling the form sees
  // a live number — the server recomputes the authoritative total on submit.
  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  const validLines = lines.filter((l) =>
    l.quantity > 0 && (l.mode === 'catalog' ? !!l.productId : l.name.trim().length > 0));
  const canSubmit = !!customer && validLines.length > 0 && !!validUntil;

  const mutation = useMutation({
    mutationFn: () => createQuotation({
      customerId: customer!._id,
      items: validLines.map((l): CreateQuotationItemInput => (l.mode === 'catalog'
        ? { productId: l.productId, quantity: l.quantity }
        : { name: l.name.trim(), description: l.description.trim() || undefined, quantity: l.quantity, unitPrice: l.unitPrice })),
      notes: notes.trim() || undefined,
      validUntil,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      onCreated();
    },
  });

  return (
    <Modal isOpen onClose={mutation.isPending ? () => {} : onClose} title="New Quotation" size="lg">
      <div className="space-y-5">
        {/* Customer */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Customer</label>
          {customer ? (
            <div className="flex items-center justify-between p-3 rounded-control border border-gray-200 bg-gray-50">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{customer.name}</p>
                {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
              </div>
              <button onClick={() => setCustomer(null)} className="text-xs font-semibold" style={{ color: '#0F766E' }}>
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                />
              </div>
              {customersLoading ? (
                <div className="flex justify-center py-3"><Spinner size="sm" /></div>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {(customersData?.data ?? []).map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setCustomer(c)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-control text-left hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm min-w-0 truncate" style={{ color: '#0F172A' }}>{c.name}</span>
                      {c.phone && <span className="text-xs text-gray-400 flex-shrink-0">{c.phone}</span>}
                    </button>
                  ))}
                  {(customersData?.data.length ?? 0) === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No customers match that.</p>
                  )}
                </div>
              )}
              {addingCustomer ? (
                <div className="p-3 rounded-control border border-gray-200 space-y-2">
                  <input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full px-3 py-2 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  />
                  <input
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="w-full px-3 py-2 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAddingCustomer(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      disabled={!newCustomerName.trim()}
                      loading={createCustomerMutation.isPending}
                      onClick={() => createCustomerMutation.mutate()}
                    >
                      Save
                    </Button>
                  </div>
                  {createCustomerMutation.error && (
                    <p className="text-xs text-red-600">Could not add that customer. Try again.</p>
                  )}
                </div>
              ) : (
                <button onClick={() => setAddingCustomer(true)} className="text-xs font-semibold" style={{ color: '#0F766E' }}>
                  + Add a new customer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</label>
            <button onClick={addLine} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#0F766E' }}>
              <Plus className="w-3.5 h-3.5" /> Add line
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="p-3 rounded-control border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setLineMode(line.key, 'catalog')}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${line.mode === 'catalog' ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-gray-200 text-gray-500'}`}
                    >
                      Catalog
                    </button>
                    <button
                      onClick={() => setLineMode(line.key, 'custom')}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${line.mode === 'custom' ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-gray-200 text-gray-500'}`}
                    >
                      Custom line
                    </button>
                  </div>
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(line.key)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {line.mode === 'catalog' ? (
                  <select
                    value={line.productId ?? ''}
                    onChange={(e) => selectProduct(line.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                  >
                    <option value="">Select a service…</option>
                    {(serviceProducts ?? []).map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({fmt(p.sellingPrice)})</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={line.name}
                      onChange={(e) => updateLine(line.key, { name: e.target.value })}
                      placeholder="Item name"
                      className="w-full px-3 py-2 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                    />
                    <input
                      value={line.description}
                      onChange={(e) => updateLine(line.key, { description: e.target.value })}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Qty</label>
                    <input
                      type="number" min="0.001" step="any" value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded-control border border-gray-200 text-sm text-center outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  </div>
                  {line.mode === 'custom' && (
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Unit price</label>
                      <input
                        type="number" min="0" step="any" value={line.unitPrice}
                        onChange={(e) => updateLine(line.key, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded-control border border-gray-200 text-sm text-right outline-none focus:ring-2 focus:ring-teal-200"
                      />
                    </div>
                  )}
                  <div className="flex-1 text-right">
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Subtotal</label>
                    <p className="text-sm font-semibold py-1.5" style={{ color: '#0F172A' }}>{fmt(line.quantity * line.unitPrice)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Terms, delivery details…"
            className="w-full px-3 py-2.5 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 resize-none"
          />
        </div>

        {/* Valid until */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Valid Until</label>
          <input
            type="date"
            value={validUntil}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2.5 rounded-control border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-3 rounded-control" style={{ backgroundColor: '#F0FDFA' }}>
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span className="text-lg font-bold" style={{ color: '#0F766E' }}>{fmt(total)}</span>
        </div>

        {mutation.error && (
          <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-700">
            {(mutation.error as { response?: { data?: { message?: string } } }).response?.data?.message
              ?? 'Could not create that quotation. Try again.'}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button disabled={!canSubmit} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Create Quotation
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function StaffQuotationsPage() {
  const fmt = useMoney();
  const router = useRouter();
  const { user } = useAuthStore();
  // convert_quotation_to_sale alone gets you onto this page (see
  // ROUTE_PERMISSIONS) to convert someone else's draft, but drafting a new
  // one is its own permission — same split the backend enforces.
  const canCreate = hasPermission(user, 'create_quotation');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', statusFilter, page],
    queryFn: () => getQuotations({
      status: statusFilter === 'all' ? undefined : statusFilter,
      page,
      limit: PAGE_SIZE,
    }),
  });

  const quotations = data?.data ?? [];
  const pages = data?.pagination?.pages ?? 1;

  const columns: Column<Quotation>[] = [
    {
      key: 'quoteNumber',
      header: 'Quote #',
      render: (q) => <span className="font-mono text-xs text-gray-500">#{q.quoteNumber}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (q) => <span className="text-sm font-medium" style={{ color: '#0F172A' }}>{q.customerSnapshot.name}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      className: 'font-bold tabular-nums',
      render: (q) => <span style={{ color: '#0F766E' }}>{fmt(q.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (q) => <QuotationStatusBadge status={displayStatus(q)} />,
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      className: 'text-gray-600',
      render: (q) => format(new Date(q.validUntil), 'dd MMM yyyy'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => <ArrowRight className="w-4 h-4 text-gray-300" />,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Quotations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quote a job, then convert it to a sale once it&apos;s accepted</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> New Quotation</Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${statusFilter === value ? 'border-[#0F766E] bg-[#0F766E] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#0F766E]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-card border border-gray-100 shadow-elevation-1 overflow-hidden">
        <Table<Quotation>
          columns={columns}
          data={quotations}
          keyExtractor={(q) => q._id}
          loading={isLoading}
          onRowClick={(q) => router.push(`/staff/quotations/${q._id}`)}
          emptyMessage="No quotations yet."
        />
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Previous</Button>
            <span className="text-xs font-semibold text-gray-500">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next →</Button>
          </div>
        )}
      </div>

      {canCreate && createOpen && (
        <CreateQuotationModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); setStatusFilter('all'); setPage(1); }}
        />
      )}
    </div>
  );
}
