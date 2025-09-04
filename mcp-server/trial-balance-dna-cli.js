#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL TRIAL BALANCE DNA CLI TOOL
// Command-line interface for the Universal Trial Balance Engine
// Smart Code: HERA.FIN.TRIAL.BALANCE.DNA.CLI.v1
// ================================================================================

const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Command-line arguments
const command = process.argv[2];
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

// ================================================================================
// TRIAL BALANCE DNA CONFIGURATION
// ================================================================================

const TRIAL_BALANCE_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.FIN.TRIAL.BALANCE.ENGINE.v1',
  component_name: 'Universal Trial Balance Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Multi-Tenant Trial Balance Generation',
    'Account Classification and Grouping',
    'Balance Validation and Analysis',
    'Group Consolidation Support',
    'Industry-Specific Account Templates',
    'Real-time Integration with Auto-Journal',
    'Professional IFRS/GAAP Formatting',
    'CLI Management Tools'
  ],
  
  // Industry configurations with account mappings
  industries: {
    restaurant: {
      name: 'Restaurant & Food Service',
      key_metrics: {
        food_cost_percentage: 30,
        labor_cost_percentage: 30,
        gross_margin_target: 65
      },
      critical_accounts: ['Cash', 'Inventory - Food', 'Food Sales', 'Cost of Food Sold', 'Labor Costs'],
      account_categories: {
        'Current Assets': ['Cash', 'Accounts Receivable', 'Inventory - Food', 'Inventory - Beverages'],
        'Fixed Assets': ['Kitchen Equipment', 'Furniture & Fixtures', 'Leasehold Improvements'],
        'Current Liabilities': ['Accounts Payable', 'Sales Tax Payable', 'Payroll Liabilities'],
        'Operating Revenue': ['Food Sales', 'Beverage Sales', 'Catering Revenue'],
        'Operating Expenses': ['Cost of Food Sold', 'Labor Costs', 'Rent Expense', 'Utilities']
      },
      smart_codes: {
        food_sales: 'HERA.REST.POS.TXN.FOOD.SALE.v1',
        beverage_sales: 'HERA.REST.POS.TXN.BEVERAGE.SALE.v1',
        food_costs: 'HERA.REST.INV.COGS.FOOD.v1',
        labor_costs: 'HERA.REST.HR.PAY.STAFF.v1'
      }
    },
    
    salon: {
      name: 'Hair Salon & Beauty Services',
      key_metrics: {
        product_margin_target: 50,
        service_margin_target: 85,
        staff_cost_percentage: 45
      },
      critical_accounts: ['Cash', 'Service Revenue', 'Product Sales', 'Staff Salaries', 'Commission Expenses'],
      account_categories: {
        'Current Assets': ['Cash', 'Bank - Card Processing', 'Inventory - Products', 'Inventory - Supplies'],
        'Fixed Assets': ['Salon Equipment', 'Furniture & Fixtures', 'Leasehold Improvements'],
        'Current Liabilities': ['Accounts Payable', 'Sales Tax Payable', 'Staff Payroll Payable'],
        'Operating Revenue': ['Service Revenue - Hair Cutting', 'Service Revenue - Hair Coloring', 'Product Sales'],
        'Operating Expenses': ['Staff Salaries', 'Commission Expenses', 'Rent Expense', 'Supplies Expense']
      },
      smart_codes: {
        service_revenue: 'HERA.SALON.SVC.TXN.SERVICE.v1',
        product_sales: 'HERA.SALON.SVC.TXN.PRODUCT.v1',
        staff_costs: 'HERA.SALON.HR.PAY.STYLIST.v1',
        commission: 'HERA.SALON.HR.COMMISSION.v1'
      }
    },
    
    healthcare: {
      name: 'Healthcare & Medical Services',
      key_metrics: {
        collection_rate_target: 85,
        supply_cost_percentage: 12,
        staff_cost_percentage: 55
      },
      critical_accounts: ['Patient Receivables', 'Insurance Receivables', 'Medical Supplies', 'Professional Fees'],
      account_categories: {
        'Current Assets': ['Cash', 'Patient Accounts Receivable', 'Insurance Receivables', 'Medical Supplies'],
        'Fixed Assets': ['Medical Equipment', 'Office Equipment', 'Leasehold Improvements'],
        'Current Liabilities': ['Accounts Payable', 'Staff Payroll Payable', 'Insurance Payables'],
        'Operating Revenue': ['Patient Service Revenue', 'Insurance Revenue', 'Consultation Fees'],
        'Operating Expenses': ['Medical Supplies Expense', 'Staff Salaries', 'Insurance Expense']
      },
      smart_codes: {
        patient_revenue: 'HERA.HLTH.PAT.PAYMENT.v1',
        insurance_revenue: 'HERA.HLTH.INS.REIMBURSEMENT.v1',
        supply_costs: 'HERA.HLTH.SUP.MEDICAL.v1',
        staff_costs: 'HERA.HLTH.HR.PAY.DOCTOR.v1'
      }
    },
    
    manufacturing: {
      name: 'Manufacturing & Production',
      key_metrics: {
        inventory_turnover_target: 6,
        raw_material_percentage: 40,
        gross_margin_target: 35
      },
      critical_accounts: ['Raw Materials', 'Work in Process', 'Finished Goods', 'Manufacturing Equipment'],
      account_categories: {
        'Current Assets': ['Cash', 'Accounts Receivable', 'Raw Materials', 'Work in Process', 'Finished Goods'],
        'Fixed Assets': ['Manufacturing Equipment', 'Factory Building', 'Accumulated Depreciation'],
        'Current Liabilities': ['Accounts Payable', 'Accrued Wages', 'Taxes Payable'],
        'Operating Revenue': ['Product Sales', 'Manufacturing Services'],
        'Operating Expenses': ['Raw Materials', 'Direct Labor', 'Manufacturing Overhead']
      },
      smart_codes: {
        product_sales: 'HERA.MFG.SALE.FINISHED.v1',
        raw_materials: 'HERA.MFG.PUR.RAW.MATERIALS.v1',
        direct_labor: 'HERA.MFG.HR.PAY.PRODUCTION.v1',
        overhead: 'HERA.MFG.EXP.OVERHEAD.v1'
      }
    },
    
    professional_services: {
      name: 'Professional Services',
      key_metrics: {
        utilization_rate_target: 75,
        collection_rate_target: 95,
        gross_margin_target: 70
      },
      critical_accounts: ['Accounts Receivable', 'Work in Progress', 'Professional Fees', 'Direct Costs'],
      account_categories: {
        'Current Assets': ['Cash', 'Accounts Receivable', 'Work in Progress', 'Prepaid Expenses'],
        'Fixed Assets': ['Office Equipment', 'Computer Equipment', 'Furniture'],
        'Current Liabilities': ['Accounts Payable', 'Payroll Liabilities', 'Deferred Revenue'],
        'Operating Revenue': ['Professional Fees', 'Consulting Revenue', 'Project Revenue'],
        'Operating Expenses': ['Staff Salaries', 'Direct Project Costs', 'Office Expenses']
      },
      smart_codes: {
        professional_fees: 'HERA.PROF.TIME.BILLING.v1',
        project_costs: 'HERA.PROF.PROJECT.COSTS.v1',
        staff_costs: 'HERA.PROF.HR.PAY.CONSULTANT.v1',
        overhead: 'HERA.PROF.EXP.OVERHEAD.v1'
      }
    },
    
    universal: {
      name: 'Universal Business Template',
      key_metrics: {
        gross_margin_target: 60,
        operating_margin_target: 20,
        current_ratio_target: 2.0
      },
      critical_accounts: ['Cash', 'Accounts Receivable', 'Revenue', 'Operating Expenses'],
      account_categories: {
        'Current Assets': ['Cash', 'Accounts Receivable', 'Inventory', 'Prepaid Expenses'],
        'Fixed Assets': ['Equipment', 'Furniture', 'Accumulated Depreciation'],
        'Current Liabilities': ['Accounts Payable', 'Accrued Expenses', 'Taxes Payable'],
        'Operating Revenue': ['Sales Revenue', 'Service Revenue', 'Other Revenue'],
        'Operating Expenses': ['Cost of Sales', 'Operating Expenses', 'Administrative Expenses']
      },
      smart_codes: {
        revenue: 'HERA.UNIVERSAL.REVENUE.v1',
        cost_of_sales: 'HERA.UNIVERSAL.COGS.v1',
        operating_expenses: 'HERA.UNIVERSAL.OPEX.v1',
        admin_expenses: 'HERA.UNIVERSAL.ADMIN.v1'
      }
    }
  }
};

