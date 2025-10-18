/**
 * Salon Access - Completely Outside Salon Layout
 * No auth providers at all
 */

'use client'

import { useState } from 'react'

export default function SalonAccessPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setMessage('🔐 Logging in as Michele...')

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
        setMessage('✅ Login successful! Setting up organization...')
        
        // Set organization in localStorage
        localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
        localStorage.setItem('safeOrganizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
        localStorage.setItem('salonRole', 'owner')
        
        setMessage('🚀 Redirecting to salon dashboard...')
        
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

  const skipAuth = () => {
    setMessage('🚀 Setting up direct access...')
    
    // Force set organization data
    localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
    localStorage.setItem('safeOrganizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
    localStorage.setItem('salonRole', 'owner')
    
    setMessage('⚡ Going to dashboard...')
    
    setTimeout(() => {
      window.location.href = '/salon/dashboard'
    }, 1000)
  }

  const testBasicPage = () => {
    window.location.href = '/salon-test'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-2xl p-10 text-center border border-white/20">
        <div className="text-7xl mb-6">💇‍♀️</div>
        <h1 className="text-4xl font-bold text-white mb-2">Hair Talkz</h1>
        <h2 className="text-xl text-purple-200 mb-8">Salon Dashboard Access</h2>
        
        {message && (
          <div className="bg-black/30 rounded-xl p-4 mb-8 border border-purple-400/30">
            <p className="text-purple-100 text-lg">{message}</p>
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? '⏳ Working...' : '🎭 Login as Michele (Owner)'}
          </button>

          <button
            onClick={skipAuth}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            🚀 Skip Auth & Go Direct
          </button>

          <button
            onClick={testBasicPage}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-6 rounded-xl font-medium transition-colors"
          >
            🧪 Test Basic Page
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20">
          <div className="text-purple-200 text-sm space-y-1">
            <p><strong>Email:</strong> michele@hairtalkz.com</p>
            <p><strong>Password:</strong> HairTalkz2024!</p>
            <p><strong>Org ID:</strong> 378f24fb...a0eb8</p>
          </div>
        </div>
      </div>
    </div>
  )
}