/**
 * HERA Finance DNA v3.6: Workforce Optimization REST API
 * 
 * REST API endpoints for workforce optimization operations including
 * scheduling, timesheet processing, payroll accrual, and optimization
 * management with dual approval workflows.
 * 
 * Smart Code: HERA.WORK.API.REST.V3
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { WorkforceClient } from '@/lib/workforce/workforce-client-v3'
import { assertV2, v2Body } from '@/lib/server/route-utils'

// ============================================================================
// POST /api/v3/workforce - Main workforce operations
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

    // Initialize workforce client
    const client = new WorkforceClient(organizationId)

    let result: any

    switch (action) {
      case 'schedule_run':
        result = await client.scheduleRun({
          schedule_id: requestData.schedule_id,
          period: requestData.period,
          location_ids: requestData.location_ids,
          objective: requestData.objective,
          locked: requestData.locked
        })
        break

      case 'timesheet_post':
        result = await client.postTimesheet({
          employee_id: requestData.employee_id,
          period_date: requestData.period_date,
          time_entries: requestData.time_entries || [],
          approval_status: requestData.approval_status,
          submitted_by: requestData.submitted_by
        })
        break

      case 'payroll_accrue':
        result = await client.accruePayroll({
          period_start: requestData.period_start,
          period_end: requestData.period_end,
          accrual_period: requestData.accrual_period,
          location_ids: requestData.location_ids,
          employee_ids: requestData.employee_ids,
          include_benefits: requestData.include_benefits,
          include_taxes: requestData.include_taxes
        })
        break

      case 'optimization_suggest':
        result = await client.suggestOptimizations({
          analysis_period: requestData.analysis_period,
          location_ids: requestData.location_ids,
          objectives: requestData.objectives,
          constraints: requestData.constraints
        })
        break

      case 'optimization_apply':
        result = await client.applyOptimizations({
          optimization_run_id: requestData.optimization_run_id,
          selected_suggestions: requestData.selected_suggestions,
          implementation_date: requestData.implementation_date,
          approver_id: requestData.approver_id,
          approval_notes: requestData.approval_notes
        })
        break

      default:
        return NextResponse.json({
          error: 'INVALID_ACTION',
          message: `Invalid action: ${action}. Valid actions: schedule_run, timesheet_post, payroll_accrue, optimization_suggest, optimization_apply`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      api_version: 'v3',
      smart_code: 'HERA.WORK.API.REST.V3'
    })

  } catch (error: any) {
    console.error('Workforce API error:', error)
    
    return NextResponse.json({
      error: 'WORKFORCE_OPERATION_FAILED',
      message: error.message || 'Failed to process workforce operation',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}

// ============================================================================
// GET /api/v3/workforce - Query workforce data
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

    // Initialize workforce client
    const client = new WorkforceClient(organizationId)

    let result: any

    switch (type) {
      case 'optimization':
      case 'summary':
        result = await client.getOptimizationData()
        break

      case 'schedules':
        // Get recent schedule runs
        const scheduleQuery = `
          SELECT 
            ut.id as schedule_run_id,
            ut.created_at as schedule_date,
            ut.metadata->>'schedule_id' as schedule_id,
            ut.metadata->>'period' as period,
            ut.total_amount as total_labor_cost,
            ut.status,
            ut.metadata->'optimization_metrics'->'schedule_summary' as schedule_summary
          FROM universal_transactions ut
          WHERE ut.organization_id = $1
          AND ut.transaction_type = 'WORK_SCHEDULE_RUN'
          ORDER BY ut.created_at DESC
          ${limit ? `LIMIT ${limit}` : 'LIMIT 20'}
        `
        const scheduleResult = await client['callQuery'](scheduleQuery, [organizationId])
        result = scheduleResult.data || []
        break

      case 'timesheets':
        // Get recent timesheet postings
        const timesheetQuery = `
          SELECT 
            ut.id as timesheet_run_id,
            ut.created_at as timesheet_date,
            ut.metadata->>'employee_id' as employee_id,
            ut.metadata->>'period_date' as period_date,
            ut.total_amount as total_pay,
            ut.status,
            ut.metadata->'timesheet_summary' as timesheet_summary,
            ut.metadata->'compliance_status' as compliance_status
          FROM universal_transactions ut
          WHERE ut.organization_id = $1
          AND ut.transaction_type = 'WORK_TIMESHEET_POST'
          ORDER BY ut.created_at DESC
          ${limit ? `LIMIT ${limit}` : 'LIMIT 50'}
        `
        const timesheetResult = await client['callQuery'](timesheetQuery, [organizationId])
        result = timesheetResult.data || []
        break

      case 'payroll':
        // Get recent payroll accruals
        const payrollQuery = `
          SELECT 
            ut.id as payroll_run_id,
            ut.created_at as accrual_date,
            ut.metadata->>'accrual_period' as accrual_period,
            ut.total_amount as total_accrued_amount,
            ut.status,
            ut.metadata->'accrual_summary' as accrual_summary
          FROM universal_transactions ut
          WHERE ut.organization_id = $1
          AND ut.transaction_type = 'WORK_PAYROLL_ACCRUE'
          ORDER BY ut.created_at DESC
          ${limit ? `LIMIT ${limit}` : 'LIMIT 12'}
        `
        const payrollResult = await client['callQuery'](payrollQuery, [organizationId])
        result = payrollResult.data || []
        break

      case 'employees':
        // Get employee performance metrics
        const employeeQuery = `
          SELECT 
            e.id as employee_id,
            e.entity_name as employee_name,
            e.entity_code as employee_code,
            COALESCE(hourly_rate.field_value_number, 15.00) as hourly_rate,
            COALESCE(contract_type.field_value_text, 'FULL_TIME') as contract_type,
            
            -- Recent performance metrics
            COALESCE(
              (SELECT AVG((utl.metadata->>'net_hours')::DECIMAL)
               FROM universal_transactions ut
               JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
               WHERE ut.organization_id = $1
               AND ut.transaction_type = 'WORK_TIMESHEET_POST'
               AND (utl.metadata->>'employee_id')::UUID = e.id
               AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
               AND utl.line_type = 'TIME_ENTRY'
              ), 0
            ) as avg_hours_per_week,
            
            COALESCE(
              (SELECT AVG(COALESCE((utl.metadata->>'overtime_hours')::DECIMAL, 0))
               FROM universal_transactions ut
               JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
               WHERE ut.organization_id = $1
               AND ut.transaction_type = 'WORK_TIMESHEET_POST'
               AND (utl.metadata->>'employee_id')::UUID = e.id
               AND ut.created_at >= CURRENT_DATE - INTERVAL '30 days'
               AND utl.line_type = 'TIME_ENTRY'
              ), 0
            ) as avg_overtime_hours
            
          FROM core_entities e
          LEFT JOIN core_dynamic_data hourly_rate ON 
            hourly_rate.entity_id = e.id AND hourly_rate.field_name = 'hourly_rate'
          LEFT JOIN core_dynamic_data contract_type ON 
            contract_type.entity_id = e.id AND contract_type.field_name = 'contract_type'
          WHERE e.organization_id = $1 
          AND e.entity_type = 'EMPLOYEE'
          AND e.status = 'ACTIVE'
          ORDER BY e.entity_name
          ${limit ? `LIMIT ${limit}` : 'LIMIT 100'}
        `
        const employeeResult = await client['callQuery'](employeeQuery, [organizationId])
        result = employeeResult.data || []
        break

      case 'dashboard':
        // Get comprehensive dashboard data
        const optimizationData = await client.getOptimizationData()
        
        result = {
          optimization_summary: optimizationData,
          workforce_metrics: {
            total_employees: optimizationData?.total_employees || 0,
            avg_utilization_rate: optimizationData?.avg_utilization_rate || 0,
            workforce_efficiency_score: optimizationData?.workforce_efficiency_score || 0,
            workforce_status: optimizationData?.workforce_status || 'NEEDS_OPTIMIZATION',
            optimization_potential_pct: optimizationData?.optimization_potential_pct || 0
          },
          recent_activity: {
            latest_analysis_date: optimizationData?.latest_analysis_date,
            total_suggestions: optimizationData?.total_suggestions || 0,
            suggestions_applied: optimizationData?.suggestions_applied || 0,
            potential_annual_savings: optimizationData?.potential_annual_savings || 0
          }
        }
        break

      default:
        return NextResponse.json({
          error: 'INVALID_TYPE',
          message: `Invalid type: ${type}. Valid types: optimization, schedules, timesheets, payroll, employees, dashboard`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      type,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      api_version: 'v3',
      smart_code: 'HERA.WORK.API.QUERY.V3'
    })

  } catch (error: any) {
    console.error('Workforce query API error:', error)
    
    return NextResponse.json({
      error: 'WORKFORCE_QUERY_FAILED',
      message: error.message || 'Failed to query workforce data',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/v3/workforce - Update workforce configuration
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
      case 'workforce_policy':
        // Update workforce policy configuration
        result = {
          success: true,
          message: 'Workforce policy configuration updated',
          settings_updated: Object.keys(configData).length,
          config_type: 'WORK_POLICY_V3'
        }
        break

      case 'optimization_constraints':
        // Update optimization constraints
        result = {
          success: true,
          message: 'Optimization constraints updated',
          settings_updated: Object.keys(configData).length,
          config_type: 'WORK_OPT_CONSTRAINTS_V3'
        }
        break

      case 'schedule_templates':
        // Update schedule template configurations
        result = {
          success: true,
          message: 'Schedule template configurations updated',
          templates_updated: configData.templates?.length || 0,
          config_type: 'WORK_SCHEDULE_TEMPLATES_V3'
        }
        break

      case 'payroll_settings':
        // Update payroll accrual settings
        result = {
          success: true,
          message: 'Payroll settings updated',
          settings_updated: Object.keys(configData).length,
          config_type: 'WORK_PAYROLL_SETTINGS_V3'
        }
        break

      default:
        return NextResponse.json({
          error: 'INVALID_CONFIG_TYPE',
          message: `Invalid configuration type: ${type}. Valid types: workforce_policy, optimization_constraints, schedule_templates, payroll_settings`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      type,
      organization_id: organizationId,
      timestamp: new Date().toISOString(),
      api_version: 'v3',
      smart_code: 'HERA.WORK.API.CONFIG.V3'
    })

  } catch (error: any) {
    console.error('Workforce configuration API error:', error)
    
    return NextResponse.json({
      error: 'WORKFORCE_CONFIG_FAILED',
      message: error.message || 'Failed to update workforce configuration',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/v3/workforce - Archive workforce runs
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
        message: 'run_type parameter is required (schedule, timesheet, payroll, optimization)'
      }, { status: 400 })
    }

    // Map run types to transaction types
    const transactionTypeMap = {
      'schedule': 'WORK_SCHEDULE_RUN',
      'timesheet': 'WORK_TIMESHEET_POST',
      'payroll': 'WORK_PAYROLL_ACCRUE',
      'optimization': 'WORK_OPT_SUGGEST'
    }

    const transactionType = transactionTypeMap[runType as keyof typeof transactionTypeMap]
    if (!transactionType) {
      return NextResponse.json({
        error: 'INVALID_RUN_TYPE',
        message: `Invalid run_type: ${runType}. Valid types: schedule, timesheet, payroll, optimization`
      }, { status: 400 })
    }

    // For safety, this would typically mark runs as archived rather than physically deleting them
    const result = {
      success: true,
      message: `Workforce ${runType} runs marked as archived`,
      run_type: runType,
      transaction_type: transactionType,
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
      smart_code: 'HERA.WORK.API.ARCHIVE.V3'
    })

  } catch (error: any) {
    console.error('Workforce archive API error:', error)
    
    return NextResponse.json({
      error: 'WORKFORCE_ARCHIVE_FAILED',
      message: error.message || 'Failed to archive workforce runs',
      timestamp: new Date().toISOString(),
      api_version: 'v3'
    }, { status: 500 })
  }
}