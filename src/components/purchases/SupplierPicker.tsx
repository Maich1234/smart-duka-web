'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Plus, Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import SupplierFormModal from './SupplierFormModal';
import { getSuppliers } from '@/services/suppliers';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';

/**
 * Choose who this purchase came from.
 *
 * "No supplier on file" is a first-class option, not an omission: plenty of
 * stock is bought from a market trader nobody is going to add to a database.
 * A typed name still gets recorded against the purchase.
 */
export default function SupplierPicker({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supplier: { id?: string; name: string }) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const canCreate = hasPermission(user, 'create_purchases');
  const [search, setSearch] = useState('');
  const [walkIn, setWalkIn] = useState('');
  const [adding, setAdding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', 1, search],
    queryFn: () => getSuppliers({ page: 1, limit: 20, search: search || undefined }),
    enabled: isOpen,
  });

  const choose = (supplier: { id?: string; name: string }) => {
    onSelect(supplier);
    setSearch('');
    setWalkIn('');
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Who did you buy from?">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers…"
              aria-label="Search suppliers"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(data?.data ?? []).map((supplier) => (
                <button
                  key={supplier._id}
                  onClick={() => choose({ id: supplier._id, name: supplier.name })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                      {supplier.name}
                    </span>
                    {(supplier.phone || supplier.location) && (
                      <span className="block text-xs text-gray-400 truncate">
                        {[supplier.phone, supplier.location].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              {(data?.data.length ?? 0) === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">No suppliers match that.</p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>
              Or just type a name
            </label>
            <p className="text-xs text-gray-500 mb-2">
              For a market trader or one-off you won&apos;t buy from again.
            </p>
            <div className="flex gap-2">
              <input
                value={walkIn}
                onChange={(e) => setWalkIn(e.target.value)}
                placeholder="e.g. Wakulima market"
                onKeyDown={(e) => e.key === 'Enter' && walkIn.trim() && choose({ name: walkIn.trim() })}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200"
              />
              <Button disabled={!walkIn.trim()} onClick={() => choose({ name: walkIn.trim() })}>Use</Button>
            </div>
          </div>

          {canCreate && (
            <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4" /> Add a new supplier
            </Button>
          )}
        </div>
      </Modal>

      {adding && (
        <SupplierFormModal
          isOpen
          onClose={() => setAdding(false)}
          onSaved={(supplier) => choose({ id: supplier._id, name: supplier.name })}
        />
      )}
    </>
  );
}
