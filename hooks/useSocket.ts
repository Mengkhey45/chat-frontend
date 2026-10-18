import { useEffect, useCallback, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore, Message } from '@/store/chatStore'
import { usePresenceStore } from '@/store/presenceStore'
import { useFriendsStore } from '@/store/friendsStore'
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket'
import { usePreferencesStore } from '@/store/preferencesStore'
import { showNotification, playMessageTone } from '@/lib/notifications'

export function useSocket() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [isConnected, setIsConnected] = useState(() => getSocket()?.connected ?? false)

  const currentConversation = useChatStore((state) => state.currentConversation)

  // Connect and register listeners exactly once per authenticated session.
  // The previous version rebuilt this callback whenever the selected
  // conversation changed, tearing down and re-adding every handler on each
  // conversation switch.
  useEffect(() => {
    if (!user || !token) return

    const socket = connectSocket(token, user.id)
    const chat = useChatStore.getState()

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    const onMessage = (message: Message) => {
      useChatStore.getState().addMessage(message)
      if (message.senderId === user.id) return

      const prefs = usePreferencesStore.getState()
      playMessageTone()

      const isActive =
        useChatStore.getState().currentConversation?.id === message.conversationId
      // Don't notify for the conversation that's already on screen.
      if (prefs.messageNotifications && !isActive) {
        showNotification(
          message.senderName || 'New message',
          message.content || 'Sent an attachment',
          message.conversationId
        )
      }
    }

    // Emitted when the server resolves a link preview after delivery.
    const onMessageUpdate = (data: { id: string } & Partial<Message>) => {
      const { id, ...updates } = data
      useChatStore.getState().updateMessage(id, updates)
    }

    // A message was unsent, or hidden just for us.
    const onMessageDeleted = (data: { id: string }) => {
      useChatStore.getState().deleteMessage(data.id)
    }

    const onMessageRead = (data: { messageId: string; userId: string }) => {
      if (data.userId !== user.id) useChatStore.getState().markMessageRead(data.messageId)
    }

    const onTypingStart = (data: { userId: string; conversationId: string }) => {
      if (data.userId === user.id) return
      useChatStore.getState().addTypingUser(data.conversationId, data.userId)
    }

    const onTypingStop = (data: { userId: string; conversationId: string }) => {
      useChatStore.getState().removeTypingUser(data.conversationId, data.userId)
    }

    const onPresence = (data: { userId: string; status: 'online' | 'away' | 'offline' }) => {
      usePresenceStore.getState().setUserStatus(data.userId, data.status)
      useFriendsStore.getState().updateFriendStatus(data.userId, data.status)
    }

    // The server has always sent these; nothing was listening, so unread
    // badges never appeared.
    const onUnreadCounts = (counts: Record<string, number>) => {
      useChatStore.getState().setUnreadCounts(counts)
    }

    const onMessageError = (data: { error: string }) => {
      console.error('[Socket] message error:', data.error)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message:new', onMessage)
    socket.on('message:update', onMessageUpdate)
    socket.on('message:read', onMessageRead)
    socket.on('message:deleted', onMessageDeleted)
    socket.on('typing:start', onTypingStart)
    socket.on('typing:stop', onTypingStop)
    socket.on('presence:update', onPresence)
    socket.on('unread_counts', onUnreadCounts)
    socket.on('message:error', onMessageError)
    socket.on('room:error', onMessageError)

    setIsConnected(socket.connected)
    if (chat.currentConversation) socket.emit('join_room', chat.currentConversation.id)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message:new', onMessage)
      socket.off('message:update', onMessageUpdate)
      socket.off('message:read', onMessageRead)
      socket.off('message:deleted', onMessageDeleted)
      socket.off('typing:start', onTypingStart)
      socket.off('typing:stop', onTypingStop)
      socket.off('presence:update', onPresence)
      socket.off('unread_counts', onUnreadCounts)
      socket.off('message:error', onMessageError)
      socket.off('room:error', onMessageError)
    }
  }, [user, token])

  const emit = useCallback((event: string, data?: any) => {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit(event, data)
      return true
    }
    console.warn('[Socket] Not connected, cannot emit:', event)
    return false
  }, [])

  // Join the newly selected room and leave the previous one, so the server
  // stops pushing messages for conversations that are no longer open.
  useEffect(() => {
    const socket = getSocket()
    const roomId = currentConversation?.id
    if (!socket || !roomId) return

    const join = () => socket.emit('join_room', roomId)
    if (socket.connected) join()
    socket.on('connect', join)

    return () => {
      socket.off('connect', join)
      if (socket.connected) socket.emit('leave_room', roomId)
    }
  }, [currentConversation?.id])

  const sendMessage = useCallback(
    (
      conversationId: string,
      content: string,
      fileInfo?: { fileUrl: string; fileName: string; fileType: string },
      encryptionInfo?: { isEncrypted?: boolean; iv?: string }
    ) => emit('message:send', { conversationId, content, ...fileInfo, ...encryptionInfo }),
    [emit]
  )

  const sendTyping = useCallback(
    (conversationId: string) => emit('typing:start', { conversationId }),
    [emit]
  )

  const stopTyping = useCallback(
    (conversationId: string) => emit('typing:stop', { conversationId }),
    [emit]
  )

  const setStatus = useCallback(
    (status: 'online' | 'away' | 'offline') => emit('presence:set', { status }),
    [emit]
  )

  const editMessage = useCallback(
    (conversationId: string, messageId: string, content: string) =>
      emit('message:edit', { conversationId, messageId, content }),
    [emit]
  )

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string, scope: 'everyone' | 'me' = 'everyone') =>
      emit('message:delete', { conversationId, messageId, scope }),
    [emit]
  )

  const markAsRead = useCallback(
    (conversationId: string, messageId: string) =>
      emit('message:read', { conversationId, messageId }),
    [emit]
  )

  return {
    socket: getSocket(),
    disconnect: disconnectSocket,
    emit,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTyping,
    stopTyping,
    setStatus,
    markAsRead,
    isConnected,
  }
}
