/**
 * HERA Universal Route Engine
 * Smart Code: HERA.PLATFORM.ROUTING.UNIVERSAL.ENGINE.v1
 * 
 * Scalable, configuration-driven route resolution engine
 * Eliminates hardcoded route mappings through pattern-based matching
 */

import { WMSEntityTypes } from '@/config/waste-management-config'

// Define universal route patterns
interface RoutePattern {
  pattern: RegExp
  moduleCapture: number  // Which capture group contains the module
  entityCapture: number  // Which capture group contains the entity  
  actionCapture?: number // Which capture group contains the action
  defaultAction?: string
}

// Universal route patterns (covers all HERA modules)
const UNIVERSAL_ROUTE_PATTERNS: RoutePattern[] = [
  // Pattern 1: /{module}/{entity}/new
  {
    pattern: /^\/([^\/]+)\/([^\/]+)\/new$/,
    moduleCapture: 1,
    entityCapture: 2,
    defaultAction: 'CREATE'
  },
  
  // Pattern 2: /{module}/{entity}/list  
  {
    pattern: /^\/([^\/]+)\/([^\/]+)\/list$/,
    moduleCapture: 1,
    entityCapture: 2,
    defaultAction: 'LIST'
  },
  
  // Pattern 3: /{module}/{entity} (default to list)
  {
    pattern: /^\/([^\/]+)\/([^\/]+)$/,
    moduleCapture: 1,
    entityCapture: 2,
    defaultAction: 'LIST'
  },
  
  // Pattern 4: /{module}/operations/{entity}/new
  {
    pattern: /^\/([^\/]+)\/operations\/([^\/]+)\/new$/,
    moduleCapture: 1,
    entityCapture: 2,
    defaultAction: 'CREATE'
  },
  
  // Pattern 5: /{module}/operations/{entity}
  {
    pattern: /^\/([^\/]+)\/operations\/([^\/]+)$/,
    moduleCapture: 1,
    entityCapture: 2,
    defaultAction: 'LIST'
  }
]

// Module configurations (easily extensible)
interface ModuleConfig {
  name: string
  entityTypes: Record<string, string>
  entityPrefix?: string
  smartCodePrefix: string
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  'waste-management': {
    name: 'Waste Management',
    entityTypes: WMSEntityTypes,
    entityPrefix: 'WMS_',
    smartCodePrefix: 'HERA.WMS'
  },
  
  'cashew': {
    name: 'Cashew Processing',
    entityTypes: {
      MATERIAL: 'MATERIAL',
      PRODUCT: 'PRODUCT', 
      BATCH: 'BATCH',
      WORK_CENTER: 'WORK_CENTER',
      LOCATION: 'LOCATION',
      BOM: 'BOM'
    },
    smartCodePrefix: 'HERA.CASHEW'
  },
  
  'crm': {
    name: 'Customer Relationship Management',
    entityTypes: {
      CUSTOMER: 'CUSTOMER',
      LEAD: 'LEAD',
      OPPORTUNITY: 'OPPORTUNITY',
      CONTACT: 'CONTACT',
      ACCOUNT: 'ACCOUNT'
    },
    smartCodePrefix: 'HERA.CRM'
  },
  
  'finance': {
    name: 'Financial Management',
    entityTypes: {
      ACCOUNT: 'GL_ACCOUNT',
      COST_CENTER: 'COST_CENTER',
      PROFIT_CENTER: 'PROFIT_CENTER'
    },
    smartCodePrefix: 'HERA.FINANCE'
  }
}

// Entity name to type mapping (for URL normalization)
const ENTITY_NAME_MAPPINGS: Record<string, Record<string, string>> = {
  'waste-management': {
    'collections': 'ROUTE',
    'routes': 'ROUTE', 
    'vehicles': 'VEHICLE',
    'customers': 'CUSTOMER',
    'facilities': 'FACILITY',
    'contractors': 'CONTRACTOR'
  },
  
  'crm': {
    'customers': 'CUSTOMER',
    'leads': 'LEAD',
    'opportunities': 'OPPORTUNITY',
    'contacts': 'CONTACT',
    'accounts': 'ACCOUNT'
  },
  
  'finance': {
    'accounts': 'ACCOUNT',
    'cost-centers': 'COST_CENTER',
    'profit-centers': 'PROFIT_CENTER'
  }
}

/**
 * Resolve entity type from URL entity name
 */
