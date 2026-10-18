'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { withRedirect } from '@/lib/redirect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const redirect = searchParams.get('redirect')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await api.post('/api/auth/verify-email', {
        email,
        code
      })
      setSuccess(true)
      setTimeout(() => {
        router.push(withRedirect('/login', redirect))
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError(null)
    try {
      await api.post('/api/auth/resend-verification', { email })
      alert('New code sent to your email!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <Card className="border-border bg-card text-center py-8">
        <CardContent className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Email Verified!</CardTitle>
          <CardDescription>
            Your account is now active. Redirecting you to login...
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-secondary border-border"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">Verification Code</label>
            <Input
              id="code"
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="bg-secondary border-border text-center tracking-widest text-lg font-bold"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Verify Email'}
          </Button>

          <div className="flex flex-col space-y-2 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={handleResend}
              disabled={isResending || !email}
            >
              {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
            </Button>
            <Link href={withRedirect('/login', redirect)} className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/icon.svg"
            alt="Chatly"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-primary/20 mb-4 inline-block"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Chatly</h1>
        </div>
        
        <Suspense fallback={
          <Card className="border-border bg-card flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </Card>
        }>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  )
}
