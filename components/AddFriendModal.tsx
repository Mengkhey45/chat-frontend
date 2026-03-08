'use client'

import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, 
  UserPlus, 
  Link as LinkIcon, 
  QrCode, 
  Mail, 
  Copy, 
  Check,
  Send
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import axios from 'axios'

export function AddFriendModal() {
  const showAddFriendModal = useUIStore((state) => state.showAddFriendModal)
  const setShowAddFriendModal = useUIStore((state) => state.setShowAddFriendModal)
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState('username')
  const [friendName, setFriendName] = useState('')
  const [gmailAddress, setGmailAddress] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  if (!showAddFriendModal || !user) return null

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${user.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleAddByName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!friendName.trim()) return
    
    setIsLoading(true)
    setStatus(null)
    try {
      // Endpoint expected to handle friend requests by name or email
      await axios.post('/api/chat/friends/request', { 
        receiverEmail: friendName.includes('@') ? friendName : undefined,
        receiverName: !friendName.includes('@') ? friendName : undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setStatus({ type: 'success', message: 'Friend request sent!' })
      setFriendName('')
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to send request' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGmailInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gmailAddress.trim()) return
    
    const subject = encodeURIComponent('Join me on Discord Chat!')
    const body = encodeURIComponent(`Hey! I want to invite you to join me on Discord Chat. Click here to sign up: ${inviteLink}`)
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${gmailAddress}&su=${subject}&body=${body}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-border bg-card shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Add a Friend</CardTitle>
              <CardDescription>Grow your circle and start chatting</CardDescription>
            </div>
          </div>
          <button
            onClick={() => setShowAddFriendModal(false)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1 h-auto">
              <TabsTrigger value="username" className="py-2 gap-2 flex-col md:flex-row">
                <UserPlus className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">User</span>
              </TabsTrigger>
              <TabsTrigger value="link" className="py-2 gap-2 flex-col md:flex-row">
                <LinkIcon className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Link</span>
              </TabsTrigger>
              <TabsTrigger value="qr" className="py-2 gap-2 flex-col md:flex-row">
                <QrCode className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">QR</span>
              </TabsTrigger>
              <TabsTrigger value="gmail" className="py-2 gap-2 flex-col md:flex-row">
                <Mail className="w-4 h-4" />
                <span className="text-[10px] md:text-xs">Gmail</span>
              </TabsTrigger>
            </TabsList>

            {/* By Username */}
            <TabsContent value="username" className="space-y-4">
              <form onSubmit={handleAddByName} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Friend's Name or Email</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. John Doe or friend@gmail.com"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                    <Button type="submit" disabled={isLoading || !friendName.trim()}>
                      {isLoading ? '...' : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {status && (
                  <div className={`p-3 rounded-lg text-sm ${
                    status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {status.message}
                  </div>
                )}
              </form>
            </TabsContent>

            {/* Invite Link */}
            <TabsContent value="link" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Personal Invite Link</label>
                <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground flex-1 truncate">{inviteLink}</span>
                  <Button size="sm" onClick={handleCopyLink} variant="secondary" className="gap-2">
                    {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  This link allows anyone to send you a friend request directly.
                </p>
              </div>
            </TabsContent>

            {/* QR Code */}
            <TabsContent value="qr" className="space-y-4 flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-inner">
                <QRCodeSVG value={inviteLink} size={180} />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-[250px]">
                Show this code to a friend so they can scan it with their phone camera.
              </p>
            </TabsContent>

            {/* Gmail Invite */}
            <TabsContent value="gmail" className="space-y-4">
              <form onSubmit={handleGmailInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Send Email Invitation</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="friend@gmail.com"
                      value={gmailAddress}
                      onChange={(e) => setGmailAddress(e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                    <Button type="submit" variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-white">
                      <Mail className="w-4 h-4" />
                      Gmail
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
                  <p className="text-xs text-accent-blue">
                    This will open Gmail in a new tab with a pre-written invitation message and your personal link.
                  </p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
