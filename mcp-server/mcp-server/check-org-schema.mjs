import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking Organizations Schema\n')

// Check for organizations
const { data: orgs, error } = await supabase
  .from('core_organizations')
  .select('*')
  .limit(5)

if (error) {
  console.error('❌ Error:', error)
} else {
  console.log(`✅ Found ${orgs.length} organizations`)
  console.log('\n📋 Organization Structure (first org):')
  if (orgs.length > 0) {
    console.log(JSON.stringify(orgs[0], null, 2))
  }
}

process.exit(0)
