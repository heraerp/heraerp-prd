// ================================================================================
// HERA SIGNUP PAGE - SALON THEME
// Smart Code: HERA.AUTH.SIGNUP.PAGE.SALON.V1
// User registration with organization creation flow
// ================================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth/session'
import { SignupRequest } from '@/lib/schemas/universal'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const { signup, isLoading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SignupRequest>({
    resolver: zodResolver(SignupRequest),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      organizationName: '',
    },
  })

  const onSubmit = async (data: SignupRequest) => {
    try {
      await signup(data)
      // Redirect to organization selection after successful signup
      router.push('/dashboard')
    } catch (error) {
      console.error('Signup failed:', error)
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
          <h2 className="text-3xl font-bold text-salon-gradient">
            Create Your HERA Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        {/* Signup Form */}
        <div className="card-salon p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="form-salon space-y-6">
            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                {...form.register('name')}
                type="text"
                id="name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="John Doe"
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="error">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Organization Name Field */}
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                {...form.register('organizationName')}
                type="text"
                id="organizationName"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="Hair Talkz Salon"
                disabled={isLoading}
              />
              {form.formState.errors.organizationName && (
                <p className="error">{form.formState.errors.organizationName.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                {...form.register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="error">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...form.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  placeholder="Create a strong password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="error">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                {...form.register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {form.formState.errors.confirmPassword && (
                <p className="error">{form.formState.errors.confirmPassword.message}</p>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>

            {/* Sign In Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Powered by HERA Universal Architecture
          </p>
        </div>
      </div>
    </div>
  )
}