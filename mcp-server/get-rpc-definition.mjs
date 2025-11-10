/**
 * 🔍 GET: RPC function definition from database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FUNCTION_NAME = process.argv[2] || 'resolve_user_identity_v1'

console.log(`🔍 GETTING DEFINITION: ${FUNCTION_NAME}`)
console.log('='.repeat(80))
console.log('')

async function getFunctionDefinition() {
  // Query PostgreSQL system catalog to get function definition
  const query = `
    SELECT
      pg_get_functiondef(p.oid) as function_definition,
      p.proname as function_name,
      pg_catalog.pg_get_function_arguments(p.oid) as arguments,
      pg_catalog.pg_get_function_result(p.oid) as result_type,
      obj_description(p.oid) as description
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = '${FUNCTION_NAME}'
    LIMIT 1;
  `

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: query
  }).catch(async () => {
    // If exec_sql doesn't work, try alternative approach
    console.log('⚠️  exec_sql not available, trying alternative query...')
    console.log('')

    // Alternative: Use pg_get_functiondef directly if available as RPC
    const altQuery = `SELECT pg_get_functiondef('${FUNCTION_NAME}'::regproc::oid) as def;`

    return await supabase.rpc('exec_sql', { sql: altQuery }).catch(() => {
      console.log('❌ Cannot retrieve function definition via RPC')
      console.log('')
      console.log('Please provide the function definition manually, or check:')
      console.log('   1. Supabase Dashboard > Database > Functions')
      console.log(`   2. Look for: ${FUNCTION_NAME}`)
      console.log('   3. Copy the SQL definition')
      console.log('')
      return { data: null, error: { message: 'exec_sql not available' } }
    })
  })

  if (error || !data) {
    console.log('❌ Error retrieving function definition:')
    console.log(`   ${error?.message || 'Unknown error'}`)
    console.log('')
    console.log('='.repeat(80))
    console.log('📝 MANUAL STEPS')
    console.log('='.repeat(80))
    console.log('')
    console.log('Please retrieve the function definition manually:')
    console.log('')
    console.log('1. Go to Supabase Dashboard')
    console.log('2. Database > Functions')
    console.log(`3. Find: ${FUNCTION_NAME}`)
    console.log('4. Copy the SQL definition')
    console.log('5. Share it for review')
    console.log('')
    return false
  }

  console.log('✅ Function definition retrieved')
  console.log('')
  console.log('='.repeat(80))
  console.log(`FUNCTION: ${FUNCTION_NAME}`)
  console.log('='.repeat(80))
  console.log('')

  if (data.length > 0) {
    const func = data[0]

    if (func.description) {
      console.log('📝 DESCRIPTION:')
      console.log(func.description)
      console.log('')
    }

    console.log('📋 ARGUMENTS:')
    console.log(func.arguments || 'None')
    console.log('')

    console.log('📤 RETURN TYPE:')
    console.log(func.result_type || 'Unknown')
    console.log('')

    console.log('💻 FUNCTION DEFINITION:')
    console.log('-'.repeat(80))
    console.log(func.function_definition)
    console.log('-'.repeat(80))
    console.log('')
  }

  return true
}

getFunctionDefinition().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
