'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useFriendsStore } from '@/store/friendsStore'
import { usePresenceStore } from '@/store/presenceStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { X, Users, UserPlus, LogOut, Check, Pencil, Loader2, Shield } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Details for the open conversation. For groups this is also where members are
 * added and removed, and where the admin renames the group.
 */
export function ConversationInfoPanel({ open, onClose }: Props) {
  const conversation = useChatStore((s) => s.currentConversation)
  const updateConversation = useChatStore((s) => s.updateConversation)
  const removeConversation = useChatStore((s) => s.removeConversation)
  const user = useAuthStore((s) => s.user)
  const friends = useFriendsStore((s) => s.friends)
  const onlineUsers = usePresenceStore((s) => s.onlineUsers)

  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open || !conversation) return null

  const isGroup = conversation.type === 'group'
  const isAdmin = isGroup && conversation.groupAdmin === user?.id
  const members = conversation.memberDetails ?? []
  const memberIds = new Set(conversation.members)
  const addable = friends.filter((f) => !memberIds.has(f.userId))

  const run = async (fn: () => Promise<any>) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const handleRename = async () => {
    if (!draftName.trim()) return
    const data = await run(async () => {
      const res = await api.patch(`/api/chat/conversations/${conversation.id}`, {
        name: draftName.trim(),
      })
      return res.data
    })
    if (data) {
      updateConversation(data)
      setRenaming(false)
    }
  }

  const handleAdd = async (userId: string) => {
    const data = await run(async () => {
      const res = await api.post(`/api/chat/conversations/${conversation.id}/members`, {
        members: [userId],
      })
      return res.data
    })
    if (data) updateConversation(data)
  }

  const handleRemove = async (userId: string) => {
    const data = await run(async () => {
      const res = await api.delete(
        `/api/chat/conversations/${conversation.id}/members/${userId}`
      )
      return res.data
    })
    if (!data) return
    if (data.left || data.deleted) {
      removeConversation(conversation.id)
      onClose()
    } else {
      updateConversation(data)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Conversation details"
        className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback
                className={isGroup ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'}
              >
                {isGroup ? <Users className="w-5 h-5" /> : (conversation.name || '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {renaming ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    maxLength={100}
                    autoFocus
                    aria-label="Group name"
                    className="h-8 bg-secondary/50 border-border-strong"
                  />
                  <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleRename} disabled={busy}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{conversation.name}</h2>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setDraftName(conversation.name)
                        setRenaming(true)
                      }}
                      aria-label="Rename group"
                      className="p-1 rounded hover:bg-secondary text-muted-foreground flex-shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isGroup ? `${conversation.members.length} members` : 'Direct message'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-secondary rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isGroup ? 'Members' : 'Participants'}
            </h3>
            <div className="rounded-lg border border-border divide-y divide-border">
              {members.map((m) => {
                const isMe = m.id === user?.id
                const online = onlineUsers[m.id]?.status === 'online'
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {(m.name || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                          online ? 'status-online' : 'status-offline'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.name}
                        {isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    {conversation.groupAdmin === m.id && (
                      <span
                        title="Group admin"
                        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary-accent flex-shrink-0"
                      >
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                    {isGroup && isAdmin && !isMe && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={busy}
                        aria-label={`Remove ${m.name}`}
                        className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {isGroup && isAdmin && (
            <div className="space-y-2">
              <button
                onClick={() => setAdding((v) => !v)}
                className="flex items-center gap-2 text-sm text-primary-accent hover:underline"
              >
                <UserPlus className="w-4 h-4" />
                {adding ? 'Done adding' : 'Add members'}
              </button>

              {adding && (
                <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
                  {addable.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      All your friends are already in this group.
                    </p>
                  ) : (
                    addable.map((f) => (
                      <button
                        key={f.userId}
                        onClick={() => handleAdd(f.userId)}
                        disabled={busy}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/60 transition-colors disabled:opacity-50"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={f.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {(f.name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 min-w-0 text-sm text-foreground truncate">{f.name}</span>
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <UserPlus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isGroup && (
          <div className="p-5 border-t border-border">
            <Button
              variant="outline"
              onClick={() => user && handleRemove(user.id)}
              disabled={busy}
              className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Leave group
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
