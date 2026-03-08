import { create } from 'zustand'

export interface UserPresence {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: string
}

export interface PresenceState {
  onlineUsers: Record<string, UserPresence>
  setUserStatus: (userId: string, status: 'online' | 'away' | 'offline') => void
  setOnlineUsers: (users: Record<string, UserPresence>) => void
  removeUser: (userId: string) => void
  getOnlineCount: () => number
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: {},
  setUserStatus: (userId, status) =>
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: {
          userId,
          status,
          lastSeen: new Date().toISOString(),
        },
      },
    })),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  removeUser: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.onlineUsers
      return { onlineUsers: rest }
    }),
  getOnlineCount: () => {
    const state = get()
    return Object.values(state.onlineUsers).filter(
      (u) => u.status === 'online'
    ).length
  },
}))
