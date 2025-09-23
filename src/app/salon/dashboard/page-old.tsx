'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OwnerDashboard } from './owner-view'
import { Card, CardContent } from '@/components/ui/luxe-card'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { PermissionGuard } from '@/components/salon/auth/PermissionGuard'
import { useHairTalkzRBAC } from '@/hooks/useHairTalkzRBAC'
import { LUXE_COLORS } from '@/lib/constants/salon'

export default function SalonDashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { role, permissions } = useHairTalkzRBAC()

  useEffect(() => {
    checkAuthAndRedirect()
  }, [])

  const checkAuthAndRedirect = async () => {
    try {
      // Check if user is authenticated
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/salon/auth')
        return
      }

      // Get role from localStorage or user metadata
      const storedRole = localStorage.getItem('salonRole')
      const metadataRole = session.user.user_metadata?.role

      // If no role is set, redirect to auth to select one
      if (!storedRole && !metadataRole) {
        router.push('/salon/auth')
        return
      }

      const currentRole = (storedRole || metadataRole)?.toLowerCase()

      const name =
        session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'

      setUserRole(currentRole || 'owner')
      setUserName(name)

      // Only redirect if role is explicitly not owner
      if (currentRole && currentRole !== 'owner') {
        const redirectMap: Record<string, string> = {
          receptionist: '/salon/pos2',
          accountant: '/salon/finance',
          admin: '/salon/settings',
          administrator: '/salon/settings'
        }

        const redirectPath = redirectMap[currentRole]
        if (redirectPath) {
          router.replace(redirectPath)
          return
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/salon/auth')
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  return (
    <PermissionGuard requiredPermissions={['view_dashboard', 'manage_organization']}>
      <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
        {/* Role and Permission Header */}
        <div className="border-b" style={{ borderColor: `${LUXE_COLORS.bronze}30` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="h-5 w-5" style={{ color: LUXE_COLORS.gold }} />
                <div>
                  <h1
                    className="text-sm font-light uppercase tracking-wider"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    {userName} • {userRole?.toUpperCase() || role?.toUpperCase()}
                  </h1>
                  <p className="text-xs opacity-60" style={{ color: LUXE_COLORS.champagne }}>
                    {permissions.length} permissions active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
                <span className="text-xs" style={{ color: LUXE_COLORS.champagne }}>
                  JWT Token Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {userRole === 'owner' && <OwnerDashboard />}
      </div>
    </PermissionGuard>
  )
}
