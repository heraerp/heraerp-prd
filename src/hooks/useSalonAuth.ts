'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { HAIRTALKZ_ORG_ID } from '@/lib/constants/salon'
import { useRouter } from 'next/navigation'

interface SalonAuth {
  organizationId: string
  role: string | null
  permissions: string[]
  user: any
  isLoading: boolean
  isAuthenticated: boolean
}

export function useSalonAuth(): SalonAuth {
  const router = useRouter()
  const [auth, setAuth] = useState<SalonAuth>({
    organizationId: HAIRTALKZ_ORG_ID,
    role: null,
    permissions: [],
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        window.location.href = '/salon/auth'
        return
      }

      const storedRole = localStorage.getItem('salonRole')
      const storedOrgId = localStorage.getItem('organizationId')
      const storedPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')
      
      if (storedOrgId !== HAIRTALKZ_ORG_ID) {
        window.location.href = '/salon/auth'
        return
      }

      setAuth({
        organizationId: HAIRTALKZ_ORG_ID,
        role: storedRole,
        permissions: storedPermissions,
        user: session.user,
        isLoading: false,
        isAuthenticated: true
      })
    } catch (error) {
      console.error('Auth check error:', error)
      window.location.href = '/salon/auth'
    }
  }

  return auth
}