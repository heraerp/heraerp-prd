#!/usr/bin/env node

// ================================================================================
// HERA AUTO-JOURNAL DNA CLI TOOL
// Command-line interface for testing and using the auto-journal DNA system
// Smart Code: HERA.CLI.AUTO.JOURNAL.DNA.v1
// ================================================================================

const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Command-line arguments
const command = process.argv[2];
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

// ================================================================================
// MAIN CLI FUNCTIONS
// ================================================================================

async function showAutoJournalConfig(industryType = 'universal') {
  console.log(`🧬 HERA Auto-Journal DNA Configuration - ${industryType.toUpperCase()}\n`);
  
  try {
    // Call the DNA configuration function
    const { data, error } = await supabase.rpc('get_auto_journal_config', {
      p_organization_id: organizationId,
      p_industry_type: industryType
    });

    if (error) {
      console.error('❌ Error loading configuration:', error.message);
      return;
    }

    if (!data) {
      console.log('⚠️  No configuration found for industry:', industryType);
      return;
    }

    console.log('📋 THRESHOLDS:');
    console.log(`   Immediate Processing: $${data.thresholds?.immediate_processing || 'N/A'}`);
    console.log(`   Batch Small Transactions: $${data.thresholds?.batch_small_transactions || 'N/A'}`);
    console.log(`   Batch Minimum Count: ${data.thresholds?.batch_minimum_count || 'N/A'}`);
    console.log(`   Batch Summary Threshold: $${data.thresholds?.batch_summary_threshold || 'N/A'}`);

    console.log('\n🔧 JOURNAL RULES:');
    if (data.journal_rules && data.journal_rules.length > 0) {
      data.journal_rules.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule.transaction_type} (${rule.smart_code_pattern})`);
        console.log(`      → DR: ${rule.debit_accounts?.join(', ') || 'N/A'}`);
        console.log(`      → CR: ${rule.credit_accounts?.join(', ') || 'N/A'}`);
        if (rule.special_features) {
          const features = Object.keys(rule).filter(key => 
            key.includes('_split') || key.includes('_impact') || key.includes('_tracking')
          );
          if (features.length > 0) {
            console.log(`      → Special: ${features.join(', ')}`);
          }
        }
        console.log('');
      });
    } else {
      console.log('   No specific journal rules configured');
    }

    console.log('📦 BATCH STRATEGIES:');
    if (data.batch_strategies && data.batch_strategies.length > 0) {
      data.batch_strategies.forEach(strategy => {
        console.log(`   • ${strategy}`);
      });
    } else {
      console.log('   No batch strategies configured');
    }

    if (data.tax_handling) {
      console.log('\n💰 TAX CONFIGURATION:');
      console.log(`   Default Rate: ${(data.tax_handling.default_rate * 100).toFixed(1)}%`);
      console.log(`   Sales Tax Account: ${data.tax_handling.tax_accounts?.sales_tax || 'N/A'}`);
      console.log(`   Input Tax Account: ${data.tax_handling.tax_accounts?.input_tax || 'N/A'}`);
    }

    if (data.compliance) {
      console.log('\n🛡️  COMPLIANCE SETTINGS:');
      Object.keys(data.compliance).forEach(key => {
        console.log(`   ${key}: ${data.compliance[key]}`);
      });
    }

    if (data.costing) {
      console.log('\n🏭 COSTING CONFIGURATION:');
      console.log(`   Method: ${data.costing.method}`);
      if (data.costing.variance_accounts) {
        console.log('   Variance Accounts:');
        Object.keys(data.costing.variance_accounts).forEach(type => {
          console.log(`      ${type}: ${data.costing.variance_accounts[type]}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ CLI Error:', error.message);
  }
}

