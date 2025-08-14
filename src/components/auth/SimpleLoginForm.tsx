'use client'

import React, { useState } from 'react'
import { useProgressiveAuth } from './ProgressiveAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  ArrowRight, 
  Loader2, 
  Building2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface SimpleLoginFormProps {
  onSuccess?: () => void
  className?: string
}

export function SimpleLoginForm({ onSuccess, className = '' }: SimpleLoginFormProps) {
  const { login, quickRegister, isLoading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Demo credentials
  const demoCredentials = {
    email: 'mario@restaurant.com',
    password: 'securepass123'
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const result = await login(email, password)
        if (result.success) {
          onSuccess?.()
        } else {
          setError(result.error || 'Login failed')
        }
      } else {
        // For quick registration, use email prefix as business name if not provided
        const bizName = businessName || email.split('@')[0] + "'s Business"
        const result = await quickRegister(email, password, bizName)
        
        if (result.success && result.needsEmailConfirmation) {
          // Email confirmation required - show success message
          setError('')
          setSuccessMessage(result.error || '📧 Account created! Please check your email inbox for a confirmation link to activate your account before logging in.')
          setMode('login')
          // Clear form
          setPassword('')
          setBusinessName('')
          console.log('Email confirmation required - showing message')
        } else if (result.error?.includes('already registered')) {
          // Email already exists - suggest login
          setError(result.error)
          // Auto-switch to login mode after showing the message
          setTimeout(() => {
            setMode('login')
            setError('')
            // Pre-fill the email in login mode
          }, 4000)
        } else if (result.error?.includes('logged in automatically')) {
          // User tried to register but was logged in instead
          setSuccessMessage(result.error)
          setTimeout(() => {
            onSuccess?.()
          }, 2000)
        } else if (result.success) {
          // Registration successful and auto-logged in
          onSuccess?.()
        } else {
          // Other registration errors
          setError(result.error || 'Registration failed')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load demo credentials
  const loadDemo = () => {
    setEmail(demoCredentials.email)
    setPassword(demoCredentials.password)
    setError('')
    setSuccessMessage('')
  }

  const isFormDisabled = isLoading || isSubmitting

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 ${className}`}>
      <Card className="w-full max-w-md p-8 shadow-xl border-0">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">H</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'login' 
              ? 'Sign in to your HERA account' 
              : 'Create your account in seconds'}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                {successMessage.includes('check your email') && (
                  <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded">
                    <p className="font-medium">Next steps:</p>
                    <p>1. Check your email inbox (and spam folder)</p>
                    <p>2. Click the confirmation link</p>
                    <p>3. Return here to sign in</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-300 ${
            error.includes('⚠️') ? 'bg-amber-50 border border-amber-300' : 'bg-red-50 border border-red-300'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                error.includes('⚠️') ? 'text-amber-600' : 'text-red-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  error.includes('⚠️') ? 'text-amber-800' : 'text-red-800'
                }`}>{error}</p>
                {error.includes('already registered') && (
                  <p className="text-xs mt-2 text-gray-600">
                    Switching to login mode in a few seconds...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Business Name"
                  className="pl-10 h-12"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-10 h-12"
                required
                disabled={isFormDisabled}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Enter password' : 'Create password'}
                className="pl-10 h-12"
                required
                disabled={isFormDisabled}
              />
            </div>
            {mode === 'register' && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isFormDisabled || !email || !password}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Demo Button (Login only) */}
          {mode === 'login' && (
            <Button
              type="button"
              onClick={loadDemo}
              variant="outline"
              className="w-full h-12"
              disabled={isFormDisabled}
            >
              Use Demo Account
            </Button>
          )}
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-gray-600">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
                setSuccessMessage('')
              }}
              className="text-blue-600 hover:text-blue-700"
              disabled={isFormDisabled}
            >
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </Button>
            {mode === 'login' && (
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  alert('Password reset: Please contact your administrator or use the Supabase dashboard to reset your password.')
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
                disabled={isFormDisabled}
              >
                Forgot Password?
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SimpleLoginForm