// ================================================================================
// MAIN CLI FUNCTIONS
// ================================================================================

async function showTrialBalanceConfig(industryType = 'universal') {
  console.log(`🧬 HERA Universal Trial Balance DNA Configuration - ${industryType.toUpperCase()}\n`);
  
  const config = TRIAL_BALANCE_DNA_CONFIG.industries[industryType];
  if (!config) {
    console.log(`❌ Unknown industry type: ${industryType}`);
    console.log('Available industries:', Object.keys(TRIAL_BALANCE_DNA_CONFIG.industries).join(', '));
    return;
  }

  console.log(`🏢 INDUSTRY: ${config.name}`);
  console.log('='.repeat(config.name.length + 12));
  
  console.log('\n📊 KEY FINANCIAL METRICS:');
  Object.entries(config.key_metrics).forEach(([metric, target]) => {
    console.log(`   ${metric.replace(/_/g, ' ').toUpperCase()}: ${target}${typeof target === 'number' ? '%' : ''}`);
  });

  console.log('\n📋 CRITICAL ACCOUNTS TO MONITOR:');
  config.critical_accounts.forEach(account => {
    console.log(`   • ${account}`);
  });

  console.log('\n🗂️  ACCOUNT CATEGORIES:');
  Object.entries(config.account_categories).forEach(([category, accounts]) => {
    console.log(`\n   ${category.toUpperCase()}:`);
    accounts.forEach(account => {
      console.log(`   • ${account}`);
    });
  });

  console.log('\n🧠 SMART CODE PATTERNS:');
  Object.entries(config.smart_codes).forEach(([type, code]) => {
    console.log(`   ${type.replace(/_/g, ' ')}: ${code}`);
  });

  console.log('\n🔧 DNA INTEGRATION:');
  console.log('   ✅ Auto-Journal Integration: Real-time balance updates');
  console.log('   ✅ Cashflow Integration: Seamless cashflow statement sync');
  console.log('   ✅ Universal API: /api/v1/trial-balance');
  console.log('   ✅ Multi-Currency: Automatic currency conversion');
  console.log('   ✅ IFRS/GAAP: Professional trial balance formats');
  console.log('   ✅ Consolidation: Multi-organization support');
}

