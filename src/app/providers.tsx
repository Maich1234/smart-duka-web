'use client';

import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { REFRESH_TOKEN_KEY, TOKEN_KEY, USER_KEY, useAuthStore } from '@/store/authStore';

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
