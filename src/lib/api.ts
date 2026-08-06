import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { refreshAuthToken } from './tokenRefresh';
import { TOKEN_KEY } from '@/store/authStore';

/**
 * Per-request bookkeeping the interceptors add. Both flags exist to stop a
 * retry loop: a request may be replayed at most once after a token refresh,
 * and at most MAX_EARLY_RETRIES times after an HTTP 425.
 */
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean;
  _earlyRetries?: number;
}

// Without a timeout, axios waits forever by default. A device that's
// connected but has no real internet (dead wifi, captive portal, weak
// signal) doesn't fail the request outright — it just hangs — so every page
// relying on this client would spin its loading state indefinitely instead
// of ever reaching the isError branch.
const DEFAULT_TIMEOUT_MS = 15000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Endpoints that must never trigger a token refresh. /auth/refresh would
 * recurse; the others legitimately 401 on bad credentials, and refreshing in
 * response to "wrong password" is both pointless and confusing.
 */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/logout'];

const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';
/** The backend accepts this older spelling too; don't double up on it. */
const LEGACY_IDEMPOTENCY_HEADER = 'Idempotency-Key';

const MAX_EARLY_RETRIES = 3;
const EARLY_RETRY_BASE_MS = 1500;
const STILL_PROCESSING_MESSAGE =
  "That's still being processed. Give it a moment, then check before trying again.";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    // Every write gets an idempotency key, so any retry — ours after a token
    // refresh, or the user's after a flaky connection — is deduplicated
    // server-side instead of recording a second sale. Only set it when the
    // caller hasn't supplied one under either spelling: keeping the original
    // key is what makes a replay a replay.
    const method = (config.method ?? 'get').toLowerCase();
    if (method !== 'get' && method !== 'head') {
      const existing = config.headers[IDEMPOTENCY_HEADER] ?? config.headers[LEGACY_IDEMPOTENCY_HEADER];
      if (!existing) config.headers[IDEMPOTENCY_HEADER] = newIdempotencyKey();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError): Promise<AxiosResponse> => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (!config || typeof window === 'undefined') throw error;

    // 425 Too Early: an identical request carrying this idempotency key is
    // still in flight server-side. The contract says transient — resend the
    // same key rather than surfacing it, so no page has to know 425 exists.
    if (status === 425) {
      const attempt = (config._earlyRetries ?? 0) + 1;
      if (attempt <= MAX_EARLY_RETRIES) {
        config._earlyRetries = attempt;
        await sleep(EARLY_RETRY_BASE_MS * attempt);
        return api(config);
      }
      // Out of retries. Keep the axios error shape callers read
      // (err.response.data.message) but say something a user can act on.
      if (error.response) {
        error.response.data = {
          ...(error.response.data as Record<string, unknown>),
          message: STILL_PROCESSING_MESSAGE,
        };
      }
      throw error;
    }

    const url = config.url ?? '';
    const isAuthEndpoint = NO_REFRESH_PATHS.some((path) => url.includes(path));
    const wasAuthenticated = Boolean(config.headers?.Authorization);

    if (status === 401 && wasAuthenticated && !isAuthEndpoint && !config._retriedAfterRefresh) {
      config._retriedAfterRefresh = true;

      let freshToken: string | null;
      try {
        freshToken = await refreshAuthToken();
      } catch {
        // Network failure during refresh. The session may well be fine, so
        // surface the original error and leave the user signed in.
        throw error;
      }

      // null means the server rejected the refresh token. tokenRefresh has
      // already recorded why; SessionExpiredHandler does the redirect. No
      // navigation from here — a hard redirect out of an interceptor
      // destroys in-flight state and can never explain itself.
      if (!freshToken) throw error;

      config.headers.Authorization = `Bearer ${freshToken}`;
      return api(config);
    }

    throw error;
  }
);

export default api;
