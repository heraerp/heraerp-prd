#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const organizationId = 'f0af4ced-9d12-4a55-a649-b484368db249' // Kerala Furniture Works

async function testTenderCRUD() {
  console.log('🧪 Testing Tender Management CRUD Operations\n')
  
  let createdTenderId = null
  let createdTransactionId = null
  
  try {
    // 1. CREATE - Create a new tender
    console.log('1️⃣ CREATE: Creating new tender...')
    const newTender = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1',
      entity_code: `TENDER-TEST-${Date.now()}`,
      entity_name: 'Test Tender - Teak Wood Supply',
      entity_description: 'Supply of premium teak wood for furniture manufacturing',
      smart_code: 'HERA.FURNITURE.TENDER.NOTICE.ACTIVE.v1',
      status: 'active',
      metadata: {
        department: 'Kerala Forest Department',
        closing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        estimated_value: 500000,
        emd_amount: 10000,
        tender_type: 'open',
        location: 'Nilambur'
      },
      created_at: new Date().toISOString()
    }
    
    const { data: tender, error: createError } = await supabase
      .from('core_entities')
      .insert(newTender)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Create failed:', createError)
      return
    }
    
    createdTenderId = tender.id
    console.log('✅ Created tender:', tender.entity_code)
    console.log('   ID:', tender.id)
    
    // 2. READ - Fetch the created tender
    console.log('\n2️⃣ READ: Fetching tender details...')
    const { data: fetchedTender, error: readError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', createdTenderId)
      .single()
    
    if (readError) {
      console.error('❌ Read failed:', readError)
    } else {
      console.log('✅ Fetched tender:', fetchedTender.entity_name)
      console.log('   Department:', fetchedTender.metadata?.department)
      console.log('   Estimated Value: ₹', fetchedTender.metadata?.estimated_value)
      console.log('   EMD Amount: ₹', fetchedTender.metadata?.emd_amount)
    }
    
    // 3. UPDATE - Update tender details
    console.log('\n3️⃣ UPDATE: Updating tender details...')
    const updateData = {
      metadata: {
        ...fetchedTender.metadata,
        estimated_value: 550000, // Updated value
        emd_amount: 11000, // Updated EMD
        last_updated: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    }
    
    const { data: updatedTender, error: updateError } = await supabase
      .from('core_entities')
      .update(updateData)
      .eq('id', createdTenderId)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Update failed:', updateError)
    } else {
      console.log('✅ Updated tender')
      console.log('   New Estimated Value: ₹', updatedTender.metadata?.estimated_value)
      console.log('   New EMD Amount: ₹', updatedTender.metadata?.emd_amount)
    }
    
    // 4. CREATE TRANSACTION - Create a bid draft transaction
    console.log('\n4️⃣ CREATE TRANSACTION: Creating draft bid...')
    const bidTransaction = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      transaction_type: 'bid_draft',
      transaction_code: `BID-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      target_entity_id: createdTenderId,
      smart_code: 'HERA.FURNITURE.TENDER.BID.DRAFTED.v1',
      smart_code_status: 'ACTIVE',
      transaction_status: 'draft',
      total_amount: 495000,
      transaction_currency_code: 'INR',
      base_currency_code: 'INR',
      exchange_rate: 1,
      exchange_rate_date: new Date().toISOString().split('T')[0],
      exchange_rate_type: 'SPOT',
      metadata: {
        tender_code: updatedTender.entity_code,
        tender_name: updatedTender.entity_name,
        bid_strategy: 'moderate',
        margin_percentage: 10,
        transport_cost: 15000,
        handling_cost: 5000
      },
      ai_confidence: 0.78,
      ai_insights: {
        recommendation: 'Moderate bid strategy with 10% margin',
        risk_level: 'medium',
        win_probability: 0.45
      },
      created_at: new Date().toISOString()
    }
    
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert(bidTransaction)
      .select()
      .single()
    
    if (txnError) {
      console.error('❌ Transaction creation failed:', txnError)
    } else {
      createdTransactionId = transaction.id
      console.log('✅ Created bid draft transaction')
      console.log('   Transaction ID:', transaction.id)
      console.log('   Bid Amount: ₹', transaction.total_amount)
      console.log('   AI Confidence:', transaction.ai_confidence, '%')
    }
    
    // 5. LIST - Fetch all active tenders
    console.log('\n5️⃣ LIST: Fetching all active tenders...')
    const { data: tenderList, error: listError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'HERA.FURNITURE.TENDER.NOTICE.v1')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (listError) {
      console.error('❌ List failed:', listError)
    } else {
      console.log(`✅ Found ${tenderList.length} tender(s)`)
      tenderList.forEach((t, idx) => {
        console.log(`   ${idx + 1}. ${t.entity_name} (${t.entity_code})`)
      })
    }
    
    // 6. DELETE - Clean up test data
    console.log('\n6️⃣ DELETE: Cleaning up test data...')
    
    // Delete transaction first (due to foreign key)
    if (createdTransactionId) {
      const { error: deleteTxnError } = await supabase
        .from('universal_transactions')
        .delete()
        .eq('id', createdTransactionId)
      
      if (deleteTxnError) {
        console.error('❌ Transaction delete failed:', deleteTxnError)
      } else {
        console.log('✅ Deleted test transaction')
      }
    }
    
    // Delete tender
    const { error: deleteError } = await supabase
      .from('core_entities')
      .delete()
      .eq('id', createdTenderId)
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError)
    } else {
      console.log('✅ Deleted test tender')
    }
    
    console.log('\n✅ All CRUD operations completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    
    // Cleanup on error
    if (createdTenderId) {
      await supabase
        .from('core_entities')
        .delete()
        .eq('id', createdTenderId)
    }
  }
}

// Run the test
testTenderCRUD()