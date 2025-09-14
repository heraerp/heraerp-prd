#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function createFinanceData() {
  console.log('💰 Creating Kerala Vision Finance Data...\n');

  // Create Financial Summary Entity
  console.log('📊 Creating financial summary...');
  const { data: financialEntity, error: finError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: KERALA_VISION_ORG_ID,
      entity_type: 'financial_summary',
      entity_name: 'Kerala Vision Financial Dashboard',
      entity_code: 'FIN-SUMMARY-001',
      smart_code: 'HERA.FIN.SUMMARY.DASHBOARD.METRICS.v1',
      metadata: {
        revenue_ytd: 540000000,
        net_profit: 122600000,
        ebitda_margin: 30.2,
        cash_balance: 45000000,
        working_capital: 103000000,
        accounts_receivable: 125000000,
        accounts_payable: 82000000,
        fixed_assets: 82000000,
        current_ratio: 2.26,
        debt_equity_ratio: 0.36
      }
    })
    .select();

  if (!finError) {
    console.log('  ✓ Financial summary created');
  } else {
    console.error('  ❌ Financial summary error:', finError.message);
  }

  // Create GL Accounts
  console.log('\n📚 Creating Chart of Accounts...');
  const glAccounts = [
    // Assets
    { code: '1000', name: 'Assets', type: 'asset', parent: null, balance: 185000000 },
    { code: '1100', name: 'Current Assets', type: 'asset', parent: '1000', balance: 103000000 },
    { code: '1110', name: 'Cash and Cash Equivalents', type: 'asset', parent: '1100', balance: 45000000 },
    { code: '1120', name: 'Accounts Receivable', type: 'asset', parent: '1100', balance: 125000000 },
    { code: '1200', name: 'Fixed Assets', type: 'asset', parent: '1000', balance: 82000000 },
    
    // Liabilities
    { code: '2000', name: 'Liabilities', type: 'liability', parent: null, balance: 82000000 },
    { code: '2100', name: 'Current Liabilities', type: 'liability', parent: '2000', balance: 52000000 },
    { code: '2110', name: 'Accounts Payable', type: 'liability', parent: '2100', balance: 82000000 },
    
    // Equity
    { code: '3000', name: 'Equity', type: 'equity', parent: null, balance: 226000000 },
    { code: '3100', name: 'Share Capital', type: 'equity', parent: '3000', balance: 100000000 },
    { code: '3200', name: 'Retained Earnings', type: 'equity', parent: '3000', balance: 126000000 },
    
    // Revenue
    { code: '4000', name: 'Revenue', type: 'revenue', parent: null, balance: 540000000 },
    { code: '4100', name: 'Service Revenue', type: 'revenue', parent: '4000', balance: 486000000 },
    
    // Expenses
    { code: '5000', name: 'Expenses', type: 'expense', parent: null, balance: 417400000 },
    { code: '5100', name: 'Operating Expenses', type: 'expense', parent: '5000', balance: 350000000 }
  ];

  for (const account of glAccounts) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'gl_account',
        entity_name: account.name,
        entity_code: account.code,
        smart_code: `HERA.FIN.GL.ACCOUNT.${account.type.toUpperCase()}.v1`,
        metadata: {
          account_code: account.code,
          account_type: account.type,
          parent_account: account.parent,
          balance: account.balance,
          currency: 'INR',
          status: 'active'
        }
      });

    if (!error) {
      console.log(`  ✓ Created GL Account: ${account.code} - ${account.name}`);
    }
  }

  // Create Vendors
  console.log('\n🏢 Creating vendor entities...');
  const vendors = [
    {
      name: 'Network Solutions Ltd',
      code: 'VEN-001',
      category: 'Network Equipment',
      payable: 25000000,
      credit_limit: 50000000,
      payment_terms: 'Net 30'
    },
    {
      name: 'Kerala State Electricity Board',
      code: 'VEN-002',
      category: 'Utilities',
      payable: 8500000,
      credit_limit: 20000000,
      payment_terms: 'Net 15'
    },
    {
      name: 'TechPro Consulting',
      code: 'VEN-003',
      category: 'Professional Services',
      payable: 12000000,
      credit_limit: 15000000,
      payment_terms: 'Net 45'
    }
  ];

  for (const vendor of vendors) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'vendor',
        entity_name: vendor.name,
        entity_code: vendor.code,
        smart_code: 'HERA.FIN.VENDOR.PAYABLE.ACTIVE.v1',
        metadata: {
          ...vendor,
          status: 'active',
          contact_person: 'Finance Department',
          email: `finance@${vendor.name.toLowerCase().replace(/\s/g, '')}.com`
        }
      });

    if (!error) {
      console.log(`  ✓ Created vendor: ${vendor.name}`);
    }
  }

  // Create Cost Centers
  console.log('\n💼 Creating cost centers...');
  const costCenters = [
    { name: 'Network Operations', code: 'CC-001', budget: 150000000, type: 'operational' },
    { name: 'Customer Service', code: 'CC-002', budget: 80000000, type: 'support' },
    { name: 'Field Operations', code: 'CC-003', budget: 100000000, type: 'operational' },
    { name: 'Administration', code: 'CC-004', budget: 50000000, type: 'administrative' }
  ];

  for (const cc of costCenters) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'cost_center',
        entity_name: cc.name,
        entity_code: cc.code,
        smart_code: 'HERA.FIN.COST.CENTER.OPERATIONAL.v1',
        metadata: {
          ...cc,
          status: 'active',
          manager: 'Department Head',
          ytd_spend: cc.budget * 0.45 // 45% of budget spent YTD
        }
      });

    if (!error) {
      console.log(`  ✓ Created cost center: ${cc.name}`);
    }
  }

  // Create Profit Centers
  console.log('\n📈 Creating profit centers...');
  const profitCenters = [
    { name: 'Thiruvananthapuram Region', code: 'PC-001', revenue: 216000000, cost: 162000000 },
    { name: 'Kochi Region', code: 'PC-002', revenue: 189000000, cost: 147400000 },
    { name: 'Kozhikode Region', code: 'PC-003', revenue: 135000000, cost: 108000000 }
  ];

  for (const pc of profitCenters) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        entity_type: 'profit_center',
        entity_name: pc.name,
        entity_code: pc.code,
        smart_code: 'HERA.FIN.PROFIT.CENTER.REGIONAL.v1',
        metadata: {
          ...pc,
          profit: pc.revenue - pc.cost,
          margin: ((pc.revenue - pc.cost) / pc.revenue * 100).toFixed(1),
          status: 'active'
        }
      });

    if (!error) {
      console.log(`  ✓ Created profit center: ${pc.name}`);
    }
  }

  // Create Financial Transactions
  console.log('\n💳 Creating financial transactions...');
  
  // Journal Entries
  const journalEntries = [
    {
      entry_number: 'JE-2024-0615',
      description: 'Monthly revenue recognition',
      total_amount: 45000000,
      type: 'revenue_recognition'
    },
    {
      entry_number: 'JE-2024-0614',
      description: 'Network equipment purchase',
      total_amount: 5000000,
      type: 'asset_purchase'
    },
    {
      entry_number: 'JE-2024-0613',
      description: 'Staff salary payment',
      total_amount: 10000000,
      type: 'expense_payment'
    }
  ];

  for (const je of journalEntries) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'journal_entry',
        transaction_code: je.entry_number,
        transaction_date: new Date().toISOString(),
        total_amount: je.total_amount,
        smart_code: 'HERA.FIN.GL.JOURNAL.ENTRY.v1',
        metadata: {
          description: je.description,
          entry_type: je.type,
          status: 'posted',
          created_by: 'Finance System'
        }
      });

    if (!error) {
      console.log(`  ✓ Created journal entry: ${je.entry_number}`);
    }
  }

  // AP Invoices
  const apInvoices = [
    {
      invoice_number: 'INV-2024-0615',
      vendor: 'Network Solutions Ltd',
      amount: 5000000,
      due_date: '2024-07-15'
    },
    {
      invoice_number: 'KSEB-2024-06',
      vendor: 'Kerala State Electricity Board',
      amount: 2500000,
      due_date: '2024-06-16'
    }
  ];

  for (const inv of apInvoices) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: KERALA_VISION_ORG_ID,
        transaction_type: 'ap_invoice',
        transaction_code: inv.invoice_number,
        transaction_date: new Date().toISOString(),
        total_amount: inv.amount,
        smart_code: 'HERA.FIN.AP.INVOICE.PENDING.v1',
        metadata: {
          vendor_name: inv.vendor,
          due_date: inv.due_date,
          status: 'pending',
          approval_status: 'approved'
        }
      });

    if (!error) {
      console.log(`  ✓ Created AP invoice: ${inv.invoice_number}`);
    }
  }

  console.log('\n✅ Finance data creation complete!');
  console.log('\n🚀 Visit http://localhost:3001/finance/dashboard to see the financial management system!');
}

createFinanceData();