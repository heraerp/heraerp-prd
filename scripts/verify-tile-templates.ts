#!/usr/bin/env tsx

/**
 * HERA Universal Tile System - Verify Seeded Templates
 * Checks that all 5 core templates are properly created with dynamic data
 * Smart Code: HERA.PLATFORM.SCRIPT.VERIFY.TILE_TEMPLATES.v1
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Constants
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Verify seeded tile templates
 */
async function verifyTemplates(): Promise<void> {
  console.log('🔍 HERA Universal Tile System - Template Verification')
  console.log('=' .repeat(60))
  
  try {
    // Get all tile templates
    const { data: templates, error: templatesError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_code,
        entity_name,
        smart_code,
        created_at
      `)
      .eq('entity_type', 'APP_TILE_TEMPLATE')
      .eq('organization_id', PLATFORM_ORG_ID)
      .order('entity_code')

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError)
      return
    }

    if (!templates || templates.length === 0) {
      console.error('❌ No tile templates found!')
      return
    }

    console.log(`📊 Found ${templates.length} tile templates:\n`)

    for (const template of templates) {
      console.log(`✅ ${template.entity_name}`)
      console.log(`   Code: ${template.entity_code}`)
      console.log(`   Smart Code: ${template.smart_code}`)
      console.log(`   ID: ${template.id}`)
      
      // Get dynamic data for this template
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_type, field_value_text, field_value_number, field_value_boolean, field_value_json')
        .eq('entity_id', template.id)
        .order('field_name')

      if (dynamicError) {
        console.error(`   ❌ Error fetching dynamic data: ${dynamicError.message}`)
        continue
      }

      console.log(`   Dynamic Fields: ${dynamicData?.length || 0}`)
      
      // Show key fields
      for (const field of dynamicData || []) {
        const value = field.field_value_json || field.field_value_text || field.field_value_number || field.field_value_boolean
        if (field.field_name === 'tile_type') {
          console.log(`   ├─ ${field.field_name}: ${value}`)
        } else if (field.field_name === 'operation_category') {
          console.log(`   ├─ ${field.field_name}: ${value}`)
        } else if (field.field_name === 'ui_schema') {
          const ui = value as any
          console.log(`   ├─ ${field.field_name}: ${ui?.icon} (${ui?.color})`)
        }
      }
      
      console.log('')
    }

    // Expected template codes
    const expectedTemplates = [
      'TILE_TPL_ENTITIES',
      'TILE_TPL_TRANSACTIONS', 
      'TILE_TPL_WORKFLOW',
      'TILE_TPL_RELATIONSHIPS',
      'TILE_TPL_ANALYTICS'
    ]

    const foundCodes = templates.map(t => t.entity_code)
    const missingTemplates = expectedTemplates.filter(code => !foundCodes.includes(code))
    const extraTemplates = foundCodes.filter(code => !expectedTemplates.includes(code))

    console.log('📋 Verification Summary:')
    console.log('=' .repeat(40))
    
    if (missingTemplates.length === 0 && extraTemplates.length === 0) {
      console.log('✅ All 5 core templates present and accounted for')
      
      // Check that each template has proper dynamic data
      let allValid = true
      for (const template of templates) {
        const { count } = await supabase
          .from('core_dynamic_data')
          .select('*', { count: 'exact', head: true })
          .eq('entity_id', template.id)
        
        if ((count || 0) < 6) {
          console.log(`⚠️  ${template.entity_code} has only ${count || 0} dynamic fields (expected 6+)`)
          allValid = false
        }
      }
      
      if (allValid) {
        console.log('✅ All templates have complete dynamic data')
        console.log('🎉 Phase 1.3 - Seed Templates: COMPLETED')
      } else {
        console.log('❌ Some templates missing dynamic data')
      }
      
    } else {
      console.log(`❌ Template verification failed:`)
      if (missingTemplates.length > 0) {
        console.log(`   Missing: ${missingTemplates.join(', ')}`)
      }
      if (extraTemplates.length > 0) {
        console.log(`   Extra: ${extraTemplates.join(', ')}`)
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

// Run verification
verifyTemplates().then(() => {
  console.log('\n🔍 Verification complete')
}).catch(error => {
  console.error('❌ Verification error:', error)
  process.exit(1)
})