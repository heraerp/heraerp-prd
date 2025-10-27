#!/usr/bin/env node

/**
 * 🔍 DEBUG MISSING GL LINES ISSUE
 * 
 * The GL transactions are created but lines are missing.
 * Let's debug why the transaction lines aren't being created.
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

console.log('🔍 DEBUG MISSING GL LINES ISSUE')
console.log('=================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMissingGLLines() {
  // Check existing GL transactions
  console.log('📊 Checking existing GL transactions...')
  
  const { data: glTransactions } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_code, smart_code, created_at')
    .eq('organization_id', salonOrgId)
    .in('transaction_type', ['GL_POSTING', 'GL_ENTRY'])
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (glTransactions?.length > 0) {
    console.log(`Found ${glTransactions.length} GL transactions:`)
    glTransactions.forEach(txn => {
      console.log(`   ${txn.id} - ${txn.transaction_type} - ${txn.smart_code}`)
    })
    console.log('')
    
    // Check lines for each transaction
    for (const txn of glTransactions) {
      console.log(`🔍 Checking lines for ${txn.id}...`)
      
      const { data: lines } = await supabase
        .from('universal_transaction_lines')
        .select('line_number, line_type, description, line_amount, line_data')
        .eq('transaction_id', txn.id)
        .order('line_number')
      
      if (lines?.length > 0) {
        console.log(`   ✅ Found ${lines.length} lines:`)
        lines.forEach(line => {
          console.log(`      ${line.line_number}. ${line.line_type}: ${line.description} - AED ${line.line_amount}`)
          console.log(`         line_data: ${JSON.stringify(line.line_data)}`)
        })
      } else {
        console.log(`   ❌ No lines found for this transaction`)
      }
      console.log('')
    }
  }
  
  // Test creating a GL transaction with verbose response
  console.log('🧪 Testing GL transaction creation with full response...')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_entry',
          smart_code: 'HERA.FINANCE.GL.DEBUG_LINES.v1'
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
              side: 'DR',
              account_code: '1001'
            }
          },
          {
            line_number: 2,
            line_type: 'GL',
            description: 'Test CR Entry',
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
    
    console.log('📨 Full RPC Response:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')
    
    if (error) {
      console.log('💥 Supabase Error:')
      console.log(JSON.stringify(error, null, 2))
      console.log('')
    }
    
    if (data?.success && data?.transaction_id) {
      console.log(`✅ Transaction created: ${data.transaction_id}`)
      
      // Check if lines were actually created
      console.log('🔍 Immediate line verification...')
      
      const { data: immediateLines } = await supabase
        .from('universal_transaction_lines')
        .select('line_number, line_type, description, line_amount, line_data, created_at')
        .eq('transaction_id', data.transaction_id)
        .order('line_number')
      
      if (immediateLines?.length > 0) {
        console.log(`✅ SUCCESS: ${immediateLines.length} lines created immediately`)
        immediateLines.forEach(line => {
          console.log(`   ${line.line_number}. ${line.line_type}: ${line.description}`)
          console.log(`      Amount: AED ${line.line_amount}`)
          console.log(`      Data: ${JSON.stringify(line.line_data)}`)
          console.log(`      Created: ${line.created_at}`)
        })
        
        return { success: true, transaction_id: data.transaction_id, lines_count: immediateLines.length }
        
      } else {
        console.log(`❌ PROBLEM: Transaction created but NO LINES found`)
        console.log('   This suggests the RPC function is not creating the lines')
        
        // Check if the transaction itself was created
        const { data: headerCheck } = await supabase
          .from('universal_transactions')
          .select('id, transaction_type, smart_code')
          .eq('id', data.transaction_id)
          .single()
        
        if (headerCheck) {
          console.log(`   Transaction header exists: ${headerCheck.transaction_type}`)
          console.log(`   Smart code: ${headerCheck.smart_code}`)
        } else {
          console.log(`   Transaction header NOT found - RPC may have failed`)
        }
        
        return { success: false, error: 'Lines not created' }
      }
      
    } else {
      console.log('❌ Transaction creation failed')
      console.log(`   Error: ${data?.error || 'Unknown error'}`)
      return { success: false, error: data?.error || 'Transaction creation failed' }
    }
    
  } catch (error) {
    console.log(`💥 Exception: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Check RPC function signature
async function checkRPCSignature() {
  console.log('🔍 Checking RPC function signature...')
  
  try {
    // Try to get function info from pg_proc
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'hera_txn_crud_v1')
      .single()
    
    if (data) {
      console.log(`✅ Function found: ${data.proname}`)
      console.log(`   Source length: ${data.prosrc?.length || 0} characters`)
    } else {
      console.log('❌ Function not found or accessible')
    }
    
  } catch (error) {
    console.log(`⚠️ Cannot check function signature: ${error.message}`)
  }
}

// Main execution
async function runDebug() {
  try {
    await checkRPCSignature()
    console.log('')
    
    const result = await debugMissingGLLines()
    
    console.log('')
    console.log('=' * 60)
    console.log('🔍 MISSING GL LINES DEBUG RESULTS')
    console.log('=' * 60)
    
    if (result?.success) {
      console.log('✅ GL lines are being created properly!')
      console.log(`   Transaction: ${result.transaction_id}`)
      console.log(`   Lines created: ${result.lines_count}`)
      console.log('')
      console.log('🎯 The issue may be in our previous tests or validation logic')
      
    } else {
      console.log('❌ GL lines are NOT being created')
      console.log(`   Error: ${result?.error || 'Unknown'}`)
      console.log('')
      console.log('🔧 Possible causes:')
      console.log('   1. RPC function bug in line creation logic')
      console.log('   2. Database constraint preventing line inserts')
      console.log('   3. Transaction rollback due to validation failure')
      console.log('   4. Permissions issue with line table')
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message)
  }
}

runDebug()