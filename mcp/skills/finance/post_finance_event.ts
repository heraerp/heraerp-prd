/**
 * HERA MCP Skill: Post Finance Event
 * 
 * Natural language interface for posting finance events through the MDA system.
 * Parses plain English descriptions and converts them to Universal Finance Events (UFE).
 * 
 * Examples:
 * - "Paid stylist salary AED 15,000 from Emirates NBD on 2025-10-05"
 * - "Record rent AED 12,500 (Oct)"
 * - "Import bank line: POS settlement AED 7,820 less fee 1.5%"
 * - "Post EOD POS summary for Downtown branch"
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { UniversalFinanceEvent, SALON_FINANCE_SMART_CODES, FINANCE_TRANSACTION_TYPES, createSalonUFE } from '../../../src/types/universal-finance-event'

interface ParsedFinanceEvent {
  operation_type: 'expense' | 'revenue' | 'pos_eod' | 'bank_fee' | 'transfer' | 'adjustment'
  amount: number
  currency: string
  date: string
  description: string
  category?: string
  smart_code?: string
  transaction_type?: string
  channel: 'MCP' | 'POS' | 'BANK' | 'MANUAL' | 'IMPORT'
  additional_context?: any
}

/**
 * MCP Tool Definition
 */
export const postFinanceEventTool: Tool = {
  name: 'post_finance_event',
  description: 'Parse natural language finance descriptions and post them through HERA MDA system',
  inputSchema: {
    type: 'object',
    properties: {
      organization_id: {
        type: 'string',
        format: 'uuid',
        description: 'Organization UUID for multi-tenant isolation'
      },
      description: {
        type: 'string',
        description: 'Natural language description of the finance event',
        examples: [
          'Paid stylist salary AED 15,000 from Emirates NBD on 2025-10-05',
          'Record rent AED 12,500 (Oct)',
          'Import bank line: POS settlement AED 7,820 less fee 1.5%',
          'Post EOD POS summary for Downtown branch',
          'Commission payment AED 3,500 to Sarah (October)',
          'Utilities bill DEWA AED 850 paid via bank transfer',
          'Hair product supplies AED 2,300 from supplier ABC',
          'Marketing expense Facebook ads AED 1,200',
          'Insurance premium AED 4,500 annual payment',
          'Equipment maintenance salon chairs AED 950'
        ]
      },
      force_posting_date: {
        type: 'string',
        format: 'date',
        description: 'Override posting date (YYYY-MM-DD), otherwise extracted from description or uses today'
      },
      dry_run: {
        type: 'boolean',
        default: false,
        description: 'Parse and validate only, do not actually post'
      }
    },
    required: ['organization_id', 'description']
  }
}

/**
 * Advanced NLP parser for finance events
 */
export class FinanceEventParser {
  private static readonly EXPENSE_KEYWORDS = {
    'salary': { category: 'SALARY', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY },
    'wage': { category: 'SALARY', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SALARY },
    'commission': { category: 'COMMISSION', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.COMMISSION },
    'rent': { category: 'RENT', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.RENT },
    'utilities': { category: 'UTILITIES', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES },
    'dewa': { category: 'UTILITIES', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES },
    'electricity': { category: 'UTILITIES', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES },
    'water': { category: 'UTILITIES', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES },
    'internet': { category: 'UTILITIES', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.UTILITIES },
    'supplies': { category: 'SUPPLIES', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SUPPLIES },
    'product': { category: 'SUPPLIES', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.SUPPLIES },
    'marketing': { category: 'MARKETING', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.MARKETING },
    'advertising': { category: 'MARKETING', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.MARKETING },
    'facebook': { category: 'MARKETING', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.MARKETING },
    'instagram': { category: 'MARKETING', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.MARKETING },
    'insurance': { category: 'INSURANCE', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.INSURANCE },
    'maintenance': { category: 'MAINTENANCE', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.MAINTENANCE },
    'repair': { category: 'MAINTENANCE', smart_code: SALON_FINANCE_SMART_CODES.EXPENSE.MAINTENANCE }
  }
  
