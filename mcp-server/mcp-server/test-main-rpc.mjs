import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_ID = '001a2eb9-b14c-4dda-ae8c-595fb377a982'

console.log('🧪 Testing hera_entities_crud_v1 with UPDATE action...\n')

// Exact format from our settings page
const dynamicFields = {
  organization_name: {
    type: 'text',
    value: 'Direct RPC Test Salon',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.NAME.v1'
  },
  legal_name: {
    type: 'text',
    value: 'Direct RPC Test Salon LLC',
    smart_code: 'HERA.SALON.ORGANIZATION.FIELD.LEGAL_NAME.v1'
  }
}

console.log('📤 Sending p_dynamic:', JSON.stringify(dynamicFields, null, 2))

const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: ACTOR_ID,
  p_organization_id: ORG_ID,
  p_entity: {
    entity_id: ORG_ID,
    entity_type: 'ORG'
  },
  p_dynamic: dynamicFields,
  p_relationships: {},
  p_options: {
    include_dynamic: true
  }
})

if (error) {
  console.error('\n❌ RPC Error:', error)
} else {
  console.log('\n✅ RPC Success:', data.success)
  console.log('📦 Dynamic data returned:', data.data?.dynamic_data?.length, 'fields')
}

// Check if values were saved
console.log('\n🔍 Checking saved values...')
const { data: checks } = await supabase
  .from('core_dynamic_data')
  .select('field_name, field_value_text, updated_at')
  .eq('entity_id', ORG_ID)
  .in('field_name', ['organization_name', 'legal_name'])
  .order('field_name')

checks?.forEach(field => {
  console.log(`\n📌 ${field.field_name}:`)
  console.log(`   Value: "${field.field_value_text}"`)
  console.log(`   Updated: ${field.updated_at}`)
})
