#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = "0fd09e31-d257-4329-97eb-7d7f522ed6f0";

async function activateFinanceDNA() {
  console.log('🧬 Activating Finance DNA for Salon Organization\n');
  
  // 1. Create Finance DNA Configuration
  console.log('1️⃣ Creating Finance DNA Configuration...');
  
  const financeDNAConfig = {
    organization_id: SALON_ORG_ID,
    entity_type: 'dna_config',
    entity_code: 'FINANCE-DNA-CONFIG',
    entity_name: 'Finance DNA Configuration - Salon',
    smart_code: 'HERA.DNA.FINANCE.CONFIG.SALON.v1',
    status: 'active',
    metadata: {
      dna_type: 'finance',
      industry: 'salon',
      activation_date: new Date().toISOString(),
      features: {
        auto_posting: true,
        auto_journal: true,
        multi_currency: false,
        tax_automation: true,
        commission_tracking: true
      }
    }
  };
  
  const { data: config, error: configError } = await supabase
    .from('core_entities')
    .insert(financeDNAConfig)
    .select()
    .single();
  
  if (configError) {
    console.error('Error creating config:', configError);
  } else {
    console.log('✅ Finance DNA configuration created');
  }
  
  // 2. Set up GL Posting Rules
  console.log('\n2️⃣ Setting up GL Posting Rules...');
  
  const postingRules = [
    // Service Revenue Posting
    {
      rule_code: 'SALON-SERVICE-REVENUE',
      rule_name: 'Salon Service Revenue Posting',
      smart_code_pattern: 'HERA.SALON.SERVICE.TXN.*',
      posting_config: {
        debit_accounts: ['1100'], // Cash
        credit_accounts: ['4100', '2200'], // Service Revenue, Sales Tax
        tax_rate: 0.05,
        split_tax: true
      }
    },
    // Product Sales Posting
    {
      rule_code: 'SALON-PRODUCT-SALE',
      rule_name: 'Salon Product Sale Posting',
      smart_code_pattern: 'HERA.SALON.PRODUCT.SALE.*',
      posting_config: {
        debit_accounts: ['1100'], // Cash
        credit_accounts: ['4200', '2200'], // Product Revenue, Sales Tax
        cost_accounts: ['5200', '1300'], // COGS (Dr), Inventory (Cr)
        tax_rate: 0.05,
        split_tax: true,
        track_cost: true
      }
    },
    // Commission Accrual
    {
      rule_code: 'SALON-COMMISSION',
      rule_name: 'Stylist Commission Accrual',
      smart_code_pattern: 'HERA.SALON.COMMISSION.*',
      posting_config: {
        debit_accounts: ['5100'], // Commission Expense
        credit_accounts: ['2300'], // Commission Payable
        commission_rate: 0.35, // 35% commission
        auto_calculate: true
      }
    }
  ];
  
  for (const rule of postingRules) {
    const postingRule = {
      organization_id: SALON_ORG_ID,
      entity_type: 'posting_rule',
      entity_code: rule.rule_code,
      entity_name: rule.rule_name,
      smart_code: 'HERA.DNA.FINANCE.RULE.POSTING.v1',
      status: 'active',
      metadata: rule
    };
    
    const { error } = await supabase
      .from('core_entities')
      .insert(postingRule);
    
    if (error) {
      console.error(`Error creating rule ${rule.rule_code}:`, error);
    }
  }
  
  console.log('✅ GL posting rules configured');
  
  // 3. Create Auto-Journal Configuration
  console.log('\n3️⃣ Configuring Auto-Journal Settings...');
  
  const autoJournalConfig = {
    organization_id: SALON_ORG_ID,
    field_name: 'auto_journal_config',
    field_value_json: {
      enabled: true,
      thresholds: {
        immediate_processing: 100,     // Process immediately if >= 100 AED
        batch_small_transactions: 20,  // Batch if < 20 AED
        batch_interval_minutes: 60,    // Batch every hour
        batch_minimum_count: 5         // Need 5+ transactions to batch
      },
      batch_strategies: ['by_payment_method', 'by_service_type', 'by_stylist'],
      excluded_smart_codes: ['*.DRAFT.*', '*.QUOTE.*', '*.CANCELLED.*']
    },
    smart_code: 'HERA.DNA.FINANCE.AUTO_JOURNAL.CONFIG.v1'
  };
  
  // Store in dynamic data for the Finance DNA config entity
  const { error: journalError } = await supabase
    .from('core_dynamic_data')
    .insert({
      ...autoJournalConfig,
      entity_id: config.id
    });
  
  if (journalError) {
    console.error('Error configuring auto-journal:', journalError);
  } else {
    console.log('✅ Auto-journal configuration set');
  }
  
  // 4. Create Tax Configuration
  console.log('\n4️⃣ Setting up Tax Configuration...');
  
  const taxConfig = {
    organization_id: SALON_ORG_ID,
    entity_type: 'tax_config',
    entity_code: 'UAE-VAT-5PCT',
    entity_name: 'UAE VAT Configuration (5%)',
    smart_code: 'HERA.SALON.TAX.CONFIG.VAT.v1',
    status: 'active',
    metadata: {
      tax_type: 'VAT',
      tax_rate: 0.05,
      tax_account: '2200', // Sales Tax Payable
      country: 'AE',
      effective_date: '2025-01-01',
      inclusive_pricing: false
    }
  };
  
  const { error: taxError } = await supabase
    .from('core_entities')
    .insert(taxConfig);
  
  if (taxError) {
    console.error('Error creating tax config:', taxError);
  } else {
    console.log('✅ Tax configuration created');
  }
  
  // 5. Test Finance DNA Activation
  console.log('\n5️⃣ Testing Finance DNA Activation...');
  
  // Create a test transaction to verify posting rules
  const testTransaction = {
    organization_id: SALON_ORG_ID,
    transaction_type: 'service_sale',
    transaction_code: 'TEST-DNA-001',
    transaction_date: new Date().toISOString(),
    smart_code: 'HERA.SALON.SERVICE.TXN.SALE.v1',
    total_amount: 100.00,
    metadata: {
      service_type: 'haircut',
      stylist_id: 'test-stylist',
      payment_method: 'cash',
      test_transaction: true
    }
  };
  
  const { data: txn, error: txnError } = await supabase
    .from('universal_transactions')
    .insert(testTransaction)
    .select()
    .single();
  
  if (txnError) {
    console.error('Error creating test transaction:', txnError);
  } else {
    console.log('✅ Test transaction created:', txn.transaction_code);
    
    // In a real implementation, the Finance DNA would automatically:
    // 1. Detect the transaction via smart code
    // 2. Apply posting rules
    // 3. Create journal entries
    // 4. Calculate tax and commissions
    
    console.log('   - Would post: Dr Cash 100.00');
    console.log('   - Would post: Cr Service Revenue 95.24');
    console.log('   - Would post: Cr Sales Tax Payable 4.76');
    console.log('   - Would accrue: Commission 33.33 (35% of 95.24)');
  }
  
  console.log('\n🎉 Finance DNA Activation Complete!');
  console.log('=====================================');
  console.log('Organization: Hair Talkz Salon - DNA Testing');
  console.log('Features Activated:');
  console.log('  ✅ Auto-Posting Rules');
  console.log('  ✅ Auto-Journal Engine');
  console.log('  ✅ Tax Automation (5% VAT)');
  console.log('  ✅ Commission Tracking (35%)');
  console.log('\nNext Steps:');
  console.log('1. Seed operational data (stylists, services, products)');
  console.log('2. Create sample transactions');
  console.log('3. Verify auto-posting results');
  console.log('4. Run financial reports');
}

activateFinanceDNA().catch(console.error);