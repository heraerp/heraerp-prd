/**
 * HERA AI Client - AI Digital Accountant v2.5
 * 
 * Provides intelligent accounting assistance through Enhanced Gateway
 * - Cost tracking and usage analytics
 * - Professional accounting context
 * - Tool calling capabilities
 * 
 * Smart Code: HERA.SDK.AI.CLIENT.v1
 */

import { HeraClient } from './HeraClient'
import { HeraResponse, HeraClientOptions } from '../types'

export interface AIQueryRequest {
  query: string
  context?: {
    entity_type?: string
    entity_id?: string
    transaction_id?: string
    additional_context?: Record<string, any>
  }
  tools?: string[]
  model?: 'claude-3-sonnet' | 'claude-3-haiku' | 'claude-3-opus'
  max_tokens?: number
}

export interface AIQueryResponse {
  message: string
  usage: {
    input_tokens: number
    output_tokens: number
    total_cost: number
  }
  tools_used?: string[]
  duration: number
  model: string
  request_id: string
}

export interface AIUsageSummary {
  timeframe: string
  total_cost: number
  total_tokens: number
  request_count: number
  average_cost_per_request: number
  organization_id: string
}

export interface AIToolCall {
  tool_name: string
  parameters: Record<string, any>
  organization_id: string
}

export interface AIToolResponse {
  tool_name: string
  result: any
  execution_time: number
  success: boolean
  request_id: string
}

/**
 * HERA AI Digital Accountant Client
 * 
 * Provides intelligent accounting assistance with:
 * - Professional financial guidance
 * - Automated analysis and insights
 * - Tool calling for complex operations
 * - Complete cost tracking and analytics
 */
export class HeraAIClient extends HeraClient {
  constructor(options: HeraClientOptions) {
    super(options)
  }

  /**
   * Query HERA AI Digital Accountant
   * 
   * Provides intelligent responses to accounting and finance questions
   * with full cost tracking and professional context.
   */
  async query(request: AIQueryRequest): Promise<HeraResponse<AIQueryResponse>> {
    return this.makeGatewayRequest('POST', '/ai/assistant', {
      ...request,
      organization_id: this.organizationId
    })
  }

  /**
   * Start AI chat session
   * 
   * Maintains conversation context across multiple queries
   */
  async startChat(initialQuery: string): Promise<HeraResponse<{
    session_id: string
    response: AIQueryResponse
  }>> {
    return this.makeGatewayRequest('POST', '/ai/chat', {
      action: 'start',
      query: initialQuery,
      organization_id: this.organizationId
    })
  }

  /**
   * Continue AI chat session
   */
  async continueChat(sessionId: string, query: string): Promise<HeraResponse<AIQueryResponse>> {
    return this.makeGatewayRequest('POST', '/ai/chat', {
      action: 'continue',
      session_id: sessionId,
      query,
      organization_id: this.organizationId
    })
  }

  /**
   * Call AI tool for specific operations
   * 
   * Available tools:
   * - get-kpi: Calculate key performance indicators
   * - generate-report: Create financial reports
   * - draft-email: Generate professional communications
   * - analyze-transactions: Deep transaction analysis
   * - suggest-chart-accounts: Chart of accounts recommendations
   */
  async callTool(toolCall: AIToolCall): Promise<HeraResponse<AIToolResponse>> {
    return this.makeGatewayRequest('POST', '/ai/tools', {
      ...toolCall,
      organization_id: this.organizationId
    })
  }

  /**
   * Get AI usage summary and analytics
   * 
   * Provides detailed cost tracking and usage patterns
   * for billing and optimization purposes.
   */
  async getUsage(timeframe: string = '7d'): Promise<HeraResponse<AIUsageSummary>> {
    return this.makeGatewayRequest('GET', `/ai/usage?timeframe=${timeframe}`)
  }

  /**
   * Get AI cost breakdown by model and operation
   */
  async getCostBreakdown(timeframe: string = '30d'): Promise<HeraResponse<{
    timeframe: string
    breakdown: Array<{
      model: string
      operation_type: string
      request_count: number
      total_cost: number
      average_cost: number
    }>
    organization_id: string
  }>> {
    return this.makeGatewayRequest('GET', `/ai/costs?timeframe=${timeframe}`)
  }

  /**
   * SPECIALIZED AI ACCOUNTING METHODS
   */

  /**
   * Analyze financial statements with AI
   */
  async analyzeFinancialStatements(params: {
    statement_type: 'balance_sheet' | 'income_statement' | 'cash_flow'
    period: string
    compare_to_previous?: boolean
  }): Promise<HeraResponse<any>> {
    return this.callTool({
      tool_name: 'analyze-financial-statements',
      parameters: params,
      organization_id: this.organizationId
    })
  }

  /**
   * Generate AI-powered chart of accounts
   */
  async generateChartOfAccounts(industryType: string): Promise<HeraResponse<any>> {
    return this.callTool({
      tool_name: 'generate-chart-accounts',
      parameters: { industry_type: industryType },
      organization_id: this.organizationId
    })
  }

  /**
   * AI-powered transaction categorization
   */
  async categorizeTransaction(transactionId: string): Promise<HeraResponse<any>> {
    return this.callTool({
      tool_name: 'categorize-transaction',
      parameters: { transaction_id: transactionId },
      organization_id: this.organizationId
    })
  }

  /**
   * Generate executive financial summary
   */
  async generateExecutiveSummary(period: string): Promise<HeraResponse<any>> {
    return this.callTool({
      tool_name: 'generate-executive-summary',
      parameters: { period },
      organization_id: this.organizationId
    })
  }

  /**
   * AI audit assistance
   */
  async auditAssistance(params: {
    audit_type: 'internal' | 'external' | 'compliance'
    focus_areas?: string[]
  }): Promise<HeraResponse<any>> {
    return this.callTool({
      tool_name: 'audit-assistance',
      parameters: params,
      organization_id: this.organizationId
    })
  }

  /**
   * CONVENIENCE METHODS FOR COMMON AI TASKS
   */

  /**
   * Quick financial health check
   */
  async quickHealthCheck(): Promise<HeraResponse<any>> {
    return this.query({
      query: 'Perform a quick financial health check for this organization',
      context: { entity_type: 'organization' }
    })
  }

  /**
   * Explain financial concept
   */
  async explainConcept(concept: string): Promise<HeraResponse<AIQueryResponse>> {
    return this.query({
      query: `Explain this financial/accounting concept in the context of our business: ${concept}`,
      model: 'claude-3-haiku' // Use faster model for explanations
    })
  }

  /**
   * Draft professional email
   */
  async draftEmail(params: {
    recipient_type: 'customer' | 'vendor' | 'auditor' | 'investor'
    purpose: string
    key_points: string[]
    tone: 'formal' | 'professional' | 'friendly'
  }): Promise<HeraResponse<any>> {
    return this.callTool({
      tool_name: 'draft-email',
      parameters: params,
      organization_id: this.organizationId
    })
  }
}