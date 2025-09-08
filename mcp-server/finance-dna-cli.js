#!/usr/bin/env node

/**
 * HERA Finance DNA CLI
 * Manage financial integration configurations
 * 
 * Usage:
 *   node finance-dna-cli.js activate --org <org-id> --industry <type>
 *   node finance-dna-cli.js rules --org <org-id>
 *   node finance-dna-cli.js test-posting --org <org-id> --event <file>
 */

const { createClient } = require('@supabase/supabase-js')
const Table = require('cli-table3')
const chalk = require('chalk')
const fs = require('fs').promises

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('❌ Missing Supabase configuration in .env file'))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Command handlers
const commands = {
  async activate(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    const industry = args.industry || 'restaurant'
    const country = args.country || 'US'
    const currency = args.currency || 'USD'
    
    if (!orgId) {
      console.error(chalk.red('❌ Organization ID required'))
      return
    }
    
    console.log(chalk.cyan(`\n🧬 Activating Finance DNA for organization ${orgId}...`))
    console.log(chalk.gray(`Industry: ${industry}, Country: ${country}, Currency: ${currency}`))
    
    // Update organization settings
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
      modules_enabled: { SD: true, MM: true, HR: true, FI: true },
      finance_policy: {
        default_coa_id: `COA-${industry.toUpperCase()}-${country}`,
        tax_profile_id: `TAX-${country}-STANDARD`,
        base_currency: currency,
        fx_source: 'ECB'
      }
    }
    
    const { error: updateError } = await supabase
      .from('core_organizations')
      .update({ settings })
      .eq('id', orgId)
    
    if (updateError) {
      console.error(chalk.red('❌ Failed to update organization:', updateError.message))
      return
    }
    
    // Load default posting rules
    console.log(chalk.gray('\nLoading default posting rules...'))
    const rules = getDefaultRules(industry)
    
    for (const rule of rules) {
      // First check if rule already exists
      const { data: existing, error: fetchError } = await supabase
        .from('core_dynamic_data')
        .select('id')
        .eq('organization_id', orgId)
        .eq('field_name', 'posting_rule')
        .eq('field_type', rule.smart_code)
        .single()
      
      if (existing) {
        // Update existing rule
        const { error } = await supabase
          .from('core_dynamic_data')
          .update({
            field_value_json: rule,
            smart_code: 'HERA.DNA.FINANCE.POSTING_RULE.v1',
            ai_confidence: 1.0
          })
          .eq('id', existing.id)
        
        if (error) {
          console.error(chalk.red(`❌ Failed to update rule ${rule.smart_code}:`, error.message))
        } else {
          console.log(chalk.green(`✅ Updated rule: ${rule.smart_code}`))
        }
      } else {
        // First get or create Finance DNA config entity
        const { data: configEntity } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', orgId)
          .eq('entity_type', 'finance_dna_config')
          .single()
        
        const entityId = configEntity?.id || '3eff5fd7-dad7-4fe4-befb-54040531ab6f' // Fallback to known entity
        
        // Insert new rule
        const { error } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: orgId,
            entity_id: entityId,
            field_name: 'posting_rule',
            field_type: rule.smart_code,
            field_value_json: rule,
            smart_code: 'HERA.DNA.FINANCE.POSTING_RULE.v1',
            ai_confidence: 1.0
          })
        
        if (error) {
          console.error(chalk.red(`❌ Failed to save rule ${rule.smart_code}:`, error.message))
        } else {
          console.log(chalk.green(`✅ Saved rule: ${rule.smart_code}`))
        }
      }
    }
    
    console.log(chalk.green('\n✨ Finance DNA activated successfully!'))
  },
  
  async rules(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    
    if (!orgId) {
      console.error(chalk.red('❌ Organization ID required'))
      return
    }
    
    console.log(chalk.cyan(`\n📋 Posting Rules for organization ${orgId}\n`))
    
    // Fetch posting rules
    const { data: rules, error } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', orgId)
      .eq('field_name', 'posting_rule')
    
    if (error) {
      console.error(chalk.red('❌ Failed to fetch rules:', error.message))
      return
    }
    
    if (!rules || rules.length === 0) {
      console.log(chalk.yellow('No posting rules found. Run "activate" first.'))
      return
    }
    
    const table = new Table({
      head: [
        chalk.cyan('Smart Code'),
        chalk.cyan('Auto Post'),
        chalk.cyan('GL Impact'),
        chalk.cyan('Created')
      ],
      colWidths: [50, 15, 40, 20]
    })
    
    rules.forEach(rule => {
      const ruleData = rule.field_value_json
      const glLines = ruleData.posting_recipe?.lines || []
      const glImpact = glLines
        .map(line => line.derive)
        .join(', ')
        .substring(0, 35) + (glLines.length > 2 ? '...' : '')
      
      table.push([
        ruleData.smart_code,
        ruleData.outcomes?.auto_post_if || 'manual',
        glImpact,
        new Date(rule.created_at).toLocaleDateString()
      ])
    })
    
    console.log(table.toString())
  },
  
  async 'test-posting'(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    const eventFile = args.event
    
    if (!orgId || !eventFile) {
      console.error(chalk.red('❌ Organization ID and event file required'))
      console.log(chalk.gray('Usage: node finance-dna-cli.js test-posting --org <id> --event <file>'))
      return
    }
    
    console.log(chalk.cyan(`\n🧪 Testing posting for event file: ${eventFile}\n`))
    
    // Load event from file
    let event
    try {
      const content = await fs.readFile(eventFile, 'utf8')
      event = JSON.parse(content)
    } catch (error) {
      console.error(chalk.red('❌ Failed to load event file:', error.message))
      return
    }
    
    // Fetch posting rule
    const { data: ruleData, error: ruleError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', orgId)
      .eq('field_name', 'posting_rule')
      .eq('field_type', event.smart_code)
      .single()
    
    if (ruleError || !ruleData) {
      console.error(chalk.red(`❌ No posting rule found for ${event.smart_code}`))
      return
    }
    
    const rule = ruleData.field_value_json
    
    console.log(chalk.gray('Event Details:'))
    console.log(chalk.gray(`  Smart Code: ${event.smart_code}`))
    console.log(chalk.gray(`  Amount: ${event.currency} ${event.lines[0]?.amount || 0}`))
    console.log(chalk.gray(`  Confidence: ${event.ai_confidence || 0.95}`))
    
    console.log(chalk.gray('\nPosting Rule:'))
    console.log(chalk.gray(`  Auto Post: ${rule.outcomes?.auto_post_if || 'manual'}`))
    
    console.log(chalk.gray('\nGL Impact:'))
    const glTable = new Table({
      head: [chalk.cyan('Account'), chalk.cyan('Debit'), chalk.cyan('Credit')]
    })
    
    rule.posting_recipe?.lines?.forEach(line => {
      glTable.push([
        line.derive,
        line.derive.startsWith('DR') ? event.lines[0]?.amount || '' : '',
        line.derive.startsWith('CR') ? event.lines[0]?.amount || '' : ''
      ])
    })
    
    console.log(glTable.toString())
    
    // Check if would auto-post
    const confidence = event.ai_confidence || 0.95
    const autoPostCondition = rule.outcomes?.auto_post_if || 'ai_confidence >= 0.8'
    const wouldAutoPost = eval(autoPostCondition.replace('ai_confidence', confidence))
    
    console.log(chalk.gray(`\nOutcome: ${wouldAutoPost ? chalk.green('Would auto-post') : chalk.yellow('Would stage for review')}`))
  },
  
  async coa(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    
    if (!orgId) {
      console.error(chalk.red('❌ Organization ID required'))
      return
    }
    
    console.log(chalk.cyan(`\n📊 Chart of Accounts for organization ${orgId}\n`))
    
    // Fetch GL accounts
    const { data: accounts, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'gl_account')
      .order('entity_code')
    
    if (error) {
      console.error(chalk.red('❌ Failed to fetch accounts:', error.message))
      return
    }
    
    if (!accounts || accounts.length === 0) {
      console.log(chalk.yellow('No GL accounts found. Create COA first.'))
      return
    }
    
    const table = new Table({
      head: [
        chalk.cyan('Account Code'),
        chalk.cyan('Account Name'),
        chalk.cyan('Type'),
        chalk.cyan('Status')
      ],
      colWidths: [15, 40, 20, 15]
    })
    
    accounts.forEach(account => {
      table.push([
        account.entity_code,
        account.entity_name,
        account.entity_subtype || 'Unknown',
        account.metadata?.status || 'Active'
      ])
    })
    
    console.log(table.toString())
    console.log(chalk.gray(`\nTotal accounts: ${accounts.length}`))
  }
}

