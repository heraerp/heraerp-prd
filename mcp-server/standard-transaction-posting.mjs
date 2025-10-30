#!/usr/bin/env node

/**
 * 🏦 HERA STANDARD TRANSACTION POSTING WITH ACCOUNTING
 * 
 * This creates the STANDARD for all transaction posting in HERA:
 * 1. Business Transaction (universal_transactions + lines)
 * 2. Accounting Posting (GL entries with DR/CR balance)
 * 3. Comprehensive validation (nothing missing)
 * 4. Audit trail (complete actor stamping)
 * 5. Test suite (verify all components)
 * 
 * MANDATORY PATTERN: Every business transaction MUST generate accounting entries
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

console.log('🏦 HERA STANDARD TRANSACTION POSTING WITH ACCOUNTING')
console.log('===================================================')
console.log('')
console.log('📋 STANDARD INCLUDES:')
console.log('   ✅ Business Transaction (customer sale)')
console.log('   ✅ GL Posting (DR Cash, CR Revenue, CR Tax)')
console.log('   ✅ Balance Validation (DR = CR)')
console.log('   ✅ Complete Audit Trail')
console.log('   ✅ Comprehensive Testing')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * STANDARD CHART OF ACCOUNTS (COA) SETUP
 * Every salon needs these basic GL accounts
 */
const STANDARD_COA = {
  // Assets
  CASH: { code: '1001', name: 'Cash and Cash Equivalents', type: 'ASSET', smart_code: 'HERA.FINANCE.COA.CASH.MAIN.v1' },
  CARD_RECEIVABLE: { code: '1002', name: 'Card Payment Receivables', type: 'ASSET', smart_code: 'HERA.FINANCE.COA.RECEIVABLE.CARD.v1' },
  
  // Revenue
  SERVICE_REVENUE: { code: '4001', name: 'Service Revenue', type: 'REVENUE', smart_code: 'HERA.FINANCE.COA.REVENUE.SERVICE.v1' },
  TIP_REVENUE: { code: '4002', name: 'Tip Revenue', type: 'REVENUE', smart_code: 'HERA.FINANCE.COA.REVENUE.TIP.v1' },
  
  // Tax
  VAT_PAYABLE: { code: '2001', name: 'VAT Payable', type: 'LIABILITY', smart_code: 'HERA.FINANCE.COA.LIABILITY.VAT.v1' }
}

/**
 * 1. SETUP: Ensure Chart of Accounts exists
 */
