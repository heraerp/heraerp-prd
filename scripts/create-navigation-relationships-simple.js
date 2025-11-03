#!/usr/bin/env node

/**
 * Create Navigation Relationships - Simple Version
 * Creates relationships based on JSON structure and entity codes
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const HERA_PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001'

console.log('🔧 HERA Navigation Relationships - Simple Creation')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Create relationship between entities
 */
async function createRelationship(sourceId, targetId, relationshipType, description = '') {
  console.log(`🔗 Creating relationship: ${relationshipType} ${description}`)
  
  const relationship = {
    id: uuidv4(),
    from_entity_id: sourceId,
    to_entity_id: targetId,
    relationship_type: relationshipType,
    relationship_direction: 'forward',
    relationship_strength: 1,
    organization_id: PLATFORM_ORGANIZATION_ID,
    smart_code: `HERA.PLATFORM.NAV.REL.${relationshipType}.v1`,
    smart_code_status: 'ACTIVE',
    ai_confidence: 1,
    is_active: true,
    effective_date: new Date().toISOString(),
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    relationship_data: {},
    ai_classification: null,
    ai_insights: {},
    business_logic: {},
    validation_rules: {}
  }
  
  const { error } = await supabase
    .from('core_relationships')
    .insert(relationship)
  
  if (error) {
    console.error(`❌ Error creating relationship:`, error)
    return false
  }
  
  return true
}

/**
 * Main function to create relationships based on JSON structure
 */
async function createNavigationRelationships() {
  try {
    console.log('\n🔍 Loading entities and JSON structure...')
    
    // Load all navigation entities
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_code, entity_name')
      .like('entity_type', 'navigation_%')
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      .order('entity_type, entity_code')
    
    if (error) {
      console.error('❌ Error loading entities:', error)
      return
    }
    
    // Group entities by type and create lookup maps
    const modules = {}
    const areas = {}
    const operations = {}
    const industries = {}
    
    entities.forEach(entity => {
      switch (entity.entity_type) {
        case 'navigation_module':
          modules[entity.entity_code] = entity
          break
        case 'navigation_area':
          areas[entity.entity_code] = entity
          break
        case 'navigation_operation':
          operations[entity.entity_code] = entity
          break
        case 'navigation_industry':
          industries[entity.entity_code] = entity
          break
      }
    })
    
    console.log(`📊 Loaded: ${Object.keys(modules).length} modules, ${Object.keys(areas).length} areas, ${Object.keys(operations).length} operations, ${Object.keys(industries).length} industries`)
    
    // Load JSON structure
    const navigationPath = path.join(process.cwd(), 'src/config/hera-navigation.json')
    const navigationData = JSON.parse(fs.readFileSync(navigationPath, 'utf8'))
    
    let relationshipsCreated = 0
    
    console.log('\n🔗 Creating base module relationships...')
    
    // Create base module relationships
    for (const [moduleCode, moduleConfig] of Object.entries(navigationData.base_modules)) {
      const module = modules[moduleCode]
      if (!module) {
        console.log(`⚠️  Module ${moduleCode} not found`)
        continue
      }
      
      // Create module → area relationships
      for (const areaConfig of moduleConfig.areas) {
        const area = areas[areaConfig.code]
        if (area) {
          const success = await createRelationship(
            module.id, 
            area.id, 
            'CONTAINS_AREA',
            `${moduleCode} → ${areaConfig.code}`
          )
          if (success) relationshipsCreated++
        } else {
          console.log(`⚠️  Area ${areaConfig.code} not found for module ${moduleCode}`)
        }
        
        // Create area → operation relationships
        for (const operationConfig of areaConfig.operations) {
          const operation = operations[operationConfig.code]
          if (operation && area) {
            const success = await createRelationship(
              area.id,
              operation.id,
              'CONTAINS_OPERATION',
              `${areaConfig.code} → ${operationConfig.code}`
            )
            if (success) relationshipsCreated++
          } else if (!operation) {
            console.log(`⚠️  Operation ${operationConfig.code} not found for area ${areaConfig.code}`)
          }
        }
      }
    }
    
    console.log('\n🔗 Creating industry relationships...')
    
    // Create industry relationships
    for (const [industryCode, industryConfig] of Object.entries(navigationData.industries)) {
      const industry = industries[industryCode]
      if (!industry) {
        console.log(`⚠️  Industry ${industryCode} not found`)
        continue
      }
      
      // Create industry → specialized module relationships
      for (const [moduleCode, moduleConfig] of Object.entries(industryConfig.specialized_modules)) {
        const module = modules[moduleCode]
        if (module) {
          const success = await createRelationship(
            industry.id,
            module.id,
            'CONTAINS_MODULE',
            `${industryCode} → ${moduleCode}`
          )
          if (success) relationshipsCreated++
        } else {
          console.log(`⚠️  Industry module ${moduleCode} not found for industry ${industryCode}`)
        }
        
        // Create module → area relationships for industry modules
        for (const areaConfig of moduleConfig.areas) {
          const area = areas[areaConfig.code]
          if (area && module) {
            const success = await createRelationship(
              module.id,
              area.id,
              'CONTAINS_AREA',
              `${industryCode}.${moduleCode} → ${areaConfig.code}`
            )
            if (success) relationshipsCreated++
          }
          
          // Create area → operation relationships for industry modules
          for (const operationConfig of areaConfig.operations) {
            const operation = operations[operationConfig.code]
            if (operation && area) {
              const success = await createRelationship(
                area.id,
                operation.id,
                'CONTAINS_OPERATION',
                `${industryCode}.${areaConfig.code} → ${operationConfig.code}`
              )
              if (success) relationshipsCreated++
            }
          }
        }
      }
    }
    
    console.log(`\n🎉 RELATIONSHIPS CREATED: ${relationshipsCreated}`)
    
    // Verify relationships
    console.log('\n🔍 Verifying relationships...')
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('relationship_type')
      .in('relationship_type', ['CONTAINS_MODULE', 'CONTAINS_AREA', 'CONTAINS_OPERATION'])
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    
    if (relError) {
      console.error('❌ Error verifying relationships:', relError)
    } else {
      const grouped = relationships.reduce((acc, rel) => {
        acc[rel.relationship_type] = (acc[rel.relationship_type] || 0) + 1
        return acc
      }, {})
      
      console.log('✅ Final relationship counts:')
      Object.entries(grouped).forEach(([type, count]) => {
        console.log(`   • ${type}: ${count}`)
      })
      
      const totalExpected = 94 // From previous calculation
      const totalActual = relationships.length
      console.log(`📊 Total: ${totalActual}/${totalExpected} relationships created`)
      
      if (totalActual > 0) {
        console.log('\n✅ SUCCESS! Navigation relationships have been created.')
        console.log('🔍 Verify with this query:')
        console.log(`
SELECT relationship_type, COUNT(*) as count
FROM core_relationships
WHERE relationship_type IN ('CONTAINS_MODULE', 'CONTAINS_AREA', 'CONTAINS_OPERATION')
  AND organization_id = '${PLATFORM_ORGANIZATION_ID}'
GROUP BY relationship_type;
        `)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create relationships:', error)
  }
}

createNavigationRelationships()