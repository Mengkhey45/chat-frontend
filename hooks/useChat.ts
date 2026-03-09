import { useCallback, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useSocket } from './useSocket'

export function useChat(conversationId: string | undefined) {
  const { sendMessage, sendTyping, stopTyping, markAsRead } = useSocket()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSendMessage = useCallback(
    (content: string, fileInfo?: { fileData: string; fileName: string; fileType: string }) => {
      if (!conversationId || (!content.trim() && !fileInfo)) {
        return
      }

      sendMessage(conversationId, content, fileInfo)
      stopTyping(conversationId)

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    },
    [conversationId, sendMessage, stopTyping]
  )

  const handleTyping = useCallback(() => {
    if (!conversationId) {
      return
    }

    sendTyping(conversationId)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId)
    }, 3000)
  }, [conversationId, sendTyping, stopTyping])

  const handleMarkAsRead = useCallback(
    (messageId: string) => {
      if (!conversationId) {
        return
      }

      // Debounce read receipts to avoid too many emissions
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current)
      }

      readTimeoutRef.current = setTimeout(() => {
        markAsRead(conversationId, messageId)
      }, 500)
    },
    [conversationId, markAsRead]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current)
      }
    }
  }, [])

  return {
    sendMessage: handleSendMessage,
    handleTyping,
    markAsRead: handleMarkAsRead,
  }
}

export function useReadReceipts(conversationId: string | undefined) {
  const messages = useChatStore((state) => state.messages)
  const { markAsRead } = useSocket()

  useEffect(() => {
    if (!conversationId) {
      return
    }

    // Get unread messages from this conversation
    const unreadMessages = messages.filter(
      (msg) => msg.conversationId === conversationId && !msg.isRead
    )

    if (unreadMessages.length === 0) {
      return
    }

    // Create an observer to mark messages as read when they become visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id')
            if (messageId) {
              markAsRead(conversationId, messageId)
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    // Observe all unread message elements
    const messageElements = document.querySelectorAll('[data-message-id]')
    messageElements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [conversationId, messages, markAsRead])
}
