#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL BALANCE SHEET DNA CLI TOOL
// Command-line interface for Daily Balance Sheet Reporting
// Smart Code: HERA.FIN.BALANCE.SHEET.DNA.CLI.v1
// ================================================================================

const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Command-line arguments
const command = process.argv[2];
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

// Hair Talkz organizations for quick testing
const HAIR_TALKZ_ORGS = [
  {
    id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
    code: "SALON-BR1",
    name: "Hair Talkz • Park Regis Kris Kin (Karama)"
  },
  {
    id: "0b1b37cd-4096-4718-8cd4-e370f234005b", 
    code: "SALON-BR2",
    name: "Hair Talkz • Mercure Gold (Al Mina Rd)"
  },
  {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP", 
    name: "Salon Group"
  }
];

// ================================================================================
// BALANCE SHEET DNA CONFIGURATION
// ================================================================================

const BALANCE_SHEET_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.FIN.BALANCE.SHEET.ENGINE.v1',
  component_name: 'Universal Balance Sheet Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Daily Balance Sheet Generation',
    'Real-time Asset/Liability/Equity Reporting',
    'Multi-Organization Consolidation',
    'Industry-Specific Balance Sheet Templates',
    'IFRS/GAAP Compliant Formatting',
    'Comparative Period Analysis',
    'Financial Ratio Analysis',
    'Integration with Trial Balance DNA'
  ],
  
  // Industry configurations with balance sheet templates
  industries: {
    salon: {
      name: 'Hair Salon & Beauty Services',
      template_sections: {
        current_assets: [
          'Cash and Cash Equivalents',
          'Accounts Receivable', 
          'Inventory - Products',
          'Inventory - Supplies',
          'Prepaid Expenses'
        ],
        non_current_assets: [
          'Salon Equipment (Net)',
          'Furniture & Fixtures (Net)',
          'Leasehold Improvements (Net)'
        ],
        current_liabilities: [
          'Accounts Payable',
          'Accrued Expenses',
          'Sales Tax Payable',
          'Payroll Liabilities'
        ],
        non_current_liabilities: [
          'Long-term Debt',
          'Lease Liabilities'
        ],
        equity: [
          'Owner Capital',
          'Retained Earnings',
          'Current Year Earnings'
        ]
      },
      key_ratios: {
        current_ratio_target: 2.0,
        quick_ratio_target: 1.5,
        debt_to_equity_target: 0.5,
        equity_ratio_target: 0.6
      },
      daily_metrics: [
        'Cash Position',
        'Total Assets',
        'Current Ratio', 
        'Total Equity'
      ],
      smart_codes: {
        cash: 'HERA.SALON.BS.CASH.v1',
        inventory: 'HERA.SALON.BS.INVENTORY.v1',
        equipment: 'HERA.SALON.BS.EQUIPMENT.v1',
        payables: 'HERA.SALON.BS.PAYABLES.v1'
      }
    },
    
    restaurant: {
      name: 'Restaurant & Food Service',
      template_sections: {
        current_assets: [
          'Cash and Bank Accounts',
          'Customer Tab Receivables',
          'Food Inventory',
          'Beverage Inventory',
          'Supplies Inventory'
        ],
        non_current_assets: [
          'Kitchen Equipment (Net)',
          'Restaurant Furniture (Net)',
          'Leasehold Improvements (Net)'
        ],
        current_liabilities: [
          'Food Suppliers Payable',
          'Beverage Suppliers Payable', 
          'Accrued Wages',
          'Sales Tax Payable'
        ],
        equity: [
          'Owner Investment',
          'Accumulated Profits/Losses'
        ]
      },
      key_ratios: {
        current_ratio_target: 1.5,
        inventory_turnover_target: 12,
        debt_to_equity_target: 0.6
      },
      daily_metrics: [
        'Cash Position',
        'Food Inventory Level',
        'Current Ratio',
        'Owner Equity'
      ]
    },
    
    universal: {
      name: 'Universal Business Template',
      template_sections: {
        current_assets: [
          'Cash and Cash Equivalents',
          'Accounts Receivable',
          'Inventory',
          'Prepaid Expenses'
        ],
        non_current_assets: [
          'Property, Plant & Equipment (Net)'
        ],
        current_liabilities: [
          'Accounts Payable',
          'Accrued Liabilities'
        ],
        equity: [
          'Owner Equity',
          'Retained Earnings'
        ]
      },
      key_ratios: {
        current_ratio_target: 2.0,
        debt_to_equity_target: 0.5,
        equity_ratio_target: 0.6
      }
    }
  }
};

