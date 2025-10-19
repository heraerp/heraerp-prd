/**
 * Salon Access Page
 * Allows Hair Talkz users (owner and receptionists) to sign in with email/password
 * Automatically detects role based on email and sets up organization context
 */

'use client'

import { useState } from 'react'

export default function SalonAccessPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Detect role based on email
  const detectRole = (userEmail: string): string => {
    const lowerEmail = userEmail.toLowerCase()

    // Owner: Hairtalkz2022@gmail.com
    if (lowerEmail.includes('2022')) {
      return 'owner'
    }

    // Receptionists: hairtalkz01@gmail.com, hairtalkz02@gmail.com
    if (lowerEmail.includes('01') || lowerEmail.includes('02')) {
      return 'receptionist'
    }

    // Default fallback
    return 'staff'
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')
    setMessage('🔐 Signing in...')

    try {
      // Import supabase client
      const { supabase } = await import('@/lib/supabase/client')

      // Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        setError(`❌ Sign-in failed: ${authError.message}`)
        setMessage('')
        setLoading(false)
        return
      }

      if (data.session && data.user) {
        setMessage('✅ Authentication successful! Setting up your account...')

        // Detect role based on email
        const userRole = detectRole(data.user.email || email)

        // Set organization and role in localStorage
        const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
        localStorage.setItem('organizationId', orgId)
        localStorage.setItem('safeOrganizationId', orgId)
        localStorage.setItem('salonRole', userRole)

        // Store user info
        localStorage.setItem('userEmail', data.user.email || email)
        localStorage.setItem('userId', data.user.id)

        setMessage(`🎉 Welcome! You are signed in as ${userRole.toUpperCase()}`)

        // Redirect based on role
        const redirectPath = userRole === 'owner' ? '/salon/dashboard' : '/salon/receptionist'

        setTimeout(() => {
          window.location.href = redirectPath
        }, 1500)
      } else {
        setError('❌ Sign-in failed: No session created')
        setMessage('')
        setLoading(false)
      }

    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(`❌ Error: ${err.message || 'Unknown error occurred'}`)
      setMessage('')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-2xl p-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="text-7xl mb-6">💇‍♀️</div>
          <h1 className="text-4xl font-bold text-white mb-2">Hair Talkz</h1>
          <h2 className="text-xl text-purple-200 mb-2">Salon Sign-In</h2>
          <p className="text-sm text-purple-300">Owner & Receptionist Access</p>
        </div>

        {/* Status Messages */}
        {(message || error) && (
          <div className={`rounded-xl p-4 mb-6 border ${
            error
              ? 'bg-red-500/20 border-red-400/30'
              : 'bg-black/30 border-purple-400/30'
          }`}>
            <p className={`text-lg ${error ? 'text-red-100' : 'text-purple-100'}`}>
              {error || message}
            </p>
          </div>
        )}

        {/* Sign-In Form */}
        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@gmail.com"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Signing In...' : '🔓 Sign In'}
          </button>
        </form>

        {/* Information */}
        <div className="mt-10 pt-6 border-t border-white/20">
          <div className="text-purple-200 text-sm space-y-2">
            <p className="font-semibold text-white mb-3">Authorized Users:</p>
            <div className="space-y-1 text-xs">
              <p>👑 <strong>Owner:</strong> Hairtalkz2022@gmail.com</p>
              <p>📋 <strong>Receptionist 1:</strong> hairtalkz01@gmail.com</p>
              <p>📋 <strong>Receptionist 2:</strong> hairtalkz02@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
