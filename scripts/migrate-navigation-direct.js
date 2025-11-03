#!/usr/bin/env node

/**
 * HERA Navigation Direct Migration Script
 * Smart Code: HERA.PLATFORM.MIGRATION.NAVIGATION.DIRECT.v1
 * 
 * Direct migration to Sacred Six tables without RPC functions
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'

// HERA Platform Organization ID
const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const HERA_PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001'

console.log('🔧 HERA Direct Navigation Migration')
console.log('=' .repeat(50))

// Check environment variables
console.log('Environment Check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '***SET***' : 'NOT SET')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Create entity directly in core_entities table
 */
async function createEntity(entityData) {
  console.log(`📦 Creating entity: ${entityData.entity_name}`)
  
  const entityWithDefaults = {
    id: uuidv4(),
    organization_id: PLATFORM_ORGANIZATION_ID,
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...entityData
  }
  
  const { data, error } = await supabase
    .from('core_entities')
    .insert(entityWithDefaults)
    .select('id')
    .single()
  
  if (error) {
    console.error(`❌ Error creating entity ${entityData.entity_name}:`, error)
    return null
  }
  
  console.log(`✅ Created entity: ${entityData.entity_name} (ID: ${data.id})`)
  return data.id
}

/**
 * Create dynamic data field
 */
