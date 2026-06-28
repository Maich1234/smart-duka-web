'use client';

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Users, Mail, Phone, Search } from 'lucide-react';
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

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  salesCount?: number;
}

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'At least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [serverError, setServerError] = useState('');

  const [search, setSearch] = useState('');

  const {
    data: staffPages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['staff', search],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get('/staff', { params: { page: pageParam, limit: 20, search: search || undefined } });
      return res.data as { data: StaffMember[]; pagination: { page: number; limit: number; total: number; pages: number } };
    },
    getNextPageParam: (last) => last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const staff = staffPages?.pages.flatMap((p) => p.data) ?? [];

  const addMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/staff', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setAddOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e.response?.data?.message || 'Failed to add staff');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeleteId(null);
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    setServerError('');
    addMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Staff</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your shop employees</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Staff</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-200 transition-all" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (staff || []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No staff members yet. Add your first team member!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(staff || []).map((s) => (
            <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#0F766E' }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#0F172A' }}>{s.name}</p>
                    <Badge color={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(s._id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {s.email}
                </div>
                {s.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {s.phone}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>Joined {format(new Date(s.createdAt), 'MMM yyyy')}</span>
                {s.salesCount !== undefined && <span>{s.salesCount} sales</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
            className="text-sm font-semibold px-5 py-2 rounded-full border border-[#0F766E] text-[#0F766E] hover:bg-[#F0FDFA] transition-colors disabled:opacity-50">
            {isFetchingNextPage ? 'Loading…' : 'Load more staff'}
          </button>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); reset(); setServerError(''); }} title="Add Staff Member">
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name *" placeholder="Jane Wanjiku" error={errors.name?.message} {...register('name')} />
          <Input label="Email *" type="email" placeholder="jane@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Phone Number" placeholder="07XXXXXXXX" error={errors.phone?.message} {...register('phone')} />
          <Input label="Temporary Password *" type="password" placeholder="Min. 6 characters" error={errors.password?.message} {...register('password')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addMutation.isPending}>
              <Plus className="w-4 h-4" />
              Add Staff
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Staff">
        <p className="text-gray-600 mb-6">Are you sure you want to remove this staff member? They will lose access to the system.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
