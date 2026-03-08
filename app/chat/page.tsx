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
import { useChatStore } from '@/store/chatStore'
import { useFriendsStore } from '@/store/friendsStore'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

export default function ChatPage() {
  const { token } = useAuthStore()
  const setConversations = useChatStore((state) => state.setConversations)
  const setCurrentConversation = useChatStore((state) => state.setCurrentConversation)
  const setMessages = useChatStore((state) => state.setMessages)
  const setFriends = useFriendsStore((state) => state.setFriends)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const [loading, setLoading] = useState(true)

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      if (!activeToken) return
      
      try {
        setLoading(true)
        console.log('[ChatPage] Attempting to fetch data...')
        
        // 1. Check health first
        try {
          const health = await api.get('/api/chat/health')
          console.log('[ChatPage] Chat Service Health:', health.data)
        } catch (e) {
          console.warn('[ChatPage] Health check failed, but proceeding anyway...')
        }

        // 2. Fetch real data
        const [convRes, friendsRes] = await Promise.all([
          api.get('/api/chat/conversations'),
          api.get('/api/chat/friends')
        ])
        
        console.log('[ChatPage] Success! Data loaded.')
        setConversations(convRes.data)
        setFriends(friendsRes.data)

        if (convRes.data.length > 0 && !currentConversation) {
          setCurrentConversation(convRes.data[0])
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
  }, [token, setConversations, setFriends, setCurrentConversation, currentConversation])

  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (currentConversation && (token || localStorage.getItem('token'))) {
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm font-medium">Connecting to Gateway...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
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
        </div>
      </SocketProvider>
    </ProtectedRoute>
  )
}
