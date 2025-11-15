/**
 * Workspace Context Provider
 * Smart Code: HERA.WORKSPACE.CONTEXT.v1
 * 
 * Provides workspace-aware context for Universal CRUD components.
 * Automatically configures components based on domain/section routing.
 * 
 * Features:
 * - Automatic context detection from URL parameters
 * - Domain/section-specific configuration
 * - Transaction type filtering and customization
 * - Workspace-aware permissions and access control
 * - Integration with Universal CRUD components
 */

import { createContext, useContext, ReactNode } from 'react'
import { WorkspaceContext, transactionTypeRegistry, TransactionTypeConfig } from './transaction-types'

export interface WorkspaceContextType extends WorkspaceContext {
  // Computed properties
  displayName: string
  breadcrumbs: Array<{ label: string; path?: string }>
  
  // Configuration
  availableTransactionTypes: TransactionTypeConfig[]
  defaultTransactionType: TransactionTypeConfig | null
  
  // Methods
  getTransactionTypeConfig: (typeId: string) => TransactionTypeConfig | null
  isTransactionTypeAllowed: (typeId: string) => boolean
  getWorkspaceColor: () => string
  getWorkspaceIcon: () => string
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function useWorkspaceContext(): WorkspaceContextType {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceContextProvider')
  }
  return context
}

export interface WorkspaceContextProviderProps {
  domain: string
  section: string
  organizationId: string
  children: ReactNode
}

export function WorkspaceContextProvider({ 
  domain, 
  section, 
  organizationId, 
  children 
}: WorkspaceContextProviderProps) {
  const baseContext: WorkspaceContext = {
    domain,
    section,
    organization_id: organizationId
  }
  
  // Get available transaction types for this workspace
  const availableTransactionTypes = transactionTypeRegistry.getTransactionTypesForWorkspace(baseContext)
  const defaultTransactionType = availableTransactionTypes[0] || null
  
  // Generate display name and breadcrumbs
  const displayName = `${formatDisplayName(domain)} ${formatDisplayName(section)}`
  const breadcrumbs = [
    { label: 'Dashboard', path: '/retail/dashboard' },
    { label: formatDisplayName(domain), path: `/retail/domains/${domain}` },
    { label: formatDisplayName(section) }
  ]
  
  const contextValue: WorkspaceContextType = {
    ...baseContext,
    displayName,
    breadcrumbs,
    availableTransactionTypes,
    defaultTransactionType,
    
    getTransactionTypeConfig: (typeId: string) => 
      transactionTypeRegistry.getTransactionTypeConfig(typeId, baseContext),
    
    isTransactionTypeAllowed: (typeId: string) =>
      availableTransactionTypes.some(t => t.id === typeId),
    
    getWorkspaceColor: () => getWorkspaceTheme(domain).color,
    getWorkspaceIcon: () => getWorkspaceTheme(domain).icon
  }
  
  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// ===============================================================================
// UTILITY FUNCTIONS
// ===============================================================================

function formatDisplayName(text: string): string {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface WorkspaceTheme {
  color: string
  icon: string
  primaryColor: string
  secondaryColor: string
}

function getWorkspaceTheme(domain: string): WorkspaceTheme {
  const themes: Record<string, WorkspaceTheme> = {
    sales: {
      color: 'text-green-600 bg-green-50',
      icon: 'DollarSign',
      primaryColor: 'green',
      secondaryColor: 'emerald'
    },
    purchase: {
      color: 'text-purple-600 bg-purple-50', 
      icon: 'ShoppingCart',
      primaryColor: 'purple',
      secondaryColor: 'violet'
    },
    inventory: {
      color: 'text-amber-600 bg-amber-50',
      icon: 'Package',
      primaryColor: 'amber',
      secondaryColor: 'yellow'
    },
    finance: {
      color: 'text-indigo-600 bg-indigo-50',
      icon: 'Calculator',
      primaryColor: 'indigo',
      secondaryColor: 'blue'
    },
    analytics: {
      color: 'text-slate-600 bg-slate-50',
      icon: 'BarChart3',
      primaryColor: 'slate',
      secondaryColor: 'gray'
    },
    operations: {
      color: 'text-orange-600 bg-orange-50',
      icon: 'Settings',
      primaryColor: 'orange',
      secondaryColor: 'red'
    }
  }
  
  return themes[domain] || themes.analytics
}

// Workspace-specific permissions and access control
export interface WorkspacePermissions {
  canCreateTransactions: boolean
  canEditTransactions: boolean
  canDeleteTransactions: boolean
  canApproveTransactions: boolean
  canViewAnalytics: boolean
  canManageWorkflows: boolean
  canExportData: boolean
  canManageEntities: boolean
}

export function getWorkspacePermissions(
  domain: string, 
  section: string, 
  userRole?: string
): WorkspacePermissions {
  // Default permissions - in real implementation would come from database
  const defaultPermissions: WorkspacePermissions = {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: false,
    canApproveTransactions: false,
    canViewAnalytics: true,
    canManageWorkflows: false,
    canExportData: true,
    canManageEntities: true
  }
  
  // Role-based overrides
  if (userRole === 'admin' || userRole === 'manager') {
    return {
      ...defaultPermissions,
      canDeleteTransactions: true,
      canApproveTransactions: true,
      canManageWorkflows: true
    }
  }
  
  if (userRole === 'viewer' || userRole === 'readonly') {
    return {
      ...defaultPermissions,
      canCreateTransactions: false,
      canEditTransactions: false,
      canDeleteTransactions: false,
      canApproveTransactions: false,
      canManageWorkflows: false,
      canExportData: false,
      canManageEntities: false
    }
  }
  
  return defaultPermissions
}

// Hook for workspace-specific permissions
export function useWorkspacePermissions(): WorkspacePermissions {
  const context = useWorkspaceContext()
  // In real implementation, would also get user role from auth context
  return getWorkspacePermissions(context.domain, context.section)
}