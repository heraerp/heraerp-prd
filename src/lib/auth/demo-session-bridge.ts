/**
 * HERA Demo Session Bridge
 * Bridges new HERA Authorization DNA with existing MultiOrgAuthProvider
 */

export interface DemoSessionData {
  user_entity_id: string
  organization_id: string
  role: string
  scopes: string[]
  expires_at: string
  session_type: string
}

export interface DualUser {
  id: string
  email: string
  name?: string
  full_name?: string
  auth_user_id: string
  role?: string
}

export interface Organization {
  id: string
  name: string
  subdomain: string
  type: string
  subscription_plan: string
  role: string
  permissions: string[]
  is_active: boolean
}

/**
 * Check for HERA demo session and convert to MultiOrgAuth format
 */
export function checkHERADemoSession(): {
  demoUser: DualUser | null
  demoOrg: Organization | null
  isExpired: boolean
} {
  try {
    // Check for HERA demo session cookie
    if (typeof document === 'undefined') {
      return { demoUser: null, demoOrg: null, isExpired: false }
    }

    const sessionCookie = getCookie('hera-demo-session')
    
    if (!sessionCookie) {
      return { demoUser: null, demoOrg: null, isExpired: false }
    }

    // Decode URL-encoded cookie value first
    const decodedCookie = decodeURIComponent(sessionCookie)
    const sessionData: DemoSessionData = JSON.parse(decodedCookie)
    
    // Check if session is expired
    const expiryTime = new Date(sessionData.expires_at).getTime()
    const now = Date.now()
    
    if (expiryTime <= now) {
      // Clean up expired session
      document.cookie = 'hera-demo-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'hera-org-context=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      return { demoUser: null, demoOrg: null, isExpired: true }
    }

    // Convert HERA demo session to MultiOrgAuth format
    const demoUser: DualUser = {
      id: sessionData.user_entity_id,
      auth_user_id: sessionData.user_entity_id,
      email: 'demo@herasalon.com',
      name: 'Demo Receptionist',
      full_name: 'Demo Salon Receptionist',
      role: parseRoleFromSmartCode(sessionData.role)
    }

    const demoOrg: Organization = {
      id: sessionData.organization_id,
      name: 'Hair Talkz Salon (Demo)',
      subdomain: 'demo-salon',
      type: 'salon',
      subscription_plan: 'demo',
      role: parseRoleFromSmartCode(sessionData.role),
      permissions: convertScopesToPermissions(sessionData.scopes),
      is_active: true
    }

    console.log('🧬 HERA Demo Session found:', {
      user_id: demoUser.id,
      organization_id: demoOrg.id,
      role: demoOrg.role,
      permissions: demoOrg.permissions.length,
      expires_at: sessionData.expires_at
    })

    return { demoUser, demoOrg, isExpired: false }

  } catch (error) {
    console.error('💥 Error checking HERA demo session:', error)
    return { demoUser: null, demoOrg: null, isExpired: false }
  }
}

/**
 * Parse role from HERA smart code to simple role string
 */
function parseRoleFromSmartCode(smartCode: string): string {
  if (smartCode.includes('RECEPTIONIST')) return 'receptionist'
  if (smartCode.includes('MANAGER')) return 'manager'  
  if (smartCode.includes('OWNER')) return 'owner'
  if (smartCode.includes('STYLIST')) return 'stylist'
  return 'user'
}

/**
 * Convert HERA scopes to MultiOrgAuth permissions format
 */
function convertScopesToPermissions(scopes: string[]): string[] {
  const permissions = new Set<string>()
  
  scopes.forEach(scope => {
    // Convert HERA scopes to simple permissions
    if (scope.includes('APPOINTMENT')) {
      permissions.add('appointments:read')
      if (scope.includes('write:')) permissions.add('appointments:write')
    }
    
    if (scope.includes('CUSTOMER') || scope.includes('CRM')) {
      permissions.add('customers:read')
      if (scope.includes('write:')) permissions.add('customers:write')
    }
    
    if (scope.includes('SERVICE') && scope.includes('CATALOG')) {
      permissions.add('services:read')
    }
    
    if (scope.includes('INVENTORY') && scope.includes('PRODUCT')) {
      permissions.add('inventory:read')
    }
    
    if (scope.includes('FIN') || scope.includes('FINANCE')) {
      permissions.add('finance:read')
      if (scope.includes('write:')) permissions.add('finance:write')
    }
    
    // Add the original scope as well for compatibility
    permissions.add(scope)
  })
  
  return Array.from(permissions)
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

/**
 * Check if current route should use demo session
 */
export function shouldUseDemoSession(pathname: string): boolean {
  const salonRoutes = [
    '/salon',
    '/dashboard', 
    '/appointments',
    '/pos',
    '/customers',
    '/settings',
    '/reports',
    '/inventory'
  ]
  
  return salonRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}