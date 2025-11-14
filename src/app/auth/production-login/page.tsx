'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProductionLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('michele@hairtalkz.com')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [isProduction, setIsProduction] = useState(false)

  useEffect(() => {
    setIsProduction(window.location.hostname === 'heraerp.com')
  }, [])

  const handleDirectAuth = async () => {
    setIsLoading(true)
    setStatus('Initializing production authentication...')

    try {
      // Direct authentication for Hair Talkz
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

      // Set authentication state
      sessionStorage.setItem('heraAuthState', JSON.stringify(authState))
      localStorage.setItem('heraAuthState', JSON.stringify(authState))
      
      setStatus('Authentication successful! Redirecting to dashboard...')

      // Small delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to dashboard
      router.push('/salon/dashboard')

    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
      console.error('Production auth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSupabaseAuth = async () => {
    if (!email || !password) {
      setStatus('Please enter email and password')
      return
    }

    setIsLoading(true)
    setStatus('Authenticating with Supabase...')

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setStatus(`Authentication error: ${error.message}`)
        return
      }

      if (data.user) {
        setStatus('Supabase authentication successful! Setting up session...')
        
        // Set up Hair Talkz session
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
        localStorage.setItem('heraAuthState', JSON.stringify(authState))

        setStatus('Session configured! Redirecting to dashboard...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push('/salon/dashboard')
      }

    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
      console.error('Supabase auth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearState = () => {
    sessionStorage.clear()
    localStorage.clear()
    setStatus('')
    setEmail('michele@hairtalkz.com')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">Production Login</CardTitle>
          </div>
          <p className="text-gray-600">
            {isProduction ? '🌐 Production Environment' : '🏠 Development Environment'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="michele@hairtalkz.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password (Optional for direct auth)
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for direct authentication"
            />
          </div>

          {status && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : status.includes('Error') ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : status.includes('successful') ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
                <p className="text-sm text-blue-800">{status}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleDirectAuth}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                'Direct Authentication (Recommended)'
              )}
            </Button>

            {password && (
              <Button
                onClick={handleSupabaseAuth}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Authenticate with Supabase
              </Button>
            )}

            <Button
              onClick={clearState}
              variant="outline"
              className="w-full"
            >
              Clear State & Retry
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Quick Access:</p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/salon/dashboard')}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/salon/dashboard-fast')}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                Fast Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}