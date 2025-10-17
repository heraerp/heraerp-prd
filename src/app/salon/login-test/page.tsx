'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle, Scissors } from 'lucide-react'

export default function LoginTestPage() {
  const [tests, setTests] = useState({
    environment: { status: 'pending', details: '' },
    supabase: { status: 'pending', details: '' },
    authentication: { status: 'pending', details: '' },
    fastTrack: { status: 'pending', details: '' }
  })

  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (testName: string, status: string, details: string) => {
    setTests(prev => ({
      ...prev,
      [testName]: { status, details }
    }))
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    
    try {
      // Test 1: Environment Check
      updateTest('environment', 'running', 'Checking environment variables...')
      
      const isProd = window.location.hostname === 'heraerp.com'
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const envDetails = `
        Environment: ${isProd ? 'Production' : 'Development'}
        Hostname: ${window.location.hostname}
        Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}
        Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}
      `
      
      updateTest('environment', 'success', envDetails)
      
      // Test 2: Supabase Connection
      updateTest('supabase', 'running', 'Testing Supabase connection...')
      
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Test basic connection
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          updateTest('supabase', 'error', `Connection error: ${error.message}`)
        } else {
          updateTest('supabase', 'success', `✅ Connected successfully. Current session: ${data.session ? 'Active' : 'None'}`)
        }
      } catch (supabaseError: any) {
        updateTest('supabase', 'error', `Supabase client error: ${supabaseError.message}`)
      }
      
      // Test 3: Authentication State
      updateTest('authentication', 'running', 'Checking authentication state...')
      
      try {
        const authState = sessionStorage.getItem('heraAuthState')
        if (authState) {
          const parsed = JSON.parse(authState)
          const authDetails = `
            Cached auth found:
            - Authenticated: ${parsed.isAuthenticated ? '✅' : '❌'}
            - User: ${parsed.user?.email || 'None'}
            - Organization: ${parsed.organization?.name || 'None'}
          `
          updateTest('authentication', 'success', authDetails)
        } else {
          updateTest('authentication', 'warning', 'No cached authentication state found')
        }
      } catch (authError: any) {
        updateTest('authentication', 'error', `Auth state error: ${authError.message}`)
      }
      
      // Test 4: Fast Track
      updateTest('fastTrack', 'running', 'Testing fast track authentication...')
      
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const hasFastTrack = urlParams.get('forcehair') === 'true'
        
        if (hasFastTrack) {
          // Simulate fast track auth
          const heraUser = {
            id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
            entity_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
            name: 'Hair Talkz Owner (Test)',
            email: 'michele@hairtalkz.com',
            role: 'OWNER'
          }
          
          const heraOrg = {
            id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
            entity_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
            name: 'Hair Talkz Salon',
            type: 'salon',
            industry: 'beauty'
          }
          
          const newState = {
            user: heraUser,
            organization: heraOrg,
            isAuthenticated: true,
            isLoading: false,
            scopes: ['OWNER']
          }
          
          sessionStorage.setItem('heraAuthState', JSON.stringify(newState))
          
          updateTest('fastTrack', 'success', '✅ Fast track authentication activated. Auth state saved to session storage.')
        } else {
          updateTest('fastTrack', 'warning', 'No fast track parameter detected. Add ?forcehair=true to URL for fast track.')
        }
      } catch (fastTrackError: any) {
        updateTest('fastTrack', 'error', `Fast track error: ${fastTrackError.message}`)
      }
      
    } catch (error: any) {
      console.error('Diagnostic error:', error)
    }
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'running': return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      default: return <div className="h-5 w-5 rounded-full bg-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'running': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Production Login Diagnostics</h1>
          </div>
          <p className="text-lg text-gray-600">
            Test authentication and identify production login issues
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Diagnostic Tests</h2>
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Diagnostics'
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(tests).map(([testName, test]) => (
              <div key={testName} className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(test.status)}
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {testName === 'fastTrack' ? 'Fast Track' : testName}
                  </h3>
                </div>
                {test.details && (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white/50 p-2 rounded">
                    {test.details}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => window.location.href = '/salon/dashboard?forcehair=true'}
              className="gap-2"
            >
              <Scissors className="h-4 w-4" />
              Try Fast Track Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = '/salon/dashboard-fast'}
              variant="outline"
              className="gap-2"
            >
              Try Static Fast Dashboard
            </Button>
            <Button 
              onClick={() => {
                sessionStorage.clear()
                localStorage.clear()
                window.location.reload()
              }}
              variant="outline"
              className="gap-2"
            >
              Clear All Cache
            </Button>
            <Button 
              onClick={() => window.location.href = '/salon/performance-test'}
              variant="outline"
              className="gap-2"
            >
              Performance Test Suite
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}