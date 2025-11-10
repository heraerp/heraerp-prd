/**
 * 🔍 CHECK: core_relationships table schema
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 CHECKING: core_relationships Schema')
console.log('='.repeat(80))
console.log('')

async function checkSchema() {
  // Get one relationship to see all fields
  const { data: rels, error } = await supabase
    .from('core_relationships')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!rels || rels.length === 0) {
    console.log('⚠️  No relationships found')
    return
  }

  const rel = rels[0]

  console.log('📋 Sample relationship record:')
  console.log(JSON.stringify(rel, null, 2))
  console.log('')

  console.log('📋 Field names in core_relationships:')
  Object.keys(rel).forEach((key, idx) => {
    console.log(`   ${idx + 1}. ${key}: ${typeof rel[key]} = ${rel[key]}`)
  })
  console.log('')
}

checkSchema().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
