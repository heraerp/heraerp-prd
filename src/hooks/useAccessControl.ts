/**
 * Access Control Hook
 * Smart Code: HERA.RBAC.HOOK.v1
 * 
 * React hook for role-based access control
 */

import { useState, useEffect, useMemo } from 'react'
import { AccessControlService } from '@/services/AccessControlService'
import { BusinessRole, Space, AccessContext } from '@/types/rbac'

interface UseAccessControlProps {
  userId: string
  sessionId?: string
}

interface UseAccessControlReturn {
  // User information
  userRoles: BusinessRole[]
  accessContext: AccessContext | null
  
  // Space access
  accessibleSpaces: Space[]
  canAccessSpace: (spaceId: string) => boolean
  
  // Page access
  canAccessPage: (pageId: string) => boolean
  
  // Section and tile access
  canAccessSection: (sectionId: string, pageId: string) => boolean
  canAccessTile: (tileId: string, sectionId: string, pageId: string) => boolean
  
  // Utility functions
  hasPermission: (resource: string, action?: string) => boolean
  hasRole: (roleId: string) => boolean
  isLoading: boolean
  refreshAccess: () => void
}

export function useAccessControl({ userId, sessionId = 'default' }: UseAccessControlProps): UseAccessControlReturn {
  const [accessService] = useState(() => AccessControlService.getInstance())
  const [userRoles, setUserRoles] = useState<BusinessRole[]>([])
  const [accessibleSpaces, setAccessibleSpaces] = useState<Space[]>([])
  const [accessContext, setAccessContext] = useState<AccessContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize access control
  useEffect(() => {
    if (!userId) return

    const initializeAccess = async () => {
      setIsLoading(true)
      try {
        // Get user roles
        const roles = accessService.getUserRoles(userId)
        setUserRoles(roles)

        // Get accessible spaces
        const spaces = accessService.getAccessibleSpaces(userId)
        setAccessibleSpaces(spaces)

        // Create access context
        const context = accessService.createAccessContext(userId, sessionId)
        setAccessContext(context)

      } catch (error) {
        console.error('Failed to initialize access control:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAccess()
  }, [userId, sessionId, accessService])

  // Memoized access check functions
  const canAccessSpace = useMemo(() => 
    (spaceId: string) => accessService.canAccessSpace(userId, spaceId),
    [accessService, userId]
  )

  const canAccessPage = useMemo(() => 
    (pageId: string) => accessService.canAccessPage(userId, pageId),
    [accessService, userId]
  )

  const canAccessSection = useMemo(() => 
    (sectionId: string, pageId: string) => accessService.canAccessSection(userId, sectionId, pageId),
    [accessService, userId]
  )

  const canAccessTile = useMemo(() => 
    (tileId: string, sectionId: string, pageId: string) => 
      accessService.canAccessTile(userId, tileId, sectionId, pageId),
    [accessService, userId]
  )

  // Check if user has specific permission
  const hasPermission = useMemo(() => 
    (resource: string, action?: string) => {
      if (!accessContext) return false
      
      return accessContext.permissions.some(permission => {
        const resourceMatch = permission.resource === '*' || 
                             permission.resource === resource ||
                             (resource.includes('.') && permission.resource === resource.split('.')[0] + '.*')
        
        const actionMatch = !action || permission.action === action
        
        return resourceMatch && actionMatch
      })
    },
    [accessContext]
  )

  // Check if user has specific role
  const hasRole = useMemo(() => 
    (roleId: string) => userRoles.some(role => role.id === roleId),
    [userRoles]
  )

  // Refresh access permissions
  const refreshAccess = useMemo(() => 
    () => {
      accessService.clearAccessCache(userId)
      // Re-trigger initialization
      const roles = accessService.getUserRoles(userId)
      setUserRoles(roles)
      
      const spaces = accessService.getAccessibleSpaces(userId)
      setAccessibleSpaces(spaces)
      
      const context = accessService.createAccessContext(userId, sessionId)
      setAccessContext(context)
    },
    [accessService, userId, sessionId]
  )

  return {
    userRoles,
    accessContext,
    accessibleSpaces,
    canAccessSpace,
    canAccessPage,
    canAccessSection,
    canAccessTile,
    hasPermission,
    hasRole,
    isLoading,
    refreshAccess
  }
}

// Note: withAccessControl HOC removed to prevent JSX in .ts file
// Use ProtectedPage and ProtectedSection components instead