/**
 * HERA Navigation Service
 * Smart Code: HERA.PLATFORM.NAV.SERVICE.v1
 * 
 * Service for loading navigation configuration from Supabase database
 * Replaces JSON-based navigation with database-driven navigation
 */

import { createClient } from '@supabase/supabase-js'

// HERA Platform Organization ID (where all platform entities live)
const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Entity types for navigation
const NAVIGATION_ENTITY_TYPES = {
  MODULE: 'navigation_module',
  AREA: 'navigation_area',
  OPERATION: 'navigation_operation',
  INDUSTRY: 'navigation_industry',
  CONFIG: 'navigation_config'
}

// Navigation interfaces
export interface NavigationOperation {
  name: string
  code: string
  route: string
  permissions: string[]
  entity_id?: string
}

export interface NavigationArea {
  name: string
  code: string
  route: string
  icon: string
  operations: NavigationOperation[]
  entity_id?: string
}

export interface NavigationModule {
  name: string
  code: string
  route: string
  icon: string
  color: string
  smart_code_prefix: string
  areas: NavigationArea[]
  entity_id?: string
  module_type?: 'base' | 'industry_specialized'
  industry_code?: string
}

export interface NavigationIndustry {
  name: string
  code: string
  route_prefix: string
  theme: {
    primary_color: string
    secondary_color: string
    hero_background: string
  }
  specialized_modules: Record<string, NavigationModule>
  entity_id?: string
}

export interface NavigationConfig {
  schema_version: string
  title: string
  base_modules: Record<string, NavigationModule>
  industries: Record<string, NavigationIndustry>
  security: {
    permission_sets: Array<{ code: string; description: string }>
    industry_permissions: Array<{ code: string; description: string }>
  }
}

/**
 * Load dynamic field values for an entity
 */
async function loadDynamicFields(entityId: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text, field_value_number, field_value_json, field_type')
    .eq('entity_id', entityId)
    .eq('organization_id', PLATFORM_ORGANIZATION_ID)

  if (error) {
    console.error('Error loading dynamic fields:', error)
    return {}
  }

  const dynamicFields: Record<string, any> = {}
  data.forEach(field => {
    let value = field.field_value_text
    if (field.field_type === 'number') {
      value = field.field_value_number
    } else if (field.field_type === 'json') {
      value = field.field_value_json
    }
    dynamicFields[field.field_name] = value
  })

  return dynamicFields
}

/**
 * Load child entities via relationships
 */
