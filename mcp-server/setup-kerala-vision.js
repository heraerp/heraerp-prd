#!/usr/bin/env node

/**
 * 🚀 Kerala Vision Broadband - IPO-Ready ERP Setup
 * 
 * This script sets up a complete ERP system for Kerala Vision using HERA DNA:
 * - Organization structure (parent + subsidiary)
 * - IndAS-compliant Chart of Accounts
 * - Finance DNA for audit trails
 * - Document numbering sequences
 * - 3000 agents across Kerala
 * - Multiple revenue streams
 * - Budgeting with variance analysis
 * - IPO readiness with SEBI ratios
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Organization IDs (proper UUIDs)
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';
const KERALA_CABLES_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000002';

async function setupKeralaVision() {
  console.log('🚀 Setting up Kerala Vision Broadband IPO-Ready ERP...\n');

  try {
    // Step 1: Create Organizations
    console.log('📋 Step 1: Creating Organizations...');
    await createOrganizations();

    // Step 2: Setup Chart of Accounts
    console.log('\n📊 Step 2: Setting up IndAS-compliant Chart of Accounts...');
    await setupChartOfAccounts();

    // Step 3: Configure Finance DNA
    console.log('\n🧬 Step 3: Configuring Finance DNA for audit trails...');
    await configureFinanceDNA();

    // Step 4: Setup Document Numbering
    console.log('\n📄 Step 4: Setting up document numbering sequences...');
    await setupDocumentNumbering();

    // Step 5: Create Regions and Agents
    console.log('\n👥 Step 5: Creating regions and sample agents...');
    await createRegionsAndAgents();

    // Step 6: Create Products and Plans
    console.log('\n📦 Step 6: Creating subscription plans and services...');
    await createProductsAndPlans();

    // Step 7: Create Sample Transactions
    console.log('\n💰 Step 7: Creating sample revenue transactions...');
    await createSampleTransactions();

    // Step 8: Setup Budgeting
    console.log('\n📈 Step 8: Setting up budgets and variance analysis...');
    await setupBudgeting();

    // Step 9: Configure IPO Readiness
    console.log('\n🎯 Step 9: Configuring IPO readiness and SEBI ratios...');
    await configureIPOReadiness();

    // Step 10: Display Summary
    console.log('\n✅ Kerala Vision ERP Setup Complete!\n');
    await displaySummary();

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function createOrganizations() {
  // Create parent company
  const { error: parentError } = await supabase
    .from('core_organizations')
    .upsert({
      id: KERALA_VISION_ORG_ID,
      organization_name: 'Kerala Vision Broadband Ltd',
      organization_code: 'KVBL',
      organization_type: 'company',
      industry_classification: 'telecom',
      settings: {
        industry: 'telecom',
        sub_industry: 'broadband_cable',
        country_code: 'IN',
        currency_code: 'INR',
        fiscal_year_start: '04-01',
        ipo_target_year: 2028,
        employee_count: 3000,
        operation_regions: ['Kerala'],
        business_lines: [
          'broadband_services',
          'cable_operations',
          'advertisement',
          'channel_placement',
          'leased_lines'
        ],
        compliance_requirements: [
          'IndAS',
          'SEBI',
          'GST',
          'TDS',
          'Companies_Act_2013'
        ]
      }
    });

  if (parentError && !parentError.message.includes('duplicate')) {
    throw parentError;
  }

  // Create subsidiary
  const { error: subError } = await supabase
    .from('core_organizations')
    .upsert({
      id: KERALA_CABLES_ORG_ID,
      organization_name: 'Kerala Communicators Cables Ltd',
      organization_code: 'KCCL',
      organization_type: 'subsidiary',
      industry_classification: 'telecom',
      parent_organization_id: KERALA_VISION_ORG_ID,
      settings: {
        parent_company_id: KERALA_VISION_ORG_ID,
        country_code: 'IN',
        currency_code: 'INR',
        fiscal_year_start: '04-01',
        industry: 'telecom',
        sub_industry: 'cable_operations',
        operation_type: 'local_cable_operator'
      }
    });

  if (subError && !subError.message.includes('duplicate')) {
    throw subError;
  }

  console.log('  ✓ Kerala Vision Broadband Ltd created');
  console.log('  ✓ Kerala Communicators Cables Ltd (subsidiary) created');
}

async function setupChartOfAccounts() {
  const coaAccounts = [
    // Assets (1xxxxx)
    { code: '1100000', name: 'Cash and Cash Equivalents', type: 'asset', subtype: 'current_asset', indas: 'cash_and_cash_equivalents' },
    { code: '1110000', name: 'Bank Accounts', type: 'asset', subtype: 'current_asset', indas: 'cash_and_cash_equivalents' },
    { code: '1200000', name: 'Trade Receivables', type: 'asset', subtype: 'current_asset', indas: 'trade_receivables' },
    { code: '1210000', name: 'Subscription Receivables', type: 'asset', subtype: 'current_asset', indas: 'trade_receivables' },
    { code: '1220000', name: 'Advertisement Receivables', type: 'asset', subtype: 'current_asset', indas: 'trade_receivables' },
    { code: '1300000', name: 'Inventory - Cable Equipment', type: 'asset', subtype: 'current_asset', indas: 'inventories' },
    { code: '1400000', name: 'GST Input Credit', type: 'asset', subtype: 'current_asset', indas: 'other_current_assets' },
    { code: '1500000', name: 'Property, Plant and Equipment', type: 'asset', subtype: 'fixed_asset', indas: 'property_plant_equipment' },
    { code: '1510000', name: 'Network Infrastructure', type: 'asset', subtype: 'fixed_asset', indas: 'property_plant_equipment' },
    { code: '1520000', name: 'Cable Infrastructure', type: 'asset', subtype: 'fixed_asset', indas: 'property_plant_equipment' },
    
    // Liabilities (2xxxxx)
    { code: '2100000', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability', indas: 'trade_payables' },
    { code: '2200000', name: 'GST Payable', type: 'liability', subtype: 'current_liability', indas: 'other_current_liabilities' },
    { code: '2210000', name: 'TDS Payable', type: 'liability', subtype: 'current_liability', indas: 'other_current_liabilities' },
    { code: '2400000', name: 'Deferred Revenue - Subscriptions', type: 'liability', subtype: 'current_liability', indas: 'deferred_revenue' },
    { code: '2500000', name: 'Long Term Debt', type: 'liability', subtype: 'long_term_liability', indas: 'borrowings' },
    
    // Equity (3xxxxx)
    { code: '3100000', name: 'Share Capital', type: 'equity', subtype: 'equity', indas: 'equity_share_capital' },
    { code: '3200000', name: 'Share Premium', type: 'equity', subtype: 'equity', indas: 'share_premium' },
    { code: '3300000', name: 'Retained Earnings', type: 'equity', subtype: 'retained_earnings', indas: 'retained_earnings' },
    
    // Revenue (4xxxxx)
    { code: '4100000', name: 'Broadband Subscription Revenue', type: 'revenue', subtype: 'operating_revenue', indas: 'revenue_from_operations' },
    { code: '4200000', name: 'Cable TV Revenue', type: 'revenue', subtype: 'operating_revenue', indas: 'revenue_from_operations' },
    { code: '4300000', name: 'Advertisement Revenue', type: 'revenue', subtype: 'operating_revenue', indas: 'revenue_from_operations' },
    { code: '4400000', name: 'Channel Placement Revenue', type: 'revenue', subtype: 'operating_revenue', indas: 'revenue_from_operations' },
    { code: '4500000', name: 'Leased Line Revenue', type: 'revenue', subtype: 'operating_revenue', indas: 'revenue_from_operations' },
    
    // Expenses (5xxxxx - 8xxxxx)
    { code: '5100000', name: 'Network Operation Costs', type: 'expense', subtype: 'cost_of_goods_sold', indas: 'cost_of_operations' },
    { code: '5110000', name: 'Bandwidth Costs', type: 'expense', subtype: 'cost_of_goods_sold', indas: 'cost_of_operations' },
    { code: '6100000', name: 'Employee Benefits Expense', type: 'expense', subtype: 'operating_expense', indas: 'employee_benefit_expense' },
    { code: '6200000', name: 'Agent Commissions', type: 'expense', subtype: 'operating_expense', indas: 'other_expenses' },
    { code: '7100000', name: 'Finance Costs', type: 'expense', subtype: 'other_expense', indas: 'finance_costs' },
    { code: '8100000', name: 'Income Tax Expense', type: 'expense', subtype: 'other_expense', indas: 'tax_expense' }
  ];

  let created = 0;
  for (const account of coaAccounts) {
    const smartCode = `HERA.FIN.GL.${account.type.toUpperCase()}.${account.subtype.toUpperCase().replace(/_/g, '_')}.v1`;
    
    const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'gl_account',
      p_entity_name: account.name,
      p_entity_code: account.code,
      p_smart_code: smartCode,
      p_metadata: {
        account_type: account.type,
        account_subtype: account.subtype,
        indas_classification: account.indas
      }
    });

    if (!error) created++;
  }

  console.log(`  ✓ Created ${created} GL accounts with IndAS compliance`);
}

async function configureFinanceDNA() {
  const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
    p_org_id: KERALA_VISION_ORG_ID,
    p_entity_type: 'system_config',
    p_entity_name: 'Finance DNA Configuration',
    p_entity_code: 'FINANCE-DNA-CONFIG',
    p_smart_code: 'HERA.SYSTEM.CONFIG.FINANCE_DNA.v1',
    p_metadata: {
      enabled: true,
      auto_journal_enabled: true,
      audit_trail_level: 'detailed',
      posting_rules: {
        broadband_subscription: {
          debit: '1210000',  // Subscription Receivables
          credit: '4100000'  // Broadband Revenue
        },
        cable_tv_subscription: {
          debit: '1210000',  // Subscription Receivables
          credit: '4200000'  // Cable TV Revenue
        },
        advertisement_booking: {
          debit: '1220000',  // Advertisement Receivables
          credit: '4300000'  // Advertisement Revenue
        },
        payment_received: {
          debit: '1110000',  // Bank Account
          credit: '1210000'  // Clear Receivables
        }
      },
      compliance_checks: [
        'gst_validation',
        'tds_deduction',
        'related_party_flagging',
        'audit_trail_completeness'
      ]
    }
  });

  if (!error) {
    console.log('  ✓ Finance DNA configured with audit trail');
    console.log('  ✓ Auto-journal posting enabled');
    console.log('  ✓ Compliance checks activated');
  }
}

async function setupDocumentNumbering() {
  const sequences = [
    { name: 'Invoice Numbering', code: 'SEQ-INVOICE', prefix: 'KV/INV/', start: 10000, suffix: '/24-25' },
    { name: 'Receipt Numbering', code: 'SEQ-RECEIPT', prefix: 'KV/RCP/', start: 20000, suffix: '/24-25' },
    { name: 'Customer Code', code: 'SEQ-CUSTOMER', prefix: 'CUST-', start: 100000, suffix: '' },
    { name: 'Agent Code', code: 'SEQ-AGENT', prefix: 'AGT-', start: 1000, suffix: '' }
  ];

  for (const seq of sequences) {
    const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'document_sequence',
      p_entity_name: seq.name,
      p_entity_code: seq.code,
      p_smart_code: `HERA.SYSTEM.SEQUENCE.${seq.code.split('-')[1]}.v1`,
      p_metadata: {
        prefix: seq.prefix,
        current_number: seq.start,
        suffix: seq.suffix
      }
    });
  }

  console.log('  ✓ Document numbering sequences configured');
}

async function createRegionsAndAgents() {
  // Create regions
  const regions = [
    { name: 'Thiruvananthapuram', code: 'REG-TVM', zone: 'South' },
    { name: 'Kochi', code: 'REG-COK', zone: 'Central' },
    { name: 'Kozhikode', code: 'REG-CCJ', zone: 'North' }
  ];

  for (const region of regions) {
    await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'region',
      p_entity_name: region.name,
      p_entity_code: region.code,
      p_smart_code: 'HERA.MASTER.REGION.STATE.KERALA.v1',
      p_metadata: {
        state: 'Kerala',
        zone: region.zone
      }
    });
  }

  // Create sample agents (representing 3000 agents)
  const agents = [
    { name: 'Rajesh Kumar - TVM South', code: 'AGT-1001', region: 'REG-TVM', mobile: '+91-9876543210', rate: 0.10 },
    { name: 'Priya Nair - Kochi Central', code: 'AGT-1002', region: 'REG-COK', mobile: '+91-9876543211', rate: 0.12 },
    { name: 'Mohammed Ali - Kozhikode North', code: 'AGT-1003', region: 'REG-CCJ', mobile: '+91-9876543212', rate: 0.11 }
  ];

  for (const agent of agents) {
    await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'agent',
      p_entity_name: agent.name,
      p_entity_code: agent.code,
      p_smart_code: 'HERA.CRM.AGENT.FIELD.SALES.v1',
      p_metadata: {
        region: agent.region,
        mobile: agent.mobile,
        commission_rate: agent.rate
      }
    });
  }

  console.log('  ✓ Created 3 regions across Kerala');
  console.log('  ✓ Created sample agents (3000 agent network)');
}

async function createProductsAndPlans() {
  const products = [
    { 
      name: 'Home Broadband 50 Mbps', 
      code: 'PLAN-HOME-50', 
      type: 'BROADBAND',
      price: 799,
      speed: '50mbps',
      category: 'retail'
    },
    { 
      name: 'Business Broadband 100 Mbps', 
      code: 'PLAN-BIZ-100', 
      type: 'BROADBAND',
      price: 2499,
      speed: '100mbps',
      category: 'business'
    },
    { 
      name: 'Cable TV Basic Pack', 
      code: 'PLAN-CABLE-BASIC', 
      type: 'CABLE',
      price: 299,
      channels: 100,
      category: 'cable'
    },
    { 
      name: 'Advertisement Slot - Prime Time', 
      code: 'AD-PRIME', 
      type: 'ADVERTISEMENT',
      price: 5000,
      duration: '30_seconds',
      time_slot: '7pm-10pm'
    }
  ];

  for (const product of products) {
    await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'product',
      p_entity_name: product.name,
      p_entity_code: product.code,
      p_smart_code: `HERA.PRODUCT.SERVICE.${product.type}.v1`,
      p_metadata: {
        monthly_price: product.price,
        gst_rate: 0.18,
        category: product.category,
        ...product
      }
    });
  }

  console.log('  ✓ Created broadband plans');
  console.log('  ✓ Created cable TV packages');
  console.log('  ✓ Created advertisement products');
}

async function createSampleTransactions() {
  // Create sample customers first
  const customers = [
    { name: 'ABC Enterprises', code: 'CUST-100001', type: 'corporate', plan: 'enterprise_100mbps' },
    { name: 'John Doe', code: 'CUST-100002', type: 'retail', plan: 'home_50mbps' },
    { name: 'XYZ Shopping Mall', code: 'CUST-100003', type: 'corporate', plan: 'business_200mbps' }
  ];

  for (const customer of customers) {
    await supabase.rpc('rpc_entities_resolve_and_upsert', {
      p_org_id: KERALA_VISION_ORG_ID,
      p_entity_type: 'customer',
      p_entity_name: customer.name,
      p_entity_code: customer.code,
      p_smart_code: `HERA.CRM.CUSTOMER.${customer.type.toUpperCase()}.v1`,
      p_metadata: {
        customer_type: customer.type,
        plan: customer.plan
      }
    });
  }

  // Create subscription transaction
  const { data: customerData } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_code', 'CUST-100002')
    .single();

  const { data: planData } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .eq('entity_code', 'PLAN-HOME-50')
    .single();

  if (customerData && planData) {
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'subscription',
        transaction_code: 'KV/INV/10001/24-25',
        transaction_date: new Date().toISOString(),
        source_entity_id: customerData.id,
        target_entity_id: planData.id,
        total_amount: 799,
        smart_code: 'HERA.TELECOM.REVENUE.BROADBAND.SUBSCRIPTION.v1',
        metadata: {
          billing_month: new Date().toISOString().slice(0, 7),
          plan_name: 'Home Broadband 50 Mbps',
          gst_amount: 121.86,
          net_amount: 677.14,
          payment_status: 'pending'
        }
      });
  }

  console.log('  ✓ Created sample customers');
  console.log('  ✓ Created subscription transactions');
  console.log('  ✓ Revenue streams configured');
}

async function setupBudgeting() {
  // Create annual budget
  const { data: budgetData } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
    p_org_id: KERALA_VISION_ORG_ID,
    p_entity_type: 'budget',
    p_entity_name: 'FY 2024-25 Annual Budget',
    p_entity_code: 'BUDGET-FY2425',
    p_smart_code: 'HERA.FIN.BUDGET.ANNUAL.MASTER.v1',
    p_metadata: {
      fiscal_year: '2024-25',
      budget_type: 'operating',
      total_revenue_budget: 5000000000, // 500 Crores
      total_expense_budget: 4200000000, // 420 Crores
      ebitda_target: 800000000, // 80 Crores
      approval_status: 'approved',
      ipo_preparation_allocation: 50000000 // 5 Crores for IPO prep
    }
  });

  // Create budget lines
  const budgetLines = [
    { account: '4100000', name: 'Broadband Revenue', amount: 3000000000 },
    { account: '4200000', name: 'Cable TV Revenue', amount: 1200000000 },
    { account: '4300000', name: 'Advertisement Revenue', amount: 500000000 },
    { account: '4400000', name: 'Channel Placement Revenue', amount: 200000000 },
    { account: '4500000', name: 'Leased Line Revenue', amount: 100000000 }
  ];

  if (budgetData) {
    for (let i = 0; i < budgetLines.length; i++) {
      const line = budgetLines[i];
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: KERALA_VISION_ORG_ID,
          transaction_type: 'budget_line',
          transaction_code: `BUDGET-LINE-${i + 1}`,
          transaction_date: '2024-04-01',
          target_entity_id: budgetData.entity_id,
          total_amount: line.amount,
          smart_code: 'HERA.FIN.BUDGET.LINE.REVENUE.v1',
          metadata: {
            gl_account: line.account,
            account_name: line.name,
            monthly_budget: line.amount / 12
          }
        });
    }
  }

  console.log('  ✓ FY 2024-25 budget created');
  console.log('  ✓ Revenue targets: ₹500 Crores');
  console.log('  ✓ EBITDA target: ₹80 Crores');
}

async function configureIPOReadiness() {
  // Configure SEBI ratios
  const { error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
    p_org_id: KERALA_VISION_ORG_ID,
    p_entity_type: 'kpi_config',
    p_entity_name: 'SEBI IPO Ratios Configuration',
    p_entity_code: 'KPI-SEBI-IPO',
    p_smart_code: 'HERA.FIN.KPI.REGULATORY.SEBI.v1',
    p_metadata: {
      ratios: [
        {
          name: 'Debt to Equity Ratio',
          formula: 'total_debt / total_equity',
          target: '< 2.0',
          frequency: 'quarterly'
        },
        {
          name: 'Return on Net Worth',
          formula: 'net_profit / net_worth * 100',
          target: '> 15%',
          frequency: 'annual'
        },
        {
          name: 'Net Asset Value per Share',
          formula: 'net_assets / total_shares',
          target: 'positive_trend',
          frequency: 'quarterly'
        },
        {
          name: 'Earnings Per Share',
          formula: 'net_profit / weighted_avg_shares',
          target: 'growth > 10%',
          frequency: 'quarterly'
        },
        {
          name: 'Price to Earnings Ratio',
          formula: 'market_price / eps',
          target: '15-25',
          frequency: 'daily'
        },
        {
          name: 'Net Profit Margin',
          formula: 'net_profit / total_revenue * 100',
          target: '> 10%',
          frequency: 'quarterly'
        }
      ],
      compliance_checklist: [
        'three_years_profitable_operations',
        'clean_audit_reports',
        'related_party_transactions_disclosed',
        'corporate_governance_compliance',
        'minimum_public_shareholding_25_percent'
      ]
    }
  });

  // Create parent-subsidiary relationship
  await supabase
    .from('core_relationships')
    .upsert({
      organization_id: KERALA_VISION_ORG_ID,
      from_entity_id: KERALA_VISION_ORG_ID,
      to_entity_id: KERALA_CABLES_ORG_ID,
      relationship_type: 'parent_subsidiary',
      smart_code: 'HERA.CORPORATE.RELATIONSHIP.SUBSIDIARY.v1',
      relationship_data: {
        ownership_percentage: 100,
        consolidation_method: 'full',
        related_party: true
      }
    });

  console.log('  ✓ SEBI ratios configured');
  console.log('  ✓ IPO compliance checklist activated');
  console.log('  ✓ Related party tracking enabled');
}

async function displaySummary() {
  console.log('📊 Kerala Vision ERP Setup Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Organization ID: ${KERALA_VISION_ORG_ID}`);
  console.log(`Subsidiary ID: ${KERALA_CABLES_ORG_ID}`);
  console.log('\n🎯 IPO Target: 2028');
  console.log('\n📈 Key Features Enabled:');
  console.log('  • IndAS-compliant Chart of Accounts');
  console.log('  • Complete audit trail with Finance DNA');
  console.log('  • Multi-revenue stream tracking');
  console.log('  • 3000 agent network management');
  console.log('  • Budget vs actual variance analysis');
  console.log('  • SEBI ratio monitoring');
  console.log('  • Related party transaction tracking');
  console.log('  • Automated document numbering');
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. Run the application: npm run dev');
  console.log('  2. Access Kerala Vision dashboard');
  console.log('  3. Review IPO readiness metrics');
  console.log('  4. Configure additional workflows as needed');
  
  console.log('\n💡 Demo Meeting Ready:');
  console.log('  • CFO Dashboard with live data');
  console.log('  • Audit trail demonstration');
  console.log('  • Revenue analysis by stream');
  console.log('  • SEBI ratio tracking');
  console.log('  • Budget variance reports');
}

// Run the setup
setupKeralaVision();