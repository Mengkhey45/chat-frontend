'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SocketProvider } from '@/components/SocketProvider'
import { ChatSidebar } from '@/components/ChatSidebar'
import { ChatHeader } from '@/components/ChatHeader'
import { MessagesArea } from '@/components/MessagesArea'
import { MessageInput } from '@/components/MessageInput'
import { FriendsPanel } from '@/components/FriendsPanel'
import { UserProfile } from '@/components/UserProfile'
import { AddFriendModal } from '@/components/AddFriendModal'
import { CallOverlay } from '@/components/CallOverlay'
import { CreateGroupModal } from '@/components/CreateGroupModal'
import { useChatStore } from '@/store/chatStore'
import { useFriendsStore } from '@/store/friendsStore'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { initUserE2EE } from '@/lib/crypto'

export default function ChatPage() {
  const { token, user } = useAuthStore()
  const setConversations = useChatStore((state) => state.setConversations)
  const setCurrentConversation = useChatStore((state) => state.setCurrentConversation)
  const setMessages = useChatStore((state) => state.setMessages)
  const setFriends = useFriendsStore((state) => state.setFriends)
  const setFriendRequests = useFriendsStore((state) => state.setFriendRequests)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const [loading, setLoading] = useState(true)

  // Initialize E2EE Keys
  useEffect(() => {
    if (!user?.id) return
    initUserE2EE(user.id)
      .then(async (publicKey) => {
        if (!user.publicKey) {
          try {
            await api.put('/api/chat/keys', { publicKey })
            useAuthStore.getState().setUser({ ...user, publicKey })
          } catch (err) {
            console.warn('[E2EE] Could not upload public key to server:', err)
          }
        }
      })
      .catch((err) => {
        console.error('[E2EE] Failed to initialize encryption keys:', err)
      })
  }, [user?.id, user?.publicKey])

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      
      try {
        setLoading(true)
        console.log('[ChatPage] Attempting to fetch data...')
        
        // Fetch data individually so one failure doesn't block others
        let convData: any[] = []
        let friendsData: any[] = []
        let requestsData: any[] = []

        try {
          const convRes = await api.get('/api/chat/conversations')
          convData = convRes.data
        } catch (e: any) {
          console.warn('[ChatPage] Failed to fetch conversations:', e.response?.data)
        }

        try {
          const friendsRes = await api.get('/api/chat/friends')
          friendsData = friendsRes.data
        } catch (e: any) {
          console.warn('[ChatPage] Failed to fetch friends:', e.response?.data)
        }

        try {
          const requestsRes = await api.get('/api/chat/friends/requests')
          requestsData = requestsRes.data
        } catch (e: any) {
          console.warn('[ChatPage] Failed to fetch requests:', e.response?.data)
        }

        console.log('[ChatPage] Data loaded:', { conversations: convData.length, friends: friendsData.length, requests: requestsData.length })
        setConversations(convData)
        setFriends(friendsData)
        setFriendRequests(requestsData)

        if (convData.length > 0 && !useChatStore.getState().currentConversation) {
          setCurrentConversation(convData[0])
        }
      } catch (error: any) {
        console.group('[ChatPage] Fatal Initialization Error')
        console.error('Status:', error.response?.status)
        console.error('Data:', error.response?.data)
        console.groupEnd()
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, setConversations, setFriends, setFriendRequests, setCurrentConversation])

  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentConversation && token) {
        try {
          const res = await api.get(`/api/chat/messages/${currentConversation.id}`)
          setMessages(res.data)
          setSidebarOpen(false)
        } catch (error: any) {
          console.error('[ChatPage] Message Fetch Error:', error.response?.status)
        }
      }
    }
    fetchMessages()
  }, [currentConversation, token, setMessages, setSidebarOpen])

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-sm font-medium">Loading your conversations…</p>
          </div>
        </div>
      ) : (
      <SocketProvider>
        <div className="h-screen bg-background flex overflow-hidden">
          <ChatSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatHeader />
            <MessagesArea />
            <MessageInput />
          </div>
          <FriendsPanel />
          <UserProfile />
          <AddFriendModal />
          <CreateGroupModal />
          <CallOverlay />
        </div>
      </SocketProvider>
      )}
    </ProtectedRoute>
  )
}
