/**
 * Claude Brain Service - TypeScript Interfaces
 * AI-powered business intelligence for HERA ERP
 * 
 * Built on Master CRUD v2 foundation for sub-100ms AI responses
 */

import { 
  MasterCrudEntityResult, 
  CreateEntityCompleteRequest,
  UpdateEntityCompleteRequest,
  QueryEntityCompleteRequest 
} from './master-crud-v2.types'

/**
 * Core Claude Brain Interfaces
 */

export interface ClaudeBrainRequest {
  organizationId: string
  userId?: string
  sessionId?: string
  context?: BusinessContext
  naturalLanguageQuery: string
  intentHints?: string[]
  responseFormat?: 'conversational' | 'structured' | 'actionable'
}

export interface ClaudeBrainResponse {
  success: boolean
  sessionId: string
  understanding: {
    intent: BusinessIntent
    confidence: number
    entities: ExtractedEntity[]
    operations: SuggestedOperation[]
  }
  answer: {
    conversational: string
    structured?: any
    actions?: BusinessAction[]
    insights?: BusinessInsight[]
  }
  performance: {
    processingTimeMs: number
    masterCrudTimeMs?: number
    aiResponseTimeMs: number
  }
  followUp?: {
    suggestedQuestions: string[]
    possibleActions: string[]
    nextSteps: string[]
  }
}

/**
 * Business Context & Intelligence
 */

export interface BusinessContext {
  organizationId: string
  industry: string
  businessModel: string
  currentUser: {
    id: string
    role: string
    permissions: string[]
    department: string
  }
  recentActivity: {
    operations: string[]
    entities: string[]
    timeframe: string
  }
  preferences: {
    timezone: string
    currency: string
    units: string
    reportingPeriod: string
  }
}

export interface BusinessIntent {
  category: 'query' | 'create' | 'update' | 'delete' | 'analyze' | 'report' | 'insight'
  operation: string
  entityType?: string
  confidence: number
  parameters: Record<string, any>
  requiresConfirmation: boolean
}

export interface ExtractedEntity {
  type: string
  value: string
  confidence: number
  context: string
  smartCode?: string
  resolved?: {
    entityId: string
    entityName: string
  }
}

export interface SuggestedOperation {
  type: 'master_crud' | 'analytics' | 'workflow' | 'integration'
  operation: string
  parameters: any
  confidence: number
  rationale: string
  estimatedTimeMs: number
}

/**
 * Business Actions & Insights
 */

export interface BusinessAction {
  id: string
  type: 'create' | 'update' | 'delete' | 'query' | 'analyze' | 'export' | 'notify'
  title: string
  description: string
  operation?: any // Master CRUD v2 operation
  confirmation?: {
    required: boolean
    message: string
    risks: string[]
  }
  estimation: {
    timeMs: number
    impact: 'low' | 'medium' | 'high'
    reversible: boolean
  }
}

export interface BusinessInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation'
  title: string
  description: string
  data: any
  confidence: number
  impact: 'low' | 'medium' | 'high'
  timeframe: string
  actionable: boolean
  suggestedActions?: string[]
}

/**
 * Claude Brain Service Configuration
 */

export interface ClaudeBrainConfig {
  anthropicApiKey: string
  model: string // 'claude-3-sonnet' | 'claude-3-haiku' | 'claude-3-opus'
  maxTokens: number
  temperature: number
  
  features: {
    enableNaturalLanguageQuery: boolean
    enableBusinessInsights: boolean
    enableActionSuggestions: boolean
    enableContextLearning: boolean
    enablePerformanceOptimization: boolean
  }
  
  performance: {
    targetResponseTimeMs: number // Target: 200ms total (100ms AI + 100ms operations)
    enableCaching: boolean
    maxConcurrentRequests: number
    enableStreaming: boolean
  }
  
  security: {
    enableContentFiltering: boolean
    allowDataModification: boolean
    requireConfirmationFor: string[]
    auditAllInteractions: boolean
  }

  businessContext: {
    autoDetectIndustry: boolean
    learnFromInteractions: boolean
    enablePersonalization: boolean
    contextRetentionDays: number
  }
}

/**
 * Natural Language Processing
 */

