'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createSupplier, updateSupplier, type Supplier, type SupplierPayload } from '@/services/suppliers';

export default function SupplierFormModal({
  isOpen,
  supplier,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  /** Omit to create. */
  supplier?: Supplier;
  onClose: () => void;
  onSaved?: (supplier: Supplier) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SupplierPayload>({
    name: supplier?.name ?? '',
    phone: supplier?.phone ?? '',
    email: supplier?.email ?? '',
    location: supplier?.location ?? '',
    notes: supplier?.notes ?? '',
  });
  const [error, setError] = useState('');

  const update = (patch: Partial<SupplierPayload>) => setForm((prev) => ({ ...prev, ...patch }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: SupplierPayload = {
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        location: form.location?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };
      return supplier ? updateSupplier(supplier._id, payload) : createSupplier(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      if (supplier) queryClient.invalidateQueries({ queryKey: ['supplier', supplier._id] });
      onSaved?.(saved);
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Could not save that supplier.');
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={mutation.isPending ? () => {} : onClose}
      title={supplier ? 'Edit supplier' : 'Add supplier'}
      size="sm"
    >
      <div className="space-y-4">
        <Input
          label="Name *"
          placeholder="e.g. Mwangi Wholesalers"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <Input
          label="Phone"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => update({ phone: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update({ email: e.target.value })}
        />
        <Input
          label="Location"
          placeholder="e.g. Nakuru town"
          value={form.location}
          onChange={(e) => update({ location: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#0F172A' }}>Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Delivery days, credit terms…"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 bg-white resize-none"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button
            disabled={!form.name.trim()}
            loading={mutation.isPending}
            onClick={() => { setError(''); mutation.mutate(); }}
          >
            {supplier ? 'Save changes' : 'Add supplier'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
