'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';

/**
 * Entry point. Everything real happens in the steps; this just forwards to
 * the first one so /onboarding stays a stable link.
 *
 * This used to be a four-slide feature tour that nothing linked to — it told
 * owners what the app does without ever setting their shop up.
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/setup');
  }, [router]);

  return (
    <div className="flex justify-center py-16">
      <Spinner size="lg" />
    </div>
  );
}
