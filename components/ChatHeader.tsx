'use client'

import { useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useUIStore } from '@/store/uiStore'
import { usePresenceStore } from '@/store/presenceStore'
import { MessageSearch } from '@/components/MessageSearch'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Phone, Video, Info, Menu, X, Search, UserPlus } from 'lucide-react'

export function ChatHeader() {
  const currentConversation = useChatStore((state) => state.currentConversation)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setShowAddFriendModal = useUIStore((state) => state.setShowAddFriendModal)
  const onlineUsers = usePresenceStore((state) => state.onlineUsers)
  const [showSearch, setShowSearch] = useState(false)

  if (!currentConversation) {
    return (
      <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <p className="text-muted-foreground">Select a conversation to start messaging</p>
        <Button 
          onClick={() => setShowAddFriendModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Friend
        </Button>
      </div>
    )
  }

  // Get conversation member status if it's a DM
  const isOnline = currentConversation.type === 'dm' && 
    currentConversation.members.some(memberId => 
      onlineUsers[memberId]?.status === 'online'
    )

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={() => toggleSidebar()}
          className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-foreground" />
          )}
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={currentConversation.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {(currentConversation.name || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">
              {currentConversation.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {currentConversation.type === 'dm' ? (
                isOnline ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full status-online inline-block" />
                    Online
                  </span>
                ) : (
                  'Offline'
                )
              ) : (
                `${currentConversation.members.length} members`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddFriendModal(true)}
          className="hidden md:flex hover:bg-secondary text-foreground border-border gap-2 mr-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Friend
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
          className="hover:bg-secondary text-foreground"
          title="Search in conversation"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* Message Search Modal */}
        <MessageSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary text-foreground"
          title="Voice call"
        >
          <Phone className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary text-foreground"
          title="Video call"
        >
          <Video className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary text-foreground"
          title="Conversation info"
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
