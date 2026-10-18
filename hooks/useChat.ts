import { useCallback, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useSocket } from './useSocket'

const TYPING_IDLE_MS = 3000
const TYPING_THROTTLE_MS = 1500

export function useChat(conversationId: string | undefined) {
  const { sendMessage, editMessage, deleteMessage, sendTyping, stopTyping, markAsRead } = useSocket()
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(0)

  const handleSendMessage = useCallback(
    (
      content: string,
      fileInfo?: { fileUrl: string; fileName: string; fileType: string },
      encryptionInfo?: { isEncrypted?: boolean; iv?: string }
    ) => {
      if (!conversationId || (!content.trim() && !fileInfo)) return false

      const sent = sendMessage(conversationId, content, fileInfo, encryptionInfo)
      stopTyping(conversationId)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      lastTypingSentRef.current = 0
      return sent
    },
    [conversationId, sendMessage, stopTyping]
  )

  const handleTyping = useCallback(() => {
    if (!conversationId) return

    // Throttle: this fires on every keystroke, and previously emitted a socket
    // event for each one.
    const now = Date.now()
    if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
      sendTyping(conversationId)
      lastTypingSentRef.current = now
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId)
      lastTypingSentRef.current = 0
    }, TYPING_IDLE_MS)
  }, [conversationId, sendTyping, stopTyping])

  const handleMarkAsRead = useCallback(
    (messageId: string) => {
      if (conversationId) markAsRead(conversationId, messageId)
    },
    [conversationId, markAsRead]
  )

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      if (conversationId && content.trim()) editMessage(conversationId, messageId, content.trim())
    },
    [conversationId, editMessage]
  )

  const handleDelete = useCallback(
    (messageId: string, scope: 'everyone' | 'me' = 'everyone') => {
      if (conversationId) deleteMessage(conversationId, messageId, scope)
    },
    [conversationId, deleteMessage]
  )

  return {
    sendMessage: handleSendMessage,
    editMessage: handleEdit,
    deleteMessage: handleDelete,
    handleTyping,
    markAsRead: handleMarkAsRead,
  }
}

/**
 * Marks incoming messages read once they scroll into view.
 *
 * The observer is built once per conversation and messages are attached to it
 * as they arrive. The previous version tore down and rebuilt the observer on
 * every state change to `messages` — i.e. on every keystroke-driven re-render —
 * and re-emitted a read receipt for messages it had already reported.
 */
export function useReadReceipts(conversationId: string | undefined) {
  const messages = useChatStore((state) => state.messages)
  const userId = useAuthStore((state) => state.user?.id)
  const { markAsRead } = useSocket()

  const reportedRef = useRef<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    reportedRef.current = new Set()
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const messageId = entry.target.getAttribute('data-message-id')
          if (!messageId || reportedRef.current.has(messageId)) continue
          reportedRef.current.add(messageId)
          markAsRead(conversationId, messageId)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.5 }
    )

    observerRef.current = observer
    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [conversationId, markAsRead])

  useEffect(() => {
    const observer = observerRef.current
    if (!observer || !conversationId || !userId) return

    // Only other people's unread messages need a receipt.
    const pending = messages.filter(
      (m) =>
        m.conversationId === conversationId &&
        m.senderId !== userId &&
        !m.isRead &&
        !reportedRef.current.has(m.id)
    )

    for (const message of pending) {
      const el = document.querySelector(`[data-message-id="${message.id}"]`)
      if (el) observer.observe(el)
    }
  }, [messages, conversationId, userId])
}
