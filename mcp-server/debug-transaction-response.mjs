#!/usr/bin/env node

/**
 * 🔍 DEBUG TRANSACTION RESPONSE STRUCTURE
 * 
 * This script debugs the exact response format from hera_txn_crud_v1
 * to fix the transaction ID extraction issue.
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

console.log('🔍 DEBUG TRANSACTION RESPONSE STRUCTURE')
console.log('=======================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugTransactionResponse() {
  console.log('🧪 Creating test transaction and logging full response...')
  console.log('')
  
  // Use existing customer
  const customerId = 'cb84e94b-44cb-4a2f-8539-1ed21493cffd'
  
  try {
    console.log('📡 Calling hera_txn_crud_v1 with CREATE...')
    
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.DEBUG.v1',
          source_entity_id: customerId,
          total_amount: 99.99,
          transaction_status: 'completed',
          transaction_currency_code: 'AED',
          organization_id: salonOrgId
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Debug Test Service',
            quantity: 1,
            unit_amount: 99.99,
            line_amount: 99.99,
            smart_code: 'HERA.SALON.SERVICE.DEBUG.v1'
          }
        ]
      }
    })
    
    console.log('📨 FULL RESPONSE:')
    console.log('==================')
    
    if (error) {
      console.log('❌ ERROR:')
      console.log(JSON.stringify(error, null, 2))
    } else {
      console.log('✅ SUCCESS - Complete response structure:')
      console.log(JSON.stringify(data, null, 2))
      console.log('')
      
      // Try different paths to find the transaction ID
      console.log('🔍 Checking possible transaction ID locations:')
      console.log(`data?.id: ${data?.id}`)
      console.log(`data?.transaction_id: ${data?.transaction_id}`)
      console.log(`data?.data?.id: ${data?.data?.id}`)
      console.log(`data?.data?.transaction_id: ${data?.data?.transaction_id}`)
      console.log(`data?.data?.items?.[0]?.id: ${data?.data?.items?.[0]?.id}`)
      console.log(`data?.data?.transaction?.id: ${data?.data?.transaction?.id}`)
      console.log(`data?.result?.id: ${data?.result?.id}`)
      console.log(`data?.result?.transaction_id: ${data?.result?.transaction_id}`)
      console.log('')
      
      // Check success indicators
      console.log('🔍 Checking success indicators:')
      console.log(`data?.success: ${data?.success}`)
      console.log(`data?.action: ${data?.action}`)
      console.log(`data?.status: ${data?.status}`)
      console.log('')
      
      // Response structure analysis
      console.log('🔍 Response structure:')
      console.log(`Type: ${typeof data}`)
      console.log(`Keys: ${Object.keys(data || {})}`)
      
      if (data?.data) {
        console.log(`data.data type: ${typeof data.data}`)
        console.log(`data.data keys: ${Object.keys(data.data || {})}`)
        
        if (data.data.transaction) {
          console.log(`data.data.transaction keys: ${Object.keys(data.data.transaction || {})}`)
        }
        
        if (data.data.lines) {
          console.log(`data.data.lines length: ${data.data.lines?.length || 0}`)
        }
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

// Check if the transaction was actually created in database
async function checkDatabaseForTransaction() {
  console.log('')
  console.log('🔍 Checking database for recently created transactions...')
  console.log('')
  
  try {
    const { data, error } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, smart_code, total_amount, created_at, created_by')
      .eq('organization_id', salonOrgId)
      .eq('created_by', actorUserId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.log('❌ Database query error:', error.message)
    } else {
      console.log(`📊 Found ${data.length} recent transactions:`)
      data.forEach((txn, index) => {
        console.log(`${index + 1}. ${txn.transaction_type} (${txn.smart_code})`)
        console.log(`   ID: ${txn.id}`)
        console.log(`   Amount: AED ${txn.total_amount}`)
        console.log(`   Created: ${txn.created_at}`)
        console.log('')
      })
      
      if (data.length > 0) {
        const latestTransaction = data[0]
        console.log(`🎯 Latest transaction ID: ${latestTransaction.id}`)
        console.log(`🕒 Created: ${latestTransaction.created_at}`)
      }
    }
    
  } catch (error) {
    console.log('💥 Database check exception:', error.message)
  }
}

async function runResponseDebug() {
  await debugTransactionResponse()
  await checkDatabaseForTransaction()
  
  console.log('')
  console.log('🏁 Response debugging completed.')
}

runResponseDebug().catch(error => {
  console.error('💥 Debug failed:', error.message)
})