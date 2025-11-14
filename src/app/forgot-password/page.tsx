'use client'

import React, { useState } from 'react'
import {
  Mail,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

type MessageType = 'error' | 'success'

interface Message {
  text: string
  type: MessageType
  details?: string
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [email, setEmail] = useState('')

  const showMessage = (text: string, type: MessageType, details?: string) => {
    setMessage({ text, type, details })
    setLoading(false)
  }

  const clearMessage = () => setMessage(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessage()

    // Validation
    if (!email.trim()) {
      showMessage('Please enter your email address', 'error')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address', 'error')
      return
    }

    setLoading(true)

    try {
      const { supabase } = await import('@/lib/supabase/client')

      console.log('📧 Sending password reset email...')
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('❌ Password reset failed:', error)
        showMessage('Failed to send reset email', 'error', error.message)
        return
      }

      console.log('✅ Password reset email sent')
      showMessage(
        'Check your email!',
        'success',
        'We\'ve sent you a password reset link. Please check your inbox and spam folder.'
      )
      setEmail('')

    } catch (error) {
      console.error('❌ Password reset error:', error)
      showMessage('An unexpected error occurred', 'error', 'Please try again')
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
              HERA Platform • Reset Password
            </span>
          </div>
          <h1 className="ink text-3xl md:text-4xl font-bold mb-2">
            Forgot Password?
          </h1>
          <p className="ink-muted">
            No worries, we\'ll send you reset instructions
          </p>
        </div>

        {/* Message display */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm ${
            message.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30'
              : 'bg-green-500/10 border border-green-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${message.type === 'error' ? 'text-red-200' : 'text-green-200'}`}>
                  {message.text}
                </p>
                {message.details && (
                  <p className={`text-sm mt-1 ${message.type === 'error' ? 'text-red-300/70' : 'text-green-300/70'}`}>
                    {message.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reset form */}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </div>

        {/* Back to sign in */}
        <div className="text-center mt-6">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        {/* Additional info */}
        <div className="text-center mt-8">
          <p className="ink-muted text-xs">
            Don\'t have an account?{' '}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
