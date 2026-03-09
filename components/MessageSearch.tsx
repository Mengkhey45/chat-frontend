'use client'

import { useState, useMemo } from 'react'
import { useChatStore } from '@/store/chatStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { X, Search, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MessageSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function MessageSearch({ isOpen, onClose }: MessageSearchProps) {
  const messages = useChatStore((state) => state.messages)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim() || !currentConversation) {
      return []
    }

    return messages.filter(
      (msg) =>
        msg.conversationId === currentConversation.id &&
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, messages, currentConversation])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Search Messages</CardTitle>
            <CardDescription>
              {currentConversation?.name || 'current conversation'}
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No messages found' : 'Start typing to search'}
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {(message.senderName || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {message.senderName}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1 line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
