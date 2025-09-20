/**
 * HERA Authorization DNA Hook
 * Universal authentication hook for all industries
 */

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useEffect, useState } from 'react'

// Industry-specific demo user types
export type DemoUserType = 
  | 'salon-receptionist' | 'salon-stylist' | 'salon-manager'
  | 'restaurant-cashier' | 'restaurant-server' | 'restaurant-manager'
  | 'healthcare-nurse' | 'healthcare-doctor' | 'healthcare-receptionist'
  | 'manufacturing-operator' | 'manufacturing-supervisor' | 'manufacturing-planner'

// Scope patterns for authorization checking
export interface ScopePattern {
  read: (module: string, entity: string) => string
  write: (module: string, entity: string) => string
  admin: (module: string) => string
}

// Industry configurations
const INDUSTRY_CONFIGS = {
  salon: {
    name: 'Beauty Salon',
    modules: ['SERVICE', 'CRM', 'INVENTORY', 'STAFF', 'FIN'],
    demo_roles: ['receptionist', 'stylist', 'manager'],
    session_duration: 30 * 60 * 1000,
    scope_prefix: 'HERA.SALON'
  },
  restaurant: {
    name: 'Restaurant',
    modules: ['POS', 'MENU', 'CRM', 'INVENTORY', 'STAFF', 'FIN'],
    demo_roles: ['cashier', 'server', 'manager'],
    session_duration: 30 * 60 * 1000,
    scope_prefix: 'HERA.REST'
  },
  healthcare: {
    name: 'Healthcare Practice',
    modules: ['PAT', 'APPOINTMENT', 'MEDICATION', 'INSURANCE', 'FIN'],
    demo_roles: ['nurse', 'doctor', 'receptionist'],
    session_duration: 45 * 60 * 1000,
    scope_prefix: 'HERA.HLTH'
  },
  manufacturing: {
    name: 'Manufacturing Plant',
    modules: ['PRODUCTION', 'QUALITY', 'INVENTORY', 'STAFF', 'FIN'],
    demo_roles: ['operator', 'supervisor', 'planner'],
    session_duration: 60 * 60 * 1000,
    scope_prefix: 'HERA.MFG'
  }
}

export interface HERAAuthDNAHook {
  // Core authentication
  user: any
  organization: any
  isAuthenticated: boolean
  isLoading: boolean
  
  // Authorization
  hasScope: (scope: string) => boolean
  hasModuleAccess: (module: string, permission: 'read' | 'write') => boolean
  hasEntityAccess: (module: string, entity: string, permission: 'read' | 'write') => boolean
  
  // Industry helpers
  industry: string | null
  industryConfig: any
  availableModules: string[]
  userRole: string | null
  
  // Session management
  sessionType: 'demo' | 'real' | null
  timeRemaining: number
  isExpired: boolean
  sessionInfo: any
  
  // Demo functions
  initializeDemo: (demoType: DemoUserType) => Promise<boolean>
  logout: () => Promise<void>
  
  // Scope builders
  scope: ScopePattern
}

export function useHERAAuthDNA(): HERAAuthDNAHook {
  const heraAuth = useHERAAuth()
  const [industry, setIndustry] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Detect industry from user role or organization
  useEffect(() => {
    if (heraAuth.user?.role) {
      const roleMatch = heraAuth.user.role.match(/HERA\.SEC\.ROLE\.\w+\.(\w+)\.v\d+/)
      if (roleMatch) {
        // Extract industry from smart code pattern
        const detectedIndustry = detectIndustryFromSmartCode(heraAuth.user.role)
        setIndustry(detectedIndustry)
      }
    }
    
    if (heraAuth.organization?.type) {
      setIndustry(heraAuth.organization.type)
    }
  }, [heraAuth.user, heraAuth.organization])

  // Extract user role
  useEffect(() => {
    if (heraAuth.user?.role) {
      const roleMatch = heraAuth.user.role.match(/ROLE\.(\w+)\./)
      if (roleMatch) {
        setUserRole(roleMatch[1].toLowerCase())
      }
    }
  }, [heraAuth.user])

  // Get industry configuration
  const industryConfig = industry ? INDUSTRY_CONFIGS[industry as keyof typeof INDUSTRY_CONFIGS] : null

  // Enhanced authorization helpers
  const hasModuleAccess = (module: string, permission: 'read' | 'write'): boolean => {
    if (!industryConfig) return false
    
    const scopePattern = `${permission}:${industryConfig.scope_prefix}.${module.toUpperCase()}`
    return heraAuth.scopes.some(scope => 
      scope.startsWith(scopePattern) || scope.endsWith('*')
    )
  }

  const hasEntityAccess = (module: string, entity: string, permission: 'read' | 'write'): boolean => {
    if (!industryConfig) return false
    
    const fullScope = `${permission}:${industryConfig.scope_prefix}.${module.toUpperCase()}.${entity.toUpperCase()}`
    return heraAuth.hasScope(fullScope)
  }

  // Scope pattern builders for dynamic scope checking
  const scope: ScopePattern = {
    read: (module: string, entity: string) => {
      if (!industryConfig) return ''
      return `read:${industryConfig.scope_prefix}.${module.toUpperCase()}.${entity.toUpperCase()}`
    },
    write: (module: string, entity: string) => {
      if (!industryConfig) return ''
      return `write:${industryConfig.scope_prefix}.${module.toUpperCase()}.${entity.toUpperCase()}`
    },
    admin: (module: string) => {
      if (!industryConfig) return ''
      return `admin:${industryConfig.scope_prefix}.${module.toUpperCase()}`
    }
  }

  // Session information
  const sessionInfo = {
    industry: industry,
    role: userRole,
    organization: heraAuth.organization?.name,
    sessionDuration: industryConfig?.session_duration,
    expiresAt: heraAuth.user?.expires_at
  }

  return {
    // Core authentication (pass-through from HERAAuth)
    user: heraAuth.user,
    organization: heraAuth.organization,
    isAuthenticated: heraAuth.isAuthenticated,
    isLoading: heraAuth.isLoading,
    
    // Enhanced authorization
    hasScope: heraAuth.hasScope,
    hasModuleAccess,
    hasEntityAccess,
    
    // Industry context
    industry,
    industryConfig,
    availableModules: industryConfig?.modules || [],
    userRole,
    
    // Session management
    sessionType: heraAuth.sessionType,
    timeRemaining: heraAuth.timeRemaining,
    isExpired: heraAuth.isExpired,
    sessionInfo,
    
    // Actions
    initializeDemo: heraAuth.initializeDemo,
    logout: heraAuth.logout,
    
    // Scope utilities
    scope
  }
}

