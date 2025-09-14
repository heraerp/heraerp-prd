#!/usr/bin/env node

/**
 * Create Kerala Vision Chart of Accounts with proper smart codes
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

async function createCOA() {
  console.log('🏦 Creating Kerala Vision Chart of Accounts...\n');
  
  const accounts = [
    // Assets - using the exact pattern from working entities HERA.FURNITURE.PRODUCT.OUTDOOR.BENCH.v1
    { code: '1100000', name: 'Cash and Cash Equivalents', type: 'asset', smart: 'HERA.TELECOM.ACCOUNT.CURRENT.CASH.v1' },
    { code: '1110000', name: 'Bank Accounts', type: 'asset', smart: 'HERA.TELECOM.ACCOUNT.CURRENT.BANK.v1' },
    { code: '1200000', name: 'Trade Receivables', type: 'asset', smart: 'HERA.TELECOM.ACCOUNT.CURRENT.RECEIVABLE.v1' },
    { code: '1210000', name: 'Subscription Receivables', type: 'asset', smart: 'HERA.TELECOM.ACCOUNT.CURRENT.SUBSCRIPTION.v1' },
    
    // Liabilities
    { code: '2100000', name: 'Accounts Payable', type: 'liability', smart: 'HERA.TELECOM.ACCOUNT.LIABILITY.PAYABLE.v1' },
    { code: '2200000', name: 'GST Payable', type: 'liability', smart: 'HERA.TELECOM.ACCOUNT.LIABILITY.GST.v1' },
    
    // Equity
    { code: '3100000', name: 'Share Capital', type: 'equity', smart: 'HERA.TELECOM.ACCOUNT.EQUITY.CAPITAL.v1' },
    { code: '3300000', name: 'Retained Earnings', type: 'equity', smart: 'HERA.TELECOM.ACCOUNT.EQUITY.RETAINED.v1' },
    
    // Revenue
    { code: '4100000', name: 'Broadband Revenue', type: 'revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.BROADBAND.v1' },
    { code: '4200000', name: 'Cable TV Revenue', type: 'revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.CABLE.v1' },
    { code: '4300000', name: 'Advertisement Revenue', type: 'revenue', smart: 'HERA.TELECOM.ACCOUNT.REVENUE.ADVERTISING.v1' },
    
    // Expenses
    { code: '5100000', name: 'Network Operation Costs', type: 'expense', smart: 'HERA.TELECOM.ACCOUNT.EXPENSE.NETWORK.v1' },
    { code: '6100000', name: 'Employee Benefits', type: 'expense', smart: 'HERA.TELECOM.ACCOUNT.EXPENSE.PAYROLL.v1' },
    { code: '6200000', name: 'Agent Commissions', type: 'expense', smart: 'HERA.TELECOM.ACCOUNT.EXPENSE.COMMISSION.v1' }
  ];

  let created = 0;
  let errors = 0;

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
            indas_compliant: true
          }
        })
        .select()
        .single();

      if (error) {
        console.log(`❌ ${account.name} (${account.code}): ${error.message}`);
        errors++;
      } else {
        console.log(`✅ ${account.name} (${account.code})`);
        created++;
      }
    } catch (err) {
      console.log(`❌ ${account.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Created: ${created} accounts`);
  console.log(`❌ Errors: ${errors} accounts`);
  
  if (created > 0) {
    console.log(`\n🎉 Kerala Vision Chart of Accounts is ready!`);
    console.log(`Organization ID: ${KERALA_VISION_ORG_ID}`);
  }
}

createCOA().catch(console.error);