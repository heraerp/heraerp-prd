'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors, Loader2, AlertCircle } from 'lucide-react'

export default function SalonLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Use singleton Supabase client
      const { supabase } = await import('@/lib/supabase/client')

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user && data.session) {
        // Check if user is authorized for Hair Talkz
        if (data.user.email?.includes('@hairtalkz.com') || data.user.email?.includes('michele')) {
          console.log('✅ Authorized Hair Talkz user')
          
          // Set up authentication state directly
          const authState = {
            user: {
              id: data.user.id,
              entity_id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Hair Talkz User',
              email: data.user.email || '',
              role: 'OWNER'
            },
            organization: {
              id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
              entity_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
              name: 'Hair Talkz Salon',
              type: 'salon',
              industry: 'beauty'
            },
            isAuthenticated: true,
            isLoading: false,
            scopes: ['OWNER']
          }

          // Store auth state
          try {
            sessionStorage.setItem('heraAuthState', JSON.stringify(authState))
            localStorage.setItem('heraAuthState', JSON.stringify(authState))
            localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
            localStorage.setItem('salonRole', 'OWNER')
          } catch (e) {
            console.log('Storage not available, continuing...')
          }

          // Direct redirect to dashboard
          router.push('/salon/dashboard')
          
        } else {
          setError('This email domain is not authorized for Hair Talkz Salon')
          await supabase.auth.signOut()
        }
      }

    } catch (error: any) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors className="h-8 w-8 text-blue-400" />
            <CardTitle className="text-2xl text-white">Hair Talkz Login</CardTitle>
          </div>
          <p className="text-gray-300">
            Sign in with your @hairtalkz.com email
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@hairtalkz.com"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <p className="text-sm text-red-100">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Only @hairtalkz.com email addresses are authorized</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}