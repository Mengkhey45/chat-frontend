'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Loader2, AlertTriangle } from 'lucide-react'

/**
 * Landing page for the Google OAuth redirect.
 *
 * The backend has already set the refresh cookie; all this does is exchange it
 * for an access token. Nothing sensitive travels in the URL.
 */
export default function GoogleCallbackPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setToken = useAuthStore((s) => s.setToken)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const exchange = async () => {
      try {
        const { data } = await api.post('/api/auth/refresh')
        if (cancelled) return
        setToken(data.token)
        setUser(data.user)
        router.replace('/chat')
      } catch {
        if (!cancelled) setError('Could not complete Google sign-in.')
      }
    }

    exchange()
    return () => {
      cancelled = true
    }
  }, [router, setToken, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {error ? (
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link href="/login" className="inline-block text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      )}
    </div>
  )
}
