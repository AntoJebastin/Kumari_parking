import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
const isBrowserProd =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

const API_BASE_URL =
  isBrowserProd && (!rawApiUrl || rawApiUrl.includes('localhost') || rawApiUrl.includes('127.0.0.1'))
    ? '/api'
    : rawApiUrl || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attaches Supabase access token when available (Phase 5+)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kumari_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalizes API error structure
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      'Something went wrong. Please try again.';
    return Promise.reject({
      status: error?.response?.status || 500,
      message,
      raw: error,
    });
  }
);

export default api;
