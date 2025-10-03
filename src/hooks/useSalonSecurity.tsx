/**
 * HERA DNA SECURITY: Salon Security Hooks
 * Industry DNA Component: HERA.DNA.SECURITY.SALON.HOOKS.v1
 *
 * Salon-specific security DNA that provides comprehensive permission management,
 * role-based access control, and audit logging tailored for salon operations.
 *
 * Key DNA Features:
 * - Salon-specific role hierarchy (owner → manager → receptionist → stylist)
 * - Granular permission system (25+ specific permissions)
 * - Financial data protection with role-based visibility
 * - POS security with transaction-level audit trails
 * - Customer data privacy with assignment-based access
 * - Secure database operations with automatic context management
 */

import React, { useCallback, useMemo } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { dbContext } from '@/lib/security/database-context'
import type { SecurityContext } from '@/lib/security/database-context'

// Salon permission categories
export const SALON_PERMISSIONS = {
  // Financial permissions
  FINANCE: {
    VIEW_REVENUE: 'salon:finance:view_revenue',
    VIEW_EXPENSES: 'salon:finance:view_expenses',
    PROCESS_PAYMENTS: 'salon:finance:process_payments',
    REFUND_PAYMENTS: 'salon:finance:refund_payments',
    EXPORT_FINANCIAL: 'salon:finance:export',
    MANAGE_PRICING: 'salon:finance:manage_pricing'
  },

  // Appointment permissions
  APPOINTMENTS: {
    VIEW_ALL: 'salon:appointments:view_all',
    VIEW_OWN: 'salon:appointments:view_own',
    CREATE: 'salon:appointments:create',
    MODIFY: 'salon:appointments:modify',
    CANCEL: 'salon:appointments:cancel',
    CHECKIN: 'salon:appointments:checkin'
  },

  // Customer permissions
  CUSTOMERS: {
    VIEW_ALL: 'salon:customers:view_all',
    VIEW_ASSIGNED: 'salon:customers:view_assigned',
    CREATE: 'salon:customers:create',
    MODIFY: 'salon:customers:modify',
    DELETE: 'salon:customers:delete',
    VIEW_HISTORY: 'salon:customers:view_history'
  },

  // Staff permissions
  STAFF: {
    VIEW_ALL: 'salon:staff:view_all',
    MANAGE: 'salon:staff:manage',
    SCHEDULE: 'salon:staff:schedule',
    PERFORMANCE: 'salon:staff:performance'
  },

  // Inventory permissions
  INVENTORY: {
    VIEW: 'salon:inventory:view',
    MANAGE: 'salon:inventory:manage',
    REORDER: 'salon:inventory:reorder',
    ADJUST: 'salon:inventory:adjust'
  },

  // POS permissions
  POS: {
    OPERATE: 'salon:pos:operate',
    MANAGE_CARTS: 'salon:pos:manage_carts',
    PROCESS_SALES: 'salon:pos:process_sales',
    HANDLE_RETURNS: 'salon:pos:handle_returns',
    APPLY_DISCOUNTS: 'salon:pos:apply_discounts'
  },

  // System permissions
  SYSTEM: {
    ADMIN: 'salon:system:admin',
    SETTINGS: 'salon:system:settings',
    USERS: 'salon:system:users',
    BACKUP: 'salon:system:backup',
    SECURITY: 'salon:system:security'
  }
}

// Role-based feature access
export const ROLE_FEATURES = {
  owner: {
    dashboard: ['revenue', 'expenses', 'profit', 'staff_performance', 'customer_analytics'],
    navigation: [
      'dashboard',
      'appointments',
      'customers',
      'staff',
      'finance',
      'inventory',
      'reports',
      'settings'
    ],
    actions: ['all']
  },
  manager: {
    dashboard: ['revenue', 'appointments', 'staff_schedule', 'inventory_alerts'],
    navigation: ['dashboard', 'appointments', 'customers', 'staff', 'inventory', 'reports'],
    actions: ['schedule', 'inventory', 'customer_management']
  },
  receptionist: {
    dashboard: ['today_appointments', 'walk_ins', 'checked_in'],
    navigation: ['dashboard', 'appointments', 'customers', 'pos'],
    actions: ['checkin', 'appointments', 'pos']
  },
  stylist: {
    dashboard: ['my_appointments', 'my_schedule', 'my_customers'],
    navigation: ['dashboard', 'appointments', 'customers'],
    actions: ['own_appointments', 'assigned_customers']
  },
  accountant: {
    dashboard: ['revenue', 'expenses', 'profit', 'tax_summary'],
    navigation: ['dashboard', 'finance', 'reports'],
    actions: ['financial_reports', 'export_data']
  },
  admin: {
    dashboard: ['system_status', 'user_activity', 'security_alerts'],
    navigation: ['dashboard', 'settings', 'users', 'security'],
    actions: ['system_admin', 'user_management']
  }
}

