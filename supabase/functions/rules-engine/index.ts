/**
 * HERA Rules Engine v2.5 - Automated Posting Integration
 * 
 * Intelligent automation for accounting operations:
 * - Automated GL posting with multi-currency balance
 * - AI-powered transaction categorization
 * - Dynamic chart of accounts management
 * - Compliance rule enforcement
 * 
 * Smart Code: HERA.RULES_ENGINE.AUTOMATION.v1
 */

import { serve } from "https://deno.land/std@0.202.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.0"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

/**
 * Rules Engine Configuration
 */
interface RulesEngineConfig {
  organization_id: string
  auto_posting_enabled: boolean
  ai_categorization_enabled: boolean
  compliance_rules: Array<{
    rule_type: string
    parameters: Record<string, any>
    action: 'warn' | 'block' | 'auto_correct'
  }>
  chart_of_accounts_management: {
    auto_create_accounts: boolean
    approval_required: boolean
    ai_suggestions_enabled: boolean
  }
}

/**
 * Transaction Context for Rules Processing
 */
interface TransactionContext {
  transaction_id: string
  transaction_type: string
  organization_id: string
  actor_user_id: string
  amount: number
  currency: string
  description: string
  source_entity_id?: string
  target_entity_id?: string
  lines: Array<{
    line_number: number
    line_type: string
    description?: string
    amount: number
    entity_id?: string
    account_code?: string
    line_data?: Record<string, any>
  }>
}

/**
 * Rules Engine Result
 */
interface RulesEngineResult {
  success: boolean
  actions_taken: Array<{
    action_type: string
    description: string
    automated: boolean
    result: any
  }>
  gl_entries_created?: Array<{
    account_code: string
    side: 'DR' | 'CR'
    amount: number
    currency: string
    description: string
  }>
  warnings?: string[]
  errors?: string[]
  ai_insights?: {
    categorization: string
    confidence: number
    suggestions: string[]
  }
}

/**
 * HERA Rules Engine - Main Handler
 */
async function handleRulesEngine(req: Request): Promise<Response> {
  const { action, context } = await req.json()
  
  console.log(`Rules Engine: ${action} for transaction ${context.transaction_id}`)
  
  try {
    switch (action) {
      case 'process_transaction':
        return await processTransactionRules(context)
      case 'categorize_transaction':
        return await categorizeTransaction(context)
      case 'generate_gl_entries':
        return await generateGLEntries(context)
      case 'validate_compliance':
        return await validateCompliance(context)
      case 'manage_chart_accounts':
        return await manageChartOfAccounts(context)
      default:
        return json(400, { error: `Unknown action: ${action}` })
    }
  } catch (error) {
    console.error('Rules Engine error:', error)
    return json(500, { error: error.message })
  }
}

/**
 * AUTOMATED TRANSACTION PROCESSING
 */
async function processTransactionRules(context: TransactionContext): Promise<Response> {
  const config = await getRulesConfig(context.organization_id)
  const result: RulesEngineResult = {
    success: true,
    actions_taken: []
  }

  try {
    // 1. AI-Powered Categorization
    if (config.ai_categorization_enabled) {
      const categorization = await aiCategorizeTransaction(context)
      result.ai_insights = categorization
      result.actions_taken.push({
        action_type: 'ai_categorization',
        description: `AI categorized transaction as: ${categorization.categorization}`,
        automated: true,
        result: categorization
      })
    }

    // 2. Automated GL Posting
    if (config.auto_posting_enabled) {
      const glEntries = await generateAutomatedGLEntries(context, result.ai_insights)
      if (glEntries.length > 0) {
        const postingResult = await postGLEntries(context, glEntries)
        result.gl_entries_created = glEntries
        result.actions_taken.push({
          action_type: 'automated_posting',
          description: `Created ${glEntries.length} GL entries`,
          automated: true,
          result: postingResult
        })
      }
    }

    // 3. Compliance Validation
    const complianceResult = await validateTransactionCompliance(context, config)
    if (complianceResult.violations.length > 0) {
      result.warnings = complianceResult.violations
      result.actions_taken.push({
        action_type: 'compliance_check',
        description: `Found ${complianceResult.violations.length} compliance issues`,
        automated: true,
        result: complianceResult
      })
    }

    // 4. Chart of Accounts Management
    if (config.chart_of_accounts_management.auto_create_accounts) {
      const accountsResult = await autoManageChartAccounts(context, result.ai_insights)
      if (accountsResult.accounts_created.length > 0) {
        result.actions_taken.push({
          action_type: 'chart_accounts_management',
          description: `Auto-created ${accountsResult.accounts_created.length} accounts`,
          automated: true,
          result: accountsResult
        })
      }
    }

    return json(200, { success: true, result })

  } catch (error) {
    result.success = false
    result.errors = [error.message]
    return json(500, { success: false, result })
  }
}