  private static readonly REVENUE_KEYWORDS = {
    'service': { category: 'SERVICE', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE },
    'haircut': { category: 'SERVICE', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE },
    'color': { category: 'SERVICE', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE },
    'treatment': { category: 'SERVICE', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE },
    'styling': { category: 'SERVICE', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.SERVICE },
    'product': { category: 'PRODUCT', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.PRODUCT },
    'shampoo': { category: 'PRODUCT', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.PRODUCT },
    'conditioner': { category: 'PRODUCT', smart_code: SALON_FINANCE_SMART_CODES.REVENUE.PRODUCT }
  }
  
  private static readonly BANK_KEYWORDS = {
    'fee': { category: 'FEE', smart_code: SALON_FINANCE_SMART_CODES.BANK.FEE },
    'charge': { category: 'FEE', smart_code: SALON_FINANCE_SMART_CODES.BANK.FEE },
    'transfer': { category: 'TRANSFER', smart_code: SALON_FINANCE_SMART_CODES.BANK.TRANSFER },
    'deposit': { category: 'DEPOSIT', smart_code: SALON_FINANCE_SMART_CODES.BANK.DEPOSIT }
  }
  
  private static readonly CURRENCY_REGEX = /(AED|USD|GBP|EUR)\s*([0-9,]+(?:\.[0-9]{2})?)/gi
  private static readonly DATE_REGEX = /(\d{4}-\d{2}-\d{2})/g
  private static readonly MONTH_NAMES = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'june': '06', 'july': '07', 'august': '08', 'september': '09',
    'october': '10', 'november': '11', 'december': '12'
  }
  
  /**
   * Parse natural language description into structured finance event
   */
  static parseDescription(description: string): ParsedFinanceEvent {
    const lowerDesc = description.toLowerCase()
    const today = new Date().toISOString().split('T')[0]
    
    // Extract currency and amount
    const currencyMatch = this.CURRENCY_REGEX.exec(description)
    let currency = 'AED'
    let amount = 0
    
    if (currencyMatch) {
      currency = currencyMatch[1]
      amount = parseFloat(currencyMatch[2].replace(/,/g, ''))
    }
    
    // Extract date
    let date = today
    const dateMatch = this.DATE_REGEX.exec(description)
    if (dateMatch) {
      date = dateMatch[1]
    } else {
      // Look for month names
      for (const [monthName, monthNum] of Object.entries(this.MONTH_NAMES)) {
        if (lowerDesc.includes(monthName)) {
          const currentYear = new Date().getFullYear()
          date = `${currentYear}-${monthNum}-01`
          break
        }
      }
    }
    
    // Determine operation type and category
    let operationType: ParsedFinanceEvent['operation_type'] = 'expense'
    let category = ''
    let smartCode = ''
    let channel: ParsedFinanceEvent['channel'] = 'MCP'
    
    // Check for POS EOD summary
    if (lowerDesc.includes('eod') || lowerDesc.includes('end of day') || lowerDesc.includes('daily summary')) {
      operationType = 'pos_eod'
      category = 'DAILY_SUMMARY'
      smartCode = SALON_FINANCE_SMART_CODES.POS.DAILY_SUMMARY
      channel = 'POS'
    }
    // Check for bank operations
    else if (lowerDesc.includes('bank') || lowerDesc.includes('transfer') || lowerDesc.includes('fee')) {
      operationType = 'bank_fee'
      channel = 'BANK'
      
      for (const [keyword, config] of Object.entries(this.BANK_KEYWORDS)) {
        if (lowerDesc.includes(keyword)) {
          category = config.category
          smartCode = config.smart_code
          break
        }
      }
    }
    // Check for revenue keywords
    else if (lowerDesc.includes('sale') || lowerDesc.includes('income') || lowerDesc.includes('revenue')) {
      operationType = 'revenue'
      
      for (const [keyword, config] of Object.entries(this.REVENUE_KEYWORDS)) {
        if (lowerDesc.includes(keyword)) {
          category = config.category
          smartCode = config.smart_code
          break
        }
      }
      
      if (!smartCode) {
        smartCode = SALON_FINANCE_SMART_CODES.REVENUE.SERVICE // Default to service
      }
    }
    // Check for expense keywords (default)
    else {
      operationType = 'expense'
      
      for (const [keyword, config] of Object.entries(this.EXPENSE_KEYWORDS)) {
        if (lowerDesc.includes(keyword)) {
          category = config.category
          smartCode = config.smart_code
          break
        }
      }
      
      if (!smartCode) {
        // Default expense categorization based on common words
        if (lowerDesc.includes('staff') || lowerDesc.includes('employee')) {
          smartCode = SALON_FINANCE_SMART_CODES.EXPENSE.SALARY
          category = 'SALARY'
        } else {
          smartCode = SALON_FINANCE_SMART_CODES.EXPENSE.SUPPLIES // Generic fallback
          category = 'SUPPLIES'
        }
      }
    }
    
    // Detect import source
    if (lowerDesc.includes('import') || lowerDesc.includes('bank line')) {
      channel = 'IMPORT'
    } else if (lowerDesc.includes('manual') || lowerDesc.includes('adjustment')) {
      channel = 'MANUAL'
    }
    
    return {
      operation_type: operationType,
      amount,
      currency,
      date,
      description: description.trim(),
      category,
      smart_code: smartCode,
      transaction_type: this.getTransactionType(operationType),
      channel
    }
  }
  
  private static getTransactionType(operationType: string): string {
    switch (operationType) {
      case 'expense': return FINANCE_TRANSACTION_TYPES.EXPENSE
      case 'revenue': return FINANCE_TRANSACTION_TYPES.REVENUE
      case 'pos_eod': return FINANCE_TRANSACTION_TYPES.POS_EOD
      case 'bank_fee': return FINANCE_TRANSACTION_TYPES.BANK_FEE
      case 'transfer': return FINANCE_TRANSACTION_TYPES.TRANSFER
      case 'adjustment': return FINANCE_TRANSACTION_TYPES.ADJUSTMENT
      default: return FINANCE_TRANSACTION_TYPES.EXPENSE
    }
  }
}

