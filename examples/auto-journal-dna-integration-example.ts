// ================================================================================
// HERA AUTO-JOURNAL DNA INTEGRATION EXAMPLE
// Complete example showing how to use the Auto-Journal DNA system
// Smart Code: HERA.EXAMPLE.AUTO.JOURNAL.DNA.INTEGRATION.v1
// ================================================================================

import { supabase } from '@/lib/supabase'
import { universalApi } from '@/lib/universal-api'
import { createAutoJournalService } from '@/lib/dna/services/auto-journal-dna-service'

// ================================================================================
// EXAMPLE 1: RESTAURANT IMPLEMENTATION
// ================================================================================

async function restaurantAutoJournalExample() {
  console.log('🍕 Restaurant Auto-Journal DNA Example');
  console.log('=====================================\n');

  // Set up organization context
  const organizationId = 'rest-org-uuid-123';
  universalApi.setOrganizationId(organizationId);

  try {
    // 1. Initialize DNA service with restaurant industry
    console.log('1️⃣ Initializing Auto-Journal DNA Service...');
    const autoJournalService = await createAutoJournalService(organizationId, 'restaurant');
    console.log('✅ Restaurant-specific configuration loaded\n');

    // 2. Create a restaurant sale transaction
    console.log('2️⃣ Creating restaurant sale transaction...');
    const saleTransaction = {
      transaction_type: 'sale',
      smart_code: 'HERA.REST.SALE.ORDER.v1',
      transaction_date: new Date().toISOString(),
      total_amount: 87.50,
      currency: 'USD',
      metadata: {
        payment_method: 'credit_card',
        shift_id: 'lunch_shift',
        pos_terminal: 'terminal_02',
        table_number: 12,
        server_id: 'server_456'
      },
      organization_id: organizationId
    };

    const transactionResult = await universalApi.create('universal_transactions', saleTransaction);
    
    if (transactionResult.success) {
      console.log(`✅ Transaction created: ${transactionResult.data.id}`);
      
      // 3. Process with DNA auto-journal
      console.log('3️⃣ Processing with DNA Auto-Journal...');
      const journalResult = await universalApi.processTransactionWithDNA(transactionResult.data.id);
      
      console.log(`✅ Journal processing: ${journalResult.data.processing_mode}`);
      console.log(`📊 Industry optimized: ${journalResult.data.industry_optimized}`);
      
      if (journalResult.data.journal_created) {
        console.log(`📝 Journal entry created: ${journalResult.data.journal_id}`);
      } else {
        console.log('📦 Transaction queued for batch processing');
      }
    }

    // 4. Show DNA statistics
    console.log('\n4️⃣ DNA Auto-Journal Statistics:');
    const stats = await universalApi.getDNAAutoJournalStatistics(7);
    
    if (stats.success) {
      console.log(`📈 Automation Rate: ${stats.data.automation_rate}%`);
      console.log(`💰 Cost Savings: $${stats.data.cost_savings}`);
      console.log(`⏱️  Time Saved: ${stats.data.processing_time_saved} minutes`);
    }

    // 5. Run batch processing
    console.log('\n5️⃣ Running batch processing...');
    const batchResult = await universalApi.runDNABatchProcessing();
    
    if (batchResult.success) {
      console.log(`📦 Batched: ${batchResult.data.batched_count} transactions`);
      console.log(`📝 Created: ${batchResult.data.journals_created} journal entries`);
    }

  } catch (error) {
    console.error('❌ Restaurant example failed:', error.message);
  }
}

// ================================================================================
// EXAMPLE 2: HEALTHCARE IMPLEMENTATION
// ================================================================================