// Default posting rules by industry
function getDefaultRules(industry) {
  const baseRules = [
    {
      smart_code: `HERA.${industry.toUpperCase()}.SALE.POSTED.v1`,
      validations: {
        required_header: ['organization_id', 'currency', 'origin_txn_id'],
        required_lines: ['entity_id', 'dr|cr'],
        fiscal_check: 'open_period'
      },
      posting_recipe: {
        lines: [
          { derive: 'DR Cash/AR', from: 'payment.method.account' },
          { derive: 'CR Revenue', from: 'product.revenue_account' },
          { derive: 'CR Tax Payable', from: 'tax.liability_account' }
        ]
      },
      outcomes: {
        auto_post_if: 'ai_confidence >= 0.90',
        else: 'stage_for_review'
      }
    },
    {
      smart_code: `HERA.${industry.toUpperCase()}.EXPENSE.POSTED.v1`,
      validations: {
        required_header: ['organization_id', 'currency', 'origin_txn_id'],
        required_lines: ['entity_id', 'dr|cr']
      },
      posting_recipe: {
        lines: [
          { derive: 'DR Expense', from: 'expense.category.account' },
          { derive: 'CR Cash/AP', from: 'payment.method.account' }
        ]
      },
      outcomes: {
        auto_post_if: 'ai_confidence >= 0.85',
        else: 'stage_for_review'
      }
    }
  ]
  
  // Add industry-specific rules
  if (industry === 'restaurant') {
    baseRules.push({
      smart_code: 'HERA.RESTAURANT.KOT.GOODS_ISSUE.v1',
      validations: {
        required_header: ['organization_id', 'currency', 'origin_txn_id'],
        required_lines: ['entity_id', 'quantity']
      },
      posting_recipe: {
        lines: [
          { derive: 'DR COGS', from: 'product.cogs_account' },
          { derive: 'CR Inventory', from: 'product.inventory_account' }
        ]
      },
      outcomes: {
        auto_post_if: 'ai_confidence >= 0.90',
        else: 'stage_for_review'
      }
    })
  } else if (industry === 'salon') {
    baseRules.push({
      smart_code: 'HERA.SALON.PAYROLL.COMMISSION.v1',
      validations: {
        required_header: ['organization_id', 'currency', 'origin_txn_id'],
        required_lines: ['employee_id', 'amount']
      },
      posting_recipe: {
        lines: [
          { derive: 'DR Commission Expense', from: 'employee.commission_expense' },
          { derive: 'CR Commission Payable', from: 'employee.commission_payable' }
        ]
      },
      outcomes: {
        auto_post_if: 'ai_confidence >= 0.85',
        else: 'stage_for_review'
      }
    })
  }
  
  return baseRules
}

