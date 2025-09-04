// Organization context management for demo vs production

export interface OrganizationContext {
  organizationId: string
  isDemo: boolean
  subdomain: string | null
  organizationName?: string
}

// Default demo organization IDs for each app
export const DEMO_ORGANIZATIONS = {
  salon: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', // Hair Talkz • Park Regis
  icecream: '550e8400-e29b-41d4-a716-446655440001',
  restaurant: '550e8400-e29b-41d4-a716-446655440002',
  healthcare: '550e8400-e29b-41d4-a716-446655440003',
  jewelry: '550e8400-e29b-41d4-a716-446655440004',
  retail: '550e8400-e29b-41d4-a716-446655440005',
  manufacturing: '550e8400-e29b-41d4-a716-446655440006',
  financial: '550e8400-e29b-41d4-a716-446655440007',
  crm: '550e8400-e29b-41d4-a716-446655440008'
} as const

export type AppType = keyof typeof DEMO_ORGANIZATIONS

/**
 * Get organization context based on subdomain and path
 * Examples:
 * - localhost:3000/salon -> Demo salon org
 * - app.heraerp.com/salon -> Demo salon org
 * - mario.heraerp.com/salon -> Mario's actual salon org
 * - acme.heraerp.com/icecream -> ACME's ice cream org
 */
export async function getOrganizationContext(
  host: string,
  pathname: string
): Promise<OrganizationContext | null> {
  // Parse subdomain
  const parts = host.split('.')
  const subdomain = parts[0]
  
  // Check if it's a custom subdomain (not www, app, localhost)
  const isCustomSubdomain = !!(
    subdomain && 
    subdomain !== 'www' && 
    subdomain !== 'app' && 
    subdomain !== 'localhost' &&
    subdomain !== 'heraerp' &&
    parts.length >= 2 // Ensure it's actually a subdomain
  )

  // Extract app type from pathname (e.g., /salon, /icecream)
  const appType = pathname.split('/')[1] as AppType

  // If custom subdomain, look up the organization
  if (isCustomSubdomain) {
    const organization = await getOrganizationBySubdomain(subdomain)
    
    if (organization) {
      return {
        organizationId: organization.id,
        isDemo: false,
        subdomain,
        organizationName: organization.organization_name
      }
    }
  }

  // Otherwise, use demo organization based on app type
  if (appType && DEMO_ORGANIZATIONS[appType]) {
    return {
      organizationId: DEMO_ORGANIZATIONS[appType],
      isDemo: true,
      subdomain: null,
      organizationName: `Demo ${appType.charAt(0).toUpperCase() + appType.slice(1)}`
    }
  }

  return null
}

/**
 * Get organization by subdomain from database
 * Uses the new server-side organization utilities
 */
async function getOrganizationBySubdomain(subdomain: string): Promise<{id: string, organization_name: string} | null> {
  try {
    // Import here to avoid circular dependencies in middleware context
    const { getOrgByHostOrSubdomain } = await import('@/lib/server/organizations')
    const organization = await getOrgByHostOrSubdomain(subdomain)
    return organization ? {
      id: organization.id,
      organization_name: organization.organization_name
    } : null
  } catch (error) {
    console.error('Error looking up organization by subdomain:', error)
    return null
  }
}

