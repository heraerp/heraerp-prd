#!/usr/bin/env node

/**
 * HERA Finance DNA Setup for Furniture Module
 * Activates automatic financial integration for furniture sales operations
 * 
 * Usage:
 *   node setup-furniture-finance-dna.js --org <organization-id>
 */

const { createClient } = require('@supabase/supabase-js')

// Simple console colors instead of chalk
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
}

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error(colors.red('❌ Missing Supabase configuration in .env file'))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupFurnitureFinanceDNA() {
  const args = process.argv.slice(2)
  const orgId = args.find(arg => arg.startsWith('--org='))?.split('=')[1] || 
                process.env.DEFAULT_ORGANIZATION_ID ||
                'd56e8661-228e-4351-b391-5a36785dcc37' // Default org from CLI output

  console.log(colors.cyan('\n🧬 HERA Finance DNA Setup for Furniture Module'))
  console.log(colors.gray(`Organization ID: ${orgId}`))
  
  try {
    // 1. Create Chart of Accounts for Furniture Industry
    console.log(colors.yellow('\n📋 Step 1: Creating Chart of Accounts for Furniture...'))
    
    const furnitureAccounts = [
      {
        account_code: '110000',
        account_name: 'Cash on Hand',
        account_type: 'asset',
        smart_code: 'HERA.FURNITURE.GL.CASH.v1'
      },
      {
        account_code: '120000',
        account_name: 'Accounts Receivable - Trade',
        account_type: 'asset',
        smart_code: 'HERA.FURNITURE.GL.ACCOUNTS_RECEIVABLE.v1'
      },
      {
        account_code: '130000',
        account_name: 'Furniture Inventory',
        account_type: 'asset',
        smart_code: 'HERA.FURNITURE.GL.INVENTORY.v1'
      },
      {
        account_code: '220000',
        account_name: 'GST/VAT Payable',
        account_type: 'liability',
        smart_code: 'HERA.FURNITURE.GL.SALES_TAX.v1'
      },
      {
        account_code: '410000',
        account_name: 'Furniture Sales Revenue',
        account_type: 'revenue',
        smart_code: 'HERA.FURNITURE.GL.SALES_REVENUE.v1'
      },
      {
        account_code: '510000',
        account_name: 'Cost of Goods Sold - Furniture',
        account_type: 'expense',
        smart_code: 'HERA.FURNITURE.GL.COGS.v1'
      },
      {
        account_code: '520000',
        account_name: 'Delivery Expenses',
        account_type: 'expense',
        smart_code: 'HERA.FURNITURE.GL.DELIVERY.v1'
      }
    ]

    for (const account of furnitureAccounts) {
      // Check if account already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_type', 'gl_account')
        .eq('entity_code', account.account_code)
        .single()

      if (!existing) {
        const { error } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgId,
            entity_type: 'gl_account',
            entity_code: account.account_code,
            entity_name: account.account_name,
            smart_code: account.smart_code,
            metadata: {
              account_type: account.account_type,
              industry: 'furniture',
              auto_created: true,
              created_by: 'finance_dna_setup'
            }
          })

        if (error) {
          console.error(chalk.red(`❌ Failed to create account ${account.account_code}:`, error.message))
        } else {
          console.log(chalk.green(`✅ Created GL Account: ${account.account_code} - ${account.account_name}`))
        }
      } else {
        console.log(chalk.gray(`⚪ Account exists: ${account.account_code} - ${account.account_name}`))
      }
    }

    // 2. Create Finance DNA Posting Rules
    console.log(chalk.yellow('\n🧬 Step 2: Setting up Finance DNA Posting Rules...'))
    
    const postingRules = [
      {
        smart_code: 'HERA.FURNITURE.SALES.ORDER.POSTED.v1',
        rule_name: 'Furniture Sales Order Posting',
        description: 'Automatic GL posting for furniture sales orders',
        posting_lines: [
          { account_code: '120000', debit_credit: 'debit', role: 'Customer Receivable', amount_source: 'total_amount' },
          { account_code: '410000', debit_credit: 'credit', role: 'Sales Revenue', amount_source: 'subtotal' },
          { account_code: '220000', debit_credit: 'credit', role: 'Sales Tax', amount_source: 'tax_amount' }
        ]
      },
      {
        smart_code: 'HERA.FURNITURE.INVENTORY.OUT.v1',
        rule_name: 'Furniture Inventory Depletion',
        description: 'COGS posting when furniture is sold',
        posting_lines: [
          { account_code: '510000', debit_credit: 'debit', role: 'Cost of Goods Sold', amount_source: 'cost_amount' },
          { account_code: '130000', debit_credit: 'credit', role: 'Inventory Reduction', amount_source: 'cost_amount' }
        ]
      },
      {
        smart_code: 'HERA.FURNITURE.PAYMENT.RECEIVED.v1',
        rule_name: 'Furniture Payment Received',
        description: 'Cash receipt against A/R for furniture sales',
        posting_lines: [
          { account_code: '110000', debit_credit: 'debit', role: 'Cash Received', amount_source: 'payment_amount' },
          { account_code: '120000', debit_credit: 'credit', role: 'A/R Cleared', amount_source: 'payment_amount' }
        ]
      }
    ]

    for (const rule of postingRules) {
      // Store posting rule as dynamic data
      const { error } = await supabase
        .from('core_dynamic_data')
        .upsert({
          organization_id: orgId,
          field_name: 'finance_posting_rule',
          field_category: 'finance_dna',
          field_key: rule.smart_code,
          field_value_json: JSON.stringify(rule),
          smart_code: 'HERA.DNA.FINANCE.POSTING_RULE.v1'
        })

      if (error) {
        console.error(chalk.red(`❌ Failed to create posting rule for ${rule.smart_code}:`, error.message))
      } else {
        console.log(chalk.green(`✅ Created Posting Rule: ${rule.rule_name}`))
      }
    }

    // 3. Update Organization Settings
    console.log(chalk.yellow('\n⚙️ Step 3: Updating Organization Settings...'))
    
    const { data: org, error: fetchError } = await supabase
      .from('core_organizations')
      .select('settings')
      .eq('id', orgId)
      .single()

    if (fetchError) {
      console.error(chalk.red('❌ Failed to fetch organization:', fetchError.message))
      return
    }

    const settings = org.settings || {}
    settings.finance_dna = {
      activated: true,
      activated_at: new Date().toISOString(),
      version: '1.0',
      industry: 'furniture',
      modules_enabled: { SD: true, MM: true, FI: true, CO: true },
      finance_policy: {
        default_coa_id: 'COA-FURNITURE-STANDARD',
        tax_profile_id: 'TAX-STANDARD-GST',
        base_currency: 'AED',
        auto_post_threshold: 0.95,
        manual_review_threshold: 0.80
      },
      furniture_config: {
        default_revenue_account: '410000',
        default_receivable_account: '120000',
        default_inventory_account: '130000',
        default_cogs_account: '510000',
        delivery_expense_account: '520000'
      }
    }

    const { error: updateError } = await supabase
      .from('core_organizations')
      .update({ settings })
      .eq('id', orgId)

    if (updateError) {
      console.error(chalk.red('❌ Failed to update organization settings:', updateError.message))
      return
    }

    console.log(chalk.green('✅ Organization settings updated with Finance DNA configuration'))

    // 4. Success Summary
    console.log(chalk.cyan('\n🎉 Finance DNA Setup Complete for Furniture Module!'))
    console.log(chalk.green('\n📋 Summary:'))
    console.log(chalk.gray('  ✅ Chart of Accounts created (7 accounts)'))
    console.log(chalk.gray('  ✅ Posting rules configured (3 rules)'))
    console.log(chalk.gray('  ✅ Organization settings updated'))
    console.log(chalk.gray('  ✅ Automatic GL posting enabled'))
    
    console.log(chalk.yellow('\n🚀 Next Steps:'))
    console.log(chalk.gray('  1. Test the furniture sales order modal'))
    console.log(chalk.gray('  2. Verify automatic GL postings'))
    console.log(chalk.gray('  3. Monitor Finance DNA dashboard'))
    console.log(chalk.gray('  4. Review journal entries for accuracy'))

    console.log(chalk.cyan('\n🔧 Test Commands:'))
    console.log(chalk.gray('  node auto-journal-dna-cli.js test-relevance "HERA.FURNITURE.SALES.ORDER.POSTED.v1"'))
    console.log(chalk.gray('  node trial-balance-dna-cli.js generate --org ' + orgId))
    console.log(chalk.gray('  node cashflow-dna-cli.js generate --org ' + orgId))

  } catch (error) {
    console.error(chalk.red('❌ Setup failed:', error.message))
    process.exit(1)
  }
}

// Run the setup
setupFurnitureFinanceDNA()