/**
 * HERA Finance DNA v3: AI Insights Engine Client SDK
 * 
 * Complete TypeScript client for AI insights operations with React hooks,
 * TanStack Query integration, and sub-second performance optimization.
 * Revolutionary self-optimizing ERP intelligence layer.
 * 
 * Smart Code: HERA.AI.INSIGHT.CLIENT.SDK.V3
 */

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiV2 } from '@/lib/client/fetchV2'
import {
  type AIInsightGenerationRequest,
  type AIInsightGenerationResult,
  type AIInsightQuery,
  type AIInsightQueryResult,
  type AIInsightListItem,
  type AIInsightType,
  type AIIntelligenceLevel,
  validateAIInsightGenerationRequest,
  AI_ERROR_CODES,
  AI_INSIGHT_SMART_CODES,
  AI_INSIGHT_DEFAULTS,
  getCurrentPeriod,
  getConfidenceLevel
} from './ai-insights-standard'

// ============================================================================
// Core AI Insights Client Class
// ============================================================================

export class AIInsightsClient {
  constructor(
    private organizationId: string,
    private queryClient?: QueryClient
  ) {}

  // ========================================================================
  // AI Insight Generation Operations
  // ========================================================================

  /**
   * Generate AI insights for a period
   */
  async generateInsights(request: Omit<AIInsightGenerationRequest, 'organization_id'>): Promise<AIInsightGenerationResult> {
    const fullRequest: AIInsightGenerationRequest = {
      organization_id: this.organizationId,
      period: getCurrentPeriod(),
      insight_types: AI_INSIGHT_DEFAULTS.INSIGHT_TYPES,
      intelligence_level: AI_INSIGHT_DEFAULTS.INTELLIGENCE_LEVEL,
      confidence_threshold: AI_INSIGHT_DEFAULTS.CONFIDENCE_THRESHOLD,
      dry_run: false,
      ...request
    }

    // Validate request
    const validation = validateAIInsightGenerationRequest(fullRequest)
    if (!validation.valid) {
      throw new Error(`Request validation failed: ${validation.errors.join(', ')}`)
    }

    const response = await apiV2.post('ai/insights/run', fullRequest)
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'AI insight generation failed')
    }
    
    // Invalidate related queries
    this.queryClient?.invalidateQueries({ 
      queryKey: ['ai-insights', this.organizationId] 
    })
    
    return response.data
  }

  /**
   * Generate descriptive insights only
   */
  async generateDescriptiveInsights(
    period?: string,
    options?: { dry_run?: boolean; confidence_threshold?: number }
  ): Promise<AIInsightGenerationResult> {
    return this.generateInsights({
      period: period || getCurrentPeriod(),
      insight_types: ['DESCRIPTIVE'],
      intelligence_level: 1,
      dry_run: options?.dry_run || false,
      confidence_threshold: options?.confidence_threshold
    })
  }

  /**
   * Generate predictive insights
   */
  async generatePredictiveInsights(
    period?: string,
    options?: { include_descriptive?: boolean; dry_run?: boolean }
  ): Promise<AIInsightGenerationResult> {
    const insightTypes: AIInsightType[] = ['PREDICTIVE']
    if (options?.include_descriptive) {
      insightTypes.unshift('DESCRIPTIVE')
    }

    return this.generateInsights({
      period: period || getCurrentPeriod(),
      insight_types: insightTypes,
      intelligence_level: 2,
      dry_run: options?.dry_run || false
    })
  }

  /**
   * Generate prescriptive insights with recommendations
   */
  async generatePrescriptiveInsights(
    period?: string,
    options?: { intelligence_level?: AIIntelligenceLevel; dry_run?: boolean }
  ): Promise<AIInsightGenerationResult> {
    return this.generateInsights({
      period: period || getCurrentPeriod(),
      insight_types: ['DESCRIPTIVE', 'PREDICTIVE', 'PRESCRIPTIVE'],
      intelligence_level: options?.intelligence_level || 3,
      dry_run: options?.dry_run || false
    })
  }

  /**
   * Generate all insight types including autonomous
   */
  async generateFullIntelligenceInsights(
    period?: string,
    options?: { dry_run?: boolean }
  ): Promise<AIInsightGenerationResult> {
    return this.generateInsights({
      period: period || getCurrentPeriod(),
      insight_types: ['DESCRIPTIVE', 'PREDICTIVE', 'PRESCRIPTIVE', 'AUTONOMOUS'],
      intelligence_level: 4,
      dry_run: options?.dry_run || false
    })
  }

  /**
   * Preview insights without persistence
   */
  async previewInsights(
    period?: string,
    insight_types?: AIInsightType[],
    intelligence_level?: AIIntelligenceLevel
  ): Promise<AIInsightGenerationResult> {
    return this.generateInsights({
      period: period || getCurrentPeriod(),
      insight_types: insight_types || ['DESCRIPTIVE'],
      intelligence_level: intelligence_level || 1,
      dry_run: true,
      include_preview: true
    })
  }

  // ========================================================================
  // AI Insight Query Operations
  // ========================================================================

  /**
   * Query AI insights with filters
   */
  async queryInsights(query: Omit<AIInsightQuery, 'organization_id'>): Promise<AIInsightQueryResult> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      limit: String(query.limit || AI_INSIGHT_DEFAULTS.QUERY_LIMIT),
      offset: String(query.offset || AI_INSIGHT_DEFAULTS.QUERY_OFFSET),
      sort_by: query.sort_by || 'generated_at',
      sort_order: query.sort_order || 'DESC',
      include_metadata: String(query.include_metadata !== false)
    })
    
    // Add optional filters
    if (query.period) params.set('period', query.period)
    if (query.insight_types) params.set('insight_types', query.insight_types.join(','))
    if (query.categories) params.set('categories', query.categories.join(','))
    if (query.confidence_min) params.set('confidence_min', String(query.confidence_min))
    
    const response = await apiV2.get(`ai/insights?${params}`)
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'AI insights query failed')
    }
    
    return response.data
  }

  /**
   * Get recent insights
   */
  async getRecentInsights(
    limit = 20,
    insight_types?: AIInsightType[]
  ): Promise<AIInsightListItem[]> {
    const result = await this.queryInsights({
      limit,
      insight_types,
      sort_by: 'generated_at',
      sort_order: 'DESC'
    })
    
    return result.data || []
  }

  /**
   * Get insights for specific period
   */
  async getInsightsByPeriod(
    period: string,
    insight_types?: AIInsightType[]
  ): Promise<AIInsightListItem[]> {
    const result = await this.queryInsights({
      period,
      insight_types,
      limit: 100,
      sort_by: 'confidence_score',
      sort_order: 'DESC'
    })
    
    return result.data || []
  }

  /**
   * Get high-confidence insights
   */
  async getHighConfidenceInsights(
    period?: string,
    confidence_min = 0.8
  ): Promise<AIInsightListItem[]> {
    const result = await this.queryInsights({
      period,
      confidence_min,
      limit: 50,
      sort_by: 'confidence_score',
      sort_order: 'DESC'
    })
    
    return result.data || []
  }

  /**
   * Get prescriptive insights with recommendations
   */
  async getPrescriptiveInsights(period?: string): Promise<AIInsightListItem[]> {
    const result = await this.queryInsights({
      period,
      insight_types: ['PRESCRIPTIVE'],
      limit: 25,
      sort_by: 'confidence_score',
      sort_order: 'DESC'
    })
    
    return result.data || []
  }

  // ========================================================================
  // Analytics & Summary Operations
  // ========================================================================

  /**
   * Get insights summary for dashboard
   */
  async getInsightsSummary(period?: string): Promise<{
    total_insights: number
    by_type: Record<AIInsightType, number>
    avg_confidence: number
    high_confidence_count: number
    recent_run_id?: string
    last_generated_at?: string
  }> {
    const insights = await this.getInsightsByPeriod(period || getCurrentPeriod())
    
    const byType = insights.reduce((acc, insight) => {
      acc[insight.insight_type] = (acc[insight.insight_type] || 0) + 1
      return acc
    }, {} as Record<AIInsightType, number>)
    
    const avgConfidence = insights.length > 0 
      ? insights.reduce((sum, i) => sum + i.confidence_score, 0) / insights.length
      : 0
    
    const highConfidenceCount = insights.filter(i => i.confidence_score >= 0.8).length
    
    // Get most recent insight for metadata
    const mostRecent = insights[0]
    
    return {
      total_insights: insights.length,
      by_type: byType,
      avg_confidence: Math.round(avgConfidence * 100) / 100,
      high_confidence_count: highConfidenceCount,
      recent_run_id: mostRecent?.transaction_id,
      last_generated_at: mostRecent?.generated_at.toString()
    }
  }

  /**
   * Get insight trends over time
   */
  async getInsightTrends(periods: string[]): Promise<{
    period: string
    total_insights: number
    avg_confidence: number
    by_type: Record<AIInsightType, number>
  }[]> {
    const trendsPromises = periods.map(async period => {
      const insights = await this.getInsightsByPeriod(period)
      
      const byType = insights.reduce((acc, insight) => {
        acc[insight.insight_type] = (acc[insight.insight_type] || 0) + 1
        return acc
      }, {} as Record<AIInsightType, number>)
      
      const avgConfidence = insights.length > 0 
        ? insights.reduce((sum, i) => sum + i.confidence_score, 0) / insights.length
        : 0
      
      return {
        period,
        total_insights: insights.length,
        avg_confidence: Math.round(avgConfidence * 100) / 100,
        by_type: byType
      }
    })
    
    return Promise.all(trendsPromises)
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to get AI insights client instance
 */
export function useAIInsightsClient(organizationId: string) {
  const queryClient = useQueryClient()
  return new AIInsightsClient(organizationId, queryClient)
}

/**
 * Hook for generating AI insights
 */
export function useGenerateInsights(organizationId: string) {
  const client = useAIInsightsClient(organizationId)
  
  return useMutation({
    mutationFn: (request: Omit<AIInsightGenerationRequest, 'organization_id'>) => 
      client.generateInsights(request),
    onSuccess: () => {
      // Invalidate insights data
      client.queryClient?.invalidateQueries({ 
        queryKey: ['ai-insights', organizationId] 
      })
    }
  })
}

/**
 * Hook for generating descriptive insights only
 */
export function useGenerateDescriptiveInsights(organizationId: string) {
  const client = useAIInsightsClient(organizationId)
  
  return useMutation({
    mutationFn: ({ period, options }: { 
      period?: string; 
      options?: { dry_run?: boolean; confidence_threshold?: number } 
    }) => client.generateDescriptiveInsights(period, options),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['ai-insights', organizationId] 
      })
    }
  })
}

