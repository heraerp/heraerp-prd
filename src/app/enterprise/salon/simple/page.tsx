/**
 * Super Simple Salon Access
 * Bypasses all complex auth flows
 */

'use client'

import { useState } from 'react'

export default function SimpleSalonAccess() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setMessage('Logging in...')

    try {
      // Import supabase
      const { supabase } = await import('@/lib/supabase/client')
      
      // Login with Michele's credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'michele@hairtalkz.com',
        password: 'HairTalkz2024!'
      })

      if (error) {
        setMessage(`❌ Login failed: ${error.message}`)
        setLoading(false)
        return
      }

      if (data.session) {
        setMessage('✅ Login successful! Redirecting...')
        
        // Set organization in localStorage
        localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
        localStorage.setItem('safeOrganizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
        
        // Direct redirect
        setTimeout(() => {
          window.location.href = '/salon/dashboard'
        }, 2000)
      }

    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
      setLoading(false)
    }
  }

  const goDirectly = () => {
    setMessage('Going directly to dashboard...')
    localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
    localStorage.setItem('safeOrganizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
    window.location.href = '/salon/dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-6xl mb-6">💇‍♀️</div>
        <h1 className="text-3xl font-bold text-white mb-4">Hair Talkz Salon</h1>
        <p className="text-gray-300 mb-8">Simple access to salon dashboard</p>
        
        {message && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-white">{message}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-lg font-medium text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : '🎭 Login as Michele'}
          </button>

          <button
            onClick={goDirectly}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            🚀 Go Direct (Skip Auth)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-600">
          <p className="text-gray-400 text-sm">
            Organization: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
          </p>
        </div>
      </div>
    </div>
  )
}