/**
 * Main salon security hook
 */
export function useSalonSecurity() {
  const context = useSecuredSalonContext()

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return context.hasPermission(permission)
    },
    [context]
  )

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return context.hasAnyPermission(permissions)
    },
    [context]
  )

  /**
   * Check if user can access specific feature
   */
  const canAccess = useCallback(
    (feature: string): boolean => {
      const roleFeatures = ROLE_FEATURES[context.salonRole]
      if (!roleFeatures) return false

      // Check navigation access
      if (roleFeatures.navigation.includes(feature)) return true

      // Check action access
      if (roleFeatures.actions.includes('all') || roleFeatures.actions.includes(feature))
        return true

      return false
    },
    [context.salonRole]
  )

  /**
   * Get filtered dashboard widgets based on role
   */
  const getDashboardWidgets = useCallback(() => {
    const roleFeatures = ROLE_FEATURES[context.salonRole]
    return roleFeatures?.dashboard || []
  }, [context.salonRole])

  /**
   * Get available navigation items based on role
   */
  const getNavigationItems = useCallback(() => {
    const roleFeatures = ROLE_FEATURES[context.salonRole]
    return roleFeatures?.navigation || []
  }, [context.salonRole])

  /**
   * Execute database operation within secure context
   */
  const executeSecurely = useCallback(
    async <T,>(
      operation: (client: any) => Promise<T>,
      options?: { bypassRLS?: boolean }
    ): Promise<T> => {
      return context.executeSecurely(operation, options)
    },
    [context]
  )

  /**
   * Check financial data access permissions
   */
  const canViewFinancials = useMemo(() => {
    return hasAnyPermission([
      SALON_PERMISSIONS.FINANCE.VIEW_REVENUE,
      SALON_PERMISSIONS.FINANCE.VIEW_EXPENSES
    ])
  }, [hasAnyPermission])

  /**
   * Check POS access permissions
   */
  const canUsePOS = useMemo(() => {
    return hasAnyPermission([SALON_PERMISSIONS.POS.OPERATE, SALON_PERMISSIONS.POS.PROCESS_SALES])
  }, [hasAnyPermission])

  /**
   * Check staff management permissions
   */
  const canManageStaff = useMemo(() => {
    return hasAnyPermission([SALON_PERMISSIONS.STAFF.MANAGE, SALON_PERMISSIONS.STAFF.SCHEDULE])
  }, [hasAnyPermission])

  /**
   * Check customer management permissions
   */
  const canManageCustomers = useMemo(() => {
    return hasAnyPermission([
      SALON_PERMISSIONS.CUSTOMERS.CREATE,
      SALON_PERMISSIONS.CUSTOMERS.MODIFY,
      SALON_PERMISSIONS.CUSTOMERS.VIEW_ALL
    ])
  }, [hasAnyPermission])

  /**
   * Get role-specific error messages
   */
  const getAccessDeniedMessage = useCallback((feature: string): string => {
    const messages: Record<string, string> = {
      finance: 'Financial data access is restricted to owners, managers, and accountants.',
      staff: 'Staff management requires owner or manager permissions.',
      settings: 'System settings require administrator permissions.',
      pos: 'POS access is limited to front-desk staff and management.',
      inventory: 'Inventory management requires manager permissions.',
      reports: 'Report access varies by role. Contact your manager for access.'
    }

    return messages[feature] || 'You do not have permission to access this feature.'
  }, [])

  /**
   * Security audit logging for sensitive actions
   */
  const logSecurityEvent = useCallback(
    async (eventType: string, details: Record<string, any>) => {
      try {
        await executeSecurely(async client => {
          await client.from('hera_audit_log').insert({
            event_type: 'salon_security_event',
            organization_id: context.orgId,
            user_id: context.userId,
            role: context.role,
            auth_mode: context.authMode,
            details: {
              salon_role: context.salonRole,
              event_type: eventType,
              ...details
            },
            timestamp: new Date().toISOString()
          })
        })
      } catch (error) {
        console.error('Failed to log security event:', error)
      }
    },
    [context, executeSecurely]
  )

  return {
    // Context information
    user: context.user,
    role: context.salonRole,
    permissions: context.permissions,
    organizationId: context.orgId,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,

    // Permission checking
    hasPermission,
    hasAnyPermission,
    canAccess,

    // Feature-specific permissions
    canViewFinancials,
    canUsePOS,
    canManageStaff,
    canManageCustomers,

    // Role-based data
    getDashboardWidgets,
    getNavigationItems,
    getAccessDeniedMessage,

    // Secure operations
    executeSecurely,
    logSecurityEvent,

    // Utility functions
    retry: context.retry
  }
}

