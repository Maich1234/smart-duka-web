'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { SHOP_QUERY_KEY } from '@/hooks/useShop';
import { getShopConfig, updateShopConfig } from '@/services/shop';
import { getProducts, setProductCreditEligibility } from '@/services/products';
import { parseCreditLimit, parseCollectionDays, type CreditSettings } from '@/lib/creditSettings';
import { useAuthStore } from '@/store/authStore';

const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600';
const message = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || 'Could not save. Check your connection and try again.' : 'Could not save. Please try again.';

function EligibleProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ['credit-eligible-products', search, page], queryFn: () => getProducts({ search: search.trim() || undefined, page, limit: 10 }) });
  const change = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setProductCreditEligibility(id, enabled),
    onSuccess: (product) => { qc.setQueryData<{ data: typeof product[]; pagination?: { page: number; pages: number; total: number } }>(['credit-eligible-products', search, page], old => old ? { ...old, data: old.data.map(item => item._id === product._id ? product : item) } : old); qc.invalidateQueries({ queryKey: ['products'] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['credit-eligible-products'] }),
  });
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="eligible-title">
    <div><h2 id="eligible-title" className="text-lg font-semibold">Products allowed on credit</h2><p className="mt-1 text-sm text-slate-600">Used when the selected-products policy is active. New products start off the list.</p></div>
    <label className="block text-sm font-medium">Search products<input className={field} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Name or barcode" /></label>
    {change.isPending && <p role="status" className="text-sm text-slate-600">Saving product eligibility…</p>}
    {change.isError && <p role="alert" className="text-sm text-red-700">{message(change.error)}</p>}
    {products.isPending ? <p role="status">Loading products…</p> : products.isError ? <p role="alert">Could not load products. <Button variant="outline" onClick={() => products.refetch()}>Retry</Button></p> : <>
      {products.data.data.length ? products.data.data.map(p => <label key={p._id} className="flex min-h-12 items-center justify-between gap-4 border-b py-3 text-sm"><span><strong>{p.name}</strong><span className="block text-slate-500">{p.productType}</span></span><input type="checkbox" className="h-5 w-5 accent-teal-700" checked={p.creditEligible === true} disabled={change.isPending} onChange={e => change.mutate({ id: p._id, enabled: e.target.checked })} aria-label={`Allow ${p.name} on credit`} /></label>) : <p className="text-sm text-slate-500">No products found.</p>}
      <div className="flex items-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-sm">Page {page} of {Math.max(1, products.data.pagination?.pages ?? 1)}</span><Button variant="outline" disabled={page >= (products.data.pagination?.pages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</Button></div>
    </>}
  </section>;
}

function SettingsForm({ settings }: { settings: CreditSettings }) {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const save = useMutation({ mutationFn: (patch: Partial<CreditSettings>) => updateShopConfig({ creditSettings: patch }), onSuccess: (shop) => {
    qc.setQueryData(SHOP_QUERY_KEY, shop);
    qc.invalidateQueries({ queryKey: ['creditOverview'] });
    qc.invalidateQueries({ queryKey: ['customers'] });
    setSuccess('Credit settings saved.');
  }, onError: e => { setError(`${message(e)} The change may have been saved; refresh to check.`); qc.invalidateQueries({ queryKey: SHOP_QUERY_KEY }); } });
  return <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-5" onSubmit={e => {
    e.preventDefault(); if (save.isPending) return;
    setError(''); setSuccess('');
    const data = new FormData(e.currentTarget);
    const limit = parseCreditLimit(String(data.get('limit') ?? ''));
    const days = parseCollectionDays(String(data.get('days') ?? ''));
    if (limit === null) { setError('Enter a credit limit from 0 to 10,000,000 with at most two decimal places.'); return; }
    if (days === null) { setError('Enter a whole number of days from 0 to 365.'); return; }
    const values: CreditSettings = { enabled: data.get('enabled') === 'on', defaultCreditLimit: limit, defaultCollectionPeriodDays: days, productPolicy: data.get('productPolicy') === 'SELECTED_PRODUCTS' ? 'SELECTED_PRODUCTS' : 'ALL_PRODUCTS', overduePolicy: data.get('overduePolicy') === 'ALLOW' ? 'ALLOW' : 'BLOCK' };
    const patch: Partial<CreditSettings> = {};
    if (values.enabled !== settings.enabled) patch.enabled = values.enabled;
    if (values.defaultCreditLimit !== settings.defaultCreditLimit) patch.defaultCreditLimit = values.defaultCreditLimit;
    if (values.defaultCollectionPeriodDays !== settings.defaultCollectionPeriodDays) patch.defaultCollectionPeriodDays = values.defaultCollectionPeriodDays;
    if (values.productPolicy !== settings.productPolicy) patch.productPolicy = values.productPolicy;
    if (values.overduePolicy !== settings.overduePolicy) patch.overduePolicy = values.overduePolicy;
    if (!Object.keys(patch).length) { setSuccess('No changes to save.'); return; }
    save.mutate(patch);
  }}>
    <label className="flex items-start gap-3"><input name="enabled" type="checkbox" defaultChecked={settings.enabled} className="mt-1 h-5 w-5 accent-teal-700" /><span><strong>Enable customer credit</strong><span className="block text-sm text-slate-600">Turning this off preserves existing balances, due dates and repayments.</span></span></label>
    <label className="block text-sm font-medium">Default credit limit<input name="limit" type="number" min="0" max="10000000" step="0.01" required defaultValue={settings.defaultCreditLimit} className={field} /><span className="mt-1 block font-normal text-slate-500">Customers without their own limit follow this amount. Zero means they need an individual limit.</span></label>
    <label className="block text-sm font-medium">Collection period in days<input name="days" type="number" min="0" max="365" step="1" required defaultValue={settings.defaultCollectionPeriodDays} className={field} /><span className="mt-1 block font-normal text-slate-500">Zero means due the same day. Existing due dates do not change.</span></label>
    <label className="block text-sm font-medium">Products allowed on credit<select name="productPolicy" defaultValue={settings.productPolicy} className={field}><option value="ALL_PRODUCTS">All products</option><option value="SELECTED_PRODUCTS">Only products selected below</option></select></label>
    <label className="block text-sm font-medium">When a customer has an overdue balance<select name="overduePolicy" defaultValue={settings.overduePolicy} className={field}><option value="BLOCK">Block new credit sales</option><option value="ALLOW">Allow new credit sales</option></select></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{success && <p role="status" className="text-sm text-teal-700">{success}</p>}
    <Button type="submit" loading={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</Button>
  </form>;
}

export default function CreditSettingsPage() {
  const user = useAuthStore(state => state.user);
  const shop = useQuery({ queryKey: SHOP_QUERY_KEY, queryFn: getShopConfig, enabled: user?.role === 'owner' });
  if (user?.role !== 'owner') return <p className="p-6" role="alert">Only the shop owner can change credit settings.</p>;
  return <main className="mx-auto max-w-3xl space-y-5 p-4 md:p-6"><Link href="/owner/credit" className="text-sm font-semibold text-teal-700">← Credit book</Link><header><h1 className="text-2xl font-semibold">Credit settings</h1><p className="mt-1 text-sm text-slate-600">Set your lending rules and choose which products qualify.</p></header>
    {shop.isPending ? <p role="status">Loading settings…</p> : shop.isError ? <p role="alert">Could not load settings. <Button variant="outline" onClick={() => shop.refetch()}>Retry</Button></p> : !shop.data.creditSettings ? <p role="alert">Credit settings are unavailable. Please refresh or contact support.</p> : <><SettingsForm settings={shop.data.creditSettings} /><EligibleProducts /></>}
  </main>;
}
