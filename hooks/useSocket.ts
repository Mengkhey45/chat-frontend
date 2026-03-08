import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'
import { useChatStore, Message, Conversation } from '@/store/chatStore'
import { usePresenceStore } from '@/store/presenceStore'
import { useFriendsStore } from '@/store/friendsStore'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const user = useAuthStore((state) => state.user)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const addMessage = useChatStore((state) => state.addMessage)
  const addTypingUser = useChatStore((state) => state.addTypingUser)
  const removeTypingUser = useChatStore((state) => state.removeTypingUser)
  const setOnlineUsers = usePresenceStore((state) => state.setOnlineUsers)
  const setUserStatus = usePresenceStore((state) => state.setUserStatus)
  const updateFriendStatus = useFriendsStore((state) => state.updateFriendStatus)

  const connect = useCallback(() => {
    if (!user || socketRef.current?.connected) {
      return
    }

    // Use environment variable for the Gateway URL, or current domain if using rewrites/proxy
    const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    // Create socket connection - Point to the domain (will be proxied via next.config.mjs)
    const socket = io(GATEWAY_URL, {
      path: '/socket.io/', // Ensure this matches your gateway/backend path
      auth: {
        token: localStorage.getItem('token'),
        userId: user.id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected')
      // Re-join current room if any
      if (currentConversation) {
        socket.emit('join_room', currentConversation.id)
      }
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    socket.on('error', (error) => {
      console.error('[Socket] Error:', error)
    })

    // Message events
    socket.on('message:new', (message: Message) => {
      addMessage(message)
    })

    // Typing events
    socket.on('typing:start', (data: { userId: string; conversationId: string }) => {
      addTypingUser(data.userId)
    })

    socket.on('typing:stop', (data: { userId: string }) => {
      removeTypingUser(data.userId)
    })

    // Presence events
    socket.on('presence:update', (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
      setUserStatus(data.userId, data.status)
      updateFriendStatus(data.userId, data.status)
    })

    socketRef.current = socket
  }, [user, currentConversation, addMessage, addTypingUser, removeTypingUser, setOnlineUsers, setUserStatus, updateFriendStatus])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  // Join room when conversation changes
  useEffect(() => {
    if (socketRef.current?.connected && currentConversation) {
      socketRef.current.emit('join_room', currentConversation.id)
    }
  }, [currentConversation])

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      emit('message:send', {
        conversationId,
        content,
      })
    },
    [emit]
  )

  const sendTyping = useCallback(
    (conversationId: string) => {
      emit('typing:start', { conversationId })
    },
    [emit]
  )

  const stopTyping = useCallback(
    (conversationId: string) => {
      emit('typing:stop', { conversationId })
    },
    [emit]
  )

  const setStatus = useCallback(
    (status: 'online' | 'away' | 'offline') => {
      emit('presence:set', { status })
    },
    [emit]
  )

  const markAsRead = useCallback(
    (conversationId: string, messageId: string) => {
      emit('message:read', { conversationId, messageId })
    },
    [emit]
  )

  // Auto connect when user is available
  useEffect(() => {
    if (user && !socketRef.current?.connected) {
      connect()
    }
  }, [user, connect])

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    emit,
    sendMessage,
    sendTyping,
    stopTyping,
    setStatus,
    markAsRead,
    isConnected: socketRef.current?.connected ?? false,
  }
}
