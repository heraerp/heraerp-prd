/**
 * Inspect RPC Function Definition
 * Query Supabase to see the actual SQL of hera_txn_crud_v1
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectRPCFunction() {
  console.log('\n🔍 Inspecting hera_txn_crud_v1 RPC Function')
  console.log('=' .repeat(60))

  try {
    // Just try to call the function with minimal payload
    console.log('\n📋 Testing with minimal READ payload...')

    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: 'f0f4ced2-877a-4a0c-8860-f5bc574652f6',
      p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
      p_transaction: {
        transaction_type: 'appointment'
      },
      p_lines: [],
      p_options: {
        limit: 1
      }
    })

    console.log('\n📦 Response:', JSON.stringify({ data, error }, null, 2))

    if (error) {
      console.error('\n❌ RPC Error Details:')
      console.error('  - Message:', error.message)
      console.error('  - Details:', error.details)
      console.error('  - Hint:', error.hint)
      console.error('  - Code:', error.code)
    }

  } catch (error) {
    console.error('\n❌ Inspection Failed:', error)
  }
}

// Run the inspection
inspectRPCFunction()
