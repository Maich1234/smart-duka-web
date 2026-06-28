'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, CheckCircle, XCircle, Star, Send, Package, Clock, CreditCard } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'https://smart-duka-backend-iota.vercel.app/api/v1';

interface SaleItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ReceiptData {
  invoiceNumber: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  staffName: string;
  createdAt: string;
  ratingSummary?: { avgStars: number; totalRatings: number };
}

export default function ReceiptPage() {
  const { token } = useParams<{ token: string }>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sales/verify/${token}`);
        setReceipt(res.data.data);
      } catch {
        setError('Receipt not found or the link has expired.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReceipt();
  }, [token]);

  const submitRating = async () => {
    if (!stars) return;
    setRatingLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/ratings`, { token, stars, comment });
      setRatingSubmitted(true);
    } catch {
      setRatingSubmitted(true);
    } finally {
      setRatingLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#0F766E" strokeWidth="4" />
            <path className="opacity-75" fill="#0F766E" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Verifying your receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#0F172A' }}>Receipt Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'This receipt link is invalid or has expired.'}</p>
          <Link href="/" className="text-sm font-medium underline" style={{ color: '#0F766E' }}>
            Go to Smart Duka
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0F766E' }}>
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: '#0F766E' }}>Smart Duka</span>
          </Link>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-lg font-bold" style={{ color: '#0F172A' }}>Receipt Verified</h1>
          <p className="text-sm text-gray-500">This receipt is authentic and unaltered</p>
        </div>

        {/* Receipt card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {/* Shop header */}
          <div className="p-6 border-b border-gray-100 text-center" style={{ background: 'linear-gradient(135deg, #0F766E, #115E59)' }}>
            <h2 className="text-xl font-bold text-white mb-1">{receipt.shopName}</h2>
            {receipt.shopAddress && <p className="text-white/70 text-sm">{receipt.shopAddress}</p>}
            {receipt.shopPhone && <p className="text-white/70 text-sm">{receipt.shopPhone}</p>}
          </div>

          {/* Meta */}
          <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5">Invoice</p>
              <p className="text-xs font-bold" style={{ color: '#0F172A' }}>#{receipt.invoiceNumber}</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />Date</p>
              <p className="text-xs font-medium" style={{ color: '#0F172A' }}>{formatDate(receipt.createdAt)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-0.5 flex items-center justify-center gap-1"><CreditCard className="w-3 h-3" />Payment</p>
              <p className="text-xs font-bold capitalize" style={{ color: receipt.paymentMethod === 'mpesa' ? '#0F766E' : '#0F172A' }}>
                {receipt.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" style={{ color: '#0F766E' }} />
              <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Items Purchased</p>
            </div>
            <div className="space-y-2">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{item.name}</p>
                    <p className="text-xs text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="px-6 py-4 border-t border-gray-200" style={{ backgroundColor: '#F0FDFA' }}>
            <div className="flex justify-between items-center">
              <p className="font-bold" style={{ color: '#0F172A' }}>Total Amount</p>
              <p className="text-2xl font-extrabold" style={{ color: '#0F766E' }}>{formatCurrency(receipt.totalAmount)}</p>
            </div>
            {receipt.staffName && (
              <p className="text-xs text-gray-500 mt-1">Served by: <span className="font-medium">{receipt.staffName}</span></p>
            )}
          </div>
        </div>

        {/* Rating section */}
        {!ratingSubmitted ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Rate Your Experience</h3>
            <p className="text-sm text-gray-500 mb-5">How was your visit to {receipt.shopName}?</p>

            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200 resize-none mb-4"
                />
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold mb-1" style={{ color: '#0F172A' }}>Thanks for the feedback!</h3>
            <p className="text-sm text-gray-500">Your rating helps {receipt.shopName} improve their service.</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Powered by{' '}
          <Link href="/" className="font-medium" style={{ color: '#0F766E' }}>Smart Duka</Link>
          {' '}— POS for Kenyan Businesses
        </p>
      </div>
    </div>
  );
}
