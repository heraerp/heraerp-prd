#!/usr/bin/env node

/**
 * 🔧 FIX TRANSACTION DATA - COMPLETE PAYLOAD
 * 
 * The transaction was created but missing critical data because
 * the RPC function only reads from header, not transaction section.
 * Let's put ALL data in the header section.
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

console.log('🔧 FIX TRANSACTION DATA - COMPLETE PAYLOAD')
console.log('=========================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

// Use existing customer
const customerId = '563b902f-6004-4319-a1b6-8d9f726ba310'

async function postCompleteTransaction() {
  console.log('🚀 Posting transaction with ALL data in header section...')
  console.log('')
  
  // Database state before
  const { data: beforeData } = await supabase
    .from('universal_transactions')
    .select('id', { count: 'exact' })
    .eq('organization_id', salonOrgId)
  
  const transactionsBefore = beforeData?.length || 0
  console.log(`📊 Transactions before: ${transactionsBefore}`)
  console.log('')
  
  try {
    console.log('📡 Calling hera_txn_crud_v1 with complete header data...')
    
    const payload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_payload: {
        header: {
          // Required fields we discovered
          organization_id: salonOrgId,
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.COMPLETE_DATA.v1',
          
          // ALL transaction data in header (since that's what RPC reads)
          source_entity_id: customerId,
          target_entity_id: actorUserId,
          total_amount: 450.00,
          transaction_status: 'completed',
          transaction_currency_code: 'AED',
          transaction_date: new Date().toISOString(),
          transaction_code: `COMPLETE-${Date.now()}`,
          
          // Business context
          business_context: {
            service_category: 'premium_salon',
            stylist: 'Actor Stylist',
            customer_tier: 'regular',
            appointment_type: 'walk_in'
          }
        },
        // Duplicate in transaction section for completeness
        transaction: {
          transaction_type: 'sale',
          smart_code: 'HERA.SALON.TXN.SALE.COMPLETE_DATA.v1',
          source_entity_id: customerId,
          target_entity_id: actorUserId,
          total_amount: 450.00,
          transaction_status: 'completed',
          transaction_currency_code: 'AED',
          transaction_date: new Date().toISOString(),
          transaction_code: `COMPLETE-${Date.now()}`
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
            description: 'Premium Service Gratuity (10%)',
            quantity: 1,
            unit_amount: 50.00,
            line_amount: 50.00,
            smart_code: 'HERA.SALON.TIP.SERVICE.PREMIUM.v1'
          }
        ]
      }
    }
    
    console.log('✅ Enhanced payload structure:')
    console.log('   Header: ALL transaction data included')
    console.log('   - Customer ID, Stylist ID, Amount, Currency, Code')
    console.log('   - Business context and metadata')
    console.log('   Transaction: Duplicate data for compatibility')
    console.log('   Lines: 3 detailed service lines')
    console.log('')
    
    const { data, error } = await supabase.rpc('hera_txn_crud_v1', payload)
    
    console.log('📨 Response:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')
    
    if (data?.success) {
      const transactionId = data.transaction_id
      
      if (transactionId) {
        console.log(`🎉 ENHANCED TRANSACTION CREATED: ${transactionId}`)
        
        // Verify complete data in database
        console.log('🔍 Verifying complete transaction data...')
        const { data: verifyData, error: verifyError } = await supabase
          .from('universal_transactions')
          .select(`
            id, 
            transaction_type, 
            transaction_code,
            source_entity_id,
            target_entity_id,
            total_amount, 
            transaction_status,
            transaction_currency_code,
            created_at, 
            created_by,
            smart_code,
            business_context
          `)
          .eq('id', transactionId)
          .single()
        
        if (!verifyError && verifyData) {
          console.log('✅ COMPLETE TRANSACTION DATA VERIFIED:')
          console.log(`   🆔 ID: ${verifyData.id}`)
          console.log(`   📝 Code: ${verifyData.transaction_code || 'Missing'}`)
          console.log(`   🎯 Type: ${verifyData.transaction_type}`)
          console.log(`   👤 Customer: ${verifyData.source_entity_id || 'Missing'}`)
          console.log(`   👨‍💼 Stylist: ${verifyData.target_entity_id || 'Missing'}`)
          console.log(`   💰 Amount: ${verifyData.total_amount ? `AED ${verifyData.total_amount}` : 'Missing'}`)
          console.log(`   💱 Currency: ${verifyData.transaction_currency_code || 'Missing'}`)
          console.log(`   📊 Status: ${verifyData.transaction_status}`)
          console.log(`   🧬 Smart Code: ${verifyData.smart_code}`)
          console.log(`   🏢 Context: ${JSON.stringify(verifyData.business_context)}`)
          console.log(`   🕒 Created: ${verifyData.created_at}`)
          
          // Check if all critical fields are now populated
          const missingFields = []
          if (!verifyData.transaction_code) missingFields.push('transaction_code')
          if (!verifyData.source_entity_id) missingFields.push('source_entity_id')
          if (!verifyData.target_entity_id) missingFields.push('target_entity_id')
          if (!verifyData.total_amount || verifyData.total_amount == 0) missingFields.push('total_amount')
          if (!verifyData.transaction_currency_code) missingFields.push('currency_code')
          
          if (missingFields.length === 0) {
            console.log('')
            console.log('🎉 SUCCESS: ALL CRITICAL FIELDS POPULATED!')
            console.log('✅ Complete salon transaction with all business data')
            
          } else {
            console.log('')
            console.log(`⚠️ Still missing: ${missingFields.join(', ')}`)
            console.log('🔧 RPC function may not be reading from header correctly')
          }
          
          return transactionId
          
        } else {
          console.log('⚠️ Transaction created but verification failed')
        }
        
      } else {
        console.log('⚠️ Success but no transaction ID returned')
      }
      
    } else {
      console.log(`❌ Transaction creation failed: ${data?.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.log(`💥 Exception: ${error.message}`)
  }
  
  // Final database check
  const { data: afterData } = await supabase
    .from('universal_transactions')
    .select('id', { count: 'exact' })
    .eq('organization_id', salonOrgId)
  
  const transactionsAfter = afterData?.length || 0
  console.log('')
  console.log(`📊 Final transaction count: ${transactionsAfter}`)
  console.log(`📈 Net change: ${transactionsAfter - transactionsBefore}`)
  
  if (transactionsAfter > transactionsBefore) {
    console.log('')
    console.log('✅ NEW TRANSACTION CONFIRMED IN DATABASE')
    
    // Get the latest transaction to check data completeness
    const { data: latestData } = await supabase
      .from('universal_transactions')
      .select(`
        id, 
        transaction_code, 
        source_entity_id, 
        target_entity_id,
        total_amount, 
        transaction_currency_code,
        created_at
      `)
      .eq('organization_id', salonOrgId)
      .eq('created_by', actorUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (latestData) {
      console.log('📋 Latest transaction completeness check:')
      console.log(`   Transaction Code: ${latestData.transaction_code ? '✅' : '❌'} ${latestData.transaction_code || 'Missing'}`)
      console.log(`   Customer Link: ${latestData.source_entity_id ? '✅' : '❌'} ${latestData.source_entity_id || 'Missing'}`)
      console.log(`   Stylist Link: ${latestData.target_entity_id ? '✅' : '❌'} ${latestData.target_entity_id || 'Missing'}`)
      console.log(`   Total Amount: ${latestData.total_amount && latestData.total_amount > 0 ? '✅' : '❌'} ${latestData.total_amount || 'Missing'}`)
      console.log(`   Currency: ${latestData.transaction_currency_code ? '✅' : '❌'} ${latestData.transaction_currency_code || 'Missing'}`)
      
      const completenessScore = [
        latestData.transaction_code,
        latestData.source_entity_id,
        latestData.target_entity_id,
        latestData.total_amount && latestData.total_amount > 0,
        latestData.transaction_currency_code
      ].filter(Boolean).length
      
      console.log('')
      console.log(`📊 Data Completeness: ${completenessScore}/5 fields populated`)
      
      if (completenessScore >= 4) {
        console.log('🎉 EXCELLENT: Transaction has most critical business data!')
      } else if (completenessScore >= 2) {
        console.log('⚠️ PARTIAL: Transaction created but missing some business data')
      } else {
        console.log('🔧 MINIMAL: Transaction structure created but needs data population')
      }
    }
  }
}

postCompleteTransaction().catch(error => {
  console.error('💥 Complete transaction posting failed:', error.message)
})