#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Searching for all HERA dynamic data functions...\n');

async function findDynamicFunctions() {
  // List of possible function names to try
  const functionNames = [
    'hera_dynamic_data_get_v1',
    'hera_dynamic_data_set_v1',
    'hera_dynamic_data_upsert_v1',
    'hera_dynamic_data_create_v1',
    'hera_dynamic_data_update_v1',
    'hera_dynamic_data_delete_v1',
    'hera_entity_upsert_v1',
    'hera_entities_crud_v2',
    'hera_transactions_crud_v2'
  ];

  console.log('📋 Testing known HERA functions...\n');

  for (const funcName of functionNames) {
    const { data, error } = await supabase.rpc(funcName, {});

    if (error) {
      // Extract actual parameter names from error
      const message = error.message;
      if (message.includes('Could not find the function') && !message.includes('does not exist')) {
        // Function exists but wrong parameters
        const match = message.match(/public\.\w+\((.*?)\)/);
        if (match) {
          console.log(`✅ ${funcName} EXISTS`);
          console.log(`   Error indicates function signature includes: ${match[1] || 'parameters not shown'}`);
        } else {
          console.log(`✅ ${funcName} EXISTS (could not parse signature)`);
        }
        console.log(`   Full message: ${message}`);
      } else if (message.includes('function') && message.includes('does not exist')) {
        console.log(`❌ ${funcName} does not exist`);
      } else {
        console.log(`⚠️  ${funcName} - Unexpected error: ${message}`);
      }
    } else {
      console.log(`✅ ${funcName} EXISTS and accepted empty params`);
      console.log(`   Result:`, data);
    }
    console.log('');
  }

  // Try the hint from the error: hera_dynamic_data_get_v1
  console.log('\n' + '='.repeat(80));
  console.log('🎯 Testing hera_dynamic_data_get_v1 (suggested by error hint)...');
  console.log('='.repeat(80));

  const tests = [
    { p_organization_id: '00000000-0000-0000-0000-000000000000' },
    { p_organization_id: '00000000-0000-0000-0000-000000000000', p_entity_id: '00000000-0000-0000-0000-000000000000' },
    { p_organization_id: '00000000-0000-0000-0000-000000000000', p_entity_id: '00000000-0000-0000-0000-000000000000', p_field_name: 'test' }
  ];

  for (const params of tests) {
    const { data, error } = await supabase.rpc('hera_dynamic_data_get_v1', params);
    console.log(`\nTest: ${JSON.stringify(params)}`);
    if (error) {
      console.log(`  Error: ${error.message}`);
    } else {
      console.log(`  Success:`, data);
    }
  }

  // Try entities CRUD to understand the pattern
  console.log('\n' + '='.repeat(80));
  console.log('🎯 Testing hera_entities_crud_v2 for dynamic data pattern...');
  console.log('='.repeat(80));

  const { data: crudResult, error: crudError } = await supabase.rpc('hera_entities_crud_v2', {
    p_action: 'READ',
    p_actor_user_id: '00000000-0000-0000-0000-000000000000',
    p_organization_id: '00000000-0000-0000-0000-000000000000',
    p_entity: {},
    p_dynamic: {},
    p_relationships: [],
    p_options: { limit: 1 }
  });

  if (crudError) {
    console.log('Error:', crudError.message);
  } else {
    console.log('Success - This function handles dynamic data!');
    console.log('Result structure:', JSON.stringify(crudResult, null, 2));
  }
}

findDynamicFunctions();