export interface NLPProcessor {
  extractIntent(query: string, context: BusinessContext): Promise<BusinessIntent>
  extractEntities(query: string, context: BusinessContext): Promise<ExtractedEntity[]>
  generateOperations(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation[]>
  validateQuery(query: string): Promise<{ isValid: boolean; issues: string[] }>
}

export interface ConversationState {
  sessionId: string
  organizationId: string
  userId: string
  history: ConversationTurn[]
  context: BusinessContext
  preferences: UserPreferences
  createdAt: Date
  lastActivity: Date
}

export interface ConversationTurn {
  id: string
  timestamp: Date
  userMessage: string
  claudeResponse: ClaudeBrainResponse
  actions?: ExecutedAction[]
  feedback?: UserFeedback
}

export interface ExecutedAction {
  actionId: string
  operation: string
  parameters: any
  result: any
  executionTimeMs: number
  success: boolean
  error?: string
}

export interface UserFeedback {
  rating: 1 | 2 | 3 | 4 | 5
  helpful: boolean
  accurate: boolean
  fast: boolean
  comments?: string
}

export interface UserPreferences {
  responseStyle: 'brief' | 'detailed' | 'technical' | 'business'
  autoExecuteActions: boolean
  preferredEntityTypes: string[]
  notificationPreferences: Record<string, boolean>
  dashboardLayout: any
}

/**
 * Business Intelligence Engine
 */

export interface BusinessIntelligenceEngine {
  generateInsights(context: BusinessContext, data: any[]): Promise<BusinessInsight[]>
  detectAnomalies(data: any[], timeframe: string): Promise<BusinessInsight[]>
  predictTrends(data: any[], horizon: string): Promise<BusinessInsight[]>
  suggestOptimizations(context: BusinessContext): Promise<BusinessInsight[]>
  analyzePerformance(metrics: any, targets: any): Promise<BusinessInsight[]>
}

/**
 * Smart Query Processing
 */

export interface SmartQueryRequest {
  naturalLanguage: string
  organizationId: string
  userId: string
  context: BusinessContext
  includeInsights?: boolean
  maxResults?: number
  responseFormat?: 'table' | 'cards' | 'chart' | 'narrative'
}

export interface SmartQueryResponse {
  query: {
    original: string
    interpreted: string
    masterCrudOperation: QueryEntityCompleteRequest
    confidence: number
  }
  results: {
    entities: MasterCrudEntityResult[]
    summary: string
    insights: BusinessInsight[]
    visualizations?: ChartConfig[]
  }
  performance: {
    totalTimeMs: number
    nlpTimeMs: number
    queryTimeMs: number
    aiTimeMs: number
  }
  followUp: {
    relatedQuestions: string[]
    suggestedFilters: string[]
    possibleActions: string[]
  }
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'table'
  title: string
  data: any[]
  xAxis?: string
  yAxis?: string
  groupBy?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

/**
 * Context Learning System
 */

export interface ContextLearningEngine {
  learnFromInteraction(interaction: ConversationTurn): Promise<void>
  updateBusinessContext(organizationId: string, newData: Partial<BusinessContext>): Promise<void>
  predictUserIntent(userId: string, query: string): Promise<BusinessIntent[]>
  suggestQueryImprovements(query: string, context: BusinessContext): Promise<string[]>
  getPersonalizedInsights(userId: string, context: BusinessContext): Promise<BusinessInsight[]>
}

/**
 * Performance Monitoring
 */

export interface ClaudeBrainMetrics {
  requestCount: number
  averageResponseTimeMs: number
  intentAccuracy: number
  actionSuccessRate: number
  userSatisfactionScore: number
  topQueries: Array<{ query: string; count: number }>
  errorRate: number
  cacheHitRate: number
}

export interface PerformanceOptimizer {
  optimizePrompt(query: string, context: BusinessContext): Promise<string>
  enableSmartCaching(sessionId: string): Promise<void>
  preloadContext(organizationId: string): Promise<void>
  optimizeModelSelection(query: string, performance: any): Promise<string>
}

/**
 * Claude Brain Service Interface
 */

export interface ClaudeBrainService {
  // Core operations
  processNaturalQuery(request: ClaudeBrainRequest): Promise<ClaudeBrainResponse>
  executeBusinessAction(action: BusinessAction, context: BusinessContext): Promise<ExecutedAction>
  generateInsights(organizationId: string, context: BusinessContext): Promise<BusinessInsight[]>
  
  // Smart querying
  smartQuery(request: SmartQueryRequest): Promise<SmartQueryResponse>
  suggestActions(context: BusinessContext, entities: MasterCrudEntityResult[]): Promise<BusinessAction[]>
  
  // Conversation management
  createSession(organizationId: string, userId: string): Promise<string>
  getSession(sessionId: string): Promise<ConversationState | null>
  updateSession(sessionId: string, turn: ConversationTurn): Promise<void>
  
  // Context learning
  learnFromFeedback(sessionId: string, feedback: UserFeedback): Promise<void>
  updateBusinessContext(organizationId: string, context: Partial<BusinessContext>): Promise<void>
  
  // Performance
  getMetrics(organizationId?: string): Promise<ClaudeBrainMetrics>
  optimizePerformance(config: Partial<ClaudeBrainConfig>): Promise<void>
  