// ================================================================================
// MAIN CLI FUNCTIONS
// ================================================================================

async function showBalanceSheetConfig(industryType = 'salon') {
  console.log(`🧬 HERA Universal Balance Sheet DNA Configuration - ${industryType.toUpperCase()}\n`);
  
  const config = BALANCE_SHEET_DNA_CONFIG.industries[industryType];
  if (!config) {
    console.log(`❌ Unknown industry type: ${industryType}`);
    console.log('Available industries:', Object.keys(BALANCE_SHEET_DNA_CONFIG.industries).join(', '));
    return;
  }

  console.log(`🏢 INDUSTRY: ${config.name}`);
  console.log('='.repeat(config.name.length + 12));
  
  console.log('\n📊 BALANCE SHEET STRUCTURE:');
  
  Object.entries(config.template_sections).forEach(([section, items]) => {
    console.log(`\n   ${section.replace(/_/g, ' ').toUpperCase()}:`);
    items.forEach(item => {
      console.log(`   • ${item}`);
    });
  });

  console.log('\n📈 KEY FINANCIAL RATIOS:');
  Object.entries(config.key_ratios).forEach(([ratio, target]) => {
    console.log(`   ${ratio.replace(/_/g, ' ').toUpperCase()}: ${target}`);
  });

  if (config.daily_metrics) {
    console.log('\n📅 DAILY MONITORING METRICS:');
    config.daily_metrics.forEach(metric => {
      console.log(`   • ${metric}`);
    });
  }

  console.log('\n🔧 DNA INTEGRATION:');
  console.log('   ✅ Trial Balance DNA: Real-time account balances');
  console.log('   ✅ Auto-Journal DNA: Automatic balance updates');
  console.log('   ✅ Multi-Currency: Automatic currency conversion');
  console.log('   ✅ Daily Reporting: Scheduled balance sheet generation');
  console.log('   ✅ Comparative Analysis: Month-over-month changes');
  console.log('   ✅ Consolidation: Multi-organization support');
}

async function generateDailyBalanceSheet(organizationId, options = {}) {
  console.log('📊 GENERATING DAILY BALANCE SHEET REPORT\n');
  
  if (!organizationId) {
    console.error('❌ Organization ID required');
    return;
  }

  const {
    asOfDate = new Date().toISOString().split('T')[0],
    industryType = 'salon',
    includeComparatives = true,
    includeRatios = true,
    format = 'detailed'
  } = options;

  try {
    console.log(`🏢 Organization ID: ${organizationId}`);
    console.log(`📅 As of Date: ${asOfDate}`);
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
    const industryConfig = BALANCE_SHEET_DNA_CONFIG.industries[industryType];
    console.log(`🏭 Industry: ${industryConfig.name}\n`);

    // Generate balance sheet data using SQL function
    const { data: balanceSheetData, error } = await supabase
      .rpc('generate_daily_balance_sheet', {
        p_organization_id: organizationId,
        p_as_of_date: asOfDate,
        p_industry_type: industryType,
        p_include_comparatives: includeComparatives
      });

    if (error) {
      console.error('❌ Error generating balance sheet:', error.message);
      return;
    }

    if (!balanceSheetData || balanceSheetData.length === 0) {
      console.log('⚠️  No balance sheet data found for the specified period');
      console.log('   This may indicate:');
      console.log('   - No business transactions recorded');
      console.log('   - Trial balance is empty');
      console.log('   - Organization setup is incomplete');
      return;
    }

    console.log(`📈 Balance Sheet Generated: ${balanceSheetData.length} accounts\n`);

    // Display balance sheet report
    await displayBalanceSheetReport(balanceSheetData, industryConfig, org.organization_name, asOfDate, includeComparatives);

    // Generate balance sheet summary
    const { data: summaryData } = await supabase
      .rpc('generate_balance_sheet_summary', {
        p_organization_id: organizationId,
        p_as_of_date: asOfDate
      });

    if (summaryData) {
      await displayBalanceSheetSummary(summaryData);
    }

    // Calculate and display financial ratios
    if (includeRatios) {
      const { data: ratiosData } = await supabase
        .rpc('calculate_balance_sheet_ratios', {
          p_organization_id: organizationId,
          p_as_of_date: asOfDate
        });

      if (ratiosData) {
        await displayFinancialRatios(ratiosData, industryConfig);
      }
    }

  } catch (error) {
    console.error('❌ Error generating daily balance sheet:', error.message);
  }
}

