// ================================================================================
// HERA LOGIN PAGE - SALON THEME
// Smart Code: HERA.AUTH.LOGIN.PAGE.SALON.V1
// Email+password form with react-hook-form + zod validation
// ================================================================================

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '@/lib/auth/session'
import { LoginRequest } from '@/lib/schemas/universal'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequest),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data)
      // Redirect to dashboard on successful login
      router.push('/dashboard')
    } catch (error) {
      // Error is handled by the auth store
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-salon-light px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-12 h-12 bg-salon-gradient rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-salon-gradient">Welcome to HERA</h2>
          <p className="mt-2 text-sm ink-muted">Sign in to your salon management account</p>
        </div>

        {/* Login Form */}
        <div className="card-salon p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="form-salon space-y-6">
            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium ink mb-2">
                Email address
              </label>
              <input
                {...form.register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="error">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium ink mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...form.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 ink-muted" />
                  ) : (
                    <Eye className="h-4 w-4 ink-muted" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="error">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>
                  <strong>Owner:</strong> owner@hairtalkz.com
                </div>
                <div>
                  <strong>Manager:</strong> manager@hairtalkz.com
                </div>
                <div>
                  <strong>Stylist:</strong> stylist@hairtalkz.com
                </div>
                <div className="pt-1">
                  <em>Any password 6+ characters works</em>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs ink-muted">Powered by HERA Universal Architecture</p>
        </div>
      </div>
    </div>
  )
}
