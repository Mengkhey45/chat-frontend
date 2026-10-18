import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <MessageCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Page not found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you are looking for isn&apos;t available or may have moved.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/chat">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Chatly
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
