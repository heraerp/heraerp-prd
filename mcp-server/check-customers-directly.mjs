#!/usr/bin/env node
/**
 * Check customers directly from core_entities table
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCustomers() {
  console.log('🔍 Checking customers directly from core_entities table\n')

  // Direct query to core_entities
  const { data, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', TENANT_ORG_ID)
    .eq('entity_type', 'CUSTOMER')
    .limit(5)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${data.length} customers\n`)

  data.forEach((customer, index) => {
    console.log(`Customer #${index + 1}:`)
    console.log(`  - ID: ${customer.id}`)
    console.log(`  - Name: ${customer.entity_name}`)
    console.log(`  - Type: ${customer.entity_type}`)
    console.log(`  - Smart Code: ${customer.smart_code}`)
    console.log(`  - Status: ${customer.status}`)
    console.log(`  - Created: ${customer.created_at}`)
    console.log('')
  })
}

checkCustomers().catch(console.error)