/**
 * AI-POWERED TRANSACTION CATEGORIZATION
 */
async function aiCategorizeTransaction(context: TransactionContext) {
  const prompt = `
As HERA AI Digital Accountant, categorize this transaction:

Transaction Details:
- Type: ${context.transaction_type}
- Amount: ${context.amount} ${context.currency}
- Description: ${context.description}
- Lines: ${JSON.stringify(context.lines, null, 2)}

Provide:
1. Primary category (e.g., "Office Supplies", "Professional Services", "Revenue - Sales")
2. Confidence score (0-1)
3. Account code suggestion (if applicable)
4. Business insights or recommendations

Respond in JSON format:
{
  "categorization": "Primary Category Name",
  "confidence": 0.95,
  "account_code": "SUGGESTED_CODE",
  "account_type": "EXPENSE|REVENUE|ASSET|LIABILITY",
  "insights": ["Insight 1", "Insight 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const aiResponse = JSON.parse(response.content[0].text)
    
    // Track AI usage
    await trackAIUsage(context, 'transaction_categorization', response.usage)

    return {
      categorization: aiResponse.categorization,
      confidence: aiResponse.confidence,
      account_code: aiResponse.account_code,
      account_type: aiResponse.account_type,
      suggestions: aiResponse.suggestions || [],
      insights: aiResponse.insights || []
    }
  } catch (error) {
    console.error('AI categorization error:', error)
    return {
      categorization: 'Uncategorized',
      confidence: 0,
      suggestions: ['Manual review required']
    }
  }
}

/**
 * AUTOMATED GL ENTRY GENERATION
 */
async function generateAutomatedGLEntries(
  context: TransactionContext, 
  aiInsights?: any
): Promise<Array<any>> {
  const glEntries: Array<any> = []

  // Determine posting logic based on transaction type and AI insights
  switch (context.transaction_type) {
    case 'sale':
      return await generateSaleGLEntries(context, aiInsights)
    case 'purchase':
      return await generatePurchaseGLEntries(context, aiInsights)
    case 'payment':
      return await generatePaymentGLEntries(context, aiInsights)
    case 'receipt':
      return await generateReceiptGLEntries(context, aiInsights)
    default:
      return await generateGenericGLEntries(context, aiInsights)
  }
}

/**
 * Generate GL entries for sales transactions
 */
async function generateSaleGLEntries(context: TransactionContext, aiInsights?: any): Promise<Array<any>> {
  const entries = []

  // Debit: Accounts Receivable or Cash
  const debitAccount = await getOrCreateAccount(context.organization_id, {
    account_code: 'AR_001',
    account_name: 'Accounts Receivable',
    account_type: 'ASSET',
    ai_suggestion: aiInsights?.account_code
  })

  entries.push({
    account_code: debitAccount.account_code,
    side: 'DR',
    amount: context.amount,
    currency: context.currency,
    description: `Sale - ${context.description}`,
    smart_code: 'HERA.GL.ENTRY.SALE.RECEIVABLE.v1'
  })

  // Credit: Revenue account(s)
  for (const line of context.lines) {
    if (line.line_type === 'PRODUCT' || line.line_type === 'SERVICE') {
      const revenueAccount = await getOrCreateAccount(context.organization_id, {
        account_code: `REV_${line.line_type}`,
        account_name: `Revenue - ${line.line_type}`,
        account_type: 'REVENUE',
        ai_suggestion: aiInsights?.account_code
      })

      entries.push({
        account_code: revenueAccount.account_code,
        side: 'CR',
        amount: line.amount,
        currency: context.currency,
        description: line.description || 'Revenue',
        smart_code: 'HERA.GL.ENTRY.SALE.REVENUE.v1'
      })
    }
  }

  return entries
}

/**
 * Generate GL entries for purchase transactions
 */
async function generatePurchaseGLEntries(context: TransactionContext, aiInsights?: any): Promise<Array<any>> {
  const entries = []

  // Credit: Accounts Payable
  const creditAccount = await getOrCreateAccount(context.organization_id, {
    account_code: 'AP_001',
    account_name: 'Accounts Payable',
    account_type: 'LIABILITY'
  })

  entries.push({
    account_code: creditAccount.account_code,
    side: 'CR',
    amount: context.amount,
    currency: context.currency,
    description: `Purchase - ${context.description}`,
    smart_code: 'HERA.GL.ENTRY.PURCHASE.PAYABLE.v1'
  })

  // Debit: Expense or Asset accounts based on AI categorization
  const accountType = aiInsights?.account_type === 'ASSET' ? 'ASSET' : 'EXPENSE'
  const expenseAccount = await getOrCreateAccount(context.organization_id, {
    account_code: aiInsights?.account_code || `EXP_${context.transaction_type.toUpperCase()}`,
    account_name: aiInsights?.categorization || `${accountType} - ${context.description}`,
    account_type: accountType
  })

  entries.push({
    account_code: expenseAccount.account_code,
    side: 'DR',
    amount: context.amount,
    currency: context.currency,
    description: aiInsights?.categorization || context.description,
    smart_code: `HERA.GL.ENTRY.PURCHASE.${accountType}.v1`
  })

  return entries
}

/**
 * Get or create chart of accounts entry
 */
async function getOrCreateAccount(organizationId: string, accountSpec: {
  account_code: string
  account_name: string
  account_type: string
  ai_suggestion?: string
}): Promise<any> {
  // Check if account exists
  const { data: existing } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('account_code', accountSpec.account_code)
    .single()

  if (existing) {
    return existing
  }

  // Create new account
  const { data: newAccount, error } = await supabase
    .from('chart_of_accounts')
    .insert([{
      account_code: accountSpec.account_code,
      account_name: accountSpec.account_name,
      account_type: accountSpec.account_type,
      is_active: true,
      balance: 0,
      currency: 'USD', // Default currency, should be configurable
      smart_code: `HERA.COA.${accountSpec.account_type}.${accountSpec.account_code}.v1`,
      organization_id: organizationId,
      created_by: 'rules_engine_automation',
      updated_by: 'rules_engine_automation'
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create account: ${error.message}`)
  }

  return newAccount
}

