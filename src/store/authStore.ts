import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';

export interface Shop {
  _id: string;
  name: string;
  phone?: string;
  /** Absent until the shop has been through setup — the onboarding signal. */
  country?: string;
  currency?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
  shop: Shop;
  /** Staff-only granular permissions; owners implicitly hold all of them */
  permissions?: string[];
}

/**
 * Why the session ended, when it ended on its own rather than by the user
 * clicking Sign Out. Set by the API layer once a token refresh has failed;
 * `SessionExpiredHandler` turns it into a redirect carrying an explanation.
 * 'revoked_elsewhere' means someone signed into this staff account on another
 * device — the backend allows staff only one device at a time.
 */
export type SessionExpiredReason = 'expired' | 'revoked_elsewhere';

// localStorage keys. 'token' and 'user' keep their original names so sessions
// predating refresh-token support survive the upgrade rather than being
// silently logged out on deploy.
export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_KEY = 'user';

interface AuthState {
  user: User | null;
  token: string | null;
  /**
   * Rotating 30-day refresh token, exchanged at POST /auth/refresh whenever
   * the 1-hour access token expires.
   *
   * It lives in localStorage, which means XSS can read it. There is no
   * httpOnly alternative available here: the backend accepts the refresh
   * token as a JSON body field rather than a cookie, and this change
   * deliberately doesn't touch the backend. Worth revisiting if the API ever
   * grows a cookie-based session.
   */
  refreshToken: string | null;
  isAuthenticated: boolean;
  sessionExpiredReason: SessionExpiredReason | null;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  hydrate: () => void;
  /** Persist a freshly rotated token pair. Storage first, then state. */
  setTokens: (token: string, refreshToken: string) => void;
  setSessionExpired: (reason: SessionExpiredReason) => void;
  clearSessionExpired: () => void;
  /** Re-read localStorage after another tab changed it. */
  syncFromStorage: () => void;
}

function readUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Tell the server to revoke this refresh token so it can't outlive the
 * sign-out. Best-effort and deliberately un-awaited — the local session is
 * already gone either way, and a flaky network shouldn't stall the redirect.
 *
 * Raw axios, not @/lib/api: that module imports this one, and the endpoint is
 * unauthenticated anyway.
 */
function revokeRefreshToken(refreshToken: string | null) {
  if (!refreshToken) return;
  axios
    .post(`${API_BASE_URL}/auth/logout`, { refreshToken }, { timeout: 8000 })
    .catch(() => {});
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  sessionExpiredReason: null,

  // refreshToken is optional because the profile screens call login() purely
  // to refresh the cached user object after PUT /auth/profile. Omitting it
  // has to keep the existing one rather than wipe the session.
  login: (user, token, refreshToken) => {
    const nextRefresh = refreshToken ?? get().refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (nextRefresh) localStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh);
    }
    set({ user, token, refreshToken: nextRefresh, isAuthenticated: true, sessionExpiredReason: null });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      revokeRefreshToken(get().refreshToken);
      clearStoredSession();
    }
    // React Query's cache otherwise survives logout untouched (it's an
    // in-memory singleton, not tied to auth state) — on a shared device the
    // next person to log in could see the previous owner/staff's cached shop
    // config, sales, everything, until each query happens to go stale and
    // refetch on its own. Clearing it here, in the one action every logout
    // path (Sidebar, SessionExpiredHandler, ...) funnels through, means no
    // call site can forget it.
    queryClient.clear();
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, sessionExpiredReason: null });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(TOKEN_KEY);
    const user = readUser();
    if (token && user) {
      set({ user, token, refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY), isAuthenticated: true });
    } else {
      // A half-written session (one key present, the other not) is unusable.
      clearStoredSession();
    }
  },

  // Called from the refresh path. localStorage.setItem is synchronous, so by
  // the time this returns the new refresh token is durable — which matters
  // because the server has already revoked the old one (rotation is atomic).
  // Replaying a spent refresh token trips the backend's reuse-detection and
  // revokes every session on the account.
  setTokens: (token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    set({ token, refreshToken });
  },

  setSessionExpired: (reason) => set({ sessionExpiredReason: reason }),
  clearSessionExpired: () => set({ sessionExpiredReason: null }),

  // Another tab wrote to localStorage. Mirror it here so a login or logout in
  // one tab doesn't leave the others showing a stale session.
  syncFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(TOKEN_KEY);
    const user = readUser();
    if (token && user) {
      set({ user, token, refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY), isAuthenticated: true });
    } else if (get().isAuthenticated) {
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    }
  },
}));
