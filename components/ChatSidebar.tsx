'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useUIStore } from '@/store/uiStore'
import { useFriendsStore } from '@/store/friendsStore'
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
  X 
} from 'lucide-react'

export function ChatSidebar() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const conversations = useChatStore((state) => state.conversations)
  const setCurrentConversation = useChatStore((state) => state.setCurrentConversation)
  const friends = useFriendsStore((state) => state.friends)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setShowFriendsPanel = useUIStore((state) => state.setShowFriendsPanel)
  const setShowUserProfile = useUIStore((state) => state.setShowUserProfile)
  const searchQuery = useUIStore((state) => state.searchQuery)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const [activeTab, setActiveTab] = useState<'messages' | 'friends'>('messages')

  const handleLogout = () => {
    logout()
  }

  const handleStartDM = (friendId: string, friendName: string) => {
    // Create or select existing DM conversation
    const conversation = conversations.find(
      (c) => c.type === 'dm' && c.members.includes(friendId)
    )
    
    if (conversation) {
      setCurrentConversation(conversation)
    } else {
      // In a real app, create new conversation via API
      const newConversation = {
        id: 'dm-' + friendId + '-' + Date.now(),
        name: friendName,
        type: 'dm' as const,
        members: [user?.id || '', friendId],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      }
      setCurrentConversation(newConversation)
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
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">Discord</h1>
              <p className="text-xs text-muted-foreground">Chat App</p>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground h-9"
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
                  <h3 className="text-sm font-semibold text-sidebar-foreground">Direct Messages</h3>
                  <button className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors">
                    <Plus className="w-4 h-4 text-sidebar-foreground" />
                  </button>
                </div>

                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No conversations yet. Start a DM!
                  </p>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setCurrentConversation(conversation)}
                      className="w-full text-left p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conversation.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {conversation.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
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

                {friends.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No friends yet. Add some!
                  </p>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.userId}
                      onClick={() => handleStartDM(friend.userId, friend.name)}
                      className="w-full text-left p-3 rounded-lg hover:bg-sidebar-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {friend.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-sidebar ${
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
                          <p className="text-xs text-muted-foreground">
                            {friend.status}
                          </p>
                        </div>
                      </div>
                    </button>
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
