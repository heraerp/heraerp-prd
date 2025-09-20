// Example API Handlers for WF STEP 3 Operations
// Thin, runner-only handlers that call procedures directly

import { NextRequest, NextResponse } from 'next/server'
import { runProcedure } from '@/lib/procedure-runner'

// POST /api/v1/workflows/:id/pause
export async function pauseWorkflow(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  
  const payload = {
    organization_id: body.organization_id,
    instance_id: params.id,
    reason: body.reason ?? null,
    paused_by: body.paused_by ?? null,
  }
  
  const result = await runProcedure('HERA.UNIV.WF.INSTANCE.PAUSE.V1', payload)
  return NextResponse.json(result)
}

// POST /api/v1/workflows/:id/resume
export async function resumeWorkflow(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  
  const payload = {
    organization_id: body.organization_id,
    instance_id: params.id,
    resumed_by: body.resumed_by ?? null,
    notes: body.notes ?? null,
  }
  
  const result = await runProcedure('HERA.UNIV.WF.INSTANCE.RESUME.V1', payload)
  return NextResponse.json(result)
}

// POST /api/v1/workflows/:id/reassign
export async function reassignWorkflow(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  
  const payload = {
    organization_id: body.organization_id,
    instance_id: params.id,
    owner_team: body.owner_team ?? null,
    owner_user_id: body.owner_user_id ?? null,
    reassigned_by: body.reassigned_by ?? null,
    reason: body.reason ?? null,
  }
  
  const result = await runProcedure('HERA.UNIV.WF.INSTANCE.REASSIGN.V1', payload)
  return NextResponse.json(result)
}

// POST /api/v1/workflows/:id/retry-effects
export async function retryEffects(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  
  const payload = {
    organization_id: body.organization_id,
    instance_id: params.id,
    step_id: body.step_id,
    effect_filter: body.effect_filter ?? null,
    force_retry: body.force_retry ?? false,
    retried_by: body.retried_by ?? null,
  }
  
  const result = await runProcedure('HERA.UNIV.WF.EFFECT.RETRY.V1', payload)
  return NextResponse.json(result)
}

// POST /api/v1/workflows/:id/sla-recalc
export async function recalculateSLA(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  
  const payload = {
    organization_id: body.organization_id,
    instance_id: params.id,
    sla_override_hours: body.sla_override_hours ?? null,
    recalc_reason: body.recalc_reason ?? null,
    recalc_by: body.recalc_by ?? null,
  }
  
  const result = await runProcedure('HERA.UNIV.WF.INSTANCE.SLA.RECALC.V1', payload)
  return NextResponse.json(result)
}

// POST /api/v1/tasks/:task_id/reassign
export async function reassignTask(req: NextRequest, { params }: { params: { task_id: string } }) {
  const body = await req.json()
  
  const payload = {
    organization_id: body.organization_id,
    task_id: params.task_id,
    assignee_role: body.assignee_role ?? null,
    assignee_user_id: body.assignee_user_id ?? null,
    reassigned_by: body.reassigned_by ?? null,
    reason: body.reason ?? null,
  }
  
  const result = await runProcedure('HERA.UNIV.TASK.REASSIGN.V1', payload)
  return NextResponse.json(result)
}

// GET /api/v1/workflows
export async function listWorkflows(req: NextRequest) {
  const url = new URL(req.url)
  const searchParams = url.searchParams
  
  const payload = {
    organization_id: searchParams.get('organization_id'),
    definition_code: searchParams.get('definition_code') ?? null,
    current_state: searchParams.get('current_state') ?? null,
    owner_team: searchParams.get('owner_team') ?? null,
    owner_user_id: searchParams.get('owner_user_id') ?? null,
    paused: searchParams.get('paused') ? searchParams.get('paused') === 'true' : null,
    overdue: searchParams.get('overdue') ? searchParams.get('overdue') === 'true' : null,
    created_after: searchParams.get('created_after') ?? null,
    created_before: searchParams.get('created_before') ?? null,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    sort_by: searchParams.get('sort_by') ?? 'created_at',
    sort_order: searchParams.get('sort_order') ?? 'desc',
  }
  
  const result = await runProcedure('HERA.UNIV.WF.INSTANCES.LIST.V1', payload)
  return NextResponse.json(result)
}

// GET /api/v1/workflows/:id
export async function getWorkflow(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const searchParams = url.searchParams
  
  const payload = {
    organization_id: searchParams.get('organization_id'),
    instance_id: params.id,
    include_steps: searchParams.get('include_steps') !== 'false',
    include_tasks: searchParams.get('include_tasks') !== 'false',
    include_timers: searchParams.get('include_timers') !== 'false',
    steps_limit: searchParams.get('steps_limit') ? parseInt(searchParams.get('steps_limit')!) : 100,
  }
  
  const result = await runProcedure('HERA.UNIV.WF.INSTANCE.GET.V1', payload)
  return NextResponse.json(result)
}

// GET /api/v1/tasks
export async function listTasks(req: NextRequest) {
  const url = new URL(req.url)
  const searchParams = url.searchParams
  
  const payload = {
    organization_id: searchParams.get('organization_id'),
    instance_id: searchParams.get('instance_id') ?? null,
    task_state: searchParams.get('task_state') ?? null,
    assignee_role: searchParams.get('assignee_role') ?? null,
    assignee_user_id: searchParams.get('assignee_user_id') ?? null,
    priority: searchParams.get('priority') ?? null,
    overdue: searchParams.get('overdue') ? searchParams.get('overdue') === 'true' : null,
    created_after: searchParams.get('created_after') ?? null,
    created_before: searchParams.get('created_before') ?? null,
    completed_after: searchParams.get('completed_after') ?? null,
    completed_before: searchParams.get('completed_before') ?? null,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    sort_by: searchParams.get('sort_by') ?? 'created_at',
    sort_order: searchParams.get('sort_order') ?? 'desc',
  }
  
  const result = await runProcedure('HERA.UNIV.TASKS.LIST.V1', payload)
  return NextResponse.json(result)
}

// Scheduler job function (called by cron/worker)
export async function runScheduler() {
  const payload = {
    dry_run: false,
    max_instances_per_run: 100,
  }
  
  const result = await runProcedure('HERA.UNIV.WF.SCHEDULER.V1', payload)
  return result
}

// Error handling wrapper for all handlers
export function withErrorHandling(handler: Function) {
  return async (req: NextRequest, params?: any) => {
    try {
      return await handler(req, params)
    } catch (error) {
      console.error('Workflow API error:', error)
      
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message, code: 'HANDLER_ERROR' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Unknown error occurred', code: 'UNKNOWN_ERROR' },
        { status: 500 }
      )
    }
  }
}

// Export handlers with error handling
export const handlers = {
  pauseWorkflow: withErrorHandling(pauseWorkflow),
  resumeWorkflow: withErrorHandling(resumeWorkflow),
  reassignWorkflow: withErrorHandling(reassignWorkflow),
  retryEffects: withErrorHandling(retryEffects),
  recalculateSLA: withErrorHandling(recalculateSLA),
  reassignTask: withErrorHandling(reassignTask),
  listWorkflows: withErrorHandling(listWorkflows),
  getWorkflow: withErrorHandling(getWorkflow),
  listTasks: withErrorHandling(listTasks),
  runScheduler,
}