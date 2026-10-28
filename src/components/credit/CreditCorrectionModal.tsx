'use client';
import { useRef, useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { recordOpeningBalance, reverseCreditTransaction } from '@/services/credit';
import { parseCreditCorrection, canRetryCorrection, type CreditCorrection } from '@/lib/pendingCreditCorrection';

export default function CreditCorrectionModal({ kind, target, label, onClose }: { kind: 'opening' | 'reverse'; target: string; label: string; onClose: () => void }) {
  const user = useAuthStore(s => s.user);
  const storageKey = `duqana-credit-correction:${user?.shop._id}:${user?._id}:${kind}:${target}`;
  const [saved] = useState(() => { try { const raw = localStorage.getItem(storageKey); return raw ? { pending: parseCreditCorrection(raw, kind, target), invalid: false } : { pending: null, invalid: false }; } catch { return { pending: null, invalid: true }; } });
  const [pending, setPending] = useState<CreditCorrection | null>(saved.pending);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const creating = useRef(false);
  const [starting, setStarting] = useState(false);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (p: CreditCorrection) => p.kind === 'opening' ? recordOpeningBalance({ customerId: p.target, amount: p.amount, note: p.note }, p.key) : reverseCreditTransaction(p.target, p.reason, p.key),
    onSuccess: () => {
      for (const key of ['customers', 'customer', 'creditOverview', 'creditTransactions']) qc.invalidateQueries({ queryKey: [key] });
      try { localStorage.removeItem(storageKey); } catch { setError('Recorded, but the saved reminder could not be cleared. Check the ledger before proceeding.'); return; }
      onClose();
    },
    onError: e => setError(axios.isAxiosError(e) ? e.response?.data?.message || 'The response was interrupted. Check the ledger or retry this same request.' : 'Could not confirm the entry. Check the ledger before proceeding.'),
    onSettled: () => { lock.current = false; },
  });
  const submit = (p: CreditCorrection) => {
    if (lock.current || mutation.isPending || user?.role !== 'owner') return;
    if (!canRetryCorrection(p)) { setError('The retry window has expired. Check the ledger before taking further action.'); return; }
    lock.current = true;
    mutation.mutate(p);
  };
  if (user?.role !== 'owner') return null;
  return <Modal isOpen title={kind === 'opening' ? 'Bring forward an existing debt' : 'Reverse credit entry'} onClose={() => { if (!mutation.isPending && !creating.current) onClose(); }}>
    <p className="mb-4 text-sm text-slate-600">{label}</p>
    {saved.invalid ? <p role="alert">The saved request cannot be read. Check the ledger and contact support before recording another entry.</p> : pending ? <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><strong>Entry awaiting confirmation</strong><p>{pending.kind === 'opening' ? `Opening debt: ${pending.amount.toLocaleString()}` : `Reason: ${pending.reason}`}</p><p>The server may already have recorded this. Retry sends the same request and key.</p></div>
      <Button disabled={!canRetryCorrection(pending)} loading={mutation.isPending} onClick={() => submit(pending)}>Retry same request</Button>
      <Button variant="ghost" disabled={mutation.isPending} onClick={() => { if (window.confirm('Have you checked the ledger and resolved this entry? Clearing the reminder does not undo a recorded entry.')) { try { localStorage.removeItem(storageKey); setPending(null); setError(''); } catch { setError('Could not clear the saved request.'); } } }}>I checked the ledger · clear reminder</Button>
    </div> : <form className="space-y-4" onSubmit={e => {
      e.preventDefault(); if (lock.current || creating.current || mutation.isPending) return; setError('');
      const f = new FormData(e.currentTarget);
      if (!navigator.locks) { setError('Use a current browser over HTTPS to safely record credit corrections.'); return; }
      creating.current = true; setStarting(true);
      void navigator.locks.request(storageKey, { ifAvailable: true }, async acquired => {
      if (!acquired) { setError('Another tab is recording this entry. Check it before proceeding.'); return; }
      try {
        if (localStorage.getItem(storageKey)) { setError('A saved entry needs review. Close and reopen this dialog.'); return; }
        if (!crypto.randomUUID) throw new Error('Secure storage unavailable');
        const base = { key: crypto.randomUUID(), createdAt: Date.now(), target };
        const p: CreditCorrection = kind === 'opening' ? { ...base, kind, amount: Number(f.get('amount')), note: String(f.get('note') || '').trim() } : { ...base, kind, reason: String(f.get('reason') || '').trim() };
        parseCreditCorrection(JSON.stringify(p), kind, target);
        localStorage.setItem(storageKey, JSON.stringify(p)); setPending(p); submit(p);
      } catch { setError('Enter valid details and ensure browser storage is available. Nothing was submitted.'); }
      }).catch(() => setError('Could not safely start the request. Please try again.')).finally(() => { creating.current = false; setStarting(false); });
    }}>
      <p className="rounded-lg bg-slate-50 p-3 text-sm">{kind === 'opening' ? 'Use only for a debt that already exists outside Duqana. This increases the customer’s balance without creating a new sale. The shop collection period determines its due date.' : 'This adds a correction to the ledger. It does not delete the original entry or send a payment/refund.'}</p>
      {kind === 'opening' ? <><label className="block text-sm">Amount<input name="amount" required type="number" min="0.01" max="10000000" step="0.01" className="mt-1 w-full rounded-lg border p-3" /></label><label className="block text-sm">Note (optional)<textarea name="note" maxLength={300} className="mt-1 w-full rounded-lg border p-3" /></label></> : <label className="block text-sm">Reason<textarea name="reason" required minLength={3} maxLength={300} className="mt-1 w-full rounded-lg border p-3" /></label>}
      <Button type="submit" loading={mutation.isPending || starting}>{kind === 'opening' ? 'Record existing debt' : 'Record reversal'}</Button>
    </form>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
  </Modal>;
}
