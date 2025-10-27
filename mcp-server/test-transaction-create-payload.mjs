#!/usr/bin/env node

/**
 * 🧪 TEST TRANSACTION CREATE PAYLOAD
 * 
 * This script tests the correct payload structure for hera_txn_crud_v1
 * to fix the function signature issues.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const salonOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const actorUserId = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'

console.log('🧪 TESTING TRANSACTION CREATE PAYLOAD')
console.log('====================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTransactionCreate() {
  console.log('🔬 Testing hera_txn_crud_v1 CREATE...')
  console.log('')
  
  // Use existing customer ID from debug test
  const customerId = 'c5814c70-31b0-42b5-8feb-e24d38185c30'
  
  try {
    console.log('📡 Testing with standard payload structure...')
    
    const payload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_transaction: {
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.TXN.SALE.TEST.v1',
        source_entity_id: customerId,
        total_amount: 100.00,
        transaction_status: 'completed',
        transaction_currency_code: 'AED',
        organization_id: salonOrgId
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'service',
          description: 'Test Service',
          quantity: 1,
          unit_amount: 100.00,
          line_amount: 100.00,
          smart_code: 'HERA.SALON.SERVICE.TEST.v1'
        }
      ],
      p_options: {}
    }
    
    console.log('Payload:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('')
    
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', payload)
    
    if (error) {
      console.log('❌ ERROR:')
      console.log(JSON.stringify(error, null, 2))
      
      // Check if it's a parameter signature issue
      if (error.message.includes('Could not find the function')) {
        console.log('')
        console.log('🔍 Parameter signature mismatch detected.')
        console.log('💡 This suggests the function expects different parameters.')
      }
      
    } else {
      console.log('✅ SUCCESS:')
      console.log(JSON.stringify(data, null, 2))
      
      if (data?.data?.items?.[0]?.id) {
        console.log('')
        console.log(`🎉 Transaction created successfully: ${data.data.items[0].id}`)
      }
    }
    
  } catch (error) {
    console.log('💥 EXCEPTION:')
    console.log(error.message)
    console.log('')
    console.log('Stack trace:')
    console.log(error.stack)
  }
}

// Test alternative payload structures
async function testAlternativePayloads() {
  console.log('')
  console.log('🔬 Testing alternative payload structures...')
  console.log('')
  
  const customerId = 'c5814c70-31b0-42b5-8feb-e24d38185c30'
  
  // Test 1: Without p_options
  console.log('📡 Test 1: Without p_options...')
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_transaction: {
        transaction_type: 'sale',
        smart_code: 'HERA.SALON.TXN.SALE.TEST2.v1',
        source_entity_id: customerId,
        total_amount: 150.00,
        organization_id: salonOrgId
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'service',
          description: 'Test Service 2',
          quantity: 1,
          unit_amount: 150.00,
          line_amount: 150.00,
          smart_code: 'HERA.SALON.SERVICE.TEST2.v1'
        }
      ]
    })
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log(`   ✅ Success: Transaction created`)
      if (data?.data?.items?.[0]?.id) {
        console.log(`   🎉 ID: ${data.data.items[0].id}`)
      }
    }
    
  } catch (error) {
    console.log(`   💥 Exception: ${error.message}`)
  }
  
  // Test 2: Using p_payload instead of separate parameters  
  console.log('')
  console.log('📡 Test 2: Using p_payload structure...')
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.TEST3.v1',
          source_entity_id: customerId,
          total_amount: 200.00,
          organization_id: salonOrgId
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Test Service 3',
            quantity: 1,
            unit_amount: 200.00,
            line_amount: 200.00,
            smart_code: 'HERA.SALON.SERVICE.TEST3.v1'
          }
        ]
      }
    })
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log(`   ✅ Success: Transaction created with p_payload`)
      if (data?.data?.items?.[0]?.id) {
        console.log(`   🎉 ID: ${data.data.items[0].id}`)
      }
    }
    
  } catch (error) {
    console.log(`   💥 Exception: ${error.message}`)
  }
}

async function runPayloadTest() {
  await testTransactionCreate()
  await testAlternativePayloads()
  
  console.log('')
  console.log('🏁 Payload testing completed.')
}

runPayloadTest().catch(error => {
  console.error('💥 Payload test failed:', error.message)
})