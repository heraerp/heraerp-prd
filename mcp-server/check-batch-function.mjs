#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkFunction() {
  // Check if hera_dynamic_data_batch_v1 exists
  const { data, error } = await supabase.rpc('hera_dynamic_data_batch_v1', {
    p_organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
    p_entity_id: '00000000-0000-0000-0000-000000000000',
    p_fields: [],
    p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674'
  })

  if (error) {
    console.log('❌ Function check failed:', error.message)
    console.log('Error details:', error)
  } else {
    console.log('✅ Function exists and returned:', data)
  }
}

checkFunction()
