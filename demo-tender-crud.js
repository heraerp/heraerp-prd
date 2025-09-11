#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓ Set' : '✗ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
console.log('✅ Using service role client (RLS bypassed)')
const organizationId = 'f0af4ced-9d12-4a55-a649-b484368db249' // Kerala Furniture Works

// Store created IDs for cleanup
const createdIds = {
  tenders: [],
  transactions: []
}

async function createMultipleTenders() {
  console.log('📝 Creating Multiple Tenders...\n')
  
  const tenders = [
    {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1',
      entity_code: 'KFD/2025/TEAK/001',
      entity_name: 'Premium Teak Wood Supply - Nilambur Forest',
      entity_description: 'Supply of Grade A teak wood logs from Nilambur forest division. Minimum girth 150cm, length 3-4 meters.',
      smart_code: 'HERA.FURNITURE.TENDER.NOTICE.ACTIVE.v1',
      status: 'active',
      metadata: {
        department: 'Kerala Forest Department',
        tender_category: 'Wood Supply',
        closing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        opening_date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_value: 2500000,
        emd_amount: 50000,
        tender_fee: 5000,
        tender_type: 'open',
        location: 'Nilambur',
        contact_person: 'DFO Nilambur',
        contact_phone: '+91-4931-222333',
        min_quantity_cbm: 50,
        max_quantity_cbm: 200,
        quality_specs: {
          min_girth_cm: 150,
          min_length_m: 3,
          max_length_m: 4,
          grade: 'A',
          moisture_content_max: 15
        }
      },
      ai_confidence: 0.95,
      ai_insights: {
        market_analysis: 'High demand period, premium pricing expected',
        competition_level: 'high',
        expected_bidders: 12
      },
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1',
      entity_code: 'KFD/2025/ROSE/002',
      entity_name: 'Rosewood Logs Auction - Wayanad Division',
      entity_description: 'Auction of seized rosewood logs. Total 25 logs, various sizes. Court permission obtained.',
      smart_code: 'HERA.FURNITURE.TENDER.NOTICE.ACTIVE.v1',
      status: 'active',
      metadata: {
        department: 'Kerala Forest Department',
        tender_category: 'Wood Auction',
        closing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        opening_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_value: 4500000,
        emd_amount: 100000,
        tender_fee: 10000,
        tender_type: 'auction',
        location: 'Wayanad',
        auction_type: 'sealed_bid',
        lot_details: {
          total_logs: 25,
          total_volume_cbm: 15.5,
          grade_distribution: {
            'A': 10,
            'B': 10,
            'C': 5
          }
        },
        legal_clearance: 'Court Order No. WP(C) 12345/2024'
      },
      ai_confidence: 0.92,
      ai_insights: {
        market_analysis: 'Rare opportunity, very high value expected',
        competition_level: 'very_high',
        expected_bidders: 20
      },
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'HERA.FURNITURE.TENDER.NOTICE.v1',
      entity_code: 'KSBC/2025/BAMBOO/003',
      entity_name: 'Bamboo Supply Contract - Annual Rate Contract',
      entity_description: 'Annual rate contract for bamboo supply. Multiple species, delivery as per requirement.',
      smart_code: 'HERA.FURNITURE.TENDER.NOTICE.ACTIVE.v1',
      status: 'active',
      metadata: {
        department: 'Kerala State Bamboo Corporation',
        tender_category: 'Rate Contract',
        closing_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        opening_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_value: 1200000,
        emd_amount: 25000,
        tender_fee: 2000,
        tender_type: 'rate_contract',
        contract_period: '12 months',
        location: 'Multiple locations',
        bamboo_species: ['Dendrocalamus strictus', 'Bambusa vulgaris', 'Bambusa balcooa'],
        estimated_annual_quantity: {
          poles: 50000,
          splits: 100000,
          mats: 5000
        },
        delivery_terms: 'As per monthly requirement'
      },
      ai_confidence: 0.88,
      ai_insights: {
        market_analysis: 'Stable demand, good margin opportunity',
        competition_level: 'medium',
        expected_bidders: 8
      },
      created_at: new Date().toISOString()
    }
  ]
  
  for (const tender of tenders) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert(tender)
      .select()
      .single()
    
    if (error) {
      console.error(`❌ Failed to create tender ${tender.entity_code}:`, error)
    } else {
      createdIds.tenders.push(data.id)
      console.log(`✅ Created: ${data.entity_name}`)
      console.log(`   Code: ${data.entity_code}`)
      console.log(`   Value: ₹${data.metadata.estimated_value.toLocaleString('en-IN')}`)
      console.log(`   EMD: ₹${data.metadata.emd_amount.toLocaleString('en-IN')}`)
      console.log(`   Closing: ${new Date(data.metadata.closing_date).toLocaleDateString('en-IN')}\n`)
    }
  }
  
  return createdIds.tenders
}

