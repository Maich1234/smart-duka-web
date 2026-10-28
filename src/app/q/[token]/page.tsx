'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Download, Printer } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config';
import { fetchJson } from '@/lib/fetchJson';
import DocumentPrinter from '@/components/documents/DocumentPrinter';
import { createPublicQueryClient } from '@/lib/publicQueryClient';

type PublicQuote = {
  quoteNumber: string;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
  currency?: string;
  customerSnapshot: { name: string };
  items: { name: string; description?: string; quantity: number; unitPrice: number; subtotal: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  validUntil: string;
  status: string;
};

export default function PublicQuotation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [publicClient] = useState(createPublicQueryClient);
  const url = `${API_BASE_URL}/public/quotation/${encodeURIComponent(token)}`;
  const query = useQuery({
    queryKey: ['public-quotation', token], retry: false, networkMode: 'always',
    queryFn: async ({ signal }) => {
      const result = await fetchJson<{ data: PublicQuote }>(url, { signal });
      if (!result.data?.customerSnapshot || !Array.isArray(result.data.items)) {
        throw new Error('The quotation response was incomplete. Please try again.');
      }
      return result.data;
    },
  }, publicClient);
  const q = query.data;
  const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: q?.currency || 'KES' }).format(n);

  return (
    <main className="min-h-screen bg-[#f3f5ef] px-4 py-10 sm:py-16 print:bg-white print:p-0">
      <div className="mx-auto max-w-xl">
        <DocumentPrinter kind="quotation" state={query.isPending ? 'loading' : query.isError ? 'error' : 'ready'}
          shopName={q?.shopName} total={q ? fmt(q.total) : undefined} error={query.error?.message} onRetry={() => query.refetch()}>
          {q && <>
            <header className="border-b border-dashed border-slate-300 pb-5 text-center">
              <p className="text-[10px] tracking-[0.2em] text-slate-500">QUOTATION</p>
              <h2 className="mt-1 text-lg font-bold">{q.quoteNumber}</h2>
              <p className="mt-3 font-semibold">{q.shopName || 'Shop'}</p>
              {q.shopAddress && <p className="text-slate-500">{q.shopAddress}</p>}
              {q.shopPhone && <p className="text-slate-500">{q.shopPhone}</p>}
            </header>
            <dl className="space-y-2 border-b border-dashed border-slate-300 py-5">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Prepared for</dt><dd className="text-right font-semibold">{q.customerSnapshot.name}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Valid until</dt><dd className="text-right">{new Date(q.validUntil).toLocaleDateString('en-KE')}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Status</dt><dd className="capitalize">{q.status}</dd></div>
            </dl>
            <ul aria-label="Quoted items" className="divide-y divide-dashed divide-slate-200">
              {q.items.map((item, i) => <li key={i} className="py-4">
                <div className="flex justify-between gap-4"><h3 className="min-w-0 font-semibold">{item.name}</h3><span className="max-w-[55%] text-right font-semibold">{fmt(item.subtotal)}</span></div>
                {item.description && <p className="mt-1 whitespace-pre-wrap text-slate-500">{item.description}</p>}
                <p className="mt-1 text-slate-500">{item.quantity} × {fmt(item.unitPrice)}</p>
              </li>)}
            </ul>
            <dl className="space-y-2 border-t border-dashed border-slate-300 pt-5">
              <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd>{fmt(q.subtotal)}</dd></div>
              {q.taxAmount > 0 && <div className="flex justify-between gap-4"><dt>Tax ({q.taxRate}%)</dt><dd>{fmt(q.taxAmount)}</dd></div>}
              <div className="flex flex-wrap justify-between gap-3 pt-3 text-lg font-bold"><dt>Total</dt><dd>{fmt(q.total)}</dd></div>
            </dl>
            {q.notes && <div className="mt-6 border-t border-dashed border-slate-300 pt-4"><h3 className="font-semibold">Notes</h3><p className="mt-1 whitespace-pre-wrap text-slate-500">{q.notes}</p></div>}
            <p className="mt-7 text-center text-[10px] text-slate-500">This is a quotation, not proof of payment.</p>
          </>}
        </DocumentPrinter>
        {q && !query.isError && <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
          <a href={`${url}/pdf`} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"><Download size={16} aria-hidden="true" />Open PDF</a>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"><Printer size={16} aria-hidden="true" />Print</button>
        </div>}
        <p className="mt-8 text-center text-xs text-slate-500 print:hidden">Powered by <Link href="/" className="font-semibold text-teal-700 underline underline-offset-4">DuQana</Link></p>
      </div>
    </main>
  );
}
