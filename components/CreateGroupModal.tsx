'use client'

import { useState, useMemo } from 'react'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import { useChatStore } from '@/store/chatStore'
import { useFriendsStore } from '@/store/friendsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Users, Check, Search, Loader2 } from 'lucide-react'

const MIN_MEMBERS = 2 // besides you

export function CreateGroupModal() {
  const open = useUIStore((s) => s.showCreateGroupModal)
  const setOpen = useUIStore((s) => s.setShowCreateGroupModal)
  const friends = useFriendsStore((s) => s.friends)
  const addConversation = useChatStore((s) => s.addConversation)
  const setCurrentConversation = useChatStore((s) => s.setCurrentConversation)

  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(
      (f) => f.name?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q)
    )
  }, [friends, query])

  if (!open) return null

  const close = () => {
    setOpen(false)
    setName('')
    setQuery('')
    setSelected([])
    setError(null)
  }

  const toggle = (userId: string) =>
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('Give the group a name.')
    if (selected.length < MIN_MEMBERS) {
      return setError(`Pick at least ${MIN_MEMBERS} friends — for one person, use a direct message.`)
    }

    setIsCreating(true)
    try {
      const { data } = await api.post('/api/chat/conversations', {
        participants: selected,
        name: name.trim(),
        isGroup: true,
      })
      addConversation(data)
      setCurrentConversation(data)
      close()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not create the group.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={close}
    >
      <Card
        className="w-full max-w-lg border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-lg text-primary-accent">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">New group</CardTitle>
              <CardDescription>Chat with several friends at once</CardDescription>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="group-name" className="text-sm font-medium text-foreground">
                Group name
              </label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekend plans"
                maxLength={100}
                className="bg-secondary/50 border-border-strong"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-foreground">Members</label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {selected.length} selected
                </span>
              </div>

              {friends.length > 3 && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search friends…"
                    aria-label="Search friends"
                    className="pl-9 h-9 bg-secondary/50 border-border-strong"
                  />
                </div>
              )}

              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {friends.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">
                    Add some friends first — you can only build a group from your friends list.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">
                    No friends match “{query}”.
                  </p>
                ) : (
                  filtered.map((friend) => {
                    const isSelected = selected.includes(friend.userId)
                    return (
                      <button
                        key={friend.userId}
                        type="button"
                        onClick={() => toggle(friend.userId)}
                        aria-pressed={isSelected}
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                          isSelected ? 'bg-primary/15' : 'hover:bg-secondary/60'
                        }`}
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {(friend.name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {friend.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border-strong'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={close} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !name.trim() || selected.length < MIN_MEMBERS}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create group'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
