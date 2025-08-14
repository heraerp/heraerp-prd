'use client'

import React, { useState } from 'react'
import { useAuth } from './HERAAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Apple, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle, Loader2 } from 'lucide-react'

interface JobsLoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
  className?: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function JobsLoginForm({ onSuccess, onSwitchToRegister, className = '' }: JobsLoginFormProps) {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)


  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await login(email, password)
      
      if (result.success) {
        onSuccess?.()
      } else {
        setErrors({ general: result.error || 'Sign in failed. Please try again.' })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }


  const isFormDisabled = isLoading || isSubmitting

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 ${className}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-black/5 overflow-hidden">
          {/* Header */}
          <div className="p-12 pb-8 text-center">
            {/* Logo */}
            <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <Apple className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-light text-gray-900 mb-3 tracking-tight">
              Welcome Back
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-600 leading-relaxed">
              Sign in to continue to HERA
            </p>
          </div>

          {/* Form */}
          <div className="px-12 pb-6">
            {/* Error Alert */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-sm text-red-700 text-center">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isFormDisabled}
                    className={`h-14 rounded-2xl border-2 bg-white/70 backdrop-blur-sm transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500' 
                        : focusedField === 'email'
                        ? 'border-blue-400 shadow-lg shadow-blue-400/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isFormDisabled}
                    className={`h-14 rounded-2xl border-2 bg-white/70 backdrop-blur-sm transition-all duration-200 text-gray-900 placeholder:text-gray-400 pr-14 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500' 
                        : focusedField === 'password'
                        ? 'border-blue-400 shadow-lg shadow-blue-400/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isFormDisabled}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isFormDisabled || !email || !password}
                className="w-full h-14 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-medium rounded-2xl shadow-lg shadow-gray-900/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </>
                )}
              </Button>
            </form>
          </div>


          {/* Registration Link */}
          {onSwitchToRegister && (
            <div className="px-12 pb-12">
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600 mb-4">
                  New to HERA?
                </p>
                <Button
                  type="button"
                  onClick={onSwitchToRegister}
                  disabled={isFormDisabled}
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-2 border-gray-200 hover:border-gray-300 bg-white/70 backdrop-blur-sm text-gray-700 font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Account
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* API Status */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Powered by Supabase + HERA
          </p>
        </div>
      </div>
    </div>
  )
}

export default JobsLoginForm