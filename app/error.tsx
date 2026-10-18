'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, MessageCircle } from 'lucide-react'

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error internally without exposing scary technical jargon to the user
    console.error('[Chatly App Boundary]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <MessageCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Something went slightly off-track</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We ran into an unexpected hiccup loading this screen. Don&apos;t worry, your messages and account are safe.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/chat'}
            className="border-border hover:bg-secondary"
          >
            Return to Chats
          </Button>
        </div>
      </div>
    </div>
  )
}
