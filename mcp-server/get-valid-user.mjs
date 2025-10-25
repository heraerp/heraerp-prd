#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getValidUser() {
  const { data, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, organization_id')
    .eq('entity_type', 'user')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('Valid User Entities:', data)
  if (data && data.length > 0) {
    console.log('First User ID:', data[0].id)
  }
}

getValidUser()
