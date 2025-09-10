/**
 * 🏢 HERA Tenant Resolver Middleware
 * 
 * Resolves organization from subdomain and validates access
 * - Subdomain to organization mapping
 * - Module entitlements checking
 * - Perfect multi-tenant isolation
 * - Smart code versioning support
 */

import { NextRequest, NextResponse } from 'next/server'
// Note: Edge Runtime doesn't support Node.js modules like 'cookies'
// Tenant resolution should be handled in API routes, not Edge middleware

export interface TenantContext {
  organizationId: string
  organizationCode: string
  organizationName: string
  subdomain: string
  modules: ModuleEntitlement[]
  settings: Record<string, any>
}

export interface ModuleEntitlement {
  moduleId: string
  moduleName: string
  smartCode: string
  version: string
  enabled: boolean
  expiresAt?: string
  configuration?: Record<string, any>
}

// Cache for tenant lookups (5 minute TTL)
const tenantCache = new Map<string, { data: TenantContext; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Resolve tenant from subdomain
 */
export async function resolveTenant(subdomain: string): Promise<TenantContext | null> {
  // Check cache first
  const cached = tenantCache.get(subdomain)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  try {
    // 1. Find organization by subdomain (stored in dynamic data)
    const { data: subdomainData, error: subdomainError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, organization_id')
      .eq('field_name', 'subdomain')
      .eq('field_value_text', subdomain)
      .single()

    if (subdomainError || !subdomainData) {
      console.error(`[Tenant Resolver] No organization found for subdomain: ${subdomain}`)
      return null
    }

    // 2. Get organization details
    const { data: orgData, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', subdomainData.organization_id)
      .single()

    if (orgError || !orgData) {
      console.error(`[Tenant Resolver] Organization not found: ${subdomainData.organization_id}`)
      return null
    }

    // 3. Get module entitlements via relationships (HAS_MODULE relationships)
    const { data: moduleRelationships, error: moduleError } = await supabase
      .from('core_relationships')
      .select(`
        *,
        module:to_entity_id (
          id,
          entity_name,
          entity_code,
          smart_code,
          metadata
        )
      `)
      .eq('organization_id', orgData.id)
      .eq('from_entity_id', orgData.id)
      .eq('relationship_type', 'HAS_MODULE')
      .eq('is_active', true)

    if (moduleError) {
      console.error('[Tenant Resolver] Error fetching modules:', moduleError)
    }

    // 4. Get module configurations from dynamic data
    const moduleIds = moduleRelationships?.map(r => r.to_entity_id) || []
    let moduleConfigs: any[] = []
    
    if (moduleIds.length > 0) {
      const { data: configData, error: configError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', orgData.id)
        .in('entity_id', moduleIds)
        .eq('field_name', 'configuration')

      if (!configError && configData) {
        moduleConfigs = configData
      }
    }

    // 5. Build module entitlements
    const modules: ModuleEntitlement[] = (moduleRelationships || []).map(rel => {
      const module = rel.module as any
      const config = moduleConfigs.find(c => c.entity_id === rel.to_entity_id)
      
      // Parse version from smart code (e.g., HERA.SALON.POS.MODULE.v1 -> v1)
      const smartCode = module?.smart_code || ''
      const version = smartCode.split('.').pop() || 'v1'

      return {
        moduleId: module?.id || rel.to_entity_id,
        moduleName: module?.entity_name || '',
        smartCode: smartCode,
        version: version,
        enabled: rel.is_active || false,
        expiresAt: rel.expiration_date,
        configuration: config?.field_value_json || {}
      }
    })

    // 6. Get organization settings from dynamic data
    const { data: settingsData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_json')
      .eq('organization_id', orgData.id)
      .eq('entity_id', orgData.id)
      .eq('field_name', 'tenant_settings')
      .single()

    const tenantContext: TenantContext = {
      organizationId: orgData.id,
      organizationCode: orgData.organization_code,
      organizationName: orgData.organization_name,
      subdomain: subdomain,
      modules: modules,
      settings: settingsData?.field_value_json || orgData.settings || {}
    }

    // Cache the result
    tenantCache.set(subdomain, {
      data: tenantContext,
      timestamp: Date.now()
    })

    return tenantContext

  } catch (error) {
    console.error('[Tenant Resolver] Error resolving tenant:', error)
    return null
  }
}

/**
 * Check if tenant has access to a specific module
 */
export function hasModuleAccess(
  tenant: TenantContext,
  moduleSmartCode: string
): boolean {
  const module = tenant.modules.find(m => 
    m.smartCode === moduleSmartCode || 
    m.smartCode.startsWith(moduleSmartCode.split('.v')[0]) // Version-agnostic check
  )

  if (!module) return false
  if (!module.enabled) return false
  
  // Check expiration
  if (module.expiresAt) {
    const expiryDate = new Date(module.expiresAt)
    if (expiryDate < new Date()) return false
  }

  return true
}

/**
 * Get module configuration for tenant
 */
export function getModuleConfig(
  tenant: TenantContext,
  moduleSmartCode: string
): Record<string, any> | null {
  const module = tenant.modules.find(m => 
    m.smartCode === moduleSmartCode || 
    m.smartCode.startsWith(moduleSmartCode.split('.v')[0])
  )

  return module?.configuration || null
}

/**
 * Tenant resolver middleware
 */
export async function tenantResolverMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Get subdomain from header (set by main middleware)
  const subdomain = request.headers.get('x-hera-subdomain')
  
  if (!subdomain) {
    // No subdomain, continue without tenant context
    return null
  }

  // Skip tenant resolution for auth routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return null
  }

  // Resolve tenant
  const tenant = await resolveTenant(subdomain)
  
  if (!tenant) {
    // Unknown tenant
    return NextResponse.json(
      { 
        error: 'Unknown tenant',
        message: `No organization found for subdomain: ${subdomain}`,
        code: 'TENANT_NOT_FOUND'
      },
      { status: 404 }
    )
  }

  // Add tenant context to headers for downstream use
  const response = NextResponse.next()
  response.headers.set('x-hera-organization-id', tenant.organizationId)
  response.headers.set('x-hera-organization-code', tenant.organizationCode)
  response.headers.set('x-hera-modules', JSON.stringify(tenant.modules.map(m => m.smartCode)))

  return response
}

/**
 * Clear tenant cache (useful after provisioning)
 */
export function clearTenantCache(subdomain?: string) {
  if (subdomain) {
    tenantCache.delete(subdomain)
  } else {
    tenantCache.clear()
  }
}