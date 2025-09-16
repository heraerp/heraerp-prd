'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Loader2, LogOut, CheckCircle } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'

export default function ClearSessionPage() {
  const router = useRouter()
  const [clearing, setClearing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const clearSession = async () => {
      try {
        console.log('Clearing all sessions...')

        // Clear Supabase session
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Sign out error:', error)
        }

        // Clear all localStorage items related to auth
        localStorage.removeItem('redirectAfterLogin')
        localStorage.removeItem('redirectAfterOrg')
        localStorage.removeItem('supabase.auth.token')

        // Clear all cookies
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })

        console.log('Session cleared successfully')

        // Wait a moment to ensure everything is cleared
        setTimeout(() => {
          setClearing(false)
        }, 1000)
      } catch (err) {
        console.error('Error clearing session:', err)
        setError('Failed to clear session')
        setClearing(false)
      }
    }

    clearSession()
  }, [])

  if (clearing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Clearing session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle>Session Cleared</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your session has been cleared successfully. You can now sign in with a fresh
                session.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Go to Login
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
