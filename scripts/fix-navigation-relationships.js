#!/usr/bin/env node

/**
 * Fix Navigation Relationships Script
 * Creates missing hierarchical relationships between navigation entities
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const HERA_PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001'

console.log('🔧 HERA Navigation Relationships Fix')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Create relationship between entities
 */
async function createRelationship(sourceId, targetId, relationshipType) {
  console.log(`🔗 Creating relationship: ${relationshipType}`)
  
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
 * Get dynamic field value for an entity
 */
async function getDynamicFieldValue(entityId, fieldName) {
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('field_value_text')
    .eq('entity_id', entityId)
    .eq('field_name', fieldName)
    .single()
  
  if (error || !data) return null
  return data.field_value_text
}

/**
 * Main function to create relationships
 */
async function fixNavigationRelationships() {
  try {
    console.log('\n🔍 Loading navigation entities...')
    
    // Get all navigation entities
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
    
    // Group entities by type
    const modules = entities.filter(e => e.entity_type === 'navigation_module')
    const areas = entities.filter(e => e.entity_type === 'navigation_area')
    const operations = entities.filter(e => e.entity_type === 'navigation_operation')
    const industries = entities.filter(e => e.entity_type === 'navigation_industry')
    
    console.log(`📊 Found: ${modules.length} modules, ${areas.length} areas, ${operations.length} operations, ${industries.length} industries`)
    
    let relationshipsCreated = 0
    
    // Create relationships between modules and areas
    console.log('\n🔗 Creating module → area relationships...')
    for (const area of areas) {
      const moduleCode = await getDynamicFieldValue(area.id, 'module_code')
      if (moduleCode) {
        // Find the matching module
        const module = modules.find(m => m.entity_code === moduleCode || m.entity_code === moduleCode.split('_')[0])
        if (module) {
          const success = await createRelationship(module.id, area.id, 'CONTAINS_AREA')
          if (success) relationshipsCreated++
        } else {
          console.log(`⚠️  No module found for area ${area.entity_code} with module_code: ${moduleCode}`)
        }
      }
    }
    
    // Create relationships between areas and operations
    console.log('\n🔗 Creating area → operation relationships...')
    for (const operation of operations) {
      const areaCode = await getDynamicFieldValue(operation.id, 'area_code')
      if (areaCode) {
        // Find the matching area
        const area = areas.find(a => a.entity_code === areaCode)
        if (area) {
          const success = await createRelationship(area.id, operation.id, 'CONTAINS_OPERATION')
          if (success) relationshipsCreated++
        } else {
          console.log(`⚠️  No area found for operation ${operation.entity_code} with area_code: ${areaCode}`)
        }
      }
    }
    
    // Create relationships between industries and their specialized modules
    console.log('\n🔗 Creating industry → module relationships...')
    for (const module of modules) {
      const industryCode = await getDynamicFieldValue(module.id, 'industry_code')
      if (industryCode) {
        const industry = industries.find(i => i.entity_code === industryCode)
        if (industry) {
          const success = await createRelationship(industry.id, module.id, 'CONTAINS_MODULE')
          if (success) relationshipsCreated++
        }
      }
    }
    
    console.log(`\n🎉 RELATIONSHIPS CREATED: ${relationshipsCreated}`)
    
    // Verify relationships were created
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
      
      console.log('✅ Relationship counts:')
      Object.entries(grouped).forEach(([type, count]) => {
        console.log(`   • ${type}: ${count}`)
      })
    }
    
    console.log('\n📊 Run verification query:')
    console.log(`
SELECT relationship_type, COUNT(*) as count
FROM core_relationships
WHERE relationship_type IN ('CONTAINS_MODULE', 'CONTAINS_AREA', 'CONTAINS_OPERATION')
  AND organization_id = '${PLATFORM_ORGANIZATION_ID}'
GROUP BY relationship_type;
    `)
    
  } catch (error) {
    console.error('❌ Failed to fix relationships:', error)
  }
}

fixNavigationRelationships()