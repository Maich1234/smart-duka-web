'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Package,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Clock,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '@/services/notifications';

const TYPE_META: Record<string, { icon: LucideIcon; label: string }> = {
  depletion_alert: { icon: Package, label: 'Stock alert' },
  daily_sales_anomaly: { icon: TrendingUp, label: 'Sales alert' },
  daily_summary: { icon: BarChart3, label: 'Daily summary' },
  subscription_reminder: { icon: ShieldCheck, label: 'Subscription' },
  shift_closed: { icon: Clock, label: 'Shift' },
  campaign: { icon: Megaphone, label: 'Announcement' },
  general: { icon: Bell, label: 'Notification' },
};

const metaFor = (type: string) => TYPE_META[type] ?? TYPE_META.general;

/**
 * In-app notification inbox, shared by the owner and staff routes. Rows clamp
 * the body to two lines to stay scannable, so opening one is what shows the
 * full text — marking it read is a side-effect of having opened it, not the
 * whole action.
 */
export default function NotificationsInbox() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications({ page, limit: 20 }),
  });

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });

  const open = (item: AppNotification) => {
    setSelected(item);
    if (!item.read) markReadMutation.mutate(item._id);
  };

  const unreadCount = items.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-sm font-semibold hover:underline disabled:opacity-50"
            style={{ color: '#0F766E' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3">
          <Bell className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400">Alerts and updates will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const { icon: Icon, label } = metaFor(item.type);
            return (
              <button
                key={item._id}
                onClick={() => open(item)}
                className={clsx(
                  'w-full text-left flex gap-3 p-4 rounded-2xl border transition-colors',
                  item.read
                    ? 'bg-white border-gray-100 hover:bg-gray-50'
                    : 'border-teal-100 hover:bg-teal-100/40'
                )}
                style={item.read ? {} : { backgroundColor: '#E6F4F2' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.read ? '#F1F5F9' : 'white' }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.read ? '#94A3B8' : '#0F766E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={clsx('text-sm truncate', item.read ? 'font-medium text-gray-600' : 'font-bold')}
                      style={item.read ? {} : { color: '#0F172A' }}
                    >
                      {item.title}
                    </p>
                    {!item.read && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#0F766E' }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.body}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {label} · {format(new Date(item.createdAt), 'd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#E6F4F2' }}
              >
                {(() => {
                  const { icon: Icon } = metaFor(selected.type);
                  return <Icon className="w-5 h-5" style={{ color: '#0F766E' }} />;
                })()}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#0F766E' }}>
                  {metaFor(selected.type).label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(selected.createdAt), 'd MMM yyyy, HH:mm')}
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold" style={{ color: '#0F172A' }}>
              {selected.title}
            </h2>
            {/* Full text, unclamped — this is the only place a long campaign
                message or daily summary can be read end to end. */}
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{selected.body}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
