/**
 * Universal Entity Resolver
 * Smart Code: HERA.UNIVERSAL.LIB.ENTITY_RESOLVER.v1
 * 
 * Resolves entity types from URLs, search parameters, or database configuration
 * Provides dynamic entity list page generation capabilities
 */

import { getEntityType, getAllEntityTypes, type EntityTypeConfig } from '@/lib/config/entity-types'

export interface EntityResolutionResult {
  success: boolean
  config: EntityTypeConfig | null
  module?: string
  entityType?: string
  source: 'url' | 'params' | 'database' | 'fallback'
  error?: string
}

export interface EntityListRouteParams {
  module?: string
  type?: string
  entity?: string
  area?: string
  operation?: string
}

/**
 * Resolve entity configuration from URL parameters
 */
export function resolveEntityFromParams(searchParams: URLSearchParams): EntityResolutionResult {
  const module = searchParams.get('module')
  const type = searchParams.get('type')
  const entity = searchParams.get('entity')

  // Try module + type combination first
  if (module && type) {
    // First try direct lookup
    let config = getEntityType(module, type)
    
    // If not found, try to find by plural name
    if (!config) {
      const allTypes = getAllEntityTypes()
      config = allTypes.find(t => 
        t.module === module && 
        (t.plural.toLowerCase() === type.toLowerCase() || 
         t.plural.toLowerCase().replace(/s$/, '') === type.toLowerCase())
      ) || null
    }
    
    if (config) {
      return {
        success: true,
        config,
        module,
        entityType: config.id, // Use the actual entity type ID, not the input
        source: 'params'
      }
    }
    
    // Try to find similar entity types to provide helpful error message
    const allTypes = getAllEntityTypes()
    const moduleTypes = allTypes.filter(t => t.module === module)
    const similarTypes = moduleTypes.filter(t => 
      t.id.includes(type) || t.plural.toLowerCase().includes(type.toLowerCase()) ||
      type.includes(t.id) || type.toLowerCase().includes(t.plural.toLowerCase())
    )
    
    if (similarTypes.length > 0) {
      const suggestions = similarTypes.map(t => `${t.module}.${t.id} (${t.name})`).join(', ')
      return {
        success: false,
        config: null,
        source: 'params',
        error: `Entity type '${type}' not found in module '${module}'. Did you mean: ${suggestions}?`
      }
    }
    
    if (moduleTypes.length > 0) {
      const available = moduleTypes.map(t => `${t.id} (${t.name})`).join(', ')
      return {
        success: false,
        config: null,
        source: 'params',
        error: `Entity type '${type}' not found in module '${module}'. Available types: ${available}`
      }
    }
    
    const availableModules = [...new Set(allTypes.map(t => t.module))].join(', ')
    return {
      success: false,
      config: null,
      source: 'params',
      error: `Module '${module}' not found. Available modules: ${availableModules}`
    }
  }

  // Try direct entity lookup
  if (entity) {
    const allTypes = getAllEntityTypes()
    const config = allTypes.find(t => t.id === entity || t.name.toLowerCase() === entity.toLowerCase())
    if (config) {
      return {
        success: true,
        config,
        module: config.module,
        entityType: config.id,
        source: 'params'
      }
    }
  }

  return {
    success: false,
    config: null,
    source: 'params',
    error: 'No valid entity configuration found in URL parameters'
  }
}

/**
 * Resolve entity configuration from URL pathname
 */
