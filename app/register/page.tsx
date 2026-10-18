'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { withRedirect } from '@/lib/redirect'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { setLoading, setError, isLoading, error } = useAuthStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setLoading(true)
    setError(null)

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const response = await api.post('/api/auth/signup', {
        name: username,
        email,
        password
      })

      setIsSuccess(true)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        (err.message && !err.message.includes('status code') && !err.message.includes('Network Error')
          ? err.message
          : 'Unable to create your account. Please check your details and try again.')
      setLocalError(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 p-8 bg-card border border-border rounded-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Check your email</h1>
            <p className="text-muted-foreground mb-8">
              We've sent a verification code to <span className="font-semibold text-foreground">{email}</span>. 
              Please verify your account to continue.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href={withRedirect(`/verify?email=${encodeURIComponent(email)}`, redirect)}>Verify Account</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={withRedirect('/login', redirect)}>Back to Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleGoogleSignIn = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
    window.location.href = `${backendUrl}/api/auth/google`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <img
            src="/icon.svg"
            alt="Chatly"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-primary/20 mb-4 inline-block"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Chatly</h1>
          <p className="text-muted-foreground">Join our community and start chatting</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full bg-secondary/40 hover:bg-secondary border-border text-foreground flex items-center justify-center gap-3 py-5 font-medium transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {(localError || error) && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {localError || error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href={withRedirect('/login', redirect)} className="text-primary hover:text-primary/80 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
