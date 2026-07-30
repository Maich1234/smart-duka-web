import { create } from 'zustand';

/**
 * Onboarding progress.
 *
 * There is no server-side completion flag, so this mirrors the mobile app and
 * keeps it locally. The fallback signal is the shop having no country set —
 * that's what stops a user on a new browser from being re-onboarded for a
 * shop that's already configured.
 *
 * Note POST /auth/register returns no token (email verification comes first),
 * so onboarding can't be post-register. It runs on an owner's first sign-in.
 */

export type BusinessType =
  | 'retail' | 'water' | 'agrovet' | 'electronics' | 'boutique'
  | 'pharmacy' | 'hardware' | 'supermarket' | 'restaurant' | 'other';

export type ProductRange = 'under50' | '50to200' | '200to1000' | 'over1000';

const COMPLETED_KEY = 'onboarding-completed';

interface OnboardingState {
  completed: boolean;
  businessType: BusinessType | null;
  productRange: ProductRange | null;
  paymentMethods: string[];
  struggles: string[];
  setAnswers: (patch: Partial<Omit<OnboardingState, 'setAnswers' | 'complete' | 'hydrate' | 'completed'>>) => void;
  complete: () => void;
  hydrate: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: false,
  businessType: null,
  productRange: null,
  paymentMethods: [],
  struggles: [],

  setAnswers: (patch) => set(patch),

  complete: () => {
    if (typeof window !== 'undefined') localStorage.setItem(COMPLETED_KEY, '1');
    set({ completed: true });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    set({ completed: localStorage.getItem(COMPLETED_KEY) === '1' });
  },
}));

/** Read without subscribing — for the login redirect decision. */
export const hasCompletedOnboarding = () =>
  typeof window !== 'undefined' && localStorage.getItem(COMPLETED_KEY) === '1';

export const markOnboardingCompleted = () => {
  if (typeof window !== 'undefined') localStorage.setItem(COMPLETED_KEY, '1');
};
