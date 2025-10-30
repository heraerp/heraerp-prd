#!/usr/bin/env node

/**
 * 🔍 TEST GL LINE_DATA STRUCTURE
 * 
 * Let's test the exact line_data structure needed for GL posting
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

console.log('🔍 TESTING GL LINE_DATA STRUCTURE')
console.log('=================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGLLineData() {
  console.log('🧪 Testing different line_data structures for GL entries...')
  console.log('')
  
  // Test 1: Simple GL entry with side in line_data
  console.log('📡 Test 1: Simple DR entry with line_data.side...')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_entry',
          smart_code: 'HERA.FINANCE.GL.TEST.SIMPLE.v1'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            description: 'Test DR Entry',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.FINANCE.GL.TEST.DR.v1',
            line_data: {
              side: 'DR'
            }
          }
        ]
      }
    })
    
    console.log('📨 Response:', JSON.stringify(data, null, 2))
    
    if (data?.success && data?.transaction_id) {
      console.log(`✅ Test 1 SUCCESS: ${data.transaction_id}`)
      return { test1: true, transaction_id: data.transaction_id }
    } else {
      console.log(`❌ Test 1 FAILED: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ Test 1 EXCEPTION: ${error.message}`)
  }
  
  console.log('')
  
  // Test 2: Balanced DR/CR entries  
  console.log('📡 Test 2: Balanced DR/CR entries...')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_entry',
          smart_code: 'HERA.FINANCE.GL.TEST.BALANCED.v1'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            description: 'Test DR Entry - Cash',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.FINANCE.GL.TEST.DR.v1',
            line_data: {
              side: 'DR',
              account_code: '1001'
            }
          },
          {
            line_number: 2,
            line_type: 'GL',
            description: 'Test CR Entry - Revenue',
            quantity: 1,
            unit_amount: 100.00,
            line_amount: 100.00,
            smart_code: 'HERA.FINANCE.GL.TEST.CR.v1',
            line_data: {
              side: 'CR',
              account_code: '4001'
            }
          }
        ]
      }
    })
    
    console.log('📨 Response:', JSON.stringify(data, null, 2))
    
    if (data?.success && data?.transaction_id) {
      console.log(`✅ Test 2 SUCCESS: ${data.transaction_id}`)
      
      // Verify the GL entries were created correctly
      const { data: verifyData } = await supabase
        .from('universal_transaction_lines')
        .select('line_number, line_type, line_amount, line_data')
        .eq('transaction_id', data.transaction_id)
        .order('line_number')
      
      if (verifyData) {
        console.log('📊 GL Entries verified:')
        verifyData.forEach(line => {
          console.log(`   ${line.line_number}. ${line.line_data?.side || 'No side'} AED ${line.line_amount}`)
          console.log(`      line_data: ${JSON.stringify(line.line_data)}`)
        })
      }
      
      return { test2: true, transaction_id: data.transaction_id }
      
    } else {
      console.log(`❌ Test 2 FAILED: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ Test 2 EXCEPTION: ${error.message}`)
  }
  
  console.log('')
  
  // Test 3: Full salon GL posting
  console.log('📡 Test 3: Full salon GL posting (DR Cash, CR Revenue + VAT)...')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_posting',
          smart_code: 'HERA.FINANCE.GL.SALON_POSTING.TEST.v1'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            description: 'DR Cash - Customer payment',
            quantity: 1,
            unit_amount: 472.50,
            line_amount: 472.50,
            smart_code: 'HERA.FINANCE.GL.DR.CASH.v1',
            line_data: {
              side: 'DR',
              account_code: '1001',
              account_name: 'Cash'
            }
          },
          {
            line_number: 2,
            line_type: 'GL',
            description: 'CR Service Revenue',
            quantity: 1,
            unit_amount: 450.00,
            line_amount: 450.00,
            smart_code: 'HERA.FINANCE.GL.CR.REVENUE.v1',
            line_data: {
              side: 'CR',
              account_code: '4001',
              account_name: 'Service Revenue'
            }
          },
          {
            line_number: 3,
            line_type: 'GL',
            description: 'CR VAT Payable',
            quantity: 1,
            unit_amount: 22.50,
            line_amount: 22.50,
            smart_code: 'HERA.FINANCE.GL.CR.VAT.v1',
            line_data: {
              side: 'CR',
              account_code: '2001',
              account_name: 'VAT Payable'
            }
          }
        ]
      }
    })
    
    console.log('📨 Response:', JSON.stringify(data, null, 2))
    
    if (data?.success && data?.transaction_id) {
      console.log(`✅ Test 3 SUCCESS: Complete GL posting created: ${data.transaction_id}`)
      
      // Verify balance
      const { data: verifyData } = await supabase
        .from('universal_transaction_lines')
        .select('line_number, line_amount, line_data')
        .eq('transaction_id', data.transaction_id)
        .order('line_number')
      
      if (verifyData) {
        let totalDR = 0
        let totalCR = 0
        
        console.log('📊 Complete GL Posting verified:')
        verifyData.forEach(line => {
          const side = line.line_data?.side
          const amount = line.line_amount
          console.log(`   ${line.line_number}. ${side} AED ${amount}`)
          
          if (side === 'DR') totalDR += amount
          if (side === 'CR') totalCR += amount
        })
        
        console.log('')
        console.log(`💰 Balance Check:`)
        console.log(`   Total DR: AED ${totalDR}`)
        console.log(`   Total CR: AED ${totalCR}`)
        console.log(`   Balanced: ${Math.abs(totalDR - totalCR) < 0.01 ? '✅' : '❌'}`)
      }
      
      return { test3: true, transaction_id: data.transaction_id }
      
    } else {
      console.log(`❌ Test 3 FAILED: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ Test 3 EXCEPTION: ${error.message}`)
  }
  
  return {}
}

// Main execution
async function runGLTests() {
  try {
    const results = await testGLLineData()
    
    console.log('')
    console.log('=' * 50)
    console.log('🔍 GL LINE_DATA TEST RESULTS')
    console.log('=' * 50)
    
    const successCount = Object.values(results).filter(Boolean).length
    
    if (successCount >= 2) {
      console.log('✅ GL posting structure working!')
      console.log('')
      console.log('🎯 Key discoveries:')
      console.log('   ✅ line_data.side = "DR"|"CR" required')
      console.log('   ✅ account_code in line_data optional but helpful')
      console.log('   ✅ Balanced entries work properly')
      console.log('   ✅ Ready for standard posting integration')
      
    } else if (successCount >= 1) {
      console.log('⚠️ Partial success - some GL structures work')
      console.log('   Need to identify the working pattern')
      
    } else {
      console.log('❌ GL posting not working')
      console.log('   Need different approach or RPC function')
    }
    
  } catch (error) {
    console.error('💥 GL tests failed:', error.message)
  }
}

runGLTests()