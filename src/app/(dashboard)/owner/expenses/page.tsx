'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Table, { type Column } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useMoney } from '@/lib/money';
import { useShop } from '@/hooks/useShop';
import {
  MONEY_OUT_METHODS,
  MONEY_OUT_METHOD_LABELS,
  type MoneyOutMethod,
} from '@/constants/paymentMethods';

interface Expense {
  _id: string;
  category: string;
  amount: number;
  description?: string;
  /** Absent on expenses recorded before the field existed — treat as 'cash'. */
  paymentMethod?: MoneyOutMethod;
  date?: string;
  createdAt: string;
}

const CATEGORIES = ['rent', 'utilities', 'supplies', 'transport', 'salaries', 'marketing', 'other'] as const;

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  description: z.string().optional(),
  // Which pot the money came from — without it a Cashbook can't tell till cash
  // from M-Pesa. Defaulted rather than required so the form still submits if
  // the field is never touched.
  paymentMethod: z.enum(['cash', 'mpesa', 'bank', 'credit']).default('cash'),
  date: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const categoryColors: Record<string, 'teal' | 'blue' | 'gold' | 'red' | 'yellow' | 'gray'> = {
  rent: 'blue', utilities: 'teal', salaries: 'gold', supplies: 'teal',
  transport: 'yellow', marketing: 'blue', other: 'gray',
};

export default function ExpensesPage() {
  const fmt = useMoney();
  const { currency } = useShop();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [serverError, setServerError] = useState('');

  const [page, setPage] = useState(1);

  const { data: expensesRaw, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: async () => {
      const res = await api.get('/expenses', { params: { page, limit: 10 } });
      return res.data as { data: Expense[]; pagination: { page: number; limit: number; total: number; pages: number } };
    },
  });

  const expenses = expensesRaw?.data ?? [];
  const totalPages = expensesRaw?.pagination?.pages ?? 1;

  const addMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/expenses', { ...data, amount: Number(data.amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setAddOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'Failed to add expense');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || 'Failed to delete expense', 'error');
    },
  });

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'cash' },
  });
  const paymentMethod = watch('paymentMethod');

  const totalExpenses = (expenses || []).reduce((s, e) => s + e.amount, 0);

  const columns: Column<Expense>[] = [
    {
      key: 'description',
      header: 'Description',
      render: (e) => (
        <>
          <p className="font-medium capitalize" style={{ color: '#0F172A' }}>{e.description || e.category}</p>
          {e.paymentMethod && e.paymentMethod !== 'cash' && (
            <p className={`text-xs mt-0.5 ${e.paymentMethod === 'credit' ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
              {e.paymentMethod === 'credit' ? 'On credit, not paid yet' : MONEY_OUT_METHOD_LABELS[e.paymentMethod]}
            </p>
          )}
        </>
      ),
    },
    { key: 'category', header: 'Category', render: (e) => <Badge color={categoryColors[e.category] || 'gray'}>{e.category}</Badge> },
    { key: 'amount', header: 'Amount', className: 'font-semibold text-red-600 tabular-nums', render: (e) => `-${fmt(e.amount)}` },
    { key: 'date', header: 'Date', className: 'text-gray-500', render: (e) => format(new Date(e.date || e.createdAt), 'dd MMM yyyy') },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-red-50"
          aria-label="Delete expense"
          loading={deleteMutation.isPending && deleteMutation.variables === e._id}
          disabled={deleteMutation.isPending && deleteMutation.variables !== e._id}
          onClick={() => deleteMutation.mutate(e._id)}
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Track your business expenses</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary */}
      <Card padding="md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
            <Receipt className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Page {page} Subtotal</p>
            <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#0F172A' }}>{fmt(totalExpenses)}</p>
          </div>
        </div>
      </Card>

      {/* Expenses List */}
      <Card padding="none" className="overflow-hidden">
        <Table<Expense>
          columns={columns}
          data={expenses || []}
          keyExtractor={(e) => e._id}
          loading={isLoading}
          emptyMessage="No expenses recorded yet."
        />
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Previous</Button>
            <span className="text-xs font-semibold text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next →</Button>
          </div>
        )}
      </Card>

      {/* Add Expense Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); reset(); setServerError(''); }} title="Add Expense">
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
        )}
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Category *</label>
            <select
              {...register('category')}
              className="w-full px-4 py-2.5 rounded-control border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white capitalize"
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <Input label={`Amount (${currency}) *`} type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount')} />

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Paid with</label>
            <div className="flex flex-wrap gap-2">
              {MONEY_OUT_METHODS.map((method) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setValue('paymentMethod', method, { shouldDirty: true })}
                    className={`px-3.5 py-2 rounded-control border text-sm font-semibold transition-all ${
                      active
                        ? 'border-[#0F766E] bg-[#0F766E] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E]'
                    }`}
                  >
                    {MONEY_OUT_METHOD_LABELS[method]}
                  </button>
                );
              })}
            </div>
            {paymentMethod === 'credit' && (
              <p className="mt-2 text-xs text-gray-500">
                No money has left your till yet. This won&apos;t show in your cashbook until you pay.
              </p>
            )}
          </div>

          <Input label="Date" type="date" {...register('date')} />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Notes</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Optional notes…"
              className="w-full px-4 py-2.5 rounded-control border border-gray-200 text-sm focus:outline-none bg-white resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addMutation.isPending}>Save Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
