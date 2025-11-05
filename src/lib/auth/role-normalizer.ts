/**
 * HERA Role Normalization & Multi-App Routing Utility
 *
 * Enterprise-grade role management system supporting multiple applications.
 * This is the single source of truth for role normalization and routing across HERA.
 *
 * Supported Apps:
 * - salon: Salon/Spa management
 * - cashew: Cashew processing & inventory
 * - isp: Internet Service Provider management
 * - furniture: Furniture retail & warehouse
 * - restaurant: Restaurant/Food service
 * - retail: General retail operations
 *
 * HERA RBAC Format: ORG_OWNER, ORG_ADMIN, ORG_EMPLOYEE, etc.
 * Application Format: owner, manager, receptionist, etc.
 *
 * Usage:
 * ```typescript
 * import { normalizeRole, getRoleRedirectPath } from '@/lib/auth/role-normalizer'
 *
 * const appRole = normalizeRole('org_owner') // Returns: 'owner'
 * const redirectPath = getRoleRedirectPath('owner', 'salon') // Returns: '/salon/dashboard'
 * const redirectPath = getRoleRedirectPath('owner', 'furniture') // Returns: '/furniture/admin'
 * ```
 */

/**
 * Application role type (normalized format)
 */
export type AppRole = 'owner' | 'manager' | 'receptionist' | 'accountant' | 'stylist' | 'staff' | 'user'

/**
 * Supported HERA application codes
 */
export type AppCode = 'salon' | 'cashew' | 'isp' | 'furniture' | 'restaurant' | 'retail'

/**
 * HERA RBAC role type (database format)
 */
export type HERARBACRole =
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'ORG_MANAGER'
  | 'ORG_EMPLOYEE'
  | 'ORG_ACCOUNTANT'
  | 'ORG_STYLIST'
  | 'ORG_RECEPTIONIST'
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'ACCOUNTANT'
  | 'STYLIST'
  | 'RECEPTIONIST'
  | 'MEMBER'
  | 'USER'

/**
 * Comprehensive role mapping from HERA RBAC to application format
 *
 * This mapping handles:
 * - HERA RBAC roles (ORG_OWNER, ORG_EMPLOYEE, etc.)
 * - Legacy roles (OWNER, MANAGER, etc.)
 * - Lowercase variants (org_owner, owner, etc.)
 * - Fallback roles (MEMBER → receptionist, USER → user)
 */
const ROLE_MAPPING: Record<string, AppRole> = {
  // HERA RBAC format (with ORG_ prefix)
  'org_owner': 'owner',
  'org_admin': 'manager',
  'org_manager': 'manager',
  'org_employee': 'receptionist',
  'org_accountant': 'accountant',
  'org_stylist': 'stylist',
  'org_receptionist': 'receptionist',

  // Legacy format (without ORG_ prefix)
  'owner': 'owner',
  'admin': 'manager',
  'manager': 'manager',
  'employee': 'receptionist',
  'accountant': 'accountant',
  'stylist': 'stylist',
  'receptionist': 'receptionist',
  'staff': 'staff',

  // Fallback roles
  'member': 'receptionist',
  'user': 'user',
}

/**
 * Normalize a HERA RBAC role to application format
 *
 * @param role - Role in HERA RBAC format (e.g., 'ORG_OWNER', 'org_employee')
 * @returns Normalized application role (e.g., 'owner', 'receptionist')
 *
 * @example
 * ```typescript
 * normalizeRole('ORG_OWNER') // 'owner'
 * normalizeRole('org_employee') // 'receptionist'
 * normalizeRole('OWNER') // 'owner'
 * normalizeRole('member') // 'receptionist'
 * normalizeRole('unknown_role') // 'user' (fallback)
 * ```
 */
export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) {
    console.warn('[RoleNormalizer] No role provided, using fallback: user')
    return 'user'
  }

  // Normalize to lowercase and trim whitespace
  const normalizedInput = String(role).toLowerCase().trim()

  // Look up in mapping
  const appRole = ROLE_MAPPING[normalizedInput]

  if (!appRole) {
    console.warn(`[RoleNormalizer] Unknown role '${role}', using fallback: user`)
    return 'user'
  }

  console.log(`[RoleNormalizer] Normalized '${role}' → '${appRole}'`)
  return appRole
}

/**
 * Get display name for a role (app-aware)
 *
 * @param role - Application role
 * @param app - Optional app code for context-specific naming
 * @returns User-friendly display name
 *
 * @example
 * ```typescript
 * getRoleDisplayName('owner', 'salon') // 'Salon Owner'
 * getRoleDisplayName('owner', 'furniture') // 'Store Owner'
 * getRoleDisplayName('receptionist', 'salon') // 'Front Desk'
 * getRoleDisplayName('receptionist', 'furniture') // 'Cashier'
 * ```
 */
