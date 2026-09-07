'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Shown only inside a session opened via /auth/bridge (an admin's "Login as"
 * action) — feedback for the admin driving this tab, not a notice to the
 * real account owner, who never sees this browser.
 */
export default function ImpersonationBanner() {
  const router = useRouter();
  const isImpersonating = useAuthStore((s) => s.isImpersonating);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!isImpersonating) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: '#B45309' }}
    >
      <span>Admin support session — viewing as {user?.name ?? 'this account'}</span>
      <button
        onClick={() => { logout(); router.replace('/login'); }}
        className="underline font-semibold"
      >
        Exit
      </button>
    </div>
  );
}
