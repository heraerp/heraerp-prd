'use client'

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { dbContext } from '@/lib/security/database-context'
import { createSecurityContextFromAuth } from '@/lib/security/user-entity-resolver'
import type { SecurityContext } from '@/lib/security/database-context'
import { Card } from '@/components/ui/card'

// Create a simple persistent query client
const createSimpleQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

// Global salon query client - persists across navigation
let globalSalonQueryClient: QueryClient | null = null

const getOrCreateSalonQueryClient = () => {
  if (!globalSalonQueryClient) {
    globalSalonQueryClient = createSimpleQueryClient()
  }
  return globalSalonQueryClient
}

// Branch interface
interface Branch {
  id: string
  entity_name: string
  entity_code?: string
  dynamic_fields?: any
  metadata?: any
}

// Salon context interface - includes security context
interface SalonContextType extends SecurityContext {
  // Alias for backward compatibility
  organizationId: string | null
  
  // Security context
  salonRole: 'owner' | 'manager' | 'receptionist' | 'stylist' | 'accountant' | 'admin'
  permissions: string[]
  organization: {
    id: string
    name: string
    settings?: any
  }
  user: any
  isAuthenticated: boolean
  
  // Branch context
  selectedBranchId: string | null
  selectedBranch: Branch | null
  availableBranches: Branch[]
  setSelectedBranchId: (branchId: string) => void
  
  // Preloaded data with loading states
  branches: any[]
  staff: any[]
  customers: any[]
  services: any[]
  todayAppointments: any[]
  
  // Loading states
  isInitialLoading: boolean
  isCriticalDataLoaded: boolean
  loadingStates: {
    branches: boolean
    staff: boolean
    customers: boolean
    services: boolean
    appointments: boolean
  }
  
  // Error states
  errors: {
    branches?: Error
    staff?: Error
    customers?: Error
    services?: Error
    appointments?: Error
  }
  
  // Actions
  prefetchData: (dataType: string) => Promise<void>
  invalidateData: (dataType: string) => Promise<void>
  refreshAll: () => Promise<void>
  
  // UI state management
  uiState: any
  updateUIState: (updates: any) => void
  
  // Performance metrics
  performanceMetrics: {
    cacheHitRate: number
    averageLoadTime: number
    lastRefresh: number
  }
  
  // Security methods
  executeSecurely: <T>(operation: (client: any) => Promise<T>) => Promise<T>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  retry: () => Promise<void>
}

const SalonContext = createContext<SalonContextType | undefined>(undefined)

// Hook to use salon context - compatible with useSecuredSalonContext
export const useOptimizedSalonContext = () => {
  const context = useContext(SalonContext)
  if (context === undefined) {
    throw new Error('useOptimizedSalonContext must be used within OptimizedSalonProvider')
  }
  return context
}

// Compatibility alias for existing code
export const useSecuredSalonContext = useOptimizedSalonContext

// Salon-specific role permissions
const SALON_ROLE_PERMISSIONS = {
  owner: [
    'salon:read:all',
    'salon:write:all',
    'salon:delete:all',
    'salon:admin:full',
    'salon:finance:full',
    'salon:staff:manage',
    'salon:settings:manage'
  ],
  manager: [
    'salon:read:operations',
    'salon:write:operations',
    'salon:finance:read',
    'salon:staff:schedule',
    'salon:inventory:manage',
    'salon:appointments:manage',
    'salon:customers:manage'
  ],
  receptionist: [
    'salon:read:appointments',
    'salon:write:appointments',
    'salon:read:customers',
    'salon:write:customers',
    'salon:pos:operate',
    'salon:checkin:manage'
  ],
  stylist: [
    'salon:read:appointments:own',
    'salon:write:appointments:own',
    'salon:read:customers:assigned',
    'salon:pos:process:services',
    'salon:schedule:view'
  ],
  accountant: [
    'salon:read:finance',
    'salon:write:finance',
    'salon:read:reports',
    'salon:export:financial',
    'salon:vat:manage'
  ],
  admin: [
    'salon:read:system',
    'salon:write:system',
    'salon:users:manage',
    'salon:security:manage',
    'salon:backup:manage'
  ]
}

interface OptimizedSalonProviderProps {
  children: React.ReactNode
}

