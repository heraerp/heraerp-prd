'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Demo credentials for salon app
const DEMO_CREDENTIALS = {
  salon: {
    email: 'demo@herasalon.com',
    password: 'HeraSalonDemo2024!',
    organizationId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    organizationName: 'Bella Beauty Salon (Demo)'
  }
}

function DemoLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const app = searchParams.get('app')
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const [status, setStatus] = useState<'authenticating' | 'success' | 'error'>('authenticating')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const authenticateDemo = async () => {
      if (!app || !DEMO_CREDENTIALS[app as keyof typeof DEMO_CREDENTIALS]) {
        setStatus('error')
        setErrorMessage('Invalid demo application')
        return
      }

      const credentials = DEMO_CREDENTIALS[app as keyof typeof DEMO_CREDENTIALS]

      try {
        // First, sign out any existing session
        console.log('Signing out existing session...')
        await supabase.auth.signOut()

        // Sign in with demo credentials
        console.log('Attempting to sign in with:', credentials.email)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        })

        if (error) {
          console.log('Sign in failed:', error.message)

          // If it's invalid credentials, don't try to create user (user already exists)
          if (error.message === 'Invalid login credentials') {
            setStatus('error')
            setErrorMessage('Invalid demo credentials. Please contact support.')
            return
          }

          // For other errors, try to create the demo user
          console.log('Attempting to create demo user...')
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: {
              data: {
                full_name: 'Demo User',
                organization_id: credentials.organizationId,
                role: 'owner'
              }
            }
          })

          if (signUpError) {
            console.error('Sign up failed:', signUpError)
            throw signUpError
          }

          // Try signing in again
          console.log('Retrying sign in after user creation...')
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          })

          if (retryError) {
            console.error('Retry sign in failed:', retryError)
            throw retryError
          }

          // Use retry data if successful
          if (retryData?.session) {
            console.log('Successfully signed in after retry')
          }
        } else if (data?.session) {
          console.log('Successfully signed in:', data.session.user.email)
        }

        // Verify we have a session before proceeding
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('Session after auth:', sessionData.session)

        if (!sessionData.session) {
          console.error('No session after authentication!')
          setStatus('error')
          setErrorMessage('Authentication succeeded but no session was created')
          return
        }

        // Set organization context
        console.log('Setting organization context...')
        localStorage.setItem('current-organization-id', credentials.organizationId)
        localStorage.setItem('current-organization-name', credentials.organizationName)
        localStorage.setItem(
          'selected-organization',
          JSON.stringify({
            id: credentials.organizationId,
            name: credentials.organizationName
          })
        )

        // Mark as demo session
        sessionStorage.setItem('isDemoLogin', 'true')
        sessionStorage.setItem('demoModule', app)
        sessionStorage.setItem('demo-org-id', credentials.organizationId)

        setStatus('success')

        console.log('Redirecting to:', redirectUrl)

        // Wait a bit for session to propagate
        await new Promise(resolve => setTimeout(resolve, 500))

        // Redirect to the target page
        console.log('About to redirect to:', redirectUrl)
        // Use router.push first, then fallback to window.location
        router.push(redirectUrl)
      } catch (error: any) {
        console.error('Demo authentication failed:', error)
        setStatus('error')
        setErrorMessage(error.message || 'Failed to authenticate demo user')
      }
    }

    authenticateDemo()
  }, [app, redirectUrl, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {status === 'authenticating' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Setting up demo environment</h2>
            <p className="dark:ink-muted">
              Please wait while we prepare your demo experience...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Demo ready!</h2>
            <p className="dark:ink-muted">
              Redirecting you to the demo dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Demo setup failed</h2>
            <p className="dark:ink-muted mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push('/demo')}
              className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Back to demo selection
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default function DemoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="mt-2 dark:ink-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <DemoLoginContent />
    </Suspense>
  )
}
