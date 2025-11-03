#!/usr/bin/env node

/**
 * Check Relationships Schema Script
 * Determines the actual column names in core_relationships table
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

console.log('🔍 HERA Relationships Schema Check')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRelationshipsSchema() {
  try {
    // First, let's try to get any relationship to see the schema
    console.log('\n📊 Checking core_relationships table structure...')
    
    const { data, error } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error accessing relationships table:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('✅ Sample relationship structure:')
      const sample = data[0]
      Object.keys(sample).forEach(key => {
        console.log(`   • ${key}: ${typeof sample[key]} = ${sample[key]}`)
      })
    } else {
      console.log('📋 No relationships exist yet')
      
      // Let's check what columns exist by trying different common field names
      const commonFields = [
        'from_entity_id', 'to_entity_id',
        'source_entity_id', 'target_entity_id', 
        'parent_entity_id', 'child_entity_id',
        'entity_1_id', 'entity_2_id'
      ]
      
      console.log('\n🔍 Testing common relationship field names...')
      for (const field of commonFields) {
        try {
          const { error: testError } = await supabase
            .from('core_relationships')
            .select(field)
            .limit(1)
          
          if (!testError) {
            console.log(`✅ Field exists: ${field}`)
          }
        } catch (e) {
          // Field doesn't exist
        }
      }
    }
    
    // Let's also check our JSON to understand what relationships we need to create
    console.log('\n📄 Expected relationships from JSON structure:')
    
    const navigationPath = path.join(process.cwd(), 'src/config/hera-navigation.json')
    const navigationData = JSON.parse(fs.readFileSync(navigationPath, 'utf8'))
    
    let expectedRelationships = 0
    
    // Count base module relationships
    Object.entries(navigationData.base_modules).forEach(([moduleCode, moduleConfig]) => {
      expectedRelationships += moduleConfig.areas.length // module → area
      moduleConfig.areas.forEach(area => {
        expectedRelationships += area.operations.length // area → operation
      })
    })
    
    // Count industry relationships
    Object.entries(navigationData.industries).forEach(([industryCode, industryConfig]) => {
      const modules = Object.keys(industryConfig.specialized_modules)
      expectedRelationships += modules.length // industry → module
      
      Object.entries(industryConfig.specialized_modules).forEach(([moduleCode, moduleConfig]) => {
        expectedRelationships += moduleConfig.areas.length // module → area
        moduleConfig.areas.forEach(area => {
          expectedRelationships += area.operations.length // area → operation
        })
      })
    })
    
    console.log(`📊 Expected total relationships: ${expectedRelationships}`)
    console.log('   Types needed:')
    console.log('   • CONTAINS_MODULE (industry → module)')
    console.log('   • CONTAINS_AREA (module → area)')
    console.log('   • CONTAINS_OPERATION (area → operation)')
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

checkRelationshipsSchema()