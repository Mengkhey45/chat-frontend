'use client'

import { useState, useRef } from 'react'
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
  Send,
  Download
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '@/lib/api'

export function AddFriendModal() {
  const showAddFriendModal = useUIStore((state) => state.showAddFriendModal)
  const setShowAddFriendModal = useUIStore((state) => state.setShowAddFriendModal)
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState('username')
  const [friendName, setFriendName] = useState('')
  const [gmailAddress, setGmailAddress] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isQRCopied, setIsQRCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  if (!showAddFriendModal || !user) return null

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${user.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleCopyQRImage = async () => {
    const canvas = qrCanvasRef.current
    if (!canvas) return

    try {
      if (typeof window !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        canvas.toBlob(async (blob) => {
          if (!blob) return
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ])
            setIsQRCopied(true)
            setTimeout(() => setIsQRCopied(false), 2000)
          } catch (err) {
            // Fallback: copy link if image clipboard access is restricted
            await navigator.clipboard.writeText(inviteLink)
            setIsQRCopied(true)
            setTimeout(() => setIsQRCopied(false), 2000)
          }
        }, 'image/png')
      } else {
        await navigator.clipboard.writeText(inviteLink)
        setIsQRCopied(true)
        setTimeout(() => setIsQRCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy QR code image:', err)
    }
  }

  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current
    if (!canvas) return

    const imageUri = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = imageUri
    const safeName = (user.name || 'chatly').toLowerCase().replace(/[^a-z0-9]/g, '_')
    link.download = `${safeName}_chatly_qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddByName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!friendName.trim()) return
    
    setIsLoading(true)
    setStatus(null)
    try {
      // Endpoint expected to handle friend requests by name or email
      await api.post('/api/chat/friends/request', {
        receiverEmail: friendName.includes('@') ? friendName : undefined,
        receiverName: !friendName.includes('@') ? friendName : undefined,
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
    
    const subject = encodeURIComponent('Join me on Chatly')
    const body = encodeURIComponent(`Hey! Join me on Chatly so we can chat. Sign up here: ${inviteLink}`)
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
              <div className="p-4 bg-white rounded-2xl shadow-md border border-border/20 flex flex-col items-center justify-center">
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={inviteLink}
                  size={180}
                  marginSize={2}
                  level="M"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-sm">
                <Button
                  size="sm"
                  onClick={handleCopyQRImage}
                  className="gap-2 flex-1 min-w-[140px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all"
                >
                  {isQRCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {isQRCopied ? 'Copied QR Image!' : 'Copy QR Image'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadQR}
                  className="gap-2 flex-1 min-w-[130px] border-border bg-secondary hover:bg-secondary/80 text-foreground"
                >
                  <Download className="w-4 h-4" />
                  Save Image
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center max-w-[280px] leading-relaxed">
                Scan with a phone camera, or copy the image to paste directly into Discord, WhatsApp, or Telegram.
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