/**
 * Hook for financial operations security
 */
export function useSalonFinancialSecurity() {
  const { hasPermission, canViewFinancials, executeSecurely, logSecurityEvent } = useSalonSecurity()

  const canProcessPayments = hasPermission(SALON_PERMISSIONS.FINANCE.PROCESS_PAYMENTS)
  const canRefundPayments = hasPermission(SALON_PERMISSIONS.FINANCE.REFUND_PAYMENTS)
  const canExportFinancial = hasPermission(SALON_PERMISSIONS.FINANCE.EXPORT_FINANCIAL)
  const canManagePricing = hasPermission(SALON_PERMISSIONS.FINANCE.MANAGE_PRICING)

  const logFinancialAction = useCallback(
    async (action: string, amount?: number, details?: any) => {
      await logSecurityEvent('financial_action', {
        action,
        amount,
        ...details
      })
    },
    [logSecurityEvent]
  )

  return {
    canViewFinancials,
    canProcessPayments,
    canRefundPayments,
    canExportFinancial,
    canManagePricing,
    executeSecurely,
    logFinancialAction
  }
}

/**
 * Hook for POS operations security
 */
export function useSalonPOSSecurity() {
  const { hasPermission, canUsePOS, executeSecurely, logSecurityEvent } = useSalonSecurity()

  const canManageCarts = hasPermission(SALON_PERMISSIONS.POS.MANAGE_CARTS)
  const canProcessSales = hasPermission(SALON_PERMISSIONS.POS.PROCESS_SALES)
  const canHandleReturns = hasPermission(SALON_PERMISSIONS.POS.HANDLE_RETURNS)
  const canApplyDiscounts = hasPermission(SALON_PERMISSIONS.POS.APPLY_DISCOUNTS)

  const logPOSAction = useCallback(
    async (action: string, transactionId?: string, amount?: number) => {
      await logSecurityEvent('pos_action', {
        action,
        transaction_id: transactionId,
        amount
      })
    },
    [logSecurityEvent]
  )

  return {
    canUsePOS,
    canManageCarts,
    canProcessSales,
    canHandleReturns,
    canApplyDiscounts,
    executeSecurely,
    logPOSAction
  }
}

/**
 * Higher-order component for protected salon components
 */
export function withSalonPermissions(
  requiredPermissions: string[],
  fallbackComponent?: React.ComponentType
) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedComponent(props: P) {
      const { hasAnyPermission, getAccessDeniedMessage } = useSalonSecurity()

      if (!hasAnyPermission(requiredPermissions)) {
        if (fallbackComponent) {
          const FallbackComponent = fallbackComponent
          return <FallbackComponent />
        }

        return (
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{getAccessDeniedMessage('feature')}</p>
          </div>
        )
      }

      return <Component {...props} />
    }
  }
}

export default useSalonSecurity
