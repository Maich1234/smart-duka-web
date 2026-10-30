'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';

type Preview = { batchId: string; count: number; canCommit: boolean; expiresAt: string; warnings: string[]; rows: { row: number; name: string; productType?: string; sellingPrice?: number; costPrice?: number | null; quantity?: number; details?: string[]; errors: string[] }[] };
const message = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not complete that request. Check your connection and retry.';
export default function ImportProducts() {
  const owner = useAuthStore(s => s.user?.role === 'owner');
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState<Preview | null>(null), [page, setPage] = useState(1);
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [done, setDone] = useState(''), [acknowledged, setAcknowledged] = useState(false);
  async function template(format: string) {
    setBusy(format); setError('');
    try { const r = await api.get('/products/import/template', { params: { format }, responseType: 'blob' }); const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = `duqana-products-template.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); } catch (e) { setError(message(e)); } finally { setBusy(''); }
  }
  async function upload() {
    if (!file) return;
    setBusy('preview'); setError(''); setDone(''); setPreview(null); setAcknowledged(false);
    try { const form = new FormData(); form.append('file', file); const r = await api.post('/products/import/preview', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }); setPreview(r.data.data); setPage(1); } catch (e) { setError(message(e)); } finally { setBusy(''); }
  }
  async function commit() {
    if (!preview) return;
    setBusy('save'); setError('');
    try { const r = await api.post(`/products/import/${preview.batchId}/commit`, { acknowledgeWarnings: acknowledged }, { timeout: 120000 }); setDone(r.data.message); setPreview(null); setFile(null); await Promise.all(['products', 'inventoryStats', 'priceHealth', 'productCategories', 'aiInsight'].map(key => queryClient.invalidateQueries({ queryKey: [key] }))); } catch (e) { setError(message(e)); } finally { setBusy(''); }
  }
  if (!owner) return <p>Bulk import is available to the shop owner.</p>;
  return <main className="max-w-4xl space-y-6"><Link href="/owner/inventory" className="text-teal-800 underline">Back to inventory</Link><div><h1 className="text-2xl font-bold">Add products from Excel</h1><p className="mt-2 text-slate-600">Use the template to add many products together. Each file can contain up to 2,000 products, with variants and bundle components on their own sheets. Existing products will not be overwritten.</p></div>
    <section className="space-y-3 rounded-xl border bg-white p-5"><h2 className="font-semibold">1. Fill the template</h2><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={!!busy} onClick={() => template('xlsx')}>Download XLSX template</Button><Button variant="outline" disabled={!!busy} onClick={() => template('xls')}>Download XLS template</Button></div><p className="text-sm text-slate-600">Read the Instructions sheet. Keep barcode and SKU columns as text to preserve leading zeros. Use values rather than formulas.</p></section>
    <section className="space-y-3 rounded-xl border bg-white p-5"><h2 className="font-semibold">2. Upload and review</h2><label className="block text-sm font-medium" htmlFor="product-file">Excel file, .xls or .xlsx, up to 5 MB</label><input id="product-file" type="file" accept=".xls,.xlsx" disabled={!!busy} onChange={e => { const chosen = e.target.files?.[0] ?? null; setPreview(null); setDone(''); setError(''); setAcknowledged(false); if (chosen && (chosen.size > 5 * 1024 * 1024 || !/\.(xls|xlsx)$/i.test(chosen.name))) { setFile(null); setError('Choose an XLS or XLSX file up to 5 MB.'); } else setFile(chosen); }} /><Button disabled={!file || !!busy} onClick={upload}>{busy === 'preview' ? 'Checking rows…' : 'Preview products'}</Button></section>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}{done && <p role="status" className="rounded-lg bg-teal-50 p-4 text-teal-900">{done} <Link href="/owner/inventory" className="underline">View inventory</Link></p>}
    {preview && <section className="space-y-4"><h2 className="text-lg font-semibold">3. Check before saving</h2><p>{preview.count} valid products. {preview.canCommit ? 'No row errors found.' : 'Fix every error in your file, then upload again. Nothing has been added.'} Preview expires {new Date(preview.expiresAt).toLocaleString()}.</p>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><caption className="sr-only">Product preview and validation errors</caption><thead className="bg-slate-100"><tr>{['Row', 'Product', 'Type', 'Sell', 'Cost', 'Stock', 'Review'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{preview.rows.slice((page - 1) * 50, page * 50).map((row, i) => <tr key={`${row.row}-${i}`} className="border-t"><td className="p-3">{row.row || 'File'}</td><td className="p-3">{row.name}</td><td className="p-3">{row.productType}</td><td className="p-3">{row.productType === 'configurable' ? 'See variants' : row.sellingPrice}</td><td className="p-3">{row.productType === 'configurable' ? 'See variants' : row.costPrice ?? 'Unknown'}</td><td className="p-3">{row.productType === 'configurable' ? 'See variants' : row.quantity}</td><td className="p-3 text-red-800">{row.errors.length ? <span>{row.errors.join(' ')}</span> : <span className="text-teal-800">Ready</span>}{!!row.details?.length && <details className="mt-2 min-w-48 text-slate-700"><summary className="cursor-pointer font-medium">Review {row.productType === 'configurable' ? 'variants' : 'components'} ({row.details.length})</summary><ul className="mt-2 space-y-2">{row.details.map((detail, n) => <li key={n}>{detail}</li>)}</ul></details>}</td></tr>)}</tbody></table></div>
      <div className="flex items-center gap-3"><Button variant="outline" disabled={page <= 1 || !!busy} onClick={() => setPage(p => p - 1)}>Previous</Button><span>Page {page} of {Math.ceil(preview.rows.length / 50)}</span><Button variant="outline" disabled={page * 50 >= preview.rows.length || !!busy} onClick={() => setPage(p => p + 1)}>Next</Button></div>
      {!!preview.warnings.length && <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">Below-cost prices need review</h3><ul className="max-h-52 overflow-auto text-sm">{preview.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul><label className="flex items-start gap-3"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /><span>I reviewed these prices and want to save them as entered.</span></label></div>}
      <Button disabled={!preview.canCommit || !!busy || (!!preview.warnings.length && !acknowledged)} onClick={commit}>{busy === 'save' ? 'Saving products…' : `Add ${preview.count} products`}</Button><p className="text-sm text-slate-600">The complete batch is saved together. If saving fails, no products from it are added. Retrying the same preview does not add duplicates.</p>
    </section>}
  </main>;
}
