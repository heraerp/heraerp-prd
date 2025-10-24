#!/usr/bin/env node
/**
 * List all hera_* RPC functions available in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function listFunctions() {
  console.log('🔍 Listing all hera_* functions in Supabase...\n')

  // Try a few common function names to see what exists
  const functionsToCheck = [
    'hera_dynamic_data_batch_v1',
    'hera_dynamic_data_upsert_v1',
    'hera_dynamic_field_upsert_v1',
    'hera_entity_upsert_v1',
    'hera_entity_read_v1',
    'hera_entities_crud_v1',
    'hera_relationship_create_v1',
    'hera_relationship_upsert_v1'
  ]

  console.log('📋 Checking common HERA functions:\n')

  for (const funcName of functionsToCheck) {
    // Try calling with minimal params to see if it exists
    const { error } = await supabase.rpc(funcName, {})

    if (error) {
      if (error.code === 'PGRST202') {
        console.log(`❌ ${funcName} - NOT FOUND`)
      } else {
        console.log(`✅ ${funcName} - EXISTS (error: ${error.message.substring(0, 60)}...)`)
      }
    } else {
      console.log(`✅ ${funcName} - EXISTS and callable`)
    }
  }

  console.log('\n💡 Functions that exist can be used in your orchestrator RPC')
}

listFunctions().catch(console.error)
