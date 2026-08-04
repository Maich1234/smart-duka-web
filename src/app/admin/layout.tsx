'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Spinner from '@/components/ui/Spinner';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hydrate, adminUser } = useAdminAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }
    if (isAuthenticated && pathname.startsWith('/admin/admins') && adminUser?.role !== 'super_admin') {
      router.push('/admin/plans');
    }
  }, [mounted, isAuthenticated, pathname, adminUser, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="min-h-screen flex flex-col lg:ml-64">
        <header className="h-16 flex items-center px-4 border-b border-gray-100 bg-white lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 font-bold" style={{ color: '#0F172A' }}>Dukana Admin</span>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
