/**
 * Verify Salon Organization
 * Quick script to check if the salon org exists in the database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function verifyOrganization() {
  try {
    console.log('🔍 Verifying salon organization...')
    console.log('Org ID:', SALON_ORG_ID)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Check if organization exists
    const { data: org, error } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', SALON_ORG_ID)
      .single()

    if (error) {
      console.error('❌ Error fetching organization:', error.message)
      return false
    }

    if (!org) {
      console.log('❌ Organization not found')
      return false
    }

    console.log('✅ Organization found:')
    console.log('  Name:', org.organization_name)
    console.log('  Created:', org.created_at)
    console.log('  Status: Active')

    // Check for any entities in this org
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name')
      .eq('organization_id', SALON_ORG_ID)
      .limit(5)

    if (!entitiesError && entities) {
      console.log(`\n📊 Sample entities in org (${entities.length} shown):`)
      entities.forEach(entity => {
        console.log(`  - ${entity.entity_type}: ${entity.entity_name}`)
      })
    }

    return true

  } catch (error) {
    console.error('💥 Verification failed:', error.message)
    return false
  }
}

// Run verification
verifyOrganization().then(success => {
  if (success) {
    console.log('\n🎯 Salon organization is ready for use!')
    console.log('Safe URLs:')
    console.log('  Local: http://localhost:3000/salon/direct')
    console.log('  Local Dashboard: http://localhost:3000/salon/dashboard')
  } else {
    console.log('\n⚠️  Organization verification failed')
  }
  process.exit(success ? 0 : 1)
})