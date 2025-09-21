// ================================================================================
// HERA RBAC - Role-Based Access Control
// Smart Code: HERA.AUTH.RBAC.v1
// Centralized role homes and allowed paths with accountant role
// ================================================================================

export type Role = 'owner' | 'admin' | 'manager' | 'stylist' | 'cashier' | 'customer' | 'accountant'

/**
 * Landing page for each role after login
 */
export const ROLE_HOME: Record<Role, string> = {
  owner: '/dashboard',
  admin: '/admin',
  manager: '/dashboard',
  stylist: '/appointments',
  cashier: '/pos/sale',
  customer: '/customer',
  accountant: '/accountant'
}

/**
 * Allowed navigation paths for each role
 * Use /* for wildcard matching
 */
export const ROLE_NAV: Record<Role, string[]> = {
  owner: [
    '/dashboard',
    '/appointments',
    '/pos/sale',
    '/inventory/products',
    '/reports/*',
    '/finance/closing',
    '/finance/rules',
    '/settings/*',
    '/whatsapp/*'
  ],
  admin: ['/admin', '/settings/*', '/finance/closing', '/finance/rules'],
  manager: [
    '/dashboard',
    '/appointments',
    '/pos/sale',
    '/inventory/*',
    '/reports/*',
    '/whatsapp/*'
  ],
  stylist: ['/appointments', '/staff/schedule'],
  cashier: ['/pos/sale', '/appointments'],
  customer: ['/customer/*'],
  accountant: ['/accountant', '/reports/*', '/finance/closing', '/finance/rules']
}

/**
 * Get the landing page for a specific role
 */
export function landingForRole(role: Role): string {
  return ROLE_HOME[role] ?? '/dashboard'
}

/**
 * Check if a role is allowed to access a specific path
 */
export function isAllowed(role: Role, path: string): boolean {
  const allowedPaths = ROLE_NAV[role] || []

  return allowedPaths.some(allowed => {
    // Wildcard matching
    if (allowed.endsWith('/*')) {
      return path.startsWith(allowed.slice(0, -2))
    }
    // Exact match
    return path === allowed
  })
}

/**
 * Get redirect path for unauthorized access
 */
export function getUnauthorizedRedirect(role: Role): string {
  return landingForRole(role)
}

/**
 * Navigation items visible to each role
 */
export const ROLE_NAVIGATION = {
  owner: [
    { title: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { title: 'Appointments', href: '/appointments', icon: 'Calendar' },
    { title: 'POS', href: '/pos/sale', icon: 'CreditCard' },
    { title: 'Inventory', href: '/inventory/products', icon: 'Package' },
    { title: 'Reports', href: '/reports', icon: 'BarChart3' },
    { title: 'Finance', href: '/finance/closing', icon: 'DollarSign' },
    { title: 'WhatsApp', href: '/whatsapp', icon: 'MessageSquare' },
    { title: 'Settings', href: '/settings', icon: 'Settings' }
  ],
  admin: [
    { title: 'Admin', href: '/admin', icon: 'Shield' },
    { title: 'Finance', href: '/finance/closing', icon: 'DollarSign' },
    { title: 'Settings', href: '/settings', icon: 'Settings' }
  ],
  manager: [
    { title: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { title: 'Appointments', href: '/appointments', icon: 'Calendar' },
    { title: 'POS', href: '/pos/sale', icon: 'CreditCard' },
    { title: 'Inventory', href: '/inventory', icon: 'Package' },
    { title: 'Reports', href: '/reports', icon: 'BarChart3' },
    { title: 'WhatsApp', href: '/whatsapp', icon: 'MessageSquare' }
  ],
  stylist: [
    { title: 'Appointments', href: '/appointments', icon: 'Calendar' },
    { title: 'Schedule', href: '/staff/schedule', icon: 'Clock' }
  ],
  cashier: [
    { title: 'POS', href: '/pos/sale', icon: 'CreditCard' },
    { title: 'Appointments', href: '/appointments', icon: 'Calendar' }
  ],
  customer: [
    { title: 'Profile', href: '/customer/profile', icon: 'User' },
    { title: 'Appointments', href: '/customer/appointments', icon: 'Calendar' },
    { title: 'History', href: '/customer/history', icon: 'Clock' }
  ],
  accountant: [
    { title: 'Dashboard', href: '/accountant', icon: 'Home' },
    { title: 'Reports', href: '/reports', icon: 'BarChart3' },
    { title: 'Period Closing', href: '/finance/closing', icon: 'Lock' },
    { title: 'GL Rules', href: '/finance/rules', icon: 'FileText' }
  ]
}

/**
 * Permission keys stored in core_dynamic_data
 */
export const PERMISSION_KEYS = {
  ROLE_GRANTS: 'ROLE_GRANTS.v1',
  CUSTOM_PERMISSIONS: 'CUSTOM_PERMISSIONS.v1'
}

/**
 * Smart codes for RBAC operations
 */
export const RBAC_SMART_CODES = {
  ROLE_ASSIGN: 'HERA.AUTH.RBAC.ROLE.ASSIGN.V1',
  ROLE_REVOKE: 'HERA.AUTH.RBAC.ROLE.REVOKE.V1',
  PERMISSION_GRANT: 'HERA.AUTH.RBAC.PERMISSION.GRANT.V1',
  PERMISSION_REVOKE: 'HERA.AUTH.RBAC.PERMISSION.REVOKE.V1',
  ACCESS_CHECK: 'HERA.AUTH.RBAC.ACCESS.CHECK.V1'
}
