const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Organization IDs
const organizations = [
  { id: '849b6efe-2bf0-438f-9c70-01835ac2fe15', name: 'Salon Group', isHeadOffice: true },
  { id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', name: 'Hair Talkz • Park Regis Kris Kin (Karama)', isHeadOffice: false },
  { id: '0b1b37cd-4096-4718-8cd4-e370f234005b', name: 'Hair Talkz • Mercure Gold (Al Mina Rd)', isHeadOffice: false }
];

// Define all accounts
const baseAccounts = [
  // ASSETS (1000000-1999999)
  { code: '1100000', name: 'Cash and Cash Equivalents', type: 'asset', ifrs: 'IAS7.45', statement: 'SFP', level: 2, balance: 'debit', control: true },
  { code: '1110000', name: 'Petty Cash', type: 'asset', ifrs: 'IAS7.45', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1120000', name: 'Bank Accounts', type: 'asset', ifrs: 'IAS7.45', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1128000', name: 'Inter-branch Receivables', type: 'asset', ifrs: 'IAS24.18', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1200000', name: 'Accounts Receivable', type: 'asset', ifrs: 'IFRS9.5.1', statement: 'SFP', level: 2, balance: 'debit', control: true },
  { code: '1210000', name: 'Customer Deposits Receivable', type: 'asset', ifrs: 'IFRS9.5.1', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1300000', name: 'Inventory', type: 'asset', ifrs: 'IAS2.36', statement: 'SFP', level: 2, balance: 'debit', control: true },
  { code: '1310000', name: 'Hair Care Products Inventory', type: 'asset', ifrs: 'IAS2.36', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1320000', name: 'Beauty Products Inventory', type: 'asset', ifrs: 'IAS2.36', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1330000', name: 'Chemical Supplies Inventory', type: 'asset', ifrs: 'IAS2.36', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1400000', name: 'Prepaid Expenses', type: 'asset', ifrs: 'IAS1.66', statement: 'SFP', level: 2, balance: 'debit', control: true },
  { code: '1500000', name: 'Property, Plant & Equipment', type: 'asset', ifrs: 'IAS16.73', statement: 'SFP', level: 2, balance: 'debit', control: true },
  { code: '1510000', name: 'Salon Equipment', type: 'asset', ifrs: 'IAS16.37', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1520000', name: 'Furniture & Fixtures', type: 'asset', ifrs: 'IAS16.37', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1530000', name: 'Computer Equipment', type: 'asset', ifrs: 'IAS16.37', statement: 'SFP', level: 3, balance: 'debit', control: false },
  { code: '1590000', name: 'Accumulated Depreciation', type: 'asset', ifrs: 'IAS16.73', statement: 'SFP', level: 3, balance: 'credit', control: false },
  
  // LIABILITIES (2000000-2999999)
  { code: '2100000', name: 'Accounts Payable', type: 'liability', ifrs: 'IAS1.69', statement: 'SFP', level: 2, balance: 'credit', control: true },
  { code: '2110000', name: 'Supplier Payables', type: 'liability', ifrs: 'IAS1.69', statement: 'SFP', level: 3, balance: 'credit', control: false },
  { code: '2180000', name: 'Inter-branch Payables', type: 'liability', ifrs: 'IAS24.18', statement: 'SFP', level: 3, balance: 'credit', control: false },
  { code: '2200000', name: 'Accrued Expenses', type: 'liability', ifrs: 'IAS1.69', statement: 'SFP', level: 2, balance: 'credit', control: true },
  { code: '2210000', name: 'Commission Payable', type: 'liability', ifrs: 'IAS1.69', statement: 'SFP', level: 3, balance: 'credit', control: false },
  { code: '2220000', name: 'Salaries Payable', type: 'liability', ifrs: 'IAS19.5', statement: 'SFP', level: 3, balance: 'credit', control: false },
  { code: '2300000', name: 'Customer Deposits', type: 'liability', ifrs: 'IFRS15.106', statement: 'SFP', level: 2, balance: 'credit', control: true },
  { code: '2310000', name: 'Gift Card Liability', type: 'liability', ifrs: 'IFRS15.106', statement: 'SFP', level: 3, balance: 'credit', control: false },
  { code: '2400000', name: 'VAT Payable', type: 'liability', ifrs: 'IAS1.69', statement: 'SFP', level: 2, balance: 'credit', control: true },
  
  // EQUITY (3000000-3999999)
  { code: '3100000', name: 'Share Capital', type: 'equity', ifrs: 'IAS1.79', statement: 'SFP', level: 2, balance: 'credit', control: true },
  { code: '3200000', name: 'Retained Earnings', type: 'equity', ifrs: 'IAS1.79', statement: 'SFP', level: 2, balance: 'credit', control: true },
  { code: '3300000', name: 'Current Year Earnings', type: 'equity', ifrs: 'IAS1.79', statement: 'SFP', level: 2, balance: 'credit', control: true },
  
  // REVENUE (4000000-4999999)
  { code: '4110000', name: 'Haircut Services Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4120000', name: 'Hair Coloring Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4130000', name: 'Hair Treatment Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4140000', name: 'Beauty Services Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4150000', name: 'Nail Services Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4160000', name: 'Spa Services Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4210000', name: 'Hair Care Products Sales', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4220000', name: 'Beauty Products Sales', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4300000', name: 'Package Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  { code: '4310000', name: 'Membership Revenue', type: 'revenue', ifrs: 'IFRS15.46', statement: 'SPL', level: 3, balance: 'credit', control: false },
  
  // EXPENSES (5000000-5999999)
  { code: '5110000', name: 'Stylist Commission', type: 'expense', ifrs: 'IAS1.103', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5120000', name: 'Beauty Therapist Commission', type: 'expense', ifrs: 'IAS1.103', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5130000', name: 'Product Costs', type: 'expense', ifrs: 'IAS2.34', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5140000', name: 'Chemical Supplies Cost', type: 'expense', ifrs: 'IAS2.34', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5210000', name: 'Staff Salaries', type: 'expense', ifrs: 'IAS19.5', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5220000', name: 'Manager Salaries', type: 'expense', ifrs: 'IAS19.5', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5310000', name: 'Rent Expense', type: 'expense', ifrs: 'IFRS16.53', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5320000', name: 'Utilities Expense', type: 'expense', ifrs: 'IAS1.103', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5330000', name: 'Insurance Expense', type: 'expense', ifrs: 'IAS1.103', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5340000', name: 'Marketing Expense', type: 'expense', ifrs: 'IAS1.103', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5350000', name: 'Professional Fees', type: 'expense', ifrs: 'IAS1.103', statement: 'SPL', level: 3, balance: 'debit', control: false },
  { code: '5360000', name: 'Depreciation Expense', type: 'expense', ifrs: 'IAS16.48', statement: 'SPL', level: 3, balance: 'debit', control: false }
];

// Head office only accounts
const headOfficeAccounts = [
  { code: '9000000', name: 'Consolidation Control', type: 'consolidation', ifrs: 'IFRS10.B86', statement: 'SFP', level: 1, balance: 'debit', control: true },
  { code: '9100000', name: 'Inter-branch Eliminations', type: 'consolidation', ifrs: 'IFRS10.B86', statement: 'SFP', level: 2, balance: 'debit', control: true },
  { code: '9200000', name: 'Consolidated Revenue', type: 'consolidation', ifrs: 'IFRS10.B86', statement: 'SPL', level: 2, balance: 'credit', control: true },
  { code: '9300000', name: 'Consolidated Expenses', type: 'consolidation', ifrs: 'IFRS10.B86', statement: 'SPL', level: 2, balance: 'debit', control: true }
];

async function createAccount(orgId, account) {
  try {
    // Create the GL account entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'gl_account',
        entity_code: account.code,
        entity_name: account.name,
        smart_code: `HERA.SALON.GL.${account.type.toUpperCase()}.${account.code}.v1`
      })
      .select()
      .single();

    if (entityError) {
      console.error(`Error creating account ${account.code}:`, entityError);
      return;
    }

    console.log(`Created account: ${account.code} - ${account.name}`);

    // Create dynamic data for IFRS fields
    const dynamicFields = [
      { field_name: 'ifrs_code', field_value_text: account.ifrs },
      { field_name: 'statement_type', field_value_text: account.statement },
      { field_name: 'account_level', field_value_number: account.level },
      { field_name: 'normal_balance', field_value_text: account.balance },
      { field_name: 'is_control_account', field_value_boolean: account.control },
      { field_name: 'account_type', field_value_text: account.type }
    ];

    for (const field of dynamicFields) {
      const { error: fieldError } = await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: orgId,
          entity_id: entity.id,
          ...field,
          smart_code: `HERA.SALON.GL.FIELD.${field.field_name.toUpperCase()}.v1`
        });

      if (fieldError) {
        console.error(`Error setting field ${field.field_name}:`, fieldError);
      }
    }

  } catch (error) {
    console.error(`Unexpected error creating account ${account.code}:`, error);
  }
}

async function createCOA() {
  console.log('Starting Chart of Accounts creation for multi-branch salon...\n');

  // Process each organization
  for (const org of organizations) {
    console.log(`\n=== Creating COA for ${org.name} ===`);
    
    // Create base accounts for all organizations
    for (const account of baseAccounts) {
      await createAccount(org.id, account);
    }

    // Create head office specific accounts
    if (org.isHeadOffice) {
      console.log('\n--- Adding consolidation accounts for head office ---');
      for (const account of headOfficeAccounts) {
        await createAccount(org.id, account);
      }
    }

    console.log(`\nCompleted COA for ${org.name}`);
  }

  // Create relationships between accounts (parent-child hierarchies)
  console.log('\n=== Creating account relationships ===');
  
  // This would create the hierarchical relationships between control accounts and sub-accounts
  // For example: 1100000 (Cash and Cash Equivalents) is parent of 1110000 (Petty Cash) and 1120000 (Bank Accounts)
  
  console.log('\n✅ Chart of Accounts creation completed!');
  
  // Display summary
  const { count: totalAccounts } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', 'gl_account')
    .in('organization_id', organizations.map(o => o.id));

  console.log(`\n📊 Summary:`);
  console.log(`Total accounts created: ${totalAccounts}`);
  console.log(`Organizations configured: ${organizations.length}`);
  console.log(`Base accounts per org: ${baseAccounts.length}`);
  console.log(`Head office extra accounts: ${headOfficeAccounts.length}`);
}

// Run the script
createCOA().catch(console.error);