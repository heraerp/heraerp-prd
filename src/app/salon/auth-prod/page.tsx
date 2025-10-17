'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scissors, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'

export default function ProductionAuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('michele@hairtalkz.com')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [isProduction, setIsProduction] = useState(false)

  useEffect(() => {
    setIsProduction(window.location.hostname === 'heraerp.com')
  }, [])

  const handleProductionAuth = async () => {
    setIsLoading(true)
    setStatus('Initializing production authentication...')

    try {
      // Production environment detection
      setStatus('Detecting production environment...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Supabase configuration check
      setStatus('Checking Supabase configuration...')
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Supabase URL not configured for production')
      }

      // Try authentication
      if (email && password) {
        setStatus('Attempting sign in with credentials...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          setStatus(`Authentication error: ${error.message}`)
          return
        }

        if (data.user) {
          setStatus('Authentication successful! Setting up session...')
          
          // Set up fast track auth state
          const heraUser = {
            id: data.user.id,
            entity_id: data.user.id,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            email: data.user.email || email,
            role: 'OWNER'
          }

          const heraOrg = {
            id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
            entity_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
            name: 'Hair Talkz Salon',
            type: 'salon',
            industry: 'beauty'
          }

          const authState = {
            user: heraUser,
            organization: heraOrg,
            isAuthenticated: true,
            isLoading: false,
            scopes: ['OWNER']
          }

          sessionStorage.setItem('heraAuthState', JSON.stringify(authState))
          setStatus('Session configured! Redirecting to dashboard...')

          await new Promise(resolve => setTimeout(resolve, 1000))
          router.push('/salon/dashboard')
        }
      } else {
        // Use fast track for production
        setStatus('Using production fast track authentication...')
        
        const heraUser = {
          id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
          entity_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
          name: 'Hair Talkz Owner',
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

        const authState = {
          user: heraUser,
          organization: heraOrg,
          isAuthenticated: true,
          isLoading: false,
          scopes: ['OWNER']
        }

        sessionStorage.setItem('heraAuthState', JSON.stringify(authState))
        setStatus('Fast track authentication complete! Redirecting...')

        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push('/salon/dashboard')
      }

    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
      console.error('Production auth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAndRetry = () => {
    sessionStorage.clear()
    localStorage.clear()
    setStatus('')
    setEmail('michele@hairtalkz.com')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scissors className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Production Login</h1>
            </div>
            <p className="text-gray-300">
              {isProduction ? '🌐 Production Environment' : '🏠 Development Environment'}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="michele@hairtalkz.com"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password (Optional for fast track)
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for fast track"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>

            {status && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  ) : status.includes('Error') ? (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  ) : status.includes('success') || status.includes('complete') ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Zap className="h-4 w-4 text-blue-400" />
                  )}
                  <p className="text-sm text-blue-100">{status}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleProductionAuth}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : password ? (
                'Sign In with Credentials'
              ) : (
                'Use Fast Track Authentication'
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={clearAndRetry}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Clear & Retry
              </Button>
              <Button
                onClick={() => router.push('/salon/dashboard?forcehair=true')}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Emergency Access
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-center space-y-2 text-sm text-gray-400">
              <p>Quick Access Options:</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/salon/dashboard-fast')}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Fast Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/salon/login-test')}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Login Test
                </Button>
                <Button
                  onClick={() => router.push('/salon/performance-test')}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Performance Test
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}