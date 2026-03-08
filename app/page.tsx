'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function Home() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // If user is logged in, go to chat, otherwise go to login
    if (user) {
      router.push('/chat')
    } else {
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
