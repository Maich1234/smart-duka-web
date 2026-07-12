import axios from 'axios';

// A second axios instance, deliberately not shared with src/lib/api.ts — its
// own interceptor reads the admin token (never the shop token) and its own
// 401 handler redirects to /admin/login (never /login), so the two auth
// flows can never leak into each other client-side.
const adminApi = axios.create({
  baseURL: 'https://smart-duka-backend-iota.vercel.app/api/v1/admin',
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