export function getRoleDisplayName(role: AppRole, app?: AppCode): string {
  // App-specific display names
  const appSpecificNames: Record<AppCode, Record<AppRole, string>> = {
    salon: {
      owner: 'Salon Owner',
      manager: 'Salon Manager',
      receptionist: 'Front Desk',
      accountant: 'Accountant',
      stylist: 'Stylist',
      staff: 'Staff Member',
      user: 'Customer'
    },
    cashew: {
      owner: 'Factory Owner',
      manager: 'Operations Manager',
      receptionist: 'Front Office',
      accountant: 'Accountant',
      stylist: 'Quality Inspector',
      staff: 'Worker',
      user: 'Visitor'
    },
    isp: {
      owner: 'ISP Owner',
      manager: 'Network Manager',
      receptionist: 'Customer Service',
      accountant: 'Billing Manager',
      stylist: 'Field Technician',
      staff: 'Support Staff',
      user: 'Subscriber'
    },
    furniture: {
      owner: 'Store Owner',
      manager: 'Store Manager',
      receptionist: 'Cashier',
      accountant: 'Accountant',
      stylist: 'Sales Associate',
      staff: 'Warehouse Staff',
      user: 'Customer'
    },
    restaurant: {
      owner: 'Restaurant Owner',
      manager: 'Floor Manager',
      receptionist: 'Host/Hostess',
      accountant: 'Accountant',
      stylist: 'Chef',
      staff: 'Server',
      user: 'Guest'
    },
    retail: {
      owner: 'Business Owner',
      manager: 'Store Manager',
      receptionist: 'Cashier',
      accountant: 'Accountant',
      stylist: 'Sales Associate',
      staff: 'Store Staff',
      user: 'Customer'
    }
  }

  // Use app-specific name if app is provided
  if (app && appSpecificNames[app]) {
    return appSpecificNames[app][role] || 'Team Member'
  }

  // Generic fallback names
  const genericNames: Record<AppRole, string> = {
    owner: 'Business Owner',
    manager: 'Manager',
    receptionist: 'Receptionist',
    accountant: 'Accountant',
    stylist: 'Specialist',
    staff: 'Staff Member',
    user: 'User'
  }

  return genericNames[role] || 'Team Member'
}

/**
 * Check if a role has elevated permissions
 *
 * @param role - Application role to check
 * @returns true if role has owner or manager permissions
 *
 * @example
 * ```typescript
 * isElevatedRole('owner') // true
 * isElevatedRole('manager') // true
 * isElevatedRole('receptionist') // false
 * ```
 */
export function isElevatedRole(role: AppRole): boolean {
  return role === 'owner' || role === 'manager'
}

/**
 * Enterprise Multi-App Routing Configuration
 *
 * Define role-to-dashboard mappings for each application.
 * This is the single source of truth for post-login redirects.
 */
const APP_ROUTING_RULES: Record<AppCode, Record<AppRole, string>> = {
  // ========================
  // SALON APP
  // ========================
  salon: {
    owner: '/salon/dashboard',           // Full analytics & management
    manager: '/salon/receptionist',      // Operations & scheduling
    receptionist: '/salon/receptionist', // Front desk operations
    accountant: '/salon/accountant',     // Financial management
    stylist: '/salon/stylist',           // Service provider view
    staff: '/salon/receptionist',        // General staff access
    user: '/salon'                       // Customer portal
  },

  // ========================
  // CASHEW APP
  // ========================
  cashew: {
    owner: '/cashew/dashboard',          // Factory analytics
    manager: '/cashew/operations',       // Production management
    receptionist: '/cashew/reception',   // Visitor & logistics
    accountant: '/cashew/accounting',    // Financial tracking
    stylist: '/cashew/quality',          // Quality control
    staff: '/cashew/production',         // Floor operations
    user: '/cashew'                      // Vendor portal
  },

  // ========================
  // ISP APP
  // ========================
  isp: {
    owner: '/isp/dashboard',             // Network analytics
    manager: '/isp/network-ops',         // Network operations
    receptionist: '/isp/customer-service', // Support desk
    accountant: '/isp/billing',          // Billing & revenue
    stylist: '/isp/field-tech',          // Field technician
    staff: '/isp/support',               // Support staff
    user: '/isp/subscriber'              // Subscriber portal
  },

  // ========================
  // FURNITURE APP
  // ========================
  furniture: {
    owner: '/furniture/admin',           // Store analytics
    manager: '/furniture/store-manager', // Store operations
    receptionist: '/furniture/pos',      // Point of sale
    accountant: '/furniture/accounting', // Financial management
    stylist: '/furniture/sales',         // Sales floor
    staff: '/furniture/warehouse',       // Warehouse operations
    user: '/furniture'                   // Customer catalog
  },

  // ========================
  // RESTAURANT APP
  // ========================
  restaurant: {
    owner: '/restaurant/owner-dashboard',   // Restaurant analytics
    manager: '/restaurant/floor-manager',   // Floor management
    receptionist: '/restaurant/host-stand', // Host/hostess station
    accountant: '/restaurant/accounting',   // Financial tracking
    stylist: '/restaurant/kitchen',         // Kitchen/chef view
    staff: '/restaurant/server',            // Server/waiter view
    user: '/restaurant/menu'                // Customer menu
  },

  // ========================
  // RETAIL APP (Generic)
  // ========================
  retail: {
    owner: '/retail/home',               // Business home & analytics
    manager: '/retail/home',             // Store management
    receptionist: '/retail/pos',         // Point of sale
    accountant: '/retail/accounting',    // Financial management
    stylist: '/retail/sales',            // Sales associate
    staff: '/retail/operations',         // Store operations
    user: '/retail/home'                 // Customer portal
  }
}

