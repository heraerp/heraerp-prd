'use client'

import { useEffect, useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { supabase } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const { user, organization, isLoading, isAuthenticated } = useHERAAuth()
  const [cookies, setCookies] = useState<Record<string, string>>({})
  const [supabaseSession, setSupabaseSession] = useState<any>(null)
  const [initResult, setInitResult] = useState<any>(null)

  useEffect(() => {
    // Get all cookies
    const cookieObj = document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=')
      if (key) acc[key] = value || ''
      return acc
    }, {} as Record<string, string>)
    setCookies(cookieObj)

    // Check Supabase session
    async function checkSupabase() {
      const { data: { session } } = await supabase.auth.getSession()
      setSupabaseSession(session)
    }
    checkSupabase()
  }, [])

  const handleInitDemo = async () => {
    try {
      console.log('🚀 Initializing demo...')
      const response = await fetch('/api/v1/demo/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoType: 'salon-receptionist' })
      })
      
      const result = await response.json()
      setInitResult(result)
      
      if (result.success) {
        // Set the cookie manually
        document.cookie = `HERA_ORG_ID=${result.user.organization_id}; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax`
        // Refresh the page to pick up changes
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      setInitResult({ success: false, error: error.message })
    }
  }

  const clearAll = () => {
    // Clear all cookies
    Object.keys(cookies).forEach(key => {
      document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Lax`
    })
    
    // Clear localStorage
    localStorage.clear()
    
    // Sign out from Supabase
    supabase.auth.signOut()
    
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Auth Debug Page</h1>
        
        {/* HERA Auth Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">HERA Auth Provider Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Loading</label>
              <div className={`px-2 py-1 rounded text-sm ${isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {isLoading ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Authenticated</label>
              <div className={`px-2 py-1 rounded text-sm ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAuthenticated ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <div className="text-sm text-gray-600">{user ? user.email : 'None'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <div className="text-sm text-gray-600">{organization ? organization.id : 'None'}</div>
            </div>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <div className="space-y-2">
            {Object.entries(cookies).length > 0 ? (
              Object.entries(cookies).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded min-w-48">{key}</span>
                  <span className="text-sm text-gray-600 truncate max-w-96">{value}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No cookies found</p>
            )}
          </div>
        </div>

        {/* Supabase Session */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Session</h2>
          {supabaseSession ? (
            <div className="space-y-2">
              <div><strong>User ID:</strong> {supabaseSession.user.id}</div>
              <div><strong>Email:</strong> {supabaseSession.user.email}</div>
              <div><strong>Expires:</strong> {new Date(supabaseSession.expires_at * 1000).toLocaleString()}</div>
            </div>
          ) : (
            <p className="text-gray-500">No Supabase session</p>
          )}
        </div>

        {/* Demo Init Result */}
        {initResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Demo Init Result</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(initResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={handleInitDemo}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Initialize Demo
            </button>
            <button
              onClick={() => window.location.href = '/salon/services'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Services
            </button>
            <button
              onClick={clearAll}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Clear All & Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}