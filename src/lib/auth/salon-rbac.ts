/**
 * Salon Role-Based Access Control (RBAC)
 *
 * Defines page access permissions for salon roles
 * Used by middleware and client-side navigation guards
 */

export type SalonRole = 'owner' | 'manager' | 'receptionist' | 'accountant'

export interface PageAccessRule {
  path: string
  allowedRoles: SalonRole[]
  description: string
}

/**
 * Page Access Control Matrix
 *
 * Owner: Full access to all pages
 * Manager: Access to operations and reports (no finance)
 * Receptionist: Access to POS, appointments, customers only
 * Accountant: Access to finance and reports only
 */
export const SALON_PAGE_ACCESS: PageAccessRule[] = [
  // ==================== RESTRICTED PAGES ====================
  // Owner-only pages
  {
    path: '/salon/dashboard',
    allowedRoles: ['owner'],
    description: 'Owner Dashboard - Business overview and analytics'
  },
  {
    path: '/salon/owner-dashboard',
    allowedRoles: ['owner'],
    description: 'Owner Dashboard (alternate)'
  },
  {
    path: '/salon/owner',
    allowedRoles: ['owner'],
    description: 'Owner Portal'
  },

  // Finance pages - Owner and Accountant only
  {
    path: '/salon/finance',
    allowedRoles: ['owner', 'accountant'],
    description: 'Finance Management'
  },
  {
    path: '/salon/finance-entry',
    allowedRoles: ['owner', 'accountant'],
    description: 'Finance Entry'
  },
  {
    path: '/salon/coa',
    allowedRoles: ['owner', 'accountant'],
    description: 'Chart of Accounts'
  },
  {
    path: '/salon/balance-sheet',
    allowedRoles: ['owner', 'accountant'],
    description: 'Balance Sheet'
  },
  {
    path: '/salon/profit-loss',
    allowedRoles: ['owner', 'accountant'],
    description: 'Profit & Loss Statement'
  },
  {
    path: '/salon/trial-balance',
    allowedRoles: ['owner', 'accountant'],
    description: 'Trial Balance'
  },

  // Reports - Owner, Manager, Accountant only
  {
    path: '/salon/reports',
    allowedRoles: ['owner', 'manager', 'accountant'],
    description: 'Reports Dashboard'
  },
  {
    path: '/salon/reports/sales/daily',
    allowedRoles: ['owner', 'manager', 'accountant'],
    description: 'Daily Sales Report'
  },
  {
    path: '/salon/reports/sales/monthly',
    allowedRoles: ['owner', 'manager', 'accountant'],
    description: 'Monthly Sales Report'
  },
  {
    path: '/salon/reports/branch-pnl',
    allowedRoles: ['owner', 'manager', 'accountant'],
    description: 'Branch P&L Report'
  },

  // Admin/Settings - Owner and Manager only
  {
    path: '/salon/admin',
    allowedRoles: ['owner', 'manager'],
    description: 'Admin Panel'
  },
  {
    path: '/salon/admin/dashboard',
    allowedRoles: ['owner', 'manager'],
    description: 'Admin Dashboard'
  },
  {
    path: '/salon/settings',
    allowedRoles: ['owner', 'manager'],
    description: 'Settings'
  },
  {
    path: '/salon/settings/inventory',
    allowedRoles: ['owner', 'manager'],
    description: 'Inventory Settings'
  },
  {
    path: '/salon/team-management',
    allowedRoles: ['owner', 'manager'],
    description: 'Team Management'
  },
  {
    path: '/salon/users',
    allowedRoles: ['owner', 'manager'],
    description: 'User Management'
  },
  {
    path: '/salon/branches',
    allowedRoles: ['owner', 'manager'],
    description: 'Branch Management'
  },

  // Inventory - Owner and Manager only
  {
    path: '/salon/inventory',
    allowedRoles: ['owner', 'manager'],
    description: 'Inventory Management'
  },

  // Compliance - Owner and Accountant only
  {
    path: '/salon/compliance',
    allowedRoles: ['owner', 'accountant'],
    description: 'Compliance & Regulatory'
  },

  // ==================== SHARED PAGES ====================
  // Operational pages - All roles can access
  {
    path: '/salon/receptionist',
    allowedRoles: ['owner', 'manager', 'receptionist', 'accountant'],
    description: 'Receptionist Dashboard'
  },
  {
    path: '/salon/pos',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Point of Sale'
  },
  {
    path: '/salon/pos/payments',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'POS Payments'
  },
  {
    path: '/salon/appointments',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Appointments List'
  },
  {
    path: '/salon/appointments/calendar',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Appointments Calendar'
  },
  {
    path: '/salon/appointments/new',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'New Appointment'
  },
  {
    path: '/salon/customers',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Customers List'
  },
  {
    path: '/salon/customers/new',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'New Customer'
  },
  {
    path: '/salon/customers-v2',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Customers (v2)'
  },

  // Services & Products - Owner and Manager can edit, Receptionist can view
  {
    path: '/salon/services',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Services Management'
  },
  {
    path: '/salon/service-categories',
    allowedRoles: ['owner', 'manager'],
    description: 'Service Categories'
  },
  {
    path: '/salon/products',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Products Management'
  },
  {
    path: '/salon/products/categories',
    allowedRoles: ['owner', 'manager'],
    description: 'Product Categories'
  },
  {
    path: '/salon/products-universal',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Products (Universal)'
  },

  // Staff management - Owner, Manager, and Receptionist can view
  {
    path: '/salon/staffs',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Staff Management'
  },
  {
    path: '/salon/staff-v2',
    allowedRoles: ['owner', 'manager', 'receptionist'],
    description: 'Staff Management (v2)'
  },

  // Leave management - All roles can view their own
  {
    path: '/salon/leave',
    allowedRoles: ['owner', 'manager', 'receptionist', 'accountant'],
    description: 'Leave Management'
  },

  // Gift cards - Owner and Manager only
  {
    path: '/salon/gift-cards',
    allowedRoles: ['owner', 'manager'],
    description: 'Gift Cards'
  },

  // Accountant-specific pages
  {
    path: '/salon/accountant',
    allowedRoles: ['owner', 'accountant'],
    description: 'Accountant Dashboard'
  },
]

