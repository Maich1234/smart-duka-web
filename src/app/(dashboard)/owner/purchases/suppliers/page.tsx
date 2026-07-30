'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import SupplierFormModal from '@/components/purchases/SupplierFormModal';
import { deleteSupplier, getSuppliers, type Supplier } from '@/services/suppliers';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

const PAGE_SIZE = 15;

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canCreate = hasPermission(user, 'create_purchases');
  const canEdit = hasPermission(user, 'edit_purchases');
  const canDelete = hasPermission(user, 'delete_purchases');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [removing, setRemoving] = useState<Supplier | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => getSuppliers({ page, limit: PAGE_SIZE, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setRemoving(null);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Could not remove that supplier.');
    },
  });

  const suppliers = data?.data ?? [];
  const pages = data?.pagination?.pages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">Who you buy from</p>
        </div>
        {canCreate && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" /> Add supplier
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search suppliers…"
          aria-label="Search suppliers"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-200"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : suppliers.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500 py-6 text-center">
            {search ? 'No suppliers match that.' : 'No suppliers yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <Card key={supplier._id} padding="sm">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#CCFBF1' }}
                >
                  <Building2 className="w-4 h-4" style={{ color: '#0F766E' }} />
                </div>
                <Link href={`/owner/purchases/suppliers/${supplier._id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>{supplier.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[supplier.phone, supplier.location].filter(Boolean).join(' · ') || 'No contact details'}
                  </p>
                </Link>
                {canEdit && (
                  <button
                    onClick={() => setEditing(supplier)}
                    aria-label={`Edit ${supplier.name}`}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => { setError(''); setRemoving(supplier); }}
                    aria-label={`Remove ${supplier.name}`}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {adding && <SupplierFormModal isOpen onClose={() => setAdding(false)} />}
      {editing && <SupplierFormModal isOpen supplier={editing} onClose={() => setEditing(null)} />}

      <Modal isOpen={!!removing} onClose={() => setRemoving(null)} title="Remove this supplier?" size="sm">
        <p className="text-sm text-gray-600">
          {removing?.name} disappears from the supplier picker. Purchases already recorded against them
          stay exactly as they are.
        </p>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => removing && deleteMutation.mutate(removing._id)}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