async function healthcareAutoJournalExample() {
  console.log('🏥 Healthcare Auto-Journal DNA Example');
  console.log('=====================================\n');

  const organizationId = 'health-org-uuid-456';
  universalApi.setOrganizationId(organizationId);

  try {
    // 1. Initialize DNA service with healthcare industry
    console.log('1️⃣ Initializing Healthcare Auto-Journal DNA...');
    const autoJournalService = await createAutoJournalService(organizationId, 'healthcare');
    console.log('✅ HIPAA-compliant configuration loaded\n');

    // 2. Create patient service transaction
    console.log('2️⃣ Creating patient service transaction...');
    const serviceTransaction = {
      transaction_type: 'patient_service',
      smart_code: 'HERA.HLTH.SVC.CONSULTATION.v1',
      transaction_date: new Date().toISOString(),
      total_amount: 250.00,
      currency: 'USD',
      metadata: {
        provider_id: 'dr_smith_123',
        department: 'cardiology',
        insurance_payer: 'blue_cross',
        patient_copay: 25.00,
        insurance_portion: 225.00,
        hipaa_compliant: true
      },
      organization_id: organizationId
    };

    const serviceResult = await universalApi.createTransactionWithDNAAutoJournal(serviceTransaction);
    
    if (serviceResult.success) {
      console.log(`✅ Patient service recorded with auto-journal`);
      console.log(`🧬 DNA Enhanced: ${serviceResult.data.dna_enhanced}`);
      
      // Healthcare-specific features
      if (serviceResult.data.journal_processing?.insurance_split) {
        console.log('🏥 Insurance splitting applied automatically');
      }
    }

    // 3. Configure healthcare-specific settings
    console.log('\n3️⃣ Configuring healthcare-specific thresholds...');
    const configResult = await universalApi.configureAutoJournalDNA({
      thresholds: {
        immediate_processing: 1000,  // Higher threshold for expensive procedures
        batch_small_transactions: 25 // Very small copays can be batched
      },
      compliance: {
        audit_retention_years: 10    // Extended retention for healthcare
      }
    });

    if (configResult.success) {
      console.log('✅ Healthcare compliance settings updated');
    }

  } catch (error) {
    console.error('❌ Healthcare example failed:', error.message);
  }
}

// ================================================================================
// EXAMPLE 3: MANUFACTURING IMPLEMENTATION
// ================================================================================

async function manufacturingAutoJournalExample() {
  console.log('🏭 Manufacturing Auto-Journal DNA Example');
  console.log('========================================\n');

  const organizationId = 'mfg-org-uuid-789';
  universalApi.setOrganizationId(organizationId);

  try {
    // 1. Initialize DNA service with manufacturing industry
    console.log('1️⃣ Initializing Manufacturing Auto-Journal DNA...');
    const autoJournalService = await createAutoJournalService(organizationId, 'manufacturing');
    console.log('✅ Standard costing configuration loaded\n');

    // 2. Create production order transaction
    console.log('2️⃣ Creating production order transaction...');
    const productionTransaction = {
      transaction_type: 'production_order',
      smart_code: 'HERA.MFG.PROD.ORDER.COMPLETE.v1',
      transaction_date: new Date().toISOString(),
      total_amount: 15750.00,
      currency: 'USD',
      metadata: {
        production_line: 'line_a',
        shift: 'night_shift',
        work_center: 'assembly_01',
        product_family: 'automotive_parts',
        wip_tracking: true,
        standard_cost: 14500.00,
        actual_cost: 15750.00,
        variance_amount: 1250.00
      },
      organization_id: organizationId
    };

    const productionResult = await universalApi.createTransactionWithDNAAutoJournal(productionTransaction);
    
    if (productionResult.success) {
      console.log(`✅ Production order processed with variance analysis`);
      console.log(`📊 WIP Tracking: Enabled`);
      console.log(`💰 Variance: $${productionTransaction.metadata.variance_amount}`);
    }

    // 3. Show manufacturing-specific configuration
    console.log('\n3️⃣ Manufacturing Configuration:');
    const config = await universalApi.getAutoJournalDNAConfiguration();
    
    if (config.success && config.data.costing) {
      console.log(`🔧 Costing Method: ${config.data.costing.method}`);
      console.log('📊 Variance Accounts:');
      Object.keys(config.data.costing.variance_accounts).forEach(type => {
        console.log(`   ${type}: ${config.data.costing.variance_accounts[type]}`);
      });
    }

  } catch (error) {
    console.error('❌ Manufacturing example failed:', error.message);
  }
}

// ================================================================================
// EXAMPLE 4: MULTI-INDUSTRY COMPARISON
// ================================================================================

