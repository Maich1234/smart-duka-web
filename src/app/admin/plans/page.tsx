'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface Plan {
  _id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  billingType: 'per_staff' | 'flat';
  monthlyPrice: number;
  yearlyDiscountPercent: number;
  yearlyPrice: number | null;
  maxStaff: number;
  extraStaffPrice: number;
  trialDays: number;
  currency: string;
  highlights: string[];
  features: string[];
  badge: string;
  priceComparison: string;
  active: boolean;
  displayOrder: number;
}

const schema = z.object({
  slug: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  tagline: z.string().optional(),
  description: z.string().optional(),
  billingType: z.enum(['per_staff', 'flat']),
  monthlyPrice: z.coerce.number().min(0),
  yearlyDiscountPercent: z.coerce.number().min(0).max(100).optional(),
  maxStaff: z.coerce.number().min(1),
  extraStaffPrice: z.coerce.number().min(0).optional(),
  trialDays: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  highlights: z.string().optional(),
  features: z.string().optional(),
  badge: z.string().optional(),
  priceComparison: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  active: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const toFormValues = (plan?: Plan): Partial<FormData> =>
  plan
    ? { ...plan, highlights: plan.highlights.join(', '), features: plan.features.join(', ') }
    : { billingType: 'flat', currency: 'KES', active: true, trialDays: 30, yearlyDiscountPercent: 20 };

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [serverError, setServerError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => (await adminApi.get('/plans')).data as { data: Plan[] },
  });
  const plans = data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(),
  });

  useEffect(() => {
    reset(toFormValues(editingPlan ?? undefined));
  }, [editingPlan, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormData) => {
      const body = {
        ...values,
        highlights: values.highlights ? values.highlights.split(',').map((h) => h.trim()).filter(Boolean) : [],
        features: values.features ? values.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
      };
      return editingPlan ? adminApi.patch(`/plans/${editingPlan._id}`, body) : adminApi.post('/plans', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      setModalOpen(false);
      setEditingPlan(null);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setServerError(e.response?.data?.errors?.join(', ') || e.response?.data?.message || 'Failed to save plan');
    },
  });

  const openCreate = () => { setEditingPlan(null); setServerError(''); setModalOpen(true); };
  const openEdit = (plan: Plan) => { setEditingPlan(plan); setServerError(''); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Subscription Plans</h1>
          <p className="text-gray-500 text-sm mt-1">Pricing tiers shop owners see on the pricing screen</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" />
          New Plan
        </Button>
      </div>

      <Table<Plan>
        columns={[
          { key: 'name', header: 'Plan', render: (p) => (
            <div>
              <p className="font-semibold" style={{ color: '#0F172A' }}>{p.name}</p>
              <p className="text-xs text-gray-400">{p.slug}</p>
            </div>
          ) },
          { key: 'billingType', header: 'Billing', render: (p) => p.billingType === 'per_staff' ? 'Per staff' : 'Flat' },
          { key: 'monthlyPrice', header: 'Monthly', render: (p) => `${p.currency} ${p.monthlyPrice.toLocaleString()}` },
          { key: 'maxStaff', header: 'Max Staff' },
          { key: 'trialDays', header: 'Trial' },
          { key: 'active', header: 'Status', render: (p) => <Badge color={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge> },
          { key: 'actions', header: '', render: (p) => (
            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F766E] hover:bg-gray-50 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          ) },
        ]}
        data={plans}
        keyExtractor={(p) => p._id}
        loading={isLoading}
        emptyMessage="No plans yet"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? 'Edit Plan' : 'New Plan'} size="lg">
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
        )}
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Slug *" placeholder="starter" error={errors.slug?.message} {...register('slug')} />
            <Input label="Name *" placeholder="Starter" error={errors.name?.message} {...register('name')} />
          </div>
          <Input label="Tagline" placeholder="Perfect for small shops" {...register('tagline')} />
          <Input label="Description" placeholder="Everything a small duka needs..." {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Billing Type *</label>
              <select {...register('billingType')} className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30">
                <option value="flat">Flat</option>
                <option value="per_staff">Per staff</option>
              </select>
            </div>
            <Input label="Monthly Price *" type="number" error={errors.monthlyPrice?.message} {...register('monthlyPrice')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Max Staff *" type="number" error={errors.maxStaff?.message} {...register('maxStaff')} />
            <Input label="Extra Staff Price" type="number" {...register('extraStaffPrice')} />
            <Input label="Trial Days" type="number" {...register('trialDays')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Currency" {...register('currency')} />
            <Input label="Yearly Discount %" type="number" {...register('yearlyDiscountPercent')} />
            <Input label="Display Order" type="number" {...register('displayOrder')} />
          </div>
          <Input label="Highlights (comma-separated)" placeholder="Unlimited sales, Inventory, M-PESA" {...register('highlights')} />
          <Input label="Features (comma-separated flags)" placeholder="sales, inventory, mpesa, ai_insights" {...register('features')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Badge" placeholder="Recommended" {...register('badge')} />
            <Input label="Price Comparison" placeholder="About the cost of..." {...register('priceComparison')} />
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: '#0F172A' }}>
            <input type="checkbox" {...register('active')} className="rounded border-gray-300" />
            Active (visible to shop owners)
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editingPlan ? 'Save Changes' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