function displayBalanceSheetReport(balanceSheetData, industryConfig, organizationName, asOfDate, includeComparatives) {
  console.log('📊 BALANCE SHEET REPORT');
  console.log('='.repeat(80));
  console.log(`Organization: ${organizationName}`);
  console.log(`As of: ${asOfDate}`);
  console.log(`Industry: ${industryConfig.name}`);
  console.log(`Generated: ${new Date().toLocaleString()}\n`);

  // Group data by section
  const sections = {};
  balanceSheetData.forEach(item => {
    if (!sections[item.section_type]) {
      sections[item.section_type] = {};
    }
    if (!sections[item.section_type][item.subsection]) {
      sections[item.section_type][item.subsection] = [];
    }
    sections[item.section_type][item.subsection].push(item);
  });

  // Display sections in balance sheet order
  const sectionOrder = ['Assets', 'Liabilities', 'Equity'];
  
  if (includeComparatives) {
    console.log('Account                                │    Current │     Prior │    Change │   Change%');
    console.log('─'.repeat(95));
  } else {
    console.log('Account                                │    Balance');
    console.log('─'.repeat(50));
  }

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  sectionOrder.forEach(sectionType => {
    if (sections[sectionType]) {
      console.log(`\n${sectionType.toUpperCase()}:`);
      
      Object.entries(sections[sectionType]).forEach(([subsection, accounts]) => {
        console.log(`\n  ${subsection}:`);
        
        let subsectionTotal = 0;
        accounts.forEach(account => {
          const name = account.account_name.padEnd(38);
          const current = account.current_balance.toFixed(2).padStart(11);
          subsectionTotal += parseFloat(account.current_balance);
          
          if (includeComparatives) {
            const prior = account.prior_balance.toFixed(2).padStart(11);
            const change = account.balance_change.toFixed(2).padStart(11);
            const changePct = (account.percentage_change || 0).toFixed(1).padStart(8) + '%';
            console.log(`    ${name} │ ${current} │ ${prior} │ ${change} │ ${changePct}`);
          } else {
            console.log(`    ${name} │ ${current}`);
          }
          
          // Accumulate section totals
          if (sectionType === 'Assets') totalAssets += parseFloat(account.current_balance);
          else if (sectionType === 'Liabilities') totalLiabilities += parseFloat(account.current_balance);
          else if (sectionType === 'Equity') totalEquity += parseFloat(account.current_balance);
        });
        
        // Subsection total
        if (includeComparatives) {
          console.log(`    ${'Total ' + subsection} │ ${subsectionTotal.toFixed(2).padStart(11)} │ ${''.padStart(11)} │ ${''.padStart(11)} │ ${''.padStart(9)}`);
        } else {
          console.log(`    ${'Total ' + subsection} │ ${subsectionTotal.toFixed(2).padStart(11)}`);
        }
      });
    }
  });

  // Balance sheet totals and balance verification
  console.log('\n' + '='.repeat(95));
  console.log('BALANCE SHEET TOTALS:');
  console.log(`Total Assets:      ${totalAssets.toFixed(2).padStart(15)} AED`);
  console.log(`Total Liabilities: ${totalLiabilities.toFixed(2).padStart(15)} AED`);
  console.log(`Total Equity:      ${totalEquity.toFixed(2).padStart(15)} AED`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`Assets vs L+E:     ${(totalAssets - (totalLiabilities + totalEquity)).toFixed(2).padStart(15)} AED`);
  
  if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01) {
    console.log('✅ Balance Sheet is BALANCED');
  } else {
    console.log('⚠️  Balance Sheet is NOT BALANCED - Review journal entries');
  }
}

function displayBalanceSheetSummary(summaryData) {
  console.log('\n📈 BALANCE SHEET SUMMARY');
  console.log('='.repeat(60));
  console.log('Section           │    Current │     Prior │    Change │   Change%');
  console.log('─'.repeat(70));
  
  summaryData.forEach(summary => {
    const section = summary.summary_section.padEnd(17);
    const current = summary.current_amount.toFixed(2).padStart(11);
    const prior = summary.prior_amount.toFixed(2).padStart(11);
    const change = summary.change_amount.toFixed(2).padStart(11);
    const changePct = (summary.change_percent || 0).toFixed(1).padStart(8) + '%';
    
    console.log(`${section} │ ${current} │ ${prior} │ ${change} │ ${changePct}`);
  });
}

