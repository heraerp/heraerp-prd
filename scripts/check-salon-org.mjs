#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function checkOrg() {
  // Check specific org
  const { data, error } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', ORG_ID)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ Organization not found:', ORG_ID)
    console.log('\nSearching for Hair/Salon organizations...')

    const { data: salonOrgs } = await supabase
      .from('core_organizations')
      .select('*')
      .or('organization_name.ilike.%hair%,organization_name.ilike.%salon%')

    if (salonOrgs && salonOrgs.length > 0) {
      console.log('\nFound:', JSON.stringify(salonOrgs, null, 2))
    } else {
      console.log('\nNo Hair/Salon organizations found. Listing all organizations:')
      const { data: allOrgs } = await supabase
        .from('core_organizations')
        .select('id, organization_name, organization_code')
      console.log(JSON.stringify(allOrgs, null, 2))
    }
  } else {
    console.log('✅ Organization found:')
    console.log(JSON.stringify(data, null, 2))
  }
}

checkOrg().catch(console.error)
