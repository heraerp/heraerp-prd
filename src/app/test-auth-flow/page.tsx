'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function TestAuthFlow() {
  const [status, setStatus] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const router = useRouter()

  const log = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testDirectAuth = async () => {
    setStatus('testing')
    setLogs([])

    try {
      log('Starting direct authentication test...')

      // Sign out first
      log('Signing out any existing session...')
      await supabase.auth.signOut()

      // Try to sign in
      log('Attempting to sign in with demo@herasalon.com...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@herasalon.com',
        password: 'HeraSalonDemo2024!'
      })

      if (error) {
        log(`Sign in failed: ${error.message}`)
        setStatus('error')
        return
      }

      log('Sign in successful!')
      log(`User ID: ${data.user.id}`)
      log(`Email: ${data.user.email}`)

      // Check session
      const { data: sessionData } = await supabase.auth.getSession()
      log(`Has session: ${!!sessionData.session}`)

      if (sessionData.session) {
        log('Session established successfully')

        // Set storage values
        log('Setting storage values...')
        localStorage.setItem('current-organization-id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
        localStorage.setItem('current-organization-name', 'Hair Talkz Salon - DNA Testing')
        sessionStorage.setItem('isDemoLogin', 'true')
        sessionStorage.setItem('demoModule', 'salon')

        setStatus('success')

        log('Ready to navigate to dashboard')
      }
    } catch (error: any) {
      log(`Error: ${error.message}`)
      setStatus('error')
    }
  }

  const navigateToDashboard = () => {
    log('Navigating to salon dashboard...')
    router.push('/salon/dashboard')
  }

  const navigateViaDemo = () => {
    log('Navigating via demo page...')
    router.push('/demo')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Flow Test</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Direct Authentication</h2>
        <div className="space-y-4">
          <Button onClick={testDirectAuth} disabled={status === 'testing'}>
            {status === 'testing' ? 'Testing...' : 'Test Direct Sign In'}
          </Button>

          {status === 'success' && (
            <Button onClick={navigateToDashboard} variant="outline">
              Navigate to Dashboard
            </Button>
          )}

          <Button onClick={navigateViaDemo} variant="secondary">
            Go to Demo Page
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Logs</h2>
        <div className="space-y-1 text-xs font-mono">
          {logs.map((log, i) => (
            <div key={i} className="text-gray-600">
              {log}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
