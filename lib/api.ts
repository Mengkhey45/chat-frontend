import axios from 'axios';

// Get the API URL from environment variable or fallback to localhost
// On Vercel, this should be your Railway Gateway URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';

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
