import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findSalon() {
  console.log('🔍 Searching for salon organizations...\n')

  const { data, error } = await supabase
    .from('core_organizations')
    .select('id, organization_name, organization_code, organization_type')
    .limit(20)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log('📋 All organizations in database:')
  data.forEach(org => {
    console.log(`  - ${org.organization_name} (${org.organization_type}) - ID: ${org.id}`)
  })
}

findSalon()
