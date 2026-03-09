'use client'

import { useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useReadReceipts } from '@/hooks/useChat'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, FileIcon, Check, CheckCheck } from 'lucide-react'

export function MessagesArea() {
  const messages = useChatStore((state) => state.messages)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const typingUsers = useChatStore((state) => state.typingUsers)
  const user = useAuthStore((state) => state.user)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Initialize read receipts for unread messages
  useReadReceipts(currentConversation?.id)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No conversation selected</h2>
          <p className="text-muted-foreground">
            Select a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    )
  }

  const conversationMessages = messages.filter(
    (msg) => msg.conversationId === currentConversation.id
  )

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          conversationMessages.map((message, index) => {
            const isOwn = message.senderId === user?.id
            const showAvatar = 
              index === 0 || 
              conversationMessages[index - 1]?.senderId !== message.senderId

            return (
              <div
                key={message.id}
                data-message-id={message.id}
                className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={showAvatar ? '' : 'w-10'}>
                  {showAvatar && (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {(message.senderName || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Message Content */}
                <div className={isOwn ? 'items-end flex flex-col' : 'items-start flex flex-col'}>
                  {showAvatar && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md break-words ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {message.fileUrl ? (
                      <div className="space-y-2">
                        {message.fileType === 'image' || message.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={message.fileUrl}
                            alt={message.fileName || 'Image'}
                            className="max-w-full rounded-lg cursor-pointer"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                            onClick={() => window.open(message.fileUrl, '_blank')}
                          />
                        ) : message.fileType === 'video' || message.fileName?.match(/\.(mp4|webm|mov)$/i) ? (
                          <video
                            src={message.fileUrl}
                            controls
                            className="max-w-full rounded-lg"
                            style={{ maxHeight: '300px' }}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm truncate">{message.fileName || 'File'}</span>
                          </div>
                        )}
                        {message.content && !message.content.startsWith('Shared:') && (
                          <p className="text-sm leading-normal whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-normal whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                  </div>

                  {/* Read Receipt */}
                  {isOwn && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      {message.isRead ? (
                        <CheckCheck className="w-3 h-3 text-primary" title="Read" />
                      ) : (
                        <Check className="w-3 h-3" title="Sent" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Typing Indicator */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="flex gap-3 items-end">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-secondary text-foreground text-xs">
                ?
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 bg-secondary px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
