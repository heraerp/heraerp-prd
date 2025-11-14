/**
 * HERA MCP Client - Model Context Protocol Integration
 * 
 * Provides intelligent context management for AI interactions
 * - Maintains conversation context
 * - Optimizes AI tool usage
 * - Advanced prompt engineering
 * 
 * Smart Code: HERA.SDK.MCP.CLIENT.v1
 */

import { HeraClient } from './HeraClient'
import { HeraClientOptions, HeraResponse, HeraMCPMessage, HeraMCPResponse, HeraAIContext } from '../types'

export interface MCPSession {
  session_id: string
  organization_id: string
  context: Record<string, any>
  messages: HeraMCPMessage[]
  created_at: string
  last_activity: string
  tools_available: string[]
}

export interface MCPToolCall {
  tool_name: string
  parameters: Record<string, any>
  context: Record<string, any>
}

export interface MCPContext {
  entity_types?: string[]
  transaction_types?: string[]
  date_range?: {
    start: string
    end: string
  }
  financial_context?: {
    currency: string
    fiscal_year: number
    accounting_method: 'accrual' | 'cash'
  }
  user_preferences?: Record<string, any>
}

/**
 * HERA MCP Client - Advanced AI Context Management
 * 
 * Provides sophisticated context management for AI interactions
 * with business intelligence and conversation continuity.
 */
export class HeraMCPClient extends HeraClient {
  private activeSessions: Map<string, MCPSession> = new Map()
  
  constructor(options: HeraClientOptions) {
    super(options)
  }

  /**
   * Start intelligent MCP session with context
   */
  async startSession(initialContext: MCPContext): Promise<HeraResponse<MCPSession>> {
    const sessionData = {
      initial_context: initialContext,
      organization_id: this.organizationId
    }

    const response = await this.makeGatewayRequest<MCPSession>('POST', '/mcp/session/start', sessionData)
    
    if (response.success) {
      this.activeSessions.set(response.data.session_id, response.data)
    }
    
    return response
  }

