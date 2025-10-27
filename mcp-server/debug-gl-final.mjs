#!/usr/bin/env node

/**
 * 🔍 DEBUG GL POSTING FINAL - EXACT ERROR DETECTION
 * 
 * The business transaction is working perfectly but GL posting fails.
 * Let's get the exact error message and fix it.
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

console.log('🔍 DEBUG GL POSTING FINAL - EXACT ERROR DETECTION')
console.log('==================================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugGLPostingExact() {
  console.log('🧪 Testing exact GL posting structure that worked before...')
  console.log('')
  
  const total_amount = 472.50
  const service_amount = 450.00
  const vat_amount = 22.50
  
  console.log(`Testing with: DR ${total_amount} = CR ${service_amount + vat_amount}`)
  console.log('')
  
  try {
    console.log('📡 Calling hera_txn_crud_v1 with exact structure...')
    
    const payload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_posting',
          smart_code: 'HERA.FINANCE.GL.POSTING.DEBUG_FINAL.v1'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            description: 'DR Cash - Customer payment received',
            quantity: 1,
            unit_amount: total_amount,
            line_amount: total_amount,
            smart_code: 'HERA.FINANCE.GL.DR.CASH.v1',
            line_data: {
              side: 'DR',
              account_code: '1001',
              account_name: 'Cash and Cash Equivalents'
            }
          },
          {
            line_number: 2,
            line_type: 'GL',
            description: 'CR Service Revenue - Salon services',
            quantity: 1,
            unit_amount: service_amount,
            line_amount: service_amount,
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
            description: 'CR VAT Payable - Tax collected',
            quantity: 1,
            unit_amount: vat_amount,
            line_amount: vat_amount,
            smart_code: 'HERA.FINANCE.GL.CR.VAT.v1',
            line_data: {
              side: 'CR',
              account_code: '2001',
              account_name: 'VAT Payable'
            }
          }
        ]
      }
    }
    
    console.log('📋 Payload structure:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('')
    
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', payload)
    
    console.log('📨 Full Response:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')
    
    if (error) {
      console.log('💥 Supabase Error:')
      console.log(JSON.stringify(error, null, 2))
      console.log('')
    }
    
    if (data?.success && data?.transaction_id) {
      console.log(`✅ SUCCESS: GL posting created: ${data.transaction_id}`)
      
      // Verify immediately
      const { data: verifyData } = await supabase
        .from('universal_transaction_lines')
        .select('line_number, line_amount, line_data')
        .eq('transaction_id', data.transaction_id)
        .order('line_number')
      
      if (verifyData) {
        let totalDR = 0
        let totalCR = 0
        
        console.log('✅ GL entries verified:')
        verifyData.forEach(line => {
          const side = line.line_data?.side
          const amount = line.line_amount
          console.log(`   ${line.line_number}. ${side} AED ${amount}`)
          
          if (side === 'DR') totalDR += amount
          if (side === 'CR') totalCR += amount
        })
        
        console.log('')
        console.log(`📊 Final Balance:`)
        console.log(`   Total DR: AED ${totalDR}`)
        console.log(`   Total CR: AED ${totalCR}`)
        console.log(`   Balanced: ${Math.abs(totalDR - totalCR) < 0.01 ? '✅' : '❌'}`)
      }
      
      return true
      
    } else {
      console.log(`❌ GL POSTING FAILED`)
      console.log('')
      
      if (data?.error) {
        console.log('🔍 Detailed Error Analysis:')
        console.log(`   Error: ${data.error}`)
        
        if (data.error.includes('BALANCE')) {
          console.log('   💡 Issue: Balance validation failed')
          console.log('   🔧 Fix: Ensure total DR = total CR exactly')
        } else if (data.error.includes('SIDE')) {
          console.log('   💡 Issue: Missing or invalid line_data.side')
          console.log('   🔧 Fix: Ensure all GL lines have side = "DR"|"CR"')
        } else if (data.error.includes('REQUIRED')) {
          console.log('   💡 Issue: Missing required field')
          console.log('   🔧 Fix: Check all mandatory parameters')
        } else if (data.error.includes('CONSTRAINT')) {
          console.log('   💡 Issue: Database constraint violation')
          console.log('   🔧 Fix: Check foreign keys and data types')
        } else {
          console.log('   💡 Issue: Unknown error')
          console.log('   🔧 Fix: Check RPC function deployment')
        }
      }
      
      return false
    }
    
  } catch (error) {
    console.log(`💥 Exception: ${error.message}`)
    return false
  }
}

// Main execution
async function runFinalDebug() {
  try {
    const success = await debugGLPostingExact()
    
    console.log('')
    console.log('=' * 60)
    console.log('🔍 FINAL GL POSTING DEBUG RESULTS')
    console.log('=' * 60)
    
    if (success) {
      console.log('✅ GL POSTING IS WORKING!')
      console.log('')
      console.log('🎯 Key Success Factors:')
      console.log('   ✅ Balanced entries (DR = CR)')
      console.log('   ✅ line_data.side = "DR"|"CR"')
      console.log('   ✅ Proper transaction_type = "gl_posting"')
      console.log('   ✅ Smart codes follow HERA patterns')
      console.log('')
      console.log('🚀 READY TO INTEGRATE INTO STANDARD POSTING!')
      
    } else {
      console.log('❌ GL posting still has issues')
      console.log('')
      console.log('🔧 Next Steps:')
      console.log('   1. Review detailed error above')
      console.log('   2. Check RPC function deployment')
      console.log('   3. Verify balance calculations')
      console.log('   4. Test simpler GL structure')
    }
    
  } catch (error) {
    console.error('💥 Final debug failed:', error.message)
  }
}

runFinalDebug()