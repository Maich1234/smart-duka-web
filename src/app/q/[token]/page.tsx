'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Printer, Download, XCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { buildQuotationHtml, printQuotationHtml, type QuotationData } from '@/utils/quotationHtml';

// Deliberately a bare axios call rather than @/lib/api — same reasoning as
// src/app/r/[token]/page.tsx: this page is public, so it must never attach an
// Authorization header or get caught by the session-expiry redirect. Only the
// host is shared.

export default function PublicQuotationPage() {
  const { token } = useParams<{ token: string }>();
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/public/quotation/${token}`);
        setQuotation(res.data.data);
      } catch (err) {
        // The server distinguishes a malformed token from a quotation that no
        // longer exists — a customer holding a genuine shared link should not
        // be told their link is invalid.
        const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
        setError(message || 'Quotation not found or the link has expired.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchQuotation();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#0F766E" strokeWidth="4" />
            <path className="opacity-75" fill="#0F766E" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Loading your quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Quotation Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'This quotation link is invalid or has expired.'}</p>
          <Link href="/" className="text-sm font-medium underline" style={{ color: '#0F766E' }}>
            Go to DuQana
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quotation.validUntil) < new Date();
  const html = buildQuotationHtml(quotation, quotation.template ?? 'classic');
  const bodyMarkup = html.match(/<body[^>]*>([\s\S]*)<\/body>/)![1];

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: '#0F766E' }}>DuQana</span>
          </Link>
        </div>

        {isExpired && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
            This quotation&apos;s valid-until date has passed — contact {quotation.shopName} to confirm pricing is still current.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div dangerouslySetInnerHTML={{ __html: bodyMarkup }} className="p-8" />
        </div>

        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={() => printQuotationHtml(html)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <a
            href={`${API_BASE_URL}/public/quotation/${token}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#0F766E' }}
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by{' '}
          <Link href="/" className="font-medium" style={{ color: '#0F766E' }}>DuQana</Link>
          {' '}(POS for Kenyan Businesses)
        </p>
      </div>
    </div>
  );
}
