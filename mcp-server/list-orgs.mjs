import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('📋 Listing all organizations...\n')
console.log('='.repeat(80))

const { data: orgs, error } = await supabase
  .from('core_entities')
  .select('id, entity_name, entity_code, entity_type, status')
  .eq('entity_type', 'ORGANIZATION')
  .order('entity_name')

if (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}

console.log('Total organizations:', orgs?.length || 0)
console.log('')

for (const org of orgs || []) {
  console.log('Organization:', org.entity_name)
  console.log('  ID:', org.id)
  console.log('  Code:', org.entity_code)
  console.log('  Status:', org.status)

  // Check apps for this org
  const { data: apps } = await supabase
    .from('core_relationships')
    .select('to_entity_id, is_active')
    .eq('organization_id', org.id)
    .eq('relationship_type', 'ORG_HAS_APP')
    .eq('is_active', true)

  if (apps && apps.length > 0) {
    console.log('  Apps:')
    for (const app of apps) {
      const { data: appEntity } = await supabase
        .from('core_entities')
        .select('entity_name, entity_code')
        .eq('id', app.to_entity_id)
        .single()

      console.log('    -', appEntity?.entity_name, '(' + appEntity?.entity_code + ')')
    }
  } else {
    console.log('  Apps: ❌ None')
  }
  console.log('')
}

console.log('='.repeat(80))
