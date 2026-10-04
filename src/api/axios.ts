import axios from 'axios';
import qs from 'qs';

const TOKEN_KEY = 'fieldops_token';
const USER_KEY  = 'fieldops_user';
const rawApiUrl = import.meta.env.VITE_API_URL;
const normalizedApiUrl =
  typeof rawApiUrl === 'string' && rawApiUrl.trim().length > 0
    ? rawApiUrl.replace(/\/+$/, '')
    : '';

const api = axios.create({
  baseURL:         `${normalizedApiUrl}/api`,
  timeout:         30000,
  withCredentials: true,
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from /auth/* means bad credentials, not an expired session —
    // let the login form show the error instead of reloading the page.
    const isAuthRequest = String(error.config?.url ?? '').startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
export { api };