/**
 * Hook for generating predictive insights
 */
export function useGeneratePredictiveInsights(organizationId: string) {
  const client = useAIInsightsClient(organizationId)
  
  return useMutation({
    mutationFn: ({ period, options }: { 
      period?: string; 
      options?: { include_descriptive?: boolean; dry_run?: boolean } 
    }) => client.generatePredictiveInsights(period, options),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['ai-insights', organizationId] 
      })
    }
  })
}

/**
 * Hook for generating prescriptive insights
 */
export function useGeneratePrescriptiveInsights(organizationId: string) {
  const client = useAIInsightsClient(organizationId)
  
  return useMutation({
    mutationFn: ({ period, options }: { 
      period?: string; 
      options?: { intelligence_level?: AIIntelligenceLevel; dry_run?: boolean } 
    }) => client.generatePrescriptiveInsights(period, options),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['ai-insights', organizationId] 
      })
    }
  })
}

/**
 * Hook for generating full intelligence insights
 */
export function useGenerateFullIntelligenceInsights(organizationId: string) {
  const client = useAIInsightsClient(organizationId)
  
  return useMutation({
    mutationFn: ({ period, options }: { 
      period?: string; 
      options?: { dry_run?: boolean } 
    }) => client.generateFullIntelligenceInsights(period, options),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['ai-insights', organizationId] 
      })
    }
  })
}

