#!/usr/bin/env node

/**
 * HERA Industry-Specific Chart of Accounts Templates
 * Creates specialized COA templates for different industries
 * Based on proven patterns from existing salon and telecom implementations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001';

// Industry-specific account templates
const INDUSTRY_TEMPLATES = {
  // ============================================================================
  // SALON & BEAUTY INDUSTRY
  // ============================================================================
  salon: [
    // Salon-specific Assets
    { 
      code: '1350000', name: 'Salon Equipment', type: 'asset', subtype: 'equipment', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.ASSET.EQUIPMENT.SALON.v1',
      ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
      description: 'Hair stations, chairs, dryers and salon-specific equipment',
      industry: 'salon'
    },
    { 
      code: '1360000', name: 'Beauty Products Inventory', type: 'asset', subtype: 'inventory', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.ASSET.INVENTORY.BEAUTY.v1',
      ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
      description: 'Hair care products, cosmetics and beauty supplies',
      industry: 'salon'
    },

    // Salon-specific Liabilities
    { 
      code: '2350000', name: 'Stylist Commission Payable', type: 'liability', subtype: 'accrued', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.LIABILITY.COMMISSION.STYLIST.v1',
      ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
      description: 'Accrued commission owed to stylists and beauty professionals',
      industry: 'salon'
    },
    { 
      code: '2360000', name: 'Tips Payable', type: 'liability', subtype: 'accrued', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.LIABILITY.TIPS.v1',
      ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
      description: 'Customer tips collected for staff distribution',
      industry: 'salon'
    },
    { 
      code: '2370000', name: 'Package Treatment Liability', type: 'liability', subtype: 'deferred', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.LIABILITY.PACKAGE.v1',
      ifrs: 'IFRS15.106', statement: 'SFP', balance: 'credit',
      description: 'Prepaid treatment packages and beauty service packages',
      industry: 'salon'
    },

    // Salon-specific Revenue
    { 
      code: '4150000', name: 'Hair Services Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.REVENUE.HAIR.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Haircut, styling and hair treatment services',
      industry: 'salon'
    },
    { 
      code: '4160000', name: 'Beauty Services Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.REVENUE.BEAUTY.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Facial, nail and spa services revenue',
      industry: 'salon'
    },
    { 
      code: '4170000', name: 'Bridal Services Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.REVENUE.BRIDAL.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Wedding and special occasion beauty services',
      industry: 'salon'
    },

    // Salon-specific Expenses
    { 
      code: '5160000', name: 'Product Usage Cost', type: 'expense', subtype: 'cogs', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.EXPENSE.PRODUCTS.v1',
      ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
      description: 'Beauty products consumed in service delivery',
      industry: 'salon'
    },
    { 
      code: '6170000', name: 'Equipment Maintenance', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.SALON.FINANCE.GL.EXPENSE.MAINTENANCE.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Salon equipment maintenance and repair costs',
      industry: 'salon'
    }
  ],

  // ============================================================================
  // RESTAURANT & FOOD SERVICE INDUSTRY
  // ============================================================================
  restaurant: [
    // Restaurant-specific Assets
    { 
      code: '1370000', name: 'Kitchen Equipment', type: 'asset', subtype: 'equipment', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.ASSET.EQUIPMENT.KITCHEN.v1',
      ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
      description: 'Commercial kitchen equipment, ovens, refrigeration units',
      industry: 'restaurant'
    },
    { 
      code: '1380000', name: 'Food Inventory', type: 'asset', subtype: 'inventory', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.ASSET.INVENTORY.FOOD.v1',
      ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
      description: 'Fresh ingredients, packaged foods and beverage inventory',
      industry: 'restaurant'
    },
    { 
      code: '1390000', name: 'Beverage Inventory', type: 'asset', subtype: 'inventory', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.ASSET.INVENTORY.BEVERAGE.v1',
      ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
      description: 'Alcoholic and non-alcoholic beverage inventory',
      industry: 'restaurant'
    },

    // Restaurant-specific Liabilities
    { 
      code: '2380000', name: 'Server Tips Payable', type: 'liability', subtype: 'accrued', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.LIABILITY.TIPS.SERVER.v1',
      ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
      description: 'Tips collected for distribution to service staff',
      industry: 'restaurant'
    },
    { 
      code: '2390000', name: 'Delivery Platform Payable', type: 'liability', subtype: 'payable', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.LIABILITY.DELIVERY.v1',
      ifrs: 'IAS1.69', statement: 'SFP', balance: 'credit',
      description: 'Amounts owed to third-party delivery platforms',
      industry: 'restaurant'
    },

    // Restaurant-specific Revenue
    { 
      code: '4180000', name: 'Food Sales Revenue', type: 'revenue', subtype: 'product', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.REVENUE.FOOD.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Revenue from food items and meals',
      industry: 'restaurant'
    },
    { 
      code: '4190000', name: 'Beverage Sales Revenue', type: 'revenue', subtype: 'product', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.REVENUE.BEVERAGE.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Revenue from alcoholic and non-alcoholic beverages',
      industry: 'restaurant'
    },
    { 
      code: '4350000', name: 'Catering Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.REVENUE.CATERING.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Revenue from catering and event services',
      industry: 'restaurant'
    },

    // Restaurant-specific Expenses
    { 
      code: '5170000', name: 'Food Cost', type: 'expense', subtype: 'cogs', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.EXPENSE.FOOD.v1',
      ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
      description: 'Direct cost of food ingredients and supplies',
      industry: 'restaurant'
    },
    { 
      code: '5180000', name: 'Beverage Cost', type: 'expense', subtype: 'cogs', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.EXPENSE.BEVERAGE.v1',
      ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
      description: 'Direct cost of beverages and bar supplies',
      industry: 'restaurant'
    },
    { 
      code: '6180000', name: 'Food Safety & Compliance', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.RESTAURANT.FINANCE.GL.EXPENSE.COMPLIANCE.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Health permits, inspections and food safety compliance',
      industry: 'restaurant'
    }
  ],

  // ============================================================================
  // TELECOMMUNICATIONS & ISP INDUSTRY
  // ============================================================================
  telecom: [
    // Telecom-specific Assets
    { 
      code: '1400000', name: 'Network Infrastructure', type: 'asset', subtype: 'equipment', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.ASSET.INFRASTRUCTURE.v1',
      ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
      description: 'Fiber optic cables, towers and network equipment',
      industry: 'telecom'
    },
    { 
      code: '1410000', name: 'Customer Equipment', type: 'asset', subtype: 'equipment', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.ASSET.CUSTOMER_EQUIPMENT.v1',
      ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
      description: 'Modems, routers and set-top boxes deployed to customers',
      industry: 'telecom'
    },

    // Telecom-specific Revenue
    { 
      code: '4360000', name: 'Broadband Revenue', type: 'revenue', subtype: 'subscription', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.REVENUE.BROADBAND.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Monthly broadband internet service revenue',
      industry: 'telecom'
    },
    { 
      code: '4370000', name: 'Cable TV Revenue', type: 'revenue', subtype: 'subscription', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.REVENUE.CABLE.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Cable television subscription revenue',
      industry: 'telecom'
    },
    { 
      code: '4380000', name: 'Installation Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.REVENUE.INSTALLATION.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'One-time installation and setup fees',
      industry: 'telecom'
    },

    // Telecom-specific Expenses
    { 
      code: '5190000', name: 'Network Operations Cost', type: 'expense', subtype: 'cogs', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.EXPENSE.NETWORK_OPS.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Network maintenance, monitoring and operations costs',
      industry: 'telecom'
    },
    { 
      code: '5250000', name: 'Agent Commission', type: 'expense', subtype: 'personnel', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.EXPENSE.AGENT_COMMISSION.v1',
      ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
      description: 'Commission paid to sales agents and channel partners',
      industry: 'telecom'
    },
    { 
      code: '6190000', name: 'Spectrum License Fees', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.TELECOM.FINANCE.GL.EXPENSE.LICENSE.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Regulatory fees and spectrum licensing costs',
      industry: 'telecom'
    }
  ],

  // ============================================================================
  // MANUFACTURING INDUSTRY
  // ============================================================================
  manufacturing: [
    // Manufacturing-specific Assets
    { 
      code: '1420000', name: 'Manufacturing Equipment', type: 'asset', subtype: 'equipment', level: 3, control: false,
      smartCode: 'HERA.MANUFACTURING.FINANCE.GL.ASSET.EQUIPMENT.v1',
      ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
      description: 'Production machinery, assembly lines and manufacturing equipment',
      industry: 'manufacturing'
    },
    { 
      code: '1430000', name: 'Production Tooling', type: 'asset', subtype: 'equipment', level: 3, control: false,
      smartCode: 'HERA.MANUFACTURING.FINANCE.GL.ASSET.TOOLING.v1',
      ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
      description: 'Specialized tools, dies and molds for production',
      industry: 'manufacturing'
    },

    // Manufacturing-specific Revenue
    { 
      code: '4390000', name: 'Contract Manufacturing Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
      smartCode: 'HERA.MANUFACTURING.FINANCE.GL.REVENUE.CONTRACT.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Revenue from contract manufacturing services',
      industry: 'manufacturing'
    },

    // Manufacturing-specific Expenses
    { 
      code: '5200000', name: 'Production Labor', type: 'expense', subtype: 'cogs', level: 3, control: false,
      smartCode: 'HERA.MANUFACTURING.FINANCE.GL.EXPENSE.PRODUCTION_LABOR.v1',
      ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
      description: 'Direct production worker wages and benefits',
      industry: 'manufacturing'
    },
    { 
      code: '5210000', name: 'Manufacturing Overhead', type: 'expense', subtype: 'cogs', level: 3, control: false,
      smartCode: 'HERA.MANUFACTURING.FINANCE.GL.EXPENSE.OVERHEAD.v1',
      ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
      description: 'Indirect production costs and factory overhead',
      industry: 'manufacturing'
    },
    { 
      code: '6350000', name: 'Quality Assurance', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.MANUFACTURING.FINANCE.GL.EXPENSE.QA.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Quality control and assurance program costs',
      industry: 'manufacturing'
    }
  ],

  // ============================================================================
  // RETAIL INDUSTRY
  // ============================================================================
  retail: [
    // Retail-specific Assets
    { 
      code: '1440000', name: 'Merchandise Inventory', type: 'asset', subtype: 'inventory', level: 3, control: false,
      smartCode: 'HERA.RETAIL.FINANCE.GL.ASSET.MERCHANDISE.v1',
      ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
      description: 'Retail merchandise and finished goods for resale',
      industry: 'retail'
    },
    { 
      code: '1450000', name: 'Store Fixtures', type: 'asset', subtype: 'equipment', level: 3, control: false,
      smartCode: 'HERA.RETAIL.FINANCE.GL.ASSET.FIXTURES.v1',
      ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
      description: 'Display cases, shelving and store fixtures',
      industry: 'retail'
    },

    // Retail-specific Revenue
    { 
      code: '4400000', name: 'Merchandise Sales', type: 'revenue', subtype: 'product', level: 3, control: false,
      smartCode: 'HERA.RETAIL.FINANCE.GL.REVENUE.MERCHANDISE.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'Revenue from retail merchandise sales',
      industry: 'retail'
    },
    { 
      code: '4450000', name: 'Online Sales Revenue', type: 'revenue', subtype: 'product', level: 3, control: false,
      smartCode: 'HERA.RETAIL.FINANCE.GL.REVENUE.ONLINE.v1',
      ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
      description: 'E-commerce and online sales revenue',
      industry: 'retail'
    },

    // Retail-specific Expenses
    { 
      code: '5220000', name: 'Cost of Merchandise Sold', type: 'expense', subtype: 'cogs', level: 3, control: false,
      smartCode: 'HERA.RETAIL.FINANCE.GL.EXPENSE.MERCHANDISE_COST.v1',
      ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
      description: 'Direct cost of merchandise sold to customers',
      industry: 'retail'
    },
    { 
      code: '6250000', name: 'Store Operations', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.RETAIL.FINANCE.GL.EXPENSE.STORE_OPS.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Store management and retail operations costs',
      industry: 'retail'
    },
    { 
      code: '6360000', name: 'Visual Merchandising', type: 'expense', subtype: 'marketing', level: 3, control: false,
      smartCode: 'HERA.RETAIL.FINANCE.GL.EXPENSE.MERCHANDISING.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Store displays and visual merchandising costs',
      industry: 'retail'
    }
  ]
};

async function createIndustryTemplate(industryName, accounts) {
  console.log(`\n🏭 Creating ${industryName.toUpperCase()} Industry Template`);
  console.log('='.repeat(50));
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const account of accounts) {
    try {
      // Create industry-specific GL account
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'gl_account',
          entity_code: account.code,
          entity_name: account.name,
          smart_code: account.smartCode,
          created_by: PLATFORM_USER_ID,
          updated_by: PLATFORM_USER_ID,
          status: 'active',
          metadata: {
            account_type: account.type,
            account_subtype: account.subtype,
            account_level: account.level,
            is_control_account: account.control,
            normal_balance: account.balance,
            industry: account.industry,
            currency: 'MULTI',
            is_active: true,
            description: account.description,
            industry_specific: true,
            ifrs_mapping: {
              ifrs_code: account.ifrs,
              statement_type: account.statement,
              classification: account.level === 2 ? 'control' : 'detail'
            }
          }
        })
        .select()
        .single();

      if (entityError) throw entityError;

      // Add industry-specific dynamic data
      const dynamicFields = [
        { field_name: 'account_type', field_type: 'text', field_value_text: account.type },
        { field_name: 'account_subtype', field_type: 'text', field_value_text: account.subtype },
        { field_name: 'industry', field_type: 'text', field_value_text: account.industry },
        { field_name: 'industry_specific', field_type: 'boolean', field_value_boolean: true },
        { field_name: 'account_level', field_type: 'number', field_value_number: account.level },
        { field_name: 'is_control_account', field_type: 'boolean', field_value_boolean: account.control },
        { field_name: 'normal_balance', field_type: 'text', field_value_text: account.balance },
        { field_name: 'ifrs_code', field_type: 'text', field_value_text: account.ifrs },
        { field_name: 'statement_type', field_type: 'text', field_value_text: account.statement },
        { field_name: 'description', field_type: 'text', field_value_text: account.description }
      ];

      for (const field of dynamicFields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: PLATFORM_ORG_ID,
            entity_id: entity.id,
            field_name: field.field_name,
            field_type: field.field_type,
            field_value_text: field.field_value_text || null,
            field_value_number: field.field_value_number || null,
            field_value_boolean: field.field_value_boolean || null,
            smart_code: `HERA.${industryName.toUpperCase()}.FINANCE.GL.FIELD.${field.field_name.toUpperCase()}.v1`,
            created_by: PLATFORM_USER_ID,
            updated_by: PLATFORM_USER_ID
          });
      }

      console.log(`✅ ${account.code} - ${account.name}`);
      successCount++;

    } catch (error) {
      console.error(`❌ ${account.code} - ${account.name}: ${error.message}`);
      errors.push({ account: account.code, error: error.message });
      errorCount++;
    }
  }

  console.log(`📊 ${industryName.toUpperCase()} Template: ${successCount}/${accounts.length} accounts created`);
  return { industry: industryName, success: successCount, errors: errorCount, details: errors };
}

async function createAllIndustryTemplates() {
  console.log('🏭 HERA Industry-Specific COA Templates Generator');
  console.log('================================================');
  console.log(`Target Organization: Platform (${PLATFORM_ORG_ID})`);
  console.log(`Industries: ${Object.keys(INDUSTRY_TEMPLATES).join(', ')}`);
  
  const results = [];
  
  for (const [industryName, accounts] of Object.entries(INDUSTRY_TEMPLATES)) {
    const result = await createIndustryTemplate(industryName, accounts);
    results.push(result);
  }

  console.log('\n========================================');
  console.log('📊 INDUSTRY TEMPLATES SUMMARY');
  console.log('========================================');
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  results.forEach(result => {
    console.log(`✅ ${result.industry.toUpperCase()}: ${result.success} accounts created`);
    if (result.errors > 0) {
      console.log(`❌ ${result.industry.toUpperCase()}: ${result.errors} errors`);
    }
    totalSuccess += result.success;
    totalErrors += result.errors;
  });

  console.log(`\n📊 Overall Results: ${totalSuccess} accounts created, ${totalErrors} errors`);

  console.log('\n🎯 Industry Template Features:');
  console.log('   • SALON: Equipment, beauty products, stylist commissions, treatment packages');
  console.log('   • RESTAURANT: Kitchen equipment, food/beverage inventory, tips, catering');
  console.log('   • TELECOM: Network infrastructure, subscription revenue, agent commissions');
  console.log('   • MANUFACTURING: Production equipment, contract revenue, manufacturing overhead');
  console.log('   • RETAIL: Merchandise inventory, store fixtures, online sales, visual merchandising');

  console.log('\n🚀 Next Steps:');
  console.log('   1. Create country localization templates (UAE VAT, India GST)');
  console.log('   2. Build organization assignment system');
  console.log('   3. Test template assignment to organizations');
  console.log('   4. Create documentation and usage guide');

  return results;
}

// Execute if run directly
if (require.main === module) {
  createAllIndustryTemplates()
    .then(results => {
      console.log('\n✨ Industry Template Generation Complete!');
      const hasErrors = results.some(r => r.errors > 0);
      if (!hasErrors) {
        console.log('🎉 Perfect! All industry templates created successfully.');
      }
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createAllIndustryTemplates, INDUSTRY_TEMPLATES };