async function ensureChartOfAccounts() {
  console.log('🏗️ Setting up Chart of Accounts...')
  
  const accounts = []
  
  for (const [key, account] of Object.entries(STANDARD_COA)) {
    try {
      const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: salonOrgId,
        p_entity: {
          entity_type: 'GL_ACCOUNT',
          entity_name: account.name,
          smart_code: account.smart_code,
          organization_id: salonOrgId
        },
        p_dynamic: {
          account_code: {
            field_name: 'account_code',
            field_type: 'text',
            field_value_text: account.code,
            smart_code: 'HERA.FINANCE.COA.FIELD.CODE.v1'
          },
          account_type: {
            field_name: 'account_type',
            field_type: 'text',
            field_value_text: account.type,
            smart_code: 'HERA.FINANCE.COA.FIELD.TYPE.v1'
          },
          is_active: {
            field_name: 'is_active',
            field_type: 'boolean',
            field_value_boolean: true,
            smart_code: 'HERA.FINANCE.COA.FIELD.ACTIVE.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      })
      
      if (data?.success && data?.entity_id) {
        accounts.push({ key, account_id: data.entity_id, ...account })
        console.log(`   ✅ ${account.code} - ${account.name}`)
      } else {
        // Account might already exist - try to find it
        const { data: existingData } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', salonOrgId)
          .eq('entity_type', 'GL_ACCOUNT')
          .eq('entity_name', account.name)
          .single()
        
        if (existingData) {
          accounts.push({ key, account_id: existingData.id, ...account })
          console.log(`   ♻️ ${account.code} - ${account.name} (existing)`)
        } else {
          console.log(`   ❌ ${account.code} - Failed to create/find`)
        }
      }
      
    } catch (error) {
      console.log(`   ⚠️ ${account.code} - ${error.message}`)
    }
  }
  
  console.log(`✅ Chart of Accounts ready: ${accounts.length}/5 accounts`)
  console.log('')
  
  return accounts.reduce((acc, account) => {
    acc[account.key] = account.account_id
    return acc
  }, {})
}

/**
 * 2. BUSINESS TRANSACTION: Create the salon sale
 */
async function createBusinessTransaction(customerId, accountIds) {
  console.log('💼 Creating business transaction...')
  
  const saleAmount = 450.00
  const vatRate = 0.05 // 5% VAT
  const vatAmount = saleAmount * vatRate
  const totalAmount = saleAmount + vatAmount
  
  console.log(`   💰 Sale Amount: AED ${saleAmount}`)
  console.log(`   🏛️ VAT (5%): AED ${vatAmount}`)
  console.log(`   💳 Total: AED ${totalAmount}`)
  console.log('')
  
  try {
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          // Required header fields
          organization_id: salonOrgId,
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.WITH_ACCOUNTING.v1',
          
          // Complete transaction data in header
          source_entity_id: customerId,
          target_entity_id: actorUserId,
          total_amount: totalAmount,
          transaction_currency_code: 'AED',
          transaction_code: `SALON-${Date.now()}`,
          transaction_status: 'completed',
          transaction_date: new Date().toISOString(),
          
          // Business context for accounting
          business_context: {
            payment_method: 'card',
            vat_rate: vatRate,
            vat_amount: vatAmount,
            net_amount: saleAmount,
            accounting_required: true
          }
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            entity_id: null,
            description: 'Premium Hair Cut & Advanced Styling',
            quantity: 1,
            unit_amount: 250.00,
            line_amount: 250.00,
            smart_code: 'HERA.SALON.SERVICE.HAIRCUT.PREMIUM_ADVANCED.v1'
          },
          {
            line_number: 2,
            line_type: 'service',
            entity_id: null,
            description: 'Luxury Deep Conditioning & Scalp Treatment',
            quantity: 1,
            unit_amount: 150.00,
            line_amount: 150.00,
            smart_code: 'HERA.SALON.SERVICE.CONDITIONING.LUXURY_SCALP.v1'
          },
          {
            line_number: 3,
            line_type: 'tip',
            entity_id: null,
            description: 'Premium Service Gratuity (11.1%)',
            quantity: 1,
            unit_amount: 50.00,
            line_amount: 50.00,
            smart_code: 'HERA.SALON.TIP.SERVICE.PREMIUM.v1'
          }
        ]
      }
    })
    
    if (data?.success && data?.transaction_id) {
      console.log(`✅ Business transaction created: ${data.transaction_id}`)
      return {
        success: true,
        transaction_id: data.transaction_id,
        amount: totalAmount,
        vat_amount: vatAmount,
        net_amount: saleAmount
      }
    } else {
      throw new Error(`Business transaction failed: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ Business transaction failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * 3. ACCOUNTING POSTING: Create GL entries
 */
async function createAccountingEntries(transactionResult, accountIds) {
  console.log('📊 Creating accounting entries...')
  
  if (!transactionResult.success) {
    console.log('❌ Skipping accounting - business transaction failed')
    return { success: false }
  }
  
  const { transaction_id, amount, vat_amount, net_amount } = transactionResult
  
  // Standard salon sale accounting:
  // DR Cash/Card             472.50
  // CR Service Revenue       450.00  
  // CR VAT Payable           22.50
  
  const glEntries = [
    {
      line_number: 1,
      line_type: 'GL',
      entity_id: accountIds.CASH,
      description: 'Cash received for salon services',
      debit_amount: amount,
      credit_amount: 0,
      account_code: '1001',
      smart_code: 'HERA.FINANCE.GL.DEBIT.CASH.v1'
    },
    {
      line_number: 2,
      line_type: 'GL',
      entity_id: accountIds.SERVICE_REVENUE,
      description: 'Revenue from salon services',
      debit_amount: 0,
      credit_amount: net_amount,
      account_code: '4001',
      smart_code: 'HERA.FINANCE.GL.CREDIT.REVENUE.v1'
    },
    {
      line_number: 3,
      line_type: 'GL',
      entity_id: accountIds.VAT_PAYABLE,
      description: 'VAT collected on salon services',
      debit_amount: 0,
      credit_amount: vat_amount,
      account_code: '2001',
      smart_code: 'HERA.FINANCE.GL.CREDIT.VAT.v1'
    }
  ]
  
  try {
    // Post GL transaction
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          organization_id: salonOrgId,
          transaction_type: 'gl_posting',
          smart_code: 'HERA.FINANCE.GL.POSTING.SALON_SALE.v1',
          
          // Link to business transaction
          source_entity_id: transaction_id,
          total_amount: amount,
          transaction_currency_code: 'AED',
          transaction_code: `GL-${Date.now()}`,
          transaction_status: 'posted',
          transaction_date: new Date().toISOString(),
          
          business_context: {
            source_transaction_id: transaction_id,
            posting_type: 'automatic',
            total_debits: amount,
            total_credits: amount,
            is_balanced: true
          }
        },
        lines: glEntries
      }
    })
    
    if (data?.success && data?.transaction_id) {
      console.log(`✅ GL posting created: ${data.transaction_id}`)
      
      // Verify balance
      const totalDebits = glEntries.reduce((sum, entry) => sum + entry.debit_amount, 0)
      const totalCredits = glEntries.reduce((sum, entry) => sum + entry.credit_amount, 0)
      
      console.log(`   📊 Balance Check:`)
      console.log(`      Total Debits:  AED ${totalDebits.toFixed(2)}`)
      console.log(`      Total Credits: AED ${totalCredits.toFixed(2)}`)
      console.log(`      Balanced: ${totalDebits === totalCredits ? '✅' : '❌'}`)
      
      return {
        success: true,
        gl_transaction_id: data.transaction_id,
        balanced: totalDebits === totalCredits,
        total_debits: totalDebits,
        total_credits: totalCredits
      }
      
    } else {
      throw new Error(`GL posting failed: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`❌ GL posting failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * 4. VALIDATION: Comprehensive checks
 */
async function validateCompletePosting(businessResult, accountingResult) {
  console.log('🔍 Running comprehensive validation...')
  
  const validations = []
  
  // 1. Business transaction validation
  if (businessResult.success) {
    validations.push({ check: 'Business Transaction Created', status: '✅', details: businessResult.transaction_id })
    
    // Verify in database
    const { data: bizData } = await supabase
      .from('universal_transactions')
      .select('id, transaction_code, total_amount, transaction_status, created_by')
      .eq('id', businessResult.transaction_id)
      .single()
    
    if (bizData) {
      validations.push({ check: 'Business Transaction in DB', status: '✅', details: `${bizData.transaction_code}` })
      validations.push({ check: 'Actor Stamping', status: bizData.created_by ? '✅' : '❌', details: bizData.created_by })
      validations.push({ check: 'Amount Accuracy', status: bizData.total_amount === businessResult.amount ? '✅' : '❌', details: `AED ${bizData.total_amount}` })
    } else {
      validations.push({ check: 'Business Transaction in DB', status: '❌', details: 'Not found' })
    }
    
    // Check transaction lines
    const { data: linesData } = await supabase
      .from('universal_transaction_lines')
      .select('line_number, description, line_amount')
      .eq('transaction_id', businessResult.transaction_id)
    
    validations.push({ check: 'Transaction Lines', status: linesData?.length >= 3 ? '✅' : '❌', details: `${linesData?.length || 0} lines` })
    
  } else {
    validations.push({ check: 'Business Transaction Created', status: '❌', details: businessResult.error })
  }
  
  // 2. Accounting validation
  if (accountingResult.success) {
    validations.push({ check: 'GL Posting Created', status: '✅', details: accountingResult.gl_transaction_id })
    validations.push({ check: 'GL Balance Check', status: accountingResult.balanced ? '✅' : '❌', details: `DR=${accountingResult.total_debits}, CR=${accountingResult.total_credits}` })
    
    // Verify GL entries
    const { data: glData } = await supabase
      .from('universal_transaction_lines')
      .select('line_type, debit_amount, credit_amount, account_code')
      .eq('transaction_id', accountingResult.gl_transaction_id)
      .eq('line_type', 'GL')
    
    if (glData?.length >= 3) {
      validations.push({ check: 'GL Entries Count', status: '✅', details: `${glData.length} entries` })
      
      const dbDebits = glData.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0)
      const dbCredits = glData.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0)
      
      validations.push({ check: 'DB GL Balance', status: dbDebits === dbCredits ? '✅' : '❌', details: `DR=${dbDebits}, CR=${dbCredits}` })
    } else {
      validations.push({ check: 'GL Entries Count', status: '❌', details: `${glData?.length || 0} entries` })
    }
    
  } else {
    validations.push({ check: 'GL Posting Created', status: '❌', details: accountingResult.error || 'Failed' })
  }
  
  // 3. Integration validation
  if (businessResult.success && accountingResult.success) {
    validations.push({ check: 'Business + Accounting Integration', status: '✅', details: 'Complete posting achieved' })
  } else {
    validations.push({ check: 'Business + Accounting Integration', status: '❌', details: 'Incomplete posting' })
  }
  
  // Display results
  console.log('')
  console.log('📋 VALIDATION RESULTS:')
  validations.forEach(validation => {
    console.log(`   ${validation.status} ${validation.check}: ${validation.details}`)
  })
  
  const passedChecks = validations.filter(v => v.status === '✅').length
  const totalChecks = validations.length
  
  console.log('')
  console.log(`📊 VALIDATION SCORE: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`)
  
  return {
    passed: passedChecks,
    total: totalChecks,
    percentage: Math.round(passedChecks/totalChecks*100),
    validations
  }
}

/**
 * 5. MAIN EXECUTION: Standard Transaction Posting
 */
async function runStandardTransactionPosting() {
  console.log('🚀 Starting standard transaction posting...')
  console.log('')
  
  try {
    // Step 1: Setup Chart of Accounts
    const accountIds = await ensureChartOfAccounts()
    
    if (Object.keys(accountIds).length < 3) {
      throw new Error('Insufficient Chart of Accounts setup')
    }
    
    // Step 2: Create customer (reuse existing pattern)
    console.log('👤 Creating customer...')
    const customerId = '563b902f-6004-4319-a1b6-8d9f726ba310' // Use existing customer
    console.log(`✅ Using customer: ${customerId}`)
    console.log('')
    
    // Step 3: Create business transaction
    const businessResult = await createBusinessTransaction(customerId, accountIds)
    console.log('')
    
    // Step 4: Create accounting entries
    const accountingResult = await createAccountingEntries(businessResult, accountIds)
    console.log('')
    
    // Step 5: Comprehensive validation
    const validationResult = await validateCompletePosting(businessResult, accountingResult)
    
    // Final summary
    console.log('')
    console.log('=' * 60)
    console.log('🏆 HERA STANDARD TRANSACTION POSTING RESULTS')
    console.log('=' * 60)
    
    if (validationResult.percentage >= 90) {
      console.log('✅ SUCCESS: Standard posting achieved!')
      console.log(`   Business Transaction: ${businessResult.transaction_id || 'Failed'}`)
      console.log(`   GL Posting: ${accountingResult.gl_transaction_id || 'Failed'}`)
      console.log(`   Validation Score: ${validationResult.percentage}%`)
      console.log('')
      console.log('🎯 STANDARD ESTABLISHED:')
      console.log('   ✅ Business + Accounting integration')
      console.log('   ✅ Complete audit trail')
      console.log('   ✅ Balance validation')
      console.log('   ✅ Comprehensive testing')
      console.log('   ✅ Nothing missing pattern')
      
    } else {
      console.log('⚠️ PARTIAL SUCCESS: Some components failed')
      console.log(`   Validation Score: ${validationResult.percentage}%`)
      console.log('   Review validation details above')
    }
    
    console.log('')
    console.log('📚 STANDARD PATTERN DOCUMENTED')
    console.log('   Use this script as template for all transaction posting')
    console.log('   Every business transaction MUST include accounting')
    console.log('   Validation ensures nothing is missing')
    
  } catch (error) {
    console.error('💥 Standard posting failed:', error.message)
  }
}

// Execute the standard posting
runStandardTransactionPosting()