/**
 * HERA Universal Tile System - Workspace Security Manager
 * Smart Code: HERA.SECURITY.WORKSPACE.RBAC.MANAGER.v1
 * 
 * Comprehensive security framework for workspace access control and data protection
 */

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Security Context Types
export interface SecurityContext {
  actorUserId: string
  organizationId: string
  userRole: string
  permissions: string[]
  sessionType: 'demo' | 'real'
  sessionExpiry: Date
  ipAddress?: string
  userAgent?: string
}

export interface TilePermissions {
  canView: boolean
  canInteract: boolean
  canExport: boolean
  canEdit: boolean
  canDelete: boolean
  visibleActions: string[]
  maskedFields: string[]
  auditRequired: boolean
}

export interface DataAccessPolicy {
  organizationId: string
  entityTypes: string[]
  fieldLevelAccess: Record<string, 'full' | 'masked' | 'denied'>
  aggregationLevels: string[]
  timeRangeRestrictions: {
    maxHistoricalDays: number
    maxForecastDays: number
  }
  exportRestrictions: {
    allowedFormats: string[]
    maxRowLimit: number
    requiresApproval: boolean
  }
}

// Role Definitions following HERA RBAC Standards
export const HERA_ROLES = {
  'viewer': {
    permissions: ['read', 'view_basic_analytics'],
    restrictions: ['no_export', 'no_drill_down', 'aggregated_only'],
    description: 'Basic read-only access to workspace data'
  },
  'analyst': {
    permissions: ['read', 'view_analytics', 'export_basic', 'drill_down'],
    restrictions: ['no_edit', 'no_admin'],
    description: 'Advanced analytics access with export capabilities'
  },
  'manager': {
    permissions: ['read', 'write', 'view_analytics', 'export_full', 'drill_down', 'manage_targets'],
    restrictions: ['no_admin'],
    description: 'Full operational access with management capabilities'
  },
  'admin': {
    permissions: ['all'],
    restrictions: [],
    description: 'Full administrative access to workspace and data'
  },
  'auditor': {
    permissions: ['read', 'view_analytics', 'export_audit', 'view_audit_logs'],
    restrictions: ['no_edit', 'no_personal_data'],
    description: 'Specialized access for compliance and audit purposes'
  }
} as const

/**
 * Workspace Security Manager Class
 * Handles all security operations for workspace access control
 */
export class WorkspaceSecurityManager {
  private securityContext: SecurityContext | null = null
  private dataAccessPolicies: Map<string, DataAccessPolicy> = new Map()
  private auditLog: Array<{
    timestamp: Date
    actorUserId: string
    organizationId: string
    action: string
    resourceType: string
    resourceId?: string
    ipAddress?: string
    result: 'allowed' | 'denied'
    reason?: string
  }> = []

  /**
   * Initialize security context from HERA Auth
   */
  public initializeSecurityContext(
    user: any, 
    organization: any, 
    sessionType: 'demo' | 'real',
    additionalContext?: Partial<SecurityContext>
  ): SecurityContext {
    const userRole = this.resolveUserRole(user, organization)
    const permissions = this.resolvePermissions(userRole)
    
    this.securityContext = {
      actorUserId: user?.id || 'anonymous',
      organizationId: organization?.id || '00000000-0000-0000-0000-000000000000',
      userRole,
      permissions,
      sessionType,
      sessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      ...additionalContext
    }

    this.logSecurityEvent('session_initialized', 'security_context', undefined, 'allowed', 'Security context established')
    
    return this.securityContext
  }

  /**
   * Resolve user role based on HERA Auth context and organization membership
   */
  private resolveUserRole(user: any, organization: any): string {
    // In demo mode, provide elevated permissions for demonstration
    if (!user || !organization) {
      return 'viewer'
    }

    // Check organization-specific role assignments
    const orgRoles = user.organizationRoles?.[organization.id]
    if (orgRoles && Array.isArray(orgRoles)) {
      // Return highest privilege role
      const roleHierarchy = ['admin', 'manager', 'analyst', 'auditor', 'viewer']
      for (const role of roleHierarchy) {
        if (orgRoles.includes(role)) {
          return role
        }
      }
    }

    // Check user metadata for default role
    const defaultRole = user.user_metadata?.default_role || user.app_metadata?.default_role
    if (defaultRole && HERA_ROLES[defaultRole as keyof typeof HERA_ROLES]) {
      return defaultRole
    }

    // Default to viewer for security
    return 'viewer'
  }

