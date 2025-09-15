#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createCleanSalonOrg() {
  console.log('🏢 Creating Clean Salon Organization for DNA Activation\n');
  
  // Create a dedicated organization for clean DNA testing
  const salonOrg = {
    organization_name: 'Hair Talkz Salon - DNA Testing',
    organization_code: 'SALON-DNA-CLEAN',
    organization_type: 'services',
    industry_classification: 'beauty_services',
    status: 'active',
    settings: {
      role: 'standalone',
      country: 'AE',
      city: 'Dubai',
      default_currency: 'AED',
      timezone: 'Asia/Dubai',
      finance_dna_enabled: true,
      fiscal_close_dna_enabled: true,
      auto_journal_enabled: true,
      features_enabled: {
        finance_dna: true,
        fiscal_close_dna: true,
        operational_dna: true,
        auto_journal: true
      }
    }
  };
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('organization_code', salonOrg.organization_code)
    .single();
  
  let orgId;
  
  if (existing) {
    console.log('✅ Organization already exists:', existing.id);
    orgId = existing.id;
  } else {
    const { data, error } = await supabase
      .from('core_organizations')
      .insert(salonOrg)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating organization:', error);
      process.exit(1);
    }
    
    console.log('✅ Created clean salon organization:', data.id);
    orgId = data.id;
  }
  
  // Create fiscal year configuration
  console.log('\n📅 Setting up Fiscal Configuration...');
  
  const fiscalConfig = {
    organization_id: orgId,
    entity_type: 'fiscal_config',
    entity_code: 'FISCAL-2025',
    entity_name: 'Fiscal Year 2025',
    smart_code: 'HERA.SALON.FISCAL.CONFIG.YEAR.v1',
    status: 'active',
    metadata: {
      fiscal_year: 2025,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      calendar_type: 'gregorian',
      period_type: 'monthly',
      periods: generateFiscalPeriods(2025)
    }
  };
  
  const { data: existingFiscal } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_code', fiscalConfig.entity_code)
    .single();
  
  if (!existingFiscal) {
    const { error } = await supabase
      .from('core_entities')
      .insert(fiscalConfig);
    
    if (error) {
      console.error('Error creating fiscal config:', error);
    } else {
      console.log('✅ Created fiscal configuration for 2025');
    }
  } else {
    console.log('✅ Fiscal configuration already exists');
  }
  
  // Create Chart of Accounts
  console.log('\n📊 Setting up Chart of Accounts...');
  
  const accounts = [
    // Assets
    { code: '1100', name: 'Cash', type: 'asset', subtype: 'current_asset', ledger_type: 'debit' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset', ledger_type: 'debit' },
    { code: '1300', name: 'Inventory', type: 'asset', subtype: 'current_asset', ledger_type: 'debit' },
    { code: '1500', name: 'Equipment', type: 'asset', subtype: 'fixed_asset', ledger_type: 'debit' },
    
    // Liabilities
    { code: '2100', name: 'Accounts Payable', type: 'liability', subtype: 'current_liability', ledger_type: 'credit' },
    { code: '2200', name: 'Sales Tax Payable', type: 'liability', subtype: 'current_liability', ledger_type: 'credit' },
    { code: '2300', name: 'Commissions Payable', type: 'liability', subtype: 'current_liability', ledger_type: 'credit' },
    
    // Revenue
    { code: '4100', name: 'Service Revenue', type: 'revenue', subtype: 'operating_revenue', ledger_type: 'credit' },
    { code: '4200', name: 'Product Revenue', type: 'revenue', subtype: 'operating_revenue', ledger_type: 'credit' },
    
    // Expenses
    { code: '5100', name: 'Commission Expense', type: 'expense', subtype: 'operating_expense', ledger_type: 'debit' },
    { code: '5200', name: 'Cost of Goods Sold', type: 'expense', subtype: 'cogs', ledger_type: 'debit' },
    { code: '5300', name: 'Rent Expense', type: 'expense', subtype: 'operating_expense', ledger_type: 'debit' },
    { code: '5400', name: 'Utilities Expense', type: 'expense', subtype: 'operating_expense', ledger_type: 'debit' }
  ];
  
  for (const account of accounts) {
    const glAccount = {
      organization_id: orgId,
      entity_type: 'gl_account',
      entity_code: account.code,
      entity_name: account.name,
      smart_code: `HERA.SALON.GL.ACCOUNT.${account.type.toUpperCase()}.v1`,
      status: 'active',
      metadata: {
        account_type: account.type,
        account_subtype: account.subtype,
        ledger_type: account.ledger_type,
        currency: 'AED',
        ifrs_classification: mapToIFRS(account.type, account.subtype)
      }
    };
    
    const { data: existingAccount } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_code', account.code)
      .single();
    
    if (!existingAccount) {
      const { error } = await supabase
        .from('core_entities')
        .insert(glAccount);
      
      if (error) {
        console.error(`Error creating account ${account.code}:`, error);
      }
    }
  }
  
  console.log('✅ Chart of Accounts ready');
  
  // Return organization details
  console.log('\n🎉 Clean Salon Organization Ready!');
  console.log('=====================================');
  console.log(`Organization ID: ${orgId}`);
  console.log(`Organization Code: SALON-DNA-CLEAN`);
  console.log(`Features Enabled: Finance DNA, Fiscal Close DNA, Auto-Journal`);
  console.log('\nNext Steps:');
  console.log('1. Export SALON_ORG_ID=' + orgId);
  console.log('2. Run Finance DNA activation');
  console.log('3. Seed operational data');
  console.log('4. Test with sample transactions');
  
  return orgId;
}

function generateFiscalPeriods(year) {
  const periods = [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    periods.push({
      period_number: month,
      period_name: `${monthNames[month - 1]} ${year}`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'open',
      period_type: 'monthly'
    });
  }
  
  return periods;
}

function mapToIFRS(type, subtype) {
  const ifrsMapping = {
    asset: {
      current_asset: 'Current Assets',
      fixed_asset: 'Property, Plant and Equipment'
    },
    liability: {
      current_liability: 'Current Liabilities',
      long_term_liability: 'Non-current Liabilities'
    },
    revenue: {
      operating_revenue: 'Revenue from Contracts with Customers',
      other_revenue: 'Other Income'
    },
    expense: {
      operating_expense: 'Operating Expenses',
      cogs: 'Cost of Sales'
    }
  };
  
  return ifrsMapping[type]?.[subtype] || type;
}

createCleanSalonOrg().catch(console.error);