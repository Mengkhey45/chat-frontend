import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  status?: 'online' | 'away' | 'offline'
  publicKey?: string
  createdAt?: string
  profile?: {
    firstName?: string
    lastName?: string
    bio?: string
  }
}

export interface AuthState {
  user: User | null
  /**
   * Short-lived access token, held in memory ONLY.
   *
   * It used to live in localStorage, where any injected script could read it —
   * and it was valid for 7 days with no way to revoke it. The durable half of
   * the session is now an httpOnly refresh cookie that JavaScript cannot touch;
   * this token is re-minted from it on page load and when it expires.
   */
  token: string | null
  isLoading: boolean
  error: string | null
  /** True once the persisted user has been read back and the session checked. */
  _hasHydrated: boolean
  _sessionChecked: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHasHydrated: (state: boolean) => void
  setSessionChecked: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      _sessionChecked: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, _sessionChecked: true }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setSessionChecked: (state) => set({ _sessionChecked: state }),
    }),
    {
      name: 'auth-storage',
      // Only the user profile is persisted, for an instant first paint. The
      // token is deliberately excluded — persisting it is the thing we're fixing.
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