export function resolveEntityFromPath(pathname: string): EntityResolutionResult {
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Pattern: /enterprise/universal/entities/list/[module]/[type]
  if (pathSegments.includes('universal') && pathSegments.includes('entities')) {
    const universalIndex = pathSegments.indexOf('universal')
    const entitiesIndex = pathSegments.indexOf('entities')
    
    if (entitiesIndex < pathSegments.length - 2) {
      const module = pathSegments[entitiesIndex + 1]
      const type = pathSegments[entitiesIndex + 2]
      
      const config = getEntityType(module, type)
      if (config) {
        return {
          success: true,
          config,
          module,
          entityType: type,
          source: 'url'
        }
      }
    }
  }
  
  // Pattern: /[module]/[entities]/list
  // e.g., /crm/customers/list, /procurement/vendors/list
  if (pathSegments.length >= 2) {
    const module = pathSegments[0]
    const entityPlural = pathSegments[1]
    
    // Find entity by plural name
    const allTypes = getAllEntityTypes()
    const config = allTypes.find(t => 
      t.module === module && 
      (t.plural.toLowerCase() === entityPlural || t.id === entityPlural)
    )
    
    if (config) {
      return {
        success: true,
        config,
        module,
        entityType: config.id,
        source: 'url'
      }
    }
  }

  // Pattern: /enterprise/[module]/[entities]
  // e.g., /enterprise/procurement/vendors, /enterprise/crm/customers
  if (pathSegments[0] === 'enterprise' && pathSegments.length >= 3) {
    const module = pathSegments[1]
    const entityPlural = pathSegments[2]
    
    const allTypes = getAllEntityTypes()
    const config = allTypes.find(t => 
      t.module === module && 
      (t.plural.toLowerCase() === entityPlural || t.id === entityPlural)
    )
    
    if (config) {
      return {
        success: true,
        config,
        module,
        entityType: config.id,
        source: 'url'
      }
    }
  }

  return {
    success: false,
    config: null,
    source: 'url',
    error: `No entity configuration found for path: ${pathname}`
  }
}

/**
 * Resolve entity configuration from organization settings
 * This would typically query the database for organization-specific entity configurations
 */
