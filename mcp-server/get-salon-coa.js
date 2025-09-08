#!/usr/bin/env node
/**
 * HERA Salon Chart of Accounts Extractor
 * Smart Code: HERA.SALON.COA.EXTRACTOR.v1
 * 
 * Extract the complete salon COA for use in journal entry demo
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hair Talkz organization ID
const SALON_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function getSalonCOA() {
  console.log('🏪 Extracting Hair Talkz Salon Chart of Accounts...\n');
  
  try {
    const { data: accounts, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'gl_account')
      .order('entity_code');
      
    if (error) {
      throw error;
    }

    console.log(`📊 Found ${accounts.length} GL accounts\n`);

    // Organize accounts by type based on account code
    const accountsByType = {
      assets: accounts.filter(acc => acc.entity_code.startsWith('1')),
      liabilities: accounts.filter(acc => acc.entity_code.startsWith('2')),
      equity: accounts.filter(acc => acc.entity_code.startsWith('3')),
      revenue: accounts.filter(acc => acc.entity_code.startsWith('4')),
      expenses: accounts.filter(acc => acc.entity_code.startsWith('5'))
    };

    // Display key accounts for journal entries
    console.log('💰 KEY ACCOUNTS FOR JOURNAL ENTRIES:\n');
    
    console.log('🏦 CASH & BANK ACCOUNTS:');
    accountsByType.assets
      .filter(acc => acc.entity_code.startsWith('11'))
      .forEach(acc => {
        console.log(`  ${acc.entity_code} - ${acc.entity_name} (${acc.id})`);
      });

    console.log('\n💳 RECEIVABLES:');
    accountsByType.assets
      .filter(acc => acc.entity_code.startsWith('12'))
      .forEach(acc => {
        console.log(`  ${acc.entity_code} - ${acc.entity_name} (${acc.id})`);
      });

    console.log('\n💸 PAYABLES & LIABILITIES:');
    accountsByType.liabilities
      .slice(0, 10) // Show first 10
      .forEach(acc => {
        console.log(`  ${acc.entity_code} - ${acc.entity_name} (${acc.id})`);
      });

    console.log('\n💰 REVENUE ACCOUNTS:');
    accountsByType.revenue
      .slice(0, 10) // Show first 10
      .forEach(acc => {
        console.log(`  ${acc.entity_code} - ${acc.entity_name} (${acc.id})`);
      });

    console.log('\n💸 EXPENSE ACCOUNTS:');
    accountsByType.expenses
      .slice(0, 10) // Show first 10
      .forEach(acc => {
        console.log(`  ${acc.entity_code} - ${acc.entity_name} (${acc.id})`);
      });

    // Generate account mapping for journal entry demo
    const accountMapping = generateAccountMapping(accounts);
    
    console.log('\n🔧 ACCOUNT MAPPING FOR JOURNAL ENTRY DEMO:');
    console.log('```javascript');
    console.log('const salonCOA = {');
    Object.entries(accountMapping).forEach(([key, account]) => {
      console.log(`  ${key}: { id: '${account.id}', code: '${account.entity_code}', name: '${account.entity_name}' },`);
    });
    console.log('};');
    console.log('```');

    return { accounts, accountMapping };
    
  } catch (error) {
    console.error('❌ Error fetching salon COA:', error);
    throw error;
  }
}

function generateAccountMapping(accounts) {
  const mapping = {};
  
  // Find key accounts for journal entries
  accounts.forEach(acc => {
    const code = acc.entity_code;
    const name = acc.entity_name.toLowerCase();
    
    // Cash accounts
    if (code === '1100000' || name.includes('cash and cash')) {
      mapping.cash_on_hand = acc;
    }
    if (code === '1120000' || name.includes('bank account')) {
      mapping.card_clearing = acc; // Use bank account for card transactions
    }
    
    // Revenue accounts
    if (code.startsWith('41') && (name.includes('service') || name.includes('hair'))) {
      if (!mapping.service_revenue) mapping.service_revenue = acc;
    }
    if (code.startsWith('42') && name.includes('product')) {
      mapping.product_revenue = acc;
    }
    
    // VAT accounts
    if (code.startsWith('225') && (name.includes('vat') || name.includes('tax'))) {
      mapping.vat_output_tax = acc;
    }
    
    // Expense accounts
    if (code.startsWith('51') && (name.includes('salary') || name.includes('wage'))) {
      mapping.commission_expense = acc;
    }
    if (code.startsWith('52') && name.includes('operating')) {
      mapping.operating_expenses = acc;
    }
    
    // Payable accounts
    if (code.startsWith('21') && name.includes('account') && name.includes('payable')) {
      mapping.accounts_payable = acc;
    }
    if (code.startsWith('22') && (name.includes('commission') || name.includes('payroll'))) {
      mapping.commission_payable = acc;
    }
  });
  
  // Fallbacks if specific accounts not found
  if (!mapping.service_revenue) {
    mapping.service_revenue = accounts.find(acc => acc.entity_code.startsWith('41'));
  }
  if (!mapping.operating_expenses) {
    mapping.operating_expenses = accounts.find(acc => acc.entity_code.startsWith('52'));
  }
  if (!mapping.accounts_payable) {
    mapping.accounts_payable = accounts.find(acc => acc.entity_code.startsWith('21'));
  }
  
  return mapping;
}

// Main execution
if (require.main === module) {
  getSalonCOA().catch(error => {
    console.error('Failed to get salon COA:', error);
    process.exit(1);
  });
}

module.exports = {
  getSalonCOA,
  SALON_ORG_ID
};