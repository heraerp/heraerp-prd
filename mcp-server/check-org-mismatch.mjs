#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkOrgMismatch() {
  console.log('\n🔍 CHECKING ORGANIZATION MISMATCH\n')

  try {
    const envOrgId = process.env.DEFAULT_ORGANIZATION_ID
    const actualServicesOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

    console.log('📊 Environment Configuration:')
    console.log(`  .env DEFAULT_ORGANIZATION_ID: ${envOrgId}`)
    console.log(`  Actual Services Org ID: ${actualServicesOrgId}`)
    console.log(`  MISMATCH: ${envOrgId !== actualServicesOrgId ? '❌ YES' : '✅ NO'}\n`)

    // Check services in the correct org
    console.log('📊 Services in the CORRECT organization (378f24fb...):\n')
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('organization_id', actualServicesOrgId)
      .eq('entity_type', 'SERVICE')

    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError)
    } else {
      console.log(`✅ Found ${services.length} services:`)
      services.forEach(s => console.log(`  - ${s.entity_name} (${s.id})`))
    }

    // Check which org the recent transactions belong to
    console.log('\n📊 Recent Transactions Organization Check:\n')
    const { data: txns, error: txnError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, organization_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (txnError) {
      console.error('❌ Error fetching transactions:', txnError)
    } else {
      console.log(`Found ${txns.length} recent transactions:`)
      txns.forEach(t => {
        const isWrongOrg = t.organization_id !== actualServicesOrgId
        console.log(`  ${t.transaction_type} (${t.created_at})`)
        console.log(`    Org: ${t.organization_id} ${isWrongOrg ? '❌ WRONG ORG!' : '✅ Correct'}`)
      })
    }

    // Check customers in both orgs
    console.log('\n📊 Customer Distribution:\n')
    const { data: envOrgCustomers } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', envOrgId)
      .eq('entity_type', 'CUSTOMER')

    const { data: actualOrgCustomers } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', actualServicesOrgId)
      .eq('entity_type', 'CUSTOMER')

    console.log(`  .env Org (${envOrgId}): ${envOrgCustomers?.length || 0} customers`)
    console.log(`  Actual Org (${actualServicesOrgId}): ${actualOrgCustomers?.length || 0} customers`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkOrgMismatch()
