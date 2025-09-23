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
import {
  Loader2,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  Shield,
  Building2,
  ChevronRight
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { DemoModuleSelector } from '@/components/demo/DemoModuleSelector'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, organizations  } = useHERAAuth()

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
      await login(email, password)
      // Redirect will be handled by useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 relative overflow-hidden">
      {/* Background Pattern - Same as homepage */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob dark:bg-blue-600 dark:opacity-20" />
        <div className="absolute top-40 right-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-2000 dark:bg-purple-600 dark:opacity-20" />
        <div className="absolute -bottom-20 left-40 w-72 sm:w-96 h-72 sm:h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-4000 dark:bg-pink-600 dark:opacity-20" />
      </div>

      {/* Scrollable Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
            {/* Logo and branding */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-background dark:bg-muted/50 backdrop-blur-xl rounded-3xl mb-6 shadow-xl border border-border dark:border-border transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-12 h-12 text-foreground" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-gray-900 dark:to-slate-200 bg-clip-text text-transparent mb-3">
                HERA Enterprise
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground font-light">
                Universal Business Platform
              </p>
            </div>

            {/* Sign In / Demo Tabs */}
            <div className="mb-8">
              <div className="flex rounded-lg bg-slate-100 dark:bg-muted/50 p-1">
                <button className="flex-1 py-2 px-4 rounded-md bg-background dark:bg-background shadow-sm text-sm font-medium text-foreground dark:text-foreground">
                  Sign In
                </button>
                <button
                  onClick={() =>
                    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
                >
                  Try Demo
                </button>
              </div>
            </div>

            {/* Glassmorphic login card */}
            <Card className="bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-xl border border-border dark:border-border mb-8">
              <CardHeader className="text-center pb-4 pt-6">
                <CardTitle className="text-xl font-semibold text-foreground dark:text-foreground">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  Enter your credentials to continue
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
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
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
                        className="pl-12 h-14 text-base bg-background dark:bg-muted border-input dark:border-input text-foreground dark:text-foreground placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Password
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm font-medium text-primary hover:text-primary dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
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
                        className="pl-12 pr-12 h-14 text-base bg-background dark:bg-muted border-input dark:border-input text-foreground dark:text-foreground placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all rounded-lg"
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
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-foreground font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center rounded-lg"
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
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Don't have an account?{' '}
                      <Link
                        href="/auth/signup"
                        className="font-semibold text-primary hover:text-primary dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        Sign up
                      </Link>
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Demo Section */}
            <div id="demo-section" className="mt-16 mb-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">
                  Try Demo Modules
                </h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Experience HERA with pre-configured industry solutions
                </p>
              </div>

              <div className="space-y-4">
                <DemoModuleSelector />
              </div>
            </div>

            {/* Enterprise features */}
            <div className="mt-12 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background/60 dark:bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border dark:border-border text-center">
                  <div className="text-2xl font-bold text-primary dark:text-blue-400">99.9%</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    Uptime SLA
                  </div>
                </div>
                <div className="bg-background/60 dark:bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border dark:border-border text-center">
                  <div className="text-2xl font-bold text-primary dark:text-blue-400">SOC 2</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    Certified
                  </div>
                </div>
                <div className="bg-background/60 dark:bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border dark:border-border text-center">
                  <div className="text-2xl font-bold text-primary dark:text-blue-400">24/7</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    Support
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pb-8 text-center space-y-3">
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                By signing in, you agree to our{' '}
                <Link
                  href="/terms"
                  className="text-primary hover:text-primary dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Terms
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-primary hover:text-primary dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                © 2024 HERA ERP • Enterprise Edition v1.2.0
              </p>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-background dark:bg-muted/50 backdrop-blur-xl rounded-2xl mb-4 shadow-xl border border-border dark:border-border">
              <Loader2 className="w-10 h-10 animate-spin text-primary dark:text-blue-400" />
            </div>
            <p className="text-muted-foreground dark:text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
