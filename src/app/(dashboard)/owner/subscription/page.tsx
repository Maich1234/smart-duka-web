'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Gift, Sparkles, ShieldCheck, AlertCircle, Lock, Clock, Users, CreditCard, RefreshCw, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useSubscription, useInvalidateSubscription } from '@/hooks/useSubscription';
import {
  activateTrial,
  cancelSubscription,
  getPlans,
  initiateSubscriptionPayment,
  previewPricing,
  validatePromo,
  type AccessState,
  type BillingCycle,
  type SubscriptionPlan,
} from '@/services/subscription';
import { useAuthStore } from '@/store/authStore';
import SubscriptionPayModal from '@/components/subscription/SubscriptionPayModal';
import PaystackPayModal from '@/components/subscription/PaystackPayModal';
import PlanCards from '@/components/subscription/PlanCards';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

const STATE_META: Record<AccessState, { label: string; fg: string; bg: string; icon: typeof Gift }> = {
  none: { label: 'Not activated', fg: '#64748B', bg: '#F1F5F9', icon: Gift },
  trialing: { label: 'Free trial', fg: '#115E59', bg: '#E6F4F2', icon: Sparkles },
  active: { label: 'Active', fg: '#15803D', bg: '#E6F4EA', icon: ShieldCheck },
  grace: { label: 'Payment due', fg: '#92400E', bg: '#FEF3C7', icon: AlertCircle },
  locked: { label: 'Paused', fg: '#DC2626', bg: '#FEE2E2', icon: Lock },
};

