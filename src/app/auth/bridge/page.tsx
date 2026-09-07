'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore, TOKEN_KEY, type User } from '@/store/authStore';
import Spinner from '@/components/ui/Spinner';

/**
 * Consumes a one-time impersonation token minted by an admin's "Login as"
 * action (dukana-admin-web) and signs this browser tab in as that shop
 * owner/staff, no password. The token travels in the URL fragment (never
 * sent to a server or written to access logs) rather than a query param.
 */
export default function AuthBridgePage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setImpersonating = useAuthStore((s) => s.setImpersonating);
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const token = new URLSearchParams(hash).get('token');
    // Strip the token from the URL bar immediately so it doesn't linger in
    // browser history, regardless of how this turns out.
    window.history.replaceState(null, '', window.location.pathname);

    if (!token) {
      setError('Missing or invalid session link.');
      return;
    }

    (async () => {
      try {
        // The request interceptor in lib/api.ts reads the token from
        // localStorage, so it has to land there before this call.
        localStorage.setItem(TOKEN_KEY, token);
        const res = await api.get('/auth/profile');
        const user = res.data.data as User;
        login(user, token);
        setImpersonating(true);
        router.replace(user.role === 'owner' ? '/owner/dashboard' : '/staff/dashboard');
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setError('This session link has expired or is invalid. Start a new one from the admin panel.');
      }
    })();
  }, [login, setImpersonating, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8FAFC' }}>
      {error ? (
        <div className="max-w-sm text-center">
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">{error}</p>
        </div>
      ) : (
        <Spinner size="lg" />
      )}
    </div>
  );
}
