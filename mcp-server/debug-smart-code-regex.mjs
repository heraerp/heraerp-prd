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

// Skip PostgreSQL test - we'll use JavaScript to verify the logic
console.log('📝 Testing extraction logic:\n')

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
