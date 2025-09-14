#!/usr/bin/env node

/**
 * 🌐 Create ISP Seed Data for Kerala Vision Broadband
 * Using correct smart code patterns that pass database constraints
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

// Smart code pattern: HERA.ISP.{MODULE}.{TYPE}.{SUBTYPE}.v1
// This follows the constraint: ^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+

async function createISPSeedData() {
  console.log('🌐 Creating ISP Seed Data for Kerala Vision Broadband...\n');

  try {
    // Step 1: Chart of Accounts with correct smart codes
    console.log('📊 Step 1: Creating Chart of Accounts...');
    await createChartOfAccounts();

    // Step 2: Service Plans and Products
    console.log('\n📦 Step 2: Creating Service Plans...');
    await createServicePlans();

    // Step 3: Customers (Enterprise + Retail)
    console.log('\n👥 Step 3: Creating Customer Base...');
    await createCustomers();

    // Step 4: Agent Network
    console.log('\n👨‍💼 Step 4: Creating Agent Network...');
    await createAgentNetwork();

    // Step 5: Sample Transactions
    console.log('\n💰 Step 5: Creating Sample Transactions...');
    await createSampleTransactions();

    // Step 6: Verification
    console.log('\n✅ Step 6: Verification...');
    await verifyISPData();

    console.log('\n🎉 ISP Seed Data Creation Complete!');
    console.log(`Organization: Kerala Vision Broadband Ltd`);
    console.log(`Organization ID: ${KERALA_VISION_ORG_ID}`);
    console.log('Ready for /isp application development!');

  } catch (error) {
    console.error('❌ ISP seed data creation failed:', error);
    process.exit(1);
  }
}

async function createChartOfAccounts() {
  const accounts = [
    // Assets - Following working pattern
    { code: '1100000', name: 'Cash and Cash Equivalents', type: 'asset', smart: 'HERA.ISP.FINANCE.ACCOUNT.CASH.v1' },
    { code: '1110000', name: 'Bank Accounts', type: 'asset', smart: 'HERA.ISP.FINANCE.ACCOUNT.BANK.v1' },
    { code: '1200000', name: 'Trade Receivables', type: 'asset', smart: 'HERA.ISP.FINANCE.RECEIVABLES.TRADE.v1' },
    { code: '1210000', name: 'Subscription Receivables', type: 'asset', smart: 'HERA.ISP.FINANCE.RECEIVABLES.SUBSCRIPTION.v1' },
    { code: '1220000', name: 'Advertisement Receivables', type: 'asset', smart: 'HERA.ISP.FINANCE.RECEIVABLES.ADVERTISEMENT.v1' },
    { code: '1300000', name: 'Equipment Inventory', type: 'asset', smart: 'HERA.ISP.INVENTORY.EQUIPMENT.GENERAL.v1' },
    { code: '1500000', name: 'Network Infrastructure', type: 'asset', smart: 'HERA.ISP.ASSETS.INFRASTRUCTURE.NETWORK.v1' },
    { code: '1510000', name: 'Cable Infrastructure', type: 'asset', smart: 'HERA.ISP.ASSETS.INFRASTRUCTURE.CABLE.v1' },
    
    // Liabilities
    { code: '2100000', name: 'Accounts Payable', type: 'liability', smart: 'HERA.ISP.FINANCE.PAYABLES.TRADE.v1' },
    { code: '2200000', name: 'GST Payable', type: 'liability', smart: 'HERA.ISP.FINANCE.PAYABLES.GST.v1' },
    { code: '2210000', name: 'TDS Payable', type: 'liability', smart: 'HERA.ISP.FINANCE.PAYABLES.TDS.v1' },
    
    // Equity
    { code: '3100000', name: 'Share Capital', type: 'equity', smart: 'HERA.ISP.FINANCE.EQUITY.CAPITAL.v1' },
    { code: '3200000', name: 'Share Premium', type: 'equity', smart: 'HERA.ISP.FINANCE.EQUITY.PREMIUM.v1' },
    { code: '3300000', name: 'Retained Earnings', type: 'equity', smart: 'HERA.ISP.FINANCE.EQUITY.RETAINED.v1' },
    
    // Revenue
    { code: '4100000', name: 'Broadband Revenue', type: 'revenue', smart: 'HERA.ISP.REVENUE.BROADBAND.SUBSCRIPTION.v1' },
    { code: '4200000', name: 'Cable TV Revenue', type: 'revenue', smart: 'HERA.ISP.REVENUE.CABLE.SUBSCRIPTION.v1' },
    { code: '4300000', name: 'Advertisement Revenue', type: 'revenue', smart: 'HERA.ISP.REVENUE.ADVERTISEMENT.SLOTS.v1' },
    { code: '4400000', name: 'Channel Placement Revenue', type: 'revenue', smart: 'HERA.ISP.REVENUE.CHANNEL.PLACEMENT.v1' },
    { code: '4500000', name: 'Leased Line Revenue', type: 'revenue', smart: 'HERA.ISP.REVENUE.ENTERPRISE.LEASED.v1' },
    
    // Expenses
    { code: '5100000', name: 'Network Operation Costs', type: 'expense', smart: 'HERA.ISP.EXPENSE.OPERATIONS.NETWORK.v1' },
    { code: '5110000', name: 'Bandwidth Costs', type: 'expense', smart: 'HERA.ISP.EXPENSE.OPERATIONS.BANDWIDTH.v1' },
    { code: '6100000', name: 'Employee Costs', type: 'expense', smart: 'HERA.ISP.EXPENSE.PAYROLL.EMPLOYEE.v1' },
    { code: '6200000', name: 'Agent Commissions', type: 'expense', smart: 'HERA.ISP.EXPENSE.PAYROLL.COMMISSION.v1' }
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
            isp_specific: true
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

async function createServicePlans() {
  const services = [
    // Broadband Plans
    { 
      name: 'Home Broadband 50 Mbps', 
      code: 'BB-HOME-50', 
      smart: 'HERA.ISP.PRODUCT.BROADBAND.HOME.v1',
      category: 'broadband',
      metadata: { speed: '50mbps', monthly_price: 799, data_limit: 'unlimited', customer_type: 'retail' }
    },
    { 
      name: 'Business Broadband 100 Mbps', 
      code: 'BB-BIZ-100', 
      smart: 'HERA.ISP.PRODUCT.BROADBAND.BUSINESS.v1',
      category: 'broadband',
      metadata: { speed: '100mbps', monthly_price: 2499, data_limit: 'unlimited', customer_type: 'business' }
    },
    { 
      name: 'Enterprise Broadband 200 Mbps', 
      code: 'BB-ENT-200', 
      smart: 'HERA.ISP.PRODUCT.BROADBAND.ENTERPRISE.v1',
      category: 'broadband',
      metadata: { speed: '200mbps', monthly_price: 4999, data_limit: 'unlimited', customer_type: 'enterprise' }
    },
    
    // Cable TV Plans
    { 
      name: 'Cable TV Basic Pack', 
      code: 'TV-BASIC', 
      smart: 'HERA.ISP.PRODUCT.CABLE.BASIC.v1',
      category: 'cable_tv',
      metadata: { channels: 100, monthly_price: 299, hd_channels: 25 }
    },
    { 
      name: 'Cable TV Premium Pack', 
      code: 'TV-PREMIUM', 
      smart: 'HERA.ISP.PRODUCT.CABLE.PREMIUM.v1',
      category: 'cable_tv',
      metadata: { channels: 200, monthly_price: 599, hd_channels: 75 }
    },
    
    // Combo Plans
    { 
      name: 'Home Combo 50 Mbps + Basic TV', 
      code: 'COMBO-HOME', 
      smart: 'HERA.ISP.PRODUCT.COMBO.HOME.v1',
      category: 'combo',
      metadata: { broadband_speed: '50mbps', cable_channels: 100, monthly_price: 999, savings: 99 }
    },
    
    // Advertisement Products
    { 
      name: 'Prime Time Advertisement Slot', 
      code: 'AD-PRIME', 
      smart: 'HERA.ISP.PRODUCT.ADVERTISEMENT.PRIME.v1',
      category: 'advertisement',
      metadata: { duration: '30_seconds', rate_per_slot: 5000, time_slot: '7pm-10pm' }
    },
    
    // Leased Lines
    { 
      name: 'Enterprise Leased Line 10 Mbps', 
      code: 'LL-ENT-10', 
      smart: 'HERA.ISP.PRODUCT.LEASED.ENTERPRISE.v1',
      category: 'leased_line',
      metadata: { bandwidth: '10mbps', monthly_price: 15000, dedicated: true }
    }
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
          metadata: {
            category: service.category,
            ...service.metadata
          }
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
  const customers = [
    // Enterprise Customers
    { 
      name: 'TechCorp India Pvt Ltd', 
      code: 'CUST-ENT-001', 
      smart: 'HERA.ISP.CUSTOMER.ENTERPRISE.TECH.v1',
      type: 'enterprise',
      metadata: { 
        industry: 'technology', 
        employee_count: 500, 
        credit_limit: 500000,
        region: 'Kochi',
        contact_person: 'Rajesh Kumar',
        gst_number: '32AALCT1234L1ZS'
      }
    },
    { 
      name: 'Malabar Shopping Mall', 
      code: 'CUST-ENT-002', 
      smart: 'HERA.ISP.CUSTOMER.ENTERPRISE.RETAIL.v1',
      type: 'enterprise',
      metadata: { 
        industry: 'retail', 
        employee_count: 200, 
        credit_limit: 300000,
        region: 'Kozhikode',
        contact_person: 'Priya Nair'
      }
    },
    
    // Business Customers
    { 
      name: 'Kerala Spices Export Co', 
      code: 'CUST-BIZ-001', 
      smart: 'HERA.ISP.CUSTOMER.BUSINESS.EXPORT.v1',
      type: 'business',
      metadata: { 
        industry: 'export', 
        employee_count: 50, 
        credit_limit: 100000,
        region: 'Thiruvananthapuram'
      }
    },
    { 
      name: 'Divine Beauty Salon Chain', 
      code: 'CUST-BIZ-002', 
      smart: 'HERA.ISP.CUSTOMER.BUSINESS.SALON.v1',
      type: 'business',
      metadata: { 
        industry: 'beauty', 
        employee_count: 25, 
        credit_limit: 50000,
        region: 'Kochi'
      }
    },
    
    // Retail Customers
    { 
      name: 'John Mathew', 
      code: 'CUST-RET-001', 
      smart: 'HERA.ISP.CUSTOMER.RETAIL.HOME.v1',
      type: 'retail',
      metadata: { 
        address: 'TC 15/456, Pattom, Thiruvananthapuram',
        mobile: '+91-9876543210',
        region: 'Thiruvananthapuram'
      }
    },
    { 
      name: 'Sarah Thomas', 
      code: 'CUST-RET-002', 
      smart: 'HERA.ISP.CUSTOMER.RETAIL.HOME.v1',
      type: 'retail',
      metadata: { 
        address: 'Flat 201, Marine Drive, Kochi',
        mobile: '+91-9876543211',
        region: 'Kochi'
      }
    }
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
          metadata: {
            customer_type: customer.type,
            ...customer.metadata
          }
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

async function createAgentNetwork() {
  const agents = [
    { 
      name: 'Rajesh Kumar - TVM South', 
      code: 'AGT-TVM-001', 
      smart: 'HERA.ISP.AGENT.FIELD.SOUTH.v1',
      region: 'Thiruvananthapuram',
      metadata: { 
        territory: 'TVM_SOUTH', 
        mobile: '+91-9876543210', 
        commission_rate: 0.10,
        target_monthly: 50,
        experience_years: 5
      }
    },
    { 
      name: 'Priya Nair - Kochi Central', 
      code: 'AGT-COK-001', 
      smart: 'HERA.ISP.AGENT.FIELD.CENTRAL.v1',
      region: 'Kochi',
      metadata: { 
        territory: 'KOCHI_CENTRAL', 
        mobile: '+91-9876543211', 
        commission_rate: 0.12,
        target_monthly: 75,
        experience_years: 8
      }
    },
    { 
      name: 'Mohammed Ali - Kozhikode North', 
      code: 'AGT-CCJ-001', 
      smart: 'HERA.ISP.AGENT.FIELD.NORTH.v1',
      region: 'Kozhikode',
      metadata: { 
        territory: 'KOZHIKODE_NORTH', 
        mobile: '+91-9876543212', 
        commission_rate: 0.11,
        target_monthly: 60,
        experience_years: 6
      }
    },
    { 
      name: 'Anjali Menon - Kottayam', 
      code: 'AGT-KTM-001', 
      smart: 'HERA.ISP.AGENT.FIELD.CENTRAL.v1',
      region: 'Kottayam',
      metadata: { 
        territory: 'KOTTAYAM', 
        mobile: '+91-9876543213', 
        commission_rate: 0.10,
        target_monthly: 40,
        experience_years: 3
      }
    },
    { 
      name: 'Suresh Pillai - Kollam', 
      code: 'AGT-KLM-001', 
      smart: 'HERA.ISP.AGENT.FIELD.SOUTH.v1',
      region: 'Kollam',
      metadata: { 
        territory: 'KOLLAM', 
        mobile: '+91-9876543214', 
        commission_rate: 0.09,
        target_monthly: 35,
        experience_years: 4
      }
    }
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
          metadata: {
            region: agent.region,
            ...agent.metadata
          }
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
  // Get customer and product IDs for transaction creation
  const { data: customers } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(3);

  const { data: products } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_type', 'product')
    .limit(3);

  if (customers?.length > 0 && products?.length > 0) {
    let created = 0;
    
    // Create broadband subscription
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
          smart_code: 'HERA.ISP.TRANSACTION.SUBSCRIPTION.BROADBAND.v1',
          metadata: {
            subscription_type: 'broadband',
            plan: 'Home 50 Mbps',
            monthly_recurring: true,
            billing_cycle: 'monthly'
          }
        })
        .select()
        .single();

      if (!error) {
        console.log('  ✅ Broadband subscription transaction created');
        created++;
      } else {
        console.log(`  ❌ Subscription transaction failed: ${error.message}`);
      }
    } catch (err) {
      console.log(`  ❌ Transaction error: ${err.message}`);
    }

    // Create advertisement booking
    try {
      const { data: adTransaction, error: adError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          transaction_type: 'advertisement',
          transaction_code: 'KV/AD/001/2025',
          transaction_date: new Date().toISOString(),
          source_entity_id: customers[1].id,
          target_entity_id: products.find(p => p.entity_code === 'AD-PRIME')?.id || products[1].id,
          total_amount: 25000,
          smart_code: 'HERA.ISP.TRANSACTION.ADVERTISEMENT.BOOKING.v1',
          metadata: {
            campaign_name: 'New Year Sale 2025',
            slots_booked: 5,
            time_slot: 'prime_time',
            broadcast_dates: ['2025-01-01', '2025-01-02', '2025-01-03']
          }
        })
        .select()
        .single();

      if (!adError) {
        console.log('  ✅ Advertisement booking transaction created');
        created++;
      } else {
        console.log(`  ❌ Advertisement transaction failed: ${adError.message}`);
      }
    } catch (err) {
      console.log(`  ❌ Advertisement transaction error: ${err.message}`);
    }

    console.log(`  💰 Created ${created} sample transactions`);
  } else {
    console.log('  ⚠️ No customers or products found for transaction creation');
  }
}

async function verifyISPData() {
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

    // Check organization
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

// Run the seed data creation
createISPSeedData().catch(console.error);