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
import { HeraGradientBackground } from '@/components/hera/shared/HeraGradientBackground'
import { HeraCard } from '@/components/hera/shared/HeraCard'
import { HERA_THEME_COLORS } from '@/lib/constants/hera-theme-colors'
import { getRoleRedirectPath, getRoleDisplayName, type AppRole } from '@/lib/auth/role-normalizer'
import { useLoadingStore } from '@/lib/stores/loading-store'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, organizations, availableApps, defaultApp, currentApp } = useHERAAuth()
  const { startLoading, updateProgress, reset } = useLoadingStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const returnTo = searchParams.get('return_to')

  // ✅ Reset global loading on mount (in case of back navigation)
  useEffect(() => {
    reset()
  }, [reset])

  // Log available apps for testing
  useEffect(() => {
    if (isAuthenticated && availableApps.length > 0) {
      console.log('🎯 Available Apps:', availableApps)
      console.log('⭐ Default App:', defaultApp)
      console.log('📍 Current App:', currentApp)
    }
  }, [isAuthenticated, availableApps, defaultApp, currentApp])

  // ✅ REMOVED: Auto-redirect useEffect (now handled synchronously in handleSubmit)
  // Redirect now happens immediately after login with role-based routing via getRoleRedirectPath()

  const handleDemoLogin = async () => {
    setError(null)
    setIsLoading(true)
    setEmail('demo@heraerp.com')
    setPassword('demo2025!')

    try {
      // ✅ ENTERPRISE: Use HERAAuthProvider login (synchronous, returns role data)
      const result = await login('demo@heraerp.com', 'demo2025!', { clearFirst: true })

      console.log('✅ Demo login successful, received data:', {
        role: result.role,
        organizationId: result.organizationId,
        userEntityId: result.userEntityId,
        organizations: result.membershipData?.organizations
      })

      // ✅ ENTERPRISE: Validate user has organizations (from membershipData, not context)
      const userOrganizations = result.membershipData?.organizations || []
      if (userOrganizations.length === 0) {
        setError('No organizations found for demo account. Please contact support.')
        setIsLoading(false)
        return
      }

      // ✅ CRITICAL: Check for multiple organizations - let user choose
      if (userOrganizations.length > 1) {
        console.log('📋 Multiple organizations detected for demo user, redirecting to selector', {
          organizationCount: userOrganizations.length,
          organizations: userOrganizations.map(org => ({ id: org.id, name: org.name }))
        })
        setIsLoading(false)
        router.push('/auth/organizations')
        return
      }

      // ✅ ENTERPRISE: Get apps from first organization
      const firstOrg = userOrganizations[0]
      const userApps = firstOrg?.apps || []

      if (userApps.length === 0) {
        // ✅ ENTERPRISE: Redirect to app store for purchase
        console.log('No apps available for demo account, redirecting to app store...')
        setError(`No applications available for ${firstOrg?.name || 'your organization'}.`)
        setIsLoading(false)

        // Redirect to app store after brief delay
        setTimeout(() => {
          router.push('/apps?mode=store')
        }, 2000)
        return
      }

      // ✅ ENTERPRISE: Detect app context from user's apps
      const appCode = userApps[0].code.toLowerCase()

      // ✅ ENTERPRISE: Use role-based redirect helper with app context
      const role = result.role as AppRole
      const redirectPath = getRoleRedirectPath(role, appCode as any)

      // Get app-aware display name
      const displayName = getRoleDisplayName(role, appCode as any)

      console.log('✅ Demo multi-app role-based redirect:', {
        role,
        app: appCode,
        path: redirectPath,
        displayName,
        source: 'Demo login with getRoleRedirectPath()'
      })

      // ⚡ ENTERPRISE LOADING EXPERIENCE - Use global loading overlay
      startLoading(`Welcome! Authenticating as ${displayName}...`, 'Verifying credentials and permissions...')

      // Smooth progress animation (0-60% during navigation)
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += 10
        if (currentProgress <= 60) {
          updateProgress(currentProgress)
        } else {
          clearInterval(progressInterval)
        }
      }, 50)

      // Navigate to dashboard (global loading will continue)
      setTimeout(async () => {
        updateProgress(70, undefined, 'Configuring your workspace...')

        // ✅ Use router.push with initializing flag
        await router.push(redirectPath + '?initializing=true')
      }, 300)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // ✅ ENTERPRISE: Use HERAAuthProvider login (synchronous, returns role data)
      const result = await login(email, password, { clearFirst: true })

      console.log('✅ Login successful, received data:', {
        role: result.role,
        organizationId: result.organizationId,
        userEntityId: result.userEntityId,
        organizations: result.membershipData?.organizations
      })

      // ✅ ENTERPRISE: Validate user has organizations (from membershipData, not context)
      const userOrganizations = result.membershipData?.organizations || []
      if (userOrganizations.length === 0) {
        setError('No organizations found for your account. Please contact support.')
        setIsLoading(false)
        return
      }

      // ✅ CRITICAL: Check for multiple organizations - let user choose
      if (userOrganizations.length > 1) {
        console.log('📋 Multiple organizations detected, redirecting to selector', {
          organizationCount: userOrganizations.length,
          organizations: userOrganizations.map(org => ({ id: org.id, name: org.name }))
        })
        setIsLoading(false)
        router.push('/auth/organizations')
        return
      }

      // ✅ ENTERPRISE: Get apps from first organization
      const firstOrg = userOrganizations[0]
      const userApps = firstOrg?.apps || []

      if (userApps.length === 0) {
        // ✅ ENTERPRISE: Redirect to app store for purchase
        console.log('No apps available, redirecting to app store...')
        setError(`No applications available for ${firstOrg?.name || 'your organization'}.`)
        setIsLoading(false)

        // Redirect to app store after brief delay
        setTimeout(() => {
          router.push('/apps?mode=store')
        }, 2000)
        return
      }

      // ✅ ENTERPRISE: Detect app context from user's apps
      const appCode = userApps[0].code.toLowerCase()

      // ✅ ENTERPRISE: Use role-based redirect helper with app context
      const role = result.role as AppRole
      const redirectPath = getRoleRedirectPath(role, appCode as any)

      // Get app-aware display name
      const displayName = getRoleDisplayName(role, appCode as any)

      console.log('✅ Multi-app role-based redirect:', {
        role,
        app: appCode,
        path: redirectPath,
        displayName,
        source: 'getRoleRedirectPath() with app context'
      })

      // ⚡ ENTERPRISE LOADING EXPERIENCE - Use global loading overlay
      // This will persist across the route change for seamless UX
      startLoading(`Welcome! Authenticating as ${displayName}...`, 'Verifying credentials and permissions...')

      // Smooth progress animation (0-60% during navigation)
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += 10
        if (currentProgress <= 60) {
          updateProgress(currentProgress)
        } else {
          clearInterval(progressInterval)
        }
      }, 50)

      // Navigate to dashboard (global loading will continue)
      setTimeout(async () => {
        updateProgress(70, undefined, 'Configuring your workspace...')

        // ✅ Use router.push with initializing flag
        // Dashboard will continue progress to 100% then hide overlay
        await router.push(redirectPath + '?initializing=true')
      }, 300)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* HERA Gradient Background - subtle static orbs only */}
      <HeraGradientBackground enableMouseTracking={false} enableAnimatedOverlay={false} enableStaticOrbs={true} />

      {/* Scrollable Content Container */}
      <div className="relative z-10 min-h-screen">
        {/* Main Content */}
        <div className="w-full">
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
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                          {/* Enterprise-grade email icon with solid fill */}
                          <svg className="w-5 h-5 text-indigo-500 group-focus-within:text-indigo-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                          </svg>
                        </div>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@company.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          autoComplete="email"
                          className="pl-12 h-14 text-base bg-background dark:bg-muted border-indigo-500/30 dark:border-indigo-500/30 text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all rounded-lg"
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
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                          {/* Enterprise-grade lock icon with solid fill */}
                          <svg className="w-5 h-5 text-purple-500 group-focus-within:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                          </svg>
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          autoComplete="current-password"
                          className="pl-12 pr-12 h-14 text-base bg-background dark:bg-muted border-purple-500/30 dark:border-purple-500/30 text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors p-1"
                        >
                          {showPassword ? (
                            /* Enterprise-grade eye-off icon with solid fill */
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                            </svg>
                          ) : (
                            /* Enterprise-grade eye icon with solid fill */
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
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

            {/* Enhanced Enterprise features - Matching /organizations style */}
            <div className="mt-8 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Uptime SLA Card */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-xl group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all duration-300" />
                  <div className="relative card-glass p-4 rounded-xl border border-border hover:border-cyan-500/30 transition-all duration-300 h-full min-h-[90px] flex flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-1">
                        99.9%
                      </div>
                      <div className="text-[10px] ink-muted uppercase tracking-wider font-medium">Uptime SLA</div>
                    </div>
                  </div>
                </div>

                {/* SOC 2 Certified Card */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-xl group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-300" />
                  <div className="relative card-glass p-4 rounded-xl border border-border hover:border-purple-500/30 transition-all duration-300 h-full min-h-[90px] flex flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
                        SOC 2
                      </div>
                      <div className="text-[10px] ink-muted uppercase tracking-wider font-medium">Certified</div>
                    </div>
                  </div>
                </div>

                {/* 24/7 Support Card */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl blur-xl group-hover:from-emerald-500/20 group-hover:to-teal-500/20 transition-all duration-300" />
                  <div className="relative card-glass p-4 rounded-xl border border-border hover:border-emerald-500/30 transition-all duration-300 h-full min-h-[90px] flex flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-1">
                        24/7
                      </div>
                      <div className="text-[10px] ink-muted uppercase tracking-wider font-medium">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CentralLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 relative flex items-center justify-center">
          {/* Force full viewport background */}
          <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 -z-20" />
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 card-glass backdrop-blur-xl rounded-2xl mb-4 shadow-xl border border-border">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            </div>
            <p className="ink-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
