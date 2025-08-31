/**
 * Demo Organization Resolver
 * Automatically assigns organization IDs based on URL paths
 * Uses HERA universal architecture - no custom tables
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// HERA System Organization ID
const SYSTEM_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

// Cache for demo org mappings
const demoOrgCache = new Map<string, string>()

// Hardcoded fallback mappings (in case database lookup fails)
const FALLBACK_MAPPINGS: Record<string, string> = {
  '/icecream': '1471e87b-b27e-42ef-8192-343cc5e0d656', // Kochi Ice Cream
  '/restaurant': '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54', // Mario's Restaurant
  '/healthcare': 'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d', // Dr. Smith's Practice
  '/salon': 'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f', // Bella Beauty Salon
  '/retail': 'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d', // TechGear Electronics
}

/**
 * Get organization ID for a demo route
 * @param pathname - The URL pathname (e.g., '/icecream')
 * @returns Organization ID or null if not found
 */
export async function getDemoOrganizationId(pathname: string): Promise<string | null> {
  // Extract the base path (e.g., '/icecream' from '/icecream/production')
  const basePath = '/' + pathname.split('/')[1]
  
  // Check cache first
  if (demoOrgCache.has(basePath)) {
    return demoOrgCache.get(basePath)!
  }

  try {
    // Query demo route mappings from HERA system organization
    const { data: mappings, error } = await supabase
      .from('core_entities')
      .select(`
        id,
        metadata,
        core_dynamic_data!inner (
          field_name,
          field_value_text
        )
      `)
      .eq('organization_id', SYSTEM_ORG_ID)
      .eq('entity_type', 'demo_route_mapping')
      .eq('core_dynamic_data.field_name', 'route_path')
      .eq('core_dynamic_data.field_value_text', basePath)

    if (error) {
      console.error('Error fetching demo org mapping:', error)
      // Fall back to hardcoded mappings
      return FALLBACK_MAPPINGS[basePath] || null
    }

    if (mappings && mappings.length > 0) {
      // Get the target_org_id from dynamic data
      const { data: orgIdData } = await supabase
        .from('core_dynamic_data')
        .select('field_value_text')
        .eq('entity_id', mappings[0].id)
        .eq('field_name', 'target_org_id')
        .single()

      if (orgIdData?.field_value_text) {
        const orgId = orgIdData.field_value_text
        demoOrgCache.set(basePath, orgId)
        return orgId
      }
    }

    // Fall back to hardcoded mappings if not found in database
    const fallbackOrgId = FALLBACK_MAPPINGS[basePath]
    if (fallbackOrgId) {
      demoOrgCache.set(basePath, fallbackOrgId)
      return fallbackOrgId
    }

    return null
  } catch (error) {
    console.error('Error in getDemoOrganizationId:', error)
    // Fall back to hardcoded mappings
    return FALLBACK_MAPPINGS[basePath] || null
  }
}

/**
 * Check if a path is a demo route
 * @param pathname - The URL pathname
 * @returns True if it's a demo route
 */
export function isDemoRoute(pathname: string): boolean {
  const basePath = '/' + pathname.split('/')[1]
  return Object.keys(FALLBACK_MAPPINGS).includes(basePath)
}

/**
 * Get demo organization info
 * @param pathname - The URL pathname
 * @returns Organization info or null
 */
export async function getDemoOrganizationInfo(pathname: string): Promise<{
  id: string
  name: string
  industry: string
} | null> {
  const orgId = await getDemoOrganizationId(pathname)
  if (!orgId) return null

  // Hardcoded info for demos (could be fetched from database)
  const demoInfo: Record<string, { name: string; industry: string }> = {
    '1471e87b-b27e-42ef-8192-343cc5e0d656': {
      name: 'Kochi Ice Cream Manufacturing',
      industry: 'manufacturing'
    },
    '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54': {
      name: "Mario's Authentic Italian Restaurant",
      industry: 'restaurant'
    },
    'a2e5f8d9-7b3c-4f6e-9d1a-8c7e5b4a2f9d': {
      name: 'Dr. Smith Family Practice',
      industry: 'healthcare'
    },
    'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f': {
      name: 'Bella Beauty Salon',
      industry: 'salon'
    },
    'e5f8a9d7-2c3b-4f7e-8d1a-7b6c4e3f2a9d': {
      name: 'TechGear Electronics Store',
      industry: 'retail'
    }
  }

  const info = demoInfo[orgId]
  if (info) {
    return {
      id: orgId,
      name: info.name,
      industry: info.industry
    }
  }

  return null
}