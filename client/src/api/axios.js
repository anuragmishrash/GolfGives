import axios from 'axios';
import { supabase } from '../lib/supabase';

const rawEnvUrl = import.meta.env.VITE_API_URL;
const envUrl = rawEnvUrl ? rawEnvUrl.replace(/\/$/, '') : '';
const customBaseURL = envUrl ? (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`) : '/api';

const api = axios.create({
  baseURL: customBaseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Request interceptor: attach access token ────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let the frontend components catch and format the error
    return Promise.reject(error);
  }
);

export default api;
