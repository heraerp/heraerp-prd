#!/usr/bin/env node

/**
 * 🔍 DEBUG TRANSACTION SUCCESS=FALSE
 * 
 * This script debugs exactly why the transaction RPC is returning success=false
 * to understand what's preventing transaction creation.
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

console.log('🔍 DEBUG TRANSACTION SUCCESS=FALSE')
console.log('==================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTransactionFailure() {
  console.log('🧪 Testing transaction creation with detailed error logging...')
  console.log('')
  
  // Use existing customer
  const customerId = 'd0b2f332-2b6e-4845-a5bd-f561e17018ec'
  
  try {
    console.log('📡 Calling hera_txn_crud_v1 with minimal valid payload...')
    
    const payload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.DEBUG_MINIMAL.v1',
          source_entity_id: customerId,
          total_amount: 50.00,
          transaction_status: 'completed',
          transaction_currency_code: 'AED'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Debug Minimal Service',
            quantity: 1,
            unit_amount: 50.00,
            line_amount: 50.00,
            smart_code: 'HERA.SALON.SERVICE.DEBUG_MINIMAL.v1'
          }
        ]
      }
    }
    
    console.log('Request payload:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('')
    
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', payload)
    
    console.log('📨 COMPLETE RESPONSE:')
    console.log('=====================')
    
    if (error) {
      console.log('❌ RPC ERROR (Supabase level):')
      console.log(JSON.stringify(error, null, 2))
    } else {
      console.log('✅ RPC SUCCESS (Supabase level) - Function response:')
      console.log(JSON.stringify(data, null, 2))
      console.log('')
      
      // Analyze the response
      if (data.success === false) {
        console.log('⚠️ FUNCTION RETURNED SUCCESS=FALSE')
        console.log('')
        console.log('🔍 Error details:')
        console.log(`Error: ${data.error || 'None provided'}`)
        console.log(`Error Hint: ${data.error_hint || 'None provided'}`)
        console.log(`Error Detail: ${data.error_detail || 'None provided'}`)
        console.log(`Error Context: ${data.error_context || 'None provided'}`)
        console.log('')
        
        if (data.error) {
          console.log('💡 ANALYZING ERROR MESSAGE:')
          const errorMsg = data.error
          
          if (errorMsg.includes('PARAM_REQUIRED')) {
            console.log('   🔧 Missing required parameter detected')
          } else if (errorMsg.includes('VALIDATION_ERROR')) {
            console.log('   🔧 Data validation failure detected')
          } else if (errorMsg.includes('CONSTRAINT')) {
            console.log('   🔧 Database constraint violation detected')
          } else if (errorMsg.includes('PERMISSION')) {
            console.log('   🔧 Permission/authorization issue detected')
          } else if (errorMsg.includes('SMART_CODE')) {
            console.log('   🔧 Smart code validation issue detected')
          } else {
            console.log(`   🔧 Unknown error type: ${errorMsg}`)
          }
        }
        
      } else if (data.success === true) {
        console.log('🎉 FUNCTION RETURNED SUCCESS=TRUE')
        console.log(`Transaction ID: ${data.transaction_id}`)
        
        if (data.transaction_id) {
          console.log('')
          console.log('✅ Transaction creation was successful!')
        } else {
          console.log('')
          console.log('⚠️ Success=true but no transaction_id returned - unusual')
        }
      } else {
        console.log('⚠️ FUNCTION RETURNED UNCLEAR SUCCESS STATUS')
        console.log(`Success value: ${data.success}`)
      }
    }
    
  } catch (error) {
    console.log('💥 JAVASCRIPT EXCEPTION:')
    console.log(error.message)
    console.log('')
    console.log('Stack trace:')
    console.log(error.stack)
  }
}

// Also test a super minimal payload
async function testMinimalPayload() {
  console.log('')
  console.log('🧪 Testing super minimal payload...')
  console.log('')
  
  const customerId = 'd0b2f332-2b6e-4845-a5bd-f561e17018ec'
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.SUPER_MINIMAL.v1',
          source_entity_id: customerId,
          total_amount: 10.00
        },
        lines: []  // Empty lines to test if lines are required
      }
    })
    
    console.log('📨 Minimal payload response:')
    if (error) {
      console.log('❌ Error:', JSON.stringify(error, null, 2))
    } else {
      console.log(JSON.stringify(data, null, 2))
      
      if (data.success) {
        console.log('✅ Super minimal payload worked!')
      } else {
        console.log(`❌ Super minimal failed: ${data.error}`)
      }
    }
    
  } catch (error) {
    console.log('💥 Minimal test exception:', error.message)
  }
}

async function runTransactionDebug() {
  await debugTransactionFailure()
  await testMinimalPayload()
  
  console.log('')
  console.log('🏁 Transaction debug completed.')
}

runTransactionDebug().catch(error => {
  console.error('💥 Debug failed:', error.message)
})