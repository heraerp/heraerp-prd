#!/usr/bin/env node
/**
 * Inspect the hera_entities_crud_v1 RPC function definition
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectRPC() {
  console.log('🔍 Inspecting hera_entities_crud_v1 RPC function\n')

  // Query PostgreSQL system catalogs to get function definition
  const { data, error } = await supabase.rpc('sql', {
    query: `
      SELECT
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'hera_entities_crud_v1'
      LIMIT 1;
    `
  })

  if (error) {
    console.log('❌ Error querying function:', error.message)

    // Try alternative approach - check if function exists
    console.log('\nTrying alternative approach...')

    const { data: funcData, error: funcError } = await supabase
      .rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674',
        p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        p_entity: { entity_type: 'CUSTOMER' },
        p_dynamic: {},
        p_relationships: {},
        p_options: { limit: 1 }
      })

    if (funcError) {
      console.log('❌ Function call failed:', funcError.message)
    } else {
      console.log('✅ Function exists and returns:')
      console.log(JSON.stringify(funcData, null, 2))
    }
    return
  }

  if (data && data.length > 0) {
    console.log('✅ Function found!\n')
    console.log('Function Definition:')
    console.log(data[0].function_definition)
  } else {
    console.log('❌ Function not found in public schema')
  }
}

inspectRPC().catch(console.error)