async function createDynamicField(entityId, fieldName, fieldValue, fieldType = 'text', smartCode = null) {
  const dynamicData = {
    id: uuidv4(),
    entity_id: entityId,
    organization_id: PLATFORM_ORGANIZATION_ID,
    field_name: fieldName,
    field_type: fieldType,
    smart_code: smartCode,
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // Set the appropriate field value based on type
  if (fieldType === 'json') {
    dynamicData.field_value_json = fieldValue
  } else if (fieldType === 'number') {
    dynamicData.field_value_number = fieldValue
  } else {
    dynamicData.field_value_text = fieldValue
  }
  
  const { error } = await supabase
    .from('core_dynamic_data')
    .insert(dynamicData)
  
  if (error) {
    console.error(`❌ Error creating dynamic field ${fieldName}:`, error)
    return false
  }
  
  return true
}

/**
 * Create relationship
 */
async function createRelationship(sourceId, targetId, relationshipType) {
  const relationship = {
    id: uuidv4(),
    source_entity_id: sourceId,
    target_entity_id: targetId,
    relationship_type: relationshipType,
    organization_id: PLATFORM_ORGANIZATION_ID,
    smart_code: `HERA.PLATFORM.NAV.REL.${relationshipType}.v1`,
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('core_relationships')
    .insert(relationship)
  
  if (error) {
    console.error(`❌ Error creating relationship:`, error)
    return false
  }
  
  console.log(`🔗 Created relationship: ${relationshipType}`)
  return true
}

/**
 * Main migration function
 */
async function runDirectMigration() {
  try {
    // Test connection
    console.log('\n🔍 Testing Supabase connection...')
    const { data, error } = await supabase.from('core_entities').select('count').limit(1)
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return
    }
    console.log('✅ Supabase connection successful')
    
    // Load navigation JSON
    const navigationPath = path.join(process.cwd(), 'src/config/hera-navigation.json')
    const navigationData = JSON.parse(fs.readFileSync(navigationPath, 'utf8'))
    
    console.log('\n📋 Creating navigation config entity...')
    
    // Create navigation config entity
    const configId = await createEntity({
      entity_type: 'navigation_config',
      entity_name: 'HERA Navigation Configuration',
      entity_code: 'NAV_CONFIG',
      smart_code: 'HERA.PLATFORM.NAV.CONFIG.v1'
    })
    
    if (configId) {
      await createDynamicField(configId, 'schema_version', navigationData.schema_version, 'text')
      await createDynamicField(configId, 'title', navigationData.title, 'text')
      await createDynamicField(configId, 'security_config', navigationData.security, 'json')
      await createDynamicField(configId, 'migration_timestamp', new Date().toISOString(), 'text')
    }
    
    console.log('\n🏗️  Creating base modules...')
    let moduleCount = 0
    
    // Create base modules
    for (const [moduleCode, moduleConfig] of Object.entries(navigationData.base_modules)) {
      const moduleId = await createEntity({
        entity_type: 'navigation_module',
        entity_name: moduleConfig.name,
        entity_code: moduleCode,
        smart_code: `HERA.PLATFORM.NAV.MODULE.${moduleCode}.v1`
      })
      
      if (moduleId) {
        moduleCount++
        await createDynamicField(moduleId, 'route', moduleConfig.route, 'text')
        await createDynamicField(moduleId, 'icon', moduleConfig.icon, 'text')
        await createDynamicField(moduleId, 'color', moduleConfig.color, 'text')
        await createDynamicField(moduleId, 'smart_code_prefix', moduleConfig.smart_code_prefix, 'text')
        await createDynamicField(moduleId, 'module_type', 'base', 'text')
        
        // Create areas for this module
        for (const areaConfig of moduleConfig.areas) {
          const areaId = await createEntity({
            entity_type: 'navigation_area',
            entity_name: areaConfig.name,
            entity_code: areaConfig.code,
            smart_code: `HERA.PLATFORM.NAV.AREA.${moduleCode}.${areaConfig.code}.v1`
          })
          
          if (areaId) {
            await createDynamicField(areaId, 'route', areaConfig.route, 'text')
            await createDynamicField(areaId, 'icon', areaConfig.icon, 'text')
            await createDynamicField(areaId, 'module_code', moduleCode, 'text')
            await createRelationship(moduleId, areaId, 'CONTAINS_AREA')
            
            // Create operations for this area
            for (const operationConfig of areaConfig.operations) {
              const operationId = await createEntity({
                entity_type: 'navigation_operation',
                entity_name: operationConfig.name,
                entity_code: operationConfig.code,
                smart_code: `HERA.PLATFORM.NAV.OPERATION.${moduleCode}.${areaConfig.code}.${operationConfig.code}.v1`
              })
              
              if (operationId) {
                await createDynamicField(operationId, 'route', operationConfig.route, 'text')
                await createDynamicField(operationId, 'permissions', operationConfig.permissions, 'json')
                await createDynamicField(operationId, 'module_code', moduleCode, 'text')
                await createDynamicField(operationId, 'area_code', areaConfig.code, 'text')
                await createRelationship(areaId, operationId, 'CONTAINS_OPERATION')
              }
            }
          }
        }
      }
    }
    
    console.log('\n🏭 Creating industry modules...')
    let industryCount = 0
    
    // Create industries
    for (const [industryCode, industryConfig] of Object.entries(navigationData.industries)) {
      const industryId = await createEntity({
        entity_type: 'navigation_industry',
        entity_name: industryConfig.name,
        entity_code: industryCode,
        smart_code: `HERA.PLATFORM.NAV.INDUSTRY.${industryCode}.v1`
      })
      
      if (industryId) {
        industryCount++
        await createDynamicField(industryId, 'route_prefix', industryConfig.route_prefix, 'text')
        await createDynamicField(industryId, 'theme', industryConfig.theme, 'json')
        
        // Create specialized modules for this industry
        for (const [moduleCode, moduleConfig] of Object.entries(industryConfig.specialized_modules)) {
          const moduleId = await createEntity({
            entity_type: 'navigation_module',
            entity_name: moduleConfig.name,
            entity_code: moduleCode,
            smart_code: `HERA.PLATFORM.NAV.INDUSTRY.MODULE.${industryCode}.${moduleCode}.v1`
          })
          
          if (moduleId) {
            await createDynamicField(moduleId, 'route', moduleConfig.route, 'text')
            await createDynamicField(moduleId, 'icon', moduleConfig.icon, 'text')
            await createDynamicField(moduleId, 'color', moduleConfig.color, 'text')
            await createDynamicField(moduleId, 'module_type', 'industry_specialized', 'text')
            await createDynamicField(moduleId, 'industry_code', industryCode, 'text')
            await createRelationship(industryId, moduleId, 'CONTAINS_MODULE')
            
            // Create areas and operations (similar to base modules)
            for (const areaConfig of moduleConfig.areas) {
              const areaId = await createEntity({
                entity_type: 'navigation_area',
                entity_name: areaConfig.name,
                entity_code: areaConfig.code,
                smart_code: `HERA.PLATFORM.NAV.AREA.${industryCode}.${moduleCode}.${areaConfig.code}.v1`
              })
              
              if (areaId) {
                await createDynamicField(areaId, 'route', areaConfig.route, 'text')
                await createDynamicField(areaId, 'icon', areaConfig.icon, 'text')
                await createDynamicField(areaId, 'module_code', `${industryCode}_${moduleCode}`, 'text')
                await createRelationship(moduleId, areaId, 'CONTAINS_AREA')
                
                for (const operationConfig of areaConfig.operations) {
                  const operationId = await createEntity({
                    entity_type: 'navigation_operation',
                    entity_name: operationConfig.name,
                    entity_code: operationConfig.code,
                    smart_code: `HERA.PLATFORM.NAV.OPERATION.${industryCode}.${moduleCode}.${areaConfig.code}.${operationConfig.code}.v1`
                  })
                  
                  if (operationId) {
                    await createDynamicField(operationId, 'route', operationConfig.route, 'text')
                    await createDynamicField(operationId, 'permissions', operationConfig.permissions, 'json')
                    await createDynamicField(operationId, 'module_code', `${industryCode}_${moduleCode}`, 'text')
                    await createDynamicField(operationId, 'area_code', areaConfig.code, 'text')
                    await createRelationship(areaId, operationId, 'CONTAINS_OPERATION')
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log('\n🎉 DIRECT MIGRATION COMPLETED!')
    console.log(`✅ Created ${moduleCount} base modules`)
    console.log(`✅ Created ${industryCount} industries`)
    
    console.log('\n🔍 VERIFICATION QUERY:')
    console.log('Run this in Supabase SQL Editor:')
    console.log(`
SELECT entity_type, COUNT(*) as count
FROM core_entities 
WHERE entity_type LIKE 'navigation_%'
  AND organization_id = '${PLATFORM_ORGANIZATION_ID}'
GROUP BY entity_type
ORDER BY entity_type;
    `)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run migration
runDirectMigration()