  /**
   * Resolve permissions based on role
   */
  private resolvePermissions(role: string): string[] {
    const roleConfig = HERA_ROLES[role as keyof typeof HERA_ROLES]
    if (!roleConfig) {
      return ['read'] // Default minimal permissions
    }

    if (roleConfig.permissions.includes('all')) {
      return ['read', 'write', 'delete', 'admin', 'view_analytics', 'export_full', 'drill_down', 'manage_targets', 'view_audit_logs']
    }

    return roleConfig.permissions
  }

  /**
   * Check if user has permission for specific action
   */
  public hasPermission(permission: string): boolean {
    if (!this.securityContext) {
      this.logSecurityEvent('permission_check', 'permission', permission, 'denied', 'No security context')
      return false
    }

    const hasPermission = this.securityContext.permissions.includes(permission) || 
                         this.securityContext.permissions.includes('all')

    this.logSecurityEvent(
      'permission_check', 
      'permission', 
      permission, 
      hasPermission ? 'allowed' : 'denied',
      hasPermission ? undefined : 'Insufficient permissions'
    )

    return hasPermission
  }

  /**
   * Validate tile access based on role and tile configuration
   */
  public validateTileAccess(tileId: string, tileConfig: any): TilePermissions {
    if (!this.securityContext) {
      return this.getDeniedPermissions('No security context')
    }

    // Check organization boundary
    if (tileConfig.organizationId && tileConfig.organizationId !== this.securityContext.organizationId) {
      this.logSecurityEvent('tile_access_denied', 'tile', tileId, 'denied', 'Organization boundary violation')
      return this.getDeniedPermissions('Organization boundary violation')
    }

    // Check tile-specific permissions
    const tilePermissions = tileConfig.permissions || {}
    const userRole = this.securityContext.userRole

    const canView = this.checkTilePermission(tilePermissions.view, userRole)
    const canInteract = this.checkTilePermission(tilePermissions.edit, userRole) && this.hasPermission('write')
    const canExport = this.checkTilePermission(tilePermissions.export, userRole) && 
                     (this.hasPermission('export_basic') || this.hasPermission('export_full'))
    const canEdit = this.checkTilePermission(tilePermissions.edit, userRole) && this.hasPermission('write')
    const canDelete = canEdit && this.hasPermission('delete')

    // Determine visible actions based on permissions
    const allActions = tileConfig.resolved?.actions || []
    const visibleActions = allActions.filter((action: any) => {
      switch (action.id) {
        case 'export':
          return canExport
        case 'edit':
        case 'set_target':
          return canEdit
        case 'delete':
          return canDelete
        case 'drill_down':
        case 'view_details':
          return this.hasPermission('drill_down')
        default:
          return canView
      }
    }).map((action: any) => action.id)

    // Determine masked fields based on role restrictions
    const maskedFields = this.getMaskedFields(tileConfig, userRole)

    const permissions: TilePermissions = {
      canView,
      canInteract,
      canExport,
      canEdit,
      canDelete,
      visibleActions,
      maskedFields,
      auditRequired: this.requiresAudit(tileConfig, userRole)
    }

    this.logSecurityEvent('tile_access_validated', 'tile', tileId, 'allowed', `Permissions: ${JSON.stringify(permissions)}`)
    
    return permissions
  }