async function createTransactions(tenderIds) {
  console.log('\n💼 Creating Bid Transactions...\n')
  
  // Get tender details first
  const { data: tenders } = await supabase
    .from('core_entities')
    .select('*')
    .in('id', tenderIds)
  
  const transactions = []
  
  // Create multiple bids for each tender
  for (const tender of tenders || []) {
    // Create 2-3 bids per tender
    const numBids = Math.floor(Math.random() * 2) + 2
    
    for (let i = 0; i < numBids; i++) {
      const baseValue = tender.metadata.estimated_value
      const variation = (Math.random() * 0.2) - 0.1 // -10% to +10%
      const bidAmount = Math.round(baseValue * (1 + variation))
      
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'tender_bid',
        transaction_code: `BID/${tender.entity_code}/${Date.now()}-${i}`,
        transaction_date: new Date().toISOString(),
        target_entity_id: tender.id,
        smart_code: 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v1',
        smart_code_status: 'ACTIVE',
        transaction_status: i === 0 ? 'submitted' : 'draft',
        total_amount: bidAmount,
        transaction_currency_code: 'INR',
        base_currency_code: 'INR',
        exchange_rate: 1,
        exchange_rate_date: new Date().toISOString().split('T')[0],
        exchange_rate_type: 'SPOT',
        metadata: {
          tender_code: tender.entity_code,
          tender_name: tender.entity_name,
          bidder_name: `Bidder-${i + 1}`,
          bid_strategy: i === 0 ? 'aggressive' : (i === 1 ? 'moderate' : 'conservative'),
          margin_percentage: 8 + (i * 2),
          price_breakdown: {
            material_cost: bidAmount * 0.7,
            transport_cost: bidAmount * 0.1,
            handling_cost: bidAmount * 0.05,
            margin: bidAmount * 0.15
          },
          technical_score: 80 + Math.floor(Math.random() * 20),
          financial_score: 75 + Math.floor(Math.random() * 25),
          compliance_checklist: {
            emd_submitted: true,
            tender_fee_paid: true,
            documents_complete: true,
            digital_signature: true
          }
        },
        ai_confidence: 0.7 + (Math.random() * 0.25),
        ai_insights: {
          recommendation: i === 0 ? 'Strong bid, good winning chance' : 'Competitive bid',
          risk_level: i === 0 ? 'medium' : 'low',
          win_probability: 0.3 + (Math.random() * 0.4),
          price_analysis: bidAmount < baseValue ? 'Below estimate' : 'Above estimate'
        },
        created_at: new Date().toISOString()
      })
    }
  }
  
  // Insert all transactions
  for (const txn of transactions) {
    const { data, error } = await supabase
      .from('universal_transactions')
      .insert(txn)
      .select()
      .single()
    
    if (error) {
      console.error(`❌ Failed to create bid:`, error)
    } else {
      createdIds.transactions.push(data.id)
      console.log(`✅ Created Bid: ${data.transaction_code}`)
      console.log(`   Amount: ₹${data.total_amount.toLocaleString('en-IN')}`)
      console.log(`   Status: ${data.transaction_status}`)
      console.log(`   AI Confidence: ${(data.ai_confidence * 100).toFixed(0)}%`)
      console.log(`   Win Probability: ${(data.ai_insights.win_probability * 100).toFixed(0)}%\n`)
    }
  }
}