async function loadChildEntities(parentId: string, relationshipType: string, childEntityType: string): Promise<any[]> {
  // Get relationships
  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('target_entity_id')
    .eq('source_entity_id', parentId)
    .eq('relationship_type', relationshipType)
    .eq('organization_id', PLATFORM_ORGANIZATION_ID)

  if (relError) {
    console.error('Error loading relationships:', relError)
    return []
  }

  if (relationships.length === 0) {
    return []
  }

  // Get child entities
  const childIds = relationships.map(rel => rel.target_entity_id)
  const { data: entities, error: entError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, smart_code')
    .in('id', childIds)
    .eq('entity_type', childEntityType)
    .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    .order('entity_code')

  if (entError) {
    console.error('Error loading child entities:', entError)
    return []
  }

  return entities || []
}

/**
 * Load operations for an area
 */
async function loadOperations(areaId: string): Promise<NavigationOperation[]> {
  const operations = await loadChildEntities(areaId, 'CONTAINS_OPERATION', NAVIGATION_ENTITY_TYPES.OPERATION)
  
  const operationList: NavigationOperation[] = []
  
  for (const operation of operations) {
    const dynamicFields = await loadDynamicFields(operation.id)
    
    operationList.push({
      name: operation.entity_name,
      code: operation.entity_code,
      route: dynamicFields.route || '',
      permissions: dynamicFields.permissions || [],
      entity_id: operation.id
    })
  }
  
  return operationList
}

/**
 * Load areas for a module
 */
async function loadAreas(moduleId: string): Promise<NavigationArea[]> {
  const areas = await loadChildEntities(moduleId, 'CONTAINS_AREA', NAVIGATION_ENTITY_TYPES.AREA)
  
  const areaList: NavigationArea[] = []
  
  for (const area of areas) {
    const dynamicFields = await loadDynamicFields(area.id)
    const operations = await loadOperations(area.id)
    
    areaList.push({
      name: area.entity_name,
      code: area.entity_code,
      route: dynamicFields.route || '',
      icon: dynamicFields.icon || 'folder',
      operations,
      entity_id: area.id
    })
  }
  
  return areaList
}

/**
 * Load base modules (FIN, PROC, SALES)
 */
async function loadBaseModules(): Promise<Record<string, NavigationModule>> {
  const { data: modules, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, smart_code')
    .eq('entity_type', NAVIGATION_ENTITY_TYPES.MODULE)
    .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    .order('entity_code')

  if (error) {
    console.error('Error loading base modules:', error)
    return {}
  }

  const baseModules: Record<string, NavigationModule> = {}
  
  for (const module of modules || []) {
    const dynamicFields = await loadDynamicFields(module.id)
    
    // Only include base modules (not industry-specialized)
    if (dynamicFields.module_type === 'base') {
      const areas = await loadAreas(module.id)
      
      baseModules[module.entity_code] = {
        name: module.entity_name,
        code: module.entity_code,
        route: dynamicFields.route || '',
        icon: dynamicFields.icon || 'folder',
        color: dynamicFields.color || 'bg-gray-600',
        smart_code_prefix: dynamicFields.smart_code_prefix || `HERA.${module.entity_code}`,
        areas,
        entity_id: module.id,
        module_type: 'base'
      }
    }
  }
  
  return baseModules
}

/**
 * Load industry-specific modules
 */
async function loadIndustryModules(): Promise<Record<string, NavigationIndustry>> {
  const { data: industries, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, smart_code')
    .eq('entity_type', NAVIGATION_ENTITY_TYPES.INDUSTRY)
    .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    .order('entity_code')

  if (error) {
    console.error('Error loading industries:', error)
    return {}
  }

  const industryModules: Record<string, NavigationIndustry> = {}
  
  for (const industry of industries || []) {
    const dynamicFields = await loadDynamicFields(industry.id)
    
    // Load specialized modules for this industry
    const specializedModules = await loadChildEntities(industry.id, 'CONTAINS_MODULE', NAVIGATION_ENTITY_TYPES.MODULE)
    const moduleMap: Record<string, NavigationModule> = {}
    
    for (const module of specializedModules) {
      const moduleDynamicFields = await loadDynamicFields(module.id)
      const areas = await loadAreas(module.id)
      
      moduleMap[module.entity_code] = {
        name: module.entity_name,
        code: module.entity_code,
        route: moduleDynamicFields.route || '',
        icon: moduleDynamicFields.icon || 'folder',
        color: moduleDynamicFields.color || 'bg-gray-600',
        smart_code_prefix: moduleDynamicFields.smart_code_prefix || `HERA.${industry.entity_code}.${module.entity_code}`,
        areas,
        entity_id: module.id,
        module_type: 'industry_specialized',
        industry_code: industry.entity_code
      }
    }
    
    industryModules[industry.entity_code] = {
      name: industry.entity_name,
      code: industry.entity_code,
      route_prefix: dynamicFields.route_prefix || '',
      theme: dynamicFields.theme || {
        primary_color: '#6366f1',
        secondary_color: '#8b5cf6',
        hero_background: 'gradient-to-br from-indigo-50 to-purple-100'
      },
      specialized_modules: moduleMap,
      entity_id: industry.id
    }
  }
  
  return industryModules
}

/**
 * Load navigation security configuration
 */
async function loadSecurityConfig(): Promise<NavigationConfig['security']> {
  const { data: configEntities, error } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', NAVIGATION_ENTITY_TYPES.CONFIG)
    .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    .limit(1)

  if (error || !configEntities || configEntities.length === 0) {
    console.error('Error loading navigation config:', error)
    // Return default security config
    return {
      permission_sets: [
        { code: "READ", description: "Read-only access" },
        { code: "WRITE", description: "Create/modify objects" },
        { code: "APPROVE", description: "Approve workflow items" },
        { code: "ADMIN", description: "Configure module settings" }
      ],
      industry_permissions: [
        { code: "JEWELRY.READ", description: "View jewelry operations" },
        { code: "JEWELRY.WRITE", description: "Manage jewelry operations" },
        { code: "WASTE.READ", description: "View waste management operations" },
        { code: "WASTE.WRITE", description: "Manage waste management operations" }
      ]
    }
  }

  const dynamicFields = await loadDynamicFields(configEntities[0].id)
  return dynamicFields.security_config || {
    permission_sets: [],
    industry_permissions: []
  }
}

/**
 * Main function to load complete navigation configuration from database
 */
export async function loadNavigationConfig(): Promise<NavigationConfig> {
  console.log('📡 Loading navigation configuration from database...')
  
  try {
    // Load all parts of navigation config
    const [baseModules, industries, security] = await Promise.all([
      loadBaseModules(),
      loadIndustryModules(),
      loadSecurityConfig()
    ])
    
    // Get schema version from config entity
    const { data: configEntities } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('entity_type', NAVIGATION_ENTITY_TYPES.CONFIG)
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      .limit(1)
    
    let schemaVersion = '2.0'
    let title = 'HERA Enterprise Navigation - Database-Driven System'
    
    if (configEntities && configEntities.length > 0) {
      const dynamicFields = await loadDynamicFields(configEntities[0].id)
      schemaVersion = dynamicFields.schema_version || '2.0'
      title = dynamicFields.title || configEntities[0].entity_name
    }
    
    const config: NavigationConfig = {
      schema_version: schemaVersion,
      title,
      base_modules: baseModules,
      industries,
      security
    }
    
    console.log('✅ Navigation configuration loaded from database')
    console.log(`   • Base modules: ${Object.keys(baseModules).length}`)
    console.log(`   • Industries: ${Object.keys(industries).length}`)
    console.log(`   • Schema version: ${schemaVersion}`)
    
    return config
    
  } catch (error) {
    console.error('❌ Error loading navigation configuration from database:', error)
    
    // Fallback: try to load from JSON file
    console.log('🔄 Falling back to JSON configuration...')
    try {
      const response = await fetch('/api/navigation-config')
      if (response.ok) {
        return await response.json()
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError)
    }
    
    // Return minimal config if all else fails
    return {
      schema_version: '2.0',
      title: 'HERA Enterprise Navigation - Minimal Fallback',
      base_modules: {},
      industries: {},
      security: {
        permission_sets: [],
        industry_permissions: []
      }
    }
  }
}

/**
 * Get navigation configuration for a specific module
 */
export async function getModuleConfig(moduleCode: string): Promise<NavigationModule | null> {
  const config = await loadNavigationConfig()
  
  // Check base modules first
  if (config.base_modules[moduleCode]) {
    return config.base_modules[moduleCode]
  }
  
  // Check industry modules
  for (const industry of Object.values(config.industries)) {
    if (industry.specialized_modules[moduleCode]) {
      return industry.specialized_modules[moduleCode]
    }
  }
  
  return null
}

/**
 * Get industry configuration
 */
export async function getIndustryConfig(industryCode: string): Promise<NavigationIndustry | null> {
  const config = await loadNavigationConfig()
  return config.industries[industryCode] || null
}

/**
 * Cache for navigation config to avoid repeated database calls
 */
let navigationConfigCache: NavigationConfig | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached navigation configuration
 */
export async function getCachedNavigationConfig(): Promise<NavigationConfig> {
  const now = Date.now()
  
  if (navigationConfigCache && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('📋 Using cached navigation configuration')
    return navigationConfigCache
  }
  
  navigationConfigCache = await loadNavigationConfig()
  cacheTimestamp = now
  
  return navigationConfigCache
}

/**
 * Clear navigation configuration cache
 */
export function clearNavigationCache(): void {
  navigationConfigCache = null
  cacheTimestamp = 0
  console.log('🧹 Navigation configuration cache cleared')
}