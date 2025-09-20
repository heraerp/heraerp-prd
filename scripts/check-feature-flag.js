#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const HAIR_TALKZ_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function checkFeatureFlag(feature, organizationId) {
  console.log(`\nChecking feature flag: playbook_mode.${feature} for org ${organizationId}\n`)
  
  // Check for configuration entity
  const { data: configEntity, error: configError } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'configuration')
    .eq('entity_code', 'PLAYBOOK_CONFIG')
    .single()
  
  if (!configEntity || !configEntity.id) {
    console.log('❌ No configuration entity found')
    return false
  }
  
  console.log(`✅ Found config entity: ${configEntity.id}`)
  
  // Check for the feature flag
  const { data: flagData, error: flagError } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_boolean, field_value_json')
    .eq('organization_id', organizationId)
    .eq('entity_id', configEntity.id)
    .eq('field_name', `playbook_mode_${feature}`)
    .single()
  
  if (!flagData) {
    console.log(`❌ No feature flag found for playbook_mode.${feature}`)
    return false
  }
  
  console.log(`✅ Found feature flag:`)
  console.log(`   - Field: ${flagData.field_name}`)
  console.log(`   - Enabled: ${flagData.field_value_boolean}`)
  console.log(`   - Metadata:`, JSON.stringify(flagData.field_value_json, null, 2))
  
  return flagData.field_value_boolean === true
}

// Test the function
async function main() {
  const isEnabled = await checkFeatureFlag('pos_cart', HAIR_TALKZ_ORG_ID)
  console.log(`\n🎯 Result: playbook_mode.pos_cart is ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'} for Hair Talkz`)
  
  // Also check a non-existent one
  const isEnabled2 = await checkFeatureFlag('pos_lines', HAIR_TALKZ_ORG_ID)
  console.log(`\n🎯 Result: playbook_mode.pos_lines is ${isEnabled2 ? '✅ ENABLED' : '❌ DISABLED'} for Hair Talkz`)
}

main().catch(console.error)