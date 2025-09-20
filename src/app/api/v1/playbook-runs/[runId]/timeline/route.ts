/**
 * HERA Playbooks Timeline API
 *
 * Implements GET /playbook-runs/{runId}/timeline
 * Provides a comprehensive timeline view of playbook run execution including all events, state changes, and signals.
 */
import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth'

interface TimelineEvent {
  timestamp: string
  event_type:
    | 'run_started'
    | 'run_completed'
    | 'run_failed'
    | 'run_cancelled'
    | 'run_paused'
    | 'run_resumed'
    | 'step_started'
    | 'step_completed'
    | 'step_failed'
    | 'step_cancelled'
    | 'step_skipped'
    | 'step_waiting'
    | 'step_activated'
    | 'step_retry'
    | 'signal_received'
    | 'approval_requested'
    | 'approval_received'
    | 'error_occurred'
    | 'sla_breach'
  sequence?: number
  step_name?: string
  actor?: {
    user_id?: string
    user_name?: string
    system?: string
  }
  duration_ms?: number
  details?: Record<string, any>
  status?: string
  signal_type?: string
  error_message?: string
  sla_details?: {
    expected_duration_minutes: number
    actual_duration_minutes: number
    breach_percentage: number
  }
}

interface StepSummary {
  sequence: number
  step_name: string
  step_type: string
  status: string
  start_time?: string
  end_time?: string
  duration_ms?: number
  retry_count: number
  assigned_to?: {
    user_id: string
    user_name: string
  }
  sla_status?: 'met' | 'breached' | 'at_risk'
}

interface TimelineResponse {
  run_id: string
  playbook_id: string
  playbook_name: string
  status: string
  start_time: string
  end_time?: string
  total_duration_ms?: number
  total_steps: number
  completed_steps: number
  failed_steps: number
  steps_summary: StepSummary[]
  timeline_events: TimelineEvent[]
  critical_path?: number[]
  bottlenecks?: Array<{
    step_sequence: number
    step_name: string
    wait_time_ms: number
    reason: string
  }>
}

