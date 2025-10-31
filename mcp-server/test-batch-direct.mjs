#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const TEST_ENTITY_ID = '4c83e404-f3ca-40dd-afa3-13df15b5e166' // From previous test

async function testBatchDirect() {
  console.log('Testing hera_dynamic_data_batch_v1 directly...')

  const items = [
    {
      field_name: 'price_market',
      field_type: 'number',
      field_value_number: 150,
      field_value_text: null,
      field_value_boolean: null,
      field_value_date: null,
      field_value_json: null,
      smart_code: 'HERA.SALON.SERVICE.DYN.PRICE.MARKET.v1'
    },
    {
      field_name: 'duration_min',
      field_type: 'number',
      field_value_number: 45,
      field_value_text: null,
      field_value_boolean: null,
      field_value_date: null,
      field_value_json: null,
      smart_code: 'HERA.SALON.SERVICE.DYN.DURATION.MIN.v1'
    },
    {
      field_name: 'description',
      field_type: 'text',
      field_value_number: null,
      field_value_text: 'Professional haircut',
      field_value_boolean: null,
      field_value_date: null,
      field_value_json: null,
      smart_code: 'HERA.SALON.SERVICE.DYN.DESCRIPTION.v1'
    }
  ]

  console.log('\nCalling with items:', JSON.stringify(items, null, 2))

  const { data, error } = await supabase.rpc('hera_dynamic_data_batch_v1', {
    p_organization_id: TENANT_ORG_ID,
    p_entity_id: TEST_ENTITY_ID,
    p_items: items,
    p_actor_user_id: ACTOR_USER_ID
  })

  if (error) {
    console.log('\n❌ Error:', error.message)
    console.log('Error details:', error)
  } else {
    console.log('\n✅ Success:', data)

    // Now read the entity to verify
    console.log('\n\nReading entity to verify dynamic fields...')
    const readResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: ACTOR_USER_ID,
      p_organization_id: TENANT_ORG_ID,
      p_entity: { entity_id: TEST_ENTITY_ID },
      p_dynamic: {},
      p_relationships: {},
      p_options: { include_dynamic: true }
    })

    if (readResult.data?.data?.dynamic_data) {
      console.log('Dynamic fields found:', readResult.data.data.dynamic_data.length)
      readResult.data.data.dynamic_data.forEach(f => {
        console.log(`  - ${f.field_name}: ${f.field_value_number || f.field_value_text || f.field_value_boolean}`)
      })
    } else {
      console.log('No dynamic fields found')
    }
  }
}

testBatchDirect()
