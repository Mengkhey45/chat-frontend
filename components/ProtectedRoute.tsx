'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, token, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage before checking auth
    if (!_hasHydrated) return

    if (!user || !token) {
      router.push('/login')
    }
  }, [user, token, _hasHydrated, router])

  // Show loading while hydrating or while redirecting
  if (!_hasHydrated || !user || !token) {
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
