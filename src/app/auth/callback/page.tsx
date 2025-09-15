'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback: processing URL...')

        // Check if we have auth tokens in the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const code = hashParams.get('code')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        console.log('🔄 Auth callback:', {
          code: !!code,
          error,
          error_description: errorDescription,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken
        })

        // Handle errors first
        if (error) {
          console.error('Auth callback error from URL:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || error || 'Authentication failed')
          return
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          console.log('✅ Found auth tokens in URL hash, setting session...')

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage(sessionError.message || 'Failed to establish session')
            return
          }

          if (data.session) {
            console.log('✅ Session established successfully')
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')

            // Clear the URL hash
            window.history.replaceState({}, document.title, window.location.pathname)

            // Small delay to show success message
            setTimeout(() => {
              router.push('/select-app')
            }, 1000)
            return
          }
        }

        // If we have a code, exchange it for a session
        if (code) {
          console.log('✅ Found auth code, exchanging for session...')

          const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code)

          if (codeError) {
            console.error('Code exchange error:', codeError)
            setStatus('error')
            setMessage(codeError.message || 'Failed to exchange code for session')
            return
          }

          if (data.session) {
            console.log('✅ Code exchange successful')
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')

            setTimeout(() => {
              router.push('/dashboard')
            }, 1000)
            return
          }
        }

        // Try to get existing session
        const { data: sessionData, error: getSessionError } = await supabase.auth.getSession()

        if (getSessionError) {
          console.error('Get session error:', getSessionError)
          setStatus('error')
          setMessage(getSessionError.message || 'Failed to get session')
          return
        }

        if (sessionData.session) {
          console.log('✅ Found existing session')
          setStatus('success')
          setMessage('Authentication successful! Redirecting...')

          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
          return
        }

        // No valid session found
        console.warn('⚠️ No auth code or tokens provided')
        setStatus('error')
        setMessage('No authentication data provided. Please try logging in again.')

        // Redirect to login with error
        setTimeout(() => {
          router.push('/login?error=no_session')
        }, 2000)
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    handleAuthCallback()
  }, [router])

  const handleManualRedirect = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">H</span>
            </div>

            {status === 'loading' && (
              <>
                <div className="space-y-4">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
                  <h1 className="text-xl font-semibold text-gray-900">Completing Authentication</h1>
                  <p className="text-gray-600">Please wait while we sign you in...</p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="space-y-4">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600" />
                  <h1 className="text-xl font-semibold text-green-900">
                    Authentication Successful!
                  </h1>
                  <p className="text-gray-600">{message}</p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="space-y-4">
                  <AlertCircle className="w-8 h-8 mx-auto text-red-600" />
                  <h1 className="text-xl font-semibold text-red-900">Authentication Failed</h1>
                  <p className="text-gray-600">{message}</p>
                  <button
                    onClick={handleManualRedirect}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Return to Home
                  </button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
