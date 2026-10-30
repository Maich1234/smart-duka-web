'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { downloadPriceReview, getPriceHealth, getPriceHistory, ISSUE_LABELS, type PriceHealth, type PriceChange } from '@/services/priceHealth';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const money = (n: unknown, currency: string) => typeof n === 'number' && Number.isFinite(n) ? `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'Unknown';
const source = (change: PriceChange) => change.source === 'purchase' ? 'Purchase cost recalculation' : change.source === 'created' ? 'Product created' : 'Pricing edited';
function usePrices(page = 1) {
  const user = useAuthStore(s => s.user);
  return useQuery({ queryKey: ['priceHealth', user?.shop?._id, page], queryFn: () => getPriceHealth(page), enabled: user?.role === 'owner', refetchOnMount: 'always', refetchOnWindowFocus: 'always', refetchInterval: 60_000, refetchIntervalInBackground: false, meta: { errorHandledLocally: true } });
}
function Figures({ data }: { data: PriceHealth }) {
  const figures = [
    ['Products to review', String(data.summary.affectedProducts)],
    ['Potential shortfall on remaining stock', money(data.summary.potentialLoss, data.currency)],
    [`Recorded gross shortfall, last ${data.window.days} days`, money(data.realised.recordedLoss, data.currency)],
    ['Stock cost value affected', money(data.summary.affectedStockCostValue, data.currency)],
  ];
  return <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{figures.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-3"><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-1 text-xl font-semibold text-slate-900">{value}</dd></div>)}</dl>;
}
export function PriceAlertCard() {
  const { data, isPending, isError, refetch } = usePrices();
  const owner = useAuthStore(s => s.user?.role === 'owner');
  if (!owner) return null;
  if (!data) return <div className="rounded-xl border border-slate-200 p-4 text-sm" role="status">{isPending ? 'Checking product prices…' : 'Could not check product prices.'}{isError && <Button variant="ghost" onClick={() => refetch()}>Retry</Button>}</div>;
  if (!data.summary.affectedPriceRows && !data.realised.belowCostSaleLines && !data.realised.unknownCostLines) return null;
  return <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">Product price review</h2><Link href="/owner/price-alerts" className="font-semibold text-teal-800 underline">Review products and changes</Link></div><Figures data={data} /><p className="text-xs text-slate-700">{data.summary.affectedPriceRows} product/variant alerts. Potential shortfall is not a loss already made. Recorded shortfall excludes costs that are unknown. Last checked {new Date(data.generatedAt).toLocaleString()}.</p>{isError && <p role="alert" className="text-sm">Showing the last check. <button className="underline" onClick={() => refetch()}>Retry refresh</button></p>}</section>;
}
export function PriceAlertsPage() {
  const [exporting, setExporting] = useState(false), [exportError, setExportError] = useState('');
  async function exportPdf() { setExporting(true); setExportError(''); try { await downloadPriceReview(); } catch { setExportError('Could not prepare the PDF. Please retry.'); } finally { setExporting(false); } }
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<{ id: string; name: string } | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const user = useAuthStore(s => s.user);
  const { data, isPending, isError, refetch } = usePrices(page);
  const changes = useQuery({ queryKey: ['productPriceHistory', user?.shop?._id, history?.id, historyPage], queryFn: () => getPriceHistory(history!.id, historyPage), enabled: !!history && user?.role === 'owner', meta: { errorHandledLocally: true } });
  if (user?.role !== 'owner') return <p>Price review is available to the shop owner.</p>;
  if (!data) return <div role="status">{isPending ? 'Checking product prices…' : 'Could not load the price review.'}{isError && <Button onClick={() => refetch()}>Retry</Button>}</div>;
  return <div className="max-w-4xl space-y-5"><div><h1 className="text-2xl font-bold">Product price review</h1><p className="mt-2 text-sm text-slate-600">Review these entries before changing them. A free item, flexible price or promotion may be intentional.</p></div><Button onClick={exportPdf} disabled={exporting}>{exporting ? 'Preparing PDF…' : 'Download PDF with verification QR'}</Button>{exportError && <p role="alert">{exportError}</p>}<Figures data={data} />
    {isError && <p role="alert">Showing the last successful check. <Button onClick={() => refetch()}>Retry refresh</Button></p>}
    <p className="text-sm text-slate-600">{data.notes}</p>
    <p className="text-sm text-slate-600">Estimated sales shortfall: {money(data.realised.estimatedLoss, data.currency)}. Sales lines with unknown cost: {data.realised.unknownCostLines}. Bundles excluded from stock totals: {data.summary.excludedBundles}. Costs reflect saved weighted-average purchase costs, not necessarily the latest invoice price.</p>
    {!data.items.length ? <p className="rounded-lg border bg-white p-5">No current price issues found.</p> : data.items.map(row => <article key={`${row.productId}:${row.variantId ?? 'base'}`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{row.name}{row.variantName ? ` · ${row.variantName}` : ''}</h2><ul className="space-y-1 text-sm text-amber-900">{row.issues.map(issue => <li key={issue}>{ISSUE_LABELS[issue] ?? issue}</li>)}</ul><p className="text-sm">Selling: {money(row.sellingPrice, data.currency)} · Cost: {money(row.costPrice, data.currency)} per {row.unitOfMeasure ?? 'unit'}. Shortfall per unit: {money(row.unitShortfall, data.currency)}.</p><p className="text-sm">{row.productType === 'bundle' ? 'Bundle stock is shared with component products.' : `Positive stock: ${row.stockQuantity}. Potential shortfall: ${money(row.potentialLoss, data.currency)}.`}</p>{row.flexible && <p className="text-sm text-slate-600">Flexible pricing. Allowed minimum: {money(row.minPrice, data.currency)}. Actual sale prices may differ.</p>}
      <p className="text-xs text-slate-600">{row.lastChange ? `${source(row.lastChange)} by ${row.lastChange.actorName ?? 'name unavailable'} on ${new Date(row.lastChange.createdAt).toLocaleString()}. This is the last recorded pricing change, not proof of who caused a loss.` : 'History unavailable for prices saved before tracking began.'}</p>
      <div className="flex flex-wrap gap-4"><Link className="font-semibold text-teal-800 underline" href={`/owner/inventory/${row.productId}/edit`}>Review product</Link><button className="font-semibold text-teal-800 underline" onClick={() => { setHistory({ id: row.productId, name: row.name }); setHistoryPage(1); }}>Price history</button></div>
    </article>)}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><span>Page {page} of {Math.max(1, data.pagination.pages)}</span><Button variant="outline" disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button><Button variant="ghost" onClick={() => refetch()}>Refresh</Button></div>
    {!!data.realised.products.length && <section className="space-y-3"><h2 className="text-lg font-semibold">Largest recorded sales shortfalls in this period</h2><p className="text-xs text-slate-600">Up to 10 product/variant groups. Includes historical prices and discounts, even when the current price is now correct.</p>{data.realised.products.map((p, i) => <p key={i} className="rounded-lg border p-3 text-sm">{p.name}{p.variantName ? ` · ${p.variantName}` : ''}: {money(p.loss, data.currency)}{p.estimated ? ' (includes estimated costs)' : ''}</p>)}</section>}
    <Modal isOpen={!!history} title={`Price history: ${history?.name ?? ''}`} onClose={() => setHistory(null)}>{changes.isPending ? <p>Loading history…</p> : changes.isError ? <p role="alert">Could not load price history. <Button onClick={() => changes.refetch()}>Retry</Button></p> : <div className="space-y-4">{!changes.data?.data.length && <p>No price changes recorded. Older prices cannot be attributed retrospectively.</p>}{changes.data?.data.map(change => <article key={change._id} className="space-y-2 border-b pb-3"><p className="text-sm font-semibold">{source(change)} · {change.actorName ?? 'Name unavailable'}</p><p className="text-xs">{new Date(change.createdAt).toLocaleString()}</p>{change.changes.map((c, i) => <div key={i} className="text-sm"><p>{String(c.after?.name ?? c.before?.name ?? (c.key === 'base' ? 'Product' : 'Variant'))}</p><p>Selling: {money(c.before?.sellingPrice, data.currency)} → {money(c.after?.sellingPrice, data.currency)}</p><p>Cost: {money(c.before?.costPrice, data.currency)} → {money(c.after?.costPrice, data.currency)}</p><p className="text-xs text-slate-500">Minimum: {money(c.before?.minPrice, data.currency)} → {money(c.after?.minPrice, data.currency)}. Other pricing setup changes are retained in this record.</p></div>)}</article>)}<div className="flex gap-3"><Button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>Previous</Button><span>Page {historyPage}</span><Button disabled={historyPage >= (changes.data?.pagination.pages ?? 1)} onClick={() => setHistoryPage(p => p + 1)}>Next</Button></div></div>}</Modal>
  </div>;
}
