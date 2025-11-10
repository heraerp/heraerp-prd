#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const salonDemoOrgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5'

console.log('🔍 Getting HERA Salon Demo test user...\n')

// The MEMBER_OF relationships we found
const memberIds = [
  '4d93b3f8-dfe8-430c-83ea-3128f6a520cf',
  '1ac56047-78c9-4c2c-93db-84dcf307ab91'
]

console.log('✅ Found 2 members via MEMBER_OF relationship:\n')

for (const memberId of memberIds) {
  const { data: user, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, metadata, organization_id')
    .eq('id', memberId)
    .single()

  if (user) {
    const email = user.metadata?.email || user.metadata?.user_email || 'N/A'
    console.log(`User: ${user.entity_name}`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Type: ${user.entity_type}`)
    console.log(`  Email: ${email}`)
    console.log(`  Org: ${user.organization_id}`)
    console.log()
  }
}

console.log('✅ Using first member for testing:\n')
console.log('Add to your .env file:')
console.log(`TEST_USER_ID=${memberIds[0]}`)
console.log(`TEST_ORG_ID=${salonDemoOrgId}`)
console.log()
console.log('Or export for this session:')
console.log(`export TEST_USER_ID="${memberIds[0]}"`)
console.log(`export TEST_ORG_ID="${salonDemoOrgId}"`)
