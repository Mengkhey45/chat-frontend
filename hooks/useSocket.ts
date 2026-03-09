import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore, Message } from '@/store/chatStore'
import { usePresenceStore } from '@/store/presenceStore'
import { useFriendsStore } from '@/store/friendsStore'
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket'

export function useSocket() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const addMessage = useChatStore((state) => state.addMessage)
  const addTypingUser = useChatStore((state) => state.addTypingUser)
  const removeTypingUser = useChatStore((state) => state.removeTypingUser)
  const setUserStatus = usePresenceStore((state) => state.setUserStatus)
  const updateFriendStatus = useFriendsStore((state) => state.updateFriendStatus)

  const connect = useCallback(() => {
    if (!user) return
    const authToken = token || localStorage.getItem('token')
    if (!authToken) return

    const socket = connectSocket(authToken, user.id)

    // Remove old listeners before adding new ones (prevent duplicates)
    socket.off('message:new')
    socket.off('typing:start')
    socket.off('typing:stop')
    socket.off('presence:update')

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

    // Join current conversation room if any
    if (currentConversation) {
      socket.emit('join_room', currentConversation.id)
    }
  }, [user, token, currentConversation, addMessage, addTypingUser, removeTypingUser, setUserStatus, updateFriendStatus])

  const disconnect = useCallback(() => {
    disconnectSocket()
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit(event, data)
    } else {
      console.warn('[Socket] Not connected, cannot emit:', event)
    }
  }, [])

  // Join room when conversation changes
  useEffect(() => {
    const socket = getSocket()
    if (socket?.connected && currentConversation) {
      socket.emit('join_room', currentConversation.id)
    }
  }, [currentConversation])

  const sendMessage = useCallback(
    (conversationId: string, content: string, fileInfo?: { fileData: string; fileName: string; fileType: string }) => {
      emit('message:send', { conversationId, content, ...fileInfo })
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
    if (user) {
      connect()
    }
  }, [user, connect])

  return {
    socket: getSocket(),
    connect,
    disconnect,
    emit,
    sendMessage,
    sendTyping,
    stopTyping,
    setStatus,
    markAsRead,
    isConnected: getSocket()?.connected ?? false,
  }
}
