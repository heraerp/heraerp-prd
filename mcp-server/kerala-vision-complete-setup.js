#!/usr/bin/env node

/**
 * 🚀 Complete Kerala Vision ERP Setup
 * Following HERA checklist and actual database schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function completeSetup() {
  console.log('🚀 Kerala Vision Complete ERP Setup...\n');

  try {
    // Step 1: Chart of Accounts with working smart code pattern
    console.log('📊 Step 1: Creating Chart of Accounts...');
    await createChartOfAccounts();

    // Step 2: Master Data Entities
    console.log('\n🏭 Step 2: Creating Master Data...');
    await createMasterData();

    // Step 3: Business Configuration
    console.log('\n⚙️ Step 3: Business Configuration...');
    await createBusinessConfig();

    // Step 4: Sample Transactions
    console.log('\n💰 Step 4: Creating Sample Transactions...');
    await createSampleTransactions();

    // Step 5: Verification
    console.log('\n✅ Step 5: Verification...');
    await verifySetup();

    console.log('\n🎉 Kerala Vision ERP Setup Complete!');
    console.log(`Organization ID: ${KERALA_VISION_ORG_ID}`);
    console.log('Ready for IPO dashboard demo!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function createChartOfAccounts() {
  const accounts = [
    // Assets - using exact working pattern HERA.DIST.CUSTOMER.RETAIL.v1
    { code: '1100000', name: 'Cash and Cash Equivalents', type: 'asset', smart: 'HERA.TELECOM.ACCOUNT.CASH.v1' },
    { code: '1110000', name: 'Bank Accounts', type: 'asset', smart: 'HERA.TELECOM.ACCOUNT.BANK.v1' },
    { code: '1200000', name: 'Trade Receivables', type: 'asset', smart: 'HERA.TELECOM.RECEIVABLE.TRADE.v1' },
    { code: '1210000', name: 'Subscription Receivables', type: 'asset', smart: 'HERA.TELECOM.RECEIVABLE.SUBSCRIPTION.v1' },
    { code: '1300000', name: 'Inventory - Equipment', type: 'asset', smart: 'HERA.TELECOM.INVENTORY.EQUIPMENT.v1' },
    { code: '1500000', name: 'Network Infrastructure', type: 'asset', smart: 'HERA.TELECOM.INFRASTRUCTURE.NETWORK.v1' },
    { code: '1510000', name: 'Cable Infrastructure', type: 'asset', smart: 'HERA.TELECOM.INFRASTRUCTURE.CABLE.v1' },
    
    // Liabilities
    { code: '2100000', name: 'Accounts Payable', type: 'liability', smart: 'HERA.TELECOM.PAYABLE.TRADE.v1' },
    { code: '2200000', name: 'GST Payable', type: 'liability', smart: 'HERA.TELECOM.TAX.GST.v1' },
    { code: '2210000', name: 'TDS Payable', type: 'liability', smart: 'HERA.TELECOM.TAX.TDS.v1' },
    
    // Equity
    { code: '3100000', name: 'Share Capital', type: 'equity', smart: 'HERA.TELECOM.EQUITY.CAPITAL.v1' },
    { code: '3200000', name: 'Share Premium', type: 'equity', smart: 'HERA.TELECOM.EQUITY.PREMIUM.v1' },
    { code: '3300000', name: 'Retained Earnings', type: 'equity', smart: 'HERA.TELECOM.EQUITY.RETAINED.v1' },
    
    // Revenue
    { code: '4100000', name: 'Broadband Revenue', type: 'revenue', smart: 'HERA.TELECOM.REVENUE.BROADBAND.v1' },
    { code: '4200000', name: 'Cable TV Revenue', type: 'revenue', smart: 'HERA.TELECOM.REVENUE.CABLE.v1' },
    { code: '4300000', name: 'Advertisement Revenue', type: 'revenue', smart: 'HERA.TELECOM.REVENUE.ADVERTISEMENT.v1' },
    
    // Expenses
    { code: '5100000', name: 'Network Costs', type: 'expense', smart: 'HERA.TELECOM.EXPENSE.NETWORK.v1' },
    { code: '6100000', name: 'Employee Costs', type: 'expense', smart: 'HERA.TELECOM.EXPENSE.EMPLOYEE.v1' },
    { code: '6200000', name: 'Agent Commissions', type: 'expense', smart: 'HERA.TELECOM.EXPENSE.COMMISSION.v1' }
  ];

  let created = 0;
  for (const account of accounts) {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          entity_type: 'gl_account',
          entity_name: account.name,
          entity_code: account.code,
          smart_code: account.smart,
          metadata: {
            account_type: account.type,
            indas_compliant: true,
            account_level: 1
          }
        })
        .select()
        .single();

      if (error) {
        console.log(`  ❌ ${account.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${account.name} (${account.code})`);
        created++;
      }
    } catch (err) {
      console.log(`  ❌ ${account.name}: ${err.message}`);
    }
  }
  console.log(`  📊 Created ${created} GL accounts`);
}

async function createMasterData() {
  // Create customers, agents, products with proper smart codes
  const entities = [
    // Customers
    { type: 'customer', name: 'TechCorp Enterprise', code: 'CUST-001', smart: 'HERA.TELECOM.CUSTOMER.ENTERPRISE.v1' },
    { type: 'customer', name: 'Home User - Kochi', code: 'CUST-002', smart: 'HERA.TELECOM.CUSTOMER.RETAIL.v1' },
    
    // Products/Services
    { type: 'product', name: 'Broadband 100 Mbps', code: 'PROD-BB-100', smart: 'HERA.TELECOM.SERVICE.BROADBAND.v1' },
    { type: 'product', name: 'Cable TV Premium', code: 'PROD-CATV-PREM', smart: 'HERA.TELECOM.SERVICE.CABLE.v1' },
    
    // Agents
    { type: 'agent', name: 'Rajesh Kumar - TVM', code: 'AGT-001', smart: 'HERA.TELECOM.AGENT.FIELD.v1' },
    { type: 'agent', name: 'Priya Nair - Kochi', code: 'AGT-002', smart: 'HERA.TELECOM.AGENT.FIELD.v1' },
    
    // Vendors
    { type: 'vendor', name: 'Bharti Airtel Ltd', code: 'VEND-001', smart: 'HERA.TELECOM.VENDOR.BANDWIDTH.v1' },
    { type: 'vendor', name: 'Jio Platforms', code: 'VEND-002', smart: 'HERA.TELECOM.VENDOR.CONTENT.v1' }
  ];

  let created = 0;
  for (const entity of entities) {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          entity_type: entity.type,
          entity_name: entity.name,
          entity_code: entity.code,
          smart_code: entity.smart,
          metadata: {
            created_for: 'kerala_vision_demo'
          }
        })
        .select()
        .single();

      if (!error) {
        console.log(`  ✅ ${entity.type}: ${entity.name}`);
        created++;
      } else {
        console.log(`  ❌ ${entity.name}: ${error.message}`);
      }
    } catch (err) {
      console.log(`  ❌ ${entity.name}: ${err.message}`);
    }
  }
  console.log(`  🏭 Created ${created} master data entities`);
}

async function createBusinessConfig() {
  const configs = [
    // SEBI IPO Ratios
    {
      type: 'sebi_config',
      name: 'IPO Readiness Ratios',
      code: 'SEBI-IPO-RATIOS',
      smart: 'HERA.TELECOM.CONFIG.SEBI.v1',
      metadata: {
        target_year: 2028,
        ratios: {
          debt_to_equity: { target: '<2.0', current: null },
          return_on_networth: { target: '>15%', current: null },
          net_profit_margin: { target: '>10%', current: null }
        }
      }
    },
    // Finance DNA Config
    {
      type: 'finance_config',
      name: 'Finance DNA Rules',
      code: 'FIN-DNA-CONFIG',
      smart: 'HERA.TELECOM.CONFIG.FINANCE.v1',
      metadata: {
        auto_posting: true,
        audit_level: 'detailed',
        posting_rules: {
          broadband_sale: { dr: '1210000', cr: '4100000' },
          cable_sale: { dr: '1210000', cr: '4200000' },
          ad_booking: { dr: '1220000', cr: '4300000' }
        }
      }
    }
  ];

  let created = 0;
  for (const config of configs) {
    try {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          entity_type: config.type,
          entity_name: config.name,
          entity_code: config.code,
          smart_code: config.smart,
          metadata: config.metadata
        });

      if (!error) {
        console.log(`  ✅ ${config.name}`);
        created++;
      } else {
        console.log(`  ❌ ${config.name}: ${error.message}`);
      }
    } catch (err) {
      console.log(`  ❌ ${config.name}: ${err.message}`);
    }
  }
  console.log(`  ⚙️ Created ${created} business configurations`);
}

async function createSampleTransactions() {
  // Get customer and product IDs
  const { data: customers } = await supabase
    .from('core_entities')
    .select('id, entity_code')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(1);

  const { data: products } = await supabase
    .from('core_entities')
    .select('id, entity_code')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'product')
    .limit(1);

  if (customers?.length > 0 && products?.length > 0) {
    try {
      // Create subscription transaction
      const { data: transaction, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          transaction_type: 'subscription',
          transaction_code: 'KV/SUB/001/2025',
          transaction_date: new Date().toISOString(),
          source_entity_id: customers[0].id,
          target_entity_id: products[0].id,
          total_amount: 999,
          smart_code: 'HERA.TELECOM.SUBSCRIPTION.CREATE.v1',
          metadata: {
            plan: 'Broadband 100 Mbps',
            monthly_recurring: true,
            billing_cycle: 'monthly'
          }
        })
        .select()
        .single();

      if (!error) {
        // Create transaction line
        await supabase
          .from('universal_transaction_lines')
          .insert({
            organization_id: KERALA_VISION_ORG_ID,
            transaction_id: transaction.id,
            line_number: 1,
            entity_id: products[0].id,
            line_type: 'service',
            description: 'Monthly broadband subscription',
            quantity: 1,
            unit_amount: 999,
            line_amount: 999,
            smart_code: 'HERA.TELECOM.LINE.SUBSCRIPTION.v1'
          });

        console.log('  ✅ Subscription transaction created');
      } else {
        console.log(`  ❌ Transaction failed: ${error.message}`);
      }
    } catch (err) {
      console.log(`  ❌ Transaction error: ${err.message}`);
    }
  } else {
    console.log('  ⚠️ No customers or products found for transaction');
  }
}

async function verifySetup() {
  try {
    // Count entities by type
    const { data: entityCounts } = await supabase
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', KERALA_VISION_ORG_ID);

    const counts = entityCounts?.reduce((acc, item) => {
      acc[item.entity_type] = (acc[item.entity_type] || 0) + 1;
      return acc;
    }, {});

    console.log('  📊 Entity Summary:');
    Object.entries(counts || {}).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });

    // Count transactions
    const { data: txnCounts } = await supabase
      .from('universal_transactions')
      .select('id')
      .eq('organization_id', KERALA_VISION_ORG_ID);

    console.log(`  💰 Transactions: ${txnCounts?.length || 0}`);

    // Check organization exists
    const { data: org } = await supabase
      .from('core_organizations')
      .select('organization_name')
      .eq('id', KERALA_VISION_ORG_ID)
      .single();

    console.log(`  🏢 Organization: ${org?.organization_name || 'Not found'}`);

  } catch (err) {
    console.log(`  ❌ Verification error: ${err.message}`);
  }
}

// Run the setup
completeSetup();