'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const schema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  sellingPrice: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid selling price'),
  costPrice: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid cost price'),
  quantity: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid quantity'),
  unitOfMeasure: z.string().min(1, 'Unit is required'),
  lowStockAlert: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        category: data.category,
        sellingPrice: Number(data.sellingPrice),
        costPrice: Number(data.costPrice),
        quantity: Number(data.quantity),
        unitOfMeasure: data.unitOfMeasure,
        lowStockAlert: data.lowStockAlert ? Number(data.lowStockAlert) : 5,
        description: data.description || undefined,
      };
      const res = await api.post('/products', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/owner/inventory');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError('root', { message: e.response?.data?.message || 'Failed to create product' });
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/owner/inventory">
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Add Product</h1>
          <p className="text-gray-500 text-sm">Add a new product to your inventory</p>
        </div>
      </div>

      {errors.root && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Product Name *"
                placeholder="e.g. Unga Pembe 2kg"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Category *</label>
              <select
                {...register('category')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white"
              >
                <option value="">Select category…</option>
                {['Groceries', 'Beverages', 'Household', 'Electronics', 'Clothing', 'Health & Beauty', 'Stationery', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Unit *</label>
              <select
                {...register('unitOfMeasure')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white"
              >
                <option value="">Select unit…</option>
                {['unit', 'kg', 'g', 'l', 'ml', 'dozen', 'pack', 'box', 'bag'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              {errors.unitOfMeasure && <p className="mt-1 text-xs text-red-500">{errors.unitOfMeasure.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Optional product description…"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white resize-none"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#0F172A' }}>Pricing & Stock</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Selling Price (KES) *"
              type="number"
              step="0.01"
              placeholder="e.g. 180"
              error={errors.sellingPrice?.message}
              {...register('sellingPrice')}
            />
            <Input
              label="Cost Price (KES) *"
              type="number"
              step="0.01"
              placeholder="e.g. 120"
              error={errors.costPrice?.message}
              {...register('costPrice')}
            />
            <Input
              label="Current Stock *"
              type="number"
              placeholder="e.g. 50"
              error={errors.quantity?.message}
              {...register('quantity')}
            />
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              placeholder="e.g. 10"
              hint="Get alerted when stock falls below this"
              error={errors.lowStockAlert?.message}
              {...register('lowStockAlert')}
            />
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/owner/inventory">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={mutation.isPending}>
            <Save className="w-4 h-4" />
            Save Product
          </Button>
        </div>
      </form>
    </div>
  );
}
