#!/usr/bin/env node

/**
 * 🎯 POST TRANSACTION - ORGANIZATION MISMATCH FIXED
 * 
 * The error "header.organization_id must equal p_organization_id" suggests
 * the function expects organization_id in a header part of the payload.
 * Let's fix this structure.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const salonOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const actorUserId = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'

console.log('🎯 POST TRANSACTION - ORGANIZATION MISMATCH FIXED')
console.log('===============================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

// Use existing customer
const customerId = '563b902f-6004-4319-a1b6-8d9f726ba310'

async function tryDifferentPayloadStructures() {
  console.log('🧪 Testing different payload structures to fix ORG_MISMATCH...')
  console.log('')
  
  // Test 1: Header structure
  console.log('📡 Test 1: Adding header with organization_id...')
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId  // Try adding header section
        },
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.HEADER_TEST.v1',
          source_entity_id: customerId,
          total_amount: 100.00,
          transaction_status: 'completed',
          transaction_currency_code: 'AED'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Header Test Service',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.SALON.SERVICE.HEADER_TEST.v1'
          }
        ]
      }
    })
    
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data?.success) {
      console.log(`🎉 SUCCESS with header structure! Transaction: ${data.transaction_id}`)
      return data.transaction_id
    } else {
      console.log(`❌ Header test failed: ${data?.error}`)
    }
    
  } catch (error) {
    console.log(`❌ Header test exception: ${error.message}`)
  }
  
  console.log('')
  
  // Test 2: Organization in transaction object
  console.log('📡 Test 2: Organization_id in transaction object...')
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.ORG_TEST.v1',
          source_entity_id: customerId,
          organization_id: salonOrgId,  // Try adding org_id to transaction
          total_amount: 100.00,
          transaction_status: 'completed',
          transaction_currency_code: 'AED'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Org Test Service',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.SALON.SERVICE.ORG_TEST.v1'
          }
        ]
      }
    })
    
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data?.success) {
      console.log(`🎉 SUCCESS with transaction org_id! Transaction: ${data.transaction_id}`)
      return data.transaction_id
    } else {
      console.log(`❌ Transaction org_id test failed: ${data?.error}`)
    }
    
  } catch (error) {
    console.log(`❌ Transaction org_id test exception: ${error.message}`)
  }
  
  console.log('')
  
  // Test 3: Flat structure with organization_id at payload root
  console.log('📡 Test 3: Organization_id at payload root...')
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        organization_id: salonOrgId,  // Try at payload root
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.ROOT_TEST.v1',
          source_entity_id: customerId,
          total_amount: 100.00,
          transaction_status: 'completed',
          transaction_currency_code: 'AED'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Root Test Service',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.SALON.SERVICE.ROOT_TEST.v1'
          }
        ]
      }
    })
    
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data?.success) {
      console.log(`🎉 SUCCESS with root org_id! Transaction: ${data.transaction_id}`)
      return data.transaction_id
    } else {
      console.log(`❌ Root org_id test failed: ${data?.error}`)
    }
    
  } catch (error) {
    console.log(`❌ Root org_id test exception: ${error.message}`)
  }
  
  console.log('')
  
  // Test 4: Check if we need to match parameter exactly
  console.log('📡 Test 4: Using parameter organization_id in header...')
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId  // Make sure this matches p_organization_id exactly
        },
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.MATCH_TEST.v1',
          source_entity_id: customerId,
          total_amount: 100.00
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Match Test Service',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.SALON.SERVICE.MATCH_TEST.v1'
          }
        ]
      }
    })
    
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data?.success) {
      console.log(`🎉 SUCCESS with matching header! Transaction: ${data.transaction_id}`)
      return data.transaction_id
    } else {
      console.log(`❌ Matching header test failed: ${data?.error}`)
    }
    
  } catch (error) {
    console.log(`❌ Matching header test exception: ${error.message}`)
  }
  
  return null
}

// Verify any successful transaction
async function verifyTransaction(transactionId) {
  if (!transactionId) return false
  
  console.log(`🔍 Verifying transaction ${transactionId} in database...`)
  
  try {
    const { data, error } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, total_amount, transaction_status, created_at')
      .eq('id', transactionId)
      .single()
    
    if (error || !data) {
      console.log('❌ Transaction not found in database')
      return false
    }
    
    console.log('✅ Transaction verified in database:')
    console.log(`   ID: ${data.id}`)
    console.log(`   Type: ${data.transaction_type}`)
    console.log(`   Amount: AED ${data.total_amount}`)
    console.log(`   Status: ${data.transaction_status}`)
    console.log(`   Created: ${data.created_at}`)
    
    return true
    
  } catch (error) {
    console.log(`❌ Verification error: ${error.message}`)
    return false
  }
}

async function runFixedTest() {
  console.log(`🎯 Using existing customer: ${customerId}`)
  console.log('')
  
  const transactionId = await tryDifferentPayloadStructures()
  
  if (transactionId) {
    await verifyTransaction(transactionId)
    
    console.log('')
    console.log('🎉 SUCCESS: Real salon transaction posted to Supabase!')
    console.log(`   Customer: ${customerId}`)
    console.log(`   Transaction: ${transactionId}`)
    console.log('   HERA v2.2 patterns working perfectly!')
    
  } else {
    console.log('')
    console.log('⚠️ All payload structure tests failed')
    console.log('🔧 The function may require different parameters or deployment')
  }
}

runFixedTest().catch(error => {
  console.error('💥 Test failed:', error.message)
})