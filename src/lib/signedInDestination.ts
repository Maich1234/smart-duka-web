import { hasCompletedOnboarding } from '@/store/onboardingStore';
import type { User } from '@/store/authStore';

export function signedInDestination(user: User) {
  if (user.role !== 'owner') return '/staff/dashboard';
  return !hasCompletedOnboarding() && !user.shop?.country
    ? '/onboarding/setup'
    : '/owner/dashboard';
}