/**
 * Get default redirect path for a role (Multi-App Support)
 *
 * @param role - Application role (normalized)
 * @param app - Application code (defaults to 'salon')
 * @returns Dashboard path specific to the role and app
 *
 * @example
 * ```typescript
 * // Salon app
 * getRoleRedirectPath('owner', 'salon') // '/salon/dashboard'
 * getRoleRedirectPath('receptionist', 'salon') // '/salon/receptionist'
 *
 * // Furniture app
 * getRoleRedirectPath('owner', 'furniture') // '/furniture/admin'
 * getRoleRedirectPath('receptionist', 'furniture') // '/furniture/pos'
 *
 * // ISP app
 * getRoleRedirectPath('owner', 'isp') // '/isp/dashboard'
 * getRoleRedirectPath('stylist', 'isp') // '/isp/field-tech'
 *
 * // Auto-detect from current URL
 * getRoleRedirectPath('owner') // Detects app from window.location
 * ```
 */
export function getRoleRedirectPath(role: AppRole, app?: AppCode): string {
  // Auto-detect app from current URL if not provided
  let appCode: AppCode = app || 'salon'

  if (!app && typeof window !== 'undefined') {
    const pathname = window.location.pathname

    // Extract app code from URL path
    if (pathname.startsWith('/salon')) appCode = 'salon'
    else if (pathname.startsWith('/cashew')) appCode = 'cashew'
    else if (pathname.startsWith('/isp')) appCode = 'isp'
    else if (pathname.startsWith('/furniture')) appCode = 'furniture'
    else if (pathname.startsWith('/restaurant')) appCode = 'restaurant'
    else if (pathname.startsWith('/retail')) appCode = 'retail'
  }

  // Get routing rules for the app
  const appRoutes = APP_ROUTING_RULES[appCode]

  if (!appRoutes) {
    console.warn(`[RoleNormalizer] Unknown app '${appCode}', using salon fallback`)
    return APP_ROUTING_RULES.salon[role] || '/salon'
  }

  const redirectPath = appRoutes[role]

  if (!redirectPath) {
    console.warn(`[RoleNormalizer] No route defined for role '${role}' in app '${appCode}', using fallback`)
    return `/${appCode}`
  }

  console.log(`[RoleNormalizer] Role redirect: ${role} (${appCode}) → ${redirectPath}`)
  return redirectPath
}

/**
 * Get app code from organization or user context
 *
 * @param organizationId - Organization UUID
 * @returns App code associated with the organization
 *
 * @example
 * ```typescript
 * const appCode = getAppCodeFromOrganization('org-uuid')
 * // Returns: 'salon', 'cashew', 'isp', etc.
 * ```
 */
export function getAppCodeFromOrganization(organizationId: string): AppCode {
  // TODO: In future, fetch from database based on organization
  // For now, use localStorage or default to salon

  if (typeof window !== 'undefined') {
    const storedApp = localStorage.getItem('currentApp') as AppCode
    if (storedApp && APP_ROUTING_RULES[storedApp]) {
      return storedApp
    }
  }

  return 'salon' // Default fallback
}

/**
 * Validate if a string is a valid app code
 *
 * @param app - App code to validate
 * @returns true if app is a valid AppCode
 */
export function isValidAppCode(app: string): app is AppCode {
  const validApps: AppCode[] = ['salon', 'cashew', 'isp', 'furniture', 'restaurant', 'retail']
  return validApps.includes(app as AppCode)
}

/**
 * Validate if a string is a valid application role
 *
 * @param role - Role string to validate
 * @returns true if role is a valid AppRole
 */
export function isValidAppRole(role: string): role is AppRole {
  const validRoles: AppRole[] = ['owner', 'manager', 'receptionist', 'accountant', 'stylist', 'staff', 'user']
  return validRoles.includes(role as AppRole)
}
