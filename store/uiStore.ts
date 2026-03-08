import { create } from 'zustand'

export interface UIState {
  sidebarOpen: boolean
  showFriendsPanel: boolean
  showAddFriendModal: boolean
  showUserProfile: boolean
  selectedUserId: string | null
  searchQuery: string
  showContextMenu: boolean
  contextMenuPosition: { x: number; y: number } | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleFriendsPanel: () => void
  setShowFriendsPanel: (show: boolean) => void
  setShowAddFriendModal: (show: boolean) => void
  toggleUserProfile: () => void
  setShowUserProfile: (show: boolean) => void
  setSelectedUserId: (userId: string | null) => void
  setSearchQuery: (query: string) => void
  showContextMenuAt: (x: number, y: number) => void
  hideContextMenu: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  showFriendsPanel: false,
  showAddFriendModal: false,
  showUserProfile: false,
  selectedUserId: null,
  searchQuery: '',
  showContextMenu: false,
  contextMenuPosition: null,
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleFriendsPanel: () =>
    set((state) => ({ showFriendsPanel: !state.showFriendsPanel })),
  setShowFriendsPanel: (show) => set({ showFriendsPanel: show }),
  setShowAddFriendModal: (show) => set({ showAddFriendModal: show }),
  toggleUserProfile: () =>
    set((state) => ({ showUserProfile: !state.showUserProfile })),
  setShowUserProfile: (show) => set({ showUserProfile: show }),
  setSelectedUserId: (userId) => set({ selectedUserId: userId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  showContextMenuAt: (x, y) =>
    set({ showContextMenu: true, contextMenuPosition: { x, y } }),
  hideContextMenu: () => set({ showContextMenu: false, contextMenuPosition: null }),
}))
