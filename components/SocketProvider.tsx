'use client'

import { useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/store/authStore'
import { usePreferencesStore } from '@/store/preferencesStore'

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const user = useAuthStore((state) => state.user)
  const { setStatus, isConnected } = useSocket()
  const shareOnlineStatus = usePreferencesStore((s) => s.shareOnlineStatus)

  // Announce presence once the socket is actually up. Emitting on mount alone
  // raced the connection and the first `online` was frequently dropped.
  useEffect(() => {
    if (!user || !isConnected) return

    // "Show when you're online" off means this client reports offline and stops
    // tracking visibility, rather than the setting being decorative.
    if (!shareOnlineStatus) {
      setStatus('offline')
      return
    }

    setStatus('online')

    const handleVisibilityChange = () => {
      setStatus(document.hidden ? 'away' : 'online')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, isConnected, setStatus, shareOnlineStatus])

  return <>{children}</>
}
