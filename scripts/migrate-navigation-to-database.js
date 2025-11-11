#!/usr/bin/env node

/**
 * HERA Navigation Migration Script
 * Smart Code: HERA.PLATFORM.MIGRATION.NAVIGATION.v1
 * 
 * Migrates navigation configuration from JSON to Supabase database
 * Stores as entities in Platform Organization with proper hierarchical relationships
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

// HERA Platform Organization ID (where all platform entities live)
const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const HERA_PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001' // System user for platform operations

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Navigation entity types
const ENTITY_TYPES = {
  MODULE: 'navigation_module',
  AREA: 'navigation_area', 
  OPERATION: 'navigation_operation',
  INDUSTRY: 'navigation_industry'
}

// Smart code prefixes
const SMART_CODES = {
  BASE_MODULE: 'HERA.PLATFORM.NAV.MODULE',
  INDUSTRY_MODULE: 'HERA.PLATFORM.NAV.INDUSTRY.MODULE',
  AREA: 'HERA.PLATFORM.NAV.AREA',
  OPERATION: 'HERA.PLATFORM.NAV.OPERATION'
}

/**
 * Call HERA RPC function to create entity
 */
async function createNavigationEntity(entityData, dynamicFields = {}, relationships = []) {
  console.log(`📦 Creating entity: ${entityData.entity_name} (${entityData.entity_type})`)
  
  try {
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: HERA_PLATFORM_USER_ID,
      p_organization_id: PLATFORM_ORGANIZATION_ID,
      p_entity: entityData,
      p_dynamic: dynamicFields,
      p_relationships: relationships,
      p_options: {}
    })

    if (result.error) {
      console.error(`❌ Error creating entity ${entityData.entity_name}:`, result.error)
      return null
    }

    console.log(`✅ Created entity: ${entityData.entity_name} (ID: ${result.data.entity_id})`)
    return result.data.entity_id
  } catch (error) {
    console.error(`❌ Exception creating entity ${entityData.entity_name}:`, error)
    return null
  }
}

/**
 * Create relationship between entities
 */
async function createNavigationRelationship(sourceId, targetId, relationshipType) {
  try {
    const result = await supabase.rpc('hera_relationships_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: HERA_PLATFORM_USER_ID,
      p_organization_id: PLATFORM_ORGANIZATION_ID,
      p_relationship: {
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: relationshipType,
        smart_code: `HERA.PLATFORM.NAV.REL.${relationshipType}.v1`
      },
      p_options: {}
    })

    if (result.error) {
      console.error(`❌ Error creating relationship:`, result.error)
      return null
    }

    console.log(`🔗 Created relationship: ${relationshipType}`)
    return result.data.relationship_id
  } catch (error) {
    console.error(`❌ Exception creating relationship:`, error)
    return null
  }
}

/**
 * Migrate base modules (FIN, PROC, SALES)
 */
async function migrateBaseModules(navigationData) {
  console.log('\n🏗️  MIGRATING BASE MODULES')
  const moduleIds = {}

  for (const [moduleCode, moduleConfig] of Object.entries(navigationData.base_modules)) {
    // Create module entity
    const moduleEntity = {
      entity_type: ENTITY_TYPES.MODULE,
      entity_name: moduleConfig.name,
      entity_code: moduleCode,
      smart_code: `${SMART_CODES.BASE_MODULE}.${moduleCode}.v1`
    }

    const moduleDynamicFields = {
      route: {
        field_type: 'text',
        field_value_text: moduleConfig.route,
        smart_code: `${SMART_CODES.BASE_MODULE}.${moduleCode}.ROUTE.v1`
      },
      icon: {
        field_type: 'text',
        field_value_text: moduleConfig.icon,
        smart_code: `${SMART_CODES.BASE_MODULE}.${moduleCode}.ICON.v1`
      },
      color: {
        field_type: 'text',
        field_value_text: moduleConfig.color,
        smart_code: `${SMART_CODES.BASE_MODULE}.${moduleCode}.COLOR.v1`
      },
      smart_code_prefix: {
        field_type: 'text',
        field_value_text: moduleConfig.smart_code_prefix,
        smart_code: `${SMART_CODES.BASE_MODULE}.${moduleCode}.PREFIX.v1`
      },
      module_type: {
        field_type: 'text',
        field_value_text: 'base',
        smart_code: `${SMART_CODES.BASE_MODULE}.${moduleCode}.TYPE.v1`
      }
    }

    const moduleId = await createNavigationEntity(moduleEntity, moduleDynamicFields)
    if (moduleId) {
      moduleIds[moduleCode] = moduleId
      
      // Migrate areas for this module
      await migrateAreas(moduleConfig.areas, moduleId, moduleCode)
    }
  }

  return moduleIds
}

/**
 * Migrate areas within a module
 */
