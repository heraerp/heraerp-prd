import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testServices() {
  console.log('Testing services for Hairtalkz org')
  console.log('Org ID:', ORG_ID)
  console.log('')

  const result = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'SERVICE')
    .limit(10)

  if (result.error) {
    console.log('Error:', result.error.message)
  } else {
    console.log('Success! Found services:', result.data.length)
    result.data.forEach(s => console.log(' -', s.entity_name, s.id))
  }
}

testServices()