async function generateTrialBalanceReport(organizationId, options = {}) {
  console.log('📊 GENERATING UNIVERSAL TRIAL BALANCE REPORT\n');
  
  if (!organizationId) {
    console.error('❌ Organization ID required');
    return;
  }

  const {
    startDate = '2025-01-01',
    endDate = new Date().toISOString().split('T')[0],
    industryType = 'universal',
    includeRatios = true,
    format = 'detailed'
  } = options;

  try {
    console.log(`🏢 Organization ID: ${organizationId}`);
    console.log(`📅 Period: ${startDate} to ${endDate}`);
    console.log(`🏭 Industry Template: ${industryType}`);
    console.log(`📋 Format: ${format.toUpperCase()}\n`);

    // Get organization details
    const { data: org } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (!org) {
      console.error('❌ Organization not found');
      return;
    }

    console.log(`📋 Organization: ${org.organization_name}`);
    
    // Get industry configuration
    const industryConfig = TRIAL_BALANCE_DNA_CONFIG.industries[industryType];
    console.log(`🏭 Industry: ${industryConfig.name}\n`);

    // Get trial balance data using the SQL function
    const { data: trialBalanceData, error } = await supabase
      .rpc('get_trial_balance_data', {
        p_organization_id: organizationId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_industry_type: industryType
      });

    if (error) {
      console.error('❌ Error fetching trial balance data:', error.message);
      return;
    }

    if (!trialBalanceData || trialBalanceData.length === 0) {
      console.log('⚠️  No trial balance data found for the specified period');
      return;
    }

    console.log(`📈 Found ${trialBalanceData.length} accounts with activity\n`);

    // Generate trial balance report
    await displayTrialBalanceReport(trialBalanceData, industryConfig, org.organization_name);

    // Validate trial balance
    const { data: validationData } = await supabase
      .rpc('validate_trial_balance', {
        p_organization_id: organizationId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (validationData?.[0]) {
      await displayTrialBalanceValidation(validationData[0]);
    }

    // Calculate ratios if requested
    if (includeRatios) {
      const { data: ratiosData } = await supabase
        .rpc('calculate_trial_balance_ratios', {
          p_organization_id: organizationId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      if (ratiosData?.[0]) {
        await displayFinancialRatios(ratiosData[0], industryConfig);
      }
    }

  } catch (error) {
    console.error('❌ Error generating trial balance report:', error.message);
  }
}

function displayTrialBalanceReport(trialBalanceData, industryConfig, organizationName) {
  console.log('📊 TRIAL BALANCE REPORT');
  console.log('='.repeat(50));
  console.log(`Organization: ${organizationName}`);
  console.log(`Industry: ${industryConfig.name}`);
  console.log(`Generated: ${new Date().toLocaleDateString()}\n`);

  // Group accounts by type
  const accountsByType = {};
  trialBalanceData.forEach(account => {
    const type = account.account_type || 'Unknown';
    if (!accountsByType[type]) {
      accountsByType[type] = [];
    }
    accountsByType[type].push(account);
  });

  // Display accounts grouped by type
  const typeOrder = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Unknown'];
  
  console.log('Account Code    │ Account Name                           │      Debit │     Credit │ Net Balance');
  console.log('─'.repeat(105));

  let totalDebits = 0;
  let totalCredits = 0;

  typeOrder.forEach(type => {
    if (accountsByType[type]) {
      console.log(`\n${type.toUpperCase()}:`);
      
      accountsByType[type].forEach(account => {
        const code = (account.account_code || 'N/A').padEnd(14);
        const name = (account.account_name || 'Unknown').padEnd(42);
        const debit = account.debit_total > 0 ? account.debit_total.toFixed(2).padStart(11) : '-'.padStart(11);
        const credit = account.credit_total > 0 ? account.credit_total.toFixed(2).padStart(11) : '-'.padStart(11);
        const net = account.net_balance.toFixed(2).padStart(11);
        
        console.log(`${code} │ ${name} │ ${debit} │ ${credit} │ ${net}`);
        
        totalDebits += parseFloat(account.debit_total) || 0;
        totalCredits += parseFloat(account.credit_total) || 0;
      });
    }
  });

  // Totals
  console.log('─'.repeat(105));
  const totalDebitStr = totalDebits.toFixed(2).padStart(11);
  const totalCreditStr = totalCredits.toFixed(2).padStart(11);
  const netBalanceStr = (totalDebits - totalCredits).toFixed(2).padStart(11);
  
  console.log(`${'TOTALS'.padEnd(14)} │ ${''.padEnd(42)} │ ${totalDebitStr} │ ${totalCreditStr} │ ${netBalanceStr}`);
  console.log('─'.repeat(105));
}

function displayTrialBalanceValidation(validation) {
  console.log('\n🔍 TRIAL BALANCE VALIDATION');
  console.log('='.repeat(50));
  console.log(`Total Debits:       ${parseFloat(validation.total_debits).toFixed(2)} AED`);
  console.log(`Total Credits:      ${parseFloat(validation.total_credits).toFixed(2)} AED`);
  console.log(`Balance Difference: ${parseFloat(validation.balance_difference).toFixed(2)} AED`);
  console.log(`Account Count:      ${validation.account_count}`);
  
  if (validation.is_balanced) {
    console.log(`\n✅ ${validation.validation_message}`);
  } else {
    console.log(`\n⚠️  ${validation.validation_message}`);
    console.log('   Recommended Actions:');
    console.log('   • Review recent journal entries');
    console.log('   • Check for incomplete transactions');
    console.log('   • Verify account mappings');
    console.log('   • Run Auto-Journal DNA reconciliation');
  }
}

function displayFinancialRatios(ratios, industryConfig) {
  console.log('\n💰 FINANCIAL ANALYSIS');
  console.log('='.repeat(50));
  
  const totalAssets = parseFloat(ratios.total_assets);
  const totalLiabilities = parseFloat(ratios.total_liabilities);
  const totalEquity = parseFloat(ratios.total_equity);
  const totalRevenue = parseFloat(ratios.total_revenue);
  const totalExpenses = parseFloat(ratios.total_expenses);
  const netIncome = parseFloat(ratios.net_income);

  console.log('📊 FINANCIAL POSITION:');
  console.log(`Total Assets:      ${totalAssets.toFixed(2)} AED`);
  console.log(`Total Liabilities: ${totalLiabilities.toFixed(2)} AED`);
  console.log(`Total Equity:      ${totalEquity.toFixed(2)} AED`);
  console.log(`Total Revenue:     ${totalRevenue.toFixed(2)} AED`);
  console.log(`Total Expenses:    ${totalExpenses.toFixed(2)} AED`);
  console.log(`Net Income:        ${netIncome.toFixed(2)} AED`);

  console.log('\n📈 KEY RATIOS:');
  console.log(`Gross Margin:      ${parseFloat(ratios.gross_margin_percent).toFixed(1)}%`);
  console.log(`Debt-to-Equity:    ${parseFloat(ratios.debt_to_equity_ratio).toFixed(2)}`);
  console.log(`Current Ratio:     ${parseFloat(ratios.current_ratio).toFixed(2)}`);

  console.log('\n🎯 INDUSTRY BENCHMARKS:');
  Object.entries(industryConfig.key_metrics).forEach(([metric, target]) => {
    console.log(`${metric.replace(/_/g, ' ').toUpperCase()}: ${target}${typeof target === 'number' ? '%' : ''} (Target)`);
  });
}

async function generateConsolidatedTrialBalance(organizationIds, options = {}) {
  console.log('🏢 CONSOLIDATED TRIAL BALANCE REPORT');
  console.log('='.repeat(50));
  console.log(`Consolidating ${organizationIds.length} organizations\n`);

  const consolidatedData = {
    totalDebits: 0,
    totalCredits: 0,
    accountSummaries: {},
    organizationSummaries: []
  };

  // Generate trial balance for each organization
  for (const orgId of organizationIds) {
    console.log(`\n🔄 Processing Organization: ${orgId}`);
    
    try {
      const { data: org } = await supabase
        .from('core_organizations')
        .select('organization_name')
        .eq('id', orgId)
        .single();

      const { data: trialBalanceData } = await supabase
        .rpc('get_trial_balance_data', {
          p_organization_id: orgId,
          p_start_date: options.startDate || '2025-01-01',
          p_end_date: options.endDate || new Date().toISOString().split('T')[0]
        });

      if (trialBalanceData && trialBalanceData.length > 0) {
        const orgDebits = trialBalanceData.reduce((sum, acc) => sum + (parseFloat(acc.debit_total) || 0), 0);
        const orgCredits = trialBalanceData.reduce((sum, acc) => sum + (parseFloat(acc.credit_total) || 0), 0);
        
        consolidatedData.totalDebits += orgDebits;
        consolidatedData.totalCredits += orgCredits;
        
        consolidatedData.organizationSummaries.push({
          organizationId: orgId,
          organizationName: org?.organization_name || 'Unknown',
          totalDebits: orgDebits,
          totalCredits: orgCredits,
          accountCount: trialBalanceData.length
        });

        console.log(`   ✅ ${org?.organization_name || 'Unknown'}: ${orgDebits.toFixed(2)} debits, ${orgCredits.toFixed(2)} credits`);
      } else {
        console.log(`   ⚠️  No data found for organization ${orgId}`);
      }
    } catch (error) {
      console.log(`   ❌ Error processing organization ${orgId}:`, error.message);
    }
  }

  // Display consolidated summary
  console.log('\n📊 CONSOLIDATED SUMMARY:');
  console.log('─'.repeat(70));
  console.log('Organization                           │      Debits │     Credits');
  console.log('─'.repeat(70));

  consolidatedData.organizationSummaries.forEach(org => {
    const name = org.organizationName.padEnd(38);
    const debits = org.totalDebits.toFixed(2).padStart(12);
    const credits = org.totalCredits.toFixed(2).padStart(12);
    console.log(`${name} │ ${debits} │ ${credits}`);
  });

  console.log('─'.repeat(70));
  const totalDebits = consolidatedData.totalDebits.toFixed(2).padStart(12);
  const totalCredits = consolidatedData.totalCredits.toFixed(2).padStart(12);
  console.log(`${'CONSOLIDATED TOTALS'.padEnd(38)} │ ${totalDebits} │ ${totalCredits}`);
  console.log('─'.repeat(70));

  console.log('\n🎯 CONSOLIDATED ANALYSIS:');
  console.log(`Total Group Debits:  ${consolidatedData.totalDebits.toFixed(2)} AED`);
  console.log(`Total Group Credits: ${consolidatedData.totalCredits.toFixed(2)} AED`);
  console.log(`Balance Difference:  ${(consolidatedData.totalDebits - consolidatedData.totalCredits).toFixed(2)} AED`);
  console.log(`Active Organizations: ${consolidatedData.organizationSummaries.length}`);
}

async function listAvailableIndustries() {
  console.log('🏭 HERA UNIVERSAL TRIAL BALANCE DNA - AVAILABLE INDUSTRIES\n');
  
  console.log('📋 SUPPORTED INDUSTRY TEMPLATES:');
  console.log('='.repeat(60));
  
  Object.entries(TRIAL_BALANCE_DNA_CONFIG.industries).forEach(([key, config]) => {
    console.log(`\n🏢 ${config.name.toUpperCase()}`);
    console.log(`   Key: ${key}`);
    console.log(`   Critical Accounts: ${config.critical_accounts.length}`);
    console.log(`   Smart Codes: ${Object.keys(config.smart_codes).length}`);
    console.log(`   Usage: node trial-balance-dna-cli.js config ${key}`);
  });

  console.log('\n🧬 DNA INTEGRATION BENEFITS:');
  console.log('='.repeat(60));
  TRIAL_BALANCE_DNA_CONFIG.capabilities.forEach(capability => {
    console.log(`✅ ${capability}`);
  });

  console.log('\n🚀 QUICK USAGE:');
  console.log('   node trial-balance-dna-cli.js generate --org your-org-id');
  console.log('   node trial-balance-dna-cli.js consolidate --orgs "id1,id2,id3"');
  console.log('   node trial-balance-dna-cli.js analyze --org your-org-id --ratios\n');
}

function showUsageHelp() {
  console.log(`
🧬 HERA UNIVERSAL TRIAL BALANCE DNA CLI TOOL
=============================================

Professional trial balance reports for any business type using HERA's 
revolutionary Universal DNA architecture.

USAGE:
  node trial-balance-dna-cli.js <command> [options]

COMMANDS:
  config [industry]         Show trial balance DNA configuration for industry
                           Industries: restaurant, salon, healthcare, manufacturing,
                                      professional_services, universal

  generate                 Generate trial balance report for organization
    --org <org-id>           Organization UUID (required)
    --start <YYYY-MM-DD>     Start date (default: 2025-01-01)
    --end <YYYY-MM-DD>       End date (default: today)
    --industry <type>        Industry template (default: universal)
    --format <type>          Report format: summary, detailed (default: detailed)
    --ratios                 Include financial ratios analysis

  consolidate              Generate consolidated trial balance
    --orgs <id1,id2,id3>     Comma-separated organization IDs (required)
    --start <YYYY-MM-DD>     Start date (default: 2025-01-01)
    --end <YYYY-MM-DD>       End date (default: today)

  analyze                  Analyze trial balance with industry benchmarks
    --org <org-id>           Organization UUID (required)
    --industry <type>        Industry template for benchmarking

  industries               List all available industry configurations

  help                     Show this help message

EXAMPLES:
  node trial-balance-dna-cli.js config restaurant
  node trial-balance-dna-cli.js generate --org uuid-here --ratios
  node trial-balance-dna-cli.js consolidate --orgs "id1,id2,id3"
  node trial-balance-dna-cli.js analyze --org uuid-here --industry salon
  node trial-balance-dna-cli.js industries

ENVIRONMENT VARIABLES:
  DEFAULT_ORGANIZATION_ID   Your organization UUID (optional)
  SUPABASE_URL             Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

SMART CODE: HERA.FIN.TRIAL.BALANCE.DNA.CLI.v1

🌟 This DNA component provides enterprise-grade trial balance reports
   that work immediately with existing HERA transaction data.
`);
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

async function main() {
  console.log('🧬 HERA Universal Trial Balance DNA CLI Tool\n');

  switch (command) {
    case 'config':
      const industry = process.argv[3] || 'universal';
      await showTrialBalanceConfig(industry);
      break;
      
    case 'generate':
      const orgFlag = process.argv.indexOf('--org');
      const startFlag = process.argv.indexOf('--start');
      const endFlag = process.argv.indexOf('--end');
      const industryFlag = process.argv.indexOf('--industry');
      const formatFlag = process.argv.indexOf('--format');
      const ratiosFlag = process.argv.includes('--ratios');
      
      const targetOrgId = orgFlag > -1 ? process.argv[orgFlag + 1] : organizationId;
      const startDate = startFlag > -1 ? process.argv[startFlag + 1] : '2025-01-01';
      const endDate = endFlag > -1 ? process.argv[endFlag + 1] : new Date().toISOString().split('T')[0];
      const industryType = industryFlag > -1 ? process.argv[industryFlag + 1] : 'universal';
      const format = formatFlag > -1 ? process.argv[formatFlag + 1] : 'detailed';
      
      if (!targetOrgId) {
        console.error('❌ Organization ID required. Use --org flag or set DEFAULT_ORGANIZATION_ID');
        return;
      }
      
      await generateTrialBalanceReport(targetOrgId, {
        startDate,
        endDate,
        industryType,
        format,
        includeRatios: ratiosFlag
      });
      break;
      
    case 'consolidate':
      const orgsFlag = process.argv.indexOf('--orgs');
      const consStartFlag = process.argv.indexOf('--start');
      const consEndFlag = process.argv.indexOf('--end');
      
      if (orgsFlag === -1) {
        console.error('❌ Organization IDs required. Use --orgs "id1,id2,id3"');
        return;
      }
      
      const orgIds = process.argv[orgsFlag + 1].split(',').map(id => id.trim());
      const consStartDate = consStartFlag > -1 ? process.argv[consStartFlag + 1] : '2025-01-01';
      const consEndDate = consEndFlag > -1 ? process.argv[consEndFlag + 1] : new Date().toISOString().split('T')[0];
      
      await generateConsolidatedTrialBalance(orgIds, {
        startDate: consStartDate,
        endDate: consEndDate
      });
      break;
      
    case 'analyze':
      const analyzeOrgFlag = process.argv.indexOf('--org');
      const analyzeIndustryFlag = process.argv.indexOf('--industry');
      
      const analyzeOrgId = analyzeOrgFlag > -1 ? process.argv[analyzeOrgFlag + 1] : organizationId;
      const analyzeIndustry = analyzeIndustryFlag > -1 ? process.argv[analyzeIndustryFlag + 1] : 'universal';
      
      if (!analyzeOrgId) {
        console.error('❌ Organization ID required for analysis');
        return;
      }
      
      await generateTrialBalanceReport(analyzeOrgId, {
        industryType: analyzeIndustry,
        includeRatios: true
      });
      break;
      
    case 'industries':
      await listAvailableIndustries();
      break;
      
    case 'help':
    default:
      showUsageHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  TRIAL_BALANCE_DNA_CONFIG,
  showTrialBalanceConfig,
  generateTrialBalanceReport,
  generateConsolidatedTrialBalance,
  listAvailableIndustries
};