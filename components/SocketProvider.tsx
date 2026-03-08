'use client'

import { useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/store/authStore'

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const user = useAuthStore((state) => state.user)
  const { connect, disconnect, setStatus } = useSocket()

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (user) {
      connect()
      setStatus('online')

      // Handle page visibility for away status
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setStatus('away')
        } else {
          setStatus('online')
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [user, connect, setStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect - keep connection for other windows
    }
  }, [])

  return <>{children}</>
}
