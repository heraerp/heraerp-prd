import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ENTITY_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_ID = '001a2eb9-b14c-4dda-ae8c-595fb377a982'

console.log('🧪 Testing hera_dynamic_data_batch_v1 with correct parameter name...\n')

const testFields = [
  {
    field_name: 'organization_name',
    field_type: 'text',
    field_value_text: 'Test Salon Name via Batch',
    field_value_number: null,
    field_value_boolean: null,
    field_value_date: null,
    field_value_json: null,
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
  }
]

console.log('📤 Sending test field with p_items parameter\n')

const { data, error } = await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: ORG_ID,
  p_entity_id: ENTITY_ID,
  p_items: testFields,  // ✅ Changed from p_fields to p_items
  p_actor_user_id: ACTOR_ID
})

if (error) {
  console.error('❌ Error:', error)
} else {
  console.log('✅ Batch function response:', JSON.stringify(data, null, 2))
}

// Check if it was saved
console.log('\n🔍 Checking if value was saved...')
const { data: check } = await supabase
  .from('core_dynamic_data')
  .select('field_name, field_value_text, field_type, updated_at')
  .eq('entity_id', ENTITY_ID)
  .eq('field_name', 'organization_name')
  .single()

console.log('📌 Current value in DB:')
console.log('   field_value_text:', check?.field_value_text)
console.log('   updated_at:', check?.updated_at)