/**
 * Hook for previewing insights
 */
export function usePreviewInsights(organizationId: string) {
  return useMutation({
    mutationFn: ({ period, insight_types, intelligence_level }: {
      period?: string;
      insight_types?: AIInsightType[];
      intelligence_level?: AIIntelligenceLevel;
    }) => {
      const client = new AIInsightsClient(organizationId)
      return client.previewInsights(period, insight_types, intelligence_level)
    }
  })
}

/**
 * Hook for querying AI insights
 */
export function useAIInsights(
  organizationId: string,
  query: Omit<AIInsightQuery, 'organization_id'> = {},
  options?: { enabled?: boolean }
) {
  const client = useAIInsightsClient(organizationId)
  
  return useQuery({
    queryKey: ['ai-insights', organizationId, query],
    queryFn: () => client.queryInsights(query),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES * 60 * 1000,
    cacheTime: (AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES + 5) * 60 * 1000
  })
}

/**
 * Hook for recent insights
 */
export function useRecentInsights(
  organizationId: string,
  limit = 20,
  insight_types?: AIInsightType[],
  options?: { enabled?: boolean }
) {
  const client = useAIInsightsClient(organizationId)
  
  return useQuery({
    queryKey: ['ai-insights-recent', organizationId, limit, insight_types],
    queryFn: () => client.getRecentInsights(limit, insight_types),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes for recent data
    cacheTime: 10 * 60 * 1000
  })
}

/**
 * Hook for insights by period
 */
export function useInsightsByPeriod(
  organizationId: string,
  period: string,
  insight_types?: AIInsightType[],
  options?: { enabled?: boolean }
) {
  const client = useAIInsightsClient(organizationId)
  
  return useQuery({
    queryKey: ['ai-insights-period', organizationId, period, insight_types],
    queryFn: () => client.getInsightsByPeriod(period, insight_types),
    enabled: !!organizationId && !!period && (options?.enabled !== false),
    staleTime: AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES * 60 * 1000,
    cacheTime: (AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES + 5) * 60 * 1000
  })
}

/**
 * Hook for high confidence insights
 */
export function useHighConfidenceInsights(
  organizationId: string,
  period?: string,
  confidence_min = 0.8,
  options?: { enabled?: boolean }
) {
  const client = useAIInsightsClient(organizationId)
  
  return useQuery({
    queryKey: ['ai-insights-high-confidence', organizationId, period, confidence_min],
    queryFn: () => client.getHighConfidenceInsights(period, confidence_min),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES * 60 * 1000,
    cacheTime: (AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES + 5) * 60 * 1000
  })
}

/**
 * Hook for prescriptive insights with recommendations
 */
export function usePrescriptiveInsights(
  organizationId: string,
  period?: string,
  options?: { enabled?: boolean }
) {
  const client = useAIInsightsClient(organizationId)
  
  return useQuery({
    queryKey: ['ai-insights-prescriptive', organizationId, period],
    queryFn: () => client.getPrescriptiveInsights(period),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES * 60 * 1000,
    cacheTime: (AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES + 5) * 60 * 1000
  })
}

/**
 * Hook for insights summary
 */
export function useInsightsSummary(
  organizationId: string,
  period?: string,
  options?: { enabled?: boolean }
) {
  const client = useAIInsightsClient(organizationId)
  
  return useQuery({
    queryKey: ['ai-insights-summary', organizationId, period],
    queryFn: () => client.getInsightsSummary(period),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 10 * 60 * 1000, // 10 minutes for summary data
    cacheTime: 15 * 60 * 1000
  })
}

/**
 * Hook for insight trends
 */
export function useInsightTrends(
  organizationId: string,
  periods: string[],
  options?: { enabled?: boolean }
) {
  const client = useAIInsightsClient(organizationId)
  
  return useQuery({
    queryKey: ['ai-insights-trends', organizationId, periods],
    queryFn: () => client.getInsightTrends(periods),
    enabled: !!organizationId && periods.length > 0 && (options?.enabled !== false),
    staleTime: AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES * 60 * 1000,
    cacheTime: (AI_INSIGHT_DEFAULTS.CACHE_TTL_MINUTES + 10) * 60 * 1000
  })
}

// ============================================================================
// Export All
// ============================================================================

export {
  AI_ERROR_CODES,
  AI_INSIGHT_SMART_CODES,
  AI_INSIGHT_DEFAULTS,
  getConfidenceLevel
}

export type {
  AIInsightGenerationRequest,
  AIInsightGenerationResult,
  AIInsightQuery,
  AIInsightQueryResult,
  AIInsightListItem,
  AIInsightType,
  AIIntelligenceLevel
}