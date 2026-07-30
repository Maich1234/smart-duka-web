import { useAuthStore } from '@/store/authStore';

/**
 * Staff permission checks, mirroring utils/permissions.ts in the mobile app
 * and src/constants/permissions.js on the backend.
 *
 * This is UX, not a security boundary — the server checks the same
 * permissions inside every controller. The point here is to avoid offering
 * people buttons that will only 403 them.
 */

export type PermissionUser = { role: 'owner' | 'staff'; permissions?: string[] } | null | undefined;

/**
 * Owners implicitly hold every permission: the backend's User pre-save hook
 * force-sets an owner's permissions to ALL_PERMISSIONS, so the frontend has
 * to mirror that bypass rather than trusting the array.
 */
export const hasPermission = (user: PermissionUser, permission: string): boolean => {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return !!user.permissions?.includes(permission);
};

/** True when the user holds at least one of the listed permissions. */
export const hasAnyPermission = (user: PermissionUser, permissions: string[]): boolean =>
  permissions.some((permission) => hasPermission(user, permission));

export const usePermission = (permission: string): boolean => {
  const user = useAuthStore((s) => s.user);
  return hasPermission(user, permission);
};

/**
 * Route prefixes that need a permission, longest-match wins. Both the sidebar
 * and the dashboard layout read this, so a link and the page behind it can
 * never disagree about who may see it.
 *
 * Only list routes that a staff member could otherwise reach. Owner-only
 * areas are already handled by the role check in the dashboard layout.
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/staff/inventory': ['view_products'],
  '/staff/expenses': ['manage_expenses'],
  '/staff/sales': ['record_sale', 'view_sales'],
  '/owner/purchases': ['view_purchases'],
};

/**
 * The permissions required for a path, or null when it's unrestricted.
 * Holding any one of the returned permissions is enough.
 */
export const permissionsForRoute = (pathname: string): string[] | null => {
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_PERMISSIONS[match] : null;
};

export const canAccessRoute = (user: PermissionUser, pathname: string): boolean => {
  const required = permissionsForRoute(pathname);
  if (!required) return true;
  return hasAnyPermission(user, required);
};
