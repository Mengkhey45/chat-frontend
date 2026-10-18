import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'

// Requests go through Next's rewrites (see next.config.mjs), so relative paths
// keep everything same-origin and sidestep CORS entirely.
export const API_BASE_URL = ''

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  // Required for the httpOnly refresh cookie to be sent and set.
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const PUBLIC_PATHS = ['/login', '/register', '/verify', '/forgot-password', '/reset-password']
const AUTH_ENDPOINTS = ['/api/auth/signin', '/api/auth/signup', '/api/auth/refresh']

/**
 * Single-flight refresh.
 *
 * When an access token expires, several in-flight requests 401 at once. Without
 * this, each would fire its own refresh — and since refresh tokens rotate, the
 * later ones would present an already-used token and trip the reuse detection,
 * logging the user out. One shared promise means one rotation.
 */
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/api/auth/refresh', null, { _skipAuthRefresh: true } as AxiosRequestConfig)
      .then(({ data }) => {
        useAuthStore.getState().setToken(data.token)
        if (data.user) useAuthStore.getState().setUser(data.user)
        return data.token as string
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

/** Called on boot to restore a session from the refresh cookie. */
export async function bootstrapSession(): Promise<boolean> {
  const token = await refreshAccessToken()
  const store = useAuthStore.getState()
  if (!token) store.logout()
  store.setSessionChecked(true)
  return Boolean(token)
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // Even if the server call fails, drop the local session.
  }
  useAuthStore.getState().logout()
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    const url = String(original?.url ?? '')

    const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => url.startsWith(p))
    const skip = (original as any)?._skipAuthRefresh

    if (status === 401 && original && !original._retried && !isAuthEndpoint && !skip) {
      original._retried = true
      const token = await refreshAccessToken()

      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
        return api(original)
      }

      // Refresh failed: the session is genuinely over.
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined' &&
          !PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p))) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