  /**
   * Send message with intelligent context enhancement
   */
  async sendMessage(
    sessionId: string, 
    message: string,
    context?: Partial<MCPContext>
  ): Promise<HeraResponse<HeraMCPResponse>> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return {
        success: false,
        error: 'Session not found. Please start a new session.'
      }
    }

    // Enhance message with context
    const enhancedMessage = await this.enhanceMessageWithContext(message, session, context)

    const requestData = {
      session_id: sessionId,
      message: enhancedMessage,
      context: context || {},
      organization_id: this.organizationId
    }

    const response = await this.makeGatewayRequest<HeraMCPResponse>('POST', '/mcp/message', requestData)
    
    if (response.success) {
      // Update local session cache
      session.last_activity = new Date().toISOString()
      session.messages.push(
        { role: 'user', content: message, context: context as HeraAIContext },
        { role: 'assistant', content: response.data.message }
      )
    }

    return response
  }

  /**
   * Execute MCP tool with context optimization
   */
  async executeTool(
    sessionId: string,
    toolCall: MCPToolCall
  ): Promise<HeraResponse<any>> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      }
    }

    // Optimize tool parameters with session context
    const optimizedParameters = this.optimizeToolParameters(toolCall.parameters, session)

    const requestData = {
      session_id: sessionId,
      tool_name: toolCall.tool_name,
      parameters: optimizedParameters,
      context: toolCall.context || {},
      organization_id: this.organizationId
    }

    return this.makeGatewayRequest('POST', '/mcp/tool/execute', requestData)
  }

  /**
   * Get intelligent business insights
   */
  async getBusinessInsights(
    sessionId: string,
    type: 'financial' | 'operational' | 'strategic'
  ): Promise<HeraResponse<{
    insights: string[]
    recommendations: string[]
    metrics: Record<string, number>
    confidence_scores: Record<string, number>
  }>> {
    return this.executeTool(sessionId, {
      tool_name: 'business-insights',
      parameters: { insight_type: type },
      context: { analysis_depth: 'comprehensive' }
    })
  }

  /**
   * Generate contextual financial analysis
   */
  async analyzeFinancialTrends(
    sessionId: string,
    timeframe: string = '12m'
  ): Promise<HeraResponse<{
    trends: Array<{
      metric: string
      trend: 'up' | 'down' | 'stable'
      change_percent: number
      significance: 'high' | 'medium' | 'low'
    }>
    predictions: Array<{
      metric: string
      predicted_value: number
      confidence: number
      timeframe: string
    }>
    recommendations: string[]
  }>> {
    return this.executeTool(sessionId, {
      tool_name: 'financial-trend-analysis',
      parameters: { timeframe },
      context: { include_predictions: true }
    })
  }

  /**
   * Intelligent document generation
   */
  async generateDocument(
    sessionId: string,
    documentType: 'report' | 'memo' | 'proposal' | 'analysis',
    specifications: {
      audience: string
      purpose: string
      length: 'brief' | 'standard' | 'comprehensive'
      format: 'markdown' | 'html' | 'plain'
      include_data?: boolean
    }
  ): Promise<HeraResponse<{
    document: string
    metadata: {
      word_count: number
      sections: string[]
      data_sources: string[]
    }
    suggestions: string[]
  }>> {
    return this.executeTool(sessionId, {
      tool_name: 'document-generator',
      parameters: {
        document_type: documentType,
        specifications
      },
      context: { 
        use_session_context: true,
        optimize_for_audience: true
      }
    })
  }

  /**
   * Advanced financial forecasting
   */
  async generateForecast(
    sessionId: string,
    parameters: {
      metrics: string[]
      timeframe: string
      confidence_level: number
      scenario_analysis?: boolean
    }
  ): Promise<HeraResponse<{
    forecasts: Array<{
      metric: string
      values: Array<{
        period: string
        value: number
        confidence_interval: { min: number, max: number }
      }>
    }>
    scenarios?: {
      optimistic: Record<string, number>
      realistic: Record<string, number>
      pessimistic: Record<string, number>
    }
    assumptions: string[]
    risks: string[]
  }>> {
    return this.executeTool(sessionId, {
      tool_name: 'financial-forecasting',
      parameters,
      context: { 
        use_historical_data: true,
        include_external_factors: true
      }
    })
  }

  /**
   * Session management
   */
  
  /**
   * Get session context and history
   */
  async getSession(sessionId: string): Promise<MCPSession | null> {
    const localSession = this.activeSessions.get(sessionId)
    if (localSession) {
      return localSession
    }

    // Fetch from server if not in local cache
    const response = await this.makeGatewayRequest<MCPSession>('GET', `/mcp/session/${sessionId}`)
    
    if (response.success) {
      this.activeSessions.set(sessionId, response.data)
      return response.data
    }

    return null
  }

  /**
   * Update session context
   */
  async updateSessionContext(
    sessionId: string, 
    contextUpdates: Partial<MCPContext>
  ): Promise<HeraResponse<MCPSession>> {
    const response = await this.makeGatewayRequest<MCPSession>('POST', `/mcp/session/${sessionId}/context`, {
      context_updates: contextUpdates,
      organization_id: this.organizationId
    })

    if (response.success) {
      const session = this.activeSessions.get(sessionId)
      if (session) {
        Object.assign(session.context, contextUpdates)
      }
    }

    return response
  }

  /**
   * End session and save context
   */
  async endSession(sessionId: string): Promise<HeraResponse<{ summary: string }>> {
    const response = await this.makeGatewayRequest<{ summary: string }>('POST', `/mcp/session/${sessionId}/end`, {
      organization_id: this.organizationId
    })

    // Clean up local session
    this.activeSessions.delete(sessionId)

    return response
  }

  /**
   * PRIVATE UTILITY METHODS
   */
  
  /**
   * Enhance message with contextual information
   */
  private async enhanceMessageWithContext(
    message: string,
    session: MCPSession,
    additionalContext?: Partial<MCPContext>
  ): Promise<string> {
    let enhancedMessage = message

    // Add organization context
    enhancedMessage += `\n\nContext: Organization ID ${this.organizationId}`

    // Add session context
    if (session.context.financial_context) {
      enhancedMessage += `\nFinancial Context: ${JSON.stringify(session.context.financial_context)}`
    }

    // Add recent conversation context (last 3 messages)
    const recentMessages = session.messages.slice(-3)
    if (recentMessages.length > 0) {
      enhancedMessage += '\n\nRecent Context:'
      for (const msg of recentMessages) {
        enhancedMessage += `\n${msg.role}: ${msg.content.substring(0, 100)}...`
      }
    }

    return enhancedMessage
  }

  /**
   * Optimize tool parameters based on session context
   */
  private optimizeToolParameters(
    parameters: Record<string, any>,
    session: MCPSession
  ): Record<string, any> {
    const optimized = { ...parameters }

    // Add organization context if not specified
    if (!optimized.organization_id) {
      optimized.organization_id = this.organizationId
    }

    // Add financial context if relevant
    if (session.context.financial_context) {
      if (!optimized.currency && session.context.financial_context.currency) {
        optimized.currency = session.context.financial_context.currency
      }
      
      if (!optimized.accounting_method && session.context.financial_context.accounting_method) {
        optimized.accounting_method = session.context.financial_context.accounting_method
      }
    }

    // Add date context if relevant
    if (session.context.date_range && !optimized.date_range) {
      optimized.date_range = session.context.date_range
    }

    return optimized
  }

  /**
   * Get all active sessions for organization
   */
  async getActiveSessions(): Promise<HeraResponse<MCPSession[]>> {
    return this.makeGatewayRequest<MCPSession[]>('GET', '/mcp/sessions', {
      organization_id: this.organizationId
    })
  }

  /**
   * Search conversation history
   */
  async searchHistory(
    query: string,
    sessionId?: string
  ): Promise<HeraResponse<{
    matches: Array<{
      session_id: string
      message: string
      timestamp: string
      relevance_score: number
    }>
  }>> {
    return this.makeGatewayRequest<{
      matches: Array<{
        session_id: string
        message: string
        timestamp: string
        relevance_score: number
      }>
    }>('POST', '/mcp/search', {
      query,
      session_id: sessionId,
      organization_id: this.organizationId
    })
  }
}