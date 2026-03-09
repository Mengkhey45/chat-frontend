'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Loader2, Check, X } from 'lucide-react'
import Link from 'next/link'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const currentUser = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  const [status, setStatus] = useState<'loading' | 'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [inviterName, setInviterName] = useState('')

  useEffect(() => {
    if (!token) {
      // Not logged in — redirect to login, then come back
      const returnUrl = `/invite/${userId}`
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
      return
    }

    if (currentUser?.id === userId) {
      setStatus('error')
      setMessage("You can't add yourself as a friend!")
      return
    }

    // Try to fetch inviter info
    setStatus('loading')
    api.get(`/api/chat/users/${userId}`)
      .then((res) => {
        setInviterName(res.data.name || res.data.email || 'Someone')
        setStatus('idle')
      })
      .catch(() => {
        setInviterName('Someone')
        setStatus('idle')
      })
  }, [token, userId, currentUser, router])

  const handleAcceptInvite = async () => {
    setStatus('sending')
    try {
      await api.post('/api/chat/friends/request', {
        receiverId: userId,
      })
      setStatus('success')
      setMessage('Friend request sent!')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to send friend request'
      setStatus('error')
      setMessage(errorMsg)
    }
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
              {status === 'loading' ? 'Loading...' : `${inviterName} invited you!`}
            </CardTitle>
            <CardDescription>
              {status === 'success'
                ? 'You can now chat with each other once they accept.'
                : status === 'error'
                  ? message
                  : 'Accept this invite to add them as a friend.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'success' ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-500">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button onClick={() => router.push('/chat')} className="w-full">
                  Go to Chat
                </Button>
              </div>
            ) : status === 'error' ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500">
                  <X className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button onClick={() => router.push('/chat')} variant="outline" className="w-full">
                  Go to Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleAcceptInvite}
                  disabled={status === 'sending' || status === 'loading'}
                  className="w-full"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Accept Invite & Add Friend
                    </>
                  )}
                </Button>
                <div className="text-center">
                  <Link href="/chat" className="text-sm text-muted-foreground hover:text-foreground">
                    Skip and go to chat
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