// Utility function to detect industry from smart codes
function detectIndustryFromSmartCode(smartCode: string): string | null {
  if (smartCode.includes('.SALON.')) return 'salon'
  if (smartCode.includes('.REST.')) return 'restaurant'
  if (smartCode.includes('.HLTH.')) return 'healthcare'
  if (smartCode.includes('.MFG.')) return 'manufacturing'
  return null
}

// Industry-specific hooks for common use cases
export function useSalonAuth() {
  const auth = useHERAAuthDNA()
  
  return {
    ...auth,
    // Salon-specific helpers
    canManageAppointments: auth.hasEntityAccess('SERVICE', 'APPOINTMENT', 'write'),
    canViewCustomers: auth.hasEntityAccess('CRM', 'CUSTOMER', 'read'),
    canManageInventory: auth.hasEntityAccess('INVENTORY', 'PRODUCT', 'write'),
    canAccessFinancials: auth.hasModuleAccess('FIN', 'read'),
    isReceptionist: auth.userRole === 'receptionist',
    isStylist: auth.userRole === 'stylist',
    isManager: auth.userRole === 'manager'
  }
}

export function useRestaurantAuth() {
  const auth = useHERAAuthDNA()
  
  return {
    ...auth,
    // Restaurant-specific helpers
    canTakeOrders: auth.hasEntityAccess('POS', 'ORDER', 'write'),
    canManageMenu: auth.hasEntityAccess('MENU', 'ITEM', 'write'),
    canViewRevenue: auth.hasEntityAccess('FIN', 'REVENUE', 'read'),
    canManageStaff: auth.hasModuleAccess('STAFF', 'write'),
    isCashier: auth.userRole === 'cashier',
    isServer: auth.userRole === 'server',
    isManager: auth.userRole === 'manager'
  }
}

export function useHealthcareAuth() {
  const auth = useHERAAuthDNA()
  
  return {
    ...auth,
    // Healthcare-specific helpers
    canAccessPatientRecords: auth.hasEntityAccess('PAT', 'RECORD', 'read'),
    canWritePrescriptions: auth.hasEntityAccess('PAT', 'PRESCRIPTION', 'write'),
    canManageAppointments: auth.hasEntityAccess('APPOINTMENT', 'SCHEDULE', 'write'),
    canAccessInsurance: auth.hasEntityAccess('INSURANCE', 'CLAIM', 'read'),
    isNurse: auth.userRole === 'nurse',
    isDoctor: auth.userRole === 'doctor',
    isReceptionist: auth.userRole === 'receptionist'
  }
}

export function useManufacturingAuth() {
  const auth = useHERAAuthDNA()
  
  return {
    ...auth,
    // Manufacturing-specific helpers
    canOperateMachines: auth.hasEntityAccess('PRODUCTION', 'ORDER', 'write'),
    canApproveQuality: auth.hasEntityAccess('QUALITY', 'CHECK', 'write'),
    canPlanProduction: auth.hasEntityAccess('PRODUCTION', 'SCHEDULE', 'write'),
    canManageMaterials: auth.hasEntityAccess('INVENTORY', 'MATERIAL', 'write'),
    isOperator: auth.userRole === 'operator',
    isSupervisor: auth.userRole === 'supervisor',
    isPlanner: auth.userRole === 'planner'
  }
}

// Demo initialization helpers
export const DEMO_USER_CONFIGS = {
  // Salon
  'salon-receptionist': 'Salon Receptionist - Appointment booking and customer management',
  'salon-stylist': 'Hair Stylist - Service delivery and customer interaction',
  'salon-manager': 'Salon Manager - Full salon operations and staff management',
  
  // Restaurant
  'restaurant-cashier': 'Restaurant Cashier - Order taking and payment processing',
  'restaurant-server': 'Restaurant Server - Table service and order management',
  'restaurant-manager': 'Restaurant Manager - Full restaurant operations',
  
  // Healthcare
  'healthcare-nurse': 'Registered Nurse - Patient care and medical records',
  'healthcare-doctor': 'Medical Doctor - Full patient care and prescriptions',
  'healthcare-receptionist': 'Medical Receptionist - Appointment scheduling and patient check-in',
  
  // Manufacturing
  'manufacturing-operator': 'Machine Operator - Production line operations',
  'manufacturing-supervisor': 'Production Supervisor - Team and quality management',
  'manufacturing-planner': 'Production Planner - Scheduling and resource planning'
}

export default useHERAAuthDNA