#!/usr/bin/env node

/**
 * Debug Navigation Data Script
 * Checks what data exists for navigation entities
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'

console.log('🔍 HERA Navigation Data Debug')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugNavigationData() {
  try {
    // Check navigation entities
    console.log('\n📋 Navigation Entities:')
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_code, entity_name')
      .like('entity_type', 'navigation_%')
      .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      .order('entity_type, entity_code')
      .limit(10)
    
    if (error) {
      console.error('❌ Error loading entities:', error)
      return
    }
    
    entities.forEach(entity => {
      console.log(`   • ${entity.entity_type}: ${entity.entity_code} - ${entity.entity_name}`)
    })
    
    // Check dynamic data for a few entities
    console.log('\n📊 Dynamic Data Sample:')
    const sampleEntity = entities.find(e => e.entity_type === 'navigation_area')
    if (sampleEntity) {
      const { data: dynamicData, error: dynError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_json')
        .eq('entity_id', sampleEntity.id)
        .eq('organization_id', PLATFORM_ORGANIZATION_ID)
      
      if (dynError) {
        console.error('❌ Error loading dynamic data:', dynError)
      } else {
        console.log(`   Sample area: ${sampleEntity.entity_code}`)
        dynamicData.forEach(field => {
          console.log(`     - ${field.field_name}: ${field.field_value_text || JSON.stringify(field.field_value_json)}`)
        })
      }
    }
    
    // Check if core_relationships table exists and is accessible
    console.log('\n🔗 Relationships Table Check:')
    const { data: relCheck, error: relError } = await supabase
      .from('core_relationships')
      .select('count')
      .limit(1)
    
    if (relError) {
      console.error('❌ Error accessing relationships table:', relError)
    } else {
      console.log('✅ Relationships table accessible')
      
      // Check existing relationships
      const { data: existingRels, error: existingError } = await supabase
        .from('core_relationships')
        .select('relationship_type, source_entity_id, target_entity_id')
        .eq('organization_id', PLATFORM_ORGANIZATION_ID)
        .limit(5)
      
      if (existingError) {
        console.error('❌ Error loading existing relationships:', existingError)
      } else {
        console.log(`   Found ${existingRels.length} existing relationships`)
        existingRels.forEach(rel => {
          console.log(`     - ${rel.relationship_type}: ${rel.source_entity_id} → ${rel.target_entity_id}`)
        })
      }
    }
    
    // Check original JSON structure for reference
    console.log('\n📄 Checking JSON Structure:')
    
    try {
      const navigationPath = path.join(process.cwd(), 'src/config/hera-navigation.json')
      const navigationData = JSON.parse(fs.readFileSync(navigationPath, 'utf8'))
      
      console.log('   Base modules:', Object.keys(navigationData.base_modules))
      console.log('   Industries:', Object.keys(navigationData.industries))
      
      // Sample structure
      const firstModule = Object.entries(navigationData.base_modules)[0]
      if (firstModule) {
        const [moduleCode, moduleConfig] = firstModule
        console.log(`   Sample module ${moduleCode}:`)
        console.log(`     - Areas: ${moduleConfig.areas.length}`)
        if (moduleConfig.areas[0]) {
          console.log(`     - First area: ${moduleConfig.areas[0].code} (${moduleConfig.areas[0].operations.length} operations)`)
        }
      }
    } catch (error) {
      console.error('❌ Error reading JSON:', error)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugNavigationData()