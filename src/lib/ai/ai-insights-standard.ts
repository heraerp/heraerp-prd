/**
 * HERA Finance DNA v3: AI Insights Engine Standards & Types
 * 
 * Revolutionary AI system standards that transform HERA from a reactive ERP
 * to a predictive, autonomous enterprise intelligence layer with complete
 * type safety and validation.
 * 
 * Smart Code: HERA.AI.INSIGHT.STANDARDS.V3
 */

// ============================================================================
// Core AI Insight Types
// ============================================================================

export type AIInsightType = 
  | 'DESCRIPTIVE'     // What happened? Analysis of historical data
  | 'PREDICTIVE'      // What will happen? Future trend predictions
  | 'PRESCRIPTIVE'    // What should we do? Action recommendations
  | 'AUTONOMOUS'      // What can be automated? Policy updates

export type AIIntelligenceLevel = 1 | 2 | 3 | 4

export type AIInsightCategory = 
  // Descriptive categories
  | 'REVENUE_TREND' | 'COST_STRUCTURE' | 'PROFITABILITY_SEGMENT' | 'DIMENSIONAL_ANALYSIS'
  // Predictive categories  
  | 'REVENUE_FORECAST' | 'COST_VARIANCE' | 'DEMAND_PREDICTION' | 'RISK_ASSESSMENT'
  // Prescriptive categories
  | 'PROFIT_OPTIMIZATION' | 'RESOURCE_ALLOCATION' | 'COST_REDUCTION' | 'STRATEGY_RECOMMENDATION'
  // Autonomous categories
  | 'POLICY_AUTOMATION' | 'ALERT_CONFIGURATION' | 'WORKFLOW_OPTIMIZATION' | 'AUTONOMOUS_DECISION'

export type AIConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'

export type AIProcessingStatus = 
  | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// ============================================================================
// AI Insight Data Structures
// ============================================================================

export interface AIInsight {
  insight_type: AIInsightType
  insight_category: AIInsightCategory
  insight_title: string
  insight_description: string
  confidence_score: number  // 0.0 to 1.0
  confidence_level?: AIConfidenceLevel
  data_points: Record<string, any>
  recommendations?: AIRecommendation[]
  smart_code: string
  generated_at: string | Date
  metadata?: Record<string, any>
}

export interface AIRecommendation {
  action: string
  description: string
  impact_aed?: number
  effort_score: number  // 1-10 scale
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timeline_months?: number
  implementation_notes?: string
}

export interface AIFeatureVector {
  fact_count: number
  period_range: number
  target_period: string
  organization_id: string
  data_completeness: 'LOW' | 'MEDIUM' | 'HIGH'
  generated_at: number
  processing_node: string
  additional_features?: Record<string, any>
}

export interface AIProcessingMetrics {
  start_time: string | Date
  data_extraction_ms: number
  ai_processing_ms: number
  persistence_ms: number
  total_processing_ms?: number
  memory_usage_mb?: number
  cpu_utilization_pct?: number
}

// ============================================================================
// AI Insight Request & Response Types
// ============================================================================

export interface AIInsightGenerationRequest {
  organization_id: string
  actor_entity_id?: string
  period?: string  // YYYY-MM format
  insight_types?: AIInsightType[]
  intelligence_level?: AIIntelligenceLevel
  dry_run?: boolean
  confidence_threshold?: number
  include_preview?: boolean
}

export interface AIInsightGenerationResult {
  success: boolean
  run_id?: string
  insights_generated?: number
  processing_time_ms?: number
  intelligence_layers?: {
    descriptive: number
    predictive: number
    prescriptive: number
    autonomous: number
  }
  data_foundation?: {
    period: string
    fact_count: number
    feature_vector_size: number
    confidence_threshold: number
  }
  preview_insights?: {
    descriptive?: AIInsight[]
    predictive?: AIInsight[]
    prescriptive?: AIInsight[]
    autonomous?: AIInsight[]
  }
  metadata?: {
    organization_id: string
    actor_entity_id?: string
    dry_run: boolean
    generated_at: string | Date
    smart_code: string
  }
  error?: string
  error_code?: string
}

export interface AIInsightQuery {
  organization_id: string
  period?: string
  insight_types?: AIInsightType[]
  categories?: AIInsightCategory[]
  confidence_min?: number
  limit?: number
  offset?: number
  sort_by?: 'generated_at' | 'confidence_score' | 'insight_type'
  sort_order?: 'ASC' | 'DESC'
  include_metadata?: boolean
}

export interface AIInsightQueryResult {
  success: boolean
  data?: AIInsightListItem[]
  total_count?: number
  has_more?: boolean
  metadata?: {
    query_params: AIInsightQuery
    execution_time_ms: number
    cache_hit?: boolean
  }
  error?: string
}

export interface AIInsightListItem {
  id: string
  transaction_id: string
  organization_id: string
  line_number: number
  insight_type: AIInsightType
  insight_category: AIInsightCategory
  insight_title: string
  insight_description: string
  confidence_score: number
  confidence_level: AIConfidenceLevel
  generated_at: string | Date
  smart_code: string
  data_points?: Record<string, any>
  recommendations?: AIRecommendation[]
  metadata?: Record<string, any>
}

// ============================================================================
// AI Smart Code Registry
// ============================================================================

export const AI_INSIGHT_SMART_CODES = {
  // Generation operations
  RUN: 'HERA.AI.INSIGHT.RUN.V3',
  GENERATE: 'HERA.AI.INSIGHT.GENERATE.V3',
  
  // Descriptive insights
  DESC_REVENUE_TREND: 'HERA.AI.INSIGHT.DESC.REVENUE.TREND.V3',
  DESC_COST_STRUCTURE: 'HERA.AI.INSIGHT.DESC.COST.STRUCTURE.V3',
  DESC_CUSTOMER_PROFITABILITY: 'HERA.AI.INSIGHT.DESC.CUSTOMER.PROFITABILITY.V3',
  DESC_DIMENSIONAL_ANALYSIS: 'HERA.AI.INSIGHT.DESC.DIMENSIONAL.ANALYSIS.V3',
  
  // Predictive insights
  PRED_REVENUE_FORECAST: 'HERA.AI.INSIGHT.PRED.REVENUE.FORECAST.V3',
  PRED_COST_VARIANCE: 'HERA.AI.INSIGHT.PRED.COST.VARIANCE.V3',
  PRED_DEMAND_PREDICTION: 'HERA.AI.INSIGHT.PRED.DEMAND.PREDICTION.V3',
  PRED_RISK_ASSESSMENT: 'HERA.AI.INSIGHT.PRED.RISK.ASSESSMENT.V3',
  
  // Prescriptive insights
  PRESC_PROFIT_OPTIMIZATION: 'HERA.AI.INSIGHT.PRESC.PROFIT.OPTIMIZATION.V3',
  PRESC_RESOURCE_ALLOCATION: 'HERA.AI.INSIGHT.PRESC.RESOURCE.ALLOCATION.V3',
  PRESC_COST_REDUCTION: 'HERA.AI.INSIGHT.PRESC.COST.REDUCTION.V3',
  PRESC_STRATEGY_RECOMMENDATION: 'HERA.AI.INSIGHT.PRESC.STRATEGY.RECOMMENDATION.V3',
  
  // Autonomous insights
  AUTO_POLICY_UPDATE: 'HERA.AI.INSIGHT.AUTO.POLICY.UPDATE.V3',
  AUTO_ALERT_CONFIGURATION: 'HERA.AI.INSIGHT.AUTO.ALERT.CONFIGURATION.V3',
  AUTO_WORKFLOW_OPTIMIZATION: 'HERA.AI.INSIGHT.AUTO.WORKFLOW.OPTIMIZATION.V3',
  AUTO_AUTONOMOUS_DECISION: 'HERA.AI.INSIGHT.AUTO.AUTONOMOUS.DECISION.V3',
  
  // Generic by type
  DESCRIPTIVE: 'HERA.AI.INSIGHT.DESC.V3',
  PREDICTIVE: 'HERA.AI.INSIGHT.PRED.V3',
  PRESCRIPTIVE: 'HERA.AI.INSIGHT.PRESC.V3',
  AUTONOMOUS: 'HERA.AI.INSIGHT.AUTO.V3'
} as const

// ============================================================================
// AI Error Codes
// ============================================================================

export const AI_ERROR_CODES = {
  // Validation errors
  ORG_NOT_FOUND: 'AI_ORG_NOT_FOUND',
  PERIOD_INVALID: 'AI_PERIOD_INVALID',
  INSIGHT_TYPE_INVALID: 'AI_INSIGHT_TYPE_INVALID',
  INTELLIGENCE_LEVEL_INVALID: 'AI_INTELLIGENCE_LEVEL_INVALID',
  
  // Data errors
  INSUFFICIENT_DATA: 'AI_INSUFFICIENT_DATA',
  DATA_QUALITY_LOW: 'AI_DATA_QUALITY_LOW',
  FEATURE_EXTRACTION_FAILED: 'AI_FEATURE_EXTRACTION_FAILED',
  
  // Processing errors
  GENERATION_FAILED: 'AI_GENERATION_FAILED',
  MODEL_UNAVAILABLE: 'AI_MODEL_UNAVAILABLE',
  PROCESSING_TIMEOUT: 'AI_PROCESSING_TIMEOUT',
  CONFIDENCE_TOO_LOW: 'AI_CONFIDENCE_TOO_LOW',
  
  // System errors
  DATABASE_ERROR: 'AI_DATABASE_ERROR',
  PERSISTENCE_FAILED: 'AI_PERSISTENCE_FAILED',
  QUERY_FAILED: 'AI_QUERY_FAILED',
  UNAUTHORIZED: 'AI_UNAUTHORIZED'
} as const

// ============================================================================
// Validation Functions
// ============================================================================

export function validateInsightType(type: string): type is AIInsightType {
  return ['DESCRIPTIVE', 'PREDICTIVE', 'PRESCRIPTIVE', 'AUTONOMOUS'].includes(type)
}

export function validateIntelligenceLevel(level: number): level is AIIntelligenceLevel {
  return Number.isInteger(level) && level >= 1 && level <= 4
}

export function validatePeriod(period: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!period) {
    errors.push('Period is required')
    return { valid: false, errors }
  }
  
  // Check format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(period)) {
    errors.push('Period must be in YYYY-MM format')
  }
  
  // Check valid month
  const [year, month] = period.split('-').map(Number)
  if (month < 1 || month > 12) {
    errors.push('Month must be between 01 and 12')
  }
  
  // Check reasonable year range
  const currentYear = new Date().getFullYear()
  if (year < 2020 || year > currentYear + 2) {
    errors.push(`Year must be between 2020 and ${currentYear + 2}`)
  }
  
  return { valid: errors.length === 0, errors }
}

export function validateConfidenceScore(score: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (typeof score !== 'number') {
    errors.push('Confidence score must be a number')
    return { valid: false, errors }
  }
  
  if (score < 0 || score > 1) {
    errors.push('Confidence score must be between 0.0 and 1.0')
  }
  
  return { valid: errors.length === 0, errors }
}

export function validateAIInsightGenerationRequest(
  request: AIInsightGenerationRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate organization_id
  if (!request.organization_id) {
    errors.push('organization_id is required')
  }
  
  // Validate period format if provided
  if (request.period) {
    const periodValidation = validatePeriod(request.period)
    if (!periodValidation.valid) {
      errors.push(...periodValidation.errors)
    }
  }
  
  // Validate insight types
  if (request.insight_types) {
    for (const type of request.insight_types) {
      if (!validateInsightType(type)) {
        errors.push(`Invalid insight type: ${type}`)
      }
    }
  }
  
  // Validate intelligence level
  if (request.intelligence_level !== undefined) {
    if (!validateIntelligenceLevel(request.intelligence_level)) {
      errors.push('Intelligence level must be 1, 2, 3, or 4')
    }
  }
  
  // Validate confidence threshold
  if (request.confidence_threshold !== undefined) {
    const confidenceValidation = validateConfidenceScore(request.confidence_threshold)
    if (!confidenceValidation.valid) {
      errors.push(...confidenceValidation.errors)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getConfidenceLevel(score: number): AIConfidenceLevel {
  if (score >= 0.9) return 'VERY_HIGH'
  if (score >= 0.8) return 'HIGH'
  if (score >= 0.6) return 'MEDIUM'
  return 'LOW'
}

export function formatPeriod(date: Date): string {
  return date.toISOString().slice(0, 7) // YYYY-MM
}

export function getCurrentPeriod(): string {
  return formatPeriod(new Date())
}

export function getPreviousPeriod(period: string, months = 1): string {
  const [year, month] = period.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() - months)
  return formatPeriod(date)
}

export function getNextPeriod(period: string, months = 1): string {
  const [year, month] = period.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + months)
  return formatPeriod(date)
}

export function calculateProcessingMetrics(
  startTime: Date,
  endTime: Date,
  steps: { [key: string]: number }
): AIProcessingMetrics {
  const totalMs = endTime.getTime() - startTime.getTime()
  
  return {
    start_time: startTime.toISOString(),
    data_extraction_ms: steps.dataExtraction || 0,
    ai_processing_ms: steps.aiProcessing || 0,
    persistence_ms: steps.persistence || 0,
    total_processing_ms: totalMs
  }
}

export function generateInsightSummary(insights: AIInsight[]): string {
  const byType = insights.reduce((acc, insight) => {
    acc[insight.insight_type] = (acc[insight.insight_type] || 0) + 1
    return acc
  }, {} as Record<AIInsightType, number>)
  
  const totalInsights = insights.length
  const avgConfidence = insights.reduce((sum, i) => sum + i.confidence_score, 0) / totalInsights
  
  return `Generated ${totalInsights} insights with ${(avgConfidence * 100).toFixed(1)}% avg confidence: ` +
    Object.entries(byType).map(([type, count]) => `${count} ${type.toLowerCase()}`).join(', ')
}

// ============================================================================
// Default Values
// ============================================================================

export const AI_INSIGHT_DEFAULTS = {
  INTELLIGENCE_LEVEL: 1 as AIIntelligenceLevel,
  CONFIDENCE_THRESHOLD: 0.70,
  INSIGHT_TYPES: ['DESCRIPTIVE'] as AIInsightType[],
  QUERY_LIMIT: 50,
  QUERY_OFFSET: 0,
  PROCESSING_TIMEOUT_MS: 30000,
  CACHE_TTL_MINUTES: 15
} as const

// ============================================================================
// Export All Types
// ============================================================================

export type {
  AIInsightType,
  AIIntelligenceLevel,
  AIInsightCategory,
  AIConfidenceLevel,
  AIProcessingStatus,
  AIInsight,
  AIRecommendation,
  AIFeatureVector,
  AIProcessingMetrics,
  AIInsightGenerationRequest,
  AIInsightGenerationResult,
  AIInsightQuery,
  AIInsightQueryResult,
  AIInsightListItem
}