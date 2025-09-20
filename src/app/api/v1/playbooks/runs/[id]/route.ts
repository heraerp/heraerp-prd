/**
 * HERA Playbooks Individual Run API
 *
 * Implements GET /playbooks/runs/{id} for retrieving detailed execution information,
 * PUT for updating execution status, and DELETE for canceling executions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { playbookExecutionEngine } from '@/lib/playbooks/execution/playbook-execution-engine'
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth'
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer'
import { universalApi } from '@/lib/universal-api'

interface RunDetailParams {
  include_steps?: boolean
  include_step_details?: boolean
  include_logs?: boolean
  include_performance_metrics?: boolean
  include_timeline?: boolean
  step_limit?: number
  log_level?: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * GET /api/v1/playbooks/runs/{id} - Get execution details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState()
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    // Set organization context
    const organizationId = authState.organization.id
    playbookExecutionEngine.setOrganizationContext(organizationId)

    const executionId = params.id

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams: RunDetailParams = {
      include_steps: searchParams.get('include_steps') !== 'false', // Default true
      include_step_details: searchParams.get('include_step_details') === 'true',
      include_logs: searchParams.get('include_logs') === 'true',
      include_performance_metrics: searchParams.get('include_performance_metrics') === 'true',
      include_timeline: searchParams.get('include_timeline') === 'true',
      step_limit: parseInt(searchParams.get('step_limit') || '50'),
      log_level: (searchParams.get('log_level') as any) || 'info'
    }

    // Get execution status
    const execution = await playbookExecutionEngine.getExecutionStatus(executionId)

    if (!execution) {
      return NextResponse.json(
        {
          error: 'Execution not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check permissions
    const playbook = await playbookDataLayer.getPlaybookDefinition(execution.playbook_id)
    if (!playbook) {
      return NextResponse.json(
        {
          error: 'Associated playbook not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    if (
      !playbookAuthService.canExecutePlaybook(execution.playbook_id) &&
      !playbookAuthService.canManagePlaybooks()
    ) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions to view this execution',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // Build enriched response
    const enrichedExecution: any = {
      ...execution,
      playbook_details: {
        id: playbook.id,
        name: playbook.name,
        description: playbook.description,
        industry: playbook.metadata.industry,
        version: playbook.version,
        estimated_duration_hours: playbook.metadata.estimated_duration_hours
      }
    }

    // Include step executions
    if (queryParams.include_steps) {
      const stepExecutions = await getStepExecutions(
        executionId,
        queryParams.step_limit,
        queryParams.include_step_details
      )
      enrichedExecution.step_executions = stepExecutions
    }

    // Include execution logs
    if (queryParams.include_logs) {
      enrichedExecution.execution_logs = await getExecutionLogs(executionId, queryParams.log_level)
    }

    // Include performance metrics
    if (queryParams.include_performance_metrics) {
      enrichedExecution.performance_metrics = await calculateDetailedPerformanceMetrics(execution)
    }

    // Include timeline
    if (queryParams.include_timeline) {
      enrichedExecution.execution_timeline = await buildExecutionTimeline(execution)
    }

    // Calculate real-time progress
    enrichedExecution.progress = {
      percentage:
        execution.total_steps > 0
          ? Math.round((execution.completed_steps / execution.total_steps) * 100)
          : 0,
      current_step: execution.current_step,
      estimated_completion: calculateEstimatedCompletion(execution, playbook),
      time_remaining_minutes: calculateTimeRemaining(execution, playbook)
    }

    // Add user permissions for this execution
    enrichedExecution.user_permissions = {
      can_cancel: canCancelExecution(execution, authState),
      can_retry: canRetryExecution(execution, authState),
      can_view_logs: playbookAuthService.hasPermission('playbooks:view_logs'),
      can_modify: playbookAuthService.canManagePlaybooks()
    }

    return NextResponse.json({
      success: true,
      data: enrichedExecution,
      metadata: {
        organization_id: organizationId,
        execution_id: executionId,
        query_time_ms:
          Date.now() - (parseInt(request.headers.get('x-request-start') || '0') || Date.now()),
        includes_applied: queryParams,
        real_time_data: execution.status === 'in_progress'
      }
    })
  } catch (error) {
    console.error('Get execution details error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get execution details',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/playbooks/runs/{id} - Update execution (e.g., pause, resume)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState()
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    // Check permissions
    if (!playbookAuthService.canManagePlaybooks()) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions to modify executions',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // Set organization context
    const organizationId = authState.organization.id
    playbookExecutionEngine.setOrganizationContext(organizationId)

    const executionId = params.id
    const body = await request.json()

    // Get current execution
    const execution = await playbookExecutionEngine.getExecutionStatus(executionId)
    if (!execution) {
      return NextResponse.json(
        {
          error: 'Execution not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Handle different update actions
    const { action, ...updateData } = body

    switch (action) {
      case 'pause':
        if (execution.status !== 'in_progress') {
          return NextResponse.json(
            {
              error: 'Can only pause in-progress executions',
              code: 'INVALID_STATUS'
            },
            { status: 400 }
          )
        }
        // TODO: Implement pause logic
        break

      case 'resume':
        if (execution.status !== 'paused') {
          return NextResponse.json(
            {
              error: 'Can only resume paused executions',
              code: 'INVALID_STATUS'
            },
            { status: 400 }
          )
        }
        // TODO: Implement resume logic
        break

      case 'update_priority':
        // TODO: Implement priority update
        break

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Supported actions: pause, resume, update_priority',
            code: 'INVALID_ACTION'
          },
          { status: 400 }
        )
    }

    // Return updated execution
    const updatedExecution = await playbookExecutionEngine.getExecutionStatus(executionId)

    return NextResponse.json({
      success: true,
      data: updatedExecution,
      metadata: {
        organization_id: organizationId,
        action_performed: action,
        updated_by: authState.user?.id,
        update_time: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Update execution error:', error)

    return NextResponse.json(
      {
        error: 'Failed to update execution',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/playbooks/runs/{id} - Cancel execution
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState()
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    // Set organization context
    const organizationId = authState.organization.id
    playbookExecutionEngine.setOrganizationContext(organizationId)

    const executionId = params.id

    // Get execution
    const execution = await playbookExecutionEngine.getExecutionStatus(executionId)
    if (!execution) {
      return NextResponse.json(
        {
          error: 'Execution not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check permissions
    const canCancel = canCancelExecution(execution, authState)
    if (!canCancel) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions to cancel this execution',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // Check if cancellation is possible
    if (execution.status === 'completed' || execution.status === 'failed') {
      return NextResponse.json(
        {
          error: `Cannot cancel execution with status: ${execution.status}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      )
    }

    if (execution.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'Execution is already cancelled',
          code: 'ALREADY_CANCELLED'
        },
        { status: 400 }
      )
    }

    // Cancel execution
    const cancelled = await playbookExecutionEngine.cancelExecution(executionId)

    if (!cancelled) {
      return NextResponse.json(
        {
          error: 'Failed to cancel execution',
          code: 'CANCELLATION_FAILED'
        },
        { status: 500 }
      )
    }

    // Log cancellation
    console.log(`Execution cancelled: ${executionId}`, {
      cancelled_by: authState.user?.id,
      organization_id: organizationId,
      execution_status: execution.status
    })

    return NextResponse.json({
      success: true,
      data: {
        execution_id: executionId,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: authState.user?.id
      },
      metadata: {
        organization_id: organizationId,
        cancellation_time: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Cancel execution error:', error)

    return NextResponse.json(
      {
        error: 'Failed to cancel execution',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function getStepExecutions(
  executionId: string,
  limit: number = 50,
  includeDetails: boolean = false
) {
  // Query transaction lines for step executions
  const stepLines = await universalApi.queryTransactionLines({
    filters: { transaction_id: executionId },
    sort: { field: 'line_number', direction: 'asc' },
    limit
  })

  return stepLines.data.map(line => ({
    step_id: line.line_entity_id,
    step_number: line.line_number,
    step_name: line.metadata?.step_execution?.step_name || `Step ${line.line_number}`,
    status: line.metadata?.step_execution?.status || 'unknown',
    started_at: line.metadata?.step_execution?.started_at,
    completed_at: line.metadata?.step_execution?.completed_at,
    duration_ms: line.metadata?.step_execution?.duration_ms || 0,
    input_data: includeDetails ? line.metadata?.input_data : undefined,
    output_data: includeDetails ? line.metadata?.output_data : undefined,
    error: line.metadata?.error,
    worker_type: line.metadata?.worker_type,
    retry_count: line.metadata?.step_execution?.retry_count || 0
  }))
}

async function getExecutionLogs(executionId: string, logLevel: string = 'info') {
  // This would query a logs table or service
  // For now, return placeholder logs
  return [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Execution started',
      context: { execution_id: executionId }
    },
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Step 1 completed successfully',
      context: { step_number: 1 }
    }
  ]
}

async function calculateDetailedPerformanceMetrics(execution: any) {
  return {
    execution_efficiency: execution.execution_summary.success_rate,
    time_utilization: calculateTimeUtilization(execution),
    resource_usage: calculateResourceUsage(execution),
    bottleneck_analysis: identifyDetailedBottlenecks(execution),
    performance_score: calculatePerformanceScore(execution)
  }
}

async function buildExecutionTimeline(execution: any) {
  return [
    {
      timestamp: execution.started_at,
      event: 'execution_started',
      description: 'Playbook execution initiated',
      metadata: { status: 'queued' }
    },
    {
      timestamp: execution.started_at,
      event: 'execution_in_progress',
      description: 'Execution processing began',
      metadata: { status: 'in_progress' }
    }
  ]
}

function calculateEstimatedCompletion(execution: any, playbook: any): string | null {
  if (execution.status !== 'in_progress') return null

  const elapsedMs = Date.now() - new Date(execution.started_at).getTime()
  const progressRatio = execution.completed_steps / execution.total_steps

  if (progressRatio === 0) {
    // Use estimated duration from playbook
    const estimatedTotalMs = (playbook.metadata.estimated_duration_hours || 1) * 60 * 60 * 1000
    return new Date(Date.now() + estimatedTotalMs).toISOString()
  }

  const estimatedTotalMs = elapsedMs / progressRatio
  const remainingMs = estimatedTotalMs - elapsedMs

  return new Date(Date.now() + remainingMs).toISOString()
}

function calculateTimeRemaining(execution: any, playbook: any): number | null {
  const estimatedCompletion = calculateEstimatedCompletion(execution, playbook)
  if (!estimatedCompletion) return null

  const remainingMs = new Date(estimatedCompletion).getTime() - Date.now()
  return Math.max(0, Math.round(remainingMs / 1000 / 60)) // minutes
}

function canCancelExecution(execution: any, authState: any): boolean {
  // User can cancel if they initiated it or have management permissions
  return execution.initiated_by === authState.user?.id || playbookAuthService.canManagePlaybooks()
}

function canRetryExecution(execution: any, authState: any): boolean {
  return (
    execution.status === 'failed' &&
    (execution.initiated_by === authState.user?.id || playbookAuthService.canManagePlaybooks())
  )
}

function calculateTimeUtilization(execution: any): number {
  // Calculate how efficiently time was used
  return Math.random() * 100 // Placeholder
}

function calculateResourceUsage(execution: any): any {
  // Calculate resource utilization metrics
  return {
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    network_usage: Math.random() * 100
  }
}

function identifyDetailedBottlenecks(execution: any): string[] {
  const bottlenecks = []

  if (execution.execution_summary.retries_performed > 3) {
    bottlenecks.push('Excessive retry attempts')
  }

  return bottlenecks
}

function calculatePerformanceScore(execution: any): number {
  // Calculate overall performance score (0-100)
  return Math.min(100, execution.execution_summary.success_rate)
}
