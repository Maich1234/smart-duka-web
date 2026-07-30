'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import JourneyProgress from '@/components/onboarding/JourneyProgress';
import { activateTrial, getPlans } from '@/services/subscription';
import { useInvalidateSubscription } from '@/hooks/useSubscription';
import { useOnboardingStore } from '@/store/onboardingStore';

const PERKS = [
  'Sell on any device, with receipts customers can verify',
  'Stock counts that update themselves as you sell',
  'Staff accounts with only the access you grant',
  'Reports that show what actually made money',
];

/**
 * Start the free trial.
 *
 * Deliberately never blocks: if activation fails the owner still lands on
 * the dashboard, where the trial banner re-offers it. Being stuck on a
 * paywall you never chose is a worse first impression than a missing trial.
 */
export default function OnboardingActivatePage() {
  const router = useRouter();
  const invalidateSubscription = useInvalidateSubscription();
  const complete = useOnboardingStore((s) => s.complete);
  const [error, setError] = useState('');

  const { data: plans, isLoading } = useQuery({ queryKey: ['plans'], queryFn: getPlans });
  const trialDays = plans?.data?.trialDays ?? 30;

  const finish = () => {
    complete();
    invalidateSubscription();
    router.replace('/owner/dashboard');
  };

  const mutation = useMutation({
    mutationFn: () => activateTrial(),
    onSuccess: finish,
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Could not start the trial — you can start it from your dashboard.');
    },
  });

  return (
    <>
      <JourneyProgress step={2} />
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold mb-1" style={{ color: '#0F172A' }}>
              Your shop is ready
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Try everything free for {trialDays} days. Nothing is charged now, and there&apos;s no card
              to enter.
            </p>

            <ul className="space-y-2.5 mb-6">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#15803D' }} />
                  <span className="text-sm text-gray-600">{perk}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                {error}
              </div>
            )}

            <Button className="w-full" loading={mutation.isPending} onClick={() => { setError(''); mutation.mutate(); }}>
              Start my {trialDays}-day free trial
            </Button>
            <button
              onClick={finish}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </>
        )}
      </Card>
    </>
  );
}
