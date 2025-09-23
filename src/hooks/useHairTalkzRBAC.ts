'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { HAIRTALKZ_ORG_ID } from '@/lib/constants/salon'

interface RBACContext {
  role: string | null
  permissions: string[]
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  isLoading: boolean
}

export function useHairTalkzRBAC(): RBACContext {
  const [role, setRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRBACContext()
  }, [])

  const loadRBACContext = async () => {
    try {
      // Get from session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const userRole = session.user.user_metadata?.role || localStorage.getItem('salonRole')
        const userPermissions = session.user.user_metadata?.permissions || 
          JSON.parse(localStorage.getItem('userPermissions') || '[]')
        
        setRole(userRole)
        setPermissions(userPermissions)
      } else {
        // Fallback to localStorage
        const storedRole = localStorage.getItem('salonRole')
        const storedPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')
        
        setRole(storedRole)
        setPermissions(storedPermissions)
      }
    } catch (error) {
      console.error('Error loading RBAC context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission))
  }

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission))
  }

  return {
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading
  }
}