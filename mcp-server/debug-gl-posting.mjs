#!/usr/bin/env node

/**
 * 🔍 DEBUG GL POSTING ISSUE
 * 
 * The GL posting failed in the standard transaction posting.
 * Let's debug the exact issue and fix it.
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

console.log('🔍 DEBUGGING GL POSTING ISSUE')
console.log('==============================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

// Get account IDs that we just created
async function getAccountIds() {
  console.log('📊 Finding GL account IDs...')
  
  const accounts = {}
  const accountTypes = [
    { key: 'CASH', name: 'Cash and Cash Equivalents' },
    { key: 'SERVICE_REVENUE', name: 'Service Revenue' },
    { key: 'VAT_PAYABLE', name: 'VAT Payable' }
  ]
  
  for (const account of accountTypes) {
    const { data } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', salonOrgId)
      .eq('entity_type', 'GL_ACCOUNT')
      .eq('entity_name', account.name)
      .single()
    
    if (data) {
      accounts[account.key] = data.id
      console.log(`   ✅ ${account.key}: ${data.id}`)
    } else {
      console.log(`   ❌ ${account.key}: Not found`)
    }
  }
  
  console.log('')
  return accounts
}

// Test different GL posting approaches
async function testGLPosting(accountIds) {
  console.log('🧪 Testing GL posting approaches...')
  
  if (!accountIds.CASH || !accountIds.SERVICE_REVENUE || !accountIds.VAT_PAYABLE) {
    console.log('❌ Missing required accounts, cannot test GL posting')
    return
  }
  
  const amount = 472.50
  const serviceAmount = 450.00
  const vatAmount = 22.50
  
  // Test 1: Simple GL entries with required fields only
  console.log('')
  console.log('📡 Test 1: Simple GL posting structure...')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_posting',
          smart_code: 'HERA.FINANCE.GL.POSTING.TEST.v1'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            entity_id: accountIds.CASH,
            description: 'Cash received',
            quantity: 1,
            unit_amount: amount,
            line_amount: amount,
            smart_code: 'HERA.FINANCE.GL.DEBIT.CASH.v1'
          },
          {
            line_number: 2,
            line_type: 'GL',
            entity_id: accountIds.SERVICE_REVENUE,
            description: 'Service revenue',
            quantity: 1,
            unit_amount: -serviceAmount, // Try negative for credit
            line_amount: -serviceAmount,
            smart_code: 'HERA.FINANCE.GL.CREDIT.REVENUE.v1'
          },
          {
            line_number: 3,
            line_type: 'GL',
            entity_id: accountIds.VAT_PAYABLE,
            description: 'VAT payable',
            quantity: 1,
            unit_amount: -vatAmount, // Try negative for credit
            line_amount: -vatAmount,
            smart_code: 'HERA.FINANCE.GL.CREDIT.VAT.v1'
          }
        ]
      }
    })
    
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data?.success) {
      console.log(`✅ Test 1 SUCCESS: GL posting created: ${data.transaction_id}`)
      return data.transaction_id
    } else {
      console.log(`❌ Test 1 FAILED: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ Test 1 EXCEPTION: ${error.message}`)
  }
  
  // Test 2: Try without entity_id in GL lines
  console.log('')
  console.log('📡 Test 2: GL posting without entity_id...')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_posting',
          smart_code: 'HERA.FINANCE.GL.POSTING.TEST2.v1'
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            description: 'DR Cash 1001',
            quantity: 1,
            unit_amount: amount,
            line_amount: amount,
            smart_code: 'HERA.FINANCE.GL.DEBIT.CASH.v1'
          },
          {
            line_number: 2,
            line_type: 'GL',
            description: 'CR Service Revenue 4001',
            quantity: 1,
            unit_amount: serviceAmount,
            line_amount: serviceAmount,
            smart_code: 'HERA.FINANCE.GL.CREDIT.REVENUE.v1'
          },
          {
            line_number: 3,
            line_type: 'GL',
            description: 'CR VAT Payable 2001',
            quantity: 1,
            unit_amount: vatAmount,
            line_amount: vatAmount,
            smart_code: 'HERA.FINANCE.GL.CREDIT.VAT.v1'
          }
        ]
      }
    })
    
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data?.success) {
      console.log(`✅ Test 2 SUCCESS: GL posting created: ${data.transaction_id}`)
      return data.transaction_id
    } else {
      console.log(`❌ Test 2 FAILED: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ Test 2 EXCEPTION: ${error.message}`)
  }
  
  // Test 3: Try as regular transaction with GL line types
  console.log('')
  console.log('📡 Test 3: Regular transaction with GL lines...')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'accounting',
          smart_code: 'HERA.FINANCE.ACCOUNTING.TEST3.v1',
          total_amount: 0, // Balanced GL should be zero net
          transaction_code: `GL-TEST3-${Date.now()}`
        },
        lines: [
          {
            line_number: 1,
            line_type: 'GL',
            description: 'GL Entry: DR Cash',
            quantity: 1,
            unit_amount: amount,
            line_amount: amount,
            smart_code: 'HERA.FINANCE.GL.DEBIT.CASH.v1'
          },
          {
            line_number: 2,
            line_type: 'GL',
            description: 'GL Entry: CR Revenue',
            quantity: 1,
            unit_amount: serviceAmount,
            line_amount: serviceAmount,
            smart_code: 'HERA.FINANCE.GL.CREDIT.REVENUE.v1'
          },
          {
            line_number: 3,
            line_type: 'GL',
            description: 'GL Entry: CR VAT',
            quantity: 1,
            unit_amount: vatAmount,
            line_amount: vatAmount,
            smart_code: 'HERA.FINANCE.GL.CREDIT.VAT.v1'
          }
        ]
      }
    })
    
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (data?.success) {
      console.log(`✅ Test 3 SUCCESS: GL posting created: ${data.transaction_id}`)
      return data.transaction_id
    } else {
      console.log(`❌ Test 3 FAILED: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ Test 3 EXCEPTION: ${error.message}`)
  }
  
  return null
}

// Verify any successful GL posting
async function verifyGLPosting(glTransactionId) {
  if (!glTransactionId) {
    console.log('⚠️ No GL transaction to verify')
    return
  }
  
  console.log('')
  console.log(`🔍 Verifying GL posting: ${glTransactionId}`)
  
  // Check transaction header
  const { data: headerData } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_code, total_amount, created_at')
    .eq('id', glTransactionId)
    .single()
  
  if (headerData) {
    console.log('✅ GL Transaction verified:')
    console.log(`   Type: ${headerData.transaction_type}`)
    console.log(`   Code: ${headerData.transaction_code}`)
    console.log(`   Amount: ${headerData.total_amount}`)
    console.log(`   Created: ${headerData.created_at}`)
  }
  
  // Check GL lines
  const { data: linesData } = await supabase
    .from('universal_transaction_lines')
    .select('line_number, line_type, description, line_amount, entity_id')
    .eq('transaction_id', glTransactionId)
    .order('line_number')
  
  if (linesData && linesData.length > 0) {
    console.log('')
    console.log('✅ GL Lines verified:')
    linesData.forEach(line => {
      console.log(`   ${line.line_number}. ${line.description}`)
      console.log(`      Amount: ${line.line_amount}, Entity: ${line.entity_id || 'N/A'}`)
    })
    
    const totalAmount = linesData.reduce((sum, line) => sum + line.line_amount, 0)
    console.log('')
    console.log(`📊 Line Total: ${totalAmount} (should be 0 for balanced GL)`)
  }
}

// Main execution
async function debugGLPosting() {
  try {
    const accountIds = await getAccountIds()
    const glTransactionId = await testGLPosting(accountIds)
    await verifyGLPosting(glTransactionId)
    
    console.log('')
    console.log('=' * 50)
    console.log('🔍 GL POSTING DEBUG RESULTS')
    console.log('=' * 50)
    
    if (glTransactionId) {
      console.log('✅ GL posting working!')
      console.log(`   Transaction ID: ${glTransactionId}`)
      console.log('   Can integrate into standard posting')
    } else {
      console.log('❌ GL posting not working')
      console.log('   Need to investigate transaction structure')
      console.log('   May need different approach or schema')
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message)
  }
}

debugGLPosting()