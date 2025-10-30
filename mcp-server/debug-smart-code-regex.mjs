#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Testing Smart Code Regex Extraction\n')

// Get SALON app
const { data: app, error } = await supabase
  .from('core_entities')
  .select('entity_code, smart_code')
  .eq('entity_type', 'APP')
  .eq('entity_code', 'SALON')
  .single()

if (error) {
  console.error('❌ Error fetching app:', error.message)
  process.exit(1)
}

console.log('App Data:')
console.log(`  entity_code: ${app.entity_code}`)
console.log(`  smart_code:  ${app.smart_code}\n`)

// Test the regex in PostgreSQL via a simple RPC
// We'll create a test function inline
const testSQL = `
DO $$
DECLARE
  v_smart_code text := 'HERA.PLATFORM.APP.ENTITY.SALON.v1';
  v_expected_code text := 'SALON';
  v_extracted text;
BEGIN
  -- Test extraction
  v_extracted := REGEXP_REPLACE(v_smart_code, '^HERA\\.PLATFORM\\.APP\\.ENTITY\\.([A-Z0-9]+)\\.(v[0-9]+)$', '\\1');

  RAISE NOTICE 'Smart Code: %', v_smart_code;
  RAISE NOTICE 'Extracted: %', v_extracted;
  RAISE NOTICE 'Expected: %', v_expected_code;
  RAISE NOTICE 'Match: %', (v_extracted = v_expected_code);

  -- Also test if the regex matches at all
  IF v_smart_code ~ '^HERA\\.PLATFORM\\.APP\\.ENTITY\\.([A-Z0-9]+)\\.(v[0-9]+)$' THEN
    RAISE NOTICE 'Regex pattern MATCHES';
  ELSE
    RAISE NOTICE 'Regex pattern DOES NOT MATCH';
  END IF;
END $$;
`

// Execute the test
const { error: sqlError } = await supabase.rpc('exec_sql', { sql: testSQL }).catch(() => {
  // Function doesn't exist, we'll try alternative approach
  return { error: { message: 'exec_sql function not available' } }
})

console.log('📝 PostgreSQL Regex Test Results:')
console.log('(Check Supabase logs for NOTICE messages)\n')

// Test with split approach
console.log('🧪 Testing split approach (segment extraction):')
const segments = app.smart_code.split('.')
segments.forEach((seg, idx) => {
  console.log(`  Segment ${idx + 1}: ${seg}`)
})

console.log(`\n  Segment 5 (app code): ${segments[4]}`)
console.log(`  Expected: ${app.entity_code}`)
console.log(`  Match: ${segments[4] === app.entity_code}\n`)

// Recommend fix
if (segments[4] === app.entity_code) {
  console.log('✅ Solution: Use split_part or array indexing')
  console.log('\nFixed SQL Option 1 (array):')
  console.log(`  v_extracted_code := (string_to_array(v_app_sc, '.'))[5];`)
  console.log('\nFixed SQL Option 2 (split_part):')
  console.log(`  v_extracted_code := split_part(v_app_sc, '.', 5);`)
} else {
  console.log('❌ Smart code format issue detected')
}

process.exit(0)
