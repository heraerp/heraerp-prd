'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { DemoModuleSelector } from '@/components/demo/DemoModuleSelector'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, organizations, availableApps, defaultApp, currentApp } = useHERAAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const returnTo = searchParams.get('return_to')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && organizations !== null) {
      const redirectUrl = localStorage.getItem('redirectAfterLogin')
      const isDemoLogin = sessionStorage.getItem('isDemoLogin') === 'true'

      // Check if this is a demo login
      if (isDemoLogin) {
        const demoModule = sessionStorage.getItem('demoModule') || 'furniture'
        sessionStorage.removeItem('isDemoLogin')
        sessionStorage.removeItem('demoModule')
        router.push(`/${demoModule}`)
        return
      }

      // Check if user has any organizations
      if (organizations.length === 0) {
        // New user - redirect to create organization
        router.push('/auth/organizations/new')
      } else if (organizations.length === 1) {
        // Single organization - go to apps
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin')
          router.push(redirectUrl)
        } else if (returnTo) {
          router.push(returnTo)
        } else {
          router.push('/apps')
        }
      } else {
        // Multiple organizations - let them choose
        router.push('/auth/organizations')
      }
    }
  }, [isAuthenticated, organizations, returnTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // For Hair Talkz domain users, handle special routing
      if (email.includes('@hairtalkz.com') || email.includes('michele')) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (authError) {
          setError(authError.message)
          return
        }

        if (data.user) {
          console.log('✅ Hair Talkz user authenticated, redirecting to salon dashboard')
          router.push('/salon/dashboard')
          return
        }
      }

      // For other users, use HERA Universal Auth
      const result = await signIn(email, password)
      if (!result.success) {
        setError(result.error || 'Login failed')
        return
      }
      // Redirect will be handled by useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 w-full relative overflow-auto">
      {/* Force full viewport background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 -z-20" />
      {/* Animated background gradients - match partners page style */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Large floating gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/15 to-cyan-400/10 rounded-full blur-3xl animate-float-glow" />
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/15 to-pink-400/10 rounded-full blur-3xl animate-float-glow animation-delay-2000" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/15 to-violet-400/10 rounded-full blur-3xl animate-pulse-glow animation-delay-4000" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-rose-500/15 to-amber-400/10 rounded-full blur-3xl animate-pulse-glow animation-delay-1000" />
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-cyan-500/15 to-emerald-400/10 rounded-full blur-3xl animate-float-glow animation-delay-3000" />
        <div className="absolute -bottom-40 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-violet-500/15 to-purple-400/10 rounded-full blur-3xl animate-float-glow animation-delay-5000" />

        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-pink-500/8 animate-gradient-shift" />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <Navbar />
      </div>

      {/* Scrollable Content Container */}
      <div className="relative z-10 flex flex-col">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-md mx-auto px-4 py-6 sm:py-8">
            {/* Welcome Badge */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm shadow-lg mb-4">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 dark:text-indigo-300 text-sm font-semibold tracking-wide">
                  BETA • Invited Customers Only
                </span>
              </div>
            </div>

            {/* Sign In / Demo Tabs */}
            <div className="mb-8">
              <div className="flex rounded-xl card-glass border border-border p-1">
                <button className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-sm font-medium text-white">
                  Sign In
                </button>
                <button
                  onClick={() =>
                    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium ink-muted hover:text-white hover:bg-white/5 transition-all"
                >
                  Try Demo
                </button>
              </div>
            </div>

            {/* Enhanced Glassmorphic login card */}
            <div className="relative group mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-2xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
              <Card className="relative card-glass backdrop-blur-xl border border-indigo-500/20 shadow-2xl">
                <CardHeader className="text-center pb-4 pt-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-sm ink-muted mt-2">
                    Enter your credentials to access your dashboard
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert
                        variant="destructive"
                        className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium ink">
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary dark:group-focus-within:text-blue-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@company.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          autoComplete="email"
                          className="pl-12 h-14 text-base bg-background dark:bg-muted border-input dark:border-input text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium ink">
                          Password
                        </Label>
                        <Link
                          href="/auth/forgot-password"
                          className="text-sm font-medium text-indigo-400 hover:text-purple-400 transition-colors"
                        >
                          Forgot?
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary dark:group-focus-within:text-blue-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          autoComplete="current-password"
                          className="pl-12 pr-12 h-14 text-base bg-background dark:bg-muted border-input dark:border-input text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground dark:hover:text-slate-300 transition-colors p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all rounded-xl border border-indigo-500/20"
                        disabled={isLoading || !email || !password}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ChevronRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <span className="text-sm ink-muted">
                        Don't have an account?{' '}
                        <Link
                          href="/auth/signup"
                          className="font-semibold text-indigo-400 hover:text-purple-400 transition-colors"
                        >
                          Sign up
                        </Link>
                      </span>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Demo Section */}
            <div id="demo-section" className="mt-16 mb-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-4">
                  <span className="text-emerald-400 text-sm font-medium">🎮 Interactive Demos</span>
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-3">
                  Experience HERA
                </h2>
                <p className="text-base ink-muted max-w-md mx-auto">
                  Explore fully-functional industry solutions with sample data. No signup required.
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-2xl blur-xl" />
                <div className="relative card-glass rounded-2xl p-6 border border-emerald-500/20">
                  <DemoModuleSelector />
                </div>
              </div>
            </div>

            {/* Enhanced Enterprise features */}
            <div className="mt-12 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all" />
                  <div className="relative card-glass rounded-2xl p-6 border border-border text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                      99.9%
                    </div>
                    <div className="text-xs ink-muted mt-1 uppercase tracking-wider">
                      Uptime SLA
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all" />
                  <div className="relative card-glass rounded-2xl p-6 border border-border text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      SOC 2
                    </div>
                    <div className="text-xs ink-muted mt-1 uppercase tracking-wider">Certified</div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all" />
                  <div className="relative card-glass rounded-2xl p-6 border border-border text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                      24/7
                    </div>
                    <div className="text-xs ink-muted mt-1 uppercase tracking-wider">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <Footer showGradient={false} />
      </div>
    </div>
  )
}

export default function CentralLoginPage() {
  // Override body background for this page
  useEffect(() => {
    const originalBackground = document.body.style.background
    const originalMargin = document.body.style.margin
    const originalPadding = document.body.style.padding

    document.body.style.background =
      'linear-gradient(to bottom right, rgb(2 6 23), rgb(15 23 42), rgb(30 58 138 / 0.2))'
    document.body.style.margin = '0'
    document.body.style.padding = '0'

    return () => {
      document.body.style.background = originalBackground
      document.body.style.margin = originalMargin
      document.body.style.padding = originalPadding
    }
  }, [])

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 relative">
          {/* Force full viewport background */}
          <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 -z-20" />
          <div className="relative z-10">
            <Navbar />
          </div>
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 card-glass backdrop-blur-xl rounded-2xl mb-4 shadow-xl border border-border">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              </div>
              <p className="ink-muted">Loading...</p>
            </div>
          </div>
          <div className="relative z-10">
            <Footer showGradient={false} />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