async function readAndDisplayData() {
  console.log('\n📊 Reading and Displaying All Data...\n')
  
  // Read all tenders
  console.log('🏗️ Active Tenders:\n')
  const { data: tenders, error: tenderError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'HERA.FURNITURE.TENDER.NOTICE.v1')
    .order('created_at', { ascending: false })
  
  if (tenderError) {
    console.error('Error reading tenders:', tenderError)
    return
  }
  
  for (const tender of tenders || []) {
    console.log(`📋 ${tender.entity_name}`)
    console.log(`   Code: ${tender.entity_code}`)
    console.log(`   Department: ${tender.metadata.department}`)
    console.log(`   Type: ${tender.metadata.tender_type}`)
    console.log(`   Value: ₹${tender.metadata.estimated_value?.toLocaleString('en-IN')}`)
    console.log(`   EMD: ₹${tender.metadata.emd_amount?.toLocaleString('en-IN')}`)
    console.log(`   Closing: ${new Date(tender.metadata.closing_date).toLocaleDateString('en-IN')}`)
    console.log(`   Location: ${tender.metadata.location}`)
    console.log(`   AI Insights: ${tender.ai_insights?.market_analysis}\n`)
  }
  
  // Read all bids with tender details
  console.log('\n💰 Submitted Bids:\n')
  const { data: bids, error: bidError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'tender_bid')
    .order('total_amount', { ascending: true })
  
  if (bidError) {
    console.error('Error reading bids:', bidError)
    return
  }
  
  // Group bids by tender
  const bidsByTender = {}
  for (const bid of bids || []) {
    const tenderId = bid.target_entity_id
    if (!bidsByTender[tenderId]) {
      bidsByTender[tenderId] = []
    }
    bidsByTender[tenderId].push(bid)
  }
  
  // Display bids grouped by tender
  for (const [tenderId, tenderBids] of Object.entries(bidsByTender)) {
    const tender = tenders.find(t => t.id === tenderId)
    if (tender) {
      console.log(`🎯 Bids for: ${tender.entity_name}`)
      console.log(`   Estimated Value: ₹${tender.metadata.estimated_value?.toLocaleString('en-IN')}\n`)
      
      tenderBids.sort((a, b) => a.total_amount - b.total_amount)
      tenderBids.forEach((bid, index) => {
        const variance = ((bid.total_amount - tender.metadata.estimated_value) / tender.metadata.estimated_value * 100).toFixed(1)
        console.log(`   ${index + 1}. ${bid.metadata.bidder_name}: ₹${bid.total_amount.toLocaleString('en-IN')} (${variance > 0 ? '+' : ''}${variance}%)`)
        console.log(`      Strategy: ${bid.metadata.bid_strategy}, Status: ${bid.transaction_status}`)
        console.log(`      Technical Score: ${bid.metadata.technical_score}, Financial Score: ${bid.metadata.financial_score}`)
        console.log(`      AI Analysis: ${bid.ai_insights.price_analysis}, Win Probability: ${(bid.ai_insights.win_probability * 100).toFixed(0)}%`)
      })
      console.log('')
    }
  }
}

async function updateSampleData() {
  console.log('\n🔄 Updating Sample Data...\n')
  
  // Update a tender's closing date
  if (createdIds.tenders.length > 0) {
    const tenderId = createdIds.tenders[0]
    const { data: tender } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', tenderId)
      .single()
    
    if (tender) {
      const newClosingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const updateData = {
        metadata: {
          ...tender.metadata,
          closing_date: newClosingDate.toISOString(),
          extension_reason: 'Technical clarifications required',
          original_closing_date: tender.metadata.closing_date
        },
        updated_at: new Date().toISOString()
      }
      
      const { data: updated, error } = await supabase
        .from('core_entities')
        .update(updateData)
        .eq('id', tenderId)
        .select()
        .single()
      
      if (error) {
        console.error('Update failed:', error)
      } else {
        console.log(`✅ Extended closing date for: ${updated.entity_name}`)
        console.log(`   Original: ${new Date(tender.metadata.closing_date).toLocaleDateString('en-IN')}`)
        console.log(`   New: ${new Date(updated.metadata.closing_date).toLocaleDateString('en-IN')}`)
        console.log(`   Reason: ${updated.metadata.extension_reason}\n`)
      }
    }
  }
  
  // Update a bid status to submitted
  if (createdIds.transactions.length > 1) {
    const bidId = createdIds.transactions[1]
    const updateData = {
      transaction_status: 'submitted',
      metadata: {
        submitted_at: new Date().toISOString(),
        submission_method: 'online_portal',
        confirmation_number: `CONF-${Date.now()}`
      },
      updated_at: new Date().toISOString()
    }
    
    const { data: updated, error } = await supabase
      .from('universal_transactions')
      .update(updateData)
      .eq('id', bidId)
      .select()
      .single()
    
    if (error) {
      console.error('Bid update failed:', error)
    } else {
      // Preserve existing metadata
      const fullMetadata = {
        ...updated.metadata,
        ...updateData.metadata
      }
      
      // Update with preserved metadata
      const { data: finalUpdate } = await supabase
        .from('universal_transactions')
        .update({ metadata: fullMetadata })
        .eq('id', bidId)
        .select()
        .single()
      
      console.log(`✅ Submitted bid: ${finalUpdate.transaction_code}`)
      console.log(`   Confirmation: ${fullMetadata.confirmation_number}`)
      console.log(`   Status: draft → submitted\n`)
    }
  }
}

