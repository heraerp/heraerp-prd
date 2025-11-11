/**
 * HERA Navigation Resolution Service
 * Smart Code: HERA.PLATFORM.NAV.RESOLVER.v1
 *
 * Resolves URL paths to canonical operations and components
 * Supports alias mapping and dynamic route resolution
 */

import { supabase } from '@/lib/supabase/client'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'

// Types for navigation resolution
export interface ResolvedOperation {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  canonical_path: string
  component_id: string
  scenario: 'CREATE' | 'LIST' | 'DETAIL' | 'APPROVE'
  params: Record<string, any>
  aliasHit: boolean
  tail?: string
}

export interface AliasResolutionResult extends ResolvedOperation {
  alias_path: string
  route_suffixes: string[]
}

/**
 * Split path into base and tail
 * Example: "/wm/customers/new" → ["/wm/customers", "/new"]
 */
function splitTail(path: string): [string, string] {
  const segments = path.split('/').filter(Boolean)
  
  if (segments.length <= 2) {
    return [path, '']
  }
  
  // Common tail patterns
  const commonTails = ['new', 'create', 'list', 'edit', 'view', 'delete', 'approve']
  const lastSegment = segments[segments.length - 1]
  
  if (commonTails.includes(lastSegment.toLowerCase())) {
    const basePath = '/' + segments.slice(0, -1).join('/')
    const tail = '/' + lastSegment
    return [basePath, tail]
  }
  
  return [path, '']
}

/**
 * Generate canonical path candidates from various path formats
 */
function generateCanonicalCandidates(path: string): string[] {
  const candidates = [path]
  
  // Remove industry prefixes for enterprise paths
  const industryPrefixes = ['/wm/', '/jewelry/', '/waste-management/', '/salon/']
  
  for (const prefix of industryPrefixes) {
    if (path.startsWith(prefix)) {
      const withoutPrefix = path.replace(prefix, '/enterprise/')
      candidates.push(withoutPrefix)
      
      // Also try without any prefix
      const withoutAnyPrefix = path.replace(prefix, '/')
      candidates.push(withoutAnyPrefix)
    }
  }
  
  // Try enterprise prefix for short paths
  if (!path.startsWith('/enterprise/')) {
    candidates.push('/enterprise' + path)
  }
  
  return [...new Set(candidates)] // Remove duplicates
}

/**
 * Resolve operation by alias path
 */
export async function resolveOperationByAlias(
  orgId: string, 
  path: string
): Promise<AliasResolutionResult | null> {
  try {
    const [basePath, tail] = splitTail(path)
    
    // Find alias entity by alias_path, then follow relationship to canonical operation
    const { data: aliasData, error: aliasError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_code,
        entity_name,
        metadata,
        core_relationships_from:core_relationships!from_entity_id(
          to_entity_id,
          relationship_data,
          core_entities_to:core_entities!to_entity_id(
            id,
            entity_code,
            entity_name,
            smart_code,
            metadata
          )
        )
      `)
      .eq('entity_type', 'navigation_alias')
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    
    if (aliasError) {
      console.error('Error querying aliases:', aliasError)
      return null
    }
    
    // Find matching alias by path
    for (const alias of aliasData || []) {
      const aliasPath = alias.metadata?.alias_path
      const routeSuffixes = alias.metadata?.route_suffixes || []
      
      if (aliasPath === basePath) {
        // Check if tail is allowed
        if (tail && routeSuffixes.length > 0) {
          const tailWithoutSlash = tail.replace('/', '')
          if (!routeSuffixes.includes(tailWithoutSlash)) {
            continue // This alias doesn't support this suffix
          }
        }
        
        // Get the canonical operation from the relationship
        const relationship = alias.core_relationships_from?.[0]
        const canonical = relationship?.core_entities_to
        
        if (canonical && canonical.metadata) {
          const metadata = canonical.metadata
          
          // Determine scenario based on tail
          let scenario = metadata.scenario
          if (tail === '/new' || tail === '/create') {
            scenario = 'CREATE'
          } else if (tail === '/list' || tail === '') {
            scenario = 'LIST'
          }
          
          return {
            id: canonical.id,
            entity_code: canonical.entity_code,
            entity_name: canonical.entity_name,
            smart_code: canonical.smart_code,
            canonical_path: metadata.canonical_path,
            component_id: metadata.component_id,
            scenario,
            params: metadata.params || {},
            aliasHit: true,
            alias_path: aliasPath,
            route_suffixes: routeSuffixes,
            tail
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error resolving operation by alias:', error)
    return null
  }
}

/**
 * Resolve operation by canonical path
 */
export async function resolveOperationByCanonical(
  orgId: string, 
  path: string
): Promise<ResolvedOperation | null> {
  try {
    const [basePath, tail] = splitTail(path)
    const candidates = generateCanonicalCandidates(basePath)
    
    // Find canonical operation by path
    const { data: canonicalData, error: canonicalError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name, smart_code, metadata')
      .eq('entity_type', 'navigation_canonical')
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      .in('metadata->>canonical_path', candidates)
      .limit(1)
    
    if (canonicalError) {
      console.error('Error querying canonical operations:', canonicalError)
      return null
    }
    
    const canonical = canonicalData?.[0]
    if (!canonical || !canonical.metadata) {
      return null
    }
    
    const metadata = canonical.metadata
    
    // Determine scenario based on tail
    let scenario = metadata.scenario
    if (tail === '/new' || tail === '/create') {
      scenario = 'CREATE'
    } else if (tail === '/list' || tail === '') {
      scenario = 'LIST'
    }
    
    return {
      id: canonical.id,
      entity_code: canonical.entity_code,
      entity_name: canonical.entity_name,
      smart_code: canonical.smart_code,
      canonical_path: metadata.canonical_path,
      component_id: metadata.component_id,
      scenario,
      params: metadata.params || {},
      aliasHit: false,
      tail
    }
  } catch (error) {
    console.error('Error resolving operation by canonical path:', error)
    return null
  }
}

/**
 * Main resolver function - tries alias first, then canonical
 */
export async function resolveNavigation(
  orgId: string, 
  path: string
): Promise<ResolvedOperation | null> {
  // Try alias resolution first
  const aliasResult = await resolveOperationByAlias(orgId, path)
  if (aliasResult) {
    return aliasResult
  }
  
  // Fall back to canonical resolution
  const canonicalResult = await resolveOperationByCanonical(orgId, path)
  return canonicalResult
}

/**
 * Cache for navigation resolutions (5 minute TTL)
 */
const resolutionCache = new Map<string, { result: ResolvedOperation | null; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Cached navigation resolution
 */
export async function getCachedNavigation(
  orgId: string, 
  path: string
): Promise<ResolvedOperation | null> {
  const cacheKey = `${orgId}:${path}`
  const cached = resolutionCache.get(cacheKey)
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.result
  }
  
  const result = await resolveNavigation(orgId, path)
  resolutionCache.set(cacheKey, { result, timestamp: Date.now() })
  
  return result
}

/**
 * Clear navigation resolution cache
 */
export function clearNavigationResolutionCache(): void {
  resolutionCache.clear()
  console.log('🧹 Navigation resolution cache cleared')
}

/**
 * Navigation resolution statistics
 */
export function getNavigationResolutionStats() {
  return {
    cacheSize: resolutionCache.size,
    cacheHitRate: resolutionCache.size > 0 ? 'Available' : 'No data'
  }
}