function displayFinancialRatios(ratiosData, industryConfig) {
  console.log('\n💰 FINANCIAL RATIO ANALYSIS');
  console.log('='.repeat(80));
  console.log('Ratio                  │    Value │ Benchmark │  Variance │ Status');
  console.log('─'.repeat(80));
  
  ratiosData.forEach(ratio => {
    const name = ratio.ratio_name.padEnd(22);
    const value = ratio.ratio_value.toFixed(2).padStart(9);
    const benchmark = ratio.industry_benchmark.toFixed(2).padStart(10);
    const variance = (ratio.variance_percent || 0).toFixed(1).padStart(8) + '%';
    const status = ratio.status.padEnd(10);
    
    console.log(`${name} │ ${value} │ ${benchmark} │ ${variance} │ ${status}`);
  });
  
  console.log('\n📊 RATIO INTERPRETATIONS:');
  ratiosData.forEach(ratio => {
    const statusIcon = ratio.status === 'Good' ? '✅' : ratio.status === 'Fair' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${ratio.ratio_name}: ${ratio.interpretation}`);
  });
  
  // Industry-specific insights
  console.log('\n🎯 INDUSTRY BENCHMARKS:');
  Object.entries(industryConfig.key_ratios).forEach(([metric, target]) => {
    console.log(`   ${metric.replace(/_/g, ' ').toUpperCase()}: ${target} (Industry Target)`);
  });
}

async function generateHairTalkzBalanceSheets(options = {}) {
  console.log('💇‍♀️ HAIR TALKZ GROUP - DAILY BALANCE SHEET REPORTS');
  console.log('='.repeat(70));
  console.log(`Generated: ${new Date().toLocaleString()}`);
  console.log(`As of Date: ${options.asOfDate || 'Today'}\n`);

  const results = [];
  
  // Generate balance sheet for each Hair Talkz organization
  for (const org of HAIR_TALKZ_ORGS) {
    console.log(`\n🔄 Processing: ${org.name}`);
    console.log('─'.repeat(50));
    
    try {
      await generateDailyBalanceSheet(org.id, {
        ...options,
        industryType: 'salon'
      });
      
      results.push({
        organizationId: org.id,
        organizationName: org.name,
        status: 'Success'
      });
      
    } catch (error) {
      console.log(`❌ Error processing ${org.name}:`, error.message);
      results.push({
        organizationId: org.id,
        organizationName: org.name,
        status: 'Failed',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 HAIR TALKZ GROUP SUMMARY');
  console.log('='.repeat(70));
  results.forEach(result => {
    const statusIcon = result.status === 'Success' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.organizationName}: ${result.status}`);
  });
}