async function testTransactionRelevance(transactionData) {
  console.log('🤖 Testing Transaction Journal Relevance\n');
  
  try {
    const { data, error } = await supabase.rpc('check_transaction_journal_relevance', {
      p_transaction: transactionData
    });

    if (error) {
      console.error('❌ Error checking relevance:', error.message);
      return;
    }

    console.log('📊 RELEVANCE ANALYSIS:');
    console.log(`   Journal Required: ${data.is_relevant ? '✅ YES' : '❌ NO'}`);
    console.log(`   Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    console.log(`   Reason: ${data.reason}`);
    console.log(`   Requires AI: ${data.requires_ai ? '🤖 YES' : '🚀 NO (Rules-based)'}`);
    
    if (data.is_relevant) {
      console.log('\n💡 RECOMMENDATION:');
      if (data.confidence > 0.95) {
        console.log('   ✅ Create journal entry immediately');
      } else if (data.confidence > 0.75) {
        console.log('   ⚠️  Create journal entry with review');
      } else {
        console.log('   🔍 Requires manual review before journal creation');
      }
    }

  } catch (error) {
    console.error('❌ CLI Error:', error.message);
  }
}

async function showAvailableIndustries() {
  console.log('🏭 AVAILABLE INDUSTRY CONFIGURATIONS\n');
  
  try {
    // Get all auto-journal configurations from DNA system
    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_json')
      .like('field_name', '%_config')
      .eq('smart_code', 'HERA.DNA.AUTO.JOURNAL.CONFIG.*');

    if (error) {
      console.error('❌ Error loading industries:', error.message);
      return;
    }

    console.log('📋 SUPPORTED INDUSTRIES:');
    
    const industries = [
      { name: 'restaurant', desc: 'Restaurant & Food Service', features: 'POS integration, shift batching, tax splitting' },
      { name: 'healthcare', desc: 'Healthcare & Medical', features: 'Insurance splitting, HIPAA compliance, provider batching' },
      { name: 'manufacturing', desc: 'Manufacturing & Production', features: 'WIP tracking, variance analysis, production line batching' },
      { name: 'professional_services', desc: 'Professional Services', features: 'Time billing, project batching, revenue recognition' },
      { name: 'retail', desc: 'Retail & E-commerce', features: 'Inventory tracking, customer batching, multi-location' },
      { name: 'universal', desc: 'Universal (Default)', features: 'Works for any business type' }
    ];

    industries.forEach((industry, index) => {
      console.log(`\n${index + 1}. ${industry.desc.toUpperCase()}`);
      console.log(`   Key: ${industry.name}`);
      console.log(`   Features: ${industry.features}`);
      console.log(`   Usage: node auto-journal-dna-cli.js config ${industry.name}`);
    });

    console.log('\n💡 TIP: Run with any industry key to see detailed configuration');

  } catch (error) {
    console.error('❌ CLI Error:', error.message);
  }
}

async function showUsageHelp() {
  console.log(`
🧬 HERA AUTO-JOURNAL DNA CLI TOOL
=================================

This tool helps you explore and test the HERA Auto-Journal DNA system.

USAGE:
  node auto-journal-dna-cli.js <command> [options]

COMMANDS:
  config [industry]     Show auto-journal configuration for industry
                        Industries: restaurant, healthcare, manufacturing, 
                                   professional_services, retail, universal

  test-relevance       Test if a sample transaction requires journal entry
  
  industries           Show all available industry configurations
  
  help                 Show this help message

EXAMPLES:
  node auto-journal-dna-cli.js config restaurant
  node auto-journal-dna-cli.js config healthcare  
  node auto-journal-dna-cli.js test-relevance
  node auto-journal-dna-cli.js industries

ENVIRONMENT VARIABLES:
  DEFAULT_ORGANIZATION_ID  Your organization UUID (required)
  SUPABASE_URL            Your Supabase project URL
  SUPABASE_ANON_KEY       Your Supabase anonymous key

SMART CODE: HERA.CLI.AUTO.JOURNAL.DNA.v1
`);
}

// ================================================================================
// SAMPLE DATA FOR TESTING
// ================================================================================

function getSampleTransaction() {
  return {
    smart_code: 'HERA.REST.SALE.ORDER.v1',
    transaction_type: 'sale',
    total_amount: 125.50,
    metadata: {
      payment_method: 'credit_card',
      shift_id: 'evening_shift',
      pos_terminal: 'terminal_01'
    }
  };
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

async function main() {
  console.log('🧬 HERA Auto-Journal DNA CLI Tool\n');

  // Check for organization ID
  if (!organizationId && command !== 'help' && command !== 'industries') {
    console.error('❌ ERROR: DEFAULT_ORGANIZATION_ID environment variable is required');
    console.log('Set it with: export DEFAULT_ORGANIZATION_ID=your-org-uuid');
    console.log('Find your org ID with: node hera-cli.js query core_organizations\n');
    process.exit(1);
  }

  switch (command) {
    case 'config':
      const industry = process.argv[3] || 'universal';
      await showAutoJournalConfig(industry);
      break;
      
    case 'test-relevance':
      const sampleTransaction = getSampleTransaction();
      console.log('🧪 Using sample transaction:');
      console.log(JSON.stringify(sampleTransaction, null, 2));
      console.log('');
      await testTransactionRelevance(sampleTransaction);
      break;
      
    case 'industries':
      await showAvailableIndustries();
      break;
      
    case 'help':
    default:
      await showUsageHelp();
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
  showAutoJournalConfig,
  testTransactionRelevance,
  showAvailableIndustries
};