export function OptimizedSalonProvider({ children }: OptimizedSalonProviderProps) {
  const { user, currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [performanceStartTime] = useState(Date.now())
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cacheHitRate: 0,
    averageLoadTime: 0,
    lastRefresh: 0
  })

  // Get or create persistent query client
  const queryClient = useMemo(() => getOrCreateSalonQueryClient(), [])

  // Security state
  const [securityContext, setSecurityContext] = useState<SecurityContext | null>(null)
  const [salonRole, setSalonRole] = useState<SalonContextType['salonRole']>('owner')
  const [permissions, setPermissions] = useState<string[]>([])
  const [isSecurityLoading, setIsSecurityLoading] = useState(true)
  const [securityError, setSecurityError] = useState<string | null>(null)

  // Branch state
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedBranchId')
    }
    return null
  })

  // Organization data
  const organizationId = securityContext?.orgId || currentOrganization?.id || null
  const userId = securityContext?.userId || user?.id || null

  // Simple UI state without complex storage
  const [uiState, setUIState] = useState({})

  // Update UI state handler
  const updateUIState = useCallback((updates: any) => {
    setUIState(prev => ({ ...prev, ...updates }))
  }, [])

  // Security initialization
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsSecurityLoading(false)
      return
    }

    initializeSecurityContext()
  }, [isAuthenticated, user])

  const initializeSecurityContext = async () => {
    try {
      setIsSecurityLoading(true)
      setSecurityError(null)

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('No active session')
      }

      // Create security context
      const contextResolution = await createSecurityContextFromAuth(session.user.id, {
        accessToken: session.access_token,
        retries: 2
      })

      if (!contextResolution.success || !contextResolution.securityContext) {
        throw new Error(`Failed to resolve security context: ${contextResolution.error?.message}`)
      }

      const secCtx = contextResolution.securityContext
      setSecurityContext(secCtx)

      // Get salon role
      const role = await getSalonRole(secCtx)
      setSalonRole(role)
      setPermissions(SALON_ROLE_PERMISSIONS[role] || [])

      setIsSecurityLoading(false)
    } catch (error: any) {
      console.error('Security initialization failed:', error)
      setSecurityError(error.message)
      setIsSecurityLoading(false)
    }
  }

  const getSalonRole = async (secCtx: SecurityContext): Promise<SalonContextType['salonRole']> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        if (user.email.includes('michele')) return 'owner'
        if (user.email.includes('manager')) return 'manager'
        if (user.email.includes('receptionist')) return 'receptionist'
        if (user.email.includes('stylist')) return 'stylist'
        if (user.email.includes('accountant')) return 'accountant'
        return 'owner' // Default
      }
      return 'owner'
    } catch {
      return 'owner'
    }
  }

  // Security methods
  const executeSecurely = useCallback(async <T,>(operation: (client: any) => Promise<T>): Promise<T> => {
    if (!securityContext) {
      throw new Error('Not authenticated')
    }
    return dbContext.executeWithContext(securityContext, operation)
  }, [securityContext])

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission) || permissions.includes('salon:admin:full')
  }, [permissions])

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    return perms.some(permission => hasPermission(permission))
  }, [hasPermission])

  const handleSetBranch = useCallback((branchId: string) => {
    setSelectedBranchIdState(branchId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBranchId', branchId)
    }
  }, [])

  // Simplified data loading - just use empty arrays for now
  const branches: any[] = []
  const staff: any[] = []
  const customers: any[] = []
  const services: any[] = []
  const todayAppointments: any[] = []
  
  // Simple loading states
  const isInitialLoading = isSecurityLoading
  const isCriticalDataLoaded = !isSecurityLoading && !!securityContext
  const loadingStates = {
    branches: false,
    staff: false,
    customers: false,
    services: false,
    appointments: false
  }

  // Simple error states
  const errors = {
    branches: undefined,
    staff: undefined,
    customers: undefined,
    services: undefined,
    appointments: undefined
  }

  // Simplified action handlers
  const prefetchData = useCallback(async (dataType: string) => {
    // TODO: Implement when needed
    console.log('Prefetch data:', dataType)
  }, [])

  const invalidateData = useCallback(async (dataType: string) => {
    // TODO: Implement when needed
    console.log('Invalidate data:', dataType)
  }, [])

  const refreshAll = useCallback(async () => {
    setPerformanceMetrics(prev => ({ ...prev, lastRefresh: Date.now() }))
    // TODO: Implement when needed
    console.log('Refresh all data')
  }, [])

  // Context value
  const contextValue: SalonContextType = {
    // Security context
    orgId: organizationId || '',
    organizationId,
    userId: userId || '',
    role: securityContext?.role || 'user',
    authMode: securityContext?.authMode || 'supabase',
    salonRole,
    permissions,
    organization: currentOrganization || { id: organizationId || '', name: 'Salon' },
    user,
    isLoading: isSecurityLoading || isInitialLoading,
    isAuthenticated: isAuthenticated && !!securityContext,
    
    // Branch context
    selectedBranchId,
    selectedBranch: branches.find((b: any) => b.id === selectedBranchId) || null,
    availableBranches: branches,
    setSelectedBranchId: handleSetBranch,
    
    // Preloaded data
    branches,
    staff,
    customers,
    services,
    todayAppointments,
    
    // Loading states
    isInitialLoading: isInitialLoading || isSecurityLoading,
    isCriticalDataLoaded: isCriticalDataLoaded && !isSecurityLoading,
    loadingStates,
    
    // Error states
    errors,
    
    // Actions
    prefetchData,
    invalidateData,
    refreshAll,
    
    // UI state
    uiState,
    updateUIState,
    
    // Performance metrics
    performanceMetrics,
    
    // Security methods
    executeSecurely,
    hasPermission,
    hasAnyPermission,
    retry: initializeSecurityContext
  }

  // Show security error
  if (securityError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">
              Security Error
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {securityError}
            </p>
            <button 
              onClick={initializeSecurityContext}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SalonContext.Provider value={contextValue}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools 
            initialIsOpen={false} 
            position="bottom-right"
            buttonPosition="bottom-right"
          />
        )}
      </SalonContext.Provider>
    </QueryClientProvider>
  )
}

// Loading component for salon app
export function SalonLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-lg font-semibold mb-2">Loading Salon...</h2>
        <p className="text-sm text-gray-600">
          Preparing your salon management system
        </p>
        <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  )
}

// HOC for salon pages to ensure data is loaded
export function withSalonData<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredData: string[] = []
) {
  return function SalonDataWrapper(props: P) {
    const { isInitialLoading, isCriticalDataLoaded, errors } = useOptimizedSalonContext()
    
    // Show loading if initial load
    if (isInitialLoading) {
      return <SalonLoadingScreen />
    }
    
    // Show error if critical data failed
    if (!isCriticalDataLoaded && Object.values(errors).some(error => error)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2 text-red-600">
              Failed to load salon data
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Please refresh the page or contact support
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
}