// Main execution
async function main() {
  const command = process.argv[2]
  
  if (!command || !commands[command]) {
    console.log(chalk.cyan('\n🧬 HERA Finance DNA CLI\n'))
    console.log('Commands:')
    console.log('  activate     - Activate Finance DNA for an organization')
    console.log('  rules        - List posting rules')
    console.log('  test-posting - Test posting for an event')
    console.log('  coa          - List Chart of Accounts')
    console.log('\nOptions:')
    console.log('  --org        Organization ID')
    console.log('  --industry   Industry type (restaurant, salon, retail, manufacturing)')
    console.log('  --country    Country code (US, AE, UK, etc.)')
    console.log('  --currency   Base currency (USD, AED, GBP, etc.)')
    console.log('  --event      Event JSON file for testing')
    console.log('\nExamples:')
    console.log('  node finance-dna-cli.js activate --org ORG-123 --industry restaurant')
    console.log('  node finance-dna-cli.js rules --org ORG-123')
    console.log('  node finance-dna-cli.js test-posting --org ORG-123 --event sample-sale.json')
    return
  }
  
  // Parse arguments
  const args = {}
  for (let i = 3; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace('--', '')
    const value = process.argv[i + 1]
    args[key] = value
  }
  
  await commands[command](args)
}

main().catch(console.error)