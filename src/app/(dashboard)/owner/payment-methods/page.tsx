'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Wallet, ChevronUp, ChevronDown, Trash2, Plus, CheckCircle, Link2, Info,
} from 'lucide-react';
import api from '@/lib/api';
import { useShop, SHOP_QUERY_KEY } from '@/hooks/useShop';
import { updateShopConfig } from '@/services/shop';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  CASH_METHOD_KEY,
  DEFAULT_SALE_METHODS,
  MPESA_METHOD_KEY,
  SUGGESTED_SALE_METHODS,
  methodIcon,
  slugifyMethodKey,
  type ShopPaymentMethod,
} from '@/lib/paymentMethods';

const MAX_METHODS = 12;

/**
 * Owner-managed till buttons.
 *
 * The till used to offer exactly Cash and M-Pesa, and M-Pesa only worked once
 * Daraja credentials were saved. That fitted almost nobody: shops take money on
 * Pochi la Biashara, on a personal number, on Airtel, into a bank account. Here
 * the shop describes how it actually gets paid; every button records a sale and
 * prints a receipt, and M-Pesa additionally offers an STK prompt if (and only
 * if) the shop has connected M-Pesa Business.
 *
 * Its own page rather than another section of Profile, which is long enough.
 */
export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();

  const { shop: shopData, isLoading } = useShop();
  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => { const res = await api.get('/payment-config/status'); return res.data.data?.mpesa; },
  });
  const mpesaConfigured = paymentStatus?.isConfigured ?? false;

  const [methods, setMethods] = useState<ShopPaymentMethod[]>([]);
  const [dirty, setDirty] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Server state seeds the editor once; after that the local list is the draft
  // being edited, so a background refetch must not wipe unsaved changes.
  useEffect(() => {
    if (dirty) return;
    const stored: ShopPaymentMethod[] | undefined = shopData?.paymentMethods;
    setMethods((stored?.length ? stored : DEFAULT_SALE_METHODS).map((m) => ({ ...m })));
  }, [shopData, dirty]);

  const saveMutation = useMutation({
    mutationFn: (next: ShopPaymentMethod[]) =>
      updateShopConfig({
        // Sent whole, stored whole — array position is the button order, and
        // a partial merge would make removing a button impossible.
        paymentMethods: next.map((m, i) => ({
          key: m.key,
          label: m.label.trim(),
          icon: m.icon ?? 'wallet',
          enabled: m.enabled !== false,
          order: i,
        })),
      }),
    onSuccess: () => {
      setDirty(false);
      setError('');
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: SHOP_QUERY_KEY });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? 'Could not save. Try again.');
    },
  });

  const update = (key: string, patch: Partial<ShopPaymentMethod>) => {
    setDirty(true);
    setMethods((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= methods.length) return;
    setDirty(true);
    setMethods((prev) => {
      const next = prev.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const add = (method: ShopPaymentMethod) => {
    if (methods.length >= MAX_METHODS) return setError(`That's the ${MAX_METHODS}-button limit.`);
    if (methods.some((m) => m.key === method.key)) return setError(`${method.label} is already on the till.`);
    setError('');
    setDirty(true);
    setMethods((prev) => [...prev, { ...method, enabled: true }]);
  };

  const addCustom = () => {
    const label = newLabel.trim();
    if (label.length < 2) return setError('Give the button a name first.');
    const key = slugifyMethodKey(label);
    if (!key) return setError('Use letters or numbers in the name.');
    add({ key, label: label.slice(0, 24), icon: 'wallet' });
    setNewLabel('');
  };

  const remove = (method: ShopPaymentMethod) => {
    // Past sales keep the label they were recorded under, so removing a button
    // never rewrites history — worth saying, because it's the reasonable fear.
    if (!confirm(`Remove ${method.label}? It disappears from the till. Sales already recorded with it stay exactly as they are.`)) return;
    setDirty(true);
    setMethods((prev) => prev.filter((m) => m.key !== method.key));
  };

  const suggestions = useMemo(
    () => SUGGESTED_SALE_METHODS.filter((s) => !methods.some((m) => m.key === s.key)),
    [methods]
  );

  const handleSave = () => {
    if (!methods.some((m) => m.enabled !== false)) return setError('Keep at least one button switched on.');
    if (methods.some((m) => !m.label.trim())) return setError('Every button needs a name.');
    setError('');
    saveMutation.mutate(methods);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Payment Methods</h1>
        <p className="text-gray-500 text-sm mt-1">
          These are the buttons your cashier sees when finishing a sale. Every one of them records the
          sale and prints a receipt.
        </p>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {saved && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Payment buttons updated.
        </div>
      )}

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CCFBF1' }}>
            <Wallet className="w-5 h-5" style={{ color: '#0F766E' }} />
          </div>
          <h2 className="font-bold" style={{ color: '#0F172A' }}>On the till</h2>
        </div>

        {isLoading && methods.length === 0 ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {methods.map((method, index) => {
              const Icon = methodIcon(method);
              const isMpesa = method.key === MPESA_METHOD_KEY;
              const isCash = method.key === CASH_METHOD_KEY;
              return (
                <div key={method.key} className="flex items-center gap-3 py-3">
                  <div className="flex flex-col">
                    <button onClick={() => move(index, -1)} disabled={index === 0}
                      aria-label={`Move ${method.label} up`}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:hover:text-gray-300">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => move(index, 1)} disabled={index === methods.length - 1}
                      aria-label={`Move ${method.label} down`}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-30 disabled:hover:text-gray-300">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0FDFA' }}>
                    <Icon className="w-4 h-4" style={{ color: '#0F766E' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <input value={method.label} maxLength={24}
                      onChange={(e) => update(method.key, { label: e.target.value.slice(0, 24) })}
                      aria-label={`Name for the ${method.label} button`}
                      className="w-full text-sm font-semibold bg-transparent outline-none border-b border-transparent focus:border-teal-300"
                      style={{ color: '#0F172A' }} />
                    {isMpesa && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {mpesaConfigured
                          ? 'Connected — sends an STK prompt to the customer'
                          : 'Records the sale and prints. Connect M-Pesa Business for STK prompts.'}
                      </p>
                    )}
                    {isCash && <p className="text-xs text-gray-400 mt-0.5">Counted as till cash when reconciling shifts</p>}
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={method.enabled !== false}
                      onChange={(e) => update(method.key, { enabled: e.target.checked })} />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#0F766E] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>

                  {/* Cash and M-Pesa are switched off rather than deleted — they
                      carry behaviour the rest of the app looks for. */}
                  {!isCash && !isMpesa && (
                    <button onClick={() => remove(method)} aria-label={`Remove ${method.label}`}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-bold mb-4" style={{ color: '#0F172A' }}>Add a button</h2>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {suggestions.map((s) => {
              const Icon = methodIcon(s);
              return (
                <button key={s.key} onClick={() => add(s)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] transition-all">
                  <Icon className="w-3.5 h-3.5" /> {s.label} <Plus className="w-3 h-3 text-gray-400" />
                </button>
              );
            })}
          </div>
        )}

        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Or name your own</label>
        <div className="flex gap-2">
          <input value={newLabel} maxLength={24}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
            placeholder="e.g. Sacco, Equity Bank, Deni"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
          <Button variant="secondary" onClick={addCustom}>Add</Button>
        </div>

        <div className="flex items-start gap-2 mt-5 text-xs text-gray-500">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
          <p>
            Buttons other than M-Pesa don&apos;t talk to any payment provider yet — they record how the
            customer paid so your reports and cashbook are right.
          </p>
        </div>

        <Link href="/owner/payments"
          className="flex items-center gap-2 mt-4 text-sm font-semibold text-[#0F766E] hover:underline">
          <Link2 className="w-4 h-4" />
          {mpesaConfigured ? 'M-Pesa Business settings' : 'Connect M-Pesa Business for STK prompts'}
        </Link>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saveMutation.isPending} disabled={!dirty || saveMutation.isPending}>
          {dirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>
    </div>
  );
}
