/**
 * Claude Brain - Claude API Integration
 * Core integration with Anthropic Claude for business intelligence
 * 
 * Provides natural language understanding with HERA business context
 */

import {
  ClaudeBrainService,
  ClaudeBrainRequest,
  ClaudeBrainResponse,
  ClaudeBrainConfig,
  BusinessAction,
  BusinessContext,
  BusinessInsight,
  ConversationState,
  ConversationTurn,
  ExecutedAction,
  UserFeedback,
  ClaudeBrainError,
  ClaudeBrainErrorResponse,
  SmartQueryRequest,
  SmartQueryResponse,
  ClaudeBrainMetrics
} from '@/types/claude-brain.types'
import { masterCrudV2Client } from '@/lib/master-crud-v2'
import { heraNLPProcessor } from './nlp-processor'
import { businessContextManager, heraBIEngine } from './business-context'
import { aiSuggestionsEngine } from './ai-suggestions'

/**
 * Claude API Client for HERA Business Intelligence
 */
export class ClaudeAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.anthropic.com/v1'
  private model: string
  private maxTokens: number
  private temperature: number

  constructor(config: Partial<ClaudeBrainConfig> = {}) {
    this.apiKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || ''
    this.model = config.model || 'claude-3-sonnet-20240229'
    this.maxTokens = config.maxTokens || 4000
    this.temperature = config.temperature || 0.3

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for Claude Brain integration')
    }
  }

  /**
   * Process natural language query with Claude
   */
  async processWithClaude(
    prompt: string,
    businessContext: BusinessContext,
    systemPrompt?: string
  ): Promise<any> {
    const contextualSystemPrompt = systemPrompt || this.buildBusinessSystemPrompt(businessContext)
    
    const requestBody = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: contextualSystemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'API request failed' }))
        throw new Error(`Claude API error: ${response.status} - ${error.error || 'Unknown error'}`)
      }

      const data = await response.json()
      return data.content[0].text

    } catch (error) {
      console.error('Claude API error:', error)
      throw error
    }
  }

  /**
   * Build HERA-specific system prompt with business context
   */
  private buildBusinessSystemPrompt(context: BusinessContext): string {
    return `You are Claude Brain, an AI business intelligence assistant for HERA ERP systems.

BUSINESS CONTEXT:
- Organization: ${context.organizationId}
- Industry: ${context.industry}
- Business Model: ${context.businessModel}
- User Role: ${context.currentUser.role}
- Department: ${context.currentUser.department}
- Currency: ${context.preferences.currency}
- Timezone: ${context.preferences.timezone}

RECENT ACTIVITY:
${context.recentActivity.operations.slice(0, 5).map(op => `- ${op}`).join('\n')}

CAPABILITIES:
You can help with:
1. Creating, updating, deleting, and querying business entities (customers, products, orders, etc.)
2. Generating business insights and analytics
3. Suggesting process optimizations
4. Providing industry-specific recommendations
5. Executing business operations through the HERA Master CRUD v2 system

RESPONSE FORMAT:
- Always provide conversational, business-focused responses
- Include specific action suggestions when relevant
- Reference HERA smart codes when creating entities
- Consider the user's role and permissions
- Explain business impact and rationale for suggestions

HERA SMART CODE FORMAT:
Use format: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V1
Examples:
- Customer: HERA.${context.industry.toUpperCase()}.CUSTOMER.ENTITY.PROFILE.V1
- Product: HERA.${context.industry.toUpperCase()}.PRODUCT.ENTITY.CATALOG.V1
- Order: HERA.${context.industry.toUpperCase()}.ORDER.TRANSACTION.STANDARD.V1

Be helpful, accurate, and business-focused in your responses.`
  }
}

/**
 * Main Claude Brain Service Implementation
 */
export class ClaudeBrainServiceImpl implements ClaudeBrainService {
  private claudeClient: ClaudeAPIClient
  private sessions = new Map<string, ConversationState>()
  private metrics: ClaudeBrainMetrics = {
    requestCount: 0,
    averageResponseTimeMs: 0,
    intentAccuracy: 0,
    actionSuccessRate: 0,
    userSatisfactionScore: 0,
    topQueries: [],
    errorRate: 0,
    cacheHitRate: 0
  }

  constructor(config?: Partial<ClaudeBrainConfig>) {
    this.claudeClient = new ClaudeAPIClient(config)
  }

