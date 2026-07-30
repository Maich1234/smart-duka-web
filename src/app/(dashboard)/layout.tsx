'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSubscription } from '@/hooks/useSubscription';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import Spinner from '@/components/ui/Spinner';
import SessionExpiredHandler from '@/components/auth/SessionExpiredHandler';
import NoAccessPanel from '@/components/dashboard/NoAccessPanel';
import { canAccessRoute } from '@/lib/permissions';
import clsx from 'clsx';

/**
 * Owner-prefixed routes that permitted staff may also open.
 *
 * Purchasing is mounted once, under /owner, rather than mirrored under both
 * roles the way the mobile app does it — one route tree is less to keep in
 * sync. Access is decided by permission (see ROUTE_PERMISSIONS), not by the
 * URL prefix.
 */
const STAFF_REACHABLE_OWNER_ROUTES = ['/owner/purchases'];

const isStaffReachable = (pathname: string) =>
  STAFF_REACHABLE_OWNER_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { access } = useSubscription();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role === 'staff' && pathname.startsWith('/owner') && !isStaffReachable(pathname)) {
      router.push('/staff/dashboard');
      return;
    } else if (user?.role === 'owner' && pathname.startsWith('/staff')) {
      router.push('/owner/dashboard');
      return;
    }

    // Subscription + grace period exhausted → every owner route funnels to
    // the paywall until an M-PESA payment lands, same as the mobile app's
    // owner layout. Staff aren't paywalled either, matching mobile.
    if (user?.role === 'owner' && access?.state === 'locked' && !pathname.startsWith('/owner/subscription')) {
      router.push('/owner/subscription');
    }
  }, [mounted, isAuthenticated, user, access, pathname, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <SessionExpiredHandler />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={clsx(
          'min-h-screen flex flex-col transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {canAccessRoute(user, pathname) ? (
            children
          ) : (
            <NoAccessPanel homeHref={user?.role === 'owner' ? '/owner/dashboard' : '/staff/dashboard'} />
          )}
        </main>
      </div>
    </div>
  );
}
