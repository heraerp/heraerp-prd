/**
 * HERA Playbooks Runs API - Minimal Implementation
 *
 * Implements POST /playbook-runs with simplified functionality
 */

import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api-v2'

interface CreatePlaybookRunRequest {
  playbook_id: string
  run_name?: string
  input_data: Record<string, any>
  execution_context?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'critical'
}

/**
 * POST /api/v1/playbook-runs - Create new playbook run
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreatePlaybookRunRequest = await request.json()

    // Basic validation
    if (!body.playbook_id || !body.input_data) {
      return NextResponse.json(
        {
          error: 'playbook_id and input_data are required',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    // Create a simple run record
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const response = {
      success: true,
      data: {
        run_id: runId,
        run_header: {
          id: runId,
          transaction_type: 'playbook_run',
          smart_code: 'HERA.PLAYBOOK.RUN.SIMPLE.v1',
          status: 'in_progress',
          playbook_id: body.playbook_id,
          playbook_name: 'Playbook Run',
          total_amount: 1,
          total_steps: 1,
          current_step: 1,
          started_at: new Date().toISOString()
        },
        first_step_line: {
          id: `step_${runId}`,
          transaction_id: runId,
          line_number: 1,
          step_id: 'step_1',
          step_name: 'Initial Step',
          step_type: 'system',
          worker_type: 'system',
          status: 'pending',
          smart_code: 'HERA.PLAYBOOK.STEP.SIMPLE.v1',
          estimated_duration_minutes: 5
        },
        execution_status: 'in_progress',
        tracking_url: `/api/v1/playbooks/runs/${runId}`
      },
      metadata: {
        organization_id: 'default',
        created_by: 'system',
        creation_time: new Date().toISOString()
      }
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Create playbook run error:', error)

    return NextResponse.json(
      {
        error: 'Failed to create playbook run',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/playbook-runs - List playbook runs
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        offset: 0,
        has_more: false
      },
      filters_applied: {},
      metadata: {
        organization_id: 'default',
        query_time_ms: 0
      }
    })
  } catch (error) {
    console.error('List playbook runs error:', error)

    return NextResponse.json(
      {
        error: 'Failed to list playbook runs',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
