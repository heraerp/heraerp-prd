import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

console.log('🔍 Checking organization dynamic data...\n')

// Query core_dynamic_data directly
const { data, error } = await supabase
  .from('core_dynamic_data')
  .select('*')
  .eq('entity_id', ORG_ID)
  .in('field_name', ['organization_name', 'legal_name', 'phone', 'email', 'address', 'trn', 'currency'])
  .order('field_name')

if (error) {
  console.error('❌ Error:', error)
} else {
  console.log(`✅ Found ${data.length} dynamic fields:\n`)
  data.forEach(field => {
    console.log(`📌 ${field.field_name}:`)
    console.log(`   Type: ${field.field_type}`)
    console.log(`   Value: ${field.field_value_text}`)
    console.log(`   Smart Code: ${field.smart_code}`)
    console.log(`   Updated: ${field.updated_at}`)
    console.log(`   Updated By: ${field.updated_by}`)
    console.log('')
  })
}
