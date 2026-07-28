import api from '@/lib/api';

// The in-app inbox — persisted server-side by every push the backend sends,
// independent of whether any device ever had push permission granted. Mirrors
// the mobile app's services/notificationInbox.ts against the same endpoints.

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  type: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsPage {
  success: boolean;
  data: AppNotification[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  unread?: boolean;
}): Promise<NotificationsPage> {
  const res = await api.get('/notifications', { params });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get('/notifications/unread-count');
  return res.data?.data?.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
