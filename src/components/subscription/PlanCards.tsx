'use client';

import { Check, Sparkles } from 'lucide-react';
import type { BillingCycle, SubscriptionPlan } from '@/services/subscription';

interface PlanCardsProps {
  plans: SubscriptionPlan[];
  staffCount: number;
  currency: string;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

const fmt = (amount: number, currency: string) => `${currency} ${amount.toLocaleString()}`;

/**
 * Plan chooser, ported from the mobile app.
 *
 * The web app is now the only place a subscription can be bought — the mobile
 * app carries no pricing or purchase surface at all, to stay inside Google
 * Play's payments policy. So plan comparison, the monthly/yearly toggle, and
 * plan switching all have to work properly here or owners simply cannot
 * choose or change a plan anywhere.
 *
 * Prices are always the server's, computed for this shop's real head-count.
 */
export default function PlanCards({
  plans,
  staffCount,
  currency,
  billingCycle,
  onBillingCycleChange,
  selectedSlug,
  onSelect,
}: PlanCardsProps) {
  return (
    <div>
      {/* Billing cycle toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 rounded-xl bg-gray-100" role="tablist" aria-label="Billing cycle">
          {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              role="tab"
              aria-selected={billingCycle === cycle}
              onClick={() => onBillingCycleChange(cycle)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                billingCycle === cycle ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={billingCycle === cycle ? { color: '#0F766E' } : undefined}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && (
                <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#E6F4F2', color: '#0F766E' }}>
                  Save
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const isSelected = selectedSlug === plan.slug;
          const total = billingCycle === 'yearly' ? plan.pricing.yearlyTotal : plan.pricing.monthlyTotal;
          const savings = plan.pricing.yearlySavings;

          return (
            <button
              key={plan.slug}
              onClick={() => onSelect(plan.slug)}
              aria-pressed={isSelected}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                isSelected ? 'shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
              style={isSelected ? { borderColor: '#0F766E', backgroundColor: '#F0FDFA' } : { backgroundColor: '#FFFFFF' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: '#0F172A' }}>{plan.name}</h3>
                  {plan.tagline && <p className="text-sm text-gray-500">{plan.tagline}</p>}
                </div>
                {plan.badge && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: '#FBF1DD', color: '#9C6F1E' }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="mb-1">
                <span className="text-2xl font-extrabold" style={{ color: '#0F172A' }}>{fmt(total, currency)}</span>
                <span className="text-sm text-gray-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                For {staffCount} {staffCount === 1 ? 'person' : 'people'}
                {plan.billingType === 'flat' ? ` · up to ${plan.maxStaff} included` : ' · per person'}
              </p>
              {billingCycle === 'yearly' && savings > 0 && (
                <p className="text-xs font-semibold mb-2" style={{ color: '#15803D' }}>
                  Save {fmt(savings, currency)} a year
                </p>
              )}
              {plan.priceComparison && (
                <p className="text-xs text-gray-400 italic mb-3">{plan.priceComparison}</p>
              )}

              <ul className="space-y-1.5 mt-3">
                {plan.highlights.slice(0, 6).map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm" style={{ color: '#334155' }}>
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
