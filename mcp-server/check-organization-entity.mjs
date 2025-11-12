#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function checkOrganization() {
  console.log('🔍 Checking organization entity in core_entities...\n')

  // Check core_entities table
  const { data: entityData, error: entityError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', ORG_ID)
    .eq('entity_type', 'ORGANIZATION')
    .single()

  console.log('📋 core_entities result:')
  if (entityError) {
    console.log('   ❌ Error:', entityError.message)
  } else if (!entityData) {
    console.log('   ⚠️ No organization entity found with entity_type = ORGANIZATION')
  } else {
    console.log('   ✅ Found organization entity:', {
      id: entityData.id,
      entity_type: entityData.entity_type,
      entity_name: entityData.entity_name,
      smart_code: entityData.smart_code
    })
  }

  console.log('\n🔍 Checking core_organizations table...\n')

  // Check core_organizations table
  const { data: orgData, error: orgError } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', ORG_ID)
    .single()

  console.log('📋 core_organizations result:')
  if (orgError) {
    console.log('   ❌ Error:', orgError.message)
  } else if (!orgData) {
    console.log('   ⚠️ No organization found')
  } else {
    console.log('   ✅ Found organization:', {
      id: orgData.id,
      organization_name: orgData.organization_name,
      metadata: orgData.metadata
    })
  }

  console.log('\n🔍 Checking for ANY organization entities...\n')

  // Check if there are ANY ORGANIZATION entities
  const { data: allOrgs, error: allOrgsError } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, smart_code')
    .eq('entity_type', 'ORGANIZATION')
    .limit(5)

  console.log('📋 All ORGANIZATION entities:')
  if (allOrgsError) {
    console.log('   ❌ Error:', allOrgsError.message)
  } else if (!allOrgs || allOrgs.length === 0) {
    console.log('   ⚠️ No ORGANIZATION entities found in core_entities table')
    console.log('   💡 This means organizations are stored in core_organizations table, not as entities')
  } else {
    console.log('   ✅ Found', allOrgs.length, 'ORGANIZATION entities:')
    allOrgs.forEach(org => {
      console.log('     -', org.entity_name, '(', org.id, ')')
    })
  }
}

checkOrganization().catch(console.error)
