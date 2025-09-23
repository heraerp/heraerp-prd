'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'

// Test user credentials
const TEST_USERS = [
  {
    email: 'owner@hairtalkz.ae',
    password: 'HairTalkz@2025',
    role: 'owner',
    name: 'Michele Rodriguez'
  },
  {
    email: 'receptionist@hairtalkz.ae',
    password: 'Reception@2025',
    role: 'receptionist',
    name: 'Sarah Johnson'
  },
  {
    email: 'accountant@hairtalkz.ae',
    password: 'Finance@2025',
    role: 'accountant',
    name: 'Michael Chen'
  },
  { email: 'admin@hairtalkz.ae', password: 'Admin@2025', role: 'admin', name: 'David Thompson' }
]

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

export default function TestLoginPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const checkCurrentSession = async () => {
    setLoading(true)
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)
        setStatus(`Currently logged in as: ${session.user.email}`)
      } else {
        setStatus('No active session')
        setCurrentUser(null)
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const testLogin = async (user: (typeof TEST_USERS)[0]) => {
    setLoading(true)
    setStatus(`Testing login for ${user.role}...`)

    try {
      // First sign out any existing user
      await supabase.auth.signOut()

      // Then sign in with test user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })

      if (error) throw error

      if (data.session) {
        // Set localStorage values
        localStorage.setItem('organizationId', HAIRTALKZ_ORG_ID)
        localStorage.setItem('salonRole', user.role)
        localStorage.setItem('salonUserName', user.name)

        setStatus(`✅ Login successful! Role: ${user.role}`)
        setCurrentUser(data.session.user)

        // Show redirect path
        const redirectMap: Record<string, string> = {
          owner: '/salon/dashboard',
          receptionist: '/salon/receptionist',
          accountant: '/salon/accountant',
          admin: '/salon/admin'
        }

        setTimeout(() => {
          window.location.href = redirectMap[user.role] || '/salon/dashboard'
        }, 2000)
      }
    } catch (error: any) {
      setStatus(`❌ Login failed: ${error.message}`)
    }
    setLoading(false)
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('organizationId')
      localStorage.removeItem('salonRole')
      localStorage.removeItem('salonUserName')
      setStatus('Signed out successfully')
      setCurrentUser(null)
    } catch (error: any) {
      setStatus(`Error signing out: ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">HairTalkz Test Login Page</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={checkCurrentSession} disabled={loading} className="mb-4">
              Check Current Session
            </Button>

            {currentUser && (
              <div className="space-y-2 mb-4">
                <p className="text-sm">Email: {currentUser.email}</p>
                <p className="text-sm">ID: {currentUser.id}</p>
                <p className="text-sm">Role: {currentUser.user_metadata?.role || 'Not set'}</p>
                <p className="text-sm">
                  Org ID: {currentUser.user_metadata?.organization_id || 'Not set'}
                </p>
              </div>
            )}

            {status && (
              <div className="p-4 bg-gray-800 rounded text-white font-mono text-sm">{status}</div>
            )}

            {currentUser && (
              <Button onClick={signOut} variant="destructive" className="mt-4">
                Sign Out
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEST_USERS.map(user => (
                <div key={user.email} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{user.role.toUpperCase()}</h3>
                  <p className="text-sm text-gray-600 mb-1">Name: {user.name}</p>
                  <p className="text-sm text-gray-600 mb-1">Email: {user.email}</p>
                  <p className="text-sm text-gray-600 mb-3">Password: {user.password}</p>
                  <Button onClick={() => testLogin(user)} disabled={loading} className="w-full">
                    Login as {user.role}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <a href="/salon/auth" className="text-blue-400 hover:underline">
            Go to Normal Login Page
          </a>
        </div>
      </div>
    </div>
  )
}
