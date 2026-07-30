'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ShiftSummaryView from './ShiftSummaryView';
import { endShift, type Shift } from '@/services/shifts';
import { useInvalidateShift } from '@/hooks/useShift';

/**
 * Closing a shift, then showing what it came to.
 *
 * Mount this **above** whatever branches on "is there an active shift" in the
 * parent. Ending a shift invalidates that query, which nulls the shift — if
 * this modal lives inside the has-a-shift branch it unmounts mid-flow and the
 * cashier never sees the closing summary they just counted for. The mobile
 * app hit exactly that and fixed it the same way.
 *
 * It keeps its own copy of the closed shift for the same reason.
 */
export default function EndShiftModal({
  isOpen,
  shiftId,
  onClose,
}: {
  isOpen: boolean;
  /** Captured when opening — 'current' for your own shift, an id to force-close. */
  shiftId: string;
  onClose: () => void;
}) {
  const invalidateShift = useInvalidateShift();
  const queryClient = useQueryClient();
  const [count, setCount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [closed, setClosed] = useState<Shift | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      endShift(shiftId, {
        closingCount: count.trim() === '' ? undefined : Number(count),
        closingNote: note.trim() || undefined,
      }),
    onSuccess: (res) => {
      setError('');
      setClosed(res.data);
      invalidateShift();
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message || 'Could not close the shift. Try again.');
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    setCount('');
    setNote('');
    setError('');
    setClosed(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={closed ? 'Shift closed' : 'End your shift'}
      size="sm"
    >
      {closed ? (
        <div className="space-y-4">
          {closed.summary && (
            <ShiftSummaryView
              summary={closed.summary}
              openingFloat={closed.openingFloat}
              closingCount={closed.closingCount}
            />
          )}
          <div className="flex justify-end pt-1">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Count the cash in the drawer and enter the total. Leave it blank if you&apos;d rather not
            reconcile — the shift still closes.
          </p>

          <Input
            label="Counted cash"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="0"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
          <Input
            label="Note (optional)"
            placeholder="e.g. Paid supplier from till, receipt in drawer"
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={handleClose} disabled={mutation.isPending}>Cancel</Button>
            <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>End shift</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