async function performAnalytics() {
  console.log('\n📈 Analytics and Insights...\n')
  
  // Tender statistics
  const { data: tenders } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'HERA.FURNITURE.TENDER.NOTICE.v1')
  
  if (tenders && tenders.length > 0) {
    const totalValue = tenders.reduce((sum, t) => sum + (t.metadata.estimated_value || 0), 0)
    const avgValue = totalValue / tenders.length
    
    console.log('📊 Tender Statistics:')
    console.log(`   Total Active Tenders: ${tenders.length}`)
    console.log(`   Total Estimated Value: ₹${totalValue.toLocaleString('en-IN')}`)
    console.log(`   Average Tender Value: ₹${Math.round(avgValue).toLocaleString('en-IN')}`)
    
    const byType = {}
    tenders.forEach(t => {
      const type = t.metadata.tender_type || 'unknown'
      byType[type] = (byType[type] || 0) + 1
    })
    console.log(`   By Type: ${JSON.stringify(byType)}\n`)
  }
  
  // Bid statistics
  const { data: bids } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'tender_bid')
  
  if (bids && bids.length > 0) {
    const submittedBids = bids.filter(b => b.transaction_status === 'submitted')
    const avgConfidence = bids.reduce((sum, b) => sum + (b.ai_confidence || 0), 0) / bids.length
    
    console.log('💼 Bid Statistics:')
    console.log(`   Total Bids: ${bids.length}`)
    console.log(`   Submitted: ${submittedBids.length}`)
    console.log(`   Drafts: ${bids.length - submittedBids.length}`)
    console.log(`   Average AI Confidence: ${(avgConfidence * 100).toFixed(0)}%`)
    
    const strategies = {}
    bids.forEach(b => {
      const strategy = b.metadata?.bid_strategy || 'unknown'
      strategies[strategy] = (strategies[strategy] || 0) + 1
    })
    console.log(`   By Strategy: ${JSON.stringify(strategies)}\n`)
  }
}

async function deleteTestData() {
  console.log('\n🗑️ Cleaning Up Test Data (Optional)...\n')
  console.log('Press Ctrl+C within 5 seconds to keep the data...')
  
  // Wait 5 seconds before deletion
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Delete transactions first (foreign key constraint)
  for (const id of createdIds.transactions) {
    await supabase
      .from('universal_transactions')
      .delete()
      .eq('id', id)
  }
  console.log(`✅ Deleted ${createdIds.transactions.length} test transactions`)
  
  // Delete tenders
  for (const id of createdIds.tenders) {
    await supabase
      .from('core_entities')
      .delete()
      .eq('id', id)
  }
  console.log(`✅ Deleted ${createdIds.tenders.length} test tenders`)
}

async function runFullDemo() {
  try {
    console.log('🚀 HERA Tender Management - Full CRUD Demo\n')
    console.log('Organization: Kerala Furniture Works\n')
    console.log('=' .repeat(60) + '\n')
    
    // CREATE
    const tenderIds = await createMultipleTenders()
    await createTransactions(tenderIds)
    
    // READ
    await readAndDisplayData()
    
    // UPDATE
    await updateSampleData()
    
    // ANALYTICS
    await performAnalytics()
    
    // DELETE (optional)
    await deleteTestData()
    
    console.log('\n✅ Demo completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error)
    
    // Cleanup on error
    console.log('\n🧹 Cleaning up after error...')
    for (const id of createdIds.transactions) {
      await supabase.from('universal_transactions').delete().eq('id', id)
    }
    for (const id of createdIds.tenders) {
      await supabase.from('core_entities').delete().eq('id', id)
    }
  }
}

// Run the demo
runFullDemo()