'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Printer, Copy, MessageCircle, Share2, Mail, Download,
  Trash2, XCircle, CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { CASH_METHOD_KEY, MPESA_METHOD_KEY, methodIcon, resolveSaleMethods } from '@/lib/paymentMethods';
import { useShop } from '@/hooks/useShop';
import { useMoney } from '@/lib/money';
import { useToast } from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import MpesaPaymentModal from '@/components/payments/MpesaPaymentModal';
import { buildQuotationHtml, printQuotationHtml } from '@/utils/quotationHtml';
import {
  getQuotation, convertQuotation, declineQuotation, deleteQuotation, sendQuotationEmail,
  type Quotation, type ConvertQuotationPayload,
} from '@/services/quotations';
import { getCustomerById } from '@/services/customers';

/** The till button that means "the customer is taking this on account" — mirrors constants/credit.js's CREDIT_METHOD_KEY. */
const CREDIT_METHOD_KEY = 'credit';

/** draft/declined/converted, plus 'expired' — a draft past its own validUntil. The server never stores this status. */
function displayStatus(q: Quotation): 'draft' | 'declined' | 'converted' | 'expired' {
  if (q.status === 'draft' && new Date(q.validUntil) < new Date()) return 'expired';
  return q.status;
}

function QuotationStatusBadge({ status }: { status: 'draft' | 'declined' | 'converted' | 'expired' }) {
  const map = {
    draft: { color: 'blue' as const, label: 'Draft' },
    declined: { color: 'red' as const, label: 'Declined' },
    converted: { color: 'green' as const, label: 'Converted' },
    expired: { color: 'gold' as const, label: 'Expired' },
  };
  const { color, label } = map[status];
  return <Badge color={color}>{label}</Badge>;
}

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fmt = useMoney();
  const { shop } = useShop();

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => getQuotation(id),
    enabled: !!id,
  });

  // Same query key owner/sales/page.tsx uses for the identical check, so the
  // two pages share a cache entry instead of asking twice in one session.
  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => {
      const res = await api.get('/payment-config/status');
      return res.data.data?.mpesa;
    },
  });
  const mpesaEnabled = paymentStatus?.isConfigured ?? false;

  const saleMethods = useMemo(() => resolveSaleMethods(shop?.paymentMethods), [shop]);
  const [paymentMethod, setPaymentMethod] = useState<string>(CASH_METHOD_KEY);
  useEffect(() => {
    if (saleMethods.length > 0 && !saleMethods.some((m) => m.key === paymentMethod)) {
      setPaymentMethod(saleMethods[0].key);
    }
  }, [saleMethods, paymentMethod]);

  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [creditConfirmOpen, setCreditConfirmOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const convertMutation = useMutation({
    mutationFn: (payload: ConvertQuotationPayload) => convertQuotation(id, payload),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      setCreditConfirmOpen(false);
      const invoiceNumber = (sale as { invoiceNumber?: string })?.invoiceNumber;
      showToast(invoiceNumber ? `Converted to sale #${invoiceNumber}` : 'Quotation converted to a sale', 'success');
      router.push('/owner/sales');
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => declineQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      setDeclineOpen(false);
      showToast('Quotation declined', 'success');
    },
    onError: (err: unknown) => showToast(errMsg(err, 'Could not decline this quotation.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast('Quotation deleted', 'success');
      router.push('/owner/quotations');
    },
    onError: (err: unknown) => showToast(errMsg(err, 'Could not delete this quotation.'), 'error'),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => sendQuotationEmail(id),
    onSuccess: (message) => showToast(message, 'success'),
    onError: (err: unknown) => showToast(errMsg(err, 'Could not send the email.'), 'error'),
  });

  // The customer's credit account, fetched only once the credit confirm step
  // opens — mirrors creditService.js's summariseAccount(), the same figures
  // a till credit sale would check.
  const { data: creditCustomer, isLoading: creditLoading } = useQuery({
    queryKey: ['customer-account', quotation?.customer],
    queryFn: () => getCustomerById(quotation!.customer),
    enabled: creditConfirmOpen && !!quotation,
  });
  const account = creditCustomer?.account;
  const overLimit = !!quotation && !!account && (!account.canTakeCredit || quotation.total > account.availableCredit);

  const handlePrint = () => {
    if (!quotation) return;
    const html = buildQuotationHtml(
      {
        quoteNumber: quotation.quoteNumber,
        shopName: shop?.name ?? 'DuQana',
        shopPhone: shop?.phone,
        shopAddress: shop?.address,
        shopLogoUrl: shop?.logoUrl,
        currency: shop?.currency,
        customerSnapshot: quotation.customerSnapshot,
        items: quotation.items,
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        total: quotation.total,
        notes: quotation.notes,
        validUntil: quotation.validUntil,
        createdAt: quotation.createdAt,
      },
      shop?.quotationTemplate ?? 'classic',
    );
    printQuotationHtml(html);
  };

  // GET /quotations/:id/pdf sits behind the same Bearer-token auth as every
  // other API call — a plain <a href> new-tab link would 401 since the token
  // lives in localStorage, not a cookie. Fetched through the authenticated
  // api client instead, then opened from a blob URL.
  //
  // The window must open synchronously, in the same tick as the click —
  // exactly like printQuotationHtml's own `window.open` — because a
  // `window.open` issued after an `await` breaks the user-gesture chain most
  // popup blockers require (Safari reliably blocks it). Opening blank first
  // and filling in its location once the blob resolves keeps the open()
  // itself synchronous while still surfacing a clear error when it's blocked,
  // rather than a silent no-op.
  const handleDownloadPdf = async () => {
    if (!quotation) return;
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Pop-up blocked — allow pop-ups to download the PDF.', 'error');
      return;
    }
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/quotations/${quotation._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      win.location.href = url;
    } catch {
      win.close();
      showToast('Could not open the PDF. Try again.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const publicLink = quotation && typeof window !== 'undefined'
    ? `${window.location.origin}/q/${quotation.publicToken}`
    : '';
  const shareMessage = quotation
    ? `Hi ${quotation.customerSnapshot.name}, here is your quotation ${quotation.quoteNumber} from ${shop?.name ?? 'DuQana'} for ${fmt(quotation.total)}: ${publicLink}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      showToast('Link copied to clipboard', 'success');
    } catch {
      showToast('Could not copy the link', 'error');
    }
  };

  const handleWhatsApp = () => {
    if (!quotation) return;
    const phone = quotation.customerSnapshot.phone?.replace(/[^0-9]/g, '');
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(shareMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank');
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const handleShare = () => {
    if (!quotation) return;
    navigator.share({ title: `Quotation ${quotation.quoteNumber}`, text: shareMessage, url: publicLink }).catch(() => {});
  };

  const handleConvert = () => {
    if (!quotation || !paymentMethod) return;
    if (paymentMethod === CREDIT_METHOD_KEY) {
      setCreditConfirmOpen(true);
      return;
    }
    if (paymentMethod === MPESA_METHOD_KEY && mpesaEnabled) {
      setMpesaModalOpen(true);
      return;
    }
    convertMutation.mutate({ paymentMethod });
  };

  const handleMpesaSuccess = (transactionId: string, mpesaReceiptNumber: string) => {
    setMpesaModalOpen(false);
    convertMutation.mutate({
      paymentMethod: 'mpesa',
      mpesaTransactionId: transactionId ?? undefined,
      mpesaReceiptNumber: mpesaReceiptNumber ?? undefined,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (!quotation) {
    return (
      <div className="text-center py-24 text-gray-400">
        Quotation not found.{' '}
        <Link href="/owner/quotations" className="text-[#0F766E] underline">Back to quotations</Link>
      </div>
    );
  }

  const hasEmail = !!quotation.customerSnapshot.email;
  const mpesaPhoneMissing = paymentMethod === MPESA_METHOD_KEY && mpesaEnabled && !quotation.customerSnapshot.phone?.trim();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/owner/quotations">
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>#{quotation.quoteNumber}</h1>
            <QuotationStatusBadge status={displayStatus(quotation)} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Issued {format(new Date(quotation.createdAt), 'dd MMM yyyy')} by {quotation.createdByName}
          </p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      {/* Bill-to + items + totals */}
      <div className="bg-white rounded-card border border-gray-100 shadow-elevation-1 p-6 space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
            <p className="text-base font-bold" style={{ color: '#0F172A' }}>{quotation.customerSnapshot.name}</p>
            {quotation.customerSnapshot.phone && <p className="text-sm text-gray-500">{quotation.customerSnapshot.phone}</p>}
            {quotation.customerSnapshot.email && <p className="text-sm text-gray-500">{quotation.customerSnapshot.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Valid Until</p>
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{format(new Date(quotation.validUntil), 'dd MMM yyyy')}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 font-semibold">Item</th>
              <th className="pb-2 font-semibold text-center">Qty</th>
              <th className="pb-2 font-semibold text-right">Unit Price</th>
              <th className="pb-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5">
                  <p className="font-medium" style={{ color: '#0F172A' }}>{item.name}</p>
                  {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                </td>
                <td className="py-2.5 text-center text-gray-600">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                <td className="py-2.5 text-right font-semibold" style={{ color: '#0F172A' }}>{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(quotation.subtotal)}</span></div>
            {quotation.taxAmount > 0 && (
              <div className="flex justify-between text-gray-500"><span>Tax ({quotation.taxRate}%)</span><span>{fmt(quotation.taxAmount)}</span></div>
            )}
            <div className="flex justify-between text-base font-bold pt-1.5 border-t border-gray-100" style={{ color: '#0F766E' }}>
              <span>Total</span><span>{fmt(quotation.total)}</span>
            </div>
          </div>
        </div>

        {quotation.notes && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
          </div>
        )}
      </div>

      {/* Share — nothing left to send once a quotation is declined or converted */}
      {quotation.status === 'draft' && (
        <div className="bg-white rounded-card border border-gray-100 shadow-elevation-1 p-5 space-y-3">
          <h3 className="font-bold" style={{ color: '#0F172A' }}>Share</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopyLink}><Copy className="w-4 h-4" /> Copy link</Button>
            <Button variant="outline" onClick={handleWhatsApp}><MessageCircle className="w-4 h-4" /> WhatsApp</Button>
            {canShare && (
              <Button variant="outline" onClick={handleShare}><Share2 className="w-4 h-4" /> Share</Button>
            )}
            <span title={!hasEmail ? 'Add an email for this customer first' : undefined}>
              <Button variant="outline" disabled={!hasEmail} loading={sendEmailMutation.isPending} onClick={() => sendEmailMutation.mutate()}>
                <Mail className="w-4 h-4" /> Email to customer
              </Button>
            </span>
            <Button variant="outline" loading={downloadingPdf} onClick={handleDownloadPdf}>
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Convert to Sale */}
      {quotation.status === 'draft' && (
        <div className="bg-white rounded-card border border-gray-100 shadow-elevation-1 p-5 space-y-4">
          <h3 className="font-bold" style={{ color: '#0F172A' }}>Convert to Sale</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {saleMethods.map((method) => {
              const Icon = methodIcon(method);
              return (
                <button
                  key={method.key}
                  onClick={() => setPaymentMethod(method.key)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-control border-2 text-sm font-semibold transition-all ${paymentMethod === method.key ? 'border-[#0F766E] bg-[#F0FDFA] text-[#0F766E]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <Icon className="w-4 h-4" /> {method.label}
                </button>
              );
            })}
          </div>

          {mpesaPhoneMissing && (
            <p className="text-xs text-red-500">This customer has no phone number on file — add one before collecting via M-Pesa.</p>
          )}

          {convertMutation.isError && paymentMethod !== CREDIT_METHOD_KEY && (
            <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-700">
              {errMsg(convertMutation.error, 'Could not convert this quotation. Try again.')}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!paymentMethod || convertMutation.isPending || mpesaPhoneMissing}
            loading={convertMutation.isPending}
            onClick={handleConvert}
          >
            <CheckCircle2 className="w-4 h-4" /> Convert to Sale ({fmt(quotation.total)})
          </Button>
        </div>
      )}

      {/* Decline / Delete */}
      <div className="flex gap-3">
        {quotation.status === 'draft' && (
          <Button variant="outline" className="flex-1" onClick={() => setDeclineOpen(true)}>
            <XCircle className="w-4 h-4" /> Decline
          </Button>
        )}
        {(quotation.status === 'draft' || quotation.status === 'declined') && (
          <Button variant="danger" className="flex-1" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        )}
      </div>

      {/* Decline confirm */}
      <Modal isOpen={declineOpen} onClose={() => setDeclineOpen(false)} title="Decline Quotation">
        <p className="text-gray-600 mb-6">
          Decline quotation #{quotation.quoteNumber} for {quotation.customerSnapshot.name}? This can&apos;t be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeclineOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={declineMutation.isPending} onClick={() => declineMutation.mutate()}>Decline</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Quotation">
        <p className="text-gray-600 mb-6">
          Delete quotation #{quotation.quoteNumber}? This can&apos;t be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button>
        </div>
      </Modal>

      {/* Credit-sale confirm — same figures a till credit sale would check */}
      <Modal isOpen={creditConfirmOpen} onClose={() => setCreditConfirmOpen(false)} title="Confirm Credit Sale" size="sm">
        {creditLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Record this {fmt(quotation.total)} quotation as credit for <strong>{quotation.customerSnapshot.name}</strong>?
            </p>
            {account && (
              <div className="rounded-control border border-gray-200 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Credit limit</span><span className="font-semibold">{fmt(account.creditLimit)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Outstanding</span><span className="font-semibold">{fmt(account.outstanding)}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available</span>
                  <span className="font-semibold" style={{ color: overLimit ? '#DC2626' : '#0F766E' }}>{fmt(account.availableCredit)}</span>
                </div>
              </div>
            )}
            {overLimit && (
              <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-700">
                {account?.blocked
                  ? (account.blockedReason || `${quotation.customerSnapshot.name} is blocked from taking credit.`)
                  : `This sale exceeds ${quotation.customerSnapshot.name}'s available credit.`}
              </div>
            )}
            {convertMutation.isError && (
              <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-700">
                {errMsg(convertMutation.error, 'Could not convert this quotation. Try again.')}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCreditConfirmOpen(false)}>Cancel</Button>
              <Button
                disabled={overLimit}
                loading={convertMutation.isPending}
                onClick={() => convertMutation.mutate({ paymentMethod: CREDIT_METHOD_KEY })}
              >
                Confirm Credit Sale
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <MpesaPaymentModal
        open={mpesaModalOpen}
        phoneNumber={quotation.customerSnapshot.phone ?? ''}
        amount={quotation.total}
        accountReference={quotation.quoteNumber}
        onSuccess={handleMpesaSuccess}
        onCancel={() => setMpesaModalOpen(false)}
      />
    </div>
  );
}
