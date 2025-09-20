/**
 * HERA Playbooks Execution API
 *
 * Implements POST /playbooks/{id}/execute for starting playbook executions
 * with comprehensive validation, monitoring, and error handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { playbookExecutionEngine } from '@/lib/playbooks/execution/playbook-execution-engine'
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth'
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer'

interface ExecutePlaybookRequest {
  input_data: Record<string, any>
  execution_context?: Record<string, any>
  execution_options?: {
    skip_validation?: boolean
    parallel_execution?: boolean
    max_retries?: number
    timeout_minutes?: number
    notification_settings?: {
      on_start?: boolean
      on_completion?: boolean
      on_failure?: boolean
      on_step_completion?: boolean
      notification_channels?: string[]
    }
    context_variables?: Record<string, any>
  }
}

/**
 * POST /api/v1/playbooks/{id}/execute - Execute a playbook
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check execution permissions
    if (!playbookAuthService.canExecutePlaybook(params.id)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions to execute this playbook',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // Set organization context
    const organizationId = authState.organization.id
    playbookExecutionEngine.setOrganizationContext(organizationId)

    const playbookId = params.id
    const body: ExecutePlaybookRequest = await request.json()

    // Validate required fields
    if (!body.input_data) {
      return NextResponse.json(
        {
          error: 'input_data is required for playbook execution',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    // Get playbook definition
    const playbook = await playbookDataLayer.getPlaybookDefinition(playbookId)
    if (!playbook) {
      return NextResponse.json(
        {
          error: 'Playbook not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check playbook status
    if (playbook.status !== 'active') {
      return NextResponse.json(
        {
          error: `Cannot execute playbook with status: ${playbook.status}`,
          code: 'INVALID_PLAYBOOK_STATUS'
        },
        { status: 400 }
      )
    }

    // Validate input data against input contract (if not skipped)
    if (!body.execution_options?.skip_validation) {
      const validationResult = await validateInputContract(playbookId, body.input_data)
      if (!validationResult.valid) {
        return NextResponse.json(
          {
            error: 'Input data validation failed',
            code: 'INPUT_VALIDATION_ERROR',
            details: validationResult.errors
          },
          { status: 400 }
        )
      }
    }

    // Check for duplicate executions (within last 5 minutes)
    const recentExecutions = await playbookExecutionEngine.listExecutions({
      playbook_id: playbookId,
      initiated_by: authState.user?.id,
      limit: 5
    })

    const duplicateExecution = recentExecutions.data.find(exec => {
      const timeDiff = Date.now() - new Date(exec.started_at).getTime()
      return (
        timeDiff < 5 * 60 * 1000 && // 5 minutes
        exec.status === 'in_progress' &&
        JSON.stringify(exec.output_data) === JSON.stringify(body.input_data)
      )
    })

    if (duplicateExecution) {
      return NextResponse.json(
        {
          error: 'Duplicate execution detected',
          code: 'DUPLICATE_EXECUTION',
          existing_execution_id: duplicateExecution.execution_id
        },
        { status: 409 }
      )
    }

    // Prepare execution request
    const executionRequest = {
      playbook_id: playbookId,
      initiated_by: authState.user?.id || 'anonymous',
      execution_context: {
        organization_id: organizationId,
        user_id: authState.user?.id,
        initiated_at: new Date().toISOString(),
        client_info: {
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        },
        ...body.execution_context
      },
      input_data: body.input_data,
      execution_options: {
        max_retries: 3,
        timeout_minutes: 60,
        parallel_execution: false,
        ...body.execution_options
      }
    }

    // Start execution
    const executionResult = await playbookExecutionEngine.executePlaybook(executionRequest)

    // Log execution start
    console.log(`Playbook execution started: ${executionResult.execution_id}`, {
      playbook_id: playbookId,
      playbook_name: playbook.name,
      initiated_by: executionRequest.initiated_by,
      organization_id: organizationId
    })

    // Return execution details
    return NextResponse.json(
      {
        success: true,
        data: {
          execution_id: executionResult.execution_id,
          status: executionResult.status,
          playbook_id: playbookId,
          playbook_name: playbook.name,
          started_at: executionResult.started_at,
          total_steps: executionResult.total_steps,
          estimated_duration_hours: playbook.metadata.estimated_duration_hours,
          execution_options: executionRequest.execution_options,
          tracking_url: `/api/v1/playbooks/runs/${executionResult.execution_id}`
        },
        metadata: {
          organization_id: organizationId,
          initiated_by: executionRequest.initiated_by,
          validation_performed: !body.execution_options?.skip_validation,
          execution_time: new Date().toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Playbook execution error:', error)

    return NextResponse.json(
      {
        error: 'Failed to execute playbook',
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions

/**
 * Validate input data against playbook input contract
 */
async function validateInputContract(
  playbookId: string,
  inputData: Record<string, any>
): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    const inputContract = await playbookDataLayer.getContract(playbookId, 'input_contract')

    if (!inputContract) {
      // No contract means no validation required
      return { valid: true }
    }

    const schema = inputContract.value_json

    // Basic validation - in production, use a JSON Schema validator
    const errors: string[] = []

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in inputData)) {
          errors.push(`Required field missing: ${field}`)
        }
      }
    }

    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties as Record<string, any>)) {
        if (field in inputData) {
          const value = inputData[field]
          const fieldType = fieldSchema.type

          if (fieldType && typeof value !== fieldType) {
            errors.push(`Field ${field} must be of type ${fieldType}, got ${typeof value}`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    console.error('Input validation error:', error)
    return {
      valid: false,
      errors: ['Validation failed due to internal error']
    }
  }
}
