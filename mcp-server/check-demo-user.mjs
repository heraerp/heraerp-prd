import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking demo@heraerp.com organization and app memberships\n')
console.log('='.repeat(80))

// Step 1: Get auth user by email
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

if (authError) {
  console.error('❌ Error fetching users:', authError.message)
  process.exit(1)
}

const demoUser = authUsers.users.find(u => u.email === 'demo@heraerp.com')

if (!demoUser) {
  console.log('❌ User demo@heraerp.com not found')
  process.exit(1)
}

console.log('✅ Found Auth User:')
console.log('   Email:', demoUser.email)
console.log('   Auth UID:', demoUser.id)
console.log('   User Entity ID:', demoUser.user_metadata?.hera_user_entity_id || 'NOT SET')
console.log('')

const userEntityId = demoUser.user_metadata?.hera_user_entity_id

if (!userEntityId) {
  console.log('⚠️  No user_entity_id in metadata - cannot check memberships')
  process.exit(0)
}

// Step 2: Get organization memberships
const { data: memberships, error: membershipError } = await supabase
  .from('core_relationships')
  .select(`
    id,
    organization_id,
    to_entity_id,
    relationship_type,
    is_active,
    created_at,
    relationship_data
  `)
  .eq('from_entity_id', userEntityId)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG')
  .eq('is_active', true)

if (membershipError) {
  console.error('❌ Error fetching memberships:', membershipError.message)
  process.exit(1)
}

console.log('📋 Organization Memberships (' + (memberships?.length || 0) + ' found):')
console.log('='.repeat(80))

if (!memberships || memberships.length === 0) {
  console.log('❌ No active organization memberships found')
  process.exit(0)
}

for (const membership of memberships) {
  // Get organization details
  const { data: org } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('id', membership.to_entity_id)
    .single()

  console.log('')
  console.log('Organization:', org?.entity_name || 'Unknown')
  console.log('  Org ID:', membership.to_entity_id)
  console.log('  Org Code:', org?.entity_code || 'N/A')
  console.log('  Member Since:', new Date(membership.created_at).toLocaleDateString())
  console.log('  Roles:', JSON.stringify(membership.relationship_data?.roles || []))

  // Get apps for this organization
  const { data: orgApps } = await supabase
    .from('core_relationships')
    .select(`
      id,
      to_entity_id,
      is_active,
      relationship_data
    `)
    .eq('organization_id', membership.organization_id)
    .eq('relationship_type', 'ORG_HAS_APP')
    .eq('is_active', true)

  console.log('  Apps (' + (orgApps?.length || 0) + '):')

  if (orgApps && orgApps.length > 0) {
    for (const appRel of orgApps) {
      const { data: appEntity } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_code')
        .eq('id', appRel.to_entity_id)
        .single()

      console.log('    - ' + (appEntity?.entity_name || 'Unknown') + ' (' + (appEntity?.entity_code || 'N/A') + ')')
    }
  } else {
    console.log('    ❌ No apps linked to this organization')
  }
}

console.log('')
console.log('='.repeat(80))
console.log('✅ Query complete')
