/**
 * HERA Finance DNA v3.3: Dynamic Planning & Forecasting API Endpoints
 * 
 * RESTful API for dynamic planning and forecasting with AI-driven insights,
 * rolling horizon planning, and complete audit trail integration.
 * 
 * Smart Code: HERA.PLAN.API.V3
 */

import { NextRequest, NextResponse } from 'next/server'
import { assertV2, v2Body, callRPC } from '@/lib/server/index'
import type { 
  PlanGenerationRequest, 
  PlanRefreshRequest, 
  PlanVarianceRequest, 
  PlanApprovalRequest,
  PlanQuery,
  VarianceQuery
} from '@/lib/planning/planning-client-v3'

// ============================================================================
// POST /api/v3/planning - Universal Planning Operations
// ============================================================================

export async function POST(request: NextRequest) {
  const headers = assertV2(request)
  
  try {
    const body = await v2Body(request)
    const orgHeader = request.headers.get('x-hera-org')
    const organization_id = orgHeader || body.organization_id
    
    if (!organization_id) {
      return NextResponse.json(
        { 
          error_code: 'MISSING_ORGANIZATION_ID',
          error_message: 'Organization ID required in header or body'
        },
        { status: 400 }
      )
    }

    // Route to specific planning operation based on action
    const action = body.action || 'generate'
    
    switch (action) {
      case 'generate':
        return handlePlanGeneration(organization_id, body as PlanGenerationRequest)
        
      case 'refresh':
        return handlePlanRefresh(organization_id, body as PlanRefreshRequest)
        
      case 'variance':
        return handleVarianceAnalysis(organization_id, body as PlanVarianceRequest)
        
      case 'approve':
        return handlePlanApproval(organization_id, body as PlanApprovalRequest)
        
      default:
        return NextResponse.json(
          {
            error_code: 'INVALID_ACTION',
            error_message: `Invalid planning action: ${action}. Supported: generate, refresh, variance, approve`
          },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Planning API error:', error)
    return NextResponse.json(
      {
        error_code: 'PLANNING_API_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown planning error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/v3/planning - Query Planning Data
// ============================================================================

export async function GET(request: NextRequest) {
  const headers = assertV2(request)
  
  try {
    const { searchParams } = new URL(request.url)
    const orgHeader = request.headers.get('x-hera-org')
    const organization_id = orgHeader || searchParams.get('organization_id')
    
    if (!organization_id) {
      return NextResponse.json(
        {
          error_code: 'MISSING_ORGANIZATION_ID',
          error_message: 'Organization ID required in header or query parameter'
        },
        { status: 400 }
      )
    }

    // Determine query type
    const queryType = searchParams.get('type') || 'facts'
    
    switch (queryType) {
      case 'facts':
        return handlePlanFactsQuery(organization_id, searchParams)
        
      case 'variance':
        return handleVarianceQuery(organization_id, searchParams)
        
      case 'dashboard':
        return handleDashboardQuery(organization_id, searchParams)
        
      case 'plans':
        return handlePlansQuery(organization_id, searchParams)
        
      default:
        return NextResponse.json(
          {
            error_code: 'INVALID_QUERY_TYPE',
            error_message: `Invalid query type: ${queryType}. Supported: facts, variance, dashboard, plans`
          },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Planning query error:', error)
    return NextResponse.json(
      {
        error_code: 'PLANNING_QUERY_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown query error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Plan Generation Handler
// ============================================================================

async function handlePlanGeneration(
  organizationId: string, 
  request: PlanGenerationRequest
): Promise<NextResponse> {
  
  const result = await callRPC('hera_plan_generate_v3', {
    p_organization_id: organizationId,
    p_actor_entity_id: organizationId, // Would be actual user entity in real app
    p_plan_metadata: request.plan_metadata || {},
    p_plan_type: request.plan_type || 'FORECAST',
    p_horizon_months: request.horizon_months || 12,
    p_driver_policy: request.driver_policy || null,
    p_dry_run: request.dry_run || false
  }, { mode: 'service' })

  if (!result.success) {
    return NextResponse.json(
      {
        error_code: result.error_code || 'PLAN_GENERATION_FAILED',
        error_message: result.error_message || 'Plan generation failed',
        run_id: result.run_id,
        processing_time_ms: result.processing_time_ms
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    run_id: result.run_id,
    plan_entity_id: result.plan_entity_id,
    plan_type: result.plan_type,
    plan_version: result.plan_version,
    period_start: result.period_start,
    period_end: result.period_end,
    plan_lines_generated: result.plan_lines_generated,
    processing_time_ms: result.processing_time_ms,
    drivers_applied: result.drivers_applied,
    ai_insights_used: result.ai_insights_used,
    forecast_accuracy_mape: result.forecast_accuracy_mape,
    approval_required: result.approval_required,
    variance_guardrails: result.variance_guardrails,
    smart_code: result.smart_code,
    timestamp: new Date().toISOString()
  })
}

// ============================================================================
// Plan Refresh Handler
// ============================================================================

async function handlePlanRefresh(
  organizationId: string,
  request: PlanRefreshRequest
): Promise<NextResponse> {
  
  const result = await callRPC('hera_plan_refresh_v3', {
    p_organization_id: organizationId,
    p_plan_id: request.plan_id,
    p_refresh_horizon_months: request.refresh_horizon_months || 12,
    p_auto_approve_threshold_pct: request.auto_approve_threshold_pct || 5.0,
    p_include_ai_adjustments: request.include_ai_adjustments ?? true,
    p_actor_entity_id: organizationId,
    p_dry_run: request.dry_run || false
  }, { mode: 'service' })

  if (!result.success) {
    return NextResponse.json(
      {
        error_code: result.error_code || 'PLAN_REFRESH_FAILED',
        error_message: result.error_message || 'Plan refresh failed',
        refresh_run_id: result.refresh_run_id,
        processing_time_ms: result.processing_time_ms
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    refresh_run_id: result.refresh_run_id,
    plan_id: result.plan_id,
    refresh_summary: result.refresh_summary,
    approval_required: result.approval_required,
    dry_run: result.dry_run,
    smart_code: result.smart_code,
    timestamp: new Date().toISOString()
  })
}

// ============================================================================
// Variance Analysis Handler
// ============================================================================

async function handleVarianceAnalysis(
  organizationId: string,
  request: PlanVarianceRequest
): Promise<NextResponse> {
  
  const result = await callRPC('hera_plan_variance_v3', {
    p_organization_id: organizationId,
    p_plan_id: request.plan_id,
    p_actual_period: request.actual_period,
    p_variance_threshold_pct: request.variance_threshold_pct || 5.0,
    p_include_ai_explanation: request.include_ai_explanation ?? true,
    p_actor_entity_id: organizationId
  }, { mode: 'service' })

  if (!result.success) {
    return NextResponse.json(
      {
        error_code: result.error_code || 'VARIANCE_ANALYSIS_FAILED',
        error_message: result.error_message || 'Variance analysis failed',
        variance_run_id: result.variance_run_id,
        processing_time_ms: result.processing_time_ms
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    variance_run_id: result.variance_run_id,
    plan_id: result.plan_id,
    actual_period: result.actual_period,
    variance_summary: result.variance_summary,
    ai_explanations: result.ai_explanations,
    processing_time_ms: result.processing_time_ms,
    smart_code: result.smart_code,
    timestamp: new Date().toISOString()
  })
}

// ============================================================================
// Plan Approval Handler  
// ============================================================================

async function handlePlanApproval(
  organizationId: string,
  request: PlanApprovalRequest
): Promise<NextResponse> {
  
  const result = await callRPC('hera_plan_approve_v3', {
    p_organization_id: organizationId,
    p_plan_id: request.plan_id,
    p_approver_entity_id: organizationId, // Would be actual user entity in real app
    p_approval_action: request.approval_action,
    p_approval_comments: request.approval_comments || null,
    p_override_policy: request.override_policy || false
  }, { mode: 'service' })

  if (!result.success) {
    return NextResponse.json(
      {
        error_code: result.error_code || 'PLAN_APPROVAL_FAILED',
        error_message: result.error_message || 'Plan approval failed',
        approval_run_id: result.approval_run_id,
        processing_time_ms: result.processing_time_ms,
        policy_violations: result.policy_violations
      },
      { status: result.error_code === 'POLICY_VIOLATION' ? 403 : 500 }
    )
  }

  return NextResponse.json({
    success: true,
    approval_run_id: result.approval_run_id,
    plan_id: result.plan_id,
    approval_action: result.approval_action,
    approval_level: result.approval_level,
    required_approvals: result.required_approvals,
    approval_complete: result.approval_complete,
    new_plan_status: result.new_plan_status,
    processing_time_ms: result.processing_time_ms,
    smart_code: result.smart_code,
    timestamp: new Date().toISOString()
  })
}

// ============================================================================
// Plan vs Actual Facts Query Handler
// ============================================================================

async function handlePlanFactsQuery(
  organizationId: string,
  searchParams: URLSearchParams
): Promise<NextResponse> {
  
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const planType = searchParams.get('plan_type')
  const period = searchParams.get('period')
  const status = searchParams.get('status')
  
  // Build SQL query dynamically based on parameters
  let whereClause = 'WHERE org_id = $1'
  const params: any[] = [organizationId]
  let paramIndex = 2
  
  if (planType) {
    whereClause += ` AND plan_type = $${paramIndex}`
    params.push(planType)
    paramIndex++
  }
  
  if (period) {
    whereClause += ` AND period = $${paramIndex}`
    params.push(period)
    paramIndex++
  }
  
  if (status) {
    whereClause += ` AND plan_status = $${paramIndex}`
    params.push(status)
    paramIndex++
  }
  
  const query = `
    SELECT *
    FROM fact_plan_actual_v3 
    ${whereClause}
    ORDER BY period DESC, gl_account_code ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  params.push(limit, offset)
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM fact_plan_actual_v3 
    ${whereClause}
  `
  
  try {
    // Execute both queries
    const [dataResult, countResult] = await Promise.all([
      callRPC('hera_execute_query', { query, params }, { mode: 'service' }),
      callRPC('hera_execute_query', { query: countQuery, params: params.slice(0, -2) }, { mode: 'service' })
    ])
    
    return NextResponse.json({
      data: dataResult.data || [],
      total: countResult.data?.[0]?.total || 0,
      limit,
      offset,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        error_code: 'PLAN_FACTS_QUERY_ERROR',
        error_message: 'Failed to query plan vs actual facts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Variance Analysis Query Handler
// ============================================================================

async function handleVarianceQuery(
  organizationId: string,
  searchParams: URLSearchParams
): Promise<NextResponse> {
  
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const planId = searchParams.get('plan_id')
  const period = searchParams.get('period')
  const significantOnly = searchParams.get('significant_only') === 'true'
  
  let whereClause = 'WHERE organization_id = $1 AND transaction_type = \'VARIANCE_ANALYSIS\' AND status = \'COMPLETED\''
  const params: any[] = [organizationId]
  let paramIndex = 2
  
  if (planId) {
    whereClause += ` AND metadata->>'plan_id' = $${paramIndex}`
    params.push(planId)
    paramIndex++
  }
  
  if (period) {
    whereClause += ` AND metadata->>'actual_period' = $${paramIndex}`
    params.push(period)
    paramIndex++
  }
  
  const query = `
    SELECT 
      id as variance_run_id,
      metadata,
      created_at,
      transaction_code
    FROM universal_transactions 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  params.push(limit, offset)
  
  try {
    const result = await callRPC('hera_execute_query', { query, params }, { mode: 'service' })
    
    return NextResponse.json({
      data: result.data || [],
      total: result.data?.length || 0,
      limit,
      offset,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        error_code: 'VARIANCE_QUERY_ERROR',
        error_message: 'Failed to query variance analysis',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Dashboard Summary Query Handler
// ============================================================================

async function handleDashboardQuery(
  organizationId: string,
  searchParams: URLSearchParams
): Promise<NextResponse> {
  
  const period = searchParams.get('period') || new Date().toISOString().slice(0, 7)
  
  const query = `
    SELECT 
      org_id,
      period,
      COUNT(DISTINCT plan_entity_id) as total_plans,
      COUNT(CASE WHEN plan_status = 'APPROVED' AND plan_type = 'BUDGET' THEN 1 END) as active_budgets,
      COUNT(CASE WHEN plan_status = 'PENDING_APPROVAL' THEN 1 END) as pending_approvals,
      SUM(plan_amount) as total_plan_amount,
      SUM(actual_amount) as total_actual_amount,
      SUM(variance_amount) as total_variance_amount,
      ROUND(
        CASE 
          WHEN SUM(plan_amount) > 0 THEN (SUM(variance_amount) / SUM(plan_amount)) * 100
          ELSE 0
        END, 2
      ) as total_variance_pct,
      COUNT(CASE WHEN is_significant_variance THEN 1 END) as significant_variances,
      ROUND(AVG(revenue_achievement_pct), 2) as revenue_achievement_pct,
      ROUND(AVG(cost_efficiency_pct), 2) as cost_efficiency_pct,
      MAX(fact_last_updated) as last_refresh_date
    FROM fact_plan_actual_v3 
    WHERE org_id = $1 AND period = $2
    GROUP BY org_id, period
  `
  
  try {
    const result = await callRPC('hera_execute_query', {
      query,
      params: [organizationId, period]
    }, { mode: 'service' })
    
    const dashboardData = result.data?.[0] || {
      org_id: organizationId,
      period,
      total_plans: 0,
      active_budgets: 0,
      pending_approvals: 0,
      total_plan_amount: 0,
      total_actual_amount: 0,
      total_variance_amount: 0,
      total_variance_pct: 0,
      significant_variances: 0,
      revenue_achievement_pct: 0,
      cost_efficiency_pct: 0,
      last_refresh_date: null
    }
    
    return NextResponse.json({
      ...dashboardData,
      next_refresh_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        error_code: 'DASHBOARD_QUERY_ERROR',
        error_message: 'Failed to query dashboard summary',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Plans Query Handler
// ============================================================================

async function handlePlansQuery(
  organizationId: string,
  searchParams: URLSearchParams
): Promise<NextResponse> {
  
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const planType = searchParams.get('plan_type')
  const status = searchParams.get('status')
  
  let whereClause = 'WHERE organization_id = $1 AND entity_type = \'PLAN_VERSION\''
  const params: any[] = [organizationId]
  let paramIndex = 2
  
  if (planType) {
    whereClause += ` AND metadata->>'plan_type' = $${paramIndex}`
    params.push(planType)
    paramIndex++
  }
  
  if (status) {
    whereClause += ` AND metadata->>'status' = $${paramIndex}`
    params.push(status)
    paramIndex++
  }
  
  const query = `
    SELECT 
      id,
      entity_name,
      entity_code,
      metadata,
      created_at,
      updated_at
    FROM core_entities 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  
  params.push(limit, offset)
  
  try {
    const result = await callRPC('hera_execute_query', { query, params }, { mode: 'service' })
    
    return NextResponse.json({
      data: result.data || [],
      total: result.data?.length || 0,
      limit,
      offset,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        error_code: 'PLANS_QUERY_ERROR',
        error_message: 'Failed to query plans',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}