import { create } from 'zustand'
import { User } from './authStore'

export interface FriendRequest {
  id: string
  fromUser: User
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Friend {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'away' | 'offline'
  lastSeen?: string
  addedAt: string
}

export interface FriendsState {
  friends: Friend[]
  friendRequests: FriendRequest[]
  sentRequests: FriendRequest[]
  blockedUsers: string[]
  setFriends: (friends: Friend[]) => void
  addFriend: (friend: Friend) => void
  removeFriend: (userId: string) => void
  setFriendRequests: (requests: FriendRequest[]) => void
  addFriendRequest: (request: FriendRequest) => void
  acceptFriendRequest: (requestId: string) => void
  rejectFriendRequest: (requestId: string) => void
  setSentRequests: (requests: FriendRequest[]) => void
  updateFriendStatus: (userId: string, status: 'online' | 'away' | 'offline') => void
  blockUser: (userId: string) => void
  unblockUser: (userId: string) => void
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  friendRequests: [],
  sentRequests: [],
  blockedUsers: [],
  setFriends: (friends) => set({ friends }),
  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
    })),
  removeFriend: (userId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.userId !== userId),
    })),
  setFriendRequests: (requests) => set({ friendRequests: requests }),
  addFriendRequest: (request) =>
    set((state) => ({
      friendRequests: [...state.friendRequests, request],
    })),
  acceptFriendRequest: (requestId) =>
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
    })),
  rejectFriendRequest: (requestId) =>
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
    })),
  setSentRequests: (requests) => set({ sentRequests: requests }),
  updateFriendStatus: (userId, status) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.userId === userId ? { ...f, status } : f
      ),
    })),
  blockUser: (userId) =>
    set((state) => ({
      blockedUsers: [...state.blockedUsers, userId],
    })),
  unblockUser: (userId) =>
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((id) => id !== userId),
    })),
}))
