'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Loader2, AlertTriangle } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const code = searchParams.get('code')

    const exchange = async () => {
      try {
        let resData: any = null

        if (code) {
          // Direct one-time code exchange (cross-domain safe)
          const { data } = await api.post('/api/auth/google/exchange', { code })
          resData = data
        } else {
          // Fallback to cookie-based refresh
          const { data } = await api.post('/api/auth/refresh')
          resData = data
        }

        if (cancelled) return
        setToken(resData.token)
        setUser(resData.user)
        router.replace('/chat')
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.response?.data?.error || 'Could not complete Google sign-in.'
          setError(msg)
        }
      }
    }

    exchange()
    return () => {
      cancelled = true
    }
  }, [router, searchParams, setToken, setUser])

  if (error) {
    return (
      <div className="text-center space-y-4 max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/login" className="inline-block text-sm text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in with Google…</p>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
