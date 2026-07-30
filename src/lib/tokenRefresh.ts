import axios from 'axios';
import { API_BASE_URL } from './config';
import { REFRESH_TOKEN_KEY, TOKEN_KEY, useAuthStore } from '@/store/authStore';

/**
 * Exchanges the stored refresh token for a fresh access token.
 *
 * Returns the new access token, or null when refresh is impossible (no
 * refresh token, or the server rejected it) — null means "this session is
 * over". Network failures reject instead: a dead connection says nothing
 * about whether the session is still valid, and logging someone out because
 * their wifi dropped is its own bug.
 *
 * Lives outside lib/api.ts and uses a raw axios call so the interceptors
 * can't recurse into it.
 *
 * ## Why this is more careful than the mobile equivalent
 *
 * The mobile app (utils/tokenRefresh.ts) guards with a single module-level
 * promise, which is enough for one process. A browser has N tabs, each with
 * its own module instance. If two tabs both notice an expired access token
 * and both POST /auth/refresh with the *same* refresh token, the backend's
 * rotateRefreshToken claims it atomically for the first caller and treats the
 * second as a replay — reuse-detection fires, revokeAllSessions runs, and the
 * user is signed out of every tab *and* their phone.
 *
 * Two things prevent that:
 *   1. A Web Lock serialises refreshes across tabs, not just within one.
 *   2. Inside the lock we re-read the stored refresh token. If it changed
 *      while we waited, another tab already rotated, so we return its access
 *      token and never make a second network call. The lock alone would only
 *      queue the replay rather than avoid it — this step is what makes it
 *      correct.
 */

const LOCK_NAME = 'sd-token-refresh';

/** Intra-tab de-duplication; the Web Lock handles inter-tab. */
let inFlight: Promise<string | null> | null = null;

function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

/** Runs `fn` under a cross-tab lock where the browser supports one. */
function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  // Safari below 15.4 has no Lock Manager. Degrading to intra-tab-only
  // matches the old behaviour rather than making anything worse.
  if (!locks?.request) return fn();
  return locks.request(LOCK_NAME, fn) as Promise<T>;
}

async function performRefresh(tokenAtEntry: string | null): Promise<string | null> {
  const current = readStored(REFRESH_TOKEN_KEY);

  if (!current) {
    // Either this session predates refresh-token support or it was cleared.
    useAuthStore.getState().setSessionExpired('expired');
    return null;
  }

  // Another tab rotated while we waited for the lock. Its result is already
  // in storage; using it avoids replaying a token the server just spent.
  if (tokenAtEntry && current !== tokenAtEntry) {
    return readStored(TOKEN_KEY);
  }

  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: current },
      { timeout: 12000, headers: { 'Content-Type': 'application/json' } }
    );

    const data = res.data?.data;
    if (!data?.token || !data?.refreshToken) {
      useAuthStore.getState().setSessionExpired('expired');
      return null;
    }

    // Write before returning and before releasing the lock. The old refresh
    // token is already dead server-side, so any window where the new one
    // isn't persisted is a window where a reload replays a spent token.
    useAuthStore.getState().setTokens(data.token, data.refreshToken);
    return data.token as string;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { code?: string } } };
    if (error.response) {
      // The server answered and said no — the session is genuinely dead.
      const code = error.response.data?.code;
      useAuthStore
        .getState()
        .setSessionExpired(code === 'SESSION_REVOKED_ELSEWHERE' ? 'revoked_elsewhere' : 'expired');
      return null;
    }
    // No response means a network problem. Surface it; the caller keeps the
    // session and can retry.
    throw err;
  }
}

export function refreshAuthToken(): Promise<string | null> {
  if (inFlight) return inFlight;

  // Captured before we queue for the lock, so performRefresh can tell whether
  // someone else rotated while we were waiting.
  const tokenAtEntry = readStored(REFRESH_TOKEN_KEY);

  inFlight = withCrossTabLock(() => performRefresh(tokenAtEntry)).finally(() => {
    inFlight = null;
  });

  return inFlight;
}
