#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const orgId = process.env.DEFAULT_ORGANIZATION_ID || process.env.TEST_ORG_ID

console.log('🔍 Listing USER entities for organization:', orgId)

// Find USER entities in this organization
const { data, error } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_code, entity_type, created_at')
  .eq('organization_id', orgId)
  .eq('entity_type', 'USER')
  .limit(10)

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

if (data && data.length > 0) {
  console.log(`\n✅ Found ${data.length} USER entities:\n`)
  data.forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.entity_name}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Code: ${user.entity_code || 'N/A'}`)
    console.log(`   Created: ${user.created_at}`)
    console.log()
  })

  console.log('Use any of these IDs as TEST_USER_ID:')
  console.log(`TEST_USER_ID=${data[0].id}`)
} else {
  console.log('❌ No USER entities found for this organization')
}
