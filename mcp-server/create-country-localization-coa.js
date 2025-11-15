#!/usr/bin/env node

/**
 * HERA Country Localization Chart of Accounts Templates
 * Creates country-specific COA variations for regulatory compliance
 * Based on proven patterns from existing UAE and India implementations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001';

// Country-specific account templates
const COUNTRY_TEMPLATES = {
  // ============================================================================
  // UNITED ARAB EMIRATES (UAE) - VAT 5% COMPLIANCE
  // ============================================================================
  uae: [
    // UAE-specific Tax Assets
    { 
      code: '1250000', name: 'VAT Input Tax Receivable', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.ASSET.VAT.INPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'VAT input tax paid on purchases and expenses (recoverable)',
      country: 'uae', tax_rate: 0.05, tax_type: 'input_vat'
    },
    { 
      code: '1260000', name: 'VAT Refund Receivable', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.ASSET.VAT.REFUND.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'VAT refund due from Federal Tax Authority (FTA)',
      country: 'uae', tax_type: 'vat_refund'
    },

    // UAE-specific Tax Liabilities
    { 
      code: '2410000', name: 'VAT Output Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.LIABILITY.VAT.OUTPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'VAT output tax collected on sales (payable to FTA)',
      country: 'uae', tax_rate: 0.05, tax_type: 'output_vat'
    },
    { 
      code: '2420000', name: 'VAT Net Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.LIABILITY.VAT.NET.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Net VAT liability after offsetting input and output VAT',
      country: 'uae', tax_type: 'net_vat'
    },
    { 
      code: '2430000', name: 'Excise Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.LIABILITY.EXCISE.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'UAE excise tax on selective goods (tobacco, soft drinks, energy drinks)',
      country: 'uae', tax_type: 'excise_tax'
    },

    // UAE-specific Compliance Expenses
    { 
      code: '6410000', name: 'FTA Compliance Costs', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.EXPENSE.COMPLIANCE.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Federal Tax Authority compliance and filing costs',
      country: 'uae'
    },
    { 
      code: '6420000', name: 'Economic Substance Regulation Costs', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.EXPENSE.ESR.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Economic Substance Regulation compliance costs',
      country: 'uae'
    },

    // UAE-specific Banking
    { 
      code: '1170000', name: 'UAE Bank Accounts', type: 'asset', subtype: 'cash', level: 3, control: false,
      smartCode: 'HERA.UAE.FINANCE.GL.ASSET.BANK.LOCAL.v1',
      ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
      description: 'Local UAE bank accounts (ENBD, ADCB, FAB, CBD)',
      country: 'uae', currency: 'AED'
    }
  ],

  // ============================================================================
  // INDIA - GST COMPLIANCE
  // ============================================================================
  india: [
    // India-specific Tax Assets
    { 
      code: '1270000', name: 'CGST Input Credit', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.ASSET.GST.CGST_INPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Central GST input tax credit receivable',
      country: 'india', tax_type: 'cgst_input'
    },
    { 
      code: '1280000', name: 'SGST Input Credit', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.ASSET.GST.SGST_INPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'State GST input tax credit receivable',
      country: 'india', tax_type: 'sgst_input'
    },
    { 
      code: '1290000', name: 'IGST Input Credit', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.ASSET.GST.IGST_INPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Integrated GST input tax credit receivable',
      country: 'india', tax_type: 'igst_input'
    },
    { 
      code: '1300000', name: 'TDS Receivable', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.ASSET.TDS.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Tax Deducted at Source - receivable from income tax department',
      country: 'india', tax_type: 'tds'
    },

    // India-specific Tax Liabilities
    { 
      code: '2440000', name: 'CGST Output Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.LIABILITY.GST.CGST_OUTPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Central GST output tax payable',
      country: 'india', tax_type: 'cgst_output'
    },
    { 
      code: '2450000', name: 'SGST Output Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.LIABILITY.GST.SGST_OUTPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'State GST output tax payable',
      country: 'india', tax_type: 'sgst_output'
    },
    { 
      code: '2460000', name: 'IGST Output Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.LIABILITY.GST.IGST_OUTPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Integrated GST output tax payable',
      country: 'india', tax_type: 'igst_output'
    },
    { 
      code: '2470000', name: 'TDS Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.LIABILITY.TDS.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Tax Deducted at Source - payable to income tax department',
      country: 'india', tax_type: 'tds'
    },
    { 
      code: '2480000', name: 'Professional Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.LIABILITY.PROFESSIONAL_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'State professional tax payable',
      country: 'india', tax_type: 'professional_tax'
    },

    // India-specific Compliance Expenses
    { 
      code: '6430000', name: 'GST Compliance Costs', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.EXPENSE.GST_COMPLIANCE.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'GST return filing and compliance costs',
      country: 'india'
    },
    { 
      code: '6440000', name: 'Income Tax Compliance', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.EXPENSE.INCOME_TAX.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Income tax return filing and compliance costs',
      country: 'india'
    },
    { 
      code: '6450000', name: 'ROC Compliance Costs', type: 'expense', subtype: 'admin', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.EXPENSE.ROC.v1',
      ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
      description: 'Registrar of Companies compliance and filing costs',
      country: 'india'
    },

    // India-specific Banking
    { 
      code: '1180000', name: 'India Bank Accounts', type: 'asset', subtype: 'cash', level: 3, control: false,
      smartCode: 'HERA.INDIA.FINANCE.GL.ASSET.BANK.LOCAL.v1',
      ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
      description: 'Local Indian bank accounts (SBI, HDFC, ICICI, Axis)',
      country: 'india', currency: 'INR'
    }
  ],

  // ============================================================================
  // UNITED STATES - FEDERAL & STATE TAX COMPLIANCE
  // ============================================================================
  usa: [
    // USA-specific Tax Assets
    { 
      code: '1310000', name: 'Federal Income Tax Prepaid', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.ASSET.TAX.FEDERAL.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Prepaid federal income tax payments',
      country: 'usa', tax_type: 'federal_income'
    },
    { 
      code: '1320000', name: 'State Income Tax Prepaid', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.ASSET.TAX.STATE.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Prepaid state income tax payments',
      country: 'usa', tax_type: 'state_income'
    },
    { 
      code: '1330000', name: 'Sales Tax Receivable', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.ASSET.SALES_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Sales tax paid on purchases (recoverable in some states)',
      country: 'usa', tax_type: 'sales_tax'
    },

    // USA-specific Tax Liabilities
    { 
      code: '2490000', name: 'Federal Income Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.LIABILITY.TAX.FEDERAL.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Federal income tax liability',
      country: 'usa', tax_type: 'federal_income'
    },
    { 
      code: '2500000', name: 'State Income Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.LIABILITY.TAX.STATE.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'State income tax liability',
      country: 'usa', tax_type: 'state_income'
    },
    { 
      code: '2510000', name: 'Sales Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.LIABILITY.SALES_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Sales tax collected and payable to state/local authorities',
      country: 'usa', tax_type: 'sales_tax'
    },
    { 
      code: '2520000', name: 'Payroll Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.LIABILITY.PAYROLL_TAX.v1',
      ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
      description: 'Federal and state payroll taxes payable (FICA, FUTA, SUTA)',
      country: 'usa', tax_type: 'payroll_tax'
    },

    // USA-specific Banking
    { 
      code: '1190000', name: 'USA Bank Accounts', type: 'asset', subtype: 'cash', level: 3, control: false,
      smartCode: 'HERA.USA.FINANCE.GL.ASSET.BANK.LOCAL.v1',
      ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
      description: 'Local US bank accounts (Chase, Bank of America, Wells Fargo)',
      country: 'usa', currency: 'USD'
    }
  ],

  // ============================================================================
  // UNITED KINGDOM - VAT & CORPORATION TAX COMPLIANCE
  // ============================================================================
  uk: [
    // UK-specific Tax Assets
    { 
      code: '1340000', name: 'VAT Input Tax Recoverable', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UK.FINANCE.GL.ASSET.VAT.INPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'VAT input tax recoverable from HMRC',
      country: 'uk', tax_rate: 0.20, tax_type: 'input_vat'
    },
    { 
      code: '1350000', name: 'Corporation Tax Prepaid', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UK.FINANCE.GL.ASSET.CORP_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Prepaid corporation tax payments',
      country: 'uk', tax_type: 'corporation_tax'
    },

    // UK-specific Tax Liabilities
    { 
      code: '2530000', name: 'VAT Output Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UK.FINANCE.GL.LIABILITY.VAT.OUTPUT.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'VAT output tax payable to HMRC',
      country: 'uk', tax_rate: 0.20, tax_type: 'output_vat'
    },
    { 
      code: '2540000', name: 'Corporation Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UK.FINANCE.GL.LIABILITY.CORP_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Corporation tax liability payable to HMRC',
      country: 'uk', tax_type: 'corporation_tax'
    },
    { 
      code: '2550000', name: 'PAYE Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.UK.FINANCE.GL.LIABILITY.PAYE.v1',
      ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
      description: 'Pay As You Earn tax and National Insurance payable',
      country: 'uk', tax_type: 'paye'
    },

    // UK-specific Banking
    { 
      code: '1200000', name: 'UK Bank Accounts', type: 'asset', subtype: 'cash', level: 3, control: false,
      smartCode: 'HERA.UK.FINANCE.GL.ASSET.BANK.LOCAL.v1',
      ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
      description: 'Local UK bank accounts (Barclays, Lloyds, HSBC, Natwest)',
      country: 'uk', currency: 'GBP'
    }
  ],

  // ============================================================================
  // GENERIC INTERNATIONAL - MINIMAL COMPLIANCE
  // ============================================================================
  generic: [
    // Generic Tax Assets
    { 
      code: '1360000', name: 'Tax Prepayments', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.GENERIC.FINANCE.GL.ASSET.TAX.PREPAID.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Prepaid taxes and tax deposits',
      country: 'generic', tax_type: 'prepaid'
    },
    { 
      code: '1370000', name: 'Input Tax Recoverable', type: 'asset', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.GENERIC.FINANCE.GL.ASSET.INPUT_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
      description: 'Input tax/VAT recoverable from tax authorities',
      country: 'generic', tax_type: 'input_tax'
    },

    // Generic Tax Liabilities
    { 
      code: '2560000', name: 'Income Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.GENERIC.FINANCE.GL.LIABILITY.INCOME_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Corporate income tax payable',
      country: 'generic', tax_type: 'income_tax'
    },
    { 
      code: '2570000', name: 'Sales Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.GENERIC.FINANCE.GL.LIABILITY.SALES_TAX.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Sales tax/VAT/GST payable to authorities',
      country: 'generic', tax_type: 'sales_tax'
    },
    { 
      code: '2580000', name: 'Withholding Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
      smartCode: 'HERA.GENERIC.FINANCE.GL.LIABILITY.WITHHOLDING.v1',
      ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
      description: 'Withholding tax payable on payments',
      country: 'generic', tax_type: 'withholding'
    },

    // Generic Banking
    { 
      code: '1380000', name: 'Foreign Bank Accounts', type: 'asset', subtype: 'cash', level: 3, control: false,
      smartCode: 'HERA.GENERIC.FINANCE.GL.ASSET.BANK.FOREIGN.v1',
      ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
      description: 'International and foreign currency bank accounts',
      country: 'generic', currency: 'MULTI'
    }
  ]
};

async function createCountryTemplate(countryName, accounts) {
  console.log(`\n🌍 Creating ${countryName.toUpperCase()} Country Template`);
  console.log('='.repeat(50));
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const account of accounts) {
    try {
      // Create country-specific GL account
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
            country: account.country,
            currency: account.currency || 'MULTI',
            is_active: true,
            description: account.description,
            country_specific: true,
            tax_compliance: {
              tax_type: account.tax_type || null,
              tax_rate: account.tax_rate || null,
              regulatory_authority: getRegulatory Authority(account.country)
            },
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

      // Add country-specific dynamic data
      const dynamicFields = [
        { field_name: 'account_type', field_type: 'text', field_value_text: account.type },
        { field_name: 'account_subtype', field_type: 'text', field_value_text: account.subtype },
        { field_name: 'country', field_type: 'text', field_value_text: account.country },
        { field_name: 'country_specific', field_type: 'boolean', field_value_boolean: true },
        { field_name: 'account_level', field_type: 'number', field_value_number: account.level },
        { field_name: 'is_control_account', field_type: 'boolean', field_value_boolean: account.control },
        { field_name: 'normal_balance', field_type: 'text', field_value_text: account.balance },
        { field_name: 'ifrs_code', field_type: 'text', field_value_text: account.ifrs },
        { field_name: 'statement_type', field_type: 'text', field_value_text: account.statement },
        { field_name: 'description', field_type: 'text', field_value_text: account.description },
        { field_name: 'currency', field_type: 'text', field_value_text: account.currency || 'MULTI' }
      ];

      // Add tax-specific fields if applicable
      if (account.tax_type) {
        dynamicFields.push(
          { field_name: 'tax_type', field_type: 'text', field_value_text: account.tax_type },
          { field_name: 'tax_rate', field_type: 'number', field_value_number: account.tax_rate || 0 }
        );
      }

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
            smart_code: `HERA.${countryName.toUpperCase()}.FINANCE.GL.FIELD.${field.field_name.toUpperCase()}.v1`,
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

  console.log(`📊 ${countryName.toUpperCase()} Template: ${successCount}/${accounts.length} accounts created`);
  return { country: countryName, success: successCount, errors: errorCount, details: errors };
}

function getRegulatoryAuthority(country) {
  const authorities = {
    uae: 'Federal Tax Authority (FTA)',
    india: 'Goods and Services Tax Network (GSTN)',
    usa: 'Internal Revenue Service (IRS)',
    uk: 'HM Revenue & Customs (HMRC)',
    generic: 'Local Tax Authority'
  };
  return authorities[country] || 'Local Tax Authority';
}

async function createAllCountryTemplates() {
  console.log('🌍 HERA Country Localization COA Templates Generator');
  console.log('==================================================');
  console.log(`Target Organization: Platform (${PLATFORM_ORG_ID})`);
  console.log(`Countries: ${Object.keys(COUNTRY_TEMPLATES).join(', ')}`);
  
  const results = [];
  
  for (const [countryName, accounts] of Object.entries(COUNTRY_TEMPLATES)) {
    const result = await createCountryTemplate(countryName, accounts);
    results.push(result);
  }

  console.log('\n========================================');
  console.log('📊 COUNTRY TEMPLATES SUMMARY');
  console.log('========================================');
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  results.forEach(result => {
    console.log(`✅ ${result.country.toUpperCase()}: ${result.success} accounts created`);
    if (result.errors > 0) {
      console.log(`❌ ${result.country.toUpperCase()}: ${result.errors} errors`);
    }
    totalSuccess += result.success;
    totalErrors += result.errors;
  });

  console.log(`\n📊 Overall Results: ${totalSuccess} accounts created, ${totalErrors} errors`);

  console.log('\n🎯 Country-Specific Features:');
  console.log('   • UAE: VAT 5% compliance, FTA integration, Excise tax support');
  console.log('   • INDIA: GST (CGST/SGST/IGST), TDS compliance, ROC requirements');
  console.log('   • USA: Federal/State taxes, Sales tax, Payroll tax compliance');
  console.log('   • UK: VAT 20%, Corporation tax, PAYE integration');
  console.log('   • GENERIC: Universal tax compliance for any jurisdiction');

  console.log('\n🚀 Next Steps:');
  console.log('   1. Build organization assignment system');
  console.log('   2. Create country-industry combination templates');
  console.log('   3. Test template assignment workflows');
  console.log('   4. Generate implementation documentation');

  return results;
}

// Execute if run directly
if (require.main === module) {
  createAllCountryTemplates()
    .then(results => {
      console.log('\n✨ Country Localization Template Generation Complete!');
      const hasErrors = results.some(r => r.errors > 0);
      if (!hasErrors) {
        console.log('🎉 Perfect! All country templates created successfully.');
      }
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createAllCountryTemplates, COUNTRY_TEMPLATES };