#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking for hera_dynamic_data_batch_v1 function...\n');

async function checkDynamicBatchFunction() {
  try {
    // 1. Try calling the function with minimal parameters to see error message
    console.log('📋 Step 1: Testing function call to determine signature...');
    const { data: testResult, error: testError } = await supabase.rpc('hera_dynamic_data_batch_v1', {
      p_organization_id: '00000000-0000-0000-0000-000000000000'
    });

    if (testError) {
      console.log('❌ Function call error (expected - helps identify signature):');
      console.log('   Message:', testError.message);
      console.log('   Details:', testError.details);
      console.log('   Hint:', testError.hint);
      console.log('\n');

      // Parse the error to extract function signature
      if (testError.message.includes('function')) {
        console.log('📝 Function signature from error message:');
        const signatureMatch = testError.message.match(/hera_dynamic_data_batch_v1\((.*?)\)/);
        if (signatureMatch) {
          console.log('   Parameters:', signatureMatch[1]);
        }
      }
    } else {
      console.log('✅ Function exists and returned:', testResult);
    }

    // 2. Search for similar batch functions
    console.log('\n📋 Step 2: Searching for alternative batch functions...');
    const alternativeFunctions = [
      'hera_dynamic_data_batch',
      'hera_dynamic_batch_v1',
      'hera_batch_dynamic_data_v1',
      'create_dynamic_data_batch',
      'upsert_dynamic_data_batch'
    ];

    for (const funcName of alternativeFunctions) {
      const { data, error } = await supabase.rpc(funcName, {
        p_organization_id: '00000000-0000-0000-0000-000000000000'
      });

      if (!error || (error && !error.message.includes('does not exist'))) {
        console.log(`✅ Found alternative: ${funcName}`);
        if (error) {
          console.log('   Error:', error.message);
        } else {
          console.log('   Success:', data);
        }
      }
    }

    // 3. Try the most likely signature based on HERA patterns
    console.log('\n📋 Step 3: Testing most likely function signature...');
    const { data: signatureTest, error: signatureError } = await supabase.rpc('hera_dynamic_data_batch_v1', {
      p_organization_id: '00000000-0000-0000-0000-000000000000',
      p_entity_id: '00000000-0000-0000-0000-000000000000',
      p_fields: []
    });

    if (signatureError) {
      console.log('❌ Signature test error:', signatureError.message);
    } else {
      console.log('✅ Function signature confirmed!');
      console.log('   Parameters: p_organization_id, p_entity_id, p_fields');
      console.log('   Result:', signatureTest);
    }

    // 4. Test with actor parameter
    console.log('\n📋 Step 4: Testing with actor parameter...');
    const { data: actorTest, error: actorError } = await supabase.rpc('hera_dynamic_data_batch_v1', {
      p_actor_user_id: '00000000-0000-0000-0000-000000000000',
      p_organization_id: '00000000-0000-0000-0000-000000000000',
      p_entity_id: '00000000-0000-0000-0000-000000000000',
      p_fields: []
    });

    if (actorError) {
      console.log('❌ Actor test error:', actorError.message);
    } else {
      console.log('✅ Function signature with actor confirmed!');
      console.log('   Parameters: p_actor_user_id, p_organization_id, p_entity_id, p_fields');
      console.log('   Result:', actorTest);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 SUMMARY');
  console.log('='.repeat(80));
  console.log('Based on HERA patterns from CLAUDE.md, the expected signature is:');
  console.log('');
  console.log('hera_dynamic_data_batch_v1(');
  console.log('  p_organization_id uuid,');
  console.log('  p_entity_id uuid,');
  console.log('  p_fields jsonb[]  -- Array of field objects');
  console.log(')');
  console.log('');
  console.log('Field object structure:');
  console.log('{');
  console.log('  field_name: string,');
  console.log('  field_type: "text" | "number" | "boolean" | "date" | "json",');
  console.log('  field_value_text?: string,');
  console.log('  field_value_number?: number,');
  console.log('  field_value_boolean?: boolean,');
  console.log('  field_value_date?: string,');
  console.log('  field_value_json?: object,');
  console.log('  smart_code?: string  -- HERA DNA pattern');
  console.log('}');
  console.log('='.repeat(80));
}

checkDynamicBatchFunction();
