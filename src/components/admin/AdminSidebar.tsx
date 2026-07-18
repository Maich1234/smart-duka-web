'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Tag, Settings, Store, ScrollText, LogOut, ShieldCheck, X, Bell, Users } from 'lucide-react';
import clsx from 'clsx';
import { useAdminAuthStore, hasAdminPermission } from '@/store/adminAuthStore';

const links = [
  { href: '/admin/plans', icon: LayoutGrid, label: 'Plans', permission: 'plans' },
  { href: '/admin/promotions', icon: Tag, label: 'Promotions', permission: 'promotions' },
  { href: '/admin/push', icon: Bell, label: 'Push Notifications', permission: 'push_campaigns' },
  { href: '/admin/platform-config', icon: Settings, label: 'Platform Config', permission: 'platform_config' },
  { href: '/admin/shops', icon: Store, label: 'Shops', permission: 'shops' },
  { href: '/admin/audit', icon: ScrollText, label: 'Audit Log', permission: 'audit' },
];

function SidebarContent({ onLinkClick, onClose }: { onLinkClick?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const { adminUser, logout } = useAdminAuthStore();
  const visibleLinks = links.filter((l) => hasAdminPermission(adminUser, l.permission));

  return (
    <>
      <div className="flex items-center h-16 border-b border-gray-100 px-4 gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0F172A' }}>
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-lg flex-1" style={{ color: '#0F172A' }}>SmartDuka Admin</span>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleLinks.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                active ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              style={active ? { backgroundColor: '#0F172A' } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
        {adminUser?.role === 'super_admin' && (
          <Link
            href="/admin/admins"
            onClick={onLinkClick}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
              pathname === '/admin/admins' || pathname.startsWith('/admin/admins/')
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
            style={pathname === '/admin/admins' || pathname.startsWith('/admin/admins/') ? { backgroundColor: '#0F172A' } : {}}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Admins</span>
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-gray-100 space-y-1">
        {adminUser && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-semibold truncate" style={{ color: '#0F172A' }}>{adminUser.name}</p>
            <p className="text-xs text-gray-400 truncate">{adminUser.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );
}

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onMobileClose} />}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-72 flex flex-col border-r border-gray-100 z-50 transition-transform duration-300 lg:hidden bg-white',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onLinkClick={onMobileClose} onClose={onMobileClose} />
      </aside>

      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-gray-100 z-30 bg-white">
        <SidebarContent />
      </aside>
    </>
  );
}
