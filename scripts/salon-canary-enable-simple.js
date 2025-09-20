#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const HAIR_TALKZ_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function enableFeatureFlag() {
  console.log('🚀 Enabling playbook_mode.pos_cart for Hair Talkz...\n')
  
  // First, we need a config entity in the organization
  // Check if we have one already
  const { data: existingConfig, error: checkError } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', HAIR_TALKZ_ORG_ID)
    .eq('entity_type', 'configuration')
    .eq('entity_code', 'PLAYBOOK_CONFIG')
    .single()
  
  let configEntityId
  
  if (existingConfig && existingConfig.id) {
    configEntityId = existingConfig.id
    console.log('Found existing config entity:', configEntityId)
  } else {
    // Create a configuration entity
    const { data: newConfig, error: createError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: HAIR_TALKZ_ORG_ID,
        entity_type: 'configuration',
        entity_name: 'Playbook Mode Configuration',
        entity_code: 'PLAYBOOK_CONFIG',
        smart_code: 'HERA.GEN.SYS.CONFIG.ENT.V1'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating config entity:', createError)
      process.exit(1)
    }
    
    configEntityId = newConfig.id
    console.log('Created config entity:', configEntityId)
  }
  
  // Delete any existing flag
  const { error: deleteError } = await supabase
    .from('core_dynamic_data')
    .delete()
    .eq('organization_id', HAIR_TALKZ_ORG_ID)
    .eq('entity_id', configEntityId)
    .eq('field_name', 'playbook_mode_pos_cart')
  
  if (deleteError) {
    console.log('Warning deleting existing flag:', deleteError.message)
  }
  
  // Insert new flag
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .insert({
      organization_id: HAIR_TALKZ_ORG_ID,
      entity_id: configEntityId,
      field_name: 'playbook_mode_pos_cart',
      field_type: 'boolean',
      field_value_boolean: true,
      smart_code: 'HERA.GEN.SYS.CONFIG.DYN.V1',
      field_value_json: {
        enabled_at: new Date().toISOString(),
        enabled_by: 'canary_script',
        reason: 'Canary rollout phase 1: POS cart repricing'
      }
    })
  
  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
  
  console.log('✅ Feature flag enabled successfully!')
  
  // Verify it was created
  const { data: check, error: checkError2 } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_boolean, field_value_json')
    .eq('organization_id', HAIR_TALKZ_ORG_ID)
    .eq('entity_id', configEntityId)
    .eq('field_name', 'playbook_mode_pos_cart')
  
  if (check && check.length > 0) {
    console.log('\n📊 Verification:')
    console.log(`- Field: ${check[0].field_name}`)
    console.log(`- Enabled: ${check[0].field_value_boolean}`)
    console.log(`- Metadata:`, check[0].field_value_json)
  }
  
  console.log('\n🎯 Next steps:')
  console.log('1. Test with cart ID: 4bc5492c-a2df-4e5a-a810-2a34af043220')
  console.log('2. Monitor: http://localhost:3000/dashboards/hair-talkz-workflows')
  console.log('3. Rollback if needed: node scripts/salon-canary-rollback.js')
}

enableFeatureFlag().catch(console.error)