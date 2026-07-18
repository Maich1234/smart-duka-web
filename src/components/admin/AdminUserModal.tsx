'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import adminApi from '@/lib/adminApi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface AdminRow {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
  active: boolean;
  createdAt: string;
}

interface AdminPermissionOption {
  value: string;
  label: string;
}

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

// Password optional on edit — blank means "keep current".
const editSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  password: z.union([z.literal(''), z.string().min(6, 'Minimum 6 characters')]),
});

type FormData = z.infer<typeof createSchema>;

export default function AdminUserModal({
  admin,
  isOpen,
  onClose,
}: {
  admin: AdminRow | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mode: 'create' | 'edit' = admin ? 'edit' : 'create';
  const [role, setRole] = useState<'super_admin' | 'admin'>('admin');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [serverError, setServerError] = useState('');

  const { data: permissionOptions } = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: async () => (await adminApi.get('/permissions')).data.data as AdminPermissionOption[],
    enabled: isOpen,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(mode === 'create' ? createSchema : editSchema),
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ name: admin?.name ?? '', email: admin?.email ?? '', password: '' });
    setRole(admin?.role ?? 'admin');
    setPermissions(admin?.permissions ?? []);
    setActive(admin?.active ?? true);
    setServerError('');
  }, [isOpen, admin, reset]);

  const togglePermission = (value: string) => {
    setPermissions((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  };

  const saveMutation = useMutation({
    mutationFn: (values: FormData) => {
      const body: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        role,
        permissions: role === 'admin' ? permissions : [],
      };
      if (values.password) body.password = values.password;
      if (mode === 'edit') body.active = active;
      return mode === 'edit' ? adminApi.patch(`/admins/${admin!._id}`, body) : adminApi.post('/admins', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: string[] } } };
      setServerError(e.response?.data?.errors?.join(', ') || e.response?.data?.message || 'Failed to save admin');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Admin' : 'New Admin'} size="md">
      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{serverError}</div>
      )}
      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
        <Input label="Name *" error={errors.name?.message} {...register('name')} />
        <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
        <Input
          label={mode === 'edit' ? 'New Password (leave blank to keep current)' : 'Password *'}
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Role *</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'super_admin' | 'admin')}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {role === 'admin' && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: '#0F172A' }}>Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {(permissionOptions ?? []).map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={permissions.includes(p.value)}
                    onChange={() => togglePermission(p.value)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {mode === 'edit' && (
          <label className="flex items-center gap-2 text-sm" style={{ color: '#0F172A' }}>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Active
          </label>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saveMutation.isPending}>{mode === 'edit' ? 'Save Changes' : 'Create Admin'}</Button>
        </div>
      </form>
    </Modal>
  );
}