function resolveEntityType(module: string, entityName: string): string | null {
  const moduleMapping = ENTITY_NAME_MAPPINGS[module]
  if (!moduleMapping) return null
  
  const entityType = moduleMapping[entityName]
  if (!entityType) return null
  
  const moduleConfig = MODULE_CONFIGS[module]
  if (!moduleConfig) return null
  
  // Add module prefix if configured
  const prefix = moduleConfig.entityPrefix || ''
  return prefix + entityType
}

/**
 * Generate component ID based on action and entity type
 */
function generateComponentId(action: string, entityType: string): string {
  switch (action) {
    case 'CREATE':
      return `EntityWizard:${entityType}`
    case 'LIST':
      return `EntityList:${entityType}`
    case 'DETAIL':
      return `EntityDetail:${entityType}`
    default:
      return `EntityList:${entityType}`
  }
}

/**
 * Generate smart code for entity
 */
function generateSmartCode(module: string, entityType: string): string {
  const moduleConfig = MODULE_CONFIGS[module]
  if (!moduleConfig) return `HERA.UNKNOWN.${entityType}.ENTITY.v1`
  
  const cleanEntityType = entityType.replace(moduleConfig.entityPrefix || '', '')
  return `${moduleConfig.smartCodePrefix}.${cleanEntityType}.ENTITY.v1`
}

/**
 * Universal Route Resolution Engine
 * Dynamically resolves any route pattern to appropriate component
 */
export function resolveUniversalRoute(
  slug: string, 
  orgId: string, 
  actorId: string
): any | null {
  // Try each pattern until we find a match
  for (const routePattern of UNIVERSAL_ROUTE_PATTERNS) {
    const match = slug.match(routePattern.pattern)
    
    if (match) {
      const module = match[routePattern.moduleCapture]
      const entityName = match[routePattern.entityCapture]
      const action = routePattern.defaultAction!
      
      // Resolve entity type
      const entityType = resolveEntityType(module, entityName)
      if (!entityType) continue // Try next pattern
      
      // Check if module is configured
      const moduleConfig = MODULE_CONFIGS[module]
      if (!moduleConfig) continue
      
      // Generate dynamic route data
      return {
        id: `universal-${module}-${entityType}-${action}`,
        entity_code: entityType,
        entity_name: entityType.replace(/^[A-Z]+_/, '').toLowerCase(),
        smart_code: generateSmartCode(module, entityType),
        canonical_path: slug,
        component_id: generateComponentId(action, entityType),
        scenario: action,
        params: {
          entityType,
          module,
          area: 'universal',
          entityName,
          moduleConfig: moduleConfig.name
        },
        aliasHit: false,
        // Include resolution metadata
        _resolution: {
          engine: 'UniversalRouteEngine',
          pattern: routePattern.pattern.source,
          module,
          entityName,
          entityType,
          action
        }
      }
    }
  }
  
  return null // No pattern matched
}

/**
 * Register new module configuration
 * Allows dynamic extension without code changes
 */
export function registerModule(
  moduleKey: string, 
  config: ModuleConfig, 
  entityMappings: Record<string, string>
): void {
  MODULE_CONFIGS[moduleKey] = config
  ENTITY_NAME_MAPPINGS[moduleKey] = entityMappings
}

/**
 * Get all supported modules
 */
export function getSupportedModules(): string[] {
  return Object.keys(MODULE_CONFIGS)
}

/**
 * Get module configuration
 */
export function getModuleConfig(module: string): ModuleConfig | null {
  return MODULE_CONFIGS[module] || null
}

/**
 * Validate route pattern
 */
export function validateRoute(slug: string): boolean {
  return UNIVERSAL_ROUTE_PATTERNS.some(pattern => pattern.pattern.test(slug))
}

/**
 * Get route suggestions for a module
 */
export function getRouteSuggestions(module: string): string[] {
  const mappings = ENTITY_NAME_MAPPINGS[module]
  if (!mappings) return []
  
  const routes: string[] = []
  Object.keys(mappings).forEach(entityName => {
    routes.push(`/${module}/${entityName}`)
    routes.push(`/${module}/${entityName}/new`)
    routes.push(`/${module}/${entityName}/list`)
  })
  
  return routes
}

// Export for debugging and monitoring
export const UniversalRouteEngineDebug = {
  patterns: UNIVERSAL_ROUTE_PATTERNS,
  modules: MODULE_CONFIGS,
  mappings: ENTITY_NAME_MAPPINGS,
  resolve: resolveUniversalRoute
}