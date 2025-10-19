#!/usr/bin/env node
/**
 * Test Auth Verification for Salon Users
 * Simulates what resolve_user_identity_v1 should return
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USERS = [
  'hairtalkz2022@gmail.com',
  'hairtalkz01@gmail.com',
  'hairtalkz02@gmail.com'
]

async function testAuth() {
  console.log('🧪 Testing Auth Verification for Salon Users\n')

  const { data: { users } } = await supabase.auth.admin.listUsers()

  for (const email of TEST_USERS) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📧 ${email}`)
    console.log(`${'='.repeat(60)}`)

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.log('❌ Auth user not found')
      continue
    }

    console.log(`✅ Auth user ID: ${user.id}`)

    // Check USER entity
    const { data: entity } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code, organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (entity) {
      console.log(`✅ USER entity exists:`)
      console.log(`   - Name: ${entity.entity_name}`)
      console.log(`   - Type: ${entity.entity_type}`)
      console.log(`   - Smart Code: ${entity.smart_code}`)
    } else {
      console.log(`❌ USER entity missing`)
    }

    // Check memberships
    const { data: memberships } = await supabase
      .from('core_relationships')
      .select(`
        *,
        organization:to_entity_id(id, organization_name)
      `)
      .eq('from_entity_id', user.id)
      .eq('relationship_type', 'MEMBER_OF')

    if (memberships && memberships.length > 0) {
      console.log(`✅ Memberships found: ${memberships.length}`)
      memberships.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.organization?.organization_name || 'Unknown Org'}`)
        console.log(`      - Role: ${m.relationship_data?.role || 'No role'}`)
        console.log(`      - Org ID: ${m.to_entity_id}`)
      })

      // Extract org IDs for resolve_user_identity_v1 simulation
      const orgIds = memberships.map(m => m.to_entity_id)
      console.log(`\n   🔍 Organization IDs (for API): [${orgIds.map(id => `"${id}"`).join(', ')}]`)
    } else {
      console.log(`❌ No memberships found`)
    }
  }

  console.log(`\n\n${'='.repeat(60)}`)
  console.log('🎯 EXPECTED BEHAVIOR:')
  console.log(`${'='.repeat(60)}`)
  console.log('When these users login:')
  console.log('1. Supabase auth succeeds ✅')
  console.log('2. resolve_user_identity_v1 returns organization_ids ✅')
  console.log('3. verifyAuth picks first org from allowed orgs ✅')
  console.log('4. API calls include valid organization_id ✅')
  console.log('5. Data fetching works ✅\n')
}

testAuth().catch(console.error)
