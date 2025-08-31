// HERA DNA COA Generator - Salon UAE
// This script generates a complete Chart of Accounts for a salon in UAE

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Default organization ID (can be overridden)
const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000';

async function generateSalonCOA(organizationId = DEFAULT_ORG_ID) {
  console.log('🧬 HERA DNA COA Generator - Salon UAE');
  console.log('=====================================\n');
  console.log(`Organization ID: ${organizationId}`);
  console.log(`Industry: Beauty & Wellness Salon`);
  console.log(`Country: United Arab Emirates`);
  console.log(`Features: VAT 5%, Multi-Currency, Service-Based\n`);

  const accounts = [
    // Assets - Cash & Bank
    { code: '1110', name: 'Petty Cash - Reception', type: 'asset', subtype: 'cash', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.CASH.PETTY.v1' },
    { code: '1120', name: 'Cash Register - Main', type: 'asset', subtype: 'cash', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.CASH.REGISTER.v1' },
    { code: '1130', name: 'Bank - Emirates NBD Current', type: 'asset', subtype: 'bank', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.BANK.CURRENT.v1' },
    { code: '1140', name: 'Bank - CBD Business Account', type: 'asset', subtype: 'bank', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.BANK.BUSINESS.v1' },
    { code: '1150', name: 'Credit Card Receivables', type: 'asset', subtype: 'receivable', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.CC.RECEIVABLE.v1' },
    { code: '1160', name: 'Digital Wallet Receivables', type: 'asset', subtype: 'receivable', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.DIGITAL.RECEIVABLE.v1' },
    
    // Assets - Receivables
    { code: '1210', name: 'Customer Receivables - Services', type: 'asset', subtype: 'receivable', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.AR.SERVICE.v1' },
    { code: '1220', name: 'Package Receivables', type: 'asset', subtype: 'receivable', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.AR.PACKAGE.v1' },
    { code: '1230', name: 'Gift Card Receivables', type: 'asset', subtype: 'receivable', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.AR.GIFTCARD.v1' },
    { code: '1240', name: 'Insurance Receivables', type: 'asset', subtype: 'receivable', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.AR.INSURANCE.v1' },
    { code: '1251', name: 'VAT Input Receivable', type: 'asset', subtype: 'tax', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.VAT.INPUT.v1', vatRate: 0.05 },
    
    // Assets - Inventory
    { code: '1310', name: 'Retail Products Inventory', type: 'asset', subtype: 'inventory', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.INV.RETAIL.v1' },
    { code: '1320', name: 'Professional Products Inventory', type: 'asset', subtype: 'inventory', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.INV.PROFESSIONAL.v1' },
    { code: '1330', name: 'Consumable Supplies', type: 'asset', subtype: 'inventory', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.INV.SUPPLIES.v1' },
    { code: '1340', name: 'Spa Supplies Inventory', type: 'asset', subtype: 'inventory', smartCode: 'HERA.FIN.GL.UAE.SALON.ASSET.INV.SPA.v1' },
    
    // Liabilities - Current
    { code: '2110', name: 'Accounts Payable - Suppliers', type: 'liability', subtype: 'payable', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.AP.SUPPLIER.v1' },
    { code: '2120', name: 'Accounts Payable - Contractors', type: 'liability', subtype: 'payable', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.AP.CONTRACTOR.v1' },
    { code: '2150', name: 'Commission Payable - Stylists', type: 'liability', subtype: 'payable', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.COMMISSION.v1' },
    { code: '2160', name: 'Tips Payable', type: 'liability', subtype: 'payable', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.TIPS.v1' },
    
    // Liabilities - Deferred Revenue
    { code: '2210', name: 'Unearned Service Revenue', type: 'liability', subtype: 'deferred', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.UNEARNED.SERVICE.v1' },
    { code: '2220', name: 'Gift Card Liability', type: 'liability', subtype: 'deferred', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.GIFTCARD.v1' },
    { code: '2230', name: 'Package Liability', type: 'liability', subtype: 'deferred', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.PACKAGE.v1' },
    { code: '2251', name: 'VAT Output Payable', type: 'liability', subtype: 'tax', smartCode: 'HERA.FIN.GL.UAE.SALON.LIAB.VAT.OUTPUT.v1', vatRate: 0.05 },
    
    // Revenue - Services
    { code: '4110', name: 'Hair Service Revenue', type: 'revenue', subtype: 'service', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.HAIR.v1', category: 'hair' },
    { code: '4120', name: 'Nail Service Revenue', type: 'revenue', subtype: 'service', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.NAIL.v1', category: 'nail' },
    { code: '4130', name: 'Spa Service Revenue', type: 'revenue', subtype: 'service', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.SPA.v1', category: 'spa' },
    { code: '4140', name: 'Facial Service Revenue', type: 'revenue', subtype: 'service', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.FACIAL.v1', category: 'facial' },
    { code: '4150', name: 'Makeup Service Revenue', type: 'revenue', subtype: 'service', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.MAKEUP.v1', category: 'makeup' },
    { code: '4160', name: 'Bridal Service Revenue', type: 'revenue', subtype: 'service', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.BRIDAL.v1', category: 'bridal' },
    { code: '4170', name: 'Men Grooming Revenue', type: 'revenue', subtype: 'service', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.MENS.v1', category: 'mens' },
    
    // Revenue - Products
    { code: '4210', name: 'Retail Product Sales', type: 'revenue', subtype: 'product', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.RETAIL.v1' },
    { code: '4220', name: 'Professional Product Sales', type: 'revenue', subtype: 'product', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.PROFESSIONAL.v1' },
    
    // Revenue - Packages
    { code: '4310', name: 'Package Sales Revenue', type: 'revenue', subtype: 'package', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.PACKAGE.v1' },
    { code: '4320', name: 'Membership Revenue', type: 'revenue', subtype: 'membership', smartCode: 'HERA.FIN.GL.UAE.SALON.REV.MEMBERSHIP.v1' },
    
    // Cost of Sales
    { code: '5110', name: 'Professional Products Used', type: 'expense', subtype: 'cogs', smartCode: 'HERA.FIN.GL.UAE.SALON.COGS.PRODUCTS.v1' },
    { code: '5120', name: 'Consumable Supplies Used', type: 'expense', subtype: 'cogs', smartCode: 'HERA.FIN.GL.UAE.SALON.COGS.SUPPLIES.v1' },
    { code: '5130', name: 'Stylist Commission', type: 'expense', subtype: 'cogs', smartCode: 'HERA.FIN.GL.UAE.SALON.COGS.COMMISSION.v1' },
    
    // Operating Expenses - Staff
    { code: '6110', name: 'Staff Salaries - Admin', type: 'expense', subtype: 'staff', smartCode: 'HERA.FIN.GL.UAE.SALON.EXP.SALARY.ADMIN.v1' },
    { code: '6120', name: 'Staff Salaries - Reception', type: 'expense', subtype: 'staff', smartCode: 'HERA.FIN.GL.UAE.SALON.EXP.SALARY.RECEPTION.v1' },
    { code: '6150', name: 'Gratuity Expense', type: 'expense', subtype: 'staff', smartCode: 'HERA.FIN.GL.UAE.SALON.EXP.GRATUITY.v1' },
    
    // Operating Expenses - Occupancy
    { code: '6210', name: 'Rent Expense', type: 'expense', subtype: 'occupancy', smartCode: 'HERA.FIN.GL.UAE.SALON.EXP.RENT.v1' },
    { code: '6220', name: 'Utilities - DEWA', type: 'expense', subtype: 'occupancy', smartCode: 'HERA.FIN.GL.UAE.SALON.EXP.UTILITIES.v1' },
    
    // Operating Expenses - Marketing
    { code: '6310', name: 'Digital Marketing', type: 'expense', subtype: 'marketing', smartCode: 'HERA.FIN.GL.UAE.SALON.EXP.MARKETING.DIGITAL.v1' },
    { code: '6320', name: 'Social Media Advertising', type: 'expense', subtype: 'marketing', smartCode: 'HERA.FIN.GL.UAE.SALON.EXP.MARKETING.SOCIAL.v1' },
  ];

  console.log(`📊 Generating ${accounts.length} accounts...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const account of accounts) {
    try {
      // Create the GL account entity
      const { data: entity, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'gl_account',
          entity_code: account.code,
          entity_name: account.name,
          smart_code: account.smartCode,
          status: 'active',
          metadata: {
            account_type: account.type,
            account_subtype: account.subtype,
            currency: 'AED',
            is_active: true,
            vat_applicable: account.type === 'revenue',
            vat_rate: account.vatRate || null,
            service_category: account.category || null,
            ifrs_mapping: {
              statement_type: account.type === 'asset' || account.type === 'liability' ? 'SFP' : 'SPL',
              classification: account.type === 'asset' || account.type === 'liability' ? 'current' : null,
              measurement_basis: 'historical_cost'
            }
          }
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Created: ${account.code} - ${account.name}`);
      successCount++;

      // Add auto-journal rules for revenue accounts
      if (account.type === 'revenue' && account.subtype === 'service') {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            field_name: 'auto_journal_rule',
            field_value_text: 'service_sale',
            smart_code: 'HERA.FIN.AUTO.JOURNAL.RULE.v1'
          });
      }

    } catch (error) {
      console.error(`❌ Error creating ${account.code}: ${error.message}`);
      errorCount++;
    }
  }

  // Create summary
  console.log('\n========================================');
  console.log('📊 SALON UAE COA GENERATION SUMMARY');
  console.log('========================================');
  console.log(`✅ Successfully created: ${successCount} accounts`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('\n🎯 Key Features Generated:');
  console.log('   • VAT compliant (5%) with Input/Output accounts');
  console.log('   • Commission tracking for stylists');
  console.log('   • Tips management system');
  console.log('   • Gift card & package liability tracking');
  console.log('   • Service categories: Hair, Nail, Spa, Facial, Makeup, Bridal, Men\'s');
  console.log('   • Multi-currency ready (AED primary)');
  console.log('   • IFRS compliant with full mapping');
  console.log('   • Auto-journal rules for service sales');
  console.log('\n💡 Next Steps:');
  console.log('   1. Configure opening balances');
  console.log('   2. Set up commission rates by stylist');
  console.log('   3. Configure VAT settings');
  console.log('   4. Test with sample transactions');

  return {
    success: successCount,
    errors: errorCount,
    total: accounts.length
  };
}

// Execute if run directly
if (require.main === module) {
  const orgId = process.argv[2] || DEFAULT_ORG_ID;
  generateSalonCOA(orgId)
    .then(result => {
      console.log('\n✨ COA Generation Complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { generateSalonCOA };