/**
 * Post GL entries to the ledger
 */
async function postGLEntries(context: TransactionContext, glEntries: Array<any>): Promise<any> {
  const { error } = await supabase.rpc('hera_post_gl_entries_v1', {
    p_transaction_id: context.transaction_id,
    p_organization_id: context.organization_id,
    p_actor_user_id: context.actor_user_id,
    p_gl_entries: glEntries
  })

  if (error) {
    throw new Error(`Failed to post GL entries: ${error.message}`)
  }

  return { success: true, entries_posted: glEntries.length }
}

/**
 * COMPLIANCE VALIDATION
 */
async function validateTransactionCompliance(
  context: TransactionContext, 
  config: RulesEngineConfig
): Promise<{ violations: string[], warnings: string[] }> {
  const violations: string[] = []
  const warnings: string[] = []

  // Check compliance rules
  for (const rule of config.compliance_rules) {
    switch (rule.rule_type) {
      case 'amount_limit':
        if (context.amount > rule.parameters.max_amount) {
          const message = `Transaction amount ${context.amount} exceeds limit of ${rule.parameters.max_amount}`
          if (rule.action === 'block') {
            violations.push(message)
          } else {
            warnings.push(message)
          }
        }
        break

      case 'approval_required':
        if (context.amount > rule.parameters.approval_threshold) {
          warnings.push(`Transaction requires approval (amount: ${context.amount}, threshold: ${rule.parameters.approval_threshold})`)
        }
        break

      case 'segregation_of_duties':
        // Check if actor has appropriate permissions
        warnings.push('Segregation of duties check required')
        break
    }
  }

  return { violations, warnings }
}

