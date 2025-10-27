/**
 * Quick Salon Login
 * Fast login route specifically for salon access
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setSafeOrgContext } from '@/lib/salon/safe-org-loader'

export default function QuickSalonLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('michele@hairtalkz.com') // Default salon owner
  const [password, setPassword] = useState('HairTalkz2024!')
  const [error, setError] = useState('')

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('✅ Already logged in, redirecting to salon...')
          setSafeOrgContext()
          window.location.href = '/salon/dashboard'
        }
      } catch (error) {
        console.log('Auth check error:', error)
      }
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 Attempting salon login...')
      
      const { supabase } = await import('@/lib/supabase/client')
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw authError
      }

      if (data.session) {
        console.log('✅ Login successful for:', email)
        
        // Set safe organization context
        const config = setSafeOrgContext()
        console.log('🛡️ Safe org context set:', config)
        
        // Small delay to ensure auth state propagates
        setTimeout(() => {
          window.location.href = '/salon/dashboard'
        }, 1000)
      }

    } catch (error: any) {
      console.error('❌ Login error:', error)
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('🎭 Attempting demo login with Michele credentials...')

      const { supabase } = await import('@/lib/supabase/client')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'michele@hairtalkz.com',
        password: 'HairTalkz2024!'
      })

      if (!error && data.session) {
        console.log('✅ Demo login successful: Michele (Owner)')
        setSafeOrgContext()
        setTimeout(() => {
          window.location.href = '/salon/dashboard'
        }, 1000)
        return
      }

      throw new Error('Demo login failed')

    } catch (error: any) {
      console.error('❌ Demo login error:', error)
      setError('Demo login failed - please use manual login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">💇‍♀️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Hair Talkz Salon</h1>
          <p className="text-gray-300 text-sm">Quick access to salon dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Demo Login Button */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-6 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : '🎭 Demo Login (Michele)'}
        </button>

        <div className="text-center mb-6">
          <span className="text-gray-400 text-sm">or login with credentials</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-gray-600">
          <p className="text-gray-400 text-xs text-center">
            Demo: michele@hairtalkz.com / HairTalkz2024!
          </p>
        </div>
      </div>
    </div>
  )
}