import { create } from 'zustand'

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  isEncrypted?: boolean
  iv?: string
  decryptedContent?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  createdAt: string
  updatedAt?: string
  isRead: boolean
  isEdited?: boolean
  linkPreview?: LinkPreview | null
  reactions?: Record<string, string[]>
  /** Set on messages shown before the server has confirmed them. */
  pending?: boolean
  failed?: boolean
}

export interface ConversationMember {
  id: string
  name: string
  email?: string
  avatar?: string
  publicKey?: string
}

export interface Conversation {
  id: string
  name: string
  avatar?: string
  type: 'dm' | 'group'
  isE2EE?: boolean
  members: string[]
  memberDetails?: ConversationMember[]
  groupAdmin?: string
  lastMessage?: Message
  unreadCount: number
  createdAt: string
}

export interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  /** conversationId -> userId -> true. Keyed by conversation so a "typing"
   *  indicator from one chat doesn't render in another. */
  typingUsers: Record<string, Record<string, boolean>>
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (conversation: Conversation) => void
  removeConversation: (conversationId: string) => void
  setCurrentConversation: (conversation: Conversation | null) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  deleteMessage: (messageId: string) => void
  setMessages: (messages: Message[]) => void
  markMessageRead: (messageId: string) => void
  addTypingUser: (conversationId: string, userId: string) => void
  removeTypingUser: (conversationId: string, userId: string) => void
  clearTypingUsers: (conversationId?: string) => void
  setUnreadCounts: (counts: Record<string, number>) => void
  markConversationAsRead: (conversationId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  typingUsers: {},

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) =>
      state.conversations.some((c) => c.id === conversation.id)
        ? state
        : { conversations: [conversation, ...state.conversations] }
    ),

  updateConversation: (conversation) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversation.id ? { ...c, ...conversation } : c
      ),
      currentConversation:
        state.currentConversation?.id === conversation.id
          ? { ...state.currentConversation, ...conversation }
          : state.currentConversation,
    })),

  removeConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      currentConversation:
        state.currentConversation?.id === conversationId ? null : state.currentConversation,
      messages: state.messages.filter((m) => m.conversationId !== conversationId),
    })),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

  addMessage: (message) =>
    set((state) => {
      const isActive = state.currentConversation?.id === message.conversationId

      // A message that echoes back an optimistic one replaces it instead of
      // appearing twice.
      const optimisticIndex = state.messages.findIndex(
        (m) =>
          m.pending &&
          m.conversationId === message.conversationId &&
          m.senderId === message.senderId &&
          m.content === message.content
      )

      let messages: Message[]
      if (optimisticIndex !== -1) {
        messages = [...state.messages]
        messages[optimisticIndex] = message
      } else if (state.messages.some((m) => m.id === message.id)) {
        messages = state.messages
      } else {
        messages = [...state.messages, message]
      }

      return {
        messages,
        conversations: state.conversations.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: message,
                // Only the conversation you're actually looking at gets cleared.
                // This previously zeroed the badge for every incoming message.
                unreadCount: isActive ? 0 : conv.unreadCount + 1,
              }
            : conv
        ),
      }
    }),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  markMessageRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ),
    })),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),

  setMessages: (messages) => set({ messages }),

  addTypingUser: (conversationId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: { ...state.typingUsers[conversationId], [userId]: true },
      },
    })),

  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.typingUsers[conversationId] ?? {}
      return { typingUsers: { ...state.typingUsers, [conversationId]: rest } }
    }),

  clearTypingUsers: (conversationId) =>
    set((state) =>
      conversationId
        ? { typingUsers: { ...state.typingUsers, [conversationId]: {} } }
        : { typingUsers: {} }
    ),

  setUnreadCounts: (counts) =>
    set((state) => ({
      conversations: state.conversations.map((conv) => ({
        ...conv,
        unreadCount: counts[conv.id] ?? conv.unreadCount,
      })),
    })),

  markConversationAsRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    })),
}))
