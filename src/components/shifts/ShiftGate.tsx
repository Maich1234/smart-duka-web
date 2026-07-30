'use client';

import { useEffect, useState } from 'react';
import { Clock, LogIn } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StartShiftModal from './StartShiftModal';
import EndShiftModal from './EndShiftModal';
import { useShift } from '@/hooks/useShift';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);

function elapsed(startedAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Wraps the till when the shop enforces shifts.
 *
 * Renders as a section *around* its children rather than swapping the whole
 * screen or redirecting. The mobile app swapped the screen and remounted the
 * product grid on every fetch cycle, which read as the till reloading under
 * the cashier's hands.
 *
 * When shifts are off — including while we're still loading, and including
 * when /shifts/active errors — children render untouched. A shop must never
 * be unable to sell because one endpoint is unavailable.
 */
export default function ShiftGate({ children }: { children: React.ReactNode }) {
  const { enabled, shift, isLoading } = useShift();
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [, forceTick] = useState(0);

  // Refresh the elapsed label without refetching anything.
  useEffect(() => {
    if (!shift) return;
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [shift]);

  // EndShiftModal sits outside the branch below on purpose: closing a shift
  // nulls `shift`, and if the modal lived in the has-a-shift branch it would
  // unmount before showing the closing summary.
  const endModal = <EndShiftModal isOpen={endOpen} shiftId="current" onClose={() => setEndOpen(false)} />;

  if (!enabled) return <>{children}</>;

  if (!shift) {
    return (
      <>
        {endModal}
        <div className="max-w-md mx-auto py-8">
          <Card>
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#CCFBF1' }}
              >
                <LogIn className="w-6 h-6" style={{ color: '#0F766E' }} />
              </div>
              <h2 className="font-bold text-lg mb-1" style={{ color: '#0F172A' }}>
                Start your shift to sell
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your shop counts the drawer at the start and end of each shift.
              </p>
              <Button onClick={() => setStartOpen(true)} disabled={isLoading}>
                Start shift
              </Button>
            </div>
          </Card>
        </div>
        <StartShiftModal isOpen={startOpen} onClose={() => setStartOpen(false)} />
      </>
    );
  }

  return (
    <>
      {endModal}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 mb-4"
        style={{ backgroundColor: '#F0FDFA', border: '1px solid rgba(15,118,110,0.2)' }}
      >
        <Clock className="w-4 h-4 shrink-0" style={{ color: '#0F766E' }} />
        <span className="text-sm font-semibold" style={{ color: '#0F766E' }}>
          Shift open · {elapsed(shift.startedAt)}
        </span>
        <span className="text-xs text-gray-500">Float {fmt(shift.openingFloat)}</span>
        <button
          onClick={() => setEndOpen(true)}
          className="ml-auto text-sm font-semibold underline"
          style={{ color: '#0F766E' }}
        >
          End shift
        </button>
      </div>
      {children}
    </>
  );
}
