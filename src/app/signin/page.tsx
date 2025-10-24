'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

type ErrorType = 'validation' | 'auth' | 'network' | 'unknown'

interface ErrorState {
  message: string
  type: ErrorType
  details?: string
}

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const showError = (message: string, type: ErrorType = 'unknown', details?: string) => {
    setError({ message, type, details })
    setLoading(false)
  }

  const clearError = () => setError(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    // Validation
    if (!email.trim()) {
      showError('Please enter your email address', 'validation')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address', 'validation')
      return
    }

    if (!password) {
      showError('Please enter your password', 'validation')
      return
    }

    setLoading(true)

    try {
      const { supabase } = await import('@/lib/supabase/client')

      console.log('🔐 Signing in...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (signInError) {
        console.error('❌ Sign in failed:', signInError)
        if (signInError.message.toLowerCase().includes('invalid')) {
          showError('Invalid email or password', 'auth', 'Please check your credentials and try again')
        } else {
          showError(signInError.message || 'Failed to sign in', 'auth')
        }
        return
      }

      if (!data.user) {
        showError('Sign in failed', 'auth', 'Please try again')
        return
      }

      console.log('✅ Signed in successfully:', data.user.id)

      // Redirect to organizations page
      setLoading(false)
      router.push('/auth/organizations')

    } catch (error) {
      console.error('❌ Sign in error:', error)
      showError('An unexpected error occurred', 'unknown', 'Please try again')
    }
  }

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case 'validation': return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'auth': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Animated background gradients (matching signup theme) */}
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/15 to-violet-500/15 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold tracking-wide">
              HERA Platform • Sign In
            </span>
          </div>
          <h1 className="ink text-3xl md:text-4xl font-bold mb-2">
            Welcome Back
          </h1>
          <p className="ink-muted">
            Sign in to access your organization
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              {getErrorIcon(error.type)}
              <div className="flex-1">
                <p className="text-red-200 font-medium">{error.message}</p>
                {error.details && (
                  <p className="text-red-300/70 text-sm mt-1">{error.details}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sign in form */}
        <div className="card-glass p-8 rounded-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block ink text-sm font-medium mb-2">
                <Mail className="inline-block w-4 h-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="you@company.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block ink text-sm font-medium">
                  <Lock className="inline-block w-4 h-4 mr-2" />
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-6">
          <p className="ink-muted text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Additional info */}
        <div className="text-center mt-8">
          <p className="ink-muted text-xs">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  )
}
