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
import { AppSwitcher } from '@/components/navigation/AppSwitcher'
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const returnTo = searchParams.get('return_to')

  // Mouse movement tracking for gradient effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Log available apps for testing
  useEffect(() => {
    if (isAuthenticated && availableApps.length > 0) {
      console.log('🎯 Available Apps:', availableApps)
      console.log('⭐ Default App:', defaultApp)
      console.log('📍 Current App:', currentApp)
    }
  }, [isAuthenticated, availableApps, defaultApp, currentApp])

  // Redirect if already authenticated with smart app-based routing
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
        return
      }

      // 🚀 SMART APP-BASED ROUTING
      console.log('🎯 Smart routing with apps:', availableApps)

      // Priority 1: If there's a specific redirect URL, use it
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin')
        router.push(redirectUrl)
        return
      }

      // Priority 2: If there's a return_to parameter, use it
      if (returnTo) {
        router.push(returnTo)
        return
      }

      // Priority 3: If only ONE app is available, redirect to that app's dashboard
      if (availableApps && availableApps.length === 1) {
        const appCode = availableApps[0].code.toLowerCase()
        console.log('🚀 Only one app available, auto-redirecting to:', `/${appCode}/dashboard`)
        router.push(`/${appCode}/dashboard`)
        return
      }

      // Priority 4: If defaultApp is set, redirect to default app's dashboard
      if (defaultApp && availableApps && availableApps.length > 0) {
        const appCode = defaultApp.toLowerCase()
        console.log('🚀 Using default app:', `/${appCode}/dashboard`)
        router.push(`/${appCode}/dashboard`)
        return
      }

      // Priority 5: If multiple apps, show app selector
      if (availableApps && availableApps.length > 1) {
        console.log('📋 Multiple apps available, showing selector')
        router.push('/apps')
        return
      }

      // Fallback: Multiple organizations - let them choose
      if (organizations.length > 1) {
        router.push('/auth/organizations')
        return
      }

      // Final fallback: Show apps page
      router.push('/apps')
    }
  }, [isAuthenticated, organizations, returnTo, router, availableApps, defaultApp, currentApp])

  const handleDemoLogin = async () => {
    setError(null)
    setIsLoading(true)
    setEmail('demo@heraerp.com')
    setPassword('demo2025!')

    try {
      await login('demo@heraerp.com', 'demo2025!')
      // Redirect will be handled by useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
    } finally {
      setIsLoading(false)
    }
  }

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

      // For other users, use normal auth flow
      await login(email, password)
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

      {/* Enhanced animated background gradients with mouse tracking */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Large floating gradient orbs with mouse-reactive positioning */}
        <div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 to-purple-500/15 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        />
        <div
          className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/20 to-blue-500/15 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${-mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`
          }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/15 to-pink-500/10 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.025}px, ${-mousePosition.y * 0.02}px)`
          }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.025}px)`
          }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-br from-blue-500/15 to-indigo-500/10 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.018}px, ${mousePosition.y * 0.018}px)`
          }}
        />
        <div
          className="absolute -bottom-40 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-violet-500/15 to-purple-500/10 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${-mousePosition.x * 0.022}px, ${mousePosition.y * 0.022}px)`
          }}
        />

        {/* Animated gradient overlay with subtle pulse */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-purple-500/8 to-cyan-500/8 animate-gradient-shift" />
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
            {/* Welcome Badge with fade-in animation */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm shadow-lg mb-4">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 dark:text-indigo-300 text-sm font-semibold tracking-wide">
                  Enterprise-Grade Authentication
                </span>
              </div>
            </div>

            {/* Enhanced Glassmorphic login card with animations */}
            <div className="relative group mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-2xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500" />
              <Card className="relative card-glass backdrop-blur-xl border border-indigo-500/20 shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-500">
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

                    {/* Demo Login Button */}
                    <div className="relative mt-8 pt-6 border-t border-border">
                      <div className="text-center mb-4">
                        <span className="text-xs ink-muted uppercase tracking-wider">Quick Access</span>
                      </div>
                      <button
                        onClick={handleDemoLogin}
                        disabled={isLoading}
                        className="w-full h-12 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                      >
                        {isLoading && email === 'demo@heraerp.com' ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Logging in as Demo...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg">🚀</span>
                            <span>Login as Demo User</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                      <p className="text-xs text-center ink-muted mt-2">
                        Explore HERA with full access • No signup required
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Debug: Show Available Apps After Login */}
            {isAuthenticated && availableApps.length > 0 && (
              <div className="mt-8 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-xl" />
                  <Card className="relative card-glass backdrop-blur-xl border border-emerald-500/20">
                    <CardHeader>
                      <CardTitle className="text-xl text-emerald-400">
                        🎯 Available Apps ({availableApps.length})
                      </CardTitle>
                      <CardDescription className="text-sm ink-muted">
                        Default: {defaultApp || 'None'} | Current: {currentApp || 'None'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-white mb-2">App Switcher:</h3>
                          <AppSwitcher />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white mb-2">App Details:</h3>
                          <div className="space-y-2">
                            {availableApps.map(app => (
                              <div
                                key={app.code}
                                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-white">{app.name}</p>
                                    <p className="text-xs text-slate-400">Code: {app.code}</p>
                                  </div>
                                  {defaultApp === app.code && (
                                    <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Enhanced Enterprise features */}
            <div className="mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
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
