/**
 * HERA MCP-Powered Digital Accountant
 * Smart Code: HERA.MCP.DIGITAL.ACCOUNTANT.v1
 * 
 * Uses Claude as the brain via MCP tools instead of pattern matching
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAnalyticsChatStorage } from '@/lib/analytics-chat-storage'

// MCP tool definitions for accounting
const MCP_ACCOUNTING_TOOLS = {
  queryGLAccounts: {
    description: "Query general ledger accounts with optional filters. Returns account details and current balances.",
    parameters: {
      organizationId: "string - Organization ID (required)",
      accountCode: "string - Specific account code to query (optional)",
      accountType: "string - Filter by account type (asset, liability, equity, revenue, expense) (optional)",
      includeBalance: "boolean - Calculate and include current balance (optional)"
    }
  },
  
  createJournalEntry: {
    description: "Create a journal entry with debits and credits. Automatically validates that debits equal credits.",
    parameters: {
      organizationId: "string - Organization ID (required)",
      date: "string - Transaction date YYYY-MM-DD (optional, defaults to today)",
      description: "string - Journal entry description",
      lines: "array - Journal entry lines with {accountCode, debit, credit, memo}",
      smartCode: "string - Smart code for the transaction (optional)"
    }
  },
  
  recordSalonTransaction: {
    description: "Record a salon-specific transaction (sale, expense, commission). Handles VAT calculation and categorization.",
    parameters: {
      organizationId: "string - Organization ID (required)",
      type: "string - Transaction type: 'sale', 'expense', or 'commission'",
      amount: "number - Transaction amount",
      description: "string - Transaction description (optional)",
      clientName: "string - Client name for sales (optional)",
      vendorName: "string - Vendor name for expenses (optional)",
      staffName: "string - Staff name for commissions (optional)",
      serviceType: "string - Service type for sales (optional)",
      expenseCategory: "string - Expense category (optional)",
      commissionRate: "number - Commission percentage (optional)",
      includeVAT: "boolean - Whether amount includes VAT (default: true)"
    }
  },
  
  getTransactionHistory: {
    description: "Retrieve transaction history with filters. Useful for summaries, reports, and finding specific transactions.",
    parameters: {
      organizationId: "string - Organization ID (required)",
      startDate: "string - Start date YYYY-MM-DD (optional)",
      endDate: "string - End date YYYY-MM-DD (optional)",
      transactionType: "string - Filter by transaction type (optional)",
      minAmount: "number - Minimum transaction amount (optional)",
      maxAmount: "number - Maximum transaction amount (optional)",
      searchTerm: "string - Search in descriptions and metadata (optional)",
      limit: "number - Maximum number of results, default 50 (optional)"
    }
  },
  
  calculateDailySummary: {
    description: "Calculate daily summary including revenue, expenses, commissions, and net profit for a salon.",
    parameters: {
      organizationId: "string - Organization ID (required)",
      date: "string - Date to summarize YYYY-MM-DD (optional, defaults to today)",
      includeDetails: "boolean - Include transaction details (optional, default false)"
    }
  },
  
  processCommissionPayment: {
    description: "Process a commission payment for staff. Updates pending commission to paid status.",
    parameters: {
      organizationId: "string - Organization ID (required)",
      transactionId: "string - Commission transaction ID to process (optional, provide this or staffName)",
      staffName: "string - Staff name if no transaction ID (optional)",
      paymentMethod: "string - Payment method: 'cash', 'bank_transfer', or 'check' (default: cash)"
    }
  },
  
  postTransactionToGL: {
    description: "Post a draft transaction to the general ledger. Creates journal entries and updates GL balances.",
    parameters: {
      organizationId: "string - Organization ID (required)",
      transactionId: "string - Transaction ID to post (required)",
      postingDate: "string - GL posting date YYYY-MM-DD (optional)"
    }
  }
}

// System prompt for Claude
const CLAUDE_SYSTEM_PROMPT = `You are a friendly and helpful digital accountant assistant for HERA ERP. You have access to powerful MCP tools that let you directly interact with the accounting database.

Your personality:
- Friendly and conversational, especially for salon owners who may not know accounting
- Professional but not overly formal
- Proactive in understanding what the user needs
- Educational when appropriate, but focused on getting things done

Key capabilities:
1. Recording transactions (sales, expenses, commissions)
2. Creating journal entries
3. Querying account balances
4. Generating daily summaries and reports
5. Processing payments
6. Posting transactions to the general ledger

For salon mode specifically:
- Use simple language, avoid accounting jargon
- Focus on practical business operations
- Automatically handle VAT calculations
- Be encouraging and supportive

Remember to:
- Always use the organization ID provided in the context
- Validate data before creating transactions
- Provide clear confirmations of actions taken
- Ask for clarification when needed
- Use the appropriate MCP tools to fulfill requests

Available MCP tools:
${Object.entries(MCP_ACCOUNTING_TOOLS).map(([name, tool]) => 
  `- ${name}: ${tool.description}`
).join('\n')}

When users say things like "pay now" after a commission calculation, use the processCommissionPayment tool to complete the payment.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, organizationId, context, sessionId } = body
    
    if (!message || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Message and organizationId are required'
      }, { status: 400 })
    }
    
    // Initialize chat storage for context
    const chatStorage = createAnalyticsChatStorage()
    
    // Save user message
    await chatStorage.saveMessage({
      session_id: sessionId || `mcp-${Date.now()}`,
      message_type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: { organizationId, context }
    })
    
    // Get conversation history for context
    const history = sessionId ? await chatStorage.getRecentMessages(sessionId, 10) : []
    
    // Build conversation context
    const conversationContext = history.map(msg => ({
      role: msg.message_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))
    
    // Call Claude via Universal AI with MCP tools
    const aiResponse = await fetch(`${request.url.origin}/api/v1/ai/universal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'custom_request',
        smart_code: 'HERA.MCP.ACCOUNTING.CHAT.v1',
        task_type: 'mcp_chat',
        prompt: message,
        context: {
          system_prompt: CLAUDE_SYSTEM_PROMPT,
          conversation_history: conversationContext,
          organization_id: organizationId,
          mode: context?.mode || 'general',
          business_type: context?.businessType || 'general',
          mcp_tools: MCP_ACCOUNTING_TOOLS,
          current_context: {
            date: new Date().toISOString().split('T')[0],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        },
        max_tokens: 1000,
        temperature: 0.7,
        preferred_provider: 'anthropic', // Prefer Claude for MCP
        fallback_enabled: true,
        organization_id: organizationId
      })
    })
    
    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      throw new Error(errorData.error || 'AI request failed')
    }
    
    const aiData = await aiResponse.json()
    
    if (!aiData.success) {
      throw new Error(aiData.error || 'AI processing failed')
    }
    
    // Extract response and any tool calls from AI
    const { response, tool_calls, metadata } = aiData
    
    // Save assistant response
    await chatStorage.saveMessage({
      session_id: sessionId || `mcp-${Date.now()}`,
      message_type: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      metadata: {
        organizationId,
        tool_calls,
        ai_provider: metadata?.provider,
        tokens_used: metadata?.tokens_used
      }
    })
    
    // Format response for the frontend
    return NextResponse.json({
      success: true,
      message: response,
      type: 'mcp_response',
      category: detectCategory(message, tool_calls),
      tool_calls,
      sessionId: sessionId || `mcp-${Date.now()}`,
      ai_metadata: metadata
    })
    
  } catch (error) {
    console.error('MCP Digital Accountant error:', error)
    
    // Fallback to a helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message: `I encountered an issue: ${errorMessage}. Let me try to help you differently. What would you like to do?`,
      error: errorMessage,
      category: 'error'
    })
  }
}

// Helper to detect message category from tool calls
function detectCategory(message: string, toolCalls?: any[]): string {
  if (!toolCalls || toolCalls.length === 0) {
    return 'general'
  }
  
  const toolName = toolCalls[0].tool
  
  switch (toolName) {
    case 'recordSalonTransaction':
      const type = toolCalls[0].arguments?.type
      return type || 'transaction'
    
    case 'calculateDailySummary':
      return 'summary'
    
    case 'processCommissionPayment':
      return 'payment'
    
    case 'createJournalEntry':
    case 'postTransactionToGL':
      return 'journal'
    
    default:
      return 'general'
  }
}

// GET endpoint for capabilities
export async function GET() {
  return NextResponse.json({
    service: 'HERA MCP-Powered Digital Accountant',
    version: '2.0.0',
    description: 'Claude-powered intelligent accounting assistant using MCP tools',
    capabilities: [
      'Natural language understanding',
      'Context-aware responses',
      'Direct database operations',
      'Multi-turn conversations',
      'Automatic VAT calculations',
      'Smart transaction categorization'
    ],
    mcp_tools: Object.keys(MCP_ACCOUNTING_TOOLS)
  })
}