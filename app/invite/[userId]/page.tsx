'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Loader2, Check, X, Users } from 'lucide-react'
import Link from 'next/link'

type FriendStatus = {
  status: 'none' | 'pending' | 'accepted' | 'rejected'
  direction?: 'incoming' | 'outgoing'
  requestId?: string
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const currentUser = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  const [pageState, setPageState] = useState<'loading' | 'idle' | 'sending' | 'success' | 'error' | 'already-friends'>('loading')
  const [message, setMessage] = useState('')
  const [inviterName, setInviterName] = useState('')
  const [friendStatus, setFriendStatus] = useState<FriendStatus>({ status: 'none' })

  useEffect(() => {
    if (!token) {
      const returnUrl = `/invite/${userId}`
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
      return
    }

    if (currentUser?.id === userId) {
      setPageState('error')
      setMessage("You can't add yourself as a friend!")
      return
    }

    const fetchStatus = async () => {
      setPageState('loading')
      try {
        // Fetch user info and friend status in parallel
        const [userRes, statusRes] = await Promise.all([
          api.get(`/api/chat/users/${userId}`).catch(() => null),
          api.get(`/api/chat/friends/status/${userId}`).catch(() => null)
        ])

        if (userRes?.data) {
          setInviterName(userRes.data.name || userRes.data.email || 'Someone')
        } else {
          setInviterName('Someone')
        }

        if (statusRes?.data) {
          setFriendStatus(statusRes.data)
          if (statusRes.data.status === 'accepted') {
            setPageState('already-friends')
          } else {
            setPageState('idle')
          }
        } else {
          setPageState('idle')
        }
      } catch {
        setInviterName('Someone')
        setPageState('idle')
      }
    }

    fetchStatus()
  }, [token, userId, currentUser, router])

  const handleSendRequest = async () => {
    setPageState('sending')
    try {
      await api.post('/api/chat/friends/request', { receiverId: userId })
      setPageState('success')
      setMessage('Friend request sent!')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to send friend request'
      setPageState('error')
      setMessage(errorMsg)
    }
  }

  const handleAccept = async () => {
    if (!friendStatus.requestId) return
    setPageState('sending')
    try {
      await api.put(`/api/chat/friends/request/${friendStatus.requestId}`, { status: 'accepted' })
      setPageState('success')
      setMessage('Friend request accepted! You can now chat.')
    } catch (err: any) {
      setPageState('error')
      setMessage(err.response?.data?.error || 'Failed to accept request')
    }
  }

  const handleDeny = async () => {
    if (!friendStatus.requestId) return
    setPageState('sending')
    try {
      await api.put(`/api/chat/friends/request/${friendStatus.requestId}`, { status: 'rejected' })
      setPageState('success')
      setMessage('Friend request declined.')
    } catch (err: any) {
      setPageState('error')
      setMessage(err.response?.data?.error || 'Failed to decline request')
    }
  }

  const renderContent = () => {
    if (pageState === 'loading') {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (pageState === 'success') {
      return (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-500">
            <Check className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={() => router.push('/chat')} className="w-full">
            Go to Chat
          </Button>
        </div>
      )
    }

    if (pageState === 'error') {
      return (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500">
            <X className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={() => router.push('/chat')} variant="outline" className="w-full">
            Go to Chat
          </Button>
        </div>
      )
    }

    if (pageState === 'already-friends') {
      return (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-500">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground">You&apos;re already friends with {inviterName}!</p>
          <Button onClick={() => router.push('/chat')} className="w-full">
            Go to Chat
          </Button>
        </div>
      )
    }

    // Incoming pending request — show Accept / Deny
    if (friendStatus.status === 'pending' && friendStatus.direction === 'incoming') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {inviterName} sent you a friend request. Would you like to accept?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={pageState === 'sending'}
              className="flex-1"
            >
              {pageState === 'sending' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Accept
            </Button>
            <Button
              onClick={handleDeny}
              disabled={pageState === 'sending'}
              variant="destructive"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Deny
            </Button>
          </div>
          <div className="text-center">
            <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground">
              Skip and go to chat
            </Link>
          </div>
        </div>
      )
    }

    // Outgoing pending request — already sent
    if (friendStatus.status === 'pending' && friendStatus.direction === 'outgoing') {
      return (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ve already sent a friend request to {inviterName}. Waiting for them to respond.
          </p>
          <Button onClick={() => router.push('/chat')} variant="outline" className="w-full">
            Go to Chat
          </Button>
        </div>
      )
    }

    // No existing relationship — send request
    return (
      <div className="space-y-4">
        <Button
          onClick={handleSendRequest}
          disabled={pageState === 'sending'}
          className="w-full"
        >
          {pageState === 'sending' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Request...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Accept Invite &amp; Add Friend
            </>
          )}
        </Button>
        <div className="text-center">
          <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground">
            Skip and go to chat
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <UserPlus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Friend Invite</h1>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>
              {pageState === 'loading' ? 'Loading...' : `${inviterName} invited you!`}
            </CardTitle>
            <CardDescription>
              {friendStatus.status === 'pending' && friendStatus.direction === 'incoming'
                ? 'You have a pending friend request to respond to.'
                : pageState === 'already-friends'
                  ? 'You\'re already connected!'
                  : 'Accept this invite to add them as a friend.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
