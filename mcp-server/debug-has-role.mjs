import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ENTITY_ID = '1ac56047-78c9-4c2c-93db-84dcf307ab91'
const HERA_SALON_DEMO_ORG_ID = '7f1d5200-2106-4f94-8095-8a04bc114623'

console.log('Checking HAS_ROLE relationships...')
console.log('User Entity ID:', USER_ENTITY_ID)
console.log('Org ID:', HERA_SALON_DEMO_ORG_ID)
console.log('')

// Try different queries
const { data: all } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', USER_ENTITY_ID)
  .eq('relationship_type', 'HAS_ROLE')

console.log('All HAS_ROLE for this user:', all?.length || 0)
if (all) {
  all.forEach(rel => {
    console.log(`  - ID: ${rel.id}`)
    console.log(`    org_id: ${rel.organization_id}`)
    console.log(`    to: ${rel.to_entity_id}`)
    console.log(`    data:`, rel.relationship_data)
  })
}
