'use client';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';

type Preview = { batchId: string; status?: 'preview' | 'committed'; count: number; canCommit: boolean; expiresAt: string; warnings: string[]; rows: { row: number; name: string; productType?: string; sellingPrice?: number; costPrice?: number | null; quantity?: number; details?: string[]; errors: string[] }[] };
type SavedPreview = { batchId: string; confirming: boolean };
async function failure(error: unknown, saving = false) {
  const e = error as { response?: { status?: number; data?: { message?: string; code?: string } | Blob }; code?: string };
  const status = e.response?.status;
  let data = e.response?.data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) { try { data = JSON.parse(await data.text()); } catch { data = undefined; } }
  const body = data as { message?: string; code?: string } | undefined;
  const uncertain = saving && (!status || status >= 500 || status === 408);
  return { status, code: body?.code, uncertain, message: uncertain ? 'We could not confirm whether your products were saved. Check the save status or retry this same preview. It will not add duplicates. Do not start another upload yet.' : body?.message ?? (status === 429 ? 'Too many import attempts. Wait one minute, then retry.' : 'Could not reach DuQana. Check your connection and retry.') };
}
export default function ImportProducts() {
  const user = useAuthStore(s => s.user), owner = user?.role === 'owner';
  const storageKey = `duqana:product-import:${user?._id}:${user?.shop?._id}`;
  const currentScope = useRef(owner ? storageKey : ''); currentScope.current = owner ? storageKey : '';
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState<Preview | null>(null), [page, setPage] = useState(1);
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [done, setDone] = useState(''), [info, setInfo] = useState('');
  const [acknowledged, setAcknowledged] = useState(false), [showErrors, setShowErrors] = useState(false), [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null), notice = useRef<HTMLDivElement>(null), operation = useRef(false);
  const sameScope = () => currentScope.current === storageKey;
  const remember = (value: SavedPreview | null) => { try { if (value) sessionStorage.setItem(storageKey, JSON.stringify(value)); else sessionStorage.removeItem(storageKey); } catch { /* Import still works without browser storage. */ } };
  const showPreview = (data: Preview) => { setPreview(data); setPage(1); setShowErrors(!data.canCommit); setAcknowledged(false); };
  function complete(count: number) {
    remember(null); setPreview(null); setFile(null); setConfirming(false); setError(''); setInfo('');
    setDone(`${count} product${count === 1 ? '' : 's'} added. Your inventory is ready to use.`);
    if (fileInput.current) fileInput.current.value = '';
    for (const key of ['products', 'inventoryStats', 'priceHealth', 'productCategories', 'aiInsight']) void queryClient.invalidateQueries({ queryKey: [key] });
  }
  useEffect(() => { if (error || done) notice.current?.focus(); }, [error, done]);
  useEffect(() => {
    let active = true;
    setPreview(null); setFile(null); setConfirming(false); setError(''); setDone(''); setInfo(''); setBusy(''); operation.current = false;
    if (!owner) return;
    let saved: SavedPreview | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'); } catch { return; }
    if (!saved?.batchId || !/^[a-f\d]{24}$/i.test(saved.batchId)) return;
    operation.current = true; setBusy('restore');
    api.get(`/products/import/${saved.batchId}`).then(response => {
      if (!active) return;
      const data = response.data.data as Preview;
      if (data.status === 'committed') complete(data.count);
      else { showPreview(data); setConfirming(!!saved?.confirming); setInfo(saved?.confirming ? 'Your previous save has not been confirmed. Check its status or retry this same preview.' : 'Your checked preview has been restored. Review it before saving.'); }
    }).catch(async e => {
      const result = await failure(e); if (!active) return;
      setError(result.message);
      if ([404, 410].includes(result.status ?? 0)) remember(null);
      else setConfirming(!!saved?.confirming);
    }).finally(() => { if (active) { setBusy(''); operation.current = false; } });
    return () => { active = false; };
    // Scope changes reset this form; helpers intentionally capture that scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, owner]);
  async function template(format: string) {
    if (operation.current) return; operation.current = true; setBusy(format); setError(''); setInfo('');
    try {
      const r = await api.get('/products/import/template', { params: { format }, responseType: 'blob' }); if (!sameScope()) return;
      const url = URL.createObjectURL(r.data), a = document.createElement('a'); a.href = url; a.download = `duqana-products-template.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); setInfo('Template download started. Open the file in Excel, Google Sheets or another spreadsheet app.');
    } catch (e) { const result = await failure(e); if (sameScope()) setError(result.message); }
    finally { if (sameScope()) { setBusy(''); operation.current = false; } }
  }
  async function upload() {
    if (!file || operation.current || confirming) return; operation.current = true; setBusy('preview'); setError(''); setDone(''); setInfo(''); setPreview(null); setAcknowledged(false); remember(null);
    try { const form = new FormData(); form.append('file', file); const r = await api.post('/products/import/preview', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }); if (!sameScope()) return; const data = r.data.data as Preview; showPreview(data); remember({ batchId: data.batchId, confirming: false }); }
    catch (e) { const result = await failure(e); if (sameScope()) setError(result.message); }
    finally { if (sameScope()) { setBusy(''); operation.current = false; } }
  }
  async function checkStatus() {
    if (operation.current) return;
    let batchId = preview?.batchId;
    if (!batchId) { try { batchId = (JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as SavedPreview | null)?.batchId; } catch { /* No saved preview. */ } }
    if (!batchId) { setError('No saved preview is available. Check inventory before choosing the file again.'); return; }
    operation.current = true; setBusy('status'); setError(''); setInfo('');
    try { const data = (await api.get(`/products/import/${batchId}`)).data.data as Preview; if (!sameScope()) return; if (data.status === 'committed') complete(data.count); else { showPreview(data); setInfo('No completed save is recorded yet. You can retry this same preview safely.'); } }
    catch (e) { const result = await failure(e); if (!sameScope()) return; setError(result.message); if ([404, 410].includes(result.status ?? 0)) { remember(null); setConfirming(false); setPreview(null); } }
    finally { if (sameScope()) { setBusy(''); operation.current = false; } }
  }
  async function commit() {
    if (!preview || operation.current || !preview.canCommit || (preview.warnings.length > 0 && !acknowledged)) return;
    operation.current = true; const wasConfirming = confirming; setBusy('save'); setError(''); setInfo(''); remember({ batchId: preview.batchId, confirming: true });
    try { const r = await api.post(`/products/import/${preview.batchId}/commit`, { acknowledgeWarnings: acknowledged }, { timeout: 120000 }); if (sameScope()) complete(r.data.data.count); }
    catch (e) {
      const result = await failure(e, true); if (!sameScope()) return; setError(result.message);
      if ([404, 410].includes(result.status ?? 0) || result.code === 'IMPORT_CATALOGUE_CHANGED') { remember(null); setPreview(null); setConfirming(false); }
      else { const pending = wasConfirming || result.uncertain; setConfirming(pending); remember({ batchId: preview.batchId, confirming: pending }); }
    } finally { if (sameScope()) { setBusy(''); operation.current = false; } }
  }
  if (!owner) return <p>Bulk import is available to the shop owner.</p>;
  const issueCount = preview?.rows.filter(row => row.errors.length).length ?? 0;
  const rows = preview?.rows.filter(row => !showErrors || row.errors.length) ?? [];
  return <main className="max-w-4xl space-y-6" aria-busy={!!busy}>
    <Link href="/owner/inventory" className="text-teal-800 underline">Back to inventory</Link>
    <div><h1 className="text-2xl font-bold">Add products from Excel</h1><p className="mt-2 text-slate-600">Add up to 2,000 products per file. Existing products will not be overwritten.</p><Link href="/help/excel-product-import" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-teal-800 underline">Read the Excel import guide (opens in a new tab)</Link></div>
    <div ref={notice} tabIndex={-1} className="space-y-3 focus:outline-none">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"><p>{error}</p><Link href="/help/excel-product-import#rejections" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline">Why was my file rejected? (opens in a new tab)</Link></div>}
      {done && <div role="status" className="rounded-lg bg-teal-50 p-4 text-teal-900">{done} <Link href="/owner/inventory" className="font-semibold underline">View inventory</Link></div>}
      {info && <p role="status" className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">{info}</p>}
    </div>
    {!!busy && <p role="status" aria-live="polite" className="rounded-lg bg-teal-50 p-4 text-teal-900">{busy === 'preview' ? 'Uploading and checking your rows. Large files may take a moment. No products have been saved.' : busy === 'save' ? 'Saving your complete batch. Keep this page open while we confirm the result.' : busy === 'status' || busy === 'restore' ? 'Checking your saved preview and import status…' : 'Preparing your Excel template…'}</p>}
    {confirming && <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><p>A save is awaiting confirmation. Keep this preview so you can check or retry safely.</p><div className="flex flex-wrap gap-3"><Button onClick={checkStatus} disabled={!!busy}>Check save status</Button><Link href="/owner/inventory" target="_blank" rel="noopener noreferrer" className="self-center font-semibold text-teal-800 underline">Check inventory (new tab)</Link></div></section>}
    <section className="space-y-3 rounded-xl border bg-white p-5"><h2 className="font-semibold">1. Fill the template</h2><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={!!busy} onClick={() => template('xlsx')}>Download XLSX template</Button><Button variant="outline" disabled={!!busy} onClick={() => template('xls')}>Download XLS template</Button></div><p className="text-sm text-slate-600">Identifier columns are formatted as text to preserve leading zeros. Keep the template headings and use values rather than formulas. The guide includes filled examples.</p></section>
    <section className="space-y-3 rounded-xl border bg-white p-5"><h2 className="font-semibold">2. Upload and review</h2><label className="block text-sm font-medium" htmlFor="product-file">Excel file, .xls or .xlsx, up to 5 MB</label><input ref={fileInput} id="product-file" type="file" accept=".xls,.xlsx" disabled={!!busy || confirming} onChange={e => { const chosen = e.target.files?.[0] ?? null; setPreview(null); setDone(''); setError(''); setInfo(''); setAcknowledged(false); remember(null); if (chosen && (!/\.(xls|xlsx)$/i.test(chosen.name) || chosen.size === 0 || chosen.size > 5 * 1024 * 1024)) { setFile(null); setError(!/\.(xls|xlsx)$/i.test(chosen.name) ? 'This file type is not supported. Save your file as .xls or .xlsx and choose it again.' : chosen.size === 0 ? 'This file is empty. Add your products, save it and choose it again.' : `This file is ${(chosen.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB. Split it into smaller files.`); e.target.value = ''; } else setFile(chosen); }} /><Button disabled={!file || !!busy || confirming} onClick={upload}>{busy === 'preview' ? 'Checking rows…' : 'Preview products'}</Button></section>
    {preview && <section className="space-y-4"><h2 className="text-lg font-semibold">3. Check before saving</h2><p role="status">{preview.count} valid product{preview.count === 1 ? '' : 's'}. {preview.canCommit ? 'No row errors found.' : `${issueCount} row or file issue${issueCount === 1 ? '' : 's'} need correction. Nothing has been added from this preview.`} Preview expires {new Date(preview.expiresAt).toLocaleString()}.</p>
      {!!issueCount && <label className="flex items-center gap-2"><input type="checkbox" checked={showErrors} onChange={e => { setShowErrors(e.target.checked); setPage(1); }} />Show only rows with errors</label>}
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><caption className="sr-only">Product preview and validation errors</caption><thead className="bg-slate-100"><tr>{['Row', 'Product', 'Type', 'Sell', 'Cost', 'Stock', 'Review'].map(h => <th scope="col" className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice((page - 1) * 50, page * 50).map((row, i) => <tr key={`${row.row}-${i}`} className="border-t"><td className="p-3">{row.row || 'File'}</td><td className="p-3">{row.name}</td><td className="p-3">{row.productType}</td><td className="p-3">{row.productType === 'configurable' ? 'See variants' : row.sellingPrice}</td><td className="p-3">{row.productType === 'configurable' ? 'See variants' : row.costPrice ?? 'Unknown'}</td><td className="p-3">{row.productType === 'configurable' ? 'See variants' : row.quantity}</td><td className="p-3">{row.errors.length ? <ul className="space-y-2 text-red-800">{row.errors.map((reason, n) => <li key={n}>{reason}</li>)}</ul> : <span className="text-teal-800">Ready</span>}{!!row.details?.length && <details className="mt-2 min-w-48 text-slate-700"><summary className="cursor-pointer font-medium">Review {row.productType === 'configurable' ? 'variants' : 'components'} ({row.details.length})</summary><ul className="mt-2 space-y-2">{row.details.map((detail, n) => <li key={n}>{detail}</li>)}</ul></details>}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={page <= 1 || !!busy} onClick={() => setPage(p => p - 1)}>Previous</Button><span>Page {page} of {Math.max(1, Math.ceil(rows.length / 50))}</span><Button variant="outline" disabled={page * 50 >= rows.length || !!busy} onClick={() => setPage(p => p + 1)}>Next</Button></div>
      {!!preview.warnings.length && <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">Prices need your review</h3><ul className="max-h-52 space-y-2 overflow-auto text-sm">{preview.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul><label className="flex items-start gap-3"><input type="checkbox" disabled={!!busy} checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /><span>I reviewed these prices and want to save them as entered.</span></label></div>}
      <Button disabled={!preview.canCommit || !!busy || (!!preview.warnings.length && !acknowledged)} onClick={commit}>{busy === 'save' ? 'Saving products…' : confirming ? 'Retry this save safely' : `Add ${preview.count} product${preview.count === 1 ? '' : 's'}`}</Button><p className="text-sm text-slate-600">The complete batch is saved together. If the connection drops, check the status or retry this same preview to avoid duplicates. Checked previews are available for up to 24 hours. Keep this page open until saving is confirmed.</p>
    </section>}
  </main>;
}