  /**
   * Check if user role is allowed for specific tile permission
   */
  private checkTilePermission(allowedRoles: string[] | undefined, userRole: string): boolean {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true // No restrictions
    }
    return allowedRoles.includes(userRole) || allowedRoles.includes('all')
  }

  /**
   * Get denied permissions object
   */
  private getDeniedPermissions(reason: string): TilePermissions {
    return {
      canView: false,
      canInteract: false,
      canExport: false,
      canEdit: false,
      canDelete: false,
      visibleActions: [],
      maskedFields: ['*'], // Mask all fields
      auditRequired: true
    }
  }

  /**
   * Determine which fields should be masked for the user role
   */
  private getMaskedFields(tileConfig: any, userRole: string): string[] {
    const maskedFields: string[] = []

    // Financial data masking rules
    if (tileConfig.type === 'revenue' || tileConfig.type === 'financial') {
      switch (userRole) {
        case 'viewer':
          maskedFields.push('detailed_breakdown', 'individual_transactions', 'customer_specific_data')
          break
        case 'analyst':
          maskedFields.push('customer_specific_data')
          break
        case 'auditor':
          maskedFields.push('personal_data', 'customer_names')
          break
        // manager and admin see all data
      }
    }

    // Sensitive KPI masking
    if (tileConfig.type === 'kpi') {
      if (userRole === 'viewer') {
        maskedFields.push('target_details', 'comparative_data')
      }
    }

    return maskedFields
  }

  /**
   * Determine if action requires audit logging
   */
  private requiresAudit(tileConfig: any, userRole: string): boolean {
    // Always audit admin and auditor actions
    if (['admin', 'auditor'].includes(userRole)) {
      return true
    }

    // Audit financial data access
    if (['revenue', 'financial', 'cashflow'].includes(tileConfig.type)) {
      return true
    }

    // Audit export actions
    if (tileConfig.interactiveFeatures?.export) {
      return true
    }

    return false
  }

  /**
   * Validate data access for organization boundary
   */
  public validateDataAccess(dataType: string, organizationId: string): boolean {
    if (!this.securityContext) {
      this.logSecurityEvent('data_access_denied', 'data', dataType, 'denied', 'No security context')
      return false
    }

    // Enforce sacred organization boundary
    if (organizationId !== this.securityContext.organizationId) {
      this.logSecurityEvent('data_access_denied', 'data', dataType, 'denied', 'Organization boundary violation')
      return false
    }

    this.logSecurityEvent('data_access_allowed', 'data', dataType, 'allowed')
    return true
  }

  /**
   * Log security event for audit trail
   */
  private logSecurityEvent(
    action: string,
    resourceType: string,
    resourceId?: string,
    result: 'allowed' | 'denied' = 'allowed',
    reason?: string
  ): void {
    const event = {
      timestamp: new Date(),
      actorUserId: this.securityContext?.actorUserId || 'anonymous',
      organizationId: this.securityContext?.organizationId || 'unknown',
      action,
      resourceType,
      resourceId,
      ipAddress: this.securityContext?.ipAddress,
      result,
      reason
    }

    this.auditLog.push(event)

    // In production, this would send to audit service
    console.log('🛡️ Security Event:', event)

    // Keep only last 1000 events in memory
    if (this.auditLog.length > 1000) {
      this.auditLog.shift()
    }
  }

  /**
   * Get current security context
   */
  public getSecurityContext(): SecurityContext | null {
    return this.securityContext
  }

  /**
   * Get audit log for the current session
   */
  public getAuditLog(): typeof this.auditLog {
    return [...this.auditLog] // Return copy for security
  }

  /**
   * Check if session is still valid
   */
  public isSessionValid(): boolean {
    if (!this.securityContext) {
      return false
    }

    const isValid = new Date() < this.securityContext.sessionExpiry
    
    if (!isValid) {
      this.logSecurityEvent('session_expired', 'session', undefined, 'denied', 'Session expired')
    }

    return isValid
  }

  /**
   * Extend session expiry (for active users)
   */
  public extendSession(extensionHours: number = 2): boolean {
    if (!this.securityContext || !this.isSessionValid()) {
      return false
    }

    const maxSessionDuration = 24 * 60 * 60 * 1000 // 24 hours
    const currentDuration = this.securityContext.sessionExpiry.getTime() - Date.now()
    
    if (currentDuration + (extensionHours * 60 * 60 * 1000) > maxSessionDuration) {
      this.logSecurityEvent('session_extension_denied', 'session', undefined, 'denied', 'Max session duration exceeded')
      return false
    }

    this.securityContext.sessionExpiry = new Date(
      this.securityContext.sessionExpiry.getTime() + (extensionHours * 60 * 60 * 1000)
    )

    this.logSecurityEvent('session_extended', 'session', undefined, 'allowed', `Extended by ${extensionHours} hours`)
    return true
  }

  /**
   * Invalidate current session
   */
  public invalidateSession(): void {
    if (this.securityContext) {
      this.logSecurityEvent('session_invalidated', 'session', undefined, 'allowed', 'Manual session termination')
      this.securityContext = null
    }
  }
}

/**
 * React Hook for Workspace Security
 */
export function useWorkspaceSecurity() {
  const { user, organization, isAuthenticated, sessionType } = useHERAAuth()
  const [securityManager] = React.useState(() => new WorkspaceSecurityManager())

  React.useEffect(() => {
    if (isAuthenticated && user && organization) {
      securityManager.initializeSecurityContext(user, organization, sessionType || 'real')
    }
  }, [isAuthenticated, user, organization, sessionType, securityManager])

  return {
    securityManager,
    securityContext: securityManager.getSecurityContext(),
    hasPermission: (permission: string) => securityManager.hasPermission(permission),
    validateTileAccess: (tileId: string, tileConfig: any) => securityManager.validateTileAccess(tileId, tileConfig),
    validateDataAccess: (dataType: string, organizationId: string) => securityManager.validateDataAccess(dataType, organizationId),
    isSessionValid: () => securityManager.isSessionValid(),
    extendSession: (hours?: number) => securityManager.extendSession(hours),
    getAuditLog: () => securityManager.getAuditLog()
  }
}

export default WorkspaceSecurityManager