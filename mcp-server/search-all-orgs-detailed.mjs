/**
 * 🔍 SEARCH: All organizations in database with detailed info
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 SEARCHING: All Organizations in Database')
console.log('='.repeat(80))
console.log('')

async function searchAllOrgs() {
  // Get ALL entities, not just ORG type
  const { data: allEntities, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, entity_code, created_at')
    .order('entity_name')

  if (error) {
    console.log('❌ Error fetching entities:', error.message)
    return
  }

  if (!allEntities || allEntities.length === 0) {
    console.log('⚠️  No entities found')
    return
  }

  // Filter and display organizations
  const orgs = allEntities.filter(e => e.entity_type === 'ORG')

  console.log(`📋 Found ${orgs.length} Organization(s):`)
  console.log('')

  for (const org of orgs) {
    console.log(`🏢 ${org.entity_name}`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Code: ${org.entity_code || 'N/A'}`)
    console.log(`   Created: ${org.created_at}`)

    // Count members
    const { data: members, error: memberError } = await supabase
      .from('core_relationships')
      .select('source_entity_id', { count: 'exact' })
      .eq('target_entity_id', org.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('is_active', true)

    if (!memberError && members) {
      console.log(`   Members: ${members.length}`)
    }

    console.log('')
  }

  // Also search in organization name for "salon" specifically
  console.log('🔍 Searching specifically for "salon" in entity names...')
  console.log('-'.repeat(80))

  const salonEntities = allEntities.filter(e =>
    e.entity_name.toLowerCase().includes('salon')
  )

  if (salonEntities.length > 0) {
    console.log(`✅ Found ${salonEntities.length} entities with "salon" in name:`)
    salonEntities.forEach(entity => {
      console.log(`   - ${entity.entity_name} (${entity.entity_type})`)
      console.log(`     ID: ${entity.id}`)
    })
  } else {
    console.log('⚠️  No entities found with "salon" in name')
  }
  console.log('')

  // Search in organization name for "demo"
  console.log('🔍 Searching for "demo" in entity names...')
  console.log('-'.repeat(80))

  const demoEntities = allEntities.filter(e =>
    e.entity_name.toLowerCase().includes('demo')
  )

  if (demoEntities.length > 0) {
    console.log(`✅ Found ${demoEntities.length} entities with "demo" in name:`)
    demoEntities.forEach(entity => {
      console.log(`   - ${entity.entity_name} (${entity.entity_type})`)
      console.log(`     ID: ${entity.id}`)
    })
  } else {
    console.log('⚠️  No entities found with "demo" in name')
  }
  console.log('')

  // Check core_organizations table if it exists
  console.log('🔍 Checking core_organizations table...')
  console.log('-'.repeat(80))

  const { data: coreOrgs, error: coreOrgError } = await supabase
    .from('core_organizations')
    .select('*')

  if (coreOrgError) {
    console.log('⚠️  core_organizations table query failed:', coreOrgError.message)
    console.log('   (This is expected if using Sacred Six schema)')
  } else if (coreOrgs && coreOrgs.length > 0) {
    console.log(`✅ Found ${coreOrgs.length} organizations in core_organizations:`)
    coreOrgs.forEach(org => {
      console.log(`   - ${org.name || org.organization_name || org.id}`)
      console.log(`     ID: ${org.id}`)
    })
  } else {
    console.log('⚠️  No organizations found in core_organizations table')
  }
  console.log('')
}

searchAllOrgs().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
