'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Star, Send } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import DocumentPrinter from '@/components/documents/DocumentPrinter';

// Deliberately a bare axios call rather than @/lib/api: this page is public,
// so it must never attach an Authorization header or get caught by the
// session-expiry redirect. Only the host is shared.

/**
 * Mirrors the payload of GET /public/receipt/:token exactly.
 *
 * That endpoint deliberately returns a summary — item count, not the line
 * items — because the URL is unauthenticated: anyone holding the token sees
 * everything here. Do not render fields the endpoint does not send; an earlier
 * version of this page assumed line items, payment method and staff name, and
 * threw on `items.map` for every scan.
 */
interface ReceiptData {
  invoiceNumber: string;
  shopName: string;
  currency?: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  alreadyRated: boolean;
  rating: { stars: number; comment?: string } | null;
}

export default function ReceiptPage() {
  const { token } = useParams<{ token: string }>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setReceipt(null);
    const fetchReceipt = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/public/receipt/${encodeURIComponent(token)}`, { timeout: 15000, signal: controller.signal });
        if (!controller.signal.aborted) setReceipt(res.data.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        // The server distinguishes a malformed token from a sale that no
        // longer exists — a customer holding a genuine printed receipt should
        // not be told their code is invalid.
        const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
        setError(message || 'Could not load the receipt. Check your connection and try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    if (token) fetchReceipt();
    else { setError('This receipt link is invalid.'); setLoading(false); }
    return () => controller.abort();
  }, [token, attempt]);

  const submitRating = async () => {
    if (!stars) return;
    setRatingLoading(true);
    setRatingError('');
    try {
      await axios.post(`${API_BASE_URL}/public/receipt/${token}/rating`, {
        stars,
        comment: comment.trim() || undefined,
      }, { timeout: 15000 });
      setRatingSubmitted(true);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setRatingError(message || 'Could not send your rating. Please try again.');
    } finally {
      setRatingLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: receipt?.currency || 'KES',
      minimumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });

  if (loading || error || !receipt) {
    return <main className="min-h-screen bg-[#f3f5ef] px-4 py-10 sm:py-16"><div className="mx-auto max-w-md">
      <DocumentPrinter kind="receipt" state={loading ? 'loading' : 'error'} error={error} onRetry={() => setAttempt(value => value + 1)} />
    </div></main>;
  }

  // A rating already on file counts as submitted — the customer scanned twice.
  const hasRated = receipt.alreadyRated || ratingSubmitted;
  const finalStars = receipt.rating?.stars ?? stars;

  return (
    <div className="min-h-screen bg-[#f3f5ef] px-4 py-10 sm:py-16">
      <div className="max-w-md mx-auto">
        <DocumentPrinter kind="receipt" state="ready" shopName={receipt.shopName} total={formatCurrency(receipt.totalAmount)}>
          <div className="mb-6 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-teal-700" aria-hidden="true" />
            <h2 className="text-base font-bold">Receipt verified</h2>
            <p className="mt-1 text-xs text-slate-500">Issued by {receipt.shopName}</p>
          </div>
          <dl className="space-y-3 border-y border-dashed border-slate-300 py-5">
            <div className="flex justify-between gap-4"><dt>Invoice</dt><dd className="text-right font-semibold">{receipt.invoiceNumber}</dd></div>
            <div className="flex justify-between gap-4"><dt>Date</dt><dd className="text-right">{formatDate(receipt.createdAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Items</dt><dd>{receipt.itemCount}</dd></div>
          </dl>
          <div className="flex flex-wrap justify-between gap-3 pt-5 text-base font-bold"><span>Total amount</span><span>{formatCurrency(receipt.totalAmount)}</span></div>
          <p className="mt-7 text-center text-xs text-slate-500">Thank you for shopping with us.</p>
        </DocumentPrinter>

        {/* Rating section */}
        {!hasRated ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 mt-8">
            <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Rate Your Experience</h3>
            <p className="text-sm text-gray-500 mb-5">How was your visit to {receipt.shopName}?</p>

            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className="w-9 h-9 transition-colors"
                    fill={n <= (hovered || stars) ? '#C8932A' : 'none'}
                    style={{ color: n <= (hovered || stars) ? '#C8932A' : '#D1D5DB' }}
                  />
                </button>
              ))}
            </div>

            {stars > 0 && (
              <>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional: Tell them what you liked or how they can improve..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 resize-none mb-4"
                />
                {ratingError && (
                  <p className="text-sm text-red-600 mb-3 text-center">{ratingError}</p>
                )}
                <button
                  onClick={submitRating}
                  disabled={ratingLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white disabled:opacity-70 transition-all"
                  style={{ backgroundColor: '#0F766E' }}
                >
                  {ratingLoading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Rating</>
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 mt-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Thanks for the feedback!</h3>
            {finalStars > 0 && (
              <div className="flex justify-center gap-1 my-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className="w-6 h-6"
                    fill={n <= finalStars ? '#C8932A' : 'none'}
                    style={{ color: n <= finalStars ? '#C8932A' : '#D1D5DB' }}
                  />
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500">Your rating helps {receipt.shopName} improve their service.</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Powered by{' '}
          <Link href="/" className="font-medium" style={{ color: '#0F766E' }}>DuQana</Link>
          {' '}(POS for Kenyan Businesses)
        </p>
      </div>
    </div>
  );
}
