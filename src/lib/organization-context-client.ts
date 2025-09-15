// Client-side organization context management
export interface OrganizationContext {
  organizationId: string
  isDemo: boolean
  subdomain: string | null
  organizationName?: string
}

// Default demo organization IDs for each app
export const DEMO_ORGANIZATIONS = {
  salon: '550e8400-e29b-41d4-a716-446655440000',
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
 * Client-side function to get organization context
 */
export function getOrganizationContextFromURL(
  host: string,
  pathname: string
): OrganizationContext | null {
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

  // If custom subdomain, return production context
  // (actual organization lookup would happen server-side)
  if (isCustomSubdomain) {
    return {
      organizationId: 'pending-lookup', // Would be resolved server-side
      isDemo: false,
      subdomain,
      organizationName: subdomain
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