export async function resolveEntityFromDatabase(
  organizationId: string,
  entityIdentifier: string
): Promise<EntityResolutionResult> {
  try {
    // In a real implementation, this would query the database
    // For now, we'll simulate with local lookup
    
    const allTypes = getAllEntityTypes()
    const config = allTypes.find(t => 
      t.id === entityIdentifier || 
      t.name.toLowerCase() === entityIdentifier.toLowerCase() ||
      t.plural.toLowerCase() === entityIdentifier.toLowerCase()
    )
    
    if (config) {
      return {
        success: true,
        config,
        module: config.module,
        entityType: config.id,
        source: 'database'
      }
    }
    
    return {
      success: false,
      config: null,
      source: 'database',
      error: `No entity configuration found in database for: ${entityIdentifier}`
    }
  } catch (error) {
    return {
      success: false,
      config: null,
      source: 'database',
      error: `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Universal entity resolver - tries multiple resolution strategies
 */
export async function resolveEntityConfig(
  searchParams: URLSearchParams,
  pathname: string,
  organizationId?: string
): Promise<EntityResolutionResult> {
  // Strategy 1: URL parameters
  const paramResult = resolveEntityFromParams(searchParams)
  if (paramResult.success) {
    return paramResult
  }

  // Strategy 2: URL pathname
  const pathResult = resolveEntityFromPath(pathname)
  if (pathResult.success) {
    return pathResult
  }

  // Strategy 3: Database lookup (if organization ID provided)
  if (organizationId) {
    const entityIdentifier = searchParams.get('entity') || searchParams.get('type')
    if (entityIdentifier) {
      const dbResult = await resolveEntityFromDatabase(organizationId, entityIdentifier)
      if (dbResult.success) {
        return dbResult
      }
    }
  }

  // Fallback: return first available entity type
  const allTypes = getAllEntityTypes()
  if (allTypes.length > 0) {
    const fallbackConfig = allTypes[0]
    return {
      success: true,
      config: fallbackConfig,
      module: fallbackConfig.module,
      entityType: fallbackConfig.id,
      source: 'fallback'
    }
  }

  return {
    success: false,
    config: null,
    source: 'fallback',
    error: 'No entity configurations available'
  }
}

/**
 * Generate breadcrumbs from entity configuration
 */
export function generateEntityBreadcrumbs(
  config: EntityTypeConfig,
  operation: 'list' | 'create' | 'edit' | 'view' = 'list'
): Array<{ label: string; href?: string }> {
  const breadcrumbs = [
    { label: 'HERA', href: '/' },
    { label: 'Enterprise', href: '/enterprise' },
    { label: config.module.toUpperCase(), href: `/enterprise/${config.module}` },
    { label: config.plural, href: config.list_path }
  ]

  if (operation !== 'list') {
    breadcrumbs.push({
      label: operation === 'create' ? 'New' : operation === 'edit' ? 'Edit' : 'View'
    })
  }

  return breadcrumbs
}

/**
 * Generate canonical URLs for entity operations
 */
export function generateEntityUrls(config: EntityTypeConfig) {
  const base = `/enterprise/${config.module}/${config.plural.toLowerCase()}`
  
  return {
    list: base,
    create: `${base}/new`,
    edit: (id: string) => `${base}/${id}/edit`,
    view: (id: string) => `${base}/${id}`,
    universal_list: `/enterprise/universal/entities/list?module=${config.module}&type=${config.id}`,
    universal_create: `/enterprise/universal/entities?module=${config.module}&type=${config.id}`
  }
}

/**
 * Validate entity operation permissions
 */
export function validateEntityOperation(
  config: EntityTypeConfig,
  operation: 'create' | 'read' | 'update' | 'delete',
  userPermissions: string[] = []
): boolean {
  const permissionMap = {
    create: config.create_permission,
    read: undefined, // Read is generally allowed
    update: config.edit_permission,
    delete: config.delete_permission
  }

  const requiredPermission = permissionMap[operation]
  if (!requiredPermission) {
    return true // No specific permission required
  }

  return userPermissions.includes(requiredPermission)
}

/**
 * Get entity list filters from configuration
 */
export function generateEntityFilters(config: EntityTypeConfig) {
  const filters: Array<{
    field: string
    label: string
    type: 'text' | 'select' | 'date' | 'number'
    options?: Array<{ value: string; label: string }>
  }> = []

  if (!config.list_configuration?.filterable_fields) {
    return filters
  }

  config.list_configuration.filterable_fields.forEach(fieldName => {
    const fieldConfig = config.fields.find(f => f.name === fieldName)
    if (!fieldConfig) return

    const filter: any = {
      field: fieldName,
      label: fieldConfig.label,
      type: fieldConfig.type === 'select' ? 'select' : fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'number' ? 'number' : 'text'
    }

    if (fieldConfig.type === 'select' && fieldConfig.options) {
      filter.options = fieldConfig.options
    }

    filters.push(filter)
  })

  return filters
}

/**
 * Apply entity list sorting and filtering
 */
export function applyEntityListTransforms<T extends Record<string, any>>(
  entities: T[],
  config: EntityTypeConfig,
  filters: Record<string, any> = {},
  sort?: { field: string; direction: 'asc' | 'desc' },
  searchTerm?: string
): T[] {
  let result = [...entities]

  // Apply search
  if (searchTerm && config.list_configuration?.searchable_fields) {
    const searchLower = searchTerm.toLowerCase()
    result = result.filter(entity =>
      config.list_configuration!.searchable_fields.some(field =>
        String(entity[field] || '').toLowerCase().includes(searchLower)
      )
    )
  }

  // Apply filters
  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result = result.filter(entity => {
        const entityValue = entity[field]
        
        if (Array.isArray(value)) {
          return value.includes(entityValue)
        }
        
        if (typeof value === 'string') {
          return String(entityValue || '').toLowerCase().includes(value.toLowerCase())
        }
        
        return entityValue === value
      })
    }
  })

  // Apply sorting
  if (sort) {
    result.sort((a, b) => {
      const aVal = a[sort.field]
      const bVal = b[sort.field]
      
      if (aVal === bVal) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      
      const comparison = aVal < bVal ? -1 : 1
      return sort.direction === 'desc' ? -comparison : comparison
    })
  }

  return result
}

export default {
  resolveEntityFromParams,
  resolveEntityFromPath,
  resolveEntityFromDatabase,
  resolveEntityConfig,
  generateEntityBreadcrumbs,
  generateEntityUrls,
  validateEntityOperation,
  generateEntityFilters,
  applyEntityListTransforms
}