/**
 * MCP Skill Implementation
 */
export async function postFinanceEvent(args: {
  organization_id: string
  description: string
  force_posting_date?: string
  dry_run?: boolean
}): Promise<any> {
  try {
    console.log(`[MCP Finance] Processing: "${args.description}"`)
    
    // Parse the natural language description
    const parsed = FinanceEventParser.parseDescription(args.description)
    
    // Override date if provided
    if (args.force_posting_date) {
      parsed.date = args.force_posting_date
    }
    
    // Validate parsing results
    if (parsed.amount <= 0) {
      return {
        success: false,
        error: 'Could not extract a valid amount from description. Please include amount like "AED 15,000"',
        parsed_info: parsed,
        suggestions: [
          'Include currency and amount: "AED 15,000"',
          'Use formats like: "USD 1,250.50" or "GBP 850"',
          'Ensure amount is positive and properly formatted'
        ]
      }
    }
    
    if (!parsed.smart_code) {
      return {
        success: false,
        error: 'Could not determine the type of finance operation from description',
        parsed_info: parsed,
        suggestions: [
          'Be more specific about the operation type',
          'Use keywords like: salary, rent, utilities, supplies, marketing, etc.',
          'For revenue: use service, product, sale, income',
          'For POS: use "EOD summary" or "end of day"'
        ]
      }
    }
    
    // Create Universal Finance Event
    const ufe: UniversalFinanceEvent = {
      organization_id: args.organization_id,
      transaction_type: parsed.transaction_type!,
      smart_code: parsed.smart_code,
      transaction_date: parsed.date,
      total_amount: parsed.amount,
      transaction_currency_code: parsed.currency,
      base_currency_code: parsed.currency,
      exchange_rate: 1.0,
      business_context: {
        channel: parsed.channel,
        note: parsed.description,
        category: parsed.category
      },
      metadata: {
        ingest_source: 'MCP_NLP_Parser',
        original_ref: `MCP:${Date.now()}`,
        correlation_id: crypto.randomUUID()
      },
      lines: []
    }
    
    // Handle POS EOD special case
    if (parsed.operation_type === 'pos_eod') {
      // For POS EOD, we need totals breakdown
      // This is a simplified example - in reality you'd extract these from description
      ufe.totals = {
        gross_sales: parsed.amount,
        vat: parsed.amount * 0.05, // Assume 5% VAT
        tips: 0,
        fees: 0,
        cash_collected: parsed.amount * 0.3, // Assume 30% cash
        card_settlement: parsed.amount * 0.7 // Assume 70% cards
      }
    }
    
    if (args.dry_run) {
      return {
        success: true,
        dry_run: true,
        parsed_info: parsed,
        generated_ufe: ufe,
        message: 'Successfully parsed and validated. Ready to post.',
        next_steps: [
          'Remove dry_run flag to actually post the transaction',
          'Review the generated UFE structure above',
          'Verify the smart code and amounts are correct'
        ]
      }
    }
    
    // Post through UFE API
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v2/transactions/post`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hera-api-version': 'v2',
        'Authorization': 'Bearer demo-token-salon-manager' // Demo token
      },
      body: JSON.stringify(ufe)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: 'UFE API call failed',
        api_response: result,
        parsed_info: parsed,
        generated_ufe: ufe,
        suggestions: result.error?.validation_errors || result.error?.posting_errors || [
          'Check if organization ID is valid',
          'Verify posting rules are configured for this organization',
          'Ensure Chart of Accounts is set up',
          'Check if fiscal period is open for posting'
        ]
      }
    }
    
    return {
      success: true,
      message: `✅ Successfully posted ${parsed.operation_type} of ${parsed.currency} ${parsed.amount.toLocaleString()}`,
      parsed_info: parsed,
      transaction_id: result.data?.transaction_id,
      journal_entry_id: result.data?.journal_entry_id,
      posting_period: result.data?.posting_period,
      gl_lines: result.data?.gl_lines,
      api_response: result
    }
    
  } catch (error) {
    console.error('[MCP Finance] Error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      suggestions: [
        'Check if the API server is running',
        'Verify network connectivity',
        'Ensure proper authentication tokens',
        'Check server logs for detailed error information'
      ]
    }
  }
}

/**
 * Enhanced parsing examples for testing
 */
export const PARSING_EXAMPLES = {
  expenses: [
    {
      input: "Paid stylist salary AED 15,000 from Emirates NBD on 2025-10-05",
      expected: {
        operation_type: 'expense',
        amount: 15000,
        currency: 'AED',
        date: '2025-10-05',
        category: 'SALARY'
      }
    },
    {
      input: "Record rent AED 12,500 (Oct)",
      expected: {
        operation_type: 'expense',
        amount: 12500,
        currency: 'AED',
        category: 'RENT'
      }
    },
    {
      input: "Commission payment AED 3,500 to Sarah (October)",
      expected: {
        operation_type: 'expense',
        amount: 3500,
        currency: 'AED',
        category: 'COMMISSION'
      }
    },
    {
      input: "Utilities bill DEWA AED 850 paid via bank transfer",
      expected: {
        operation_type: 'expense',
        amount: 850,
        currency: 'AED',
        category: 'UTILITIES'
      }
    }
  ],
  revenue: [
    {
      input: "Hair service revenue AED 450 from customer payment",
      expected: {
        operation_type: 'revenue',
        amount: 450,
        currency: 'AED',
        category: 'SERVICE'
      }
    },
    {
      input: "Product sale shampoo AED 120 cash payment",
      expected: {
        operation_type: 'revenue',
        amount: 120,
        currency: 'AED',
        category: 'PRODUCT'
      }
    }
  ],
  pos_eod: [
    {
      input: "Post EOD POS summary for Downtown branch AED 8,500",
      expected: {
        operation_type: 'pos_eod',
        amount: 8500,
        currency: 'AED',
        category: 'DAILY_SUMMARY',
        channel: 'POS'
      }
    }
  ],
  banking: [
    {
      input: "Bank fee Emirates NBD AED 25 monthly charge",
      expected: {
        operation_type: 'bank_fee',
        amount: 25,
        currency: 'AED',
        category: 'FEE',
        channel: 'BANK'
      }
    },
    {
      input: "Import bank line: POS settlement AED 7,820 less fee 1.5%",
      expected: {
        operation_type: 'expense', // The fee part
        amount: 7820,
        currency: 'AED',
        channel: 'IMPORT'
      }
    }
  ]
}

// Export the tool for MCP server registration
export default postFinanceEventTool