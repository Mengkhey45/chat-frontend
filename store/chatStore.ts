import { create } from 'zustand'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  fileUrl?: string
  fileName?: string
  createdAt: string
  updatedAt?: string
  isRead: boolean
  reactions?: Record<string, string[]>
}

export interface Conversation {
  id: string
  name: string
  avatar?: string
  type: 'dm' | 'group'
  members: string[]
  lastMessage?: Message
  unreadCount: number
  createdAt: string
}

export interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  typingUsers: Record<string, boolean>
  setConversations: (conversations: Conversation[]) => void
  setCurrentConversation: (conversation: Conversation) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  deleteMessage: (messageId: string) => void
  setMessages: (messages: Message[]) => void
  addTypingUser: (userId: string) => void
  removeTypingUser: (userId: string) => void
  clearTypingUsers: () => void
  markConversationAsRead: (conversationId: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  typingUsers: {},
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  addMessage: (message) =>
    set((state) => ({
      messages: state.messages.some((m) => m.id === message.id)
        ? state.messages
        : [...state.messages, message],
      conversations: state.conversations.map((conv) =>
        conv.id === message.conversationId
          ? { ...conv, lastMessage: message, unreadCount: 0 }
          : conv
      ),
    })),
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),
  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),
  setMessages: (messages) => set({ messages }),
  addTypingUser: (userId) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: true },
    })),
  removeTypingUser: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.typingUsers
      return { typingUsers: rest }
    }),
  clearTypingUsers: () => set({ typingUsers: {} }),
  markConversationAsRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    })),
}))
