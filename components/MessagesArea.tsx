'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useReadReceipts, useChat } from '@/hooks/useChat'
import { usePreferencesStore } from '@/store/preferencesStore'
import { MessageActions } from '@/components/MessageActions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, FileIcon, Check, CheckCheck, Lock, ShieldCheck } from 'lucide-react'
import api from '@/lib/api'
import { getSharedSecretKey, decryptE2EEMessage } from '@/lib/crypto'

// Stable reference: returning a fresh {} from the selector would re-render on
// every store update.
const EMPTY_TYPING: Record<string, boolean> = {}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

export function MessagesArea() {
  const messages = useChatStore((state) => state.messages)
  const currentConversation = useChatStore((state) => state.currentConversation)
  const typingUsers = useChatStore(
    (state) => state.typingUsers[state.currentConversation?.id ?? ''] ?? EMPTY_TYPING
  )
  const user = useAuthStore((state) => state.user)
  const compact = usePreferencesStore((state) => state.compactMode)
  const { editMessage, deleteMessage } = useChat(currentConversation?.id)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  // Automatically decrypt encrypted messages for this conversation
  useEffect(() => {
    if (!currentConversation?.isE2EE || !user?.id) return

    const conversationMessages = messages.filter(
      (msg) => msg.conversationId === currentConversation.id
    )

    const pendingDecryption = conversationMessages.filter(
      (msg) => msg.isEncrypted && msg.iv && !decryptedMap[msg.id]
    )

    if (pendingDecryption.length === 0) return

    let isMounted = true

    const decryptBatch = async () => {
      try {
        const peerId = currentConversation.members.find((id) => id !== user.id)
        if (!peerId) return

        let peerPublicKey = currentConversation.memberDetails?.find((m) => m.id === peerId)?.publicKey
        if (!peerPublicKey) {
          const res = await api.get(`/api/chat/keys/${peerId}`)
          peerPublicKey = res.data?.publicKey
        }
        if (!peerPublicKey) return

        const sharedKey = await getSharedSecretKey(user.id, peerPublicKey, currentConversation.id)
        const batchResults: Record<string, string> = {}

        await Promise.all(
          pendingDecryption.map(async (msg) => {
            const plain = await decryptE2EEMessage(msg.content, msg.iv!, sharedKey)
            batchResults[msg.id] = plain
          })
        )

        if (isMounted) {
          setDecryptedMap((prev) => ({ ...prev, ...batchResults }))
        }
      } catch (err) {
        console.warn('[E2EE] Batch decryption failed:', err)
      }
    }

    decryptBatch()

    return () => {
      isMounted = false
    }
  }, [messages, currentConversation?.id, currentConversation?.isE2EE, user?.id])

  // Messenger allows edits for 15 minutes; the server enforces the same window.
  const EDIT_WINDOW_MS = 15 * 60 * 1000
  const canEdit = (createdAt: string) =>
    Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS

  const submitEdit = (messageId: string) => {
    if (draft.trim()) editMessage(messageId, draft)
    setEditingId(null)
    setDraft('')
  }

  // Initialize read receipts for unread messages
  useReadReceipts(currentConversation?.id)

  // Auto-scroll only when the user is already at the bottom. Scrolling
  // unconditionally yanked the view away from anyone reading older messages.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 150) {
      el.scrollTop = el.scrollHeight
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

  // The indicator used to render an anonymous "?" bubble. In a group that is
  // useless — say who is actually typing.
  const typingNames = Object.keys(typingUsers)
    .filter((id) => id !== user?.id)
    .map((id) => {
      const member = currentConversation.memberDetails?.find((m) => m.id === id)
      const fromMessage = conversationMessages.find((m) => m.senderId === id)
      return member?.name || fromMessage?.senderName || 'Someone'
    })

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className={compact ? 'p-4 space-y-1.5' : 'p-4 space-y-4'}>
        {currentConversation.isE2EE && (
          <div className="mx-auto max-w-md my-2 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-center shadow-sm flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>End-to-End Encrypted Secret Chat</span>
            </div>
            <p className="text-[11px] text-emerald-200/70 leading-relaxed">
              Messages are encrypted on your device. Only you and {currentConversation.name} hold the private keys. Even server and database administrators cannot read your messages.
            </p>
          </div>
        )}

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

            const textContent = message.isEncrypted
              ? (decryptedMap[message.id] ?? 'Decrypting…')
              : message.content

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
                        {formatTimestamp(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {editingId === message.id ? (
                    <div className="flex items-center gap-2 w-full max-w-md">
                      <Input
                        value={draft}
                        autoFocus
                        aria-label="Edit message"
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitEdit(message.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="bg-secondary border-border-strong h-9"
                      />
                      <Button size="sm" onClick={() => submitEdit(message.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                  <div
                    className={`rounded-lg break-words ${compact ? 'px-3 py-1.5' : 'px-4 py-2'} max-w-xs lg:max-w-md ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {message.isEncrypted && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 mb-1">
                        <Lock className="w-3 h-3" />
                        <span>Encrypted</span>
                      </div>
                    )}
                    {message.fileUrl ? (
                      <div className="space-y-2">
                        {message.fileType === 'image' || message.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={message.fileUrl}
                            alt={message.fileName || 'Image'}
                            className="max-w-full rounded-lg cursor-pointer"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                            onClick={() => window.open(message.fileUrl, '_blank', 'noopener,noreferrer')}
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
                        {textContent && textContent !== message.fileName && (
                          <p className="text-sm leading-normal whitespace-pre-wrap">
                            {textContent}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-normal whitespace-pre-wrap">
                        {textContent}
                      </p>
                    )}

                    {message.linkPreview && (
                      <a
                        href={message.linkPreview.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-2 flex gap-3 rounded-lg border border-border/50 bg-background/40 p-2 no-underline hover:bg-background/70 transition-colors"
                      >
                        {message.linkPreview.image && (
                          <img
                            src={message.linkPreview.image}
                            alt=""
                            loading="lazy"
                            className="w-14 h-14 rounded object-cover flex-shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold truncate">
                            {message.linkPreview.title || message.linkPreview.url}
                          </span>
                          {message.linkPreview.description && (
                            <span className="block text-xs opacity-70 line-clamp-2">
                              {message.linkPreview.description}
                            </span>
                          )}
                        </span>
                      </a>
                    )}

                    {message.isEdited && (
                      <span
                        className={`block mt-1 text-[10px] ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        edited
                      </span>
                    )}
                  </div>
                  )}

                  {editingId !== message.id && (
                    <MessageActions
                      isOwn={isOwn}
                      canEdit={isOwn && !message.fileUrl && canEdit(message.createdAt)}
                      onEdit={() => {
                        setEditingId(message.id)
                        setDraft(message.content)
                      }}
                      onUnsend={() => deleteMessage(message.id, 'everyone')}
                      onHide={() => deleteMessage(message.id, 'me')}
                    />
                  )}
                  </div>

                  {/* Read Receipt */}
                  {isOwn && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      {message.isRead ? (
                        <CheckCheck className="w-3 h-3 text-primary" aria-label="Read" />
                      ) : (
                        <Check className="w-3 h-3" aria-label="Sent" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Typing Indicator */}
        {typingNames.length > 0 && (
          <div className="flex gap-3 items-end" aria-live="polite">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-secondary text-foreground text-xs">
                {typingNames[0].charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {typingNames.length === 1
                  ? `${typingNames[0]} is typing`
                  : typingNames.length === 2
                    ? `${typingNames[0]} and ${typingNames[1]} are typing`
                    : `${typingNames.length} people are typing`}
              </span>
              <div className="flex items-center gap-1 bg-secondary px-4 py-2 rounded-lg w-fit">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
