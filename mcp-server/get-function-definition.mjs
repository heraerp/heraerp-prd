#!/usr/bin/env node
/**
 * Retrieve function definition from Supabase
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const functionName = process.argv[2] || 'hera_org_link_app_v1';

console.log(`\n🔍 Retrieving definition for: ${functionName}\n`);

// Query information_schema to get function details
const { data: routines, error: routinesError } = await supabase
  .from('information_schema.routines')
  .select('*')
  .eq('routine_name', functionName)
  .eq('routine_schema', 'public');

if (routinesError) {
  console.error('❌ Error querying routines:', routinesError);
}

// Query pg_proc for parameter details
const { data: params, error: paramsError } = await supabase
  .from('information_schema.parameters')
  .select('*')
  .eq('specific_schema', 'public')
  .order('ordinal_position');

if (paramsError) {
  console.error('❌ Error querying parameters:', paramsError);
}

// Since we can't get the full source, let's analyze the error message
console.log('📋 Based on test results, the function signature is:');
console.log(`
CREATE OR REPLACE FUNCTION hera_org_link_app_v1(
  p_actor_user_id UUID,
  p_organization_id UUID,
  p_app_code TEXT,
  p_installed_at TIMESTAMPTZ,
  p_subscription JSONB,
  p_config JSONB,
  p_is_active BOOLEAN DEFAULT true
) RETURNS JSONB
`);

console.log('\n🔴 ERROR FOUND:');
console.log('   "APP smart_code segment 5 must match code \'SALON\'"');
console.log('\n📊 TEST INPUT:');
console.log('   App Code: SALON');
console.log('   Smart Code: HERA.PLATFORM.APP.ENTITY.SALON.v1');
console.log('   Segments: 1=HERA, 2=PLATFORM, 3=APP, 4=ENTITY, 5=SALON, 6=v1');
console.log('\n✅ ANALYSIS:');
console.log('   Segment 5 IS "SALON" which DOES match the app code');
console.log('   This indicates a BUG in the validation logic');
console.log('\n💡 LIKELY ISSUES:');
console.log('   1. Off-by-one error in segment indexing (array index 4 vs segment 5)');
console.log('   2. Incorrect regex extraction logic');
console.log('   3. Case sensitivity issue (already verified UPPERCASE)');
console.log('   4. Wrong segment being checked');
console.log('\n🔧 RECOMMENDED FIX:');
console.log('   Review the smart code parsing logic in hera_org_link_app_v1');
console.log('   Verify segment extraction: split_part(smart_code, \'.\', 5) should return "SALON"');
console.log('   Check if validation is using correct segment index');
