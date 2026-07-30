'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Turns "the token refresh failed" into a signed-out user who knows why.
 *
 * The API layer only records a reason on the store — it deliberately does no
 * navigation, since redirecting from inside an axios interceptor throws away
 * in-flight state and can't show an explanation. This component watches for
 * that reason and does the routing, carrying the reason to /login as a query
 * param so the message survives the store being cleared.
 *
 * Mount it once inside each authenticated shell.
 */
export default function SessionExpiredHandler() {
  const router = useRouter();
  const reason = useAuthStore((s) => s.sessionExpiredReason);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!reason) return;
    // logout() clears sessionExpiredReason too, so this effect won't re-fire.
    logout();
    router.replace(`/login?reason=${reason}`);
  }, [reason, logout, router]);

  return null;
}
