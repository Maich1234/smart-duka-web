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
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';

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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (expenses || []).length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No expenses recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ backgroundColor: '#F8FAFC' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(expenses || []).map((e) => (
                  <tr key={e._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium capitalize" style={{ color: '#0F172A' }}>{e.description || e.category}</p>
                    </td>
                    <td className="px-4 py-3"><Badge color="gray">{e.category}</Badge></td>
                    <td className="px-4 py-3 font-semibold text-red-600">KES {e.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{format(new Date(e.date || e.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); reset(); setServerError(''); }} title="Add Expense">
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
        )}
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Category *</label>
            <select
              {...register('category')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white capitalize"
            >
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <Input label="Amount (KES) *" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount')} />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Description</label>
            <textarea {...register('description')} rows={2} placeholder="Optional notes…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white resize-none" />
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