async function generateConsolidatedBalanceSheet(organizationIds = HAIR_TALKZ_ORGS.map(org => org.id), options = {}) {
  console.log('🏢 CONSOLIDATED BALANCE SHEET - HAIR TALKZ GROUP');
  console.log('='.repeat(70));
  console.log(`Organizations: ${organizationIds.length}`);
  console.log(`As of: ${options.asOfDate || 'Today'}\n`);

  try {
    const { data: consolidatedData, error } = await supabase
      .rpc('generate_consolidated_balance_sheet', {
        p_organization_ids: organizationIds,
        p_as_of_date: options.asOfDate || new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('❌ Error generating consolidated balance sheet:', error.message);
      return;
    }

    if (!consolidatedData || consolidatedData.length === 0) {
      console.log('⚠️  No consolidated balance sheet data available');
      return;
    }

    console.log('📊 CONSOLIDATED BALANCE SHEET');
    console.log('─'.repeat(80));
    console.log('Section / Account Group                │ Consolidated │  Orgs │ Breakdown');
    console.log('─'.repeat(80));

    // Group by section
    const sections = {};
    consolidatedData.forEach(item => {
      if (!sections[item.section_type]) {
        sections[item.section_type] = {};
      }
      if (!sections[item.section_type][item.subsection]) {
        sections[item.section_type][item.subsection] = [];
      }
      sections[item.section_type][item.subsection].push(item);
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    // Display consolidated balance sheet
    ['Assets', 'Liabilities', 'Equity'].forEach(sectionType => {
      if (sections[sectionType]) {
        console.log(`\n${sectionType.toUpperCase()}:`);
        
        Object.entries(sections[sectionType]).forEach(([subsection, items]) => {
          console.log(`\n  ${subsection}:`);
          
          items.forEach(item => {
            const name = item.account_group.padEnd(38);
            const balance = item.consolidated_balance.toFixed(2).padStart(13);
            const orgCount = item.organization_count.toString().padStart(6);
            
            console.log(`    ${name} │ ${balance} │ ${orgCount} │ Multi-org`);
            
            // Accumulate totals
            if (sectionType === 'Assets') totalAssets += parseFloat(item.consolidated_balance);
            else if (sectionType === 'Liabilities') totalLiabilities += parseFloat(item.consolidated_balance);
            else if (sectionType === 'Equity') totalEquity += parseFloat(item.consolidated_balance);
          });
        });
      }
    });

    // Consolidated totals
    console.log('\n' + '='.repeat(80));
    console.log('CONSOLIDATED TOTALS:');
    console.log(`Total Group Assets:      ${totalAssets.toFixed(2).padStart(15)} AED`);
    console.log(`Total Group Liabilities: ${totalLiabilities.toFixed(2).padStart(15)} AED`);
    console.log(`Total Group Equity:      ${totalEquity.toFixed(2).padStart(15)} AED`);
    console.log(`Group Balance Check:     ${(totalAssets - (totalLiabilities + totalEquity)).toFixed(2).padStart(15)} AED`);

    if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01) {
      console.log('✅ Consolidated Balance Sheet is BALANCED');
    } else {
      console.log('⚠️  Consolidated Balance Sheet has variance - Review consolidation entries');
    }

  } catch (error) {
    console.error('❌ Error generating consolidated balance sheet:', error.message);
  }
}

async function listAvailableIndustries() {
  console.log('🏭 HERA UNIVERSAL BALANCE SHEET DNA - AVAILABLE INDUSTRIES\n');
  
  console.log('📋 SUPPORTED INDUSTRY TEMPLATES:');
  console.log('='.repeat(60));
  
  Object.entries(BALANCE_SHEET_DNA_CONFIG.industries).forEach(([key, config]) => {
    console.log(`\n🏢 ${config.name.toUpperCase()}`);
    console.log(`   Key: ${key}`);
    console.log(`   Sections: ${Object.keys(config.template_sections).length}`);
    console.log(`   Daily Metrics: ${config.daily_metrics?.length || 0}`);
    console.log(`   Usage: node balance-sheet-dna-cli.js config ${key}`);
  });

  console.log('\n🧬 DNA INTEGRATION BENEFITS:');
  console.log('='.repeat(60));
  BALANCE_SHEET_DNA_CONFIG.capabilities.forEach(capability => {
    console.log(`✅ ${capability}`);
  });

  console.log('\n🚀 QUICK USAGE:');
  console.log('   node balance-sheet-dna-cli.js daily --org your-org-id');
  console.log('   node balance-sheet-dna-cli.js hair-talkz  # All Hair Talkz orgs');
  console.log('   node balance-sheet-dna-cli.js consolidate # Consolidated view');
  console.log('   node balance-sheet-dna-cli.js analyze --org your-org-id\n');
}

function showUsageHelp() {
  console.log(`
🧬 HERA UNIVERSAL BALANCE SHEET DNA CLI TOOL
==============================================

Daily balance sheet reporting for any business type using HERA's 
Universal DNA architecture with real-time integration.

USAGE:
  node balance-sheet-dna-cli.js <command> [options]

COMMANDS:
  config [industry]         Show balance sheet DNA configuration for industry
                           Industries: salon, restaurant, universal

  daily                    Generate daily balance sheet for organization
    --org <org-id>           Organization UUID (required)
    --date <YYYY-MM-DD>      As of date (default: today)
    --industry <type>        Industry template (default: salon)
    --ratios                 Include financial ratio analysis
    --comparatives           Include prior period comparison

  hair-talkz               Generate balance sheets for all Hair Talkz organizations
    --date <YYYY-MM-DD>      As of date (default: today)
    --ratios                 Include financial ratio analysis

  consolidate              Generate consolidated balance sheet
    --orgs <id1,id2,id3>     Organization IDs (default: Hair Talkz group)
    --date <YYYY-MM-DD>      As of date (default: today)

  analyze                  Analyze balance sheet with industry benchmarks
    --org <org-id>           Organization UUID (required)
    --industry <type>        Industry template for benchmarking

  industries               List all available industry configurations

  help                     Show this help message

EXAMPLES:
  node balance-sheet-dna-cli.js config salon
  node balance-sheet-dna-cli.js daily --org uuid-here --ratios
  node balance-sheet-dna-cli.js hair-talkz --ratios
  node balance-sheet-dna-cli.js consolidate
  node balance-sheet-dna-cli.js analyze --org uuid-here --industry salon

ENVIRONMENT VARIABLES:
  DEFAULT_ORGANIZATION_ID   Your organization UUID (optional)
  SUPABASE_URL             Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

SMART CODE: HERA.FIN.BALANCE.SHEET.DNA.CLI.v1

🌟 This DNA component provides daily balance sheet reporting with
   real-time updates from Auto-Journal and Trial Balance DNA.
`);
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

async function main() {
  console.log('🧬 HERA Universal Balance Sheet DNA CLI Tool\n');

  switch (command) {
    case 'config':
      const industry = process.argv[3] || 'salon';
      await showBalanceSheetConfig(industry);
      break;
      
    case 'daily':
      const orgFlag = process.argv.indexOf('--org');
      const dateFlag = process.argv.indexOf('--date');
      const industryFlag = process.argv.indexOf('--industry');
      const ratiosFlag = process.argv.includes('--ratios');
      const comparativesFlag = process.argv.includes('--comparatives');
      
      const targetOrgId = orgFlag > -1 ? process.argv[orgFlag + 1] : organizationId;
      const asOfDate = dateFlag > -1 ? process.argv[dateFlag + 1] : new Date().toISOString().split('T')[0];
      const industryType = industryFlag > -1 ? process.argv[industryFlag + 1] : 'salon';
      
      if (!targetOrgId) {
        console.error('❌ Organization ID required. Use --org flag or set DEFAULT_ORGANIZATION_ID');
        return;
      }
      
      await generateDailyBalanceSheet(targetOrgId, {
        asOfDate,
        industryType,
        includeRatios: ratiosFlag,
        includeComparatives: comparativesFlag
      });
      break;

    case 'hair-talkz':
      const htDateFlag = process.argv.indexOf('--date');
      const htRatiosFlag = process.argv.includes('--ratios');
      
      const htDate = htDateFlag > -1 ? process.argv[htDateFlag + 1] : new Date().toISOString().split('T')[0];
      
      await generateHairTalkzBalanceSheets({
        asOfDate: htDate,
        includeRatios: htRatiosFlag,
        includeComparatives: true
      });
      break;
      
    case 'consolidate':
      const consOrgsFlag = process.argv.indexOf('--orgs');
      const consDateFlag = process.argv.indexOf('--date');
      
      let consOrgIds = HAIR_TALKZ_ORGS.map(org => org.id);
      if (consOrgsFlag > -1) {
        consOrgIds = process.argv[consOrgsFlag + 1].split(',').map(id => id.trim());
      }
      
      const consDate = consDateFlag > -1 ? process.argv[consDateFlag + 1] : new Date().toISOString().split('T')[0];
      
      await generateConsolidatedBalanceSheet(consOrgIds, {
        asOfDate: consDate
      });
      break;
      
    case 'analyze':
      const analyzeOrgFlag = process.argv.indexOf('--org');
      const analyzeIndustryFlag = process.argv.indexOf('--industry');
      
      const analyzeOrgId = analyzeOrgFlag > -1 ? process.argv[analyzeOrgFlag + 1] : organizationId;
      const analyzeIndustry = analyzeIndustryFlag > -1 ? process.argv[analyzeIndustryFlag + 1] : 'salon';
      
      if (!analyzeOrgId) {
        console.error('❌ Organization ID required for analysis');
        return;
      }
      
      await generateDailyBalanceSheet(analyzeOrgId, {
        industryType: analyzeIndustry,
        includeRatios: true,
        includeComparatives: true
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
  BALANCE_SHEET_DNA_CONFIG,
  showBalanceSheetConfig,
  generateDailyBalanceSheet,
  generateHairTalkzBalanceSheets,
  generateConsolidatedBalanceSheet,
  listAvailableIndustries,
  HAIR_TALKZ_ORGS
};