async function multiIndustryComparisonExample() {
  console.log('🌍 Multi-Industry Auto-Journal DNA Comparison');
  console.log('============================================\n');

  const industries = ['restaurant', 'healthcare', 'manufacturing', 'professional_services'];
  
  for (const industry of industries) {
    try {
      console.log(`📊 ${industry.toUpperCase()} INDUSTRY:`);
      
      // Create service for each industry
      const service = await createAutoJournalService('comparison-org', industry);
      const config = (service as any).config; // Access config for comparison
      
      console.log(`   Immediate Processing: $${config?.thresholds?.immediate_processing}`);
      console.log(`   Batch Threshold: $${config?.thresholds?.batch_small_transactions}`);
      console.log(`   Batch Strategies: ${config?.batch_strategies?.length || 0}`);
      console.log(`   Journal Rules: ${config?.journal_rules?.length || 0}`);
      
      // Special features
      const specialFeatures = [];
      if (config?.tax_handling) specialFeatures.push('Tax Handling');
      if (config?.compliance) specialFeatures.push('Compliance');
      if (config?.costing) specialFeatures.push('Cost Accounting');
      if (config?.revenue_recognition) specialFeatures.push('Revenue Recognition');
      
      console.log(`   Special Features: ${specialFeatures.join(', ') || 'Standard'}\n`);
      
    } catch (error) {
      console.log(`   ❌ Error loading ${industry}: ${error.message}\n`);
    }
  }
}

// ================================================================================
// EXAMPLE 5: CUSTOM CONFIGURATION OVERRIDE
// ================================================================================

async function customConfigurationExample() {
  console.log('⚙️ Custom Configuration Override Example');
  console.log('=======================================\n');

  const organizationId = 'custom-org-uuid-999';
  universalApi.setOrganizationId(organizationId);

  try {
    // 1. Start with restaurant base configuration
    console.log('1️⃣ Loading restaurant base configuration...');
    const service = await createAutoJournalService(organizationId, 'restaurant');
    console.log('✅ Restaurant DNA loaded\n');

    // 2. Apply custom overrides
    console.log('2️⃣ Applying custom configuration overrides...');
    const customConfig = {
      thresholds: {
        immediate_processing: 2000,    // Higher threshold for this restaurant
        batch_small_transactions: 50,  // Lower batch threshold
        batch_minimum_count: 10        // Need more transactions to batch
      },
      custom_rules: [
        {
          transaction_type: 'delivery_fee',
          smart_code_pattern: '.REST.DELIVERY.',
          debit_accounts: ['1100000'],    // Cash
          credit_accounts: ['4150000'],   // Delivery Revenue
          immediate_processing: true      // Always process delivery fees immediately
        }
      ],
      batch_strategies: ['by_payment_method', 'by_delivery_zone'], // Custom batching
      notification_settings: {
        email_on_large_batch: true,
        threshold_for_notification: 5000
      }
    };

    const configResult = await universalApi.configureAutoJournalDNA(customConfig);
    
    if (configResult.success) {
      console.log('✅ Custom configuration applied');
      console.log('🎯 Higher immediate processing threshold set');
      console.log('🚚 Delivery fee rules added');
      console.log('📧 Notification settings configured\n');
    }

    // 3. Test with custom rules
    console.log('3️⃣ Testing custom delivery transaction...');
    const deliveryTransaction = {
      transaction_type: 'delivery_fee',
      smart_code: 'HERA.REST.DELIVERY.FEE.v1',
      transaction_date: new Date().toISOString(),
      total_amount: 5.99,
      currency: 'USD',
      metadata: {
        delivery_zone: 'zone_downtown',
        order_id: 'order_123456',
        driver_id: 'driver_789'
      },
      organization_id: organizationId
    };

    const deliveryResult = await universalApi.createTransactionWithDNAAutoJournal(deliveryTransaction);
    
    if (deliveryResult.success) {
      console.log('✅ Delivery transaction processed with custom rules');
      console.log(`📊 Processing Mode: ${deliveryResult.data.journal_processing?.processing_mode}`);
    }

  } catch (error) {
    console.error('❌ Custom configuration example failed:', error.message);
  }
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

export async function runAutoJournalDNAExamples() {
  console.log('🧬 HERA AUTO-JOURNAL DNA INTEGRATION EXAMPLES');
  console.log('=============================================\n');

  try {
    await restaurantAutoJournalExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await healthcareAutoJournalExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await manufacturingAutoJournalExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await multiIndustryComparisonExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await customConfigurationExample();
    
    console.log('\n🎉 All Auto-Journal DNA examples completed successfully!');
    console.log('🚀 Ready to revolutionize journal automation across all industries!');
    
  } catch (error) {
    console.error('❌ Examples failed:', error.message);
  }
}

// Export individual examples for selective testing
export {
  restaurantAutoJournalExample,
  healthcareAutoJournalExample,
  manufacturingAutoJournalExample,
  multiIndustryComparisonExample,
  customConfigurationExample
};

// Run if called directly
if (require.main === module) {
  runAutoJournalDNAExamples();
}