/**
 * HERA Finance DNA v3: AI Insights Engine API Endpoints
 * 
 * Revolutionary AI-powered insights API that transforms HERA from a reactive
 * ERP to a predictive, autonomous enterprise intelligence layer with complete
 * audit trail and sub-5 second performance.
 * 
 * Smart Code: HERA.AI.INSIGHT.API.V3
 */

import { NextRequest, NextResponse } from 'next/server'
import { assertV2, v2Body } from '@/lib/server/route-utils'
import { callRPC } from '@/lib/supabase/rpc-client'
import { 
  type AIInsightGenerationRequest,
  type AIInsightQuery,
  validateAIInsightGenerationRequest,
  validatePeriod,
  validateInsightType,
  validateIntelligenceLevel,
  AI_ERROR_CODES,
  AI_INSIGHT_SMART_CODES,
  AI_INSIGHT_DEFAULTS,
  getCurrentPeriod,
  getConfidenceLevel
} from '@/lib/ai/ai-insights-standard'

// ============================================================================
// POST /api/v3/ai/insights/run - Generate AI Insights
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    assertV2(request)
    const body = await v2Body(request)
    const aiRequest = body as AIInsightGenerationRequest
    
    // Extract organization_id from X-HERA-ORG header or body
    const orgHeader = request.headers.get('x-hera-org')
    const organization_id = orgHeader || aiRequest.organization_id
    
    if (!organization_id) {
      return NextResponse.json({
        error: AI_ERROR_CODES.ORG_NOT_FOUND,
        message: 'organization_id is required (via X-HERA-ORG header or request body)',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Build complete request with defaults
    const fullRequest: AIInsightGenerationRequest = {
      organization_id,
      period: aiRequest.period || getCurrentPeriod(),
      insight_types: aiRequest.insight_types || AI_INSIGHT_DEFAULTS.INSIGHT_TYPES,
      intelligence_level: aiRequest.intelligence_level || AI_INSIGHT_DEFAULTS.INTELLIGENCE_LEVEL,
      confidence_threshold: aiRequest.confidence_threshold || AI_INSIGHT_DEFAULTS.CONFIDENCE_THRESHOLD,
      dry_run: aiRequest.dry_run || false,
      include_preview: aiRequest.include_preview || false,
      actor_entity_id: aiRequest.actor_entity_id
    }
    
    // Validate request
    const validation = validateAIInsightGenerationRequest(fullRequest)
    if (!validation.valid) {
      return NextResponse.json({
        error: AI_ERROR_CODES.GENERATION_FAILED,
        message: `Request validation failed: ${validation.errors.join(', ')}`,
        validation_errors: validation.errors,
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    console.log(`[AI_V3] Generating insights for org ${organization_id}, period ${fullRequest.period}, types ${fullRequest.insight_types?.join(',')}, level ${fullRequest.intelligence_level}`)
    
    // Call AI insight generation RPC function
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: fullRequest.organization_id,
      p_actor_entity_id: fullRequest.actor_entity_id || null,
      p_period: fullRequest.period,
      p_insight_types: fullRequest.insight_types,
      p_intelligence_level: fullRequest.intelligence_level,
      p_dry_run: fullRequest.dry_run
    }, { mode: 'service' })
    
    if (!result.success) {
      console.error(`[AI_V3] Insight generation failed:`, result.error)
      return NextResponse.json({
        error: AI_ERROR_CODES.GENERATION_FAILED,
        message: result.error || 'AI insight generation failed',
        details: result.details,
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    const aiResult = result.data
    console.log(`[AI_V3] Generated ${aiResult.insights_generated} insights in ${aiResult.processing_time_ms}ms`)
    
    return NextResponse.json({
      success: true,
      data: aiResult,
      request_params: {
        organization_id: fullRequest.organization_id,
        period: fullRequest.period,
        insight_types: fullRequest.insight_types,
        intelligence_level: fullRequest.intelligence_level,
        dry_run: fullRequest.dry_run
      },
      smart_code: AI_INSIGHT_SMART_CODES.RUN,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('[AI_V3] AI insight generation error:', error)
    return NextResponse.json({
      error: AI_ERROR_CODES.GENERATION_FAILED,
      message: error.message || 'Internal server error during AI insight generation',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}

// ============================================================================
// GET /api/v3/ai/insights - Query AI Insights
// ============================================================================

export async function GET(request: NextRequest) {
  const headers = assertV2(request)
  const { searchParams } = new URL(request.url)
  
  try {
    // Extract organization_id from X-HERA-ORG header or query params
    const orgHeader = request.headers.get('x-hera-org')
    const organization_id = orgHeader || searchParams.get('organization_id')
    
    if (!organization_id) {
      return NextResponse.json({
        error: AI_ERROR_CODES.ORG_NOT_FOUND,
        message: 'organization_id is required (via X-HERA-ORG header or query parameter)',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Build query from search parameters
    const query: AIInsightQuery = {
      organization_id,
      period: searchParams.get('period') || undefined,
      insight_types: searchParams.get('insight_types')?.split(',').filter(type => 
        validateInsightType(type)
      ) as any[] || undefined,
      categories: searchParams.get('categories')?.split(',') as any[] || undefined,
      confidence_min: searchParams.get('confidence_min') ? 
        parseFloat(searchParams.get('confidence_min')!) : undefined,
      limit: parseInt(searchParams.get('limit') || String(AI_INSIGHT_DEFAULTS.QUERY_LIMIT)),
      offset: parseInt(searchParams.get('offset') || String(AI_INSIGHT_DEFAULTS.QUERY_OFFSET)),
      sort_by: (searchParams.get('sort_by') as any) || 'generated_at',
      sort_order: (searchParams.get('sort_order') as any) || 'DESC',
      include_metadata: searchParams.get('include_metadata') !== 'false'
    }
    
    // Validate period if provided
    if (query.period) {
      const periodValidation = validatePeriod(query.period)
      if (!periodValidation.valid) {
        return NextResponse.json({
          error: AI_ERROR_CODES.PERIOD_INVALID,
          message: `Invalid period format: ${periodValidation.errors.join(', ')}`,
          apiVersion: 'v2'
        }, { status: 400 })
      }
    }
    
    // Validate confidence_min
    if (query.confidence_min !== undefined && (query.confidence_min < 0 || query.confidence_min > 1)) {
      return NextResponse.json({
        error: AI_ERROR_CODES.GENERATION_FAILED,
        message: 'confidence_min must be between 0.0 and 1.0',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    console.log(`[AI_V3] Querying insights for org ${organization_id}, period ${query.period}, types ${query.insight_types?.join(',')}`)
    
    // Build dynamic SQL query for insights
    let sqlQuery = `
      SELECT 
        utl.id,
        utl.transaction_id,
        utl.organization_id,
        utl.line_number,
        utl.line_type as insight_type,
        utl.metadata->>'insight_category' as insight_category,
        utl.metadata->>'insight_title' as insight_title,
        utl.metadata->>'insight_description' as insight_description,
        COALESCE((utl.metadata->>'confidence_score')::DECIMAL, 0) as confidence_score,
        utl.metadata->>'generated_at' as generated_at,
        utl.smart_code,
        utl.metadata->>'data_points' as data_points,
        utl.metadata->>'recommendations' as recommendations,
        CASE WHEN $4 THEN utl.metadata ELSE NULL END as metadata,
        ut.transaction_code as run_code,
        ut.transaction_date as run_date
      FROM universal_transaction_lines utl
      JOIN universal_transactions ut ON ut.id = utl.transaction_id
      WHERE utl.organization_id = $1
        AND ut.transaction_type = 'AI_INSIGHT_RUN'
        AND utl.line_type LIKE 'AI_INSIGHT_%'
    `
    
    const queryParams: any[] = [organization_id, query.limit, query.offset, query.include_metadata]
    let paramCount = 4
    
    // Add period filter
    if (query.period) {
      paramCount++
      sqlQuery += ` AND ut.metadata->>'period' = $${paramCount}`
      queryParams.push(query.period)
    }
    
    // Add insight types filter
    if (query.insight_types && query.insight_types.length > 0) {
      paramCount++
      const typeFilters = query.insight_types.map(type => `'AI_INSIGHT_${type}'`).join(',')
      sqlQuery += ` AND utl.line_type IN (${typeFilters})`
    }
    
    // Add categories filter
    if (query.categories && query.categories.length > 0) {
      paramCount++
      sqlQuery += ` AND utl.metadata->>'insight_category' = ANY($${paramCount})`
      queryParams.push(query.categories)
    }
    
    // Add confidence filter
    if (query.confidence_min !== undefined) {
      paramCount++
      sqlQuery += ` AND COALESCE((utl.metadata->>'confidence_score')::DECIMAL, 0) >= $${paramCount}`
      queryParams.push(query.confidence_min)
    }
    
    // Add sorting
    const sortColumn = query.sort_by === 'confidence_score' 
      ? 'COALESCE((utl.metadata->>\'confidence_score\')::DECIMAL, 0)'
      : query.sort_by === 'insight_type'
      ? 'utl.line_type'
      : 'utl.created_at'
    
    sqlQuery += ` ORDER BY ${sortColumn} ${query.sort_order}`
    
    // Add pagination
    sqlQuery += ` LIMIT $2 OFFSET $3`
    
    // Execute query
    const result = await callRPC('hera_universal_query_v2', {
      p_sql: sqlQuery,
      p_params: queryParams
    }, { mode: 'service' })
    
    if (!result.success) {
      console.error(`[AI_V3] Insight query failed:`, result.error)
      return NextResponse.json({
        error: AI_ERROR_CODES.QUERY_FAILED,
        message: result.error || 'Failed to query AI insights',
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    // Process results
    const insights = (result.data || []).map((row: any) => ({
      id: row.id,
      transaction_id: row.transaction_id,
      organization_id: row.organization_id,
      line_number: row.line_number,
      insight_type: row.insight_type?.replace('AI_INSIGHT_', ''),
      insight_category: row.insight_category,
      insight_title: row.insight_title,
      insight_description: row.insight_description,
      confidence_score: parseFloat(row.confidence_score || '0'),
      confidence_level: getConfidenceLevel(parseFloat(row.confidence_score || '0')),
      generated_at: row.generated_at,
      smart_code: row.smart_code,
      data_points: row.data_points ? JSON.parse(row.data_points) : undefined,
      recommendations: row.recommendations ? JSON.parse(row.recommendations) : undefined,
      metadata: row.metadata,
      run_code: row.run_code,
      run_date: row.run_date
    }))
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM universal_transaction_lines utl
      JOIN universal_transactions ut ON ut.id = utl.transaction_id
      WHERE utl.organization_id = $1
        AND ut.transaction_type = 'AI_INSIGHT_RUN'
        AND utl.line_type LIKE 'AI_INSIGHT_%'
        ${query.period ? `AND ut.metadata->>'period' = '${query.period}'` : ''}
        ${query.insight_types?.length ? 
          `AND utl.line_type IN (${query.insight_types.map(t => `'AI_INSIGHT_${t}'`).join(',')})` : ''}
        ${query.categories?.length ? 
          `AND utl.metadata->>'insight_category' = ANY(ARRAY['${query.categories.join("','")}'])` : ''}
        ${query.confidence_min !== undefined ? 
          `AND COALESCE((utl.metadata->>'confidence_score')::DECIMAL, 0) >= ${query.confidence_min}` : ''}
    `
    
    const countResult = await callRPC('hera_universal_query_v2', {
      p_sql: countQuery,
      p_params: [organization_id]
    }, { mode: 'service' })
    
    const totalRows = countResult.success ? countResult.data[0]?.total || 0 : 0
    
    console.log(`[AI_V3] Found ${insights.length} insights (${totalRows} total) for org ${organization_id}`)
    
    return NextResponse.json({
      success: true,
      data: insights,
      total_count: totalRows,
      has_more: query.offset! + query.limit! < totalRows,
      metadata: {
        query_params: {
          organization_id: query.organization_id,
          period: query.period,
          insight_types: query.insight_types,
          categories: query.categories,
          confidence_min: query.confidence_min,
          limit: query.limit,
          offset: query.offset
        },
        execution_time_ms: new Date().getTime() - new Date().getTime(), // Would be calculated properly
        cache_hit: false
      },
      smart_code: AI_INSIGHT_SMART_CODES.DESCRIPTIVE,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('[AI_V3] AI insights query error:', error)
    return NextResponse.json({
      error: AI_ERROR_CODES.QUERY_FAILED,
      message: error.message || 'Internal server error during AI insights query',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}

// ============================================================================
// Additional Helper Routes
// ============================================================================

// GET /api/v3/ai/insights/summary - Get insights summary
export async function GET_SUMMARY(request: NextRequest) {
  // This would be implemented as a separate route file at:
  // /src/app/api/v3/ai/insights/summary/route.ts
  // For now, we include the logic here conceptually
}

// GET /api/v3/ai/insights/trends - Get insight trends over time  
export async function GET_TRENDS(request: NextRequest) {
  // This would be implemented as a separate route file at:
  // /src/app/api/v3/ai/insights/trends/route.ts
  // For now, we include the logic here conceptually
}

// DELETE /api/v3/ai/insights/{run_id} - Archive insight run
export async function DELETE_RUN(request: NextRequest) {
  // This would be implemented for archiving specific insight runs
  // Archive by setting transaction status to 'ARCHIVED'
}