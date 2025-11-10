/**
 * HERA Enterprise Role-Based Router
 * Centralized role routing logic with loop prevention
 *
 * Purpose: Prevent redirect loops and ensure users always land on correct dashboard
 * Architecture: Pure function with no side effects - caller handles routing
 */

export type HERARole = 'owner' | 'manager' | 'staff' | 'receptionist' | 'admin' | 'user' | string

export interface RoleRoutingConfig {
  app: string // App code (SALON, CASHEW, CRM, etc.)
  role: HERARole
  organizationId: string
}

export interface RouteDecision {
  shouldRedirect: boolean
  targetPath: string | null
  reason: string
}

/**
 * Role to Dashboard Mapping (Enterprise Standard)
 * Each role has a designated dashboard path per app
 */
const ROLE_DASHBOARD_MAP: Record<string, Record<string, string>> = {
  SALON: {
    owner: '/salon/dashboard',
    manager: '/salon/dashboard',
    admin: '/salon/admin/dashboard',
    receptionist: '/salon/receptionist',
    staff: '/salon/dashboard',
    user: '/salon/dashboard'
  },
  CASHEW: {
    owner: '/cashew/dashboard',
    manager: '/cashew/dashboard',
    admin: '/cashew/admin/dashboard',
    user: '/cashew/dashboard',
    staff: '/cashew/dashboard'
  },
  CRM: {
    owner: '/crm/dashboard',
    manager: '/crm/dashboard',
    admin: '/crm/dashboard',
    user: '/crm/dashboard',
    staff: '/crm/dashboard'
  }
}

/**
 * Get the correct dashboard path for a given role and app
 */
export function getRoleDashboardPath(app: string, role: HERARole): string {
  const appCode = app.toUpperCase()
  const normalizedRole = role.toLowerCase().replace(/^org_/, '')

  // Check if app has role-specific routing
  const appRoutes = ROLE_DASHBOARD_MAP[appCode]
  if (appRoutes && appRoutes[normalizedRole]) {
    return appRoutes[normalizedRole]
  }

  // Fallback to default dashboard for app
  return `/${app.toLowerCase()}/dashboard`
}

/**
 * Determine if current path is correct for user's role
 * Returns routing decision with reason for debugging
 */
export function evaluateRoleRoute(
  config: RoleRoutingConfig,
  currentPath: string
): RouteDecision {
  const { app, role, organizationId } = config

  // Normalize role (remove ORG_ prefix if present)
  const normalizedRole = role.toLowerCase().replace(/^org_/, '')

  // Get expected dashboard for this role
  const expectedPath = getRoleDashboardPath(app, normalizedRole)

  // Check if we're on an auth/login page
  const isAuthPage = currentPath.includes('/auth') || currentPath.includes('/login')

  // Check if we're already on the correct dashboard
  const isOnCorrectDashboard = currentPath === expectedPath

  // Check if we're on a different role's dashboard
  const isOnWrongDashboard = currentPath.includes('/dashboard') && !isOnCorrectDashboard

  // Decision logic
  if (isAuthPage) {
    // On auth page with valid session → redirect to role dashboard
    return {
      shouldRedirect: true,
      targetPath: expectedPath,
      reason: `Authenticated user on auth page → redirect to ${normalizedRole} dashboard`
    }
  }

  if (isOnWrongDashboard) {
    // On wrong dashboard → redirect to correct one
    return {
      shouldRedirect: true,
      targetPath: expectedPath,
      reason: `User on wrong dashboard → redirect to ${normalizedRole} dashboard`
    }
  }

  if (isOnCorrectDashboard) {
    // Already on correct dashboard → no redirect
    return {
      shouldRedirect: false,
      targetPath: null,
      reason: `User already on correct ${normalizedRole} dashboard`
    }
  }

  // On a non-dashboard page (like appointments, customers, etc.) → allow
  return {
    shouldRedirect: false,
    targetPath: null,
    reason: 'User on non-dashboard page → allowed'
  }
}

/**
 * Smart redirect with loop prevention
 * Returns null if redirect would cause a loop
 */
export function getSafeRedirectPath(
  config: RoleRoutingConfig,
  currentPath: string,
  previousPath?: string
): string | null {
  const decision = evaluateRoleRoute(config, currentPath)

  if (!decision.shouldRedirect) {
    return null
  }

  // Loop prevention: Don't redirect if we just came from target path
  if (previousPath && decision.targetPath === previousPath) {
    console.warn('🚨 Redirect loop detected:', {
      current: currentPath,
      target: decision.targetPath,
      previous: previousPath
    })
    return null
  }

  // Loop prevention: Don't redirect if target is same as current
  if (decision.targetPath === currentPath) {
    console.warn('🚨 Circular redirect detected:', {
      current: currentPath,
      target: decision.targetPath
    })
    return null
  }

  console.log('✅ Safe redirect determined:', {
    role: config.role,
    app: config.app,
    from: currentPath,
    to: decision.targetPath,
    reason: decision.reason
  })

  return decision.targetPath
}

/**
 * Extract role from API response with fallback chain
 */
export function extractRoleFromResponse(response: any): HERARole {
  // Priority order for role extraction
  const role = (
    response?.membership?.roles?.[0] ||
    response?.role ||
    response?.user_role ||
    response?.roles?.[0] ||
    'user'
  )

  // Normalize role (remove ORG_ prefix)
  return role.toLowerCase().replace(/^org_/, '')
}

/**
 * Validate role assignment per organization
 * Ensures user has proper role for the organization
 */
export function validateOrgRole(
  organizationId: string,
  role: HERARole,
  memberships: any[]
): boolean {
  if (!memberships || memberships.length === 0) {
    console.warn('⚠️ No memberships found for role validation')
    return false
  }

  const membership = memberships.find(m => m.organization_id === organizationId)

  if (!membership) {
    console.warn('⚠️ No membership found for organization:', organizationId)
    return false
  }

  const membershipRole = extractRoleFromResponse(membership)
  const normalizedRole = role.toLowerCase().replace(/^org_/, '')

  const isValid = membershipRole === normalizedRole

  if (!isValid) {
    console.warn('⚠️ Role mismatch detected:', {
      expected: normalizedRole,
      actual: membershipRole,
      organizationId
    })
  }

  return isValid
}
