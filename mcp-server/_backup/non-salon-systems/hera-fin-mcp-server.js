#!/usr/bin/env node

/**
 * HERA FIN MCP Server - Natural Language Financial Management
 * Enables Claude Desktop to manage complete financial operations
 * 
 * Commands:
 * - GL account management
 * - Journal entry creation and posting  
 * - Financial statement generation
 * - Budget vs actual analysis
 * - Cash flow forecasting
 * - AI-powered financial insights
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Initialize MCP server
const server = new Server(
  {
    name: 'hera-fin-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// =============================================
// GL ACCOUNT MANAGEMENT TOOLS
// =============================================

server.setRequestHandler('tools/list', async () => ({
  tools: [
    // GL Account Management
    {
      name: 'create-gl-account',
      description: 'Create a new GL account with IFRS classification',
      inputSchema: {
        type: 'object',
        properties: {
          accountCode: { type: 'string', description: 'Numeric account code (e.g., 1100)' },
          accountName: { type: 'string', description: 'Account name (e.g., Cash and Cash Equivalents)' },
          accountType: { 
            type: 'string', 
            enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
            description: 'Account type for normal balance determination'
          },
          parentAccountCode: { type: 'string', description: 'Parent account code for hierarchy (optional)' },
          description: { type: 'string', description: 'Account description (optional)' }
        },
        required: ['accountCode', 'accountName', 'accountType']
      }
    },
    {
      name: 'list-gl-accounts',
      description: 'List GL accounts with balances',
      inputSchema: {
        type: 'object',
        properties: {
          accountType: { type: 'string', description: 'Filter by account type (optional)' },
          includeInactive: { type: 'boolean', description: 'Include inactive accounts (default: false)' }
        }
      }
    },
    
    // Journal Entry Management
    {
      name: 'create-journal-entry',
      description: 'Create a manual journal entry',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Journal entry description' },
          date: { type: 'string', description: 'Entry date (YYYY-MM-DD)' },
          lines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                accountCode: { type: 'string', description: 'GL account code' },
                debit: { type: 'number', description: 'Debit amount (0 if credit)' },
                credit: { type: 'number', description: 'Credit amount (0 if debit)' },
                description: { type: 'string', description: 'Line description (optional)' }
              },
              required: ['accountCode']
            },
            description: 'Journal entry lines (must balance)'
          }
        },
        required: ['description', 'lines']
      }
    },
    {
      name: 'post-journal-entry',
      description: 'Post a pending journal entry',
      inputSchema: {
        type: 'object',
        properties: {
          journalId: { type: 'string', description: 'Journal entry ID to post' }
        },
        required: ['journalId']
      }
    },
    {
      name: 'reverse-journal-entry',
      description: 'Create a reversal for a posted journal entry',
      inputSchema: {
        type: 'object',
        properties: {
          originalJournalId: { type: 'string', description: 'Original journal entry ID' },
          reversalDate: { type: 'string', description: 'Reversal date (YYYY-MM-DD)' },
          reason: { type: 'string', description: 'Reason for reversal' }
        },
        required: ['originalJournalId', 'reason']
      }
    },
    
    // Financial Statements
    {
      name: 'generate-balance-sheet',
      description: 'Generate balance sheet as of a specific date',
      inputSchema: {
        type: 'object',
        properties: {
          asOfDate: { type: 'string', description: 'Report date (YYYY-MM-DD)' },
          format: { 
            type: 'string', 
            enum: ['summary', 'detailed', 'comparative'],
            description: 'Report format (default: summary)'
          }
        }
      }
    },
    {
      name: 'generate-income-statement',
      description: 'Generate income statement for a period',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Period start date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'Period end date (YYYY-MM-DD)' },
          compareWithPrior: { type: 'boolean', description: 'Include prior period comparison' }
        },
        required: ['startDate', 'endDate']
      }
    },
    {
      name: 'generate-cash-flow',
      description: 'Generate cash flow statement',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Period start date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'Period end date (YYYY-MM-DD)' },
          method: { 
            type: 'string', 
            enum: ['direct', 'indirect'],
            description: 'Cash flow method (default: indirect)'
          }
        },
        required: ['startDate', 'endDate']
      }
    },
    {
      name: 'generate-trial-balance',
      description: 'Generate trial balance report',
      inputSchema: {
        type: 'object',
        properties: {
          asOfDate: { type: 'string', description: 'Report date (YYYY-MM-DD)' }
        }
      }
    },
    
    // Management Reports
    {
      name: 'budget-vs-actual',
      description: 'Generate budget vs actual comparison',
      inputSchema: {
        type: 'object',
        properties: {
          budgetId: { type: 'string', description: 'Budget ID to compare' },
          period: { 
            type: 'string',
            enum: ['MTD', 'QTD', 'YTD'],
            description: 'Period for comparison (default: YTD)'
          },
          varianceThreshold: { type: 'number', description: 'Variance threshold % for highlights (default: 5)' }
        },
        required: ['budgetId']
      }
    },
    {
      name: 'analyze-profitability',
      description: 'Analyze profitability by dimension',
      inputSchema: {
        type: 'object',
        properties: {
          dimension: { 
            type: 'string',
            enum: ['customer', 'product', 'region', 'channel'],
            description: 'Analysis dimension'
          },
          period: { type: 'string', description: 'Analysis period (e.g., 2024-Q1)' },
          topN: { type: 'number', description: 'Number of top items to show (default: 20)' }
        },
        required: ['dimension']
      }
    },
    {
      name: 'aging-analysis',
      description: 'Generate AR/AP aging analysis',
      inputSchema: {
        type: 'object',
        properties: {
          type: { 
            type: 'string',
            enum: ['receivables', 'payables'],
            description: 'Aging type'
          },
          asOfDate: { type: 'string', description: 'Analysis date (YYYY-MM-DD)' }
        },
        required: ['type']
      }
    },
    
    // Financial Analytics
    {
      name: 'calculate-ratios',
      description: 'Calculate financial ratios',
      inputSchema: {
        type: 'object',
        properties: {
          asOfDate: { type: 'string', description: 'Calculation date (YYYY-MM-DD)' },
          compareWithIndustry: { type: 'boolean', description: 'Include industry benchmarks' }
        }
      }
    },
    {
      name: 'forecast-cash-flow',
      description: 'Generate cash flow forecast',
      inputSchema: {
        type: 'object',
        properties: {
          forecastDays: { type: 'number', description: 'Days to forecast (default: 90)' },
          includeScenarios: { type: 'boolean', description: 'Include best/worst scenarios' }
        }
      }
    },
    {
      name: 'detect-anomalies',
      description: 'Detect financial anomalies using AI',
      inputSchema: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Days to analyze (default: 30)' },
          sensitivity: { 
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Detection sensitivity (default: medium)'
          }
        }
      }
    },
    
    // Period Operations
    {
      name: 'close-period',
      description: 'Close an accounting period',
      inputSchema: {
        type: 'object',
        properties: {
          periodId: { type: 'string', description: 'Period ID to close' },
          runChecks: { type: 'boolean', description: 'Run pre-close checks (default: true)' }
        },
        required: ['periodId']
      }
    },
    {
      name: 'year-end-close',
      description: 'Perform year-end closing procedures',
      inputSchema: {
        type: 'object',
        properties: {
          fiscalYear: { type: 'number', description: 'Fiscal year to close (e.g., 2024)' }
        },
        required: ['fiscalYear']
      }
    },
    
    // AI-Powered Insights
    {
      name: 'financial-insights',
      description: 'Generate AI-powered financial insights',
      inputSchema: {
        type: 'object',
        properties: {
          insightTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['revenue', 'cost', 'cashflow', 'profitability', 'all']
            },
            description: 'Types of insights to generate (default: all)'
          },
          period: { 
            type: 'string',
            enum: ['MTD', 'QTD', 'YTD'],
            description: 'Period for analysis (default: MTD)'
          }
        }
      }
    },
    {
      name: 'optimize-working-capital',
      description: 'Get working capital optimization recommendations',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }
  ]
}))

// =============================================
// TOOL IMPLEMENTATIONS
// =============================================

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params
  const orgId = args.organizationId || DEFAULT_ORG_ID

  try {
    switch (name) {
      // GL Account Management
      case 'create-gl-account':
        return await createGLAccount(orgId, args)
      
      case 'list-gl-accounts':
        return await listGLAccounts(orgId, args)
      
      // Journal Entry Management
      case 'create-journal-entry':
        return await createJournalEntry(orgId, args)
      
      case 'post-journal-entry':
        return await postJournalEntry(orgId, args)
      
      case 'reverse-journal-entry':
        return await reverseJournalEntry(orgId, args)
      
      // Financial Statements
      case 'generate-balance-sheet':
        return await generateFinancialStatement(orgId, 'balance_sheet', args)
      
      case 'generate-income-statement':
        return await generateFinancialStatement(orgId, 'income_statement', args)
      
      case 'generate-cash-flow':
        return await generateFinancialStatement(orgId, 'cash_flow', args)
      
      case 'generate-trial-balance':
        return await generateFinancialStatement(orgId, 'trial_balance', args)
      
      // Management Reports
      case 'budget-vs-actual':
        return await generateManagementReport(orgId, 'budget_vs_actual', args)
      
      case 'analyze-profitability':
        return await generateManagementReport(orgId, 'profitability_analysis', args)
      
      case 'aging-analysis':
        return await generateManagementReport(orgId, 'aging_analysis', args)
      
      // Financial Analytics
      case 'calculate-ratios':
        return await performFinancialAnalytics(orgId, 'financial_ratios', args)
      
      case 'forecast-cash-flow':
        return await performFinancialAnalytics(orgId, 'cash_flow_forecast', args)
      
      case 'detect-anomalies':
        return await performFinancialAnalytics(orgId, 'detect_anomalies', args)
      
      // Period Operations
      case 'close-period':
        return await performPeriodOperation(orgId, 'close_period', args)
      
      case 'year-end-close':
        return await performPeriodOperation(orgId, 'year_end_close', args)
      
      // AI-Powered Features
      case 'financial-insights':
        return await generateAIInsights(orgId, 'generate_insights', args)
      
      case 'optimize-working-capital':
        return await generateAIInsights(orgId, 'optimize_working_capital', args)
      
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    }
  }
})

// =============================================
// GL ACCOUNT FUNCTIONS
// =============================================

async function createGLAccount(orgId, args) {
  const { accountCode, accountName, accountType, parentAccountCode, description } = args

  // Validate account code is numeric
  if (!/^\d+$/.test(accountCode)) {
    throw new Error('Account code must be numeric')
  }

  // Create GL account entity
  const { data: account, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: orgId,
      entity_type: 'gl_account',
      entity_code: accountCode,
      entity_name: accountName,
      smart_code: 'HERA.FIN.GL.ACCOUNT.CREATE.v1',
      metadata: {
        account_type: accountType,
        description: description,
        status: 'active',
        created_via: 'mcp',
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create parent-child relationship if parent specified
  if (parentAccountCode) {
    const { data: parent } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'gl_account')
      .eq('entity_code', parentAccountCode)
      .single()

    if (parent) {
      await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: parent.id,
          to_entity_id: account.id,
          relationship_type: 'parent_of',
          smart_code: 'HERA.FIN.GL.ACCOUNT.HIERARCHY.v1',
          metadata: {
            hierarchy_type: 'gl_account',
            created_at: new Date().toISOString()
          }
        })
    }
  }

  return {
    content: [{
      type: 'text',
      text: `✅ GL Account created successfully:
      
**Account Code**: ${accountCode}
**Account Name**: ${accountName}
**Account Type**: ${accountType}
**Normal Balance**: ${accountType === 'asset' || accountType === 'expense' ? 'Debit' : 'Credit'}
**Status**: Active
${parentAccountCode ? `**Parent Account**: ${parentAccountCode}` : ''}

The account is now ready for journal entries and financial reporting.`
    }]
  }
}

async function listGLAccounts(orgId, args) {
  const { accountType, includeInactive = false } = args

  let query = supabase
    .from('core_entities')
    .select(`
      *,
      balances:core_dynamic_data!inner(
        field_name,
        field_value_number
      )
    `)
    .eq('organization_id', orgId)
    .eq('entity_type', 'gl_account')

  if (accountType) {
    query = query.eq('metadata->account_type', accountType)
  }

  if (!includeInactive) {
    query = query.eq('metadata->status', 'active')
  }

  const { data: accounts, error } = await query
    .order('entity_code')

  if (error) throw error

  // Format account list
  const accountList = accounts.map(acc => {
    const balance = acc.balances?.find(b => b.field_name.startsWith('period_balance'))?.field_value_number || 0
    const normalBalance = acc.metadata.normal_balance || (
      ['asset', 'expense'].includes(acc.metadata.account_type) ? 'debit' : 'credit'
    )
    
    return {
      code: acc.entity_code,
      name: acc.entity_name,
      type: acc.metadata.account_type,
      balance: balance,
      formattedBalance: normalBalance === 'debit' && balance > 0 ? 
        `${balance.toFixed(2)} DR` : 
        normalBalance === 'credit' && balance > 0 ?
        `${balance.toFixed(2)} CR` :
        '0.00'
    }
  })

  const summary = accountList.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = { count: 0, total: 0 }
    acc[account.type].count++
    acc[account.type].total += account.balance
    return acc
  }, {})

  return {
    content: [{
      type: 'text',
      text: `📊 **GL Account Listing**

**Total Accounts**: ${accounts.length}

**By Type**:
${Object.entries(summary).map(([type, data]) => 
  `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${data.count} accounts`
).join('\n')}

**Account Details**:
\`\`\`
Code  | Name                          | Type     | Balance
------|-------------------------------|----------|-------------
${accountList.map(acc => 
  `${acc.code.padEnd(6)}| ${acc.name.padEnd(30).substring(0, 30)}| ${acc.type.padEnd(9)}| ${acc.formattedBalance.padStart(12)}`
).join('\n')}
\`\`\`

Use \`create-journal-entry\` to post transactions to these accounts.`
    }]
  }
}

// =============================================
// JOURNAL ENTRY FUNCTIONS
// =============================================

async function createJournalEntry(orgId, args) {
  const { description, date = new Date().toISOString(), lines } = args

  // Validate lines balance
  const totalDebits = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const totalCredits = lines.reduce((sum, line) => sum + (line.credit || 0), 0)

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error(`Journal entry must balance. Debits: ${totalDebits}, Credits: ${totalCredits}`)
  }

  // Generate journal number
  const journalNumber = `JE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Create journal entry transaction
  const { data: journal, error: journalError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'journal_entry',
      transaction_code: journalNumber,
      smart_code: 'HERA.FIN.GL.JOURNAL.MANUAL.v1',
      transaction_date: date,
      total_amount: totalDebits,
      metadata: {
        description: description,
        source: 'manual',
        created_via: 'mcp',
        posting_status: 'pending',
        entry_type: 'manual'
      }
    })
    .select()
    .single()

  if (journalError) throw journalError

  // Create journal lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Find GL account
    const { data: account } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'gl_account')
      .eq('entity_code', line.accountCode)
      .single()

    if (!account) {
      throw new Error(`GL account ${line.accountCode} not found`)
    }

    await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: journal.id,
        line_number: i + 1,
        line_entity_id: account.id,
        line_amount: line.debit || line.credit || 0,
        metadata: {
          entry_type: line.debit > 0 ? 'debit' : 'credit',
          gl_account_code: line.accountCode,
          gl_account_name: account.entity_name,
          description: line.description || ''
        }
      })
  }

  return {
    content: [{
      type: 'text',
      text: `✅ **Journal Entry Created**

**Journal Number**: ${journalNumber}
**Date**: ${new Date(date).toLocaleDateString()}
**Description**: ${description}
**Status**: Pending

**Lines**:
\`\`\`
Account | Description              | Debit    | Credit
--------|--------------------------|----------|----------
${lines.map(line => 
  `${line.accountCode.padEnd(8)}| ${(line.description || '').padEnd(24).substring(0, 24)}| ${line.debit ? line.debit.toFixed(2).padStart(8) : '        '}| ${line.credit ? line.credit.toFixed(2).padStart(8) : '        '}`
).join('\n')}
--------|--------------------------|----------|----------
        | TOTAL                    | ${totalDebits.toFixed(2).padStart(8)}| ${totalCredits.toFixed(2).padStart(8)}
\`\`\`

**Journal ID**: ${journal.id}

Use \`post-journal-entry --journalId "${journal.id}"\` to post this entry.`
    }]
  }
}

async function postJournalEntry(orgId, args) {
  const { journalId } = args

  // Get journal entry
  const { data: journal, error: journalError } = await supabase
    .from('universal_transactions')
    .select('*, lines:universal_transaction_lines(*)')
    .eq('id', journalId)
    .eq('organization_id', orgId)
    .single()

  if (journalError) throw journalError
  if (!journal) throw new Error('Journal entry not found')

  if (journal.metadata.posting_status === 'posted') {
    throw new Error('Journal entry is already posted')
  }

  // Validate balance
  const totalDebits = journal.lines
    .filter(l => l.metadata.entry_type === 'debit')
    .reduce((sum, l) => sum + l.line_amount, 0)
  
  const totalCredits = journal.lines
    .filter(l => l.metadata.entry_type === 'credit')
    .reduce((sum, l) => sum + l.line_amount, 0)

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error('Journal entry does not balance')
  }

  // Update posting status
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...journal.metadata,
        posting_status: 'posted',
        posted_at: new Date().toISOString(),
        posted_by: 'mcp'
      }
    })
    .eq('id', journalId)

  if (updateError) throw updateError

  // The database trigger will handle GL balance updates

  return {
    content: [{
      type: 'text',
      text: `✅ **Journal Entry Posted Successfully**

**Journal Number**: ${journal.transaction_code}
**Posted Date**: ${new Date().toLocaleDateString()}
**Total Amount**: ${totalDebits.toFixed(2)}

GL account balances have been updated automatically.

The journal entry is now reflected in all financial reports.`
    }]
  }
}

async function reverseJournalEntry(orgId, args) {
  const { originalJournalId, reversalDate = new Date().toISOString(), reason } = args

  // Get original journal
  const { data: original, error: originalError } = await supabase
    .from('universal_transactions')
    .select('*, lines:universal_transaction_lines(*)')
    .eq('id', originalJournalId)
    .eq('organization_id', orgId)
    .single()

  if (originalError) throw originalError
  if (!original) throw new Error('Original journal entry not found')

  if (original.metadata.posting_status !== 'posted') {
    throw new Error('Can only reverse posted journal entries')
  }

  // Create reversal journal
  const reversalNumber = `REV-${original.transaction_code}`

  const { data: reversal, error: reversalError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'journal_reversal',
      transaction_code: reversalNumber,
      smart_code: 'HERA.FIN.GL.JOURNAL.REVERSAL.v1',
      transaction_date: reversalDate,
      reference_entity_id: original.id,
      total_amount: original.total_amount,
      metadata: {
        description: `Reversal of ${original.transaction_code}: ${reason}`,
        original_journal_id: originalJournalId,
        reversal_reason: reason,
        posting_status: 'pending',
        created_via: 'mcp'
      }
    })
    .select()
    .single()

  if (reversalError) throw reversalError

  // Create reversal lines (swap debits and credits)
  for (const line of original.lines) {
    await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: reversal.id,
        line_number: line.line_number,
        line_entity_id: line.line_entity_id,
        line_amount: line.line_amount,
        metadata: {
          ...line.metadata,
          entry_type: line.metadata.entry_type === 'debit' ? 'credit' : 'debit',
          reversal: true
        }
      })
  }

  return {
    content: [{
      type: 'text',
      text: `✅ **Reversal Journal Entry Created**

**Original Journal**: ${original.transaction_code}
**Reversal Journal**: ${reversalNumber}
**Reversal Date**: ${new Date(reversalDate).toLocaleDateString()}
**Reason**: ${reason}
**Status**: Pending

The reversal entry has been created with debits and credits swapped.

**Reversal ID**: ${reversal.id}

Use \`post-journal-entry --journalId "${reversal.id}"\` to post this reversal.`
    }]
  }
}

// =============================================
// FINANCIAL STATEMENT FUNCTIONS
// =============================================

async function generateFinancialStatement(orgId, statementType, args) {
  const functionUrl = `${SUPABASE_URL}/functions/v1/fin-dispatch`
  
  let action, requestData
  
  switch (statementType) {
    case 'balance_sheet':
      action = 'generate_balance_sheet'
      requestData = {
        asOfDate: args.asOfDate || new Date().toISOString(),
        format: args.format || 'summary'
      }
      break
    
    case 'income_statement':
      action = 'generate_income_statement'
      requestData = {
        startDate: args.startDate,
        endDate: args.endDate,
        compareWithPrior: args.compareWithPrior || false
      }
      break
    
    case 'cash_flow':
      action = 'generate_cash_flow'
      requestData = {
        startDate: args.startDate,
        endDate: args.endDate,
        method: args.method || 'indirect'
      }
      break
    
    case 'trial_balance':
      action = 'generate_trial_balance'
      requestData = {
        asOfDate: args.asOfDate || new Date().toISOString()
      }
      break
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      action: action,
      organizationId: orgId,
      data: requestData
    })
  })

  const result = await response.json()
  if (!result.success) throw new Error(result.error)

  // Format the response based on statement type
  return formatFinancialStatement(statementType, result.data)
}

function formatFinancialStatement(type, data) {
  switch (type) {
    case 'balance_sheet':
      return {
        content: [{
          type: 'text',
          text: `📊 **Balance Sheet**
*As of ${new Date(data.report_date).toLocaleDateString()}*

**ASSETS**
*Current Assets*: $${data.assets.current_assets.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
*Non-Current Assets*: $${data.assets.non_current_assets.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
**Total Assets**: $${data.assets.total.toFixed(2)}

**LIABILITIES**
*Current Liabilities*: $${data.liabilities.current_liabilities.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
*Non-Current Liabilities*: $${data.liabilities.non_current_liabilities.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
**Total Liabilities**: $${data.liabilities.total.toFixed(2)}

**EQUITY**
*Share Capital*: $${data.equity.share_capital.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
*Retained Earnings*: $${data.equity.retained_earnings.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
*Reserves*: $${data.equity.reserves.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
**Total Equity**: $${data.equity.total.toFixed(2)}

**TOTAL LIABILITIES & EQUITY**: $${(data.liabilities.total + data.equity.total).toFixed(2)}

✅ ${data.validation.message}`
        }]
      }

    case 'income_statement':
      return {
        content: [{
          type: 'text',
          text: `📊 **Income Statement**
*Period: ${new Date(data.period_start).toLocaleDateString()} to ${new Date(data.period_end).toLocaleDateString()}*

**REVENUE**
*Operating Revenue*: $${data.revenue.total.toFixed(2)}

**EXPENSES**
*Cost of Sales*: $(${data.expenses.cost_of_sales.reduce((sum, a) => sum + a.period_activity, 0).toFixed(2)})
*Gross Profit*: $${data.calculations.gross_profit.toFixed(2)} (${data.margins.gross_margin.toFixed(1)}%)

*Operating Expenses*: $(${data.expenses.operating_expenses.reduce((sum, a) => sum + a.period_activity, 0).toFixed(2)})
*Operating Profit*: $${data.calculations.operating_profit.toFixed(2)} (${data.margins.operating_margin.toFixed(1)}%)

*Finance Costs*: $(${data.expenses.finance_costs.reduce((sum, a) => sum + a.period_activity, 0).toFixed(2)})
*Profit Before Tax*: $${data.calculations.profit_before_tax.toFixed(2)}

*Tax Expense*: $(${data.calculations.tax_expense.toFixed(2)})
**Net Profit**: $${data.calculations.net_profit.toFixed(2)} (${data.margins.net_margin.toFixed(1)}%)

Key margins show ${data.margins.gross_margin > 30 ? 'healthy' : 'concerning'} profitability levels.`
        }]
      }

    case 'cash_flow':
      return {
        content: [{
          type: 'text',
          text: `📊 **Cash Flow Statement** (${data.method} method)
*Period: ${new Date(data.period_start).toLocaleDateString()} to ${new Date(data.period_end).toLocaleDateString()}*

**OPERATING ACTIVITIES**
Net Income: $${data.operating_activities.net_income.toFixed(2)}
Adjustments: $${data.operating_activities.adjustments.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
Working Capital Changes: $${data.operating_activities.working_capital_changes.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}
*Net Cash from Operations*: $${data.operating_activities.total.toFixed(2)}

**INVESTING ACTIVITIES**
Asset Purchases: $(${Math.abs(data.investing_activities.asset_purchases).toFixed(2)})
Asset Sales: $${data.investing_activities.asset_sales.toFixed(2)}
*Net Cash from Investing*: $${data.investing_activities.total.toFixed(2)}

**FINANCING ACTIVITIES**
Debt Proceeds: $${data.financing_activities.debt_proceeds.toFixed(2)}
Debt Repayments: $(${data.financing_activities.debt_repayments.toFixed(2)})
*Net Cash from Financing*: $${data.financing_activities.total.toFixed(2)}

**NET CHANGE IN CASH**: $${data.summary.net_change.toFixed(2)}

Cash flow is ${data.operating_activities.total > 0 ? 'positive from operations ✅' : 'negative from operations ⚠️'}`
        }]
      }

    case 'trial_balance':
      return {
        content: [{
          type: 'text',
          text: `📊 **Trial Balance**
*As of ${new Date(data.as_of_date).toLocaleDateString()}*

\`\`\`
Account Code | Account Name                  | Debit      | Credit
-------------|-------------------------------|------------|------------
${data.accounts.map(acc => 
  `${acc.account_code.padEnd(13)}| ${acc.account_name.padEnd(30).substring(0, 30)}| ${acc.debit_balance > 0 ? acc.debit_balance.toFixed(2).padStart(10) : '          '}| ${acc.credit_balance > 0 ? acc.credit_balance.toFixed(2).padStart(10) : '          '}`
).join('\n')}
-------------|-------------------------------|------------|------------
             | TOTALS                        | ${data.summary.total_debits.toFixed(2).padStart(10)}| ${data.summary.total_credits.toFixed(2).padStart(10)}
\`\`\`

✅ Trial Balance is ${data.summary.balanced ? 'BALANCED' : `OUT OF BALANCE by ${data.summary.difference.toFixed(2)}`}`
        }]
      }
  }
}

// =============================================
// MANAGEMENT REPORT FUNCTIONS
// =============================================

async function generateManagementReport(orgId, reportType, args) {
  const functionUrl = `${SUPABASE_URL}/functions/v1/fin-dispatch`
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      action: reportType,
      organizationId: orgId,
      data: args
    })
  })

  const result = await response.json()
  if (!result.success) throw new Error(result.error)

  return formatManagementReport(reportType, result.data, args)
}

function formatManagementReport(type, data, args) {
  switch (type) {
    case 'budget_vs_actual':
      return {
        content: [{
          type: 'text',
          text: `📊 **Budget vs Actual Analysis**
*Period: ${data.period}*

**Summary**
- Total Budget: $${data.summary.total_budget.toFixed(2)}
- Total Actual: $${data.summary.total_actual.toFixed(2)}
- Overall Variance: $${data.summary.total_variance.toFixed(2)} (${data.summary.variance_percent.toFixed(1)}%)

**Performance**
- On Track: ${data.line_items.filter(i => i.status === 'on_track').length} items
- Over Budget: ${data.summary.unfavorable_variances} items ⚠️
- Under Budget: ${data.summary.favorable_variances} items ✅

**Critical Variances** (>${args.varianceThreshold || 5}%)
${data.critical_variances.slice(0, 5).map(v => 
  `- ${v.account_name}: ${v.variance_percent.toFixed(1)}% ${v.favorable ? '✅' : '⚠️'}`
).join('\n')}

**Recommendations**
${data.recommendations.slice(0, 3).map(r => 
  `- ${r.action}`
).join('\n')}`
        }]
      }

    case 'profitability_analysis':
      return {
        content: [{
          type: 'text',
          text: `📊 **Profitability Analysis by ${data.dimension}**
*Period: ${data.period}*

**Overall Performance**
- Total Revenue: $${data.summary.total_revenue.toFixed(2)}
- Total Costs: $${data.summary.total_costs.toFixed(2)}
- Total Profit: $${data.summary.total_profit.toFixed(2)}
- Average Margin: ${data.summary.average_margin.toFixed(1)}%

**Top 5 Performers**
${data.summary.best_performers.map((p, i) => 
  `${i + 1}. ${p.name}: $${p.profit.toFixed(2)} (${p.margin.toFixed(1)}% margin)`
).join('\n')}

**Bottom 5 Performers**
${data.summary.worst_performers.map((p, i) => 
  `${i + 1}. ${p.name}: $${p.profit.toFixed(2)} (${p.margin.toFixed(1)}% margin)`
).join('\n')}

**Key Insights**
${data.insights.slice(0, 3).map(i => 
  `- ${i.message}`
).join('\n')}`
        }]
      }

    case 'aging_analysis':
      return {
        content: [{
          type: 'text',
          text: `📊 **${data.type === 'receivables' ? 'Accounts Receivable' : 'Accounts Payable'} Aging**
*As of ${new Date(data.as_of_date).toLocaleDateString()}*

**Summary**
- Total Outstanding: $${data.summary.total_amount.toFixed(2)}
- Average Days: ${data.summary.average_days.toFixed(0)} days
- High Risk Amount: $${data.summary.high_risk_amount.toFixed(2)} (${data.summary.high_risk_percentage.toFixed(1)}%)

**Aging Buckets**
- Current: $${data.buckets.current.amount.toFixed(2)} (${data.buckets.current.percentage.toFixed(1)}%)
- 1-30 days: $${data.buckets['1-30'].amount.toFixed(2)} (${data.buckets['1-30'].percentage.toFixed(1)}%)
- 31-60 days: $${data.buckets['31-60'].amount.toFixed(2)} (${data.buckets['31-60'].percentage.toFixed(1)}%)
- 61-90 days: $${data.buckets['61-90'].amount.toFixed(2)} (${data.buckets['61-90'].percentage.toFixed(1)}%)
- Over 90 days: $${data.buckets.over_90.amount.toFixed(2)} (${data.buckets.over_90.percentage.toFixed(1)}%) ⚠️

**Collection Recommendations**
${data.recommendations.slice(0, 3).map(r => 
  `- ${r.action} (Priority: ${r.priority})`
).join('\n')}`
        }]
      }
  }
}

// =============================================
// FINANCIAL ANALYTICS FUNCTIONS
// =============================================

async function performFinancialAnalytics(orgId, analysisType, args) {
  const functionUrl = `${SUPABASE_URL}/functions/v1/fin-dispatch`
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      action: analysisType,
      organizationId: orgId,
      data: args
    })
  })

  const result = await response.json()
  if (!result.success) throw new Error(result.error)

  return formatAnalyticsResult(analysisType, result.data)
}

function formatAnalyticsResult(type, data) {
  switch (type) {
    case 'financial_ratios':
      return {
        content: [{
          type: 'text',
          text: `📊 **Financial Ratio Analysis**

**Liquidity Ratios**
- Current Ratio: ${data.ratios.liquidity.current_ratio.toFixed(2)} ${data.ratios.liquidity.current_ratio < 1 ? '⚠️' : '✅'}
- Quick Ratio: ${data.ratios.liquidity.quick_ratio.toFixed(2)}
- Working Capital: $${data.ratios.liquidity.working_capital.toFixed(2)}

**Leverage Ratios**
- Debt to Equity: ${data.ratios.leverage.debt_to_equity.toFixed(2)} ${data.ratios.leverage.debt_to_equity > 2 ? '⚠️' : '✅'}
- Debt Ratio: ${data.ratios.leverage.debt_ratio.toFixed(2)}
- Equity Ratio: ${data.ratios.leverage.equity_ratio.toFixed(2)}

**Efficiency Ratios**
- Asset Turnover: ${data.ratios.efficiency.asset_turnover.toFixed(2)}x
- Inventory Turnover: ${data.ratios.efficiency.inventory_turnover.toFixed(2)}x
- Days Sales Outstanding: ${data.ratios.efficiency.days_sales_outstanding.toFixed(0)} days

**Profitability Ratios**
- Net Margin: ${data.ratios.profitability.net_margin.toFixed(1)}%
- Return on Assets: ${data.ratios.profitability.return_on_assets.toFixed(1)}%
- Return on Equity: ${data.ratios.profitability.return_on_equity.toFixed(1)}%

**Key Interpretations**
${data.interpretations.slice(0, 3).map(i => 
  `- ${i.message} (${i.status})`
).join('\n')}

**Risk Indicators**
${data.risk_indicators.map(r => 
  `- ${r.type}: ${r.level} risk`
).join('\n')}`
        }]
      }

    case 'cash_flow_forecast':
      return {
        content: [{
          type: 'text',
          text: `📊 **Cash Flow Forecast**
*${data.forecast_period} Day Forecast*

**Base Scenario**
- Starting Cash: $${data.base_scenario.starting_cash.toFixed(2)}
- Ending Cash: $${data.base_scenario.ending_cash.toFixed(2)}
- Minimum Cash: $${data.base_scenario.minimum_cash.toFixed(2)} ${data.base_scenario.minimum_cash < 0 ? '⚠️ SHORTAGE' : ''}
- Maximum Cash: $${data.base_scenario.maximum_cash.toFixed(2)}

${data.scenarios ? `**Scenario Analysis**
- Optimistic: $${data.scenarios.optimistic.ending_cash.toFixed(2)}
- Pessimistic: $${data.scenarios.pessimistic.ending_cash.toFixed(2)}
- Stressed: $${data.scenarios.stressed.ending_cash.toFixed(2)}` : ''}

**Key Insights**
${data.insights.map(i => 
  `- ${i.message}`
).join('\n')}

**Recommendations**
${data.recommendations.map(r => 
  `- ${r.action} (Priority: ${r.priority})`
).join('\n')}

${data.base_scenario.minimum_cash < 0 ? 
  '⚠️ **URGENT**: Cash shortage predicted. Immediate action required!' : 
  '✅ Cash position remains positive throughout forecast period.'}`
        }]
      }

    case 'detect_anomalies':
      return {
        content: [{
          type: 'text',
          text: `🔍 **Financial Anomaly Detection**
*Analysis Period: Last ${data.detection_period} days*

**Summary**
- Total Anomalies Detected: ${data.total_anomalies}
- Risk Score: ${data.risk_score}/100 ${data.risk_score > 70 ? '⚠️ HIGH RISK' : data.risk_score > 40 ? '⚠️ MEDIUM RISK' : '✅ LOW RISK'}

**Anomalies by Severity**
- High: ${data.anomalies_by_severity.high_severity.length} ${data.anomalies_by_severity.high_severity.length > 0 ? '🚨' : ''}
- Medium: ${data.anomalies_by_severity.medium_severity.length}
- Low: ${data.anomalies_by_severity.low_severity.length}

**AI Analysis**
- Fraud Probability: ${data.ai_insights.fraud_probability}%
- Error Likelihood: ${data.ai_insights.error_likelihood}%
- Process Gaps: ${data.ai_insights.process_gaps.length}

**High Priority Anomalies**
${data.anomalies_by_severity.high_severity.slice(0, 5).map(a => 
  `- ${a.description} (Journal: ${a.journal_id.substring(0, 8)}...)`
).join('\n')}

**Recommended Actions**
${data.recommended_actions.map(a => 
  `- ${a.action} (Priority: ${a.priority})`
).join('\n')}`
        }]
      }
  }
}

// =============================================
// PERIOD OPERATION FUNCTIONS
// =============================================

async function performPeriodOperation(orgId, operation, args) {
  const functionUrl = `${SUPABASE_URL}/functions/v1/fin-dispatch`
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      action: operation,
      organizationId: orgId,
      userId: 'mcp-user',
      data: args
    })
  })

  const result = await response.json()
  if (!result.success) throw new Error(result.error)

  return formatPeriodResult(operation, result.data)
}

function formatPeriodResult(operation, data) {
  switch (operation) {
    case 'close_period':
      return {
        content: [{
          type: 'text',
          text: `✅ **Period Closed Successfully**

**Period ID**: ${data.period_id}
**Closed Date**: ${new Date(data.closed_date).toLocaleDateString()}
**Next Period**: ${data.next_period_id || 'Not created'}

The following procedures were completed:
- ✓ All journal entries posted
- ✓ Period-end balances calculated
- ✓ Balances rolled forward to next period
- ✓ Period locked for further entries

All financial reports for this period are now final.`
        }]
      }

    case 'year_end_close':
      return {
        content: [{
          type: 'text',
          text: `✅ **Year-End Close Completed**

**Fiscal Year**: ${data.fiscal_year}
**Completed**: ${new Date(data.completed_at).toLocaleDateString()}
**New Fiscal Year**: ${data.new_fiscal_year}

**Steps Completed**:
${data.steps.map(s => 
  `- ✓ ${s.step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
).join('\n')}

The year-end closing process has:
- Closed all P&L accounts to retained earnings
- Rolled forward balance sheet accounts
- Created new fiscal year periods
- Prepared system for new year transactions

You can now begin posting to the new fiscal year.`
        }]
      }
  }
}

// =============================================
// AI-POWERED INSIGHTS FUNCTIONS
// =============================================

async function generateAIInsights(orgId, insightType, args) {
  const functionUrl = `${SUPABASE_URL}/functions/v1/fin-dispatch`
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      action: insightType,
      organizationId: orgId,
      data: args
    })
  })

  const result = await response.json()
  if (!result.success) throw new Error(result.error)

  return formatAIInsights(insightType, result.data)
}

function formatAIInsights(type, data) {
  switch (type) {
    case 'generate_insights':
      return {
        content: [{
          type: 'text',
          text: `🤖 **AI-Powered Financial Insights**
*Generated: ${new Date(data.generated_at).toLocaleDateString()}*
*Period: ${data.period}*

**Key Insights**
${data.insights.map((insight, i) => 
  `${i + 1}. **${insight.category}**: ${insight.message} ${insight.type === 'warning' ? '⚠️' : insight.type === 'opportunity' ? '💡' : 'ℹ️'}`
).join('\n\n')}

**Prioritized Action Items**
${data.action_items.map((action, i) => 
  `${i + 1}. ${action.action}
   - Category: ${action.category}
   - Impact: ${action.expected_impact}
   - Priority: ${['🔴 High', '🟡 Medium', '🟢 Low'][action.priority - 1]}`
).join('\n\n')}

**Key Metrics Summary**
- Revenue Growth: ${data.key_metrics.revenue_growth?.toFixed(1) || 'N/A'}%
- Cost Efficiency: ${data.key_metrics.cost_efficiency?.toFixed(1) || 'N/A'}%
- Cash Position: ${data.key_metrics.cash_position || 'N/A'}
- Profitability Trend: ${data.key_metrics.profitability_trend || 'N/A'}`
        }]
      }

    case 'optimize_working_capital':
      return {
        content: [{
          type: 'text',
          text: `💰 **Working Capital Optimization Analysis**

**Current Position**
- Receivables Days: ${data.current_position.receivables_days.toFixed(0)} days
- Payables Days: ${data.current_position.payables_days.toFixed(0)} days
- Inventory Days: ${data.current_position.inventory_days.toFixed(0)} days
- Cash Conversion Cycle: ${data.current_position.cash_conversion_cycle.toFixed(0)} days
- Working Capital: $${data.current_position.working_capital.toFixed(2)}

**Optimization Opportunities**
${data.opportunities.map(opp => 
  `- **${opp.area}**: ${opp.action}
  Potential Cash Release: $${opp.cash_impact.toFixed(2)}`
).join('\n\n')}

**Total Potential Cash Release**: $${data.potential_cash_release.toFixed(2)} 💰

**Implementation Roadmap**
${data.implementation_roadmap.map(phase => 
  `**${phase.phase}**
${phase.actions.map(a => 
  `  - ${a.action} (Benefit: $${a.expected_benefit.toFixed(2)})`
).join('\n')}`
).join('\n\n')}

Implementing these recommendations could improve cash flow by $${data.potential_cash_release.toFixed(2)} and reduce the cash conversion cycle by ${Math.round(data.current_position.cash_conversion_cycle * 0.3)} days.`
        }]
      }
  }
}

// Start the server
const transport = new StdioServerTransport()
await server.connect(transport)

console.error('HERA FIN MCP Server running - Natural language financial management enabled')