export async function GET(request: NextRequest, { params }: { params: { runId: string } }) {
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

    // Check permission to view timeline
    const hasPermission = await playbookAuthService.checkPermission(
      auth.userId!,
      auth.organizationId!,
      'PLAYBOOK_RUN_VIEW',
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

    // Get all step lines
    const stepLines = await universalApi.readTransactionLines({
      transaction_id: params.runId
    })

    // Get all related events (signals, completions, errors, etc.)
    const relatedEvents = await universalApi.readTransactions({
      filters: {
        organization_id: auth.organizationId!,
        metadata: { run_id: params.runId }
      }
    })

    // Build timeline events
    const timelineEvents: TimelineEvent[] = []

    // 1. Run start event
    timelineEvents.push({
      timestamp: run.created_at || run.metadata?.started_at,
      event_type: 'run_started',
      actor: {
        user_id: run.metadata?.initiated_by_user_id,
        user_name: run.metadata?.initiated_by_user_name
      },
      details: {
        playbook_id: run.metadata?.playbook_id,
        playbook_name: run.metadata?.playbook_name,
        input_params: run.metadata?.input_params
      }
    })

    // 2. Process step events from lines
    if (stepLines) {
      for (const line of stepLines) {
        const metadata = line.metadata || {}

        // Step activated/ready
        if (metadata.activated_at) {
          timelineEvents.push({
            timestamp: metadata.activated_at,
            event_type: 'step_activated',
            sequence: line.line_number,
            step_name: metadata.step_name,
            details: {
              dependencies_met: true
            }
          })
        }

        // Step started
        if (metadata.started_at) {
          timelineEvents.push({
            timestamp: metadata.started_at,
            event_type: 'step_started',
            sequence: line.line_number,
            step_name: metadata.step_name,
            actor:
              metadata.worker_type === 'human'
                ? {
                    user_id: metadata.assigned_to_user_id,
                    user_name: metadata.assigned_to_user_name
                  }
                : {
                    system: metadata.worker_type
                  }
          })
        }

        // Step waiting states
        if (metadata.status === 'waiting_for_input') {
          timelineEvents.push({
            timestamp: metadata.updated_at || new Date().toISOString(),
            event_type: 'step_waiting',
            sequence: line.line_number,
            step_name: metadata.step_name,
            details: {
              waiting_for: 'input',
              assigned_to: metadata.assigned_to_user_name
            }
          })
        }

        // Step completion/failure/cancellation
        if (metadata.completed_at) {
          const eventType =
            metadata.status === 'completed'
              ? 'step_completed'
              : metadata.status === 'failed'
                ? 'step_failed'
                : metadata.status === 'cancelled'
                  ? 'step_cancelled'
                  : metadata.status === 'skipped'
                    ? 'step_skipped'
                    : null

          if (eventType) {
            timelineEvents.push({
              timestamp: metadata.completed_at,
              event_type: eventType as any,
              sequence: line.line_number,
              step_name: metadata.step_name,
              duration_ms: metadata.started_at
                ? new Date(metadata.completed_at).getTime() -
                  new Date(metadata.started_at).getTime()
                : undefined,
              actor: {
                user_id: metadata.completed_by_user_id,
                user_name: metadata.completed_by_user_name
              },
              error_message: metadata.error_message,
              details: {
                output_data: metadata.output_data,
                completion_notes: metadata.completion_notes
              }
            })
          }
        }

        // SLA breach check
        if (metadata.expected_duration_minutes && metadata.actual_duration_minutes) {
          if (metadata.actual_duration_minutes > metadata.expected_duration_minutes) {
            const breachPercentage =
              ((metadata.actual_duration_minutes - metadata.expected_duration_minutes) /
                metadata.expected_duration_minutes) *
              100

            timelineEvents.push({
              timestamp: metadata.completed_at || new Date().toISOString(),
              event_type: 'sla_breach',
              sequence: line.line_number,
              step_name: metadata.step_name,
              sla_details: {
                expected_duration_minutes: metadata.expected_duration_minutes,
                actual_duration_minutes: metadata.actual_duration_minutes,
                breach_percentage: breachPercentage
              }
            })
          }
        }

        // Retry events
        if (metadata.retry_count > 0 && metadata.retry_requested_at) {
          timelineEvents.push({
            timestamp: metadata.retry_requested_at,
            event_type: 'step_retry',
            sequence: line.line_number,
            step_name: metadata.step_name,
            actor: {
              user_id: metadata.retry_requested_by
            },
            details: {
              retry_count: metadata.retry_count
            }
          })
        }
      }
    }

    // 3. Process related event transactions
    if (relatedEvents) {
      for (const event of relatedEvents) {
        // Signal events
        if (event.transaction_type === 'playbook_signal') {
          timelineEvents.push({
            timestamp: event.metadata?.timestamp || event.created_at,
            event_type: 'signal_received',
            signal_type: event.metadata?.signal_type,
            sequence: event.metadata?.target_step_sequence,
            actor: {
              user_id: event.metadata?.sent_by_user_id,
              user_name: event.metadata?.sent_by_user_name
            },
            details: {
              data: event.metadata?.data,
              reason: event.metadata?.reason
            }
          })
        }

        // Approval events
        if (
          event.transaction_type === 'playbook_step_completion' &&
          event.metadata?.approval_granted !== undefined
        ) {
          timelineEvents.push({
            timestamp: event.metadata?.timestamp || event.created_at,
            event_type: 'approval_received',
            sequence: event.metadata?.step_sequence,
            step_name: event.metadata?.step_name,
            actor: {
              user_id: event.metadata?.completed_by
            },
            details: {
              approved: event.metadata?.approval_granted,
              reason: event.metadata?.approval_reason
            }
          })
        }

        // Error events
        if (
          event.transaction_type === 'playbook_ai_error' ||
          event.transaction_type === 'playbook_external_error'
        ) {
          timelineEvents.push({
            timestamp: event.metadata?.timestamp || event.created_at,
            event_type: 'error_occurred',
            sequence: event.metadata?.step_sequence,
            error_message: event.metadata?.error_message,
            details: {
              error_type: event.transaction_type,
              error_stack: event.metadata?.error_stack
            }
          })
        }
      }
    }

    // 4. Run completion/status change events
    if (run.metadata?.completed_at) {
      const eventType =
        run.metadata?.status === 'completed'
          ? 'run_completed'
          : run.metadata?.status === 'failed'
            ? 'run_failed'
            : run.metadata?.status === 'cancelled'
              ? 'run_cancelled'
              : null

      if (eventType) {
        timelineEvents.push({
          timestamp: run.metadata.completed_at,
          event_type: eventType as any,
          duration_ms:
            new Date(run.metadata.completed_at).getTime() -
            new Date(run.created_at || run.metadata.started_at).getTime(),
          details: {
            completion_stats: run.metadata?.completion_stats
          }
        })
      }
    }

    // Sort events chronologically
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // Build steps summary
    const stepsSummary: StepSummary[] =
      stepLines?.map(line => {
        const metadata = line.metadata || {}
        const startTime = metadata.started_at
        const endTime = metadata.completed_at || metadata.cancelled_at || metadata.failed_at

        return {
          sequence: line.line_number,
          step_name: metadata.step_name || `Step ${line.line_number}`,
          step_type: metadata.step_type || 'unknown',
          status: metadata.status || 'pending',
          start_time: startTime,
          end_time: endTime,
          duration_ms:
            startTime && endTime
              ? new Date(endTime).getTime() - new Date(startTime).getTime()
              : undefined,
          retry_count: metadata.retry_count || 0,
          assigned_to: metadata.assigned_to_user_id
            ? {
                user_id: metadata.assigned_to_user_id,
                user_name: metadata.assigned_to_user_name || 'Unknown'
              }
            : undefined,
          sla_status: determineSLAStatus(metadata)
        }
      }) || []

    // Identify bottlenecks (steps that took significantly longer than expected)
    const bottlenecks = identifyBottlenecks(stepsSummary, stepLines || [])

    // Calculate critical path (longest sequence of dependent steps)
    const criticalPath = calculateCriticalPath(stepLines || [])

    // Build response
    const response: TimelineResponse = {
      run_id: params.runId,
      playbook_id: run.metadata?.playbook_id || '',
      playbook_name: run.metadata?.playbook_name || '',
      status: run.metadata?.status || 'unknown',
      start_time: run.created_at || run.metadata?.started_at,
      end_time: run.metadata?.completed_at,
      total_duration_ms: run.metadata?.completed_at
        ? new Date(run.metadata.completed_at).getTime() -
          new Date(run.created_at || run.metadata.started_at).getTime()
        : undefined,
      total_steps: stepsSummary.length,
      completed_steps: stepsSummary.filter(s => s.status === 'completed').length,
      failed_steps: stepsSummary.filter(s => s.status === 'failed').length,
      steps_summary: stepsSummary,
      timeline_events: timelineEvents,
      critical_path: criticalPath,
      bottlenecks: bottlenecks
    }

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Failed to generate timeline:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

function determineSLAStatus(metadata: any): 'met' | 'breached' | 'at_risk' | undefined {
  if (!metadata.expected_duration_minutes) return undefined

  if (metadata.actual_duration_minutes) {
    // Completed step
    return metadata.actual_duration_minutes > metadata.expected_duration_minutes
      ? 'breached'
      : 'met'
  } else if (metadata.started_at) {
    // In-progress step
    const elapsedMinutes = (Date.now() - new Date(metadata.started_at).getTime()) / 1000 / 60
    if (elapsedMinutes > metadata.expected_duration_minutes) {
      return 'breached'
    } else if (elapsedMinutes > metadata.expected_duration_minutes * 0.8) {
      return 'at_risk'
    }
  }

  return undefined
}

function identifyBottlenecks(
  stepsSummary: StepSummary[],
  stepLines: any[]
): Array<{ step_sequence: number; step_name: string; wait_time_ms: number; reason: string }> {
  const bottlenecks: Array<{
    step_sequence: number
    step_name: string
    wait_time_ms: number
    reason: string
  }> = []

  for (const step of stepsSummary) {
    const line = stepLines.find(l => l.line_number === step.sequence)
    if (!line) continue

    const metadata = line.metadata || {}

    // Check for long wait times before starting
    if (metadata.activated_at && metadata.started_at) {
      const waitTime =
        new Date(metadata.started_at).getTime() - new Date(metadata.activated_at).getTime()

      if (waitTime > 5 * 60 * 1000) {
        // More than 5 minutes wait
        bottlenecks.push({
          step_sequence: step.sequence,
          step_name: step.step_name,
          wait_time_ms: waitTime,
          reason: 'Long queue wait time'
        })
      }
    }

    // Check for steps that took much longer than expected
    if (metadata.expected_duration_minutes && metadata.actual_duration_minutes) {
      const expectedMs = metadata.expected_duration_minutes * 60 * 1000
      const actualMs = metadata.actual_duration_minutes * 60 * 1000

      if (actualMs > expectedMs * 1.5) {
        // 50% over expected
        bottlenecks.push({
          step_sequence: step.sequence,
          step_name: step.step_name,
          wait_time_ms: actualMs - expectedMs,
          reason: 'Execution time exceeded SLA'
        })
      }
    }

    // Check for multiple retries
    if (metadata.retry_count > 2) {
      bottlenecks.push({
        step_sequence: step.sequence,
        step_name: step.step_name,
        wait_time_ms: 0, // Not a wait time issue, but still a bottleneck
        reason: `Multiple retries (${metadata.retry_count})`
      })
    }
  }

  return bottlenecks.sort((a, b) => b.wait_time_ms - a.wait_time_ms)
}

function calculateCriticalPath(stepLines: any[]): number[] {
  // Simple implementation: find the longest chain of dependent steps
  // In a real implementation, this would use graph algorithms

  const stepMap = new Map<number, any>()
  stepLines.forEach(line => stepMap.set(line.line_number, line))

  let longestPath: number[] = []

  // Try starting from each step that has no dependencies
  const startSteps = stepLines.filter(
    line => !line.metadata?.dependencies || line.metadata.dependencies.length === 0
  )

  for (const startStep of startSteps) {
    const path = findLongestPath(startStep.line_number, stepMap, new Set())
    if (path.length > longestPath.length) {
      longestPath = path
    }
  }

  return longestPath
}

function findLongestPath(
  stepNum: number,
  stepMap: Map<number, any>,
  visited: Set<number>
): number[] {
  if (visited.has(stepNum)) return []

  visited.add(stepNum)

  // Find all steps that depend on this one
  const dependentSteps = Array.from(stepMap.values()).filter(step => {
    const deps = step.metadata?.dependencies || []
    return deps.some((d: any) => d.step_sequence === stepNum)
  })

  if (dependentSteps.length === 0) {
    return [stepNum]
  }

  let longestSubPath: number[] = []
  for (const depStep of dependentSteps) {
    const subPath = findLongestPath(depStep.line_number, stepMap, visited)
    if (subPath.length > longestSubPath.length) {
      longestSubPath = subPath
    }
  }

  return [stepNum, ...longestSubPath]
}
