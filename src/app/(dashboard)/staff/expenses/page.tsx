'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt } from 'lucide-react';
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
import { useMoney } from '@/lib/money';
import { useShop } from '@/hooks/useShop';

interface Expense {
  _id: string;
  category: string;
  amount: number;
  description?: string;
  date?: string;
  createdAt: string;
}

const CATEGORIES = ['transport', 'utilities', 'supplies', 'other'] as const;

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function StaffExpensesPage() {
  const fmt = useMoney();
  const { currency } = useShop();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['staff-expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses');
      return res.data.data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/expenses', { ...data, amount: Number(data.amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-expenses'] });
      setAddOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'Failed to add expense');
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const columns: Column<Expense>[] = [
    {
      key: 'description',
      header: 'Description',
      render: (e) => <p className="font-medium capitalize" style={{ color: '#0F172A' }}>{e.description || e.category}</p>,
    },
    { key: 'category', header: 'Category', render: (e) => <Badge color="gray">{e.category}</Badge> },
    { key: 'amount', header: 'Amount', className: 'font-semibold text-red-600 tabular-nums', render: (e) => fmt(e.amount) },
    { key: 'date', header: 'Date', className: 'text-gray-500', render: (e) => format(new Date(e.date || e.createdAt), 'dd MMM yyyy') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>My Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Track expenses you have incurred</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        <Table<Expense>
          columns={columns}
          data={expenses || []}
          keyExtractor={(e) => e._id}
          loading={isLoading}
          emptyMessage="No expenses recorded yet."
        />
      </Card>

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
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <Input label={`Amount (${currency}) *`} type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount')} />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Description</label>
            <textarea {...register('description')} rows={2} placeholder="Optional notes…"
              className="w-full px-4 py-2.5 rounded-control border border-gray-200 text-sm focus:outline-none bg-white resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
