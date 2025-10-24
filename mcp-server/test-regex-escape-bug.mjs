#!/usr/bin/env node
/**
 * Verify the regex escaping bug by testing if the pattern
 * is trying to match literal backslash-dot
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const TEST_ACTOR_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🔍 Regex Escaping Bug Verification\n');
console.log('=' .repeat(60));

console.log('\nTheory: The deployed regex has FOUR backslashes (\\\\\\\\)');
console.log('This means it\'s trying to match literal backslash-dot (\\.)');
console.log('instead of just a dot (.)');
console.log('');

// Test with literal backslash-dot in smart code (absurd but proves the point)
console.log('📋 TEST: Try smart code WITH literal backslashes');
console.log('-'.repeat(60));
console.log('Code: HERA\\\\.SALON\\\\.POS\\\\.SALE\\\\.TXN\\\\.v1');
console.log('');

const testResult = await supabase.rpc('hera_txn_create_v1', {
  p_header: {
    organization_id: TEST_ORG_ID,
    transaction_type: 'SALE',
    transaction_code: 'REGEX-TEST-' + Date.now(),
    smart_code: 'HERA\\.SALON\\.POS\\.SALE\\.TXN\\.v1',  // With literal backslashes
    total_amount: 100
  },
  p_lines: [],
  p_actor_user_id: TEST_ACTOR_ID
});

console.log('📦 RESULT:');
if (testResult.error) {
  console.log('❌ RPC Error:', testResult.error.message);
} else if (testResult.data?.success === false) {
  console.log('❌ Still fails (as expected)');
  console.log('   Error:', testResult.data.error);
} else if (testResult.data?.success === true) {
  console.log('✅ Passes! (This would prove the backslash theory)');
} else {
  console.log('⚠️  Unexpected:', testResult.data);
}

console.log('\n');
console.log('═'.repeat(60));
console.log('CONCLUSION');
console.log('═'.repeat(60));
console.log('');
console.log('The error message shows the pattern as:');
console.log('^HERA\\\\\\\\.[A-Z0-9]{3,15}(?:\\\\\\\\.[A-Z0-9_]{2,30}){3,8}\\\\\\\\.v[0-9]+$');
console.log('');
console.log('In the Postgres function source code, this likely appears as:');
console.log('^HERA\\\\.[A-Z0-9]{3,15}(?:\\\\.[A-Z0-9_]{2,30}){3,8}\\\\.v[0-9]+$');
console.log('');
console.log('But it SHOULD be (with ~operator, no extra escaping):');
console.log('^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$');
console.log('');
console.log('The fix: In the function source, change \\\\ to \\');
console.log('');
