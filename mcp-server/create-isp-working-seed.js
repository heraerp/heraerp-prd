#!/usr/bin/env node

/**
 * 🌐 Create ISP Seed Data - Using EXACT working pattern
 * Pattern: HERA.TELECOM.{TYPE}.{CATEGORY}.{SUBTYPE}.v1
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

async function createISPSeedData() {
  console.log('🌐 Creating ISP Seed Data - Using Working Smart Code Pattern...\n');

  try {
    // Step 1: Chart of Accounts with working pattern
    console.log('📊 Step 1: Creating Chart of Accounts...');
    await createChartOfAccounts();

    // Step 2: Service Plans
    console.log('\n📦 Step 2: Creating Service Plans...');
    await createServicePlans();

    // Step 3: Customers
    console.log('\n👥 Step 3: Creating Customers...');
    await createCustomers();

    // Step 4: Agent Network
    console.log('\n👨‍💼 Step 4: Creating Agents...');
    await createAgents();

    // Step 5: Sample Transactions
    console.log('\n💰 Step 5: Creating Sample Transactions...');
    await createSampleTransactions();

    // Step 6: Verification
    console.log('\n✅ Step 6: Verification...');
    await verifyData();

    console.log('\n🎉 ISP Seed Data Created Successfully!');
    console.log(`🏢 Organization: Kerala Vision Broadband Ltd`);
    console.log(`🆔 Organization ID: ${KERALA_VISION_ORG_ID}`);
    console.log('🚀 Ready for /isp application!');

  } catch (error) {
    console.error('❌ Seed data creation failed:', error);
    process.exit(1);
  }
}

async function createChartOfAccounts() {
  // Using exact same pattern: HERA.TELECOM.{TYPE}.{CATEGORY}.{SUBTYPE}.v1
  const accounts = [
    // Assets - Following HERA.TELECOM.ACCOUNT.{CATEGORY}.{SUBTYPE}.v1
    { code: '1100000', name: 'Cash and Cash Equivalents', smart: 'HERA.TELECOM.ACCOUNT.CASH.GENERAL.v1' },
    { code: '1110000', name: 'Bank Accounts', smart: 'HERA.TELECOM.ACCOUNT.BANK.CURRENT.v1' },
    { code: '1200000', name: 'Trade Receivables', smart: 'HERA.TELECOM.ACCOUNT.RECEIVABLES.TRADE.v1' },
    { code: '1210000', name: 'Subscription Receivables', smart: 'HERA.TELECOM.ACCOUNT.RECEIVABLES.SUBSCRIPTION.v1' },
    { code: '1220000', name: 'Advertisement Receivables', smart: 'HERA.TELECOM.ACCOUNT.RECEIVABLES.ADVERTISEMENT.v1' },
    { code: '1300000', name: 'Equipment Inventory', smart: 'HERA.TELECOM.ACCOUNT.INVENTORY.EQUIPMENT.v1' },
    { code: '1500000', name: 'Network Infrastructure', smart: 'HERA.TELECOM.ACCOUNT.ASSETS.NETWORK.v1' },
    { code: '1510000', name: 'Cable Infrastructure', smart: 'HERA.TELECOM.ACCOUNT.ASSETS.CABLE.v1' },
    
    // Liabilities
    { code: '2100000', name: 'Accounts Payable', smart: 'HERA.TELECOM.ACCOUNT.PAYABLES.TRADE.v1' },
    { code: '2200000', name: 'GST Payable', smart: 'HERA.TELECOM.ACCOUNT.PAYABLES.GST.v1' },
    { code: '2210000', name: 'TDS Payable', smart: 'HERA.TELECOM.ACCOUNT.PAYABLES.TDS.v1' },
    
    // Equity
    { code: '3100000', name: 'Share Capital', smart: 'HERA.TELECOM.ACCOUNT.EQUITY.SHARE.v1' },
    { code: '3200000', name: 'Share Premium', smart: 'HERA.TELECOM.ACCOUNT.EQUITY.PREMIUM.v1' },
    { code: '3300000', name: 'Retained Earnings', smart: 'HERA.TELECOM.ACCOUNT.EQUITY.RETAINED.v1' },
    
    // Revenue
    { code: '4100000', name: 'Broadband Revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.BROADBAND.v1' },
    { code: '4200000', name: 'Cable TV Revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.CABLE.v1' },
    { code: '4300000', name: 'Advertisement Revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.ADVERTISEMENT.v1' },
    { code: '4400000', name: 'Channel Placement Revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.PLACEMENT.v1' },
    { code: '4500000', name: 'Leased Line Revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.LEASED.v1' },
    
    // Expenses
    { code: '5100000', name: 'Network Operation Costs', smart: 'HERA.TELECOM.ACCOUNT.EXPENSE.NETWORK.v1' },
    { code: '5110000', name: 'Bandwidth Costs', smart: 'HERA.TELECOM.ACCOUNT.EXPENSE.BANDWIDTH.v1' },
    { code: '6100000', name: 'Employee Costs', smart: 'HERA.TELECOM.ACCOUNT.EXPENSE.EMPLOYEE.v1' },
    { code: '6200000', name: 'Agent Commissions', smart: 'HERA.TELECOM.ACCOUNT.EXPENSE.COMMISSION.v1' }
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
          metadata: { account_type: 'gl_account', isp_coa: true }
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

async function createServicePlans() {
  // Using pattern: HERA.TELECOM.PRODUCT.{CATEGORY}.{SUBTYPE}.v1
  const services = [
    // Broadband Plans
    { name: 'Home Broadband 50 Mbps', code: 'BB-HOME-50', smart: 'HERA.TELECOM.PRODUCT.BROADBAND.HOME.v1' },
    { name: 'Business Broadband 100 Mbps', code: 'BB-BIZ-100', smart: 'HERA.TELECOM.PRODUCT.BROADBAND.BUSINESS.v1' },
    { name: 'Enterprise Broadband 200 Mbps', code: 'BB-ENT-200', smart: 'HERA.TELECOM.PRODUCT.BROADBAND.ENTERPRISE.v1' },
    
    // Cable TV Plans
    { name: 'Cable TV Basic Pack', code: 'TV-BASIC', smart: 'HERA.TELECOM.PRODUCT.CABLE.BASIC.v1' },
    { name: 'Cable TV Premium Pack', code: 'TV-PREMIUM', smart: 'HERA.TELECOM.PRODUCT.CABLE.PREMIUM.v1' },
    
    // Combo Plans
    { name: 'Home Combo Package', code: 'COMBO-HOME', smart: 'HERA.TELECOM.PRODUCT.COMBO.HOME.v1' },
    
    // Advertisement Products
    { name: 'Prime Time Ad Slot', code: 'AD-PRIME', smart: 'HERA.TELECOM.PRODUCT.ADVERTISEMENT.PRIME.v1' },
    
    // Leased Lines
    { name: 'Enterprise Leased Line', code: 'LL-ENT-10', smart: 'HERA.TELECOM.PRODUCT.LEASED.ENTERPRISE.v1' }
  ];

  let created = 0;
  for (const service of services) {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          entity_type: 'product',
          entity_name: service.name,
          entity_code: service.code,
          smart_code: service.smart,
          metadata: { service_type: 'telecom_service' }
        })
        .select()
        .single();

      if (error) {
        console.log(`  ❌ ${service.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${service.name} (${service.code})`);
        created++;
      }
    } catch (err) {
      console.log(`  ❌ ${service.name}: ${err.message}`);
    }
  }
  console.log(`  📦 Created ${created} service plans`);
}

async function createCustomers() {
  // Using pattern: HERA.TELECOM.CUSTOMER.{CATEGORY}.{SUBTYPE}.v1
  const customers = [
    // Enterprise Customers
    { name: 'TechCorp India Pvt Ltd', code: 'CUST-ENT-001', smart: 'HERA.TELECOM.CUSTOMER.ENTERPRISE.TECH.v1' },
    { name: 'Malabar Shopping Mall', code: 'CUST-ENT-002', smart: 'HERA.TELECOM.CUSTOMER.ENTERPRISE.RETAIL.v1' },
    
    // Business Customers
    { name: 'Kerala Spices Export Co', code: 'CUST-BIZ-001', smart: 'HERA.TELECOM.CUSTOMER.BUSINESS.EXPORT.v1' },
    { name: 'Divine Beauty Salon', code: 'CUST-BIZ-002', smart: 'HERA.TELECOM.CUSTOMER.BUSINESS.SALON.v1' },
    
    // Retail Customers
    { name: 'John Mathew', code: 'CUST-RET-001', smart: 'HERA.TELECOM.CUSTOMER.RETAIL.HOME.v1' },
    { name: 'Sarah Thomas', code: 'CUST-RET-002', smart: 'HERA.TELECOM.CUSTOMER.RETAIL.HOME.v1' }
  ];

  let created = 0;
  for (const customer of customers) {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          entity_type: 'customer',
          entity_name: customer.name,
          entity_code: customer.code,
          smart_code: customer.smart,
          metadata: { customer_category: 'telecom_customer' }
        })
        .select()
        .single();

      if (error) {
        console.log(`  ❌ ${customer.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${customer.name} (${customer.code})`);
        created++;
      }
    } catch (err) {
      console.log(`  ❌ ${customer.name}: ${err.message}`);
    }
  }
  console.log(`  👥 Created ${created} customers`);
}

async function createAgents() {
  // Using pattern: HERA.TELECOM.AGENT.{CATEGORY}.{SUBTYPE}.v1
  const agents = [
    { name: 'Rajesh Kumar - TVM', code: 'AGT-TVM-001', smart: 'HERA.TELECOM.AGENT.FIELD.SOUTH.v1' },
    { name: 'Priya Nair - Kochi', code: 'AGT-COK-001', smart: 'HERA.TELECOM.AGENT.FIELD.CENTRAL.v1' },
    { name: 'Mohammed Ali - Kozhikode', code: 'AGT-CCJ-001', smart: 'HERA.TELECOM.AGENT.FIELD.NORTH.v1' },
    { name: 'Anjali Menon - Kottayam', code: 'AGT-KTM-001', smart: 'HERA.TELECOM.AGENT.FIELD.CENTRAL.v1' },
    { name: 'Suresh Pillai - Kollam', code: 'AGT-KLM-001', smart: 'HERA.TELECOM.AGENT.FIELD.SOUTH.v1' }
  ];

  let created = 0;
  for (const agent of agents) {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          entity_type: 'agent',
          entity_name: agent.name,
          entity_code: agent.code,
          smart_code: agent.smart,
          metadata: { agent_type: 'field_agent' }
        })
        .select()
        .single();

      if (error) {
        console.log(`  ❌ ${agent.name}: ${error.message}`);
      } else {
        console.log(`  ✅ ${agent.name} (${agent.code})`);
        created++;
      }
    } catch (err) {
      console.log(`  ❌ ${agent.name}: ${err.message}`);
    }
  }
  console.log(`  👨‍💼 Created ${created} agents`);
}

async function createSampleTransactions() {
  // Get customers and products for transactions
  const { data: customers } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(2);

  const { data: products } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'product')
    .limit(2);

  if (customers?.length > 0 && products?.length > 0) {
    let created = 0;
    
    // Subscription transaction
    try {
      const { data: transaction, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          transaction_type: 'subscription',
          transaction_code: 'KV/SUB/001/2025',
          transaction_date: new Date().toISOString(),
          source_entity_id: customers[0].id,
          target_entity_id: products[0].id,
          total_amount: 799,
          smart_code: 'HERA.TELECOM.TRANSACTION.SUBSCRIPTION.BROADBAND.v1',
          metadata: {
            transaction_type: 'broadband_subscription',
            monthly_amount: 799
          }
        })
        .select()
        .single();

      if (!error) {
        console.log('  ✅ Broadband subscription created');
        created++;
      } else {
        console.log(`  ❌ Subscription failed: ${error.message}`);
      }
    } catch (err) {
      console.log(`  ❌ Transaction error: ${err.message}`);
    }

    console.log(`  💰 Created ${created} transactions`);
  } else {
    console.log('  ⚠️ No customers or products found');
  }
}

async function verifyData() {
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

    // Show total entities created for Kerala Vision
    console.log(`  🎯 Total ISP entities: ${Object.values(counts || {}).reduce((sum, count) => sum + count, 0)}`);

  } catch (err) {
    console.log(`  ❌ Verification error: ${err.message}`);
  }
}

// Execute the seed data creation
createISPSeedData().catch(console.error);