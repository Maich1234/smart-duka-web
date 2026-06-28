'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  Receipt,
  User,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const ownerLinks = [
  { href: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/owner/inventory', icon: Package, label: 'Inventory' },
  { href: '/owner/sales', icon: ShoppingCart, label: 'Sales' },
  { href: '/owner/staff', icon: Users, label: 'Staff' },
  { href: '/owner/reports', icon: BarChart3, label: 'Reports' },
  { href: '/owner/expenses', icon: Receipt, label: 'Expenses' },
  { href: '/owner/payments', icon: CreditCard, label: 'M-Pesa' },
  { href: '/owner/profile', icon: User, label: 'Profile' },
];

const staffLinks = [
  { href: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/staff/inventory', icon: Package, label: 'Products' },
  { href: '/staff/sales', icon: ShoppingCart, label: 'New Sale' },
  { href: '/staff/expenses', icon: Receipt, label: 'Expenses' },
  { href: '/staff/profile', icon: User, label: 'Profile' },
];

function SidebarContent({
  collapsed,
  onToggle,
  onLinkClick,
  showCloseButton,
  onClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onLinkClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const links = user?.role === 'owner' ? ownerLinks : staffLinks;

  return (
    <>
      {/* Logo */}
      <div className={clsx('flex items-center h-16 border-b border-gray-100 px-4', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0F766E' }}>
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-extrabold text-lg flex-1" style={{ color: '#0F172A' }}>Smart Duka</span>
        )}
        {showCloseButton && (
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={clsx(
                'flex items-center gap-3 rounded-xl transition-all duration-150',
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                active
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              style={active ? { backgroundColor: '#0F766E' } : {}}
              title={collapsed ? label : undefined}
            >
              <Icon className={clsx('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-semibold truncate" style={{ color: '#0F172A' }}>{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.shop?.name}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={clsx(
            'w-full flex items-center gap-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-150',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          )}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className={clsx('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggle}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
      </button>
    </>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-72 flex flex-col border-r border-gray-100 z-50 transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'white' }}
      >
        <SidebarContent
          collapsed={false}
          onToggle={onToggle}
          onLinkClick={onMobileClose}
          showCloseButton
          onClose={onMobileClose}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex fixed left-0 top-0 h-screen flex-col border-r border-gray-100 transition-all duration-300 z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
        style={{ backgroundColor: 'white' }}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </aside>
    </>
  );
}
