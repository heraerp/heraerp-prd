#!/usr/bin/env node

/**
 * Debug Dynamic Data Script
 * Checks what dynamic data exists and why relationships aren't matching
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'

console.log('🔍 HERA Dynamic Data Debug')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugDynamicData() {
  try {
    // Get sample entities from each type
    console.log('\n📋 Getting sample entities...')
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
    
    const modules = entities.filter(e => e.entity_type === 'navigation_module')
    const areas = entities.filter(e => e.entity_type === 'navigation_area')
    const operations = entities.filter(e => e.entity_type === 'navigation_operation')
    
    console.log(`📊 Found: ${modules.length} modules, ${areas.length} areas, ${operations.length} operations`)
    
    // Check dynamic data for each type
    console.log('\n🔍 Checking dynamic data for modules:')
    for (const module of modules.slice(0, 3)) {
      console.log(`\n   Module: ${module.entity_code} - ${module.entity_name}`)
      
      const { data: moduleData, error: moduleError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_json')
        .eq('entity_id', module.id)
        .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      
      if (moduleError) {
        console.error('     ❌ Error:', moduleError)
      } else if (moduleData.length === 0) {
        console.log('     📋 No dynamic data found')
      } else {
        moduleData.forEach(field => {
          console.log(`     • ${field.field_name}: ${field.field_value_text || JSON.stringify(field.field_value_json)}`)
        })
      }
    }
    
    console.log('\n🔍 Checking dynamic data for areas:')
    for (const area of areas.slice(0, 3)) {
      console.log(`\n   Area: ${area.entity_code} - ${area.entity_name}`)
      
      const { data: areaData, error: areaError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_json')
        .eq('entity_id', area.id)
        .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      
      if (areaError) {
        console.error('     ❌ Error:', areaError)
      } else if (areaData.length === 0) {
        console.log('     📋 No dynamic data found')
      } else {
        areaData.forEach(field => {
          console.log(`     • ${field.field_name}: ${field.field_value_text || JSON.stringify(field.field_value_json)}`)
        })
      }
    }
    
    console.log('\n🔍 Checking dynamic data for operations:')
    for (const operation of operations.slice(0, 3)) {
      console.log(`\n   Operation: ${operation.entity_code} - ${operation.entity_name}`)
      
      const { data: operationData, error: operationError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_json')
        .eq('entity_id', operation.id)
        .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      
      if (operationError) {
        console.error('     ❌ Error:', operationError)
      } else if (operationData.length === 0) {
        console.log('     📋 No dynamic data found')
      } else {
        operationData.forEach(field => {
          console.log(`     • ${field.field_name}: ${field.field_value_text || JSON.stringify(field.field_value_json)}`)
        })
      }
    }
    
    // Check if there are any dynamic data records at all for platform org
    console.log('\n📊 Overall dynamic data count check:')
    const { data: dynamicCount, error: countError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    
    if (countError) {
      console.error('❌ Error counting dynamic data:', countError)
    } else {
      console.log(`📋 Total dynamic data records for platform org: ${dynamicCount.length}`)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugDynamicData()