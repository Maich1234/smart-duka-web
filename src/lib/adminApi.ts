import axios from 'axios';
import { API_BASE_URL } from './config';

// A second axios instance, deliberately not shared with src/lib/api.ts — its
// own interceptor reads the admin token (never the shop token) and its own
// 401 handler redirects to /admin/login (never /login), so the two auth
// flows can never leak into each other client-side.
//
// Only the host is shared. Hardcoding it here meant pointing the app at a
// staging backend left the admin console still talking to production.
// See lib/api.ts for why this needs an explicit timeout: without one, a
// request against a dead connection hangs forever instead of failing.
const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
