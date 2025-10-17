#!/usr/bin/env node
/**
 * Simulate what PaymentDialog does to fetch branch address
 * This will help us understand why wrong address is showing
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Known branch IDs from earlier diagnostic
const PARK_REGIS_ID = '83f96b69-156f-4029-b636-638ad7b36c47'
const MERCURE_ID = 'db115f39-55c9-42cb-8d0f-99c7c10f9f1b'

async function simulatePaymentDialogLookup() {
  console.log('🔍 Simulating PaymentDialog branch address lookup...\n')
  console.log('=' .repeat(100))

  const branches = [
    { id: PARK_REGIS_ID, expected_name: 'Park Regis Kris Kin Hotel' },
    { id: MERCURE_ID, expected_name: 'Mercure Gold Hotel' }
  ]

  for (const branch of branches) {
    console.log(`\n📍 Testing lookup for: ${branch.expected_name}`)
    console.log(`   Branch ID: ${branch.id}`)
    console.log('-'.repeat(100))

    // Get branch entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, organization_id')
      .eq('id', branch.id)
      .single()

    if (entityError) {
      console.log(`   ❌ Entity lookup failed: ${entityError.message}`)
      continue
    }

    console.log(`   ✅ Entity found: ${entity.entity_name} (${entity.entity_type})`)
    console.log(`   Organization: ${entity.organization_id}`)

    // Method 1: getDynamicFields equivalent - get ALL dynamic data for this entity
    console.log(`\n   📋 Method 1: Get ALL dynamic fields (universalApi.getDynamicFields equivalent)`)

    const { data: allFields, error: allFieldsError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', branch.id)
      .eq('organization_id', entity.organization_id)

    if (allFieldsError) {
      console.log(`      ❌ Error: ${allFieldsError.message}`)
    } else if (!allFields || allFields.length === 0) {
      console.log(`      ⚠️  No dynamic data found`)
    } else {
      console.log(`      ✅ Found ${allFields.length} fields:`)
      allFields.forEach(field => {
        const value = field.field_value_text || field.field_value_number || JSON.stringify(field.field_value_json)
        console.log(`         • ${field.field_name}: "${value}"`)
      })

      // Extract address like PaymentDialog does
      const addressField = allFields.find(f => f.field_name === 'address')
      if (addressField) {
        console.log(`\n      🏠 Address extracted: "${addressField.field_value_text}"`)
      } else {
        console.log(`\n      ⚠️  No 'address' field found`)
      }
    }

    // Method 2: Direct address query
    console.log(`\n   📋 Method 2: Direct address query`)

    const { data: addressData, error: addressError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', branch.id)
      .eq('organization_id', entity.organization_id)
      .eq('field_name', 'address')
      .maybeSingle()

    if (addressError) {
      console.log(`      ❌ Error: ${addressError.message}`)
    } else if (!addressData) {
      console.log(`      ⚠️  No address found`)
    } else {
      console.log(`      ✅ Address: "${addressData.field_value_text}"`)
    }

    console.log('\n' + '='.repeat(100))
  }

  // Now test what happens if we accidentally use a STAFF ID instead of branch ID
  console.log('\n\n🚨 Testing WRONG ID scenario: What if we use a STAFF ID?')
  console.log('='.repeat(100))

  // Get a staff ID from transactions
  const { data: sampleTxn, error: txnError } = await supabase
    .from('universal_transactions')
    .select('target_entity_id, metadata')
    .eq('transaction_type', 'SALE')
    .not('target_entity_id', 'is', null)
    .limit(1)
    .single()

  if (!txnError && sampleTxn) {
    const staffId = sampleTxn.target_entity_id
    const correctBranchId = sampleTxn.metadata?.branch_id

    console.log(`\n   Staff ID (from target_entity_id): ${staffId}`)
    console.log(`   Correct Branch ID (from metadata): ${correctBranchId}`)

    // Try to lookup address using staff ID
    console.log(`\n   ⚠️  Attempting to fetch "branch address" using STAFF ID...`)

    const { data: staffEntity, error: staffError } = await supabase
      .from('core_entities')
      .select('entity_name, entity_type')
      .eq('id', staffId)
      .single()

    if (!staffError && staffEntity) {
      console.log(`      Entity found: ${staffEntity.entity_name} (${staffEntity.entity_type})`)
    }

    const { data: wrongAddress, error: wrongAddressError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', staffId)
      .eq('field_name', 'address')
      .maybeSingle()

    if (wrongAddressError) {
      console.log(`      Result: Error - ${wrongAddressError.message}`)
    } else if (!wrongAddress) {
      console.log(`      Result: No address found for staff entity (this is expected)`)
    } else {
      console.log(`      🚨 FOUND ADDRESS: "${wrongAddress.field_value_text}"`)
      console.log(`      This would be the WRONG address on the receipt!`)
    }

    // Now try with correct branch ID
    console.log(`\n   ✅ Now fetching with CORRECT branch ID...`)

    const { data: correctAddress, error: correctAddressError } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', correctBranchId)
      .eq('field_name', 'address')
      .maybeSingle()

    if (!correctAddressError && correctAddress) {
      console.log(`      ✅ Correct address: "${correctAddress.field_value_text}"`)
    }
  }

  console.log('\n' + '='.repeat(100))
  console.log('\n✅ Diagnostic complete!\n')
}

simulatePaymentDialogLookup()
