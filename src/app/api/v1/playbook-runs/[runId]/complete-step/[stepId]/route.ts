/**
 * HERA Playbooks Step Completion API (by Step ID)
 *
 * Implements POST /playbook-runs/{runId}/complete-step/{stepId}
 * Marks a playbook run step as completed with exact payload format and AI insights.
 */
import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth-server'
import { playbookOrchestrator } from '@/lib/playbooks/orchestrator/playbook-orchestrator'
import { PlaybookSmartCodes } from '@/lib/playbooks/smart-codes/playbook-smart-codes'
import { z } from 'zod'

// Request payload validation schema
const StepCompletionSchema = z.object({
  outputs: z.record(z.any()).optional().default({}),
  ai_confidence: z.number().min(0).max(1).optional(),
  ai_insights: z.string().optional()
})

type StepCompletionPayload = z.infer<typeof StepCompletionSchema>

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string; stepId: string } }
) {
  try {
    // Extract and validate auth
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = StepCompletionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payload format',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const payload: StepCompletionPayload = validationResult.data

    // Set organization context
    universalApi.setOrganizationId(auth.organizationId!)

    // Get and validate the run
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
          error: 'Permission denied to complete steps in this run'
        },
        { status: 403 }
      )
    }

    // Find the step by stepId
    const stepLines = await universalApi.readTransactionLines({
      transaction_id: params.runId
    })

    if (!stepLines || stepLines.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No steps found for this run'
        },
        { status: 404 }
      )
    }

    const stepLine = stepLines.find(line => line.metadata?.step_id === params.stepId)

    if (!stepLine) {
      return NextResponse.json(
        {
          success: false,
          error: `Step ${params.stepId} not found in run ${params.runId}`
        },
        { status: 404 }
      )
    }

    // Validate step is in a completable state
    const currentStatus = stepLine.metadata?.status
    const completableStatuses = ['in_progress', 'waiting_for_input', 'waiting_for_signal', 'ready']

    if (!completableStatuses.includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Step cannot be completed from status: ${currentStatus}. Must be one of: ${completableStatuses.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Prevent duplicate completions
    if (['completed', 'failed', 'cancelled'].includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Step is already in terminal state: ${currentStatus}`
        },
        { status: 409 }
      )
    }

    // Validate outputs against step's output contract if defined
    const outputContract = stepLine.metadata?.output_contract
    if (outputContract) {
      const validationError = validateOutputsAgainstContract(payload.outputs, outputContract)
      if (validationError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Output validation failed',
            details: validationError
          },
          { status: 400 }
        )
      }
    }

    // Authorization check for specific step types
    if (stepLine.metadata?.step_type === 'human') {
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
              error:
                'This step is assigned to another user and you do not have override permissions'
            },
            { status: 403 }
          )
        }
      }
    }

    // Prepare completion metadata
    const completionTime = new Date().toISOString()
    const stepStartTime = stepLine.metadata?.started_at || stepLine.metadata?.activated_at
    const actualDurationMinutes = stepStartTime
      ? Math.round(
          (new Date(completionTime).getTime() - new Date(stepStartTime).getTime()) / 1000 / 60
        )
      : undefined

    // Update step line with completion data and AI insights
    const updatedMetadata = {
      ...stepLine.metadata,
      status: 'completed',
      outputs: payload.outputs,
      ai_confidence: payload.ai_confidence,
      ai_insights: payload.ai_insights,
      completed_at: completionTime,
      completed_by_user_id: auth.userId,
      completed_by_user_name: auth.userName,
      actual_duration_minutes: actualDurationMinutes
    }

    const updatedLine = await universalApi.updateTransactionLine(
      params.runId,
      stepLine.line_number,
      {
        metadata: updatedMetadata
      }
    )

    if (!updatedLine.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update step status'
        },
        { status: 500 }
      )
    }

    // Create completion event transaction with AI insights
    const completionEvent = await universalApi.createTransaction({
      transaction_type: 'playbook_step_completion',
      organization_id: auth.organizationId!,
      reference_entity_id: stepLine.metadata?.step_id,
      smart_code: PlaybookSmartCodes.EXECUTION.STEP_COMPLETE,
      total_amount: 0,
      metadata: {
        run_id: params.runId,
        step_id: params.stepId,
        step_sequence: stepLine.line_number,
        step_name: stepLine.metadata?.step_name,
        step_type: stepLine.metadata?.step_type,
        outputs: payload.outputs,
        ai_confidence: payload.ai_confidence,
        ai_insights: payload.ai_insights,
        completed_by: auth.userId,
        completed_by_name: auth.userName,
        actual_duration_minutes: actualDurationMinutes,
        timestamp: completionTime
      }
    })

    // Trigger orchestrator to handle next steps
    try {
      await playbookOrchestrator.processStepCompletion({
        runId: params.runId,
        stepId: params.stepId,
        stepSequence: stepLine.line_number,
        organizationId: auth.organizationId!,
        outputs: payload.outputs,
        aiConfidence: payload.ai_confidence
      })
    } catch (orchestratorError) {
      console.error('Orchestrator processing failed:', orchestratorError)
      // Don't fail the completion, but log the error
      // The orchestrator daemon will pick this up later
    }

    // Update run progress
    await updateRunProgress(params.runId, auth.organizationId!)

    // Determine next steps
    const nextSteps = await getNextSteps(params.runId, stepLine.line_number)

    return NextResponse.json({
      success: true,
      message: `Step ${params.stepId} completed successfully`,
      data: {
        run_id: params.runId,
        step_id: params.stepId,
        step_sequence: stepLine.line_number,
        status: 'completed',
        outputs: payload.outputs,
        ai_confidence: payload.ai_confidence,
        ai_insights: payload.ai_insights,
        completed_at: completionTime,
        actual_duration_minutes: actualDurationMinutes,
        completion_event_id: completionEvent.id,
        next_steps: nextSteps,
        orchestrator_notified: true
      }
    })
  } catch (error) {
    console.error('Failed to complete step:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Validates outputs against the step's output contract
 */
function validateOutputsAgainstContract(
  outputs: Record<string, any>,
  contract: any
): string | null {
  if (!contract || !contract.required_fields) {
    return null // No contract to validate against
  }

  // Check required fields
  for (const field of contract.required_fields) {
    if (!(field in outputs)) {
      return `Missing required output field: ${field}`
    }

    // Basic type validation if specified
    if (contract.field_types && contract.field_types[field]) {
      const expectedType = contract.field_types[field]
      const actualType = typeof outputs[field]

      if (expectedType === 'number' && actualType !== 'number') {
        return `Field ${field} must be a number, got ${actualType}`
      } else if (expectedType === 'string' && actualType !== 'string') {
        return `Field ${field} must be a string, got ${actualType}`
      } else if (expectedType === 'boolean' && actualType !== 'boolean') {
        return `Field ${field} must be a boolean, got ${actualType}`
      }
    }
  }

  return null
}

/**
 * Updates the overall run progress
 */
async function updateRunProgress(runId: string, organizationId: string): Promise<void> {
  try {
    // Get all step lines
    const allLines = await universalApi.readTransactionLines({
      transaction_id: runId
    })

    if (!allLines || allLines.length === 0) return

    // Calculate progress statistics
    const totalSteps = allLines.length
    const completedSteps = allLines.filter(l => l.metadata?.status === 'completed').length
    const failedSteps = allLines.filter(l => l.metadata?.status === 'failed').length
    const inProgressSteps = allLines.filter(l =>
      ['in_progress', 'waiting_for_input', 'waiting_for_signal'].includes(l.metadata?.status)
    ).length

    const progressPercentage = Math.round((completedSteps / totalSteps) * 100)

    // Check if run is complete
    const isComplete = allLines.every(line => {
      const status = line.metadata?.status
      return ['completed', 'failed', 'cancelled', 'skipped'].includes(status)
    })

    // Get current run
    const runs = await universalApi.readTransactions({
      filters: { id: runId, organization_id: organizationId }
    })

    if (!runs || runs.length === 0) return

    const run = runs[0]
    let runStatus = run.metadata?.status || 'in_progress'

    if (isComplete) {
      if (failedSteps > 0) {
        runStatus = 'completed_with_errors'
      } else {
        runStatus = 'completed'
      }
    }

    // Update run metadata
    await universalApi.updateTransaction(runId, {
      metadata: {
        ...run.metadata,
        status: runStatus,
        progress_percentage: progressPercentage,
        completed_steps: completedSteps,
        failed_steps: failedSteps,
        in_progress_steps: inProgressSteps,
        total_steps: totalSteps,
        ...(isComplete && {
          completed_at: new Date().toISOString(),
          total_duration_minutes: calculateRunDuration(run)
        })
      }
    })

    // Create progress event
    await universalApi.createTransaction({
      transaction_type: 'playbook_run_progress',
      organization_id: organizationId,
      reference_entity_id: run.metadata?.playbook_id,
      smart_code: isComplete
        ? PlaybookSmartCodes.EXECUTION.RUN_COMPLETE
        : PlaybookSmartCodes.EXECUTION.RUN_START,
      total_amount: progressPercentage,
      metadata: {
        run_id: runId,
        progress_percentage: progressPercentage,
        completed_steps: completedSteps,
        failed_steps: failedSteps,
        in_progress_steps: inProgressSteps,
        total_steps: totalSteps,
        status: runStatus,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to update run progress:', error)
    // Don't throw - this shouldn't fail the completion
  }
}

/**
 * Gets the next steps that should be activated
 */
async function getNextSteps(runId: string, completedSequence: number): Promise<any[]> {
  try {
    // Get all step lines
    const allLines = await universalApi.readTransactionLines({
      transaction_id: runId
    })

    if (!allLines || allLines.length === 0) return []

    // Find steps that depend on the completed step
    const nextSteps = []

    for (const line of allLines) {
      const dependencies = line.metadata?.dependencies || []
      const dependsOnCompleted = dependencies.some(
        (dep: any) => dep.step_sequence === completedSequence
      )

      if (dependsOnCompleted && line.metadata?.status === 'pending') {
        // Check if all dependencies are satisfied
        const allDependenciesMet = checkAllDependencies(dependencies, allLines)

        if (allDependenciesMet) {
          nextSteps.push({
            step_id: line.metadata?.step_id,
            step_sequence: line.line_number,
            step_name: line.metadata?.step_name,
            step_type: line.metadata?.step_type,
            status: 'ready_to_activate'
          })
        }
      }
    }

    return nextSteps
  } catch (error) {
    console.error('Failed to get next steps:', error)
    return []
  }
}

/**
 * Checks if all dependencies for a step are satisfied
 */
function checkAllDependencies(dependencies: any[], allLines: any[]): boolean {
  for (const dep of dependencies) {
    const depLine = allLines.find(l => l.line_number === dep.step_sequence)
    if (!depLine) return false

    const depStatus = depLine.metadata?.status

    // Check based on dependency type
    switch (dep.dependency_type) {
      case 'completion':
      case 'success':
        if (depStatus !== 'completed') return false
        break
      case 'any':
        if (!['completed', 'failed', 'cancelled'].includes(depStatus)) return false
        break
      default:
        if (depStatus !== 'completed') return false
    }
  }

  return true
}

/**
 * Calculates the total run duration in minutes
 */
function calculateRunDuration(run: any): number {
  const startTime = new Date(run.created_at || run.metadata?.started_at).getTime()
  const endTime = Date.now()
  return Math.round((endTime - startTime) / 1000 / 60) // minutes
}
