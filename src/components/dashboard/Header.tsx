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
  const { data: unreadCount = 0, isError: unreadError, refetch: retryUnread } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    meta: { errorHandledLocally: true },
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  const inboxHref = user?.role === 'staff' ? '/staff/notifications' : '/owner/notifications';

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && <h1 className="truncate text-base font-bold sm:text-lg" style={{ color: '#0F172A' }}>{title}</h1>}
      </div>

      <div className="flex min-w-0 items-center gap-1 sm:gap-3">
        <Link
          href={inboxHref}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={unreadError ? 'Notifications, unread count unavailable' : unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell className="w-5 h-5" />
          {!unreadError && unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ backgroundColor: '#C8932A' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {unreadError && <button type="button" onClick={() => { retryUnread(); }} className="min-h-11 max-w-20 shrink-0 text-left text-xs sm:max-w-24 text-slate-500 underline" aria-label="Unread notification count unavailable. Retry">Retry unread count</button>}
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#0F766E' }}>
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold leading-none" style={{ color: '#0F172A' }}>{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
