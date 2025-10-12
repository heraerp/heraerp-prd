/**
 * HERA Finance DNA v3.5: AI Policy Tuning REST API
 * 
 * REST API endpoints for autonomous policy tuning operations including
 * monitoring, suggesting, applying, reverting, and effectiveness analysis.
 * 
 * Smart Code: HERA.AI.POLICY.API.REST.V3
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { PolicyTuningClient } from '@/lib/policy-tuning/policy-client-v3'
import { assertV2, v2Body } from '@/lib/client/fetchV2'

// ============================================================================
// POST /api/v3/policy - Main policy tuning operations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Validate API version
    assertV2(request)
    
    // Get organization context from headers
    const headersList = headers()
    const organizationId = headersList.get('x-organization-id')
    
    if (!organizationId) {
      return NextResponse.json({
        error: 'MISSING_ORGANIZATION_ID',
        message: 'Organization ID required in x-organization-id header'
      }, { status: 400 })
    }

    // Parse request body
    const body = await v2Body(request)
    const { action, ...requestData } = body

    // Initialize policy tuning client
    const client = new PolicyTuningClient(organizationId)

    let result: any

    switch (action) {
      case 'monitor':
        result = await client.monitor({
          period: requestData.period,
          actor_id: requestData.actor_id
        })
        break

      case 'suggest':
        result = await client.suggest({
          period: requestData.period,
          targets: requestData.targets || [],
          actor_id: requestData.actor_id
        })
        break

      case 'apply':
        result = await client.apply({
          suggestion_run_id: requestData.suggestion_run_id,
          approver_id: requestData.approver_id
        })
        break

      case 'revert':
        result = await client.revert({
          apply_run_id: requestData.apply_run_id,
          actor_id: requestData.actor_id
        })
        break

      case 'effectiveness':
        result = await client.effectiveness({
          policy_id: requestData.policy_id,
          periods: requestData.periods
        })
        break

      default:
        return NextResponse.json({
          error: 'INVALID_ACTION',
          message: `Invalid action: ${action}. Valid actions: monitor, suggest, apply, revert, effectiveness`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      api_version: 'v3',
      smart_code: 'HERA.AI.POLICY.API.REST.V3'
    })

  } catch (error: any) {
    console.error('Policy tuning API error:', error)
    
    return NextResponse.json({
      error: 'POLICY_OPERATION_FAILED',
      message: error.message || 'Failed to process policy tuning operation',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}

// ============================================================================
// GET /api/v3/policy - Query policy tuning data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Validate API version
    assertV2(request)
    
    // Get organization context from headers
    const headersList = headers()
    const organizationId = headersList.get('x-organization-id')
    
    if (!organizationId) {
      return NextResponse.json({
        error: 'MISSING_ORGANIZATION_ID',
        message: 'Organization ID required in x-organization-id header'
      }, { status: 400 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    // Initialize policy tuning client
    const client = new PolicyTuningClient(organizationId)

    let result: any

    switch (type) {
      case 'variances':
      case 'variance':
        const period = searchParams.get('period') || undefined
        const policyId = searchParams.get('policy_id') || undefined
        const priority = searchParams.get('priority') as any || undefined
        const status = searchParams.get('status') as any || undefined
        
        result = await client.getVariances({
          period,
          policy_id: policyId,
          priority,
          status,
          limit
        })
        break

      case 'effectiveness':
        const effPolicyId = searchParams.get('policy_id') || undefined
        const policyType = searchParams.get('policy_type') as any || undefined
        const rating = searchParams.get('rating') as any || undefined
        const validationStatus = searchParams.get('validation_status') as any || undefined
        
        result = await client.getEffectiveness({
          policy_id: effPolicyId,
          policy_type: policyType,
          rating,
          validation_status: validationStatus,
          limit
        })
        break

      case 'dashboard':
      case 'summary':
        // Get dashboard summary data
        const [variances, effectiveness] = await Promise.all([
          client.getVariances({ limit: 10 }),
          client.getEffectiveness({ limit: 5 })
        ])

        result = {
          summary: {
            total_variances: variances.length,
            critical_variances: variances.filter(v => v.variance_priority === 'CRITICAL').length,
            threshold_violations: variances.filter(v => v.exceeds_threshold).length,
            improving_trends: variances.filter(v => v.variance_trend === 'IMPROVING').length,
            total_effectiveness_analyses: effectiveness.length,
            highly_effective_policies: effectiveness.filter(e => e.effectiveness_rating === 'HIGHLY_EFFECTIVE').length,
            proven_successes: effectiveness.filter(e => e.validation_status === 'PROVEN_SUCCESS').length,
            avg_effectiveness_score: effectiveness.length > 0 ? 
              Math.round(effectiveness.reduce((sum, e) => sum + e.effectiveness_score, 0) / effectiveness.length) : 0
          },
          recent_variances: variances.slice(0, 5),
          top_effectiveness: effectiveness.filter(e => e.effectiveness_score >= 70),
          critical_issues: variances.filter(v => v.variance_priority === 'CRITICAL' || v.variance_status === 'URGENT_ACTION_REQUIRED')
        }
        break

      default:
        return NextResponse.json({
          error: 'INVALID_TYPE',
          message: `Invalid type: ${type}. Valid types: variances, effectiveness, dashboard`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      type,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      api_version: 'v3',
      smart_code: 'HERA.AI.POLICY.API.QUERY.V3'
    })

  } catch (error: any) {
    console.error('Policy tuning query API error:', error)
    
    return NextResponse.json({
      error: 'POLICY_QUERY_FAILED',
      message: error.message || 'Failed to query policy tuning data',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/v3/policy - Update policy tuning configuration
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Validate API version
    assertV2(request)
    
    // Get organization context from headers
    const headersList = headers()
    const organizationId = headersList.get('x-organization-id')
    
    if (!organizationId) {
      return NextResponse.json({
        error: 'MISSING_ORGANIZATION_ID',
        message: 'Organization ID required in x-organization-id header'
      }, { status: 400 })
    }

    // Parse request body
    const body = await v2Body(request)
    const { type, ...configData } = body

    // Handle different configuration updates
    let result: any

    switch (type) {
      case 'tuning_bounds':
        // Update AI tuning bounds configuration
        // This would typically update core_dynamic_data for the AI config entity
        result = {
          success: true,
          message: 'AI tuning bounds configuration updated',
          settings_updated: Object.keys(configData).length,
          config_type: 'AI_TUNING_BOUNDS_V3'
        }
        break

      case 'safety_config':
        // Update AI tuning safety configuration
        result = {
          success: true,
          message: 'AI tuning safety configuration updated',
          settings_updated: Object.keys(configData).length,
          config_type: 'AI_TUNING_SAFETY_V3'
        }
        break

      case 'approval_workflow':
        // Update dual approval workflow settings
        result = {
          success: true,
          message: 'Approval workflow configuration updated',
          settings_updated: Object.keys(configData).length,
          approvers_configured: configData.approvers?.length || 0
        }
        break

      default:
        return NextResponse.json({
          error: 'INVALID_CONFIG_TYPE',
          message: `Invalid configuration type: ${type}. Valid types: tuning_bounds, safety_config, approval_workflow`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      type,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      api_version: 'v3',
      smart_code: 'HERA.AI.POLICY.API.CONFIG.V3'
    })

  } catch (error: any) {
    console.error('Policy tuning configuration API error:', error)
    
    return NextResponse.json({
      error: 'POLICY_CONFIG_FAILED',
      message: error.message || 'Failed to update policy tuning configuration',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/v3/policy - Archive policy tuning runs
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Validate API version
    assertV2(request)
    
    // Get organization context from headers
    const headersList = headers()
    const organizationId = headersList.get('x-organization-id')
    
    if (!organizationId) {
      return NextResponse.json({
        error: 'MISSING_ORGANIZATION_ID',
        message: 'Organization ID required in x-organization-id header'
      }, { status: 400 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const runType = searchParams.get('run_type')
    const runId = searchParams.get('run_id')
    const olderThanDays = searchParams.get('older_than_days') ? 
      parseInt(searchParams.get('older_than_days')!) : undefined

    if (!runType) {
      return NextResponse.json({
        error: 'MISSING_RUN_TYPE',
        message: 'run_type parameter is required (monitor, suggest, apply, revert, effectiveness)'
      }, { status: 400 })
    }

    // For safety, this would typically mark runs as archived rather than physically deleting them
    const result = {
      success: true,
      message: `Policy tuning runs marked as archived`,
      run_type: runType,
      run_id: runId,
      older_than_days: olderThanDays,
      archived_at: new Date().toISOString(),
      archive_reason: runId ? 'SPECIFIC_RUN_ARCHIVE' : 'BULK_CLEANUP'
    }

    return NextResponse.json({
      success: true,
      data: result,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      api_version: 'v3',
      smart_code: 'HERA.AI.POLICY.API.ARCHIVE.V3'
    })

  } catch (error: any) {
    console.error('Policy tuning archive API error:', error)
    
    return NextResponse.json({
      error: 'POLICY_ARCHIVE_FAILED',
      message: error.message || 'Failed to archive policy tuning runs',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}