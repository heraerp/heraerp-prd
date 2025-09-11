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
import { Loader2, LogIn, AlertCircle, Eye, EyeOff, Mail, Lock, Sparkles, Shield, Building2, ChevronRight } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { DemoModuleSelector } from '@/components/demo/DemoModuleSelector'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, organizations } = useMultiOrgAuth()
  
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern - Same as homepage */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob dark:bg-blue-600 dark:opacity-20" />
        <div className="absolute top-40 right-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-2000 dark:bg-purple-600 dark:opacity-20" />
        <div className="absolute -bottom-20 left-40 w-72 sm:w-96 h-72 sm:h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-4000 dark:bg-pink-600 dark:opacity-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl mb-6 shadow-xl border border-slate-200 dark:border-slate-700 transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent mb-2">
            HERA Enterprise
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-light">
            Universal Business Platform
          </p>
        </div>

        {/* Glassmorphic login card */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Secure Sign In
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
              Access your enterprise dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pl-10 pr-12 h-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
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
            </form>
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Demo Module Selector */}
            <div className="mt-6">
              <DemoModuleSelector />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
              99.9%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Uptime SLA
            </div>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
              SOC 2
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Certified
            </div>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
              24/7
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Support
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © 2024 HERA ERP • Enterprise Edition v1.2.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CentralLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl mb-4 shadow-xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}