async function migrateAreas(areas, moduleId, moduleCode) {
  const areaIds = {}

  for (const areaConfig of areas) {
    // Create area entity
    const areaEntity = {
      entity_type: ENTITY_TYPES.AREA,
      entity_name: areaConfig.name,
      entity_code: areaConfig.code,
      smart_code: `${SMART_CODES.AREA}.${moduleCode}.${areaConfig.code}.v1`
    }

    const areaDynamicFields = {
      route: {
        field_type: 'text',
        field_value_text: areaConfig.route,
        smart_code: `${SMART_CODES.AREA}.${moduleCode}.${areaConfig.code}.ROUTE.v1`
      },
      icon: {
        field_type: 'text',
        field_value_text: areaConfig.icon,
        smart_code: `${SMART_CODES.AREA}.${moduleCode}.${areaConfig.code}.ICON.v1`
      },
      module_code: {
        field_type: 'text',
        field_value_text: moduleCode,
        smart_code: `${SMART_CODES.AREA}.${moduleCode}.${areaConfig.code}.MODULE.v1`
      }
    }

    const areaId = await createNavigationEntity(areaEntity, areaDynamicFields)
    if (areaId) {
      areaIds[areaConfig.code] = areaId
      
      // Create parent relationship to module
      await createNavigationRelationship(moduleId, areaId, 'CONTAINS_AREA')
      
      // Migrate operations for this area
      await migrateOperations(areaConfig.operations, areaId, moduleCode, areaConfig.code)
    }
  }

  return areaIds
}

/**
 * Migrate operations within an area
 */
async function migrateOperations(operations, areaId, moduleCode, areaCode) {
  const operationIds = {}

  for (const operationConfig of operations) {
    // Create operation entity
    const operationEntity = {
      entity_type: ENTITY_TYPES.OPERATION,
      entity_name: operationConfig.name,
      entity_code: operationConfig.code,
      smart_code: `${SMART_CODES.OPERATION}.${moduleCode}.${areaCode}.${operationConfig.code}.v1`
    }

    const operationDynamicFields = {
      route: {
        field_type: 'text',
        field_value_text: operationConfig.route,
        smart_code: `${SMART_CODES.OPERATION}.${moduleCode}.${areaCode}.${operationConfig.code}.ROUTE.v1`
      },
      permissions: {
        field_type: 'json',
        field_value_json: operationConfig.permissions,
        smart_code: `${SMART_CODES.OPERATION}.${moduleCode}.${areaCode}.${operationConfig.code}.PERMISSIONS.v1`
      },
      module_code: {
        field_type: 'text',
        field_value_text: moduleCode,
        smart_code: `${SMART_CODES.OPERATION}.${moduleCode}.${areaCode}.${operationConfig.code}.MODULE.v1`
      },
      area_code: {
        field_type: 'text',
        field_value_text: areaCode,
        smart_code: `${SMART_CODES.OPERATION}.${moduleCode}.${areaCode}.${operationConfig.code}.AREA.v1`
      }
    }

    const operationId = await createNavigationEntity(operationEntity, operationDynamicFields)
    if (operationId) {
      operationIds[operationConfig.code] = operationId
      
      // Create parent relationship to area
      await createNavigationRelationship(areaId, operationId, 'CONTAINS_OPERATION')
    }
  }

  return operationIds
}

/**
 * Migrate industry-specific modules (JEWELRY, WASTE_MGMT)
 */
async function migrateIndustryModules(navigationData) {
  console.log('\n🏭 MIGRATING INDUSTRY MODULES')
  const industryIds = {}

  for (const [industryCode, industryConfig] of Object.entries(navigationData.industries)) {
    // Create industry entity
    const industryEntity = {
      entity_type: ENTITY_TYPES.INDUSTRY,
      entity_name: industryConfig.name,
      entity_code: industryCode,
      smart_code: `HERA.PLATFORM.NAV.INDUSTRY.${industryCode}.v1`
    }

    const industryDynamicFields = {
      route_prefix: {
        field_type: 'text',
        field_value_text: industryConfig.route_prefix,
        smart_code: `HERA.PLATFORM.NAV.INDUSTRY.${industryCode}.ROUTE_PREFIX.v1`
      },
      theme: {
        field_type: 'json',
        field_value_json: industryConfig.theme,
        smart_code: `HERA.PLATFORM.NAV.INDUSTRY.${industryCode}.THEME.v1`
      }
    }

    const industryId = await createNavigationEntity(industryEntity, industryDynamicFields)
    if (industryId) {
      industryIds[industryCode] = industryId
      
      // Migrate specialized modules for this industry
      for (const [moduleCode, moduleConfig] of Object.entries(industryConfig.specialized_modules)) {
        const moduleEntity = {
          entity_type: ENTITY_TYPES.MODULE,
          entity_name: moduleConfig.name,
          entity_code: moduleCode,
          smart_code: `${SMART_CODES.INDUSTRY_MODULE}.${industryCode}.${moduleCode}.v1`
        }

        const moduleDynamicFields = {
          route: {
            field_type: 'text',
            field_value_text: moduleConfig.route,
            smart_code: `${SMART_CODES.INDUSTRY_MODULE}.${industryCode}.${moduleCode}.ROUTE.v1`
          },
          icon: {
            field_type: 'text',
            field_value_text: moduleConfig.icon,
            smart_code: `${SMART_CODES.INDUSTRY_MODULE}.${industryCode}.${moduleCode}.ICON.v1`
          },
          color: {
            field_type: 'text',
            field_value_text: moduleConfig.color,
            smart_code: `${SMART_CODES.INDUSTRY_MODULE}.${industryCode}.${moduleCode}.COLOR.v1`
          },
          module_type: {
            field_type: 'text',
            field_value_text: 'industry_specialized',
            smart_code: `${SMART_CODES.INDUSTRY_MODULE}.${industryCode}.${moduleCode}.TYPE.v1`
          },
          industry_code: {
            field_type: 'text',
            field_value_text: industryCode,
            smart_code: `${SMART_CODES.INDUSTRY_MODULE}.${industryCode}.${moduleCode}.INDUSTRY.v1`
          }
        }

        const moduleId = await createNavigationEntity(moduleEntity, moduleDynamicFields)
        if (moduleId) {
          // Create relationship to industry
          await createNavigationRelationship(industryId, moduleId, 'CONTAINS_MODULE')
          
          // Migrate areas for this industry module
          await migrateAreas(moduleConfig.areas, moduleId, `${industryCode}_${moduleCode}`)
        }
      }
    }
  }

  return industryIds
}

