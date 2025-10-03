'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LUXE_COLORS } from '@/lib/constants/salon'

export default function AuthTestPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    setSession(session)
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/salon/auth')
  }

  const navigateBasedOnRole = () => {
    const role = session?.user?.user_metadata?.role || localStorage.getItem('salonRole')

    const routes: Record<string, string> = {
      owner: '/salon/dashboard',
      receptionist: '/salon/pos',
      accountant: '/salon/finance',
      admin: '/salon/settings'
    }

    const route = routes[role?.toLowerCase()] || '/salon/dashboard'
    router.push(route)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div style={{ color: LUXE_COLORS.gold }}>Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: LUXE_COLORS.black, color: LUXE_COLORS.champagne }}
    >
      <h1 className="text-2xl mb-8" style={{ color: LUXE_COLORS.gold }}>
        HairTalkz Auth Test
      </h1>

      <div
        className="p-6 rounded-lg mb-8"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          border: `1px solid ${LUXE_COLORS.bronze}50`
        }}
      >
        <h2 className="text-xl mb-4" style={{ color: LUXE_COLORS.gold }}>
          Session Info
        </h2>

        {session ? (
          <>
            <p>✅ Authenticated</p>
            <p>Email: {session.user.email}</p>
            <p>Role: {session.user.user_metadata?.role || 'Not set'}</p>
            <p>Organization: {session.user.user_metadata?.organization_id || 'Not set'}</p>
            <p>Permissions: {session.user.user_metadata?.permissions?.length || 0}</p>
          </>
        ) : (
          <p>❌ Not authenticated</p>
        )}
      </div>

      <div
        className="p-6 rounded-lg mb-8"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          border: `1px solid ${LUXE_COLORS.bronze}50`
        }}
      >
        <h2 className="text-xl mb-4" style={{ color: LUXE_COLORS.gold }}>
          LocalStorage
        </h2>

        <p>Organization ID: {localStorage.getItem('organizationId') || 'Not set'}</p>
        <p>Role: {localStorage.getItem('salonRole') || 'Not set'}</p>
        <p>Permissions: {localStorage.getItem('userPermissions') || 'Not set'}</p>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => router.push('/salon/auth')}
          style={{
            backgroundColor: LUXE_COLORS.bronze,
            color: LUXE_COLORS.black
          }}
        >
          Go to Login
        </Button>

        {session && (
          <>
            <Button
              onClick={navigateBasedOnRole}
              style={{
                backgroundColor: LUXE_COLORS.gold,
                color: LUXE_COLORS.black
              }}
            >
              Go to My Dashboard
            </Button>

            <Button onClick={signOut} variant="destructive">
              Sign Out
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
