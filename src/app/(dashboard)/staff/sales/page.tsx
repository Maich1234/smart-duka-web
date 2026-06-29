'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ShoppingCart, Banknote, Smartphone, Trash2, Plus, Minus, X,
  Package, CheckCircle, ArrowRight, Receipt, ExternalLink, Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import MpesaPaymentModal from '@/components/payments/MpesaPaymentModal';
import Spinner from '@/components/ui/Spinner';
import { buildReceiptHtml, printReceiptHtml } from '@/utils/receiptHtml';

type ProductType = 'standard' | 'variable' | 'weighted' | 'refillable' | 'service' | 'bundle' | 'configurable';
interface Product {
  _id: string; name: string; sellingPrice: number; quantity: number;
  unitOfMeasure: string; productType: ProductType; trackInventory: boolean;
  lowStockAlert: number; minPrice?: number; maxPrice?: number; allowPriceOverride?: boolean;
  variants?: { _id: string; name: string; sellingPrice: number; quantity: number }[];
}
interface CartEntry { product: Product; qty: number; unitPrice: number; variantId?: string; variantName?: string; }
interface SaleItem { name?: string; productName?: string; quantity: number; unitPrice: number; subtotal: number; variantName?: string; }
interface Sale { _id: string; invoiceNumber: string; totalAmount: number; paymentMethod: 'cash' | 'mpesa'; createdAt: string; items: SaleItem[]; receiptToken?: string; mpesaReceiptNumber?: string; }

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);
const cartKey = (e: CartEntry) => `${e.product._id}:${e.variantId ?? ''}`;

// ─── Quantity Modal ─────────────────────────────────────────────────────────
function QuantityModal({ product, onConfirm, onClose }: {
  product: Product; onConfirm: (qty: number, price: number, variantId?: string, variantName?: string) => void; onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(product.sellingPrice);
  const [variantId, setVariantId] = useState(product.variants?.[0]?._id ?? '');
  const selectedVariant = product.variants?.find((v) => v._id === variantId);
  const effectivePrice = selectedVariant ? selectedVariant.sellingPrice : price;
  const max = product.trackInventory && product.productType !== 'bundle' ? (selectedVariant ? selectedVariant.quantity : product.quantity) : 999;
  const isWeighted = product.productType === 'weighted' || product.productType === 'refillable';
  const canOverride = product.productType === 'variable' || (product.productType === 'service' && product.allowPriceOverride);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        <h3 className="font-bold text-lg mb-1" style={{ color: '#0F172A' }}>Add to Cart</h3>
        <p className="text-sm text-gray-500 mb-4">{product.name}</p>
        {product.productType === 'configurable' && product.variants && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Variant</label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button key={v._id} onClick={() => setVariantId(v._id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${variantId === v._id ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-gray-200 text-gray-600'}`}>
                  {v.name} — {fmt(v.sellingPrice)}
                </button>
              ))}
            </div>
          </div>
        )}
        {canOverride && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Price</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={product.minPrice ?? 0}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-teal-200" />
          </div>
        )}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Quantity{isWeighted ? ` (${product.unitOfMeasure})` : ''}</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(isWeighted ? 0.1 : 1, parseFloat((q - (isWeighted ? 0.1 : 1)).toFixed(1))))}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <input type="number" value={qty} onChange={(e) => setQty(Math.max(isWeighted ? 0.1 : 1, parseFloat(e.target.value) || 1))}
              step={isWeighted ? 0.1 : 1} min={isWeighted ? 0.1 : 1} max={max}
              className="flex-1 text-center text-xl font-bold py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-teal-200" />
            <button onClick={() => setQty((q) => Math.min(max, parseFloat((q + (isWeighted ? 0.1 : 1)).toFixed(1))))}
              disabled={qty >= max} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40">
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {max < 999 && <p className="text-xs text-gray-400 mt-1.5 text-center">{max} {product.unitOfMeasure} available</p>}
        </div>
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ backgroundColor: '#F0FDFA' }}>
          <span className="text-sm font-medium text-gray-600">Subtotal</span>
          <span className="text-lg font-bold" style={{ color: '#0F766E' }}>{fmt(effectivePrice * qty)}</span>
        </div>
        <button onClick={() => onConfirm(qty, effectivePrice, variantId || undefined, selectedVariant?.name)}
          className="w-full py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: '#0F766E' }}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