/**
 * Check if a user role has access to a specific page
 */
export function hasPageAccess(role: SalonRole, path: string): boolean {
  // Owner has access to all pages
  if (role === 'owner') {
    return true
  }

  // Normalize path (remove trailing slash, query params)
  const normalizedPath = path.split('?')[0].replace(/\/$/, '')

  // Check exact path match
  const exactMatch = SALON_PAGE_ACCESS.find(rule => rule.path === normalizedPath)
  if (exactMatch) {
    return exactMatch.allowedRoles.includes(role)
  }

  // Check parent path (for dynamic routes like /appointments/[id])
  const pathSegments = normalizedPath.split('/').filter(Boolean)
  for (let i = pathSegments.length; i > 0; i--) {
    const parentPath = '/' + pathSegments.slice(0, i).join('/')
    const parentMatch = SALON_PAGE_ACCESS.find(rule => rule.path === parentPath)
    if (parentMatch) {
      return parentMatch.allowedRoles.includes(role)
    }
  }

  // Default: deny access if no rule found
  return false
}

/**
 * Get accessible pages for a role
 */
export function getAccessiblePages(role: SalonRole): PageAccessRule[] {
  if (role === 'owner') {
    return SALON_PAGE_ACCESS
  }

  return SALON_PAGE_ACCESS.filter(rule => rule.allowedRoles.includes(role))
}

/**
 * Get restricted pages for a role (pages they cannot access)
 */
export function getRestrictedPages(role: SalonRole): PageAccessRule[] {
  if (role === 'owner') {
    return []
  }

  return SALON_PAGE_ACCESS.filter(rule => !rule.allowedRoles.includes(role))
}

/**
 * Get the default redirect path for a role
 */
export function getDefaultPath(role: SalonRole): string {
  const defaultPaths: Record<SalonRole, string> = {
    owner: '/salon/dashboard',
    manager: '/salon/receptionist',
    receptionist: '/salon/receptionist',
    accountant: '/salon/accountant'
  }

  return defaultPaths[role] || '/salon/receptionist'
}

/**
 * Get user-friendly error message for unauthorized access
 */
export function getAccessDeniedMessage(role: SalonRole, path: string): string {
  const messages: Record<SalonRole, string> = {
    owner: 'You have full access to all pages.',
    manager: 'Managers cannot access owner-only pages or detailed financial reports.',
    receptionist: 'Receptionists can only access POS, appointments, and customer pages.',
    accountant: 'Accountants can only access finance and reports pages.'
  }

  return messages[role] || 'You do not have permission to access this page.'
}
