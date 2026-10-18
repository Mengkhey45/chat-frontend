'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { logoutRequest } from '@/lib/api'
import { useChatStore } from '@/store/chatStore'
import { useUIStore } from '@/store/uiStore'
import { useFriendsStore } from '@/store/friendsStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Plus,
  Search,
  Settings,
  Users,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react'

export function ChatSidebar() {
  const user = useAuthStore((state) => state.user)
  const conversations = useChatStore((state) => state.conversations)
  const setCurrentConversation = useChatStore((state) => state.setCurrentConversation)
  const markConversationAsRead = useChatStore((state) => state.markConversationAsRead)
  const friends = useFriendsStore((state) => state.friends)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setShowFriendsPanel = useUIStore((state) => state.setShowFriendsPanel)
  const setShowUserProfile = useUIStore((state) => state.setShowUserProfile)
  const setShowCreateGroupModal = useUIStore((state) => state.setShowCreateGroupModal)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const searchQuery = useUIStore((state) => state.searchQuery)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const [activeTab, setActiveTab] = useState<'messages' | 'friends'>('messages')

  // The search box was writing to the store and nothing was reading it, so
  // typing in it did nothing at all.
  const query = searchQuery.trim().toLowerCase()
  const visibleConversations = query
    ? conversations.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.lastMessage?.content?.toLowerCase().includes(query)
      )
    : conversations
  const visibleFriends = query
    ? friends.filter(
        (f) => f.name?.toLowerCase().includes(query) || f.email?.toLowerCase().includes(query)
      )
    : friends

  const handleLogout = async () => {
    // Revokes the refresh token server-side; clearing local state alone would
    // leave the session usable.
    await logoutRequest()
  }

  const handleStartDM = async (friendId: string, friendName: string, isSecret = false) => {
    // Check if existing conversation matching the encryption mode exists
    const existing = conversations.find(
      (c) => c.type === 'dm' && c.members.includes(friendId) && Boolean(c.isE2EE) === Boolean(isSecret)
    )
    
    if (existing) {
      setCurrentConversation(existing)
    } else {
      try {
        const res = await api.post('/api/chat/conversations', {
          participants: [friendId],
          isGroup: false,
          isE2EE: isSecret,
        })
        const newConv = res.data
        // Refresh conversations list
        const convRes = await api.get('/api/chat/conversations')
        useChatStore.getState().setConversations(convRes.data)
        // Select the new conversation
        const created = convRes.data.find((c: any) => c.id === newConv.id)
        if (created) setCurrentConversation(created)
      } catch (err) {
        console.error('Failed to create conversation:', err)
      }
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => toggleSidebar()}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1">
            <img
              src="/icon.svg"
              alt="Chatly"
              className="w-10 h-10 rounded-xl shadow-sm shadow-primary/20 shrink-0"
            />
            <div>
              <h1 className="font-bold text-sidebar-foreground">Chatly</h1>
              <p className="text-xs text-muted-foreground">Messages &amp; calls</p>
            </div>
          </div>
          <button
            onClick={() => toggleSidebar()}
            className="lg:hidden p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              aria-label="Search conversations and friends"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-sidebar-accent border-border-strong text-sidebar-foreground placeholder:text-muted-foreground h-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-sidebar-border">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'messages'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'friends'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80'
            }`}
          >
            <Users className="w-4 h-4" />
            Friends
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {activeTab === 'messages' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-sidebar-foreground">Conversations</h3>
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    aria-label="Create a group"
                    title="Create a group"
                    className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Plus className="w-4 h-4 text-sidebar-foreground" />
                  </button>
                </div>

                {visibleConversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {query
                      ? `Nothing matches “${searchQuery.trim()}”.`
                      : 'No conversations yet. Message a friend, or create a group.'}
                  </p>
                ) : (
                  visibleConversations.map((conversation) => {
                    // Without this the open conversation looked identical to
                    // every other row.
                    const isActive = currentConversation?.id === conversation.id
                    const isGroup = conversation.type === 'group'

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => {
                          setCurrentConversation(conversation)
                          // Clear the badge immediately; the server confirms via
                          // `unread_counts` once the room is joined.
                          markConversationAsRead(conversation.id)
                        }}
                        aria-current={isActive ? 'true' : undefined}
                        className={`w-full text-left p-3 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${
                          isActive
                            ? 'bg-primary/15 ring-1 ring-primary/40'
                            : 'hover:bg-sidebar-accent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={conversation.avatar} />
                              <AvatarFallback
                                className={
                                  isGroup
                                    ? 'bg-secondary text-sidebar-foreground'
                                    : 'bg-primary text-primary-foreground'
                                }
                              >
                                {isGroup ? (
                                  <Users className="w-4 h-4" />
                                ) : (
                                  (conversation.name || '?').charAt(0).toUpperCase()
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {conversation.isE2EE && (
                                <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              )}
                              <p
                                className={`text-sm truncate ${
                                  isActive
                                    ? 'font-semibold text-sidebar-foreground'
                                    : 'font-medium text-sidebar-foreground'
                                }`}
                              >
                                {conversation.name}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {isGroup && !conversation.lastMessage
                                ? `${conversation.members.length} members`
                                : conversation.lastMessage?.isEncrypted
                                ? '🔒 Secret message'
                                : conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span
                              aria-label={`${conversation.unreadCount} unread`}
                              className="flex-shrink-0 min-w-5 h-5 px-1.5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold tabular-nums"
                            >
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-sidebar-foreground">Friends List</h3>
                  <button
                    onClick={() => setShowFriendsPanel(true)}
                    className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 text-sidebar-foreground" />
                  </button>
                </div>

                {visibleFriends.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {query ? `No friends match “${searchQuery.trim()}”.` : 'No friends yet. Add some!'}
                  </p>
                ) : (
                  visibleFriends.map((friend) => (
                    <div
                      key={friend.userId}
                      className="w-full p-2.5 rounded-lg hover:bg-sidebar-accent transition-colors flex items-center justify-between group"
                    >
                      <button
                        onClick={() => handleStartDM(friend.userId, friend.name, false)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {(friend.name || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-sidebar ${
                              friend.status === 'online'
                                ? 'status-online'
                                : friend.status === 'away'
                                ? 'status-away'
                                : 'status-offline'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {friend.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {friend.status}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => handleStartDM(friend.userId, friend.name, false)}
                          title="Start Regular Chat"
                          className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartDM(friend.userId, friend.name, true)}
                          title="Start Secret Chat 🔒 (E2EE)"
                          className="p-1.5 hover:bg-emerald-500/20 rounded-md text-emerald-400 transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.status}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUserProfile(true)}
              className="flex-1 p-2 rounded-lg hover:bg-sidebar-accent transition-colors flex items-center justify-center"
            >
              <Settings className="w-4 h-4 text-sidebar-foreground" />
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 p-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      {!sidebarOpen && (
        <button
          onClick={() => toggleSidebar()}
          className="fixed bottom-4 left-4 lg:hidden p-3 rounded-full bg-primary text-primary-foreground shadow-lg z-30"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