// ─── Receipt Success Modal ──────────────────────────────────────────────────
function ReceiptSuccessModal({ sale, shopName, shopConfig, onClose, onNewSale }: {
  sale: Sale; shopName: string;
  shopConfig: { phone?: string; currency?: string; thankYouNote?: string; logoUrl?: string; motto?: string };
  onClose: () => void; onNewSale: () => void;
}) {
  const receiptUrl = sale.receiptToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${sale.receiptToken}` : null;
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    try {
      const html = buildReceiptHtml(sale, shopName, shopConfig.phone, shopConfig.currency, undefined, shopConfig.thankYouNote, shopConfig.logoUrl, shopConfig.motto);
      printReceiptHtml(html);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #15803D, #16A34A)' }}>
          <CheckCircle className="w-9 h-9 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: '#0F172A' }}>Sale Complete!</h3>
        <p className="text-gray-500 text-sm mb-5">
          #{sale.invoiceNumber} · {fmt(sale.totalAmount)} · {sale.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}
        </p>
        {sale.mpesaReceiptNumber && (
          <div className="mb-5 px-5 py-3 rounded-xl border" style={{ backgroundColor: '#DCFCE7', borderColor: 'rgba(21,128,61,0.2)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#15803D' }}>M-Pesa Reference</p>
            <p className="text-lg font-bold tracking-widest" style={{ color: '#15803D' }}>{sale.mpesaReceiptNumber}</p>
          </div>
        )}
        <div className="space-y-3">
          <button onClick={handlePrint} disabled={printing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-60 transition-all"
            style={{ color: '#0F766E', borderColor: '#0F766E' }}>
            <Printer className="w-4 h-4" /> {printing ? 'Opening…' : 'Print Receipt'}
          </button>
          {receiptUrl && (
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              <Receipt className="w-4 h-4" /> View Digital Receipt <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button onClick={onNewSale} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white" style={{ backgroundColor: '#0F766E' }}>
            <ShoppingCart className="w-4 h-4" /> New Sale <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sale Detail Modal ──────────────────────────────────────────────────────
function SaleDetailModal({ sale, shopName, shopConfig, onClose }: {
  sale: Sale; shopName: string;
  shopConfig: { phone?: string; currency?: string; thankYouNote?: string; logoUrl?: string; motto?: string };
  onClose: () => void;
}) {
  const receiptUrl = sale.receiptToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${sale.receiptToken}` : null;
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    try {
      const html = buildReceiptHtml(sale, shopName, shopConfig.phone, shopConfig.currency, undefined, shopConfig.thankYouNote, shopConfig.logoUrl, shopConfig.motto);
      printReceiptHtml(html);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="font-bold" style={{ color: '#0F172A' }}>Sale Details</h3>
            <p className="text-xs text-gray-500">#{sale.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Date', value: format(new Date(sale.createdAt), 'dd MMM yyyy') },
              { label: 'Time', value: format(new Date(sale.createdAt), 'HH:mm') },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">{m.label}</p>
                <p className="text-xs font-semibold" style={{ color: '#0F172A' }}>{m.value}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3"><Package className="w-4 h-4" style={{ color: '#0F766E' }} /><p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Items</p></div>
            <div className="space-y-2">
              {sale.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{item.name ?? item.productName}</p>
                    <p className="text-xs text-gray-400">{item.quantity} × {fmt(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{fmt(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: '#F0FDFA', borderColor: 'rgba(15,118,110,0.2)' }}>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-extrabold" style={{ color: '#0F766E' }}>{fmt(sale.totalAmount)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {sale.paymentMethod === 'mpesa'
                ? <><Smartphone className="w-4 h-4" style={{ color: '#0F766E' }} /><span className="text-sm font-medium" style={{ color: '#0F766E' }}>M-Pesa</span></>
                : <><Banknote className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-600">Cash</span></>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} disabled={printing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-60 transition-all"
              style={{ color: '#0F766E', borderColor: '#0F766E' }}>
              <Printer className="w-4 h-4" /> {printing ? 'Opening…' : 'Print Receipt'}
            </button>
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm border-2 transition-all"
                style={{ color: '#64748B', borderColor: '#E2E8F0' }}>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function StaffSalesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const shopName = user?.shop?.name ?? 'Smart Duka';

  const { data: shopData } = useQuery({
    queryKey: ['shop-config'],
    queryFn: async () => { const res = await api.get('/shop'); return res.data.data; },
  });
  const shopConfig = {
    phone: shopData?.phone,
    currency: shopData?.currency,
    thankYouNote: shopData?.receiptThankYouNote,
    logoUrl: shopData?.logoUrl,
    motto: shopData?.motto,
  };

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [quantityModalProduct, setQuantityModalProduct] = useState<Product | null>(null);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handlePhoneDigits = (digits: string) => {
    const clean = digits.replace(/\D/g, '').slice(0, 9);
    setPhoneDigits(clean);
    setCustomerPhone(clean ? `+254${clean}` : '');
  };
  const isValidPhone = /^\+254[17]\d{8}$/.test(customerPhone);

  const [productsPage, setProductsPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);

  const { data: productsRaw, isLoading: productsLoading } = useQuery({
    queryKey: ['products-sale', search, productsPage],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search: search || undefined, limit: 10, page: productsPage } });
      return res.data as { data: Product[]; pagination: { page: number; limit: number; total: number; pages: number } };
    },
  });

  const { data: mySalesRaw } = useQuery({
    queryKey: ['my-sales', salesPage],
    queryFn: async () => {
      const res = await api.get('/sales/me', { params: { page: salesPage, limit: 10 } });
      return res.data as { data: Sale[]; pagination: { page: number; limit: number; total: number; pages: number } };
    },
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => { const res = await api.get('/payment-config/status'); return res.data.data?.mpesa; },
  });
  const mpesaEnabled = paymentStatus?.isConfigured ?? false;

  const createSaleMutation = useMutation({
    mutationFn: async (data: { items: object[]; paymentMethod: string; mpesaTransactionId?: string }) => {
      const res = await api.post('/sales', data);
      return res.data.data as Sale;
    },
    onSuccess: (sale) => {
      setCart([]); setCustomerPhone(''); setPhoneDigits(''); setCompletedSale(sale);
      queryClient.invalidateQueries({ queryKey: ['my-sales'] });
      queryClient.invalidateQueries({ queryKey: ['products-sale'] });
    },
  });

  const addToCart = (product: Product) => { setQuantityModalProduct(product); };
  const confirmAdd = (qty: number, unitPrice: number, variantId?: string, variantName?: string) => {
    setCart((prev) => {
      const key = `${quantityModalProduct!._id}:${variantId ?? ''}`;
      const existing = prev.find((e) => cartKey(e) === key);
      if (existing) return prev.map((e) => cartKey(e) === key ? { ...e, qty: e.qty + qty } : e);
      return [...prev, { product: quantityModalProduct!, qty, unitPrice, variantId, variantName }];
    });
    setQuantityModalProduct(null);
  };
  const updateQty = (key: string, delta: number) => setCart((prev) => prev.map((e) => cartKey(e) === key ? { ...e, qty: Math.max(0.1, e.qty + delta) } : e).filter((e) => e.qty > 0));
  const removeFromCart = (key: string) => setCart((prev) => prev.filter((e) => cartKey(e) !== key));
  const totalAmount = cart.reduce((s, e) => s + e.unitPrice * e.qty, 0);
  const buildItems = () => cart.map((e) => ({ productId: e.product._id, quantity: e.qty, ...(e.variantId ? { variantId: e.variantId } : {}), ...(e.unitPrice !== e.product.sellingPrice ? { unitPrice: e.unitPrice } : {}) }));

  const productsData = productsRaw?.data ?? [];
  const productsTotalPages = productsRaw?.pagination?.pages ?? 1;
  const mySalesData = mySalesRaw?.data ?? [];
  const salesTotalPages = mySalesRaw?.pagination?.pages ?? 1;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'mpesa') {
      if (!mpesaEnabled) return alert('M-Pesa is not configured for this shop. Contact the owner.');
      if (!isValidPhone) return alert('Enter a valid Kenyan phone number.');
      setMpesaModalOpen(true); return;
    }
    createSaleMutation.mutate({ items: buildItems(), paymentMethod: 'cash' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Record Sale</h1>
        <p className="text-sm text-gray-500 mt-0.5">Search products and process the sale</p>
      </div>

      <div className="grid xl:grid-cols-5 gap-5">
        {/* Product browser */}
        <div className="xl:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-200" />
          </div>
          {productsLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {productsData?.map((p) => {
                  const out = p.trackInventory && p.productType !== 'bundle' && p.quantity <= 0;
                  const low = p.trackInventory && !out && p.quantity <= p.lowStockAlert;
                  return (
                    <button key={p._id} onClick={() => !out && addToCart(p)} disabled={out}
                      className={`bg-white rounded-xl border text-left p-4 transition-all ${out ? 'opacity-50 cursor-not-allowed border-gray-100' : 'hover:border-[#0F766E] hover:shadow-sm active:scale-95 border-gray-100'}`}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: '#F0FDFA' }}>
                        <Package className="w-4 h-4" style={{ color: '#0F766E' }} />
                      </div>
                      <p className="text-sm font-semibold leading-tight mb-1 line-clamp-2" style={{ color: '#0F172A' }}>{p.name}</p>
                      <p className="text-base font-bold" style={{ color: '#0F766E' }}>{fmt(p.sellingPrice)}</p>
                      {p.trackInventory && p.productType !== 'bundle' && (
                        <p className={`text-xs mt-1 font-medium ${out ? 'text-red-500' : low ? 'text-amber-500' : 'text-gray-400'}`}>
                          {out ? 'Out of stock' : `${p.quantity} ${p.unitOfMeasure} left${low ? ' ⚠' : ''}`}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              {productsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-3">
                  <button onClick={() => setProductsPage((p) => Math.max(1, p - 1))} disabled={productsPage <= 1} className="w-8 h-8 rounded-full border border-[#0F766E] flex items-center justify-center text-[#0F766E] hover:bg-[#F0FDFA] disabled:opacity-30 disabled:border-gray-200 disabled:text-gray-300 transition-all">‹</button>
                  <span className="text-xs font-semibold text-gray-500">Page {productsPage} of {productsTotalPages}</span>
                  <button onClick={() => setProductsPage((p) => Math.min(productsTotalPages, p + 1))} disabled={productsPage >= productsTotalPages} className="w-8 h-8 rounded-full border border-[#0F766E] flex items-center justify-center text-[#0F766E] hover:bg-[#F0FDFA] disabled:opacity-30 disabled:border-gray-200 disabled:text-gray-300 transition-all">›</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Cart + checkout */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" style={{ color: '#0F766E' }} />
                <span className="font-bold" style={{ color: '#0F172A' }}>Current Sale</span>
              </div>
              {cart.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#0F766E' }}>
                  {cart.reduce((s, e) => s + e.qty, 0)} items
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs mt-1">Click a product to add it</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                {cart.map((entry) => (
                  <div key={cartKey(entry)} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>
                        {entry.product.name}{entry.variantName ? ` (${entry.variantName})` : ''}
                      </p>
                      <p className="text-xs" style={{ color: '#0F766E' }}>{fmt(entry.unitPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(cartKey(entry), -1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                      <span className="w-8 text-center text-sm font-bold">{entry.qty}</span>
                      <button onClick={() => updateQty(cartKey(entry), 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="text-sm font-bold min-w-[48px] text-right" style={{ color: '#0F172A' }}>{fmt(entry.unitPrice * entry.qty)}</span>
                    <button onClick={() => removeFromCart(cartKey(entry))} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="text-2xl font-extrabold" style={{ color: '#0F766E' }}>{fmt(totalAmount)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([['cash', 'Cash', Banknote], ['mpesa', 'M-Pesa', Smartphone]] as const).map(([v, label, Icon]) => (
                    <button key={v} onClick={() => setPaymentMethod(v as 'cash' | 'mpesa')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${paymentMethod === v ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-gray-200 text-gray-500'}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
                {paymentMethod === 'mpesa' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Customer Phone</label>
                    <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: phoneDigits && !isValidPhone ? '#ef4444' : '#e2e8f0' }}>
                      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-sm font-semibold text-gray-700 flex-shrink-0">🇰🇪 +254</div>
                      <input type="tel" value={phoneDigits} onChange={(e) => handlePhoneDigits(e.target.value)} placeholder="712 345 678" maxLength={9}
                        className="flex-1 px-3 py-2.5 text-sm bg-white outline-none tracking-widest" />
                    </div>
                    {phoneDigits && !isValidPhone && <p className="text-xs text-red-500 mt-1">Enter a valid number starting with 7 or 1</p>}
                    {!mpesaEnabled && <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200"><p className="text-xs text-amber-700">M-Pesa not configured. Contact the shop owner.</p></div>}
                  </div>
                )}
                {createSaleMutation.error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {(createSaleMutation.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Sale failed. Try again.'}
                  </div>
                )}
                <button onClick={handleCheckout} disabled={createSaleMutation.isPending || (paymentMethod === 'mpesa' && (!isValidPhone || !mpesaEnabled))}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#0F766E' }}>
                  {createSaleMutation.isPending
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                    : paymentMethod === 'mpesa'
                    ? <><Smartphone className="w-4 h-4" /> Send M-Pesa Request — {fmt(totalAmount)}</>
                    : <><CheckCircle className="w-4 h-4" /> Complete Sale — {fmt(totalAmount)}</>}
                </button>
                <button onClick={() => setCart([])} className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1">Clear cart</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Sales History */}
      {mySalesData.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-3" style={{ color: '#0F172A' }}>My Sales History</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {mySalesData.map((sale) => (
              <button key={sale._id} onClick={() => setSelectedSale(sale)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>#{sale.invoiceNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(sale.createdAt), 'dd MMM, HH:mm')} · {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#0F766E' }}>{fmt(sale.totalAmount)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sale.paymentMethod === 'mpesa' ? 'bg-[#F0FDFA] text-[#0F766E]' : 'bg-gray-100 text-gray-500'}`}>
                    {sale.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {salesTotalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setSalesPage((p) => Math.max(1, p - 1))} disabled={salesPage <= 1} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">← Previous</button>
              <span className="text-xs font-semibold text-gray-500">Page {salesPage} of {salesTotalPages}</span>
              <button onClick={() => setSalesPage((p) => Math.min(salesTotalPages, p + 1))} disabled={salesPage >= salesTotalPages} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-30 transition-all">Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {quantityModalProduct && <QuantityModal product={quantityModalProduct} onConfirm={confirmAdd} onClose={() => setQuantityModalProduct(null)} />}
      <MpesaPaymentModal open={mpesaModalOpen} phoneNumber={customerPhone} amount={totalAmount} onSuccess={(txId) => { setMpesaModalOpen(false); createSaleMutation.mutate({ items: buildItems(), paymentMethod: 'mpesa', mpesaTransactionId: txId }); }} onCancel={() => setMpesaModalOpen(false)} />
      {completedSale && <ReceiptSuccessModal sale={completedSale} shopName={shopName} shopConfig={shopConfig} onClose={() => setCompletedSale(null)} onNewSale={() => setCompletedSale(null)} />}
      {selectedSale && <SaleDetailModal sale={selectedSale} shopName={shopName} shopConfig={shopConfig} onClose={() => setSelectedSale(null)} />}
    </div>
  );
}
