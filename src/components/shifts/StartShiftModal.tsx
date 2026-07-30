'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { startShift } from '@/services/shifts';
import { useInvalidateShift } from '@/hooks/useShift';

/**
 * Opening a shift. The float is the cash already in the drawer — it's what
 * the closing count is measured against, so getting it wrong makes every
 * discrepancy downstream meaningless.
 */
export default function StartShiftModal({
  isOpen,
  onClose,
  onStarted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onStarted?: () => void;
}) {
  const invalidateShift = useInvalidateShift();
  const [float, setFloat] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => startShift({ openingFloat: Number(float) || 0, openingNote: note.trim() || undefined }),
    onSuccess: () => {
      setFloat('');
      setNote('');
      setError('');
      invalidateShift();
      onStarted?.();
      onClose();
    },
    onError: (err: { response?: { status?: number; data?: { code?: string; message?: string } } }) => {
      // 409 SHIFT_ALREADY_ACTIVE means another tab or device already opened
      // one. Refreshing is the fix, not retrying.
      if (err?.response?.data?.code === 'SHIFT_ALREADY_ACTIVE') {
        invalidateShift();
        onClose();
        return;
      }
      setError(err?.response?.data?.message || 'Could not start your shift. Try again.');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={mutation.isPending ? () => {} : onClose} title="Start your shift" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Count what&apos;s in the drawer before you begin. Everything you take in today is measured
          against this figure.
        </p>

        <Input
          label="Opening cash float"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          placeholder="0"
          value={float}
          onChange={(e) => setFloat(e.target.value)}
        />
        <Input
          label="Note (optional)"
          placeholder="e.g. Took over from Mary"
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Start shift</Button>
        </div>
      </div>
    </Modal>
  );
}
