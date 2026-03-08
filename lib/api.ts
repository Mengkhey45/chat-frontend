import axios from 'axios';

// When deployed, we use relative paths so Vercel handles the proxying via rewrites
// This solves all CORS issues completely.
export const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
