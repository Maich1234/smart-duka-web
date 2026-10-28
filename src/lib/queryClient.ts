import { QueryClient } from '@tanstack/react-query';
import { queryReadPolicy } from './queryPolicy';

/**
 * The single app-wide QueryClient instance. Lives in its own module (rather
 * than inline in providers.tsx) so authStore's logout() can import and clear
 * it without a circular dependency — providers.tsx already imports from
 * authStore.ts for auth hydration.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      ...queryReadPolicy,
    },
  },
});
