#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const orgId = process.env.DEFAULT_ORGANIZATION_ID || process.env.TEST_ORG_ID

console.log('🔍 Finding test user for organization:', orgId)

// Find a user who is a member of this organization
const { data, error } = await supabase
  .from('core_relationships')
  .select('from_entity_id')
  .eq('organization_id', orgId)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('is_active', true)
  .limit(1)

if (error) {
  console.error('❌ Error finding user:', error.message)
  process.exit(1)
}

if (data && data.length > 0) {
  console.log('✅ Found test user:', data[0].from_entity_id)
  console.log('\nAdd to your .env file:')
  console.log(`TEST_USER_ID=${data[0].from_entity_id}`)
  process.exit(0)
} else {
  console.log('❌ No active user found for this organization')
  process.exit(1)
}
