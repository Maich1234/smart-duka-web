'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import JourneyProgress from '@/components/onboarding/JourneyProgress';
import ChoiceGrid from '@/components/onboarding/ChoiceGrid';
import {
  BUSINESS_TYPES, PAYMENT_METHOD_OPTIONS, PRODUCT_RANGES, STRUGGLES,
} from '@/lib/onboardingContent';
import { useOnboardingStore, type BusinessType, type ProductRange } from '@/store/onboardingStore';
import { useInvalidateShop } from '@/hooks/useShop';
import { updateShopConfig } from '@/services/shop';
import { DEFAULT_SALE_METHODS, SUGGESTED_SALE_METHODS } from '@/lib/paymentMethods';

/**
 * A few questions that change what the shop starts with.
 *
 * Only the payment answer has a real effect — it seeds the till's buttons, so
 * a shop that takes Airtel Money can sell on day one without visiting
 * settings. The rest is remembered locally to tailor copy; asking questions
 * and doing nothing with the answers is worse than not asking.
 */
export default function OnboardingPersonalizePage() {
  const router = useRouter();
  const invalidateShop = useInvalidateShop();
  const { setAnswers } = useOnboardingStore();

  const [businessType, setBusinessType] = useState<string[]>([]);
  const [productRange, setProductRange] = useState<string[]>([]);
  const [payments, setPayments] = useState<string[]>(['cash', 'mpesa']);
  const [struggles, setStruggles] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () => {
      // Turn the answers into till buttons, keeping Cash and M-PESA's
      // canonical keys so the STK path still recognises M-Pesa.
      const known = [...DEFAULT_SALE_METHODS, ...SUGGESTED_SALE_METHODS];
      const chosen = payments
        .map((value) => known.find((m) => m.key === value || m.key === `${value}_money`))
        .filter((m): m is NonNullable<typeof m> => !!m)
        .map((m, i) => ({ ...m, enabled: true, order: i }));

      return updateShopConfig({
        paymentMethods: chosen.length > 0 ? chosen : DEFAULT_SALE_METHODS,
      });
    },
    // Never block the journey on this: the shop already works with the
    // defaults, and the buttons are editable in settings either way.
    onSettled: () => {
      setAnswers({
        businessType: (businessType[0] as BusinessType) ?? null,
        productRange: (productRange[0] as ProductRange) ?? null,
        paymentMethods: payments,
        struggles,
      });
      invalidateShop();
      router.push('/onboarding/activate');
    },
  });

  return (
    <>
      <JourneyProgress step={1} />
      <Card>
        <h1 className="text-xl font-extrabold mb-1" style={{ color: '#0F172A' }}>A few quick questions</h1>
        <p className="text-sm text-gray-500 mb-6">
          So Dukana starts out set up the way you actually trade.
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>What kind of business?</h2>
            <ChoiceGrid choices={BUSINESS_TYPES} selected={businessType} onChange={setBusinessType} />
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>How many products do you sell?</h2>
            <ChoiceGrid choices={PRODUCT_RANGES} selected={productRange} onChange={setProductRange} />
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-1" style={{ color: '#0F172A' }}>How do customers pay you?</h2>
            <p className="text-xs text-gray-500 mb-2">These become the buttons on your till.</p>
            <ChoiceGrid choices={PAYMENT_METHOD_OPTIONS} selected={payments} multi onChange={setPayments} />
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#0F172A' }}>What&apos;s hardest right now?</h2>
            <ChoiceGrid choices={STRUGGLES} selected={struggles} multi onChange={setStruggles} />
          </section>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.push('/onboarding/activate')}>Skip</Button>
            <Button className="flex-1" loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Continue
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