/**
 * Create navigation configuration entity to track schema version
 */
async function createNavigationConfig(navigationData) {
  console.log('\n⚙️  CREATING NAVIGATION CONFIGURATION')
  
  const configEntity = {
    entity_type: 'navigation_config',
    entity_name: 'HERA Navigation Configuration',
    entity_code: 'NAV_CONFIG',
    smart_code: 'HERA.PLATFORM.NAV.CONFIG.v1'
  }

  const configDynamicFields = {
    schema_version: {
      field_type: 'text',
      field_value_text: navigationData.schema_version,
      smart_code: 'HERA.PLATFORM.NAV.CONFIG.SCHEMA_VERSION.v1'
    },
    title: {
      field_type: 'text',
      field_value_text: navigationData.title,
      smart_code: 'HERA.PLATFORM.NAV.CONFIG.TITLE.v1'
    },
    security_config: {
      field_type: 'json',
      field_value_json: navigationData.security,
      smart_code: 'HERA.PLATFORM.NAV.CONFIG.SECURITY.v1'
    },
    migration_timestamp: {
      field_type: 'text',
      field_value_text: new Date().toISOString(),
      smart_code: 'HERA.PLATFORM.NAV.CONFIG.MIGRATION_TS.v1'
    }
  }

  await createNavigationEntity(configEntity, configDynamicFields)
}

/**
 * Main migration function
 */
async function migrateNavigationToDatabase() {
  console.log('🚀 HERA NAVIGATION MIGRATION TO DATABASE')
  console.log('=' .repeat(50))
  
  try {
    // Load navigation JSON
    const navigationPath = path.join(process.cwd(), 'src/config/hera-navigation.json')
    const navigationData = JSON.parse(fs.readFileSync(navigationPath, 'utf8'))
    
    console.log(`📋 Loaded navigation config: ${navigationData.title}`)
    console.log(`📋 Schema version: ${navigationData.schema_version}`)
    console.log(`📋 Target organization: ${PLATFORM_ORGANIZATION_ID}`)
    
    // Create navigation configuration entity
    await createNavigationConfig(navigationData)
    
    // Migrate base modules
    const baseModuleIds = await migrateBaseModules(navigationData)
    console.log(`✅ Migrated ${Object.keys(baseModuleIds).length} base modules`)
    
    // Migrate industry modules
    const industryIds = await migrateIndustryModules(navigationData)
    console.log(`✅ Migrated ${Object.keys(industryIds).length} industry modules`)
    
    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!')
    console.log('\n📊 MIGRATION SUMMARY:')
    console.log(`   • Platform Organization: ${PLATFORM_ORGANIZATION_ID}`)
    console.log(`   • Base Modules: ${Object.keys(baseModuleIds).length}`)
    console.log(`   • Industry Modules: ${Object.keys(industryIds).length}`)
    console.log(`   • All entities stored with proper HERA DNA smart codes`)
    console.log(`   • Hierarchical relationships maintained`)
    
    console.log('\n🔍 VERIFICATION QUERIES:')
    console.log('   • List modules: SELECT * FROM core_entities WHERE entity_type IN (\'navigation_module\', \'navigation_industry\');')
    console.log('   • List areas: SELECT * FROM core_entities WHERE entity_type = \'navigation_area\';')
    console.log('   • List operations: SELECT * FROM core_entities WHERE entity_type = \'navigation_operation\';')
    console.log('   • View relationships: SELECT * FROM core_relationships WHERE relationship_type IN (\'CONTAINS_AREA\', \'CONTAINS_OPERATION\', \'CONTAINS_MODULE\');')
    
  } catch (error) {
    console.error('❌ MIGRATION FAILED:', error)
    process.exit(1)
  }
}

// Execute migration
migrateNavigationToDatabase()