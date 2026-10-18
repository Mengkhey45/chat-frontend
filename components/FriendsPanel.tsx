'use client'

import { useState } from 'react'
import { useFriendsStore } from '@/store/friendsStore'
import { useUIStore } from '@/store/uiStore'
import { useChatStore } from '@/store/chatStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Plus, UserCheck, UserX, Search, Loader2, MessageCircle, Lock } from 'lucide-react'

export function FriendsPanel() {
  const showFriendsPanel = useUIStore((state) => state.showFriendsPanel)
  const setShowFriendsPanel = useUIStore((state) => state.setShowFriendsPanel)
  const friends = useFriendsStore((state) => state.friends)
  const friendRequests = useFriendsStore((state) => state.friendRequests)
  const acceptFriendRequest = useFriendsStore((state) => state.acceptFriendRequest)
  const rejectFriendRequest = useFriendsStore((state) => state.rejectFriendRequest)
  const removeFriend = useFriendsStore((state) => state.removeFriend)
  const [searchQuery, setSearchQuery] = useState('')
  const [friendCode, setFriendCode] = useState('')
  const [activeTab, setActiveTab] = useState('friends')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineFriends = filteredFriends.filter((f) => f.status === 'online')
  const offlineFriends = filteredFriends.filter((f) => f.status !== 'online')

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await api.put(`/api/chat/friends/request/${requestId}`, { status: 'accepted' })
      acceptFriendRequest(requestId)
      // Refresh friends list and conversations
      const [friendsRes, convRes] = await Promise.all([
        api.get('/api/chat/friends'),
        api.get('/api/chat/conversations')
      ])
      useFriendsStore.getState().setFriends(friendsRes.data)
      const { useChatStore } = await import('@/store/chatStore')
      useChatStore.getState().setConversations(convRes.data)
    } catch (err) {
      console.error('Failed to accept request:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await api.put(`/api/chat/friends/request/${requestId}`, { status: 'rejected' })
      rejectFriendRequest(requestId)
    } catch (err) {
      console.error('Failed to reject request:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleStartChat = async (friendId: string, isSecret = false) => {
    const { conversations, setCurrentConversation, setConversations } = useChatStore.getState()
    const existing = conversations.find(
      (c) => c.type === 'dm' && c.members.includes(friendId) && Boolean(c.isE2EE) === Boolean(isSecret)
    )
    if (existing) {
      setCurrentConversation(existing)
      setShowFriendsPanel(false)
    } else {
      try {
        const res = await api.post('/api/chat/conversations', {
          participants: [friendId],
          isGroup: false,
          isE2EE: isSecret,
        })
        const convRes = await api.get('/api/chat/conversations')
        setConversations(convRes.data)
        const created = convRes.data.find((c: any) => c.id === res.data.id)
        if (created) setCurrentConversation(created)
        setShowFriendsPanel(false)
      } catch (err) {
        console.error('Failed to start chat from friends panel:', err)
      }
    }
  }

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!friendCode.trim()) return
    // In a real app, send friend request via API
    console.log('Add friend:', friendCode)
    setFriendCode('')
  }

  if (!showFriendsPanel) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Friends</CardTitle>
            <CardDescription>Manage your friends and requests</CardDescription>
          </div>
          <button
            onClick={() => setShowFriendsPanel(false)}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger
                value="friends"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Friends
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Requests
                {friendRequests.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {friendRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Add Friend
              </TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent value="friends" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No friends found</p>
                  </div>
                ) : (
                  <>
                    {/* Online Friends */}
                    {onlineFriends.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          Online ({onlineFriends.length})
                        </p>
                        <div className="space-y-1">
                          {onlineFriends.map((friend) => (
                            <div
                              key={friend.userId}
                              className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-between group transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="relative">
                                  <Avatar className="w-9 h-9">
                                    <AvatarImage src={friend.avatar} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                      {(friend.name || '?').charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 status-online rounded-full border-2 border-card" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {friend.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Online</p>
                                </div>
                              </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleStartChat(friend.userId, false)}
                                    title="Start Regular Chat"
                                    className="p-1.5 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleStartChat(friend.userId, true)}
                                    title="Start Secret Chat 🔒 (E2EE)"
                                    className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400"
                                  >
                                    <Lock className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeFriend(friend.userId)}
                                    title="Remove Friend"
                                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Offline Friends */}
                    {offlineFriends.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          Offline ({offlineFriends.length})
                        </p>
                        <div className="space-y-1">
                          {offlineFriends.map((friend) => (
                            <div
                              key={friend.userId}
                              className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-between group transition-colors opacity-75 hover:opacity-100"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="w-9 h-9">
                                  <AvatarImage src={friend.avatar} />
                                  <AvatarFallback className="bg-secondary text-foreground text-xs">
                                    {(friend.name || '?').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {friend.name || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Offline</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartChat(friend.userId, false)}
                                  title="Start Regular Chat"
                                  className="p-1.5 hover:bg-background rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStartChat(friend.userId, true)}
                                  title="Start Secret Chat 🔒 (E2EE)"
                                  className="p-1.5 hover:bg-emerald-500/20 rounded-lg transition-colors text-emerald-400"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeFriend(friend.userId)}
                                  title="Remove Friend"
                                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {friendRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No friend requests</p>
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 rounded-lg bg-secondary flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={request.fromUser.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {(request.fromUser?.name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {request.fromUser.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Wants to be your friend
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={processingId === request.id}
                          className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingId === request.id}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <UserX className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Add Friend Tab */}
            <TabsContent value="add" className="space-y-4">
              <form onSubmit={handleAddFriend} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Friend Code or Username
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter friend code (e.g., user#1234)"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value)}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your friend for the email they signed up with
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Send Friend Request
                </Button>
              </form>

              <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                <p className="text-sm text-accent-blue font-medium mb-2">How to add friends:</p>
                <ol className="text-xs text-accent-blue/80 space-y-1 list-decimal list-inside">
                  <li>Share your friend code with others</li>
                  <li>They can enter your code to send a request</li>
                  <li>Once accepted, they'll appear in your friends list</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