  // Health
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTimeMs: number
    features: string[]
    anthropicApiStatus: 'connected' | 'disconnected' | 'limited'
  }>
}

/**
 * Error Types
 */

export interface ClaudeBrainError {
  code: string
  message: string
  type: 'validation' | 'api' | 'processing' | 'timeout' | 'permission'
  details?: any
  suggestion?: string
}

export interface ClaudeBrainErrorResponse {
  success: false
  error: ClaudeBrainError
  fallback?: {
    suggestion: string
    alternativeQuery?: string
    manualAction?: string
  }
  performance: {
    processingTimeMs: number
    failedAt: string
  }
}

/**
 * Industry-Specific Extensions
 */

export interface IndustryContext {
  industryType: string
  commonEntities: string[]
  businessProcesses: string[]
  keyMetrics: string[]
  regulatoryRequirements: string[]
  seasonality: Record<string, any>
}

export interface IndustryIntelligence {
  retail: RetailIntelligence
  manufacturing: ManufacturingIntelligence
  services: ServicesIntelligence
  healthcare: HealthcareIntelligence
  finance: FinanceIntelligence
}

export interface RetailIntelligence {
  inventoryOptimization: (data: any) => BusinessInsight[]
  customerSegmentation: (data: any) => BusinessInsight[]
  seasonalForecasting: (data: any) => BusinessInsight[]
  priceOptimization: (data: any) => BusinessInsight[]
}

export interface ManufacturingIntelligence {
  productionOptimization: (data: any) => BusinessInsight[]
  qualityAnalysis: (data: any) => BusinessInsight[]
  supplyChainInsights: (data: any) => BusinessInsight[]
  equipmentMaintenance: (data: any) => BusinessInsight[]
}

export interface ServicesIntelligence {
  resourceUtilization: (data: any) => BusinessInsight[]
  clientSatisfaction: (data: any) => BusinessInsight[]
  serviceDeliveryOptimization: (data: any) => BusinessInsight[]
  revenueForecasting: (data: any) => BusinessInsight[]
}

export interface HealthcareIntelligence {
  patientFlowOptimization: (data: any) => BusinessInsight[]
  resourceAllocation: (data: any) => BusinessInsight[]
  outcomeAnalysis: (data: any) => BusinessInsight[]
  complianceMonitoring: (data: any) => BusinessInsight[]
}

export interface FinanceIntelligence {
  riskAssessment: (data: any) => BusinessInsight[]
  portfolioOptimization: (data: any) => BusinessInsight[]
  fraudDetection: (data: any) => BusinessInsight[]
  regulatoryCompliance: (data: any) => BusinessInsight[]
}

/**
 * Type Guards
 */

export function isClaudeBrainRequest(obj: any): obj is ClaudeBrainRequest {
  return obj && 
    typeof obj.organizationId === 'string' &&
    typeof obj.naturalLanguageQuery === 'string'
}

export function isBusinessAction(obj: any): obj is BusinessAction {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string'
}

export function isBusinessInsight(obj: any): obj is BusinessInsight {
  return obj &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.confidence === 'number'
}

/**
 * Configuration Constants
 */

export const CLAUDE_BRAIN_CONFIG = {
  // Performance targets
  TARGET_TOTAL_RESPONSE_TIME_MS: 200,
  TARGET_AI_RESPONSE_TIME_MS: 100,
  TARGET_OPERATION_TIME_MS: 100,
  
  // Model selection
  DEFAULT_MODEL: 'claude-3-sonnet-20240229',
  FAST_MODEL: 'claude-3-haiku-20240307',
  SMART_MODEL: 'claude-3-opus-20240229',
  
  // Token limits
  MAX_CONTEXT_TOKENS: 100000,
  MAX_RESPONSE_TOKENS: 4000,
  
  // Caching
  CONTEXT_CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutes
  RESPONSE_CACHE_TTL_MS: 5 * 60 * 1000,  // 5 minutes
  
  // Session management
  SESSION_TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours
  MAX_CONVERSATION_TURNS: 100,
  
  // Business intelligence
  MIN_INSIGHT_CONFIDENCE: 0.7,
  MAX_INSIGHTS_PER_REQUEST: 10,
  
  // API endpoints
  API_BASE_PATH: '/api/v2/claude-brain'
} as const

/**
 * Export utility types
 */
export type ClaudeBrainModel = 'claude-3-sonnet' | 'claude-3-haiku' | 'claude-3-opus'
export type ResponseFormat = 'conversational' | 'structured' | 'actionable'
export type IntentCategory = 'query' | 'create' | 'update' | 'delete' | 'analyze' | 'report' | 'insight'
export type ActionType = 'create' | 'update' | 'delete' | 'query' | 'analyze' | 'export' | 'notify'
export type InsightType = 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation'
export type ImpactLevel = 'low' | 'medium' | 'high'