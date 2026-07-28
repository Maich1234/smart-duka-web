'use client';

import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getUnreadCount } from '@/services/notifications';

interface HeaderProps {
  title?: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const user = useAuthStore((s) => s.user);

  // The badge used to be a hardcoded dot on a button that did nothing. It now
  // reflects the real unread count and links to the inbox.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  const inboxHref = user?.role === 'staff' ? '/staff/notifications' : '/owner/notifications';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && <h1 className="text-lg font-bold" style={{ color: '#0F172A' }}>{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={inboxHref}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ backgroundColor: '#C8932A' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#0F766E' }}>
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none" style={{ color: '#0F172A' }}>{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
