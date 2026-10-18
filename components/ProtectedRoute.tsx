'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { bootstrapSession } from '@/lib/api'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const sessionChecked = useAuthStore((s) => s._sessionChecked)
  const started = useRef(false)

  // The access token lives only in memory, so a reload always starts without
  // one. The httpOnly refresh cookie is what actually carries the session
  // across reloads — trade it for a fresh access token before deciding the
  // user is signed out.
  useEffect(() => {
    if (!hasHydrated || sessionChecked || started.current) return
    started.current = true
    void bootstrapSession()
  }, [hasHydrated, sessionChecked])

  useEffect(() => {
    if (!sessionChecked) return
    if (!user || !token) {
      const target = pathname && pathname !== '/chat' ? `?redirect=${encodeURIComponent(pathname)}` : ''
      router.replace(`/login${target}`)
    }
  }, [user, token, sessionChecked, pathname, router])

  if (!sessionChecked || !user || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
