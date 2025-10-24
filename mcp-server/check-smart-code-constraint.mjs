#!/usr/bin/env node
/**
 * Check the smart_code constraint on core_entities table
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraint() {
  console.log('🔍 Investigating smart_code constraint...\n');

  // Try to query the constraint definition
  console.log('Attempting to query pg_constraint...\n');

  try {
    // Query to get constraint definition
    const { data, error } = await supabase.rpc('pg_get_constraintdef', {
      constraint_oid: '(SELECT oid FROM pg_constraint WHERE conname = \'core_entities_smart_code_ck\')'
    });

    if (error) {
      console.log('❌ Cannot query constraint directly:', error.message);
    } else {
      console.log('✅ Constraint definition:', data);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Try to test different smart_code formats
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('Testing smart_code formats by attempting inserts...\n');

  const testSmartCodes = [
    'HERA.PLATFORM.USER.ENTITY.V1',
    'HERA.PLATFORM.USER.ENTITY.v1',
    'hera.platform.user.entity.V1',
    'HERA.SALON.USER.ENTITY.V1',
    'USER.ENTITY.V1',
    'HERA.PLATFORM.USER.V1',
  ];

  for (const smartCode of testSmartCodes) {
    console.log(`\nTesting: "${smartCode}"`);

    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: '00000000-0000-0000-0000-000000000000',
        entity_type: 'USER',
        entity_name: 'Test User - ' + Date.now(),
        entity_code: 'TEST_' + Date.now(),
        smart_code: smartCode,
        status: 'active',
        created_by: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a',
        updated_by: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'
      })
      .select();

    if (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      if (error.details) {
        console.log(`   Details: ${error.details}`);
      }
      if (error.hint) {
        console.log(`   Hint: ${error.hint}`);
      }
    } else {
      console.log(`   ✅ SUCCESS! This format works.`);
      console.log(`   Created entity ID: ${data[0].id}`);

      // Clean up - delete the test entity
      await supabase
        .from('core_entities')
        .delete()
        .eq('id', data[0].id);
      console.log(`   🧹 Cleaned up test entity`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('Checking existing smart_codes in core_entities...\n');

  const { data: existingCodes, error: queryError } = await supabase
    .from('core_entities')
    .select('smart_code, entity_type')
    .limit(20);

  if (queryError) {
    console.log('❌ Error querying existing codes:', queryError.message);
  } else {
    console.log('✅ Sample of existing smart_codes:\n');
    const uniqueCodes = [...new Set(existingCodes.map(e => e.smart_code))];
    uniqueCodes.forEach(code => {
      console.log(`   - ${code}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

checkConstraint().catch(console.error);
