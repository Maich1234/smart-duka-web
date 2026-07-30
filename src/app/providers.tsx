'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { REFRESH_TOKEN_KEY, TOKEN_KEY, USER_KEY, useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
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

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const syncFromStorage = useAuthStore((s) => s.syncFromStorage);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Keep tabs in step. Signing out in one tab, or a token rotation performed
  // by whichever tab won the refresh lock, should be reflected everywhere
  // rather than leaving other tabs holding a token that no longer works.
  // A null key means localStorage.clear() — treat it as "something changed".
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === TOKEN_KEY ||
        event.key === REFRESH_TOKEN_KEY ||
        event.key === USER_KEY
      ) {
        syncFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncFromStorage]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
    </QueryClientProvider>
  );
}
