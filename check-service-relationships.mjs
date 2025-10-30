import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkServiceRelationships() {
  console.log('\n🔍 Checking Service-Branch Relationships...\n')

  // Get services
  const { data: services, error: servicesError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('entity_type', 'SERVICE')
    .eq('organization_id', process.env.DEFAULT_ORGANIZATION_ID)
    .limit(5)

  if (servicesError) {
    console.error('❌ Error fetching services:', servicesError)
    return
  }

  console.log(`✅ Found ${services.length} services`)

  for (const service of services) {
    console.log(`\n📋 Service: ${service.entity_name}`)

    // Check for AVAILABLE_AT relationships
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('source_entity_id', service.id)
      .eq('relationship_type', 'AVAILABLE_AT')

    if (relError) {
      console.error('  ❌ Error fetching relationships:', relError)
      continue
    }

    if (!relationships || relationships.length === 0) {
      console.log('  ⚠️  NO AVAILABLE_AT relationships found!')
      console.log('  💡 This service will NOT appear when a branch is selected')
    } else {
      console.log(`  ✅ Has ${relationships.length} AVAILABLE_AT relationship(s)`)
      for (const rel of relationships) {
        // Get branch name
        const { data: branch } = await supabase
          .from('core_entities')
          .select('entity_name')
          .eq('id', rel.target_entity_id)
          .single()

        console.log(`     → Branch: ${branch?.entity_name || rel.target_entity_id}`)
      }
    }
  }

  // Get branches
  console.log('\n🏢 Available Branches:')
  const { data: branches } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('entity_type', 'BRANCH')
    .eq('organization_id', process.env.DEFAULT_ORGANIZATION_ID)

  branches?.forEach(branch => {
    console.log(`  📍 ${branch.entity_name} (${branch.id})`)
  })

  console.log('\n💡 Solution:')
  console.log('  Services need AVAILABLE_AT relationships to branches to appear in POS')
  console.log('  Relationship: SERVICE --[AVAILABLE_AT]--> BRANCH')
}

checkServiceRelationships()