const fmt = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`;

function InfoRow({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="flex-1 text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>{value}</span>
    </div>
  );
}

export default function SubscriptionPage() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { subscription, access, renewal, isLoading, refetch } = useSubscription();
  const invalidate = useInvalidateSubscription();
  const [payOpen, setPayOpen] = useState<'mpesa' | 'bank' | null>(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<{ code: string; title: string; discountType: 'percentage' | 'fixed'; discountValue: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const plan = (subscription?.plan ?? null) as SubscriptionPlan | null;
  const state = access?.state ?? 'none';

  // Arriving from "Pay {amount} now" on the staff page (see owner/staff's
  // immediate-seat-billing prompt) — open the payment flow the moment the
  // data needed to price it has loaded, then drop the query param so a
  // refresh doesn't reopen it.
  useEffect(() => {
    if (searchParams.get('pay') !== '1') return;
    const canPayNow = !!renewal && (state === 'trialing' || state === 'grace' || state === 'locked' || state === 'active');
    if (!canPayNow) return;
    setPayOpen('mpesa');
    router.replace('/owner/subscription');
  }, [searchParams, renewal, state, router]);

  // Default the picker to whatever the shop is on today, then let the owner
  // change it. The web app is the only place a plan can be switched at all now
  // that the mobile app carries no purchase surface.
  useEffect(() => {
    if (renewal && selectedSlug === null) setSelectedSlug(renewal.planSlug);
    if (renewal && selectedCycle === null) setSelectedCycle(renewal.billingCycle);
  }, [renewal, selectedSlug, selectedCycle]);

  const { data: plansData } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: getPlans,
    // Always on, not just when the plan picker opens — the payment method
    // row below needs `providers` to know whether to offer card/bank
    // alongside M-Pesa. Small payload, already cached for 60s either way.
    staleTime: 60_000,
  });

  const bankAvailable = plansData?.data.providers.some((p) => p.key === 'bank' && p.available) ?? false;

  const effectiveSlug = selectedSlug ?? renewal?.planSlug ?? null;
  const effectiveCycle = selectedCycle ?? renewal?.billingCycle ?? 'monthly';
  // True once the owner has actually chosen something different from their
  // current arrangement — the amount then has to be re-priced server-side.
  const isSwitching =
    !!renewal && (effectiveSlug !== renewal.planSlug || effectiveCycle !== renewal.billingCycle);

  // A promo code re-prices the same plan/cycle, so it needs a fresh preview
  // too — not just plan/cycle switches.
  const needsPreview = isSwitching || !!promo;

  const { data: pricePreview } = useQuery({
    queryKey: ['pricingPreview', effectiveSlug, effectiveCycle, promo?.code ?? null],
    queryFn: () => previewPricing({ planSlug: effectiveSlug ?? undefined, billingCycle: effectiveCycle, promoCode: promo?.code }),
    enabled: needsPreview && !!effectiveSlug,
    staleTime: 30_000,
  });

  // Never trust a client-side total: the amount charged is always the
  // server's, whether that's the standing renewal or a fresh preview.
  // previewPricing doesn't know about accrued seat charges (it only prices
  // the plan itself) — those only need adding back in when the owner is
  // still on their current plan/cycle, since switching either already
  // resets the billing basis or is a pre-existing gap this doesn't touch.
  const seatCharges = renewal?.seatCharges ?? 0;
  const payAmount = isSwitching
    ? pricePreview?.data.amountDue ?? 0
    : promo
      ? (pricePreview?.data.amountDue ?? 0) + seatCharges
      : renewal?.amountDue ?? 0;
  const payCurrency = (needsPreview ? pricePreview?.data.currency : renewal?.currency) ?? 'KES';
  const promoDiscount = promo ? pricePreview?.data.promoDiscount ?? 0 : 0;
  // Only meaningful once a live server preview backs it up (switching plans,
  // or a promo applied) — the plain-renewal amount already reflects any
  // banked referral credit on its own and never needs this shortcut.
  const isFreeActivation = needsPreview && !!pricePreview && payAmount <= 0;
  const meta = STATE_META[state];
  const StateIcon = meta.icon;

  // Skips the M-Pesa/Paystack modal entirely for a promo/referral discount
  // that already covers the invoice in full — there's nothing to pay, so
  // asking for a phone number or opening a card popup would be pointless.
  // The server independently recomputes and enforces amountDue <= 0 itself;
  // `isFreeActivation` only decides which button to render.
  const activateFree = async () => {
    if (activating || working) return;
    setActivating(true);
    try {
      const res = await initiateSubscriptionPayment(
        { billingCycle: effectiveCycle, planSlug: effectiveSlug ?? undefined, promoCode: promo?.code },
        crypto.randomUUID()
      );
      if (res.data.status === 'success') {
        showToast('success', res.message || 'Subscription activated for free.');
        setPayOpen(null);
        setShowPlanPicker(false);
        removePromo();
        invalidate();
        refetch();
      } else {
        // The server disagreed with our last preview (price moved between
        // preview and click) — safer to ask for a fresh attempt than open a
        // payment modal pre-loaded with a now-stale amount.
        showToast('error', 'Pricing just changed — please try again.');
        invalidate();
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('error', e.response?.data?.message ?? 'Could not activate the subscription. Try again.');
    } finally {
      setActivating(false);
    }
  };

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code || promoChecking) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const res = await validatePromo(code);
      setPromo(res.data);
      setPromoInput('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPromoError(e.response?.data?.message ?? 'That promo code is invalid or has expired.');
    } finally {
      setPromoChecking(false);
    }
  };
  const removePromo = () => {
    setPromo(null);
    setPromoError(null);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const startTrial = async () => {
    if (working) return;
    setWorking(true);
    try {
      const res = await activateTrial();
      showToast('success', res.message);
      invalidate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('error', e.response?.data?.message ?? 'Could not activate the trial. Try again.');
    } finally {
      setWorking(false);
    }
  };

  const doCancel = async () => {
    setWorking(true);
    try {
      const res = await cancelSubscription();
      showToast('success', res.message);
      invalidate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast('error', e.response?.data?.message ?? 'Could not cancel. Try again.');
    } finally {
      setWorking(false);
      setConfirmCancelOpen(false);
    }
  };

  if (isLoading && !subscription) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  const expiresAt = access?.expiresAt ? format(new Date(access.expiresAt), 'MMM d, yyyy') : null;
  const canPay = !!renewal && (state === 'trialing' || state === 'grace' || state === 'locked' || state === 'active');

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>Subscription</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your DuQana plan and billing</p>
      </div>

      {toast && (
        <div className={`p-3 rounded-lg border text-sm ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.message}
        </div>
      )}

      {state === 'locked' && (
        <div className="flex gap-3 rounded-2xl p-4 bg-red-50">
          <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-600">Your shop is paused</p>
            <p className="text-sm text-red-800 mt-0.5">Your subscription and grace period have ended. Pay below to pick up right where you left off. All your data is safe.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: meta.bg }}>
            <StateIcon className="w-3.5 h-3.5" style={{ color: meta.fg }} />
            <span className="text-xs font-bold" style={{ color: meta.fg }}>{meta.label}</span>
          </div>
          {access?.cancelled && <span className="text-xs text-gray-400">Cancelled: active until period end</span>}
        </div>

        <h2 className="text-xl font-extrabold" style={{ color: '#0F172A' }}>{plan?.name ? `${plan.name} plan` : 'DuQana'}</h2>
        {!!plan?.tagline && <p className="text-sm text-gray-500 mt-0.5">{plan.tagline}</p>}

        <div className="h-px bg-gray-100 my-4" />

        {state === 'trialing' && (
          <InfoRow icon={Clock} label="Trial ends" value={`${expiresAt} · ${access?.daysLeft} day${access?.daysLeft === 1 ? '' : 's'} left`} />
        )}
        {state === 'active' && (
          <InfoRow icon={RefreshCw} label={access?.cancelled ? 'Access until' : 'Renews'} value={expiresAt ?? '-'} />
        )}
        {state === 'grace' && (
          <InfoRow icon={AlertCircle} label="Grace period" value={`${access?.graceDaysLeft} day${access?.graceDaysLeft === 1 ? '' : 's'} left to pay`} />
        )}
        {renewal && (
          <InfoRow icon={Users} label="Team size" value={`${renewal.staffCount} ${renewal.staffCount === 1 ? 'person' : 'people'}`} />
        )}
        {renewal && (
          <InfoRow
            icon={CreditCard}
            label={
              renewal.billingCycle === 'yearly'
                ? 'Yearly price'
                : renewal.billingCycle === 'quarterly'
                  ? '3-month price'
                  : 'Monthly price'
            }
            value={fmt(renewal.basePrice ?? renewal.amountDue, renewal.currency)}
          />
        )}

        {/* Mid-period team changes are postpaid and prorated, so an invoice
            can differ from the plan price. Itemise it rather than letting the
            owner wonder where an unexplained amount came from. */}
        {!!renewal?.seatCharges && (
          <>
            <InfoRow
              icon={Users}
              label="Team changes this period"
              value={`+${fmt(renewal.seatCharges, renewal.currency)}`}
            />
            {renewal.seatAdjustments?.length > 0 && (
              <ul className="mb-2.5 ml-6 space-y-1">
                {renewal.seatAdjustments.map((adjustment, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex-1">
                      {adjustment.label} · {adjustment.daysBilled} day{adjustment.daysBilled === 1 ? '' : 's'}
                    </span>
                    <span className="font-semibold">
                      {adjustment.amount < 0 ? '−' : '+'}
                      {fmt(Math.abs(adjustment.amount), renewal.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="h-px bg-gray-100 my-2" />
            <InfoRow icon={CreditCard} label="Total due" value={fmt(renewal.amountDue, renewal.currency)} />
          </>
        )}

        {state === 'none' && (
          <>
            <p className="text-sm text-gray-500 mb-4">Your free trial is waiting. Activate it now. No payment needed to start.</p>
            <Button onClick={startTrial} loading={working} className="w-full">Activate free trial</Button>
          </>
        )}

        {canPay && (
          <>
            {promo ? (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: '#E6F4EA' }}>
                <Check className="w-4 h-4 shrink-0" style={{ color: '#15803D' }} />
                <span className="flex-1 text-sm font-semibold" style={{ color: '#15803D' }}>
                  {promo.code} applied{promoDiscount > 0 ? ` · −${fmt(promoDiscount, payCurrency)}` : ''}
                </span>
                <button onClick={removePromo} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                  Remove
                </button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                    placeholder="Promo code"
                    aria-label="Promo code"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                    style={{ color: '#0F172A' }}
                  />
                  <Button onClick={applyPromo} disabled={!promoInput.trim()} loading={promoChecking} variant="outline">
                    Apply
                  </Button>
                </div>
                {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
              </div>
            )}

            {isFreeActivation ? (
              <Button onClick={activateFree} loading={activating} className="w-full">
                Activate for free
              </Button>
            ) : bankAvailable ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => setPayOpen('mpesa')} className="flex-1">
                  M-Pesa · {fmt(payAmount, payCurrency)}
                </Button>
                <Button onClick={() => setPayOpen('bank')} variant="outline" className="flex-1">
                  Card / Bank
                </Button>
              </div>
            ) : (
              <Button onClick={() => setPayOpen('mpesa')} className="w-full">
                {state === 'active'
                  ? `Extend now · ${fmt(payAmount, payCurrency)}`
                  : `Pay with M-Pesa · ${fmt(payAmount, payCurrency)}`}
              </Button>
            )}
            <button
              onClick={() => setShowPlanPicker((v) => !v)}
              className="w-full mt-3 text-sm font-semibold hover:underline"
              style={{ color: '#0F766E' }}
            >
              {showPlanPicker ? 'Hide plans' : 'Change plan or billing cycle'}
            </button>
          </>
        )}
      </div>

      {showPlanPicker && plansData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <PlanCards
            plans={plansData.data.plans}
            staffCount={plansData.data.staffCount}
            currency={plansData.data.currency}
            billingCycle={effectiveCycle}
            onBillingCycleChange={setSelectedCycle}
            selectedSlug={effectiveSlug}
            onSelect={setSelectedSlug}
          />
          {isSwitching && (
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
              <p className="flex-1 text-sm text-gray-500">
                Switching to <strong style={{ color: '#0F172A' }}>{effectiveSlug}</strong> ({effectiveCycle}):{' '}
                {pricePreview ? (isFreeActivation ? 'free' : fmt(payAmount, payCurrency)) : 'pricing…'}
              </p>
              <Button
                onClick={isFreeActivation ? activateFree : () => setPayOpen('mpesa')}
                disabled={!pricePreview}
                loading={isFreeActivation && activating}
                className="w-full sm:w-auto"
              >
                {isFreeActivation ? 'Activate for free' : 'Pay & switch'}
              </Button>
            </div>
          )}
        </div>
      )}

      {subscription && subscription.status !== 'cancelled' && state !== 'locked' && (
        <button onClick={() => setConfirmCancelOpen(true)} className="w-full text-center py-3 text-sm font-semibold text-red-500 hover:text-red-600">
          Cancel subscription
        </button>
      )}

      <SubscriptionPayModal
        isOpen={payOpen === 'mpesa'}
        amount={payAmount}
        currency={payCurrency}
        billingCycle={effectiveCycle}
        planSlug={effectiveSlug ?? undefined}
        promoCode={promo?.code}
        defaultPhone={user?.shop?.phone}
        onClose={() => setPayOpen(null)}
        onSuccess={() => {
          setPayOpen(null);
          removePromo();
          invalidate();
          refetch();
        }}
      />

      <PaystackPayModal
        isOpen={payOpen === 'bank'}
        amount={payAmount}
        currency={payCurrency}
        billingCycle={effectiveCycle}
        planSlug={effectiveSlug ?? undefined}
        promoCode={promo?.code}
        onClose={() => setPayOpen(null)}
        onSuccess={() => {
          setPayOpen(null);
          removePromo();
          invalidate();
          refetch();
        }}
      />

      <Modal isOpen={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)} title="Cancel subscription?">
        <p className="text-gray-600 mb-6">You keep full access until the end of your current period. You can re-subscribe anytime.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>Keep subscription</Button>
          <Button variant="danger" loading={working} onClick={doCancel}>Cancel subscription</Button>
        </div>
      </Modal>
    </div>
  );
}
