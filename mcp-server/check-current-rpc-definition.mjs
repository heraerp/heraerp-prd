/**
 * Check current RPC definition in database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 CHECKING CURRENT RPC DEFINITION')
console.log('='.repeat(80))
console.log('')

async function checkRPCDefinition() {
  console.log('📝 Querying pg_proc for hera_user_orgs_list_v1...')
  console.log('-'.repeat(80))

  const { data, error } = await supabase.rpc('sql', {
    query: `
      SELECT
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'hera_user_orgs_list_v1'
        AND n.nspname = 'public'
    `
  })

  if (error) {
    console.log('❌ Error querying RPC:', error.message)
    console.log('   Trying alternative method...')

    // Try using psql query instead
    const { data: funcData, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'hera_user_orgs_list_v1')
      .single()

    if (funcError) {
      console.log('❌ Alternative method failed:', funcError.message)
      console.log('')
      console.log('📋 MANUAL CHECK REQUIRED:')
      console.log('   1. Go to Supabase Dashboard > SQL Editor')
      console.log('   2. Run this query:')
      console.log('')
      console.log('      SELECT pg_get_functiondef(oid)')
      console.log('      FROM pg_proc')
      console.log("      WHERE proname = 'hera_user_orgs_list_v1';")
      console.log('')
      return
    }

    console.log('✅ Found function source:')
    console.log(funcData.prosrc)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Function not found in database')
    return
  }

  console.log('✅ Current function definition:')
  console.log('')
  console.log(data[0].definition)
  console.log('')
}

checkRPCDefinition().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