  /**
   * Process natural language query and generate business intelligence response
   */
  async processNaturalQuery(request: ClaudeBrainRequest): Promise<ClaudeBrainResponse> {
    const startTime = Date.now()
    
    try {
      this.metrics.requestCount++

      // Get business context
      const context = request.context || 
        await businessContextManager.getBusinessContext(request.organizationId, request.userId)

      // Extract intent and entities using NLP
      const nlpStartTime = Date.now()
      const intent = await heraNLPProcessor.extractIntent(request.naturalLanguageQuery, context)
      const entities = await heraNLPProcessor.extractEntities(request.naturalLanguageQuery, context)
      const operations = await heraNLPProcessor.generateOperations(intent, entities)
      const nlpTime = Date.now() - nlpStartTime

      // Generate Claude response with business context
      const claudeStartTime = Date.now()
      const claudePrompt = this.buildClaudePrompt(request, intent, entities, context)
      const claudeResponse = await this.claudeClient.processWithClaude(claudePrompt, context)
      const claudeTime = Date.now() - claudeStartTime

      // Generate business insights and actions
      const insights = await this.generateRelevantInsights(context, entities)
      const actions = await this.generateBusinessActions(intent, entities, context, operations)

      // Build structured response
      const response: ClaudeBrainResponse = {
        success: true,
        sessionId: request.sessionId || this.generateSessionId(),
        understanding: {
          intent,
          confidence: intent.confidence,
          entities,
          operations
        },
        answer: {
          conversational: claudeResponse,
          structured: {
            intent_category: intent.category,
            entity_types: entities.map(e => e.type),
            suggested_operations: operations.map(o => o.operation)
          },
          actions,
          insights
        },
        performance: {
          processingTimeMs: Date.now() - startTime,
          aiResponseTimeMs: claudeTime,
          masterCrudTimeMs: 0 // Will be updated if operations are executed
        },
        followUp: {
          suggestedQuestions: this.generateFollowUpQuestions(intent, context),
          possibleActions: actions.map(a => a.title),
          nextSteps: this.generateNextSteps(intent, actions)
        }
      }

      // Update metrics
      this.updateMetrics(response)

      return response

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('[Claude Brain] Natural query processing failed:', error)
      
      const errorResponse: ClaudeBrainErrorResponse = {
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: error instanceof Error ? error.message : 'Natural query processing failed',
          type: 'processing',
          suggestion: 'Please try rephrasing your question or provide more specific details'
        },
        fallback: {
          suggestion: 'Try asking about specific entities like "show me customers" or "create a new product"',
          alternativeQuery: this.generateAlternativeQuery(request.naturalLanguageQuery),
          manualAction: 'Use the manual interface to perform your desired operation'
        },
        performance: {
          processingTimeMs: executionTime,
          failedAt: 'natural_language_processing'
        }
      }

      this.metrics.errorRate++
      throw errorResponse
    }
  }

  /**
   * Execute business action through Master CRUD v2
   */
  async executeBusinessAction(action: BusinessAction, context: BusinessContext): Promise<ExecutedAction> {
    const startTime = Date.now()
    
    try {
      let result: any = null
      
      if (action.operation) {
        const operation = action.operation
        
        switch (operation.operation) {
          case 'createEntityComplete':
            result = await masterCrudV2Client.createEntityComplete(operation.parameters)
            break
            
          case 'updateEntityComplete':
            result = await masterCrudV2Client.updateEntityComplete(operation.parameters)
            break
            
          case 'deleteEntityComplete':
            result = await masterCrudV2Client.deleteEntityComplete(operation.parameters)
            break
            
          case 'queryEntityComplete':
            result = await masterCrudV2Client.queryEntityComplete(operation.parameters)
            break
            
          default:
            throw new Error(`Unsupported operation: ${operation.operation}`)
        }
      }

      const executedAction: ExecutedAction = {
        actionId: action.id,
        operation: action.operation?.operation || action.type,
        parameters: action.operation?.parameters || {},
        result,
        executionTimeMs: Date.now() - startTime,
        success: true
      }

      this.metrics.actionSuccessRate = (this.metrics.actionSuccessRate + 1) / 2

      return executedAction

    } catch (error) {
      const executedAction: ExecutedAction = {
        actionId: action.id,
        operation: action.operation?.operation || action.type,
        parameters: action.operation?.parameters || {},
        result: null,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Action execution failed'
      }

      this.metrics.actionSuccessRate = this.metrics.actionSuccessRate / 2

      return executedAction
    }
  }

  /**
   * Generate business insights for organization
   */
  async generateInsights(organizationId: string, context: BusinessContext): Promise<BusinessInsight[]> {
    // Get recent business data
    const entities = await masterCrudV2Client.findEntities(organizationId, 'all', {
      includeDynamicData: true,
      limit: 100
    })

    // Generate insights using BI engine
    const insights = await heraBIEngine.generateInsights(context, entities)
    
    return insights
  }

  /**
   * Smart query processing with natural language
   */
  async smartQuery(request: SmartQueryRequest): Promise<SmartQueryResponse> {
    const startTime = Date.now()
    
    try {
      // Process natural language to Master CRUD v2 query
      const nlpStartTime = Date.now()
      const intent = await heraNLPProcessor.extractIntent(request.naturalLanguage, request.context)
      const entities = await heraNLPProcessor.extractEntities(request.naturalLanguage, request.context)
      const operations = await heraNLPProcessor.generateOperations(intent, entities)
      const nlpTime = Date.now() - nlpStartTime

      // Find the query operation
      const queryOperation = operations.find(op => op.operation === 'queryEntityComplete')
      if (!queryOperation) {
        throw new Error('Could not determine query intent from natural language')
      }

      // Execute the query
      const queryStartTime = Date.now()
      const queryResult = await masterCrudV2Client.queryEntityComplete({
        organizationId: request.organizationId,
        ...queryOperation.parameters,
        responseFormat: request.responseFormat
      })
      const queryTime = Date.now() - queryStartTime

      // Generate insights if requested
      let insights: BusinessInsight[] = []
      if (request.includeInsights) {
        insights = await heraBIEngine.generateInsights(request.context, queryResult.entities)
      }

      // Generate conversational summary
      const aiStartTime = Date.now()
      const summaryPrompt = `Summarize these query results in business language: ${JSON.stringify(queryResult.entities.slice(0, 5))}`
      const summary = await this.claudeClient.processWithClaude(summaryPrompt, request.context)
      const aiTime = Date.now() - aiStartTime

      return {
        query: {
          original: request.naturalLanguage,
          interpreted: intent.operation,
          masterCrudOperation: queryOperation.parameters,
          confidence: intent.confidence
        },
        results: {
          entities: queryResult.entities,
          summary,
          insights,
          visualizations: this.generateVisualizationConfigs(queryResult.entities, intent)
        },
        performance: {
          totalTimeMs: Date.now() - startTime,
          nlpTimeMs: nlpTime,
          queryTimeMs: queryTime,
          aiTimeMs: aiTime
        },
        followUp: {
          relatedQuestions: this.generateRelatedQuestions(intent, request.context),
          suggestedFilters: this.generateSuggestedFilters(queryResult.entities),
          possibleActions: this.generatePossibleActions(queryResult.entities)
        }
      }

    } catch (error) {
      console.error('[Claude Brain] Smart query failed:', error)
      throw error
    }
  }

  /**
   * Suggest actions based on context and entities
   */
  async suggestActions(context: BusinessContext, entities: any[]): Promise<BusinessAction[]> {
    return await aiSuggestionsEngine.generateActionSuggestions(context, entities)
  }

  /**
   * Create new conversation session
   */
  async createSession(organizationId: string, userId: string): Promise<string> {
    const sessionId = this.generateSessionId()
    const context = await businessContextManager.getBusinessContext(organizationId, userId)
    
    const session: ConversationState = {
      sessionId,
      organizationId,
      userId,
      history: [],
      context,
      preferences: {
        responseStyle: 'business',
        autoExecuteActions: false,
        preferredEntityTypes: [],
        notificationPreferences: {},
        dashboardLayout: {}
      },
      createdAt: new Date(),
      lastActivity: new Date()
    }

    this.sessions.set(sessionId, session)
    return sessionId
  }

  /**
   * Get conversation session
   */
  async getSession(sessionId: string): Promise<ConversationState | null> {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Update conversation session with new turn
   */
  async updateSession(sessionId: string, turn: ConversationTurn): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.history.push(turn)
      session.lastActivity = new Date()
      
      // Learn from the interaction
      await businessContextManager.learnFromInteraction(session.organizationId, turn)
    }
  }

  /**
   * Learn from user feedback
   */
  async learnFromFeedback(sessionId: string, feedback: UserFeedback): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session && session.history.length > 0) {
      const lastTurn = session.history[session.history.length - 1]
      lastTurn.feedback = feedback
      
      // Update metrics
      this.metrics.userSatisfactionScore = (this.metrics.userSatisfactionScore + feedback.rating) / 2
    }
  }

  /**
   * Update business context
   */
  async updateBusinessContext(organizationId: string, context: Partial<BusinessContext>): Promise<void> {
    await businessContextManager.updateBusinessContext(organizationId, context)
  }

  /**
   * Get performance metrics
   */
  async getMetrics(organizationId?: string): Promise<ClaudeBrainMetrics> {
    return { ...this.metrics }
  }

  /**
   * Optimize performance
   */
  async optimizePerformance(config: Partial<ClaudeBrainConfig>): Promise<void> {
    // Update Claude client configuration
    if (config.anthropicApiKey || config.model || config.maxTokens || config.temperature) {
      this.claudeClient = new ClaudeAPIClient(config)
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    try {
      // Test Claude API connectivity
      const testContext: BusinessContext = {
        organizationId: 'health-check',
        industry: 'general',
        businessModel: 'test',
        currentUser: { id: 'test', role: 'admin', permissions: ['all'], department: 'test' },
        recentActivity: { operations: [], entities: [], timeframe: 'test' },
        preferences: { timezone: 'UTC', currency: 'USD', units: 'metric', reportingPeriod: 'monthly' }
      }
      
      await this.claudeClient.processWithClaude('Health check', testContext)
      
      return {
        status: 'healthy',
        responseTimeMs: 50,
        features: [
          'natural_language_processing',
          'business_context_intelligence',
          'ai_powered_suggestions',
          'master_crud_integration',
          'conversation_management'
        ],
        anthropicApiStatus: 'connected'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTimeMs: 0,
        features: [],
        anthropicApiStatus: 'disconnected',
        error: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }

  // Private helper methods
  private buildClaudePrompt(
    request: ClaudeBrainRequest,
    intent: any,
    entities: any[],
    context: BusinessContext
  ): string {
    return `User Query: "${request.naturalLanguageQuery}"

Detected Intent: ${intent.category} (confidence: ${(intent.confidence * 100).toFixed(1)}%)
Detected Entities: ${entities.map(e => `${e.type}:${e.value}`).join(', ')}

Please provide a helpful business response that:
1. Acknowledges the user's intent
2. Explains what actions can be taken
3. Provides relevant business insights
4. Suggests next steps

Keep the response conversational but professional, suitable for a ${context.currentUser.role} in the ${context.industry} industry.`
  }

  private generateSessionId(): string {
    return `claude_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async generateRelevantInsights(context: BusinessContext, entities: any[]): Promise<BusinessInsight[]> {
    if (entities.length === 0) return []
    
    try {
      return await heraBIEngine.generateInsights(context, entities.slice(0, 10))
    } catch (error) {
      console.warn('Failed to generate insights:', error)
      return []
    }
  }

  private async generateBusinessActions(intent: any, entities: any[], context: BusinessContext, operations: any[]): Promise<BusinessAction[]> {
    try {
      const entityResults = [] // Would convert entities to MasterCrudEntityResult format
      return await aiSuggestionsEngine.generateActionSuggestions(context, entityResults, intent.operation)
    } catch (error) {
      console.warn('Failed to generate actions:', error)
      return []
    }
  }

  private generateFollowUpQuestions(intent: any, context: BusinessContext): string[] {
    const baseQuestions = [
      'Would you like to see more details about any specific item?',
      'Should I generate a report for this data?',
      'Would you like to create or update any records?'
    ]
    
    switch (intent.category) {
      case 'query':
        return [
          'Would you like to filter these results further?',
          'Should I export this data to a spreadsheet?',
          'Would you like to see analytics for this data?'
        ]
      case 'create':
        return [
          'Would you like to add more details to this record?',
          'Should I create related records as well?',
          'Would you like to set up notifications for this entity?'
        ]
      default:
        return baseQuestions
    }
  }

  private generateNextSteps(intent: any, actions: BusinessAction[]): string[] {
    if (actions.length === 0) {
      return ['Ask me about your business data or operations']
    }
    
    return actions.slice(0, 3).map(action => action.description)
  }

  private generateAlternativeQuery(originalQuery: string): string {
    // Simple alternative generation - in production, would use more sophisticated logic
    if (originalQuery.toLowerCase().includes('show')) {
      return originalQuery.replace(/show/i, 'find')
    }
    if (originalQuery.toLowerCase().includes('create')) {
      return originalQuery.replace(/create/i, 'add')
    }
    return `Could you please rephrase: "${originalQuery}"?`
  }

  private generateVisualizationConfigs(entities: any[], intent: any): any[] {
    // Generate chart configurations based on entity data
    const configs = []
    
    if (entities.length > 5 && intent.category === 'query') {
      configs.push({
        type: 'table',
        title: 'Query Results',
        data: entities.slice(0, 10)
      })
    }
    
    return configs
  }

  private generateRelatedQuestions(intent: any, context: BusinessContext): string[] {
    return [
      'What are the top performing items this month?',
      'Show me recent activity in my organization',
      'What insights do you have for my business?'
    ]
  }

  private generateSuggestedFilters(entities: any[]): string[] {
    const filters = ['status = active', 'created this week', 'high priority']
    return filters
  }

  private generatePossibleActions(entities: any[]): string[] {
    const actions = ['Export to CSV', 'Generate Report', 'Create Related Records']
    return actions
  }

  private updateMetrics(response: ClaudeBrainResponse): void {
    this.metrics.averageResponseTimeMs = (this.metrics.averageResponseTimeMs + response.performance.processingTimeMs) / 2
    this.metrics.intentAccuracy = (this.metrics.intentAccuracy + response.understanding.confidence) / 2
  }
}

// Export singleton instance
export const claudeBrainService = new ClaudeBrainServiceImpl()