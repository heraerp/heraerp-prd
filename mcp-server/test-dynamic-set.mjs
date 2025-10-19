#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Testing hera_dynamic_data_set_v1 function signature...\n');

async function testDynamicSet() {
  // Get a real entity ID to test with
  const { data: getResult } = await supabase.rpc('hera_dynamic_data_get_v1', {
    p_organization_id: '00000000-0000-0000-0000-000000000000'
  });

  const testEntityId = getResult?.data?.[0]?.entity_id || '00000000-0000-0000-0000-000000000000';
  console.log(`Using test entity ID: ${testEntityId}\n`);

  // Test different parameter combinations
  const tests = [
    {
      name: 'Test 1: Minimal params',
      params: {
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity_id: testEntityId
      }
    },
    {
      name: 'Test 2: With field name',
      params: {
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity_id: testEntityId,
        p_field_name: 'test_field'
      }
    },
    {
      name: 'Test 3: With field name and value',
      params: {
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity_id: testEntityId,
        p_field_name: 'test_field',
        p_field_value_text: 'test_value'
      }
    },
    {
      name: 'Test 4: With field type',
      params: {
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity_id: testEntityId,
        p_field_name: 'test_field',
        p_field_type: 'text',
        p_field_value_text: 'test_value'
      }
    },
    {
      name: 'Test 5: With smart code',
      params: {
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity_id: testEntityId,
        p_field_name: 'test_field',
        p_field_type: 'text',
        p_field_value_text: 'test_value',
        p_smart_code: 'HERA.TEST.FIELD.V1'
      }
    },
    {
      name: 'Test 6: With actor',
      params: {
        p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity_id: testEntityId,
        p_field_name: 'test_field',
        p_field_type: 'text',
        p_field_value_text: 'test_value',
        p_smart_code: 'HERA.TEST.FIELD.V1'
      }
    },
    {
      name: 'Test 7: Batch with fields array',
      params: {
        p_organization_id: '00000000-0000-0000-0000-000000000000',
        p_entity_id: testEntityId,
        p_fields: [
          {
            field_name: 'test1',
            field_type: 'text',
            field_value_text: 'value1',
            smart_code: 'HERA.TEST.FIELD1.V1'
          }
        ]
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${test.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log('Params:', JSON.stringify(test.params, null, 2));

    const { data, error } = await supabase.rpc('hera_dynamic_data_set_v1', test.params);

    if (error) {
      console.log('❌ Error:', error.message);
      if (error.details) console.log('   Details:', error.details);
      if (error.hint) console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  }

  // Now test upsert function
  console.log('\n\n' + '='.repeat(80));
  console.log('🔍 Testing hera_dynamic_data_upsert_v1...');
  console.log('='.repeat(80));

  const { data: upsertData, error: upsertError } = await supabase.rpc('hera_dynamic_data_upsert_v1', {
    p_organization_id: '00000000-0000-0000-0000-000000000000',
    p_entity_id: testEntityId,
    p_field_name: 'test_upsert',
    p_field_type: 'text',
    p_field_value_text: 'upsert_value',
    p_smart_code: 'HERA.TEST.UPSERT.V1'
  });

  if (upsertError) {
    console.log('❌ Error:', upsertError.message);
  } else {
    console.log('✅ Success!');
    console.log('   Result:', JSON.stringify(upsertData, null, 2));
  }
}

testDynamicSet();
