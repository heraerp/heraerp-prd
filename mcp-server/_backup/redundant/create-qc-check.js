#!/usr/bin/env node

/**
 * Create Quality Control Check for Production Batch
 * This demonstrates quality testing and release process
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function createQualityCheck(batchNumber = 'BATCH-2025-08-30-001') {
  console.log('🔬 Creating Quality Control Check for batch:', batchNumber, '\n')
  
  try {
    // Get the production batch
    const { data: batch } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('transaction_code', batchNumber)
      .single()
      
    if (!batch) {
      console.error('Batch not found')
      return
    }
    
    // Create QC transaction
    console.log('📋 Recording quality test results...')
    
    const qcCode = `QC-${batchNumber}`
    const { data: qcTxn, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'quality_check',
        transaction_code: qcCode,
        transaction_date: new Date().toISOString().slice(0,10),
        source_entity_id: batch.target_entity_id, // Product being tested
        reference_number: batchNumber,
        smart_code: 'HERA.FOODDAIRY.QC.CHECK.FINISHED.V1',
        metadata: {
          batch_number: batchNumber,
          test_date: new Date().toISOString(),
          test_type: 'finished_product',
          tester: 'QC Lab Team',
          test_results: {
            // Microbiological tests
            total_plate_count: 850,      // CFU/g (limit: <25000)
            coliform: 0,                  // CFU/g (limit: <10)
            yeast_mold: 5,               // CFU/g (limit: <100)
            
            // Physical tests
            fat_content: 12.5,           // % (standard: 10-14%)
            total_solids: 38.2,          // % (min: 36%)
            overrun: 45.2,               // % (standard: 40-60%)
            ph_value: 6.8,               // (standard: 6.5-7.0)
            
            // Sensory evaluation
            appearance_score: 9,         // out of 10
            flavor_score: 8.5,          // out of 10
            texture_score: 9,           // out of 10
            overall_score: 8.8,         // out of 10
            
            // Temperature
            storage_temp: -19.5,        // °C (standard: -18 to -20)
          },
          test_status: 'PASS',
          remarks: 'All parameters within acceptable limits. Product approved for sale.'
        },
        transaction_status: 'completed',
        total_amount: 0
      })
      .select()
      .single()
      
    if (error) throw error
    
    console.log(`✓ Quality check completed: ${qcCode}`)
    console.log('\n📊 Test Results:')
    console.log('  Microbiological:')
    console.log('    - Total Plate Count: 850 CFU/g ✅ (limit: <25,000)')
    console.log('    - Coliform: 0 CFU/g ✅ (limit: <10)')
    console.log('    - Yeast & Mold: 5 CFU/g ✅ (limit: <100)')
    console.log('  Physical Properties:')
    console.log('    - Fat Content: 12.5% ✅ (standard: 10-14%)')
    console.log('    - Total Solids: 38.2% ✅ (min: 36%)')
    console.log('    - Overrun: 45.2% ✅ (standard: 40-60%)')
    console.log('  Sensory Evaluation:')
    console.log('    - Overall Score: 8.8/10 ⭐')
    
    console.log('\n✅ Quality Status: PASSED - Approved for Sale')
    
    // Update batch status to release the goods
    await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...batch.metadata,
          qc_status: 'passed',
          qc_reference: qcCode,
          release_date: new Date().toISOString()
        }
      })
      .eq('id', batch.id)
      
    console.log('\n🏷️ Batch released for distribution')
    
    return qcTxn
    
  } catch (error) {
    console.error('❌ Error in quality check:', error.message)
  }
}

// Run if called directly
if (require.main === module) {
  createQualityCheck()
}

module.exports = { createQualityCheck }