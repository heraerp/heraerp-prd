#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getValidOrg() {
  const { data, error } = await supabase
    .from('core_organizations')
    .select('id, organization_name')
    .limit(1)
    .single()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('Valid Organization:', data)
  console.log('Organization ID:', data.id)
}

getValidOrg()
