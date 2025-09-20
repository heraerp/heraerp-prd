/**
 * HERA Playbooks Step Completion API
 *
 * Implements POST /playbook-runs/{runId}/steps/{sequence}/complete
 * Marks a playbook run step as completed with output data and triggers next steps.
 */
import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth'
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer'
import { PlaybookSmartCodes } from '@/lib/playbooks/smart-codes/playbook-smart-codes'

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string; sequence: string } }
) {
  try {
    // Extract auth
    const auth = await playbookAuthService.authenticate(request)
    if (!auth.success) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      output_data,
      status = 'completed', // completed | failed | cancelled
      error_message,
      completion_notes,
      actual_duration_minutes
    } = body

    // Validate input
    if (!['completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be completed, failed, or cancelled'
        },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(auth.organizationId!)

    // Get the run header
    const runs = await universalApi.readTransactions({
      filters: {
        id: params.runId,
        transaction_type: 'playbook_run',
        organization_id: auth.organizationId!
      }
    })

    if (!runs || runs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Playbook run not found'
        },
        { status: 404 }
      )
    }

    const run = runs[0]

    // Check permission to complete steps in this run
    const hasPermission = await playbookAuthService.checkPermission(
      auth.userId!,
      auth.organizationId!,
      'PLAYBOOK_RUN_COMPLETE',
      { playbook_id: run.metadata?.playbook_id }
    )

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied'
        },
        { status: 403 }
      )
    }

    // Get the step line
    const stepLines = await universalApi.readTransactionLines({
      transaction_id: params.runId,
      filters: {
        line_number: parseInt(params.sequence)
      }
    })

    if (!stepLines || stepLines.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Step not found'
        },
        { status: 404 }
      )
    }

    const stepLine = stepLines[0]

    // Validate step is in a state that can be completed
    const currentStatus = stepLine.metadata?.status
    if (!['in_progress', 'waiting_for_input', 'waiting_for_signal'].includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Step cannot be completed from status: ${currentStatus}`
        },
        { status: 400 }
      )
    }

    // Additional validation for human tasks
    if (stepLine.metadata?.step_type === 'human') {
      // Check if the completing user is the assigned user
      const assignedUserId = stepLine.metadata?.assigned_to_user_id
      if (assignedUserId && assignedUserId !== auth.userId) {
        // Check if user has override permission
        const canOverride = await playbookAuthService.checkPermission(
          auth.userId!,
          auth.organizationId!,
          'PLAYBOOK_STEP_OVERRIDE'
        )

        if (!canOverride) {
          return NextResponse.json(
            {
              success: false,
              error: 'This step is assigned to another user'
            },
            { status: 403 }
          )
        }
      }
    }

    // Update step line status
    const updatedLine = await universalApi.updateTransactionLine(
      params.runId,
      parseInt(params.sequence),
      {
        metadata: {
          ...stepLine.metadata,
          status,
          output_data,
          error_message: status === 'failed' ? error_message : undefined,
          completion_notes,
          actual_duration_minutes,
          completed_at: new Date().toISOString(),
          completed_by_user_id: auth.userId,
          completed_by_user_name: auth.userName
        }
      }
    )

    // Create completion event transaction
    const completionEvent = await universalApi.createTransaction({
      transaction_type: 'playbook_step_completion',
      organization_id: auth.organizationId!,
      reference_entity_id: stepLine.metadata?.step_id,
      smart_code: PlaybookSmartCodes.EXECUTION.STEP_COMPLETE,
      total_amount: 0,
      metadata: {
        run_id: params.runId,
        step_sequence: parseInt(params.sequence),
        step_id: stepLine.metadata?.step_id,
        step_name: stepLine.metadata?.step_name,
        status,
        output_data,
        error_message,
        completion_notes,
        actual_duration_minutes,
        completed_by: auth.userId,
        timestamp: new Date().toISOString()
      }
    })

    // Handle post-completion actions based on status
    if (status === 'completed') {
      // Check and activate dependent steps
      await activateDependentSteps(params.runId, parseInt(params.sequence), auth.organizationId!)

      // Check if all steps are complete
      await checkRunCompletion(params.runId, auth.organizationId!)
    } else if (status === 'failed') {
      // Handle failure based on step configuration
      const failurePolicy = stepLine.metadata?.on_failure || 'stop'

      if (failurePolicy === 'stop') {
        // Mark run as failed
        await universalApi.updateTransaction(params.runId, {
          metadata: {
            ...run.metadata,
            status: 'failed',
            failed_at_step: parseInt(params.sequence),
            failure_reason: error_message,
            failed_at: new Date().toISOString()
          }
        })
      } else if (failurePolicy === 'continue') {
        // Continue with dependent steps despite failure
        await activateDependentSteps(params.runId, parseInt(params.sequence), auth.organizationId!)
      }
      // 'retry' policy is handled by the orchestrator
    }

    return NextResponse.json({
      success: true,
      message: `Step ${params.sequence} marked as ${status}`,
      data: {
        run_id: params.runId,
        step_sequence: parseInt(params.sequence),
        status,
        output_data,
        completion_event_id: completionEvent.id,
        next_steps_activated:
          status === 'completed' ||
          (status === 'failed' && stepLine.metadata?.on_failure === 'continue')
      }
    })
  } catch (error) {
    console.error('Failed to complete step:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

async function activateDependentSteps(
  runId: string,
  completedSequence: number,
  organizationId: string
): Promise<void> {
  // Get all step lines for the run
  const allLines = await universalApi.readTransactionLines({
    transaction_id: runId
  })

  if (!allLines || allLines.length === 0) return

  // Find steps that depend on the completed step
  for (const line of allLines) {
    const dependencies = line.metadata?.dependencies || []
    const dependsOnCompleted = dependencies.some(
      (dep: any) => dep.step_sequence === completedSequence
    )

    if (dependsOnCompleted && line.metadata?.status === 'pending') {
      // Check if all dependencies are satisfied
      const allDependenciesMet = await checkAllDependencies(
        runId,
        line.line_number,
        dependencies,
        allLines
      )

      if (allDependenciesMet) {
        // Activate the step
        await universalApi.updateTransactionLine(runId, line.line_number, {
          metadata: {
            ...line.metadata,
            status: 'ready',
            activated_at: new Date().toISOString()
          }
        })

        // Create activation event
        await universalApi.createTransaction({
          transaction_type: 'playbook_step_activation',
          organization_id,
          reference_entity_id: line.metadata?.step_id,
          smart_code: PlaybookSmartCodes.EXECUTION.STEP_READY,
          total_amount: 0,
          metadata: {
            run_id: runId,
            step_sequence: line.line_number,
            step_id: line.metadata?.step_id,
            activated_by_completion_of: completedSequence,
            timestamp: new Date().toISOString()
          }
        })
      }
    }
  }
}

async function checkAllDependencies(
  runId: string,
  stepSequence: number,
  dependencies: any[],
  allLines: any[]
): Promise<boolean> {
  for (const dep of dependencies) {
    const depLine = allLines.find(l => l.line_number === dep.step_sequence)
    if (!depLine) return false

    const depStatus = depLine.metadata?.status

    // Check based on dependency type
    if (dep.dependency_type === 'completion') {
      if (depStatus !== 'completed') return false
    } else if (dep.dependency_type === 'success') {
      if (depStatus !== 'completed') return false
    } else if (dep.dependency_type === 'any') {
      if (!['completed', 'failed', 'cancelled'].includes(depStatus)) return false
    }
  }

  return true
}

async function checkRunCompletion(runId: string, organizationId: string): Promise<void> {
  // Get all step lines
  const allLines = await universalApi.readTransactionLines({
    transaction_id: runId
  })

  if (!allLines || allLines.length === 0) return

  // Check if all steps are in a terminal state
  const allComplete = allLines.every(line => {
    const status = line.metadata?.status
    return ['completed', 'failed', 'cancelled', 'skipped'].includes(status)
  })

  if (allComplete) {
    // Calculate overall status
    const hasFailures = allLines.some(l => l.metadata?.status === 'failed')
    const hasCancellations = allLines.some(l => l.metadata?.status === 'cancelled')

    let runStatus = 'completed'
    if (hasFailures) runStatus = 'completed_with_errors'
    if (hasCancellations) runStatus = 'partially_completed'

    // Update run header
    const run = await universalApi.readTransactions({
      filters: { id: runId }
    })

    if (run && run.length > 0) {
      await universalApi.updateTransaction(runId, {
        metadata: {
          ...run[0].metadata,
          status: runStatus,
          completed_at: new Date().toISOString(),
          total_duration_minutes: calculateTotalDuration(run[0], allLines),
          completion_stats: {
            total_steps: allLines.length,
            completed: allLines.filter(l => l.metadata?.status === 'completed').length,
            failed: allLines.filter(l => l.metadata?.status === 'failed').length,
            cancelled: allLines.filter(l => l.metadata?.status === 'cancelled').length,
            skipped: allLines.filter(l => l.metadata?.status === 'skipped').length
          }
        }
      })

      // Create run completion event
      await universalApi.createTransaction({
        transaction_type: 'playbook_run_completion',
        organization_id,
        reference_entity_id: run[0].metadata?.playbook_id,
        smart_code: PlaybookSmartCodes.EXECUTION.RUN_COMPLETE,
        total_amount: 0,
        metadata: {
          run_id: runId,
          playbook_id: run[0].metadata?.playbook_id,
          status: runStatus,
          completion_stats: {
            total_steps: allLines.length,
            completed: allLines.filter(l => l.metadata?.status === 'completed').length,
            failed: allLines.filter(l => l.metadata?.status === 'failed').length,
            cancelled: allLines.filter(l => l.metadata?.status === 'cancelled').length,
            skipped: allLines.filter(l => l.metadata?.status === 'skipped').length
          },
          timestamp: new Date().toISOString()
        }
      })
    }
  }
}

function calculateTotalDuration(run: any, lines: any[]): number {
  const startTime = new Date(run.created_at || run.metadata?.started_at).getTime()
  const endTime = Date.now()
  return Math.round((endTime - startTime) / 1000 / 60) // minutes
}
