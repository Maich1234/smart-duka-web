'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Sparkles, ShieldCheck, AlertCircle, Lock, Clock, Users, CreditCard, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useSubscription, useInvalidateSubscription } from '@/hooks/useSubscription';
import {
  activateTrial,
  cancelSubscription,
  getPlans,
  previewPricing,
  type AccessState,
  type BillingCycle,
  type SubscriptionPlan,
} from '@/services/subscription';
import { useAuthStore } from '@/store/authStore';
import SubscriptionPayModal from '@/components/subscription/SubscriptionPayModal';
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
  const { subscription, access, renewal, isLoading, refetch } = useSubscription();
  const invalidate = useInvalidateSubscription();
  const [payOpen, setPayOpen] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const plan = (subscription?.plan ?? null) as SubscriptionPlan | null;
  const state = access?.state ?? 'none';

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
    enabled: showPlanPicker,
    staleTime: 60_000,
  });

  const effectiveSlug = selectedSlug ?? renewal?.planSlug ?? null;
  const effectiveCycle = selectedCycle ?? renewal?.billingCycle ?? 'monthly';
  // True once the owner has actually chosen something different from their
  // current arrangement — the amount then has to be re-priced server-side.
  const isSwitching =
    !!renewal && (effectiveSlug !== renewal.planSlug || effectiveCycle !== renewal.billingCycle);

  const { data: switchPreview } = useQuery({
    queryKey: ['pricingPreview', effectiveSlug, effectiveCycle],
    queryFn: () => previewPricing({ planSlug: effectiveSlug ?? undefined, billingCycle: effectiveCycle }),
    enabled: isSwitching && !!effectiveSlug,
    staleTime: 30_000,
  });

  // Never trust a client-side total: the amount charged is always the
  // server's, whether that's the standing renewal or a fresh preview.
  const payAmount = isSwitching ? switchPreview?.data.amountDue ?? 0 : renewal?.amountDue ?? 0;
  const payCurrency = (isSwitching ? switchPreview?.data.currency : renewal?.currency) ?? 'KES';
  const meta = STATE_META[state];
  const StateIcon = meta.icon;

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
        <p className="text-gray-500 text-sm mt-1">Manage your Dukana plan and billing</p>
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
            <p className="text-sm text-red-800 mt-0.5">Your subscription and grace period have ended. Pay below to pick up right where you left off — all your data is safe.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: meta.bg }}>
            <StateIcon className="w-3.5 h-3.5" style={{ color: meta.fg }} />
            <span className="text-xs font-bold" style={{ color: meta.fg }}>{meta.label}</span>
          </div>
          {access?.cancelled && <span className="text-xs text-gray-400">Cancelled — active until period end</span>}
        </div>

        <h2 className="text-xl font-extrabold" style={{ color: '#0F172A' }}>{plan?.name ? `${plan.name} plan` : 'Dukana'}</h2>
        {!!plan?.tagline && <p className="text-sm text-gray-500 mt-0.5">{plan.tagline}</p>}

        <div className="h-px bg-gray-100 my-4" />

        {state === 'trialing' && (
          <InfoRow icon={Clock} label="Trial ends" value={`${expiresAt} · ${access?.daysLeft} day${access?.daysLeft === 1 ? '' : 's'} left`} />
        )}
        {state === 'active' && (
          <InfoRow icon={RefreshCw} label={access?.cancelled ? 'Access until' : 'Renews'} value={expiresAt ?? '—'} />
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
            label={renewal.billingCycle === 'yearly' ? 'Yearly price' : 'Monthly price'}
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
            <p className="text-sm text-gray-500 mb-4">Your free trial is waiting. Activate it now — no payment needed to start.</p>
            <Button onClick={startTrial} loading={working} className="w-full">Activate free trial</Button>
          </>
        )}

        {canPay && (
          <>
            <Button onClick={() => setPayOpen(true)} className="w-full">
              {state === 'active'
                ? `Extend now · ${fmt(payAmount, payCurrency)}`
                : `Pay with M-Pesa · ${fmt(payAmount, payCurrency)}`}
            </Button>
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
                Switching to <strong style={{ color: '#0F172A' }}>{effectiveSlug}</strong> ({effectiveCycle}) —{' '}
                {switchPreview ? fmt(payAmount, payCurrency) : 'pricing…'}
              </p>
              <Button
                onClick={() => setPayOpen(true)}
                disabled={!switchPreview}
                className="w-full sm:w-auto"
              >
                Pay &amp; switch
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
        isOpen={payOpen}
        amount={payAmount}
        currency={payCurrency}
        billingCycle={effectiveCycle}
        planSlug={effectiveSlug ?? undefined}
        defaultPhone={user?.shop?.phone}
        onClose={() => setPayOpen(false)}
        onSuccess={() => {
          setPayOpen(false);
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
