import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'away' | 'offline'
  createdAt: string
  profile?: {
    firstName?: string
    lastName?: string
    bio?: string
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
