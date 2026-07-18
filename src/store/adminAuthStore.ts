import { create } from 'zustand';

// Deliberately separate from src/store/authStore.ts and its localStorage
// keys ('token'/'user') — an admin session and a shop session must never be
// confused client-side, even by accident. The real security boundary is
// server-side (a distinct ADMIN_JWT_SECRET), this is defense in depth.
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
}

// super_admin implicitly has access to everything; `permissions` only
// matters for role === 'admin'. Centralized here (rather than inline at
// each call site) so that bypass isn't duplicated across the sidebar,
// layout guard, and every admin page.
export const hasAdminPermission = (user: AdminUser | null, key: string): boolean => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions?.includes(key) ?? false;
};

interface AdminAuthState {
  adminUser: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (adminUser: AdminUser, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  adminUser: null,
  token: null,
  isAuthenticated: false,

  login: (adminUser, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
    }
    set({ adminUser, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    }
    set({ adminUser: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const userStr = localStorage.getItem(ADMIN_USER_KEY);
      if (token && userStr) {
        try {
          const adminUser = JSON.parse(userStr) as AdminUser;
          set({ adminUser, token, isAuthenticated: true });
        } catch {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
        }
      }
    }
  },
}));
