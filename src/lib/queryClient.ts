import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

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
      // Don't burn retries on an authorization problem. By the time a 401
      // reaches here it has already been through the refresh-and-replay path
      // in lib/api.ts, so retrying only fires a second doomed request — and a
      // 403 won't change on its own either.
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 1;
      },
    },
  },
});
