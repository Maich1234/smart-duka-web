'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import AdminUserModal, { AdminRow } from '@/components/admin/AdminUserModal';

export default function AdminsPage() {
  const queryClient = useQueryClient();
  const currentAdmin = useAdminAuthStore((s) => s.adminUser);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'admins', page],
    queryFn: async () =>
      (await adminApi.get('/admins', { params: { page, limit: 20 } })).data as {
        data: AdminRow[];
        pagination: { page: number; limit: number; total: number; pages: number };
      },
  });
  const admins = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/admins/${id}`),
    onSuccess: () => {
      setDeleteError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setDeleteError(e.response?.data?.message || 'Failed to delete admin');
    },
  });

  const openCreate = () => { setEditingAdmin(null); setModalOpen(true); };
  const openEdit = (admin: AdminRow) => { setEditingAdmin(admin); setModalOpen(true); };

  const handleDelete = (admin: AdminRow) => {
    if (!window.confirm(`Delete admin "${admin.name}" (${admin.email})? This cannot be undone.`)) return;
    deleteMutation.mutate(admin._id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Admins</h1>
          <p className="text-gray-500 text-sm mt-1">Internal staff with access to this panel, and what each can do</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" />
          New Admin
        </Button>
      </div>

      {deleteError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{deleteError}</div>
      )}

      <Table<AdminRow>
        columns={[
          { key: 'name', header: 'Admin', render: (a) => (
            <div>
              <p className="font-semibold" style={{ color: '#0F172A' }}>{a.name}</p>
              <p className="text-xs text-gray-400">{a.email}</p>
            </div>
          ) },
          { key: 'role', header: 'Role', render: (a) => (
            <Badge color={a.role === 'super_admin' ? 'gold' : 'teal'}>
              {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          ) },
          { key: 'permissions', header: 'Permissions', render: (a) => (
            a.role === 'super_admin'
              ? <span className="text-gray-400">All</span>
              : a.permissions.length > 0
              ? <span className="text-gray-600">{a.permissions.join(', ')}</span>
              : <span className="text-gray-400">None</span>
          ) },
          { key: 'active', header: 'Status', render: (a) => <Badge color={a.active ? 'green' : 'gray'}>{a.active ? 'Active' : 'Deactivated'}</Badge> },
          { key: 'createdAt', header: 'Created', render: (a) => format(new Date(a.createdAt), 'MMM d, yyyy') },
          { key: 'actions', header: '', render: (a) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(a)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F766E] hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(a)}
                disabled={a._id === currentAdmin?.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) },
        ]}
        data={admins}
        keyExtractor={(a) => a._id}
        loading={isLoading}
        emptyMessage="No admins yet"
      />

      <AdminUserModal admin={editingAdmin} isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">← Previous</button>
          <span className="text-xs font-semibold text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">Next →</button>
        </div>
      )}
    </div>
  );
}
