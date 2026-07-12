'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import adminApi from '@/lib/adminApi';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface Promotion {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  active: boolean;
}

const schema = z.object({
  code: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  maxRedemptions: z.coerce.number().min(1).optional().or(z.literal('')),
  active: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const toDateInput = (d: string | null) => (d ? d.slice(0, 10) : '');

const toFormValues = (promo?: Promotion): Partial<FormData> =>
  promo
    ? { ...promo, startsAt: toDateInput(promo.startsAt), endsAt: toDateInput(promo.endsAt), maxRedemptions: promo.maxRedemptions ?? undefined }
    : { discountType: 'percentage', active: true };

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [serverError, setServerError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: async () => (await adminApi.get('/promotions')).data as { data: Promotion[] },
  });
  const promotions = data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(),
  });

  useEffect(() => {
    reset(toFormValues(editingPromo ?? undefined));
  }, [editingPromo, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormData) => {
      const body = {
        ...values,
        startsAt: values.startsAt || null,
        endsAt: values.endsAt || null,
        maxRedemptions: values.maxRedemptions || null,
      };
      return editingPromo ? adminApi.patch(`/promotions/${editingPromo._id}`, body) : adminApi.post('/promotions', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      setModalOpen(false);
      setEditingPromo(null);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setServerError(e.response?.data?.errors?.join(', ') || e.response?.data?.message || 'Failed to save promotion');
    },
  });

  const openCreate = () => { setEditingPromo(null); setServerError(''); setModalOpen(true); };
  const openEdit = (promo: Promotion) => { setEditingPromo(promo); setServerError(''); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Promotions</h1>
          <p className="text-gray-500 text-sm mt-1">Promo codes redeemable on the subscription pricing screen</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" />
          New Promotion
        </Button>
      </div>

      <Table<Promotion>
        columns={[
          { key: 'code', header: 'Code', render: (p) => <span className="font-mono font-semibold">{p.code}</span> },
          { key: 'title', header: 'Title' },
          { key: 'discountValue', header: 'Discount', render: (p) => p.discountType === 'percentage' ? `${p.discountValue}%` : p.discountValue.toLocaleString() },
          { key: 'redemptionCount', header: 'Redeemed', render: (p) => `${p.redemptionCount}${p.maxRedemptions ? ` / ${p.maxRedemptions}` : ''}` },
          { key: 'endsAt', header: 'Ends', render: (p) => p.endsAt ? format(new Date(p.endsAt), 'MMM d, yyyy') : '—' },
          { key: 'active', header: 'Status', render: (p) => <Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge> },
          { key: 'actions', header: '', render: (p) => (
            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F766E] hover:bg-gray-50 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          ) },
        ]}
        data={promotions}
        keyExtractor={(p) => p._id}
        loading={isLoading}
        emptyMessage="No promotions yet"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPromo ? 'Edit Promotion' : 'New Promotion'}>
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
        )}
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <Input label="Code *" placeholder="LAUNCH20" error={errors.code?.message} {...register('code')} />
          <Input label="Title *" placeholder="Launch discount" error={errors.title?.message} {...register('title')} />
          <Input label="Description" placeholder="20% off your first 3 months" {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Discount Type *</label>
              <select {...register('discountType')} className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <Input label="Discount Value *" type="number" error={errors.discountValue?.message} {...register('discountValue')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Starts" type="date" {...register('startsAt')} />
            <Input label="Ends" type="date" {...register('endsAt')} />
          </div>
          <Input label="Max Redemptions" type="number" placeholder="Leave blank for unlimited" {...register('maxRedemptions')} />
          <label className="flex items-center gap-2 text-sm" style={{ color: '#0F172A' }}>
            <input type="checkbox" {...register('active')} className="rounded border-gray-300" />
            Active
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editingPromo ? 'Save Changes' : 'Create Promotion'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
