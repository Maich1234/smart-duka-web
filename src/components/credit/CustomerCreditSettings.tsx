'use client';

import { useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { parseCreditLimit } from '@/lib/creditSettings';
import { updateCustomer, type Customer, type UpdateCustomerData } from '@/services/customers';

export default function CustomerCreditSettings({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const account = customer.account!;
  const [custom, setCustom] = useState(account.creditLimitSource === 'customer');
  const [error, setError] = useState('');
  const qc = useQueryClient();
  const save = useMutation({ mutationFn: (patch: UpdateCustomerData) => updateCustomer(customer._id, patch), onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['customers'] });
    qc.invalidateQueries({ queryKey: ['customer', customer._id] });
    qc.invalidateQueries({ queryKey: ['creditOverview'] });
    onClose();
  }, onError: e => { setError(axios.isAxiosError(e) ? e.response?.data?.message || 'Could not confirm the change. Refresh the account to check whether it was saved.' : 'Could not save credit settings.'); qc.invalidateQueries({ queryKey: ['customer', customer._id] }); } });
  return <Modal isOpen title={`Credit settings · ${customer.name}`} onClose={() => { if (!save.isPending) onClose(); }}>
    <form className="space-y-4" onSubmit={e => {
      e.preventDefault(); if (save.isPending) return; setError('');
      const data = new FormData(e.currentTarget);
      const limit = custom ? parseCreditLimit(String(data.get('limit') ?? '')) : null;
      if (custom && limit === null) { setError('Enter a limit from 0 to 10,000,000 with at most two decimal places.'); return; }
      const blocked = data.get('blocked') === 'on';
      const reason = String(data.get('reason') ?? '').trim();
      const patch: UpdateCustomerData = {};
      if (custom !== (account.creditLimitSource === 'customer') || (custom && limit !== account.creditLimit)) patch.creditLimit = limit;
      if (blocked !== account.blocked) patch.creditBlocked = blocked;
      if (reason !== account.blockedReason) patch.creditBlockedReason = reason;
      if (!Object.keys(patch).length) { onClose(); return; }
      save.mutate(patch);
    }}>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={custom} onChange={e => setCustom(e.target.checked)} className="mt-1 h-5 w-5 accent-teal-700" /><span><strong>Set an individual credit limit</strong><span className="block text-slate-600">Otherwise this customer follows the shop default.</span></span></label>
      {custom && <label className="block text-sm font-medium">Credit limit<input name="limit" type="number" min="0" max="10000000" step="0.01" required defaultValue={account.creditLimit} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>}
      <label className="flex items-start gap-3 text-sm"><input name="blocked" type="checkbox" defaultChecked={account.blocked} className="mt-1 h-5 w-5 accent-teal-700" /><span><strong>Block new credit sales</strong><span className="block text-slate-600">Existing balances and repayments are unaffected.</span></span></label>
      <label className="block text-sm font-medium">Reason (optional)<input name="reason" maxLength={200} defaultValue={account.blockedReason} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Button type="submit" loading={save.isPending}>{save.isPending ? 'Saving…' : 'Save credit settings'}</Button>
    </form>
  </Modal>;
}