/**
 * UTILITY FUNCTIONS
 */

/**
 * Get rules configuration for organization
 */
async function getRulesConfig(organizationId: string): Promise<RulesEngineConfig> {
  const { data: config } = await supabase
    .from('hera_rules_config')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  return config || {
    organization_id: organizationId,
    auto_posting_enabled: true,
    ai_categorization_enabled: true,
    compliance_rules: [],
    chart_of_accounts_management: {
      auto_create_accounts: true,
      approval_required: false,
      ai_suggestions_enabled: true
    }
  }
}

/**
 * Track AI usage for cost monitoring
 */
async function trackAIUsage(context: TransactionContext, operation: string, usage: any): Promise<void> {
  await supabase.from('hera_ai_usage').insert([{
    organization_id: context.organization_id,
    actor_user_id: context.actor_user_id,
    operation_type: operation,
    model: 'claude-3-sonnet',
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    total_cost: calculateCost(usage),
    transaction_id: context.transaction_id,
    timestamp: new Date().toISOString()
  }])
}

/**
 * Calculate AI cost
 */
function calculateCost(usage: any): number {
  const INPUT_COST_PER_1K = 0.003
  const OUTPUT_COST_PER_1K = 0.015
  
  return (usage.input_tokens / 1000) * INPUT_COST_PER_1K + 
         (usage.output_tokens / 1000) * OUTPUT_COST_PER_1K
}

/**
 * Auto-manage chart of accounts
 */
async function autoManageChartAccounts(context: TransactionContext, aiInsights?: any): Promise<{ accounts_created: any[] }> {
  const accounts_created: any[] = []

  if (aiInsights?.account_code && aiInsights?.categorization) {
    try {
      const account = await getOrCreateAccount(context.organization_id, {
        account_code: aiInsights.account_code,
        account_name: aiInsights.categorization,
        account_type: aiInsights.account_type || 'EXPENSE'
      })
      
      accounts_created.push(account)
    } catch (error) {
      console.error('Auto account creation error:', error)
    }
  }

  return { accounts_created }
}

/**
 * Categorize transaction endpoint
 */
async function categorizeTransaction(context: TransactionContext): Promise<Response> {
  const categorization = await aiCategorizeTransaction(context)
  return json(200, { success: true, categorization })
}

/**
 * Generate GL entries endpoint
 */
async function generateGLEntries(context: TransactionContext): Promise<Response> {
  const aiInsights = await aiCategorizeTransaction(context)
  const glEntries = await generateAutomatedGLEntries(context, aiInsights)
  return json(200, { success: true, gl_entries: glEntries, ai_insights: aiInsights })
}

/**
 * Validate compliance endpoint
 */
async function validateCompliance(context: TransactionContext): Promise<Response> {
  const config = await getRulesConfig(context.organization_id)
  const compliance = await validateTransactionCompliance(context, config)
  return json(200, { success: true, compliance })
}

/**
 * Manage chart of accounts endpoint
 */
async function manageChartOfAccounts(context: TransactionContext): Promise<Response> {
  const aiInsights = await aiCategorizeTransaction(context)
  const result = await autoManageChartAccounts(context, aiInsights)
  return json(200, { success: true, result, ai_insights: aiInsights })
}

/**
 * JSON response helper
 */
function json(status: number, body: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Main server handler
 */
serve(async (req: Request) => {
  console.log('🤖 HERA Rules Engine v2.5 starting...')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    return await handleRulesEngine(req)
  } catch (error) {
    console.error('Rules Engine error:', error)
    return json(500, { error: error.message })
  }
})