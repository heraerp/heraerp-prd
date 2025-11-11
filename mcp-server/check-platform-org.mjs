#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Finding Platform Organization...\n')

// Platform org has special UUID: all zeros
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

console.log('Checking for platform organization:', PLATFORM_ORG_ID)

const { data, error } = await supabase
  .from('core_entities')
  .select('*')
  .eq('entity_type', 'ORG')
  .eq('id', PLATFORM_ORG_ID)
  .single()

if (error) {
  console.error('❌ Platform org not found:', error.message)
  console.log('\nSearching for all ORG entities...')
  
  const { data: allOrgs } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, organization_id')
    .eq('entity_type', 'ORG')
    .limit(10)
  
  console.log('\nFound organizations:')
  allOrgs?.forEach(org => {
    console.log(`  - ${org.entity_name} (${org.entity_code})`)
    console.log(`    ID: ${org.id}`)
    console.log(`    Org Context: ${org.organization_id}`)
  })
} else {
  console.log('✅ Platform organization found:')
  console.log(`   Name: ${data.entity_name}`)
  console.log(`   Code: ${data.entity_code}`)
  console.log(`   ID: ${data.id}`)
  console.log(`\n✅ Use this for microapp catalog operations:`)
  console.log(`   Organization ID: ${PLATFORM_ORG_ID}`)
}
