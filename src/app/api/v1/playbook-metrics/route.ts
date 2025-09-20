/**
 * HERA Playbooks Metrics API
 *
 * Implements GET /playbook-metrics
 * Provides comprehensive metrics for playbook executions including SLA breaches, retries, performance, and reliability.
 */
import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth'

interface PlaybookMetrics {
  overall_stats: {
    total_playbooks: number
    active_playbooks: number
    total_runs: number
    active_runs: number
    success_rate: number
    average_duration_minutes: number
  }
  sla_metrics: {
    total_steps_with_sla: number
    sla_breaches: number
    sla_breach_rate: number
    average_breach_percentage: number
    top_sla_breaches: Array<{
      playbook_id: string
      playbook_name: string
      step_name: string
      breach_count: number
      average_breach_minutes: number
      worst_breach_minutes: number
    }>
    sla_by_step_type: Record<
      string,
      {
        total_steps: number
        breaches: number
        breach_rate: number
      }
    >
  }
  retry_metrics: {
    total_retries: number
    retry_success_rate: number
    average_retries_per_failure: number
    max_retries_reached: number
    retry_by_step_type: Record<
      string,
      {
        total_retries: number
        success_rate: number
        average_attempts: number
      }
    >
    top_retry_steps: Array<{
      playbook_id: string
      playbook_name: string
      step_name: string
      total_retries: number
      success_rate: number
      common_errors: string[]
    }>
  }
  performance_metrics: {
    p50_duration_minutes: number
    p90_duration_minutes: number
    p99_duration_minutes: number
    slowest_playbooks: Array<{
      playbook_id: string
      playbook_name: string
      average_duration_minutes: number
      run_count: number
    }>
    fastest_playbooks: Array<{
      playbook_id: string
      playbook_name: string
      average_duration_minutes: number
      run_count: number
    }>
    bottleneck_analysis: {
      human_steps: {
        average_wait_time_minutes: number
        average_execution_time_minutes: number
      }
      system_steps: {
        average_wait_time_minutes: number
        average_execution_time_minutes: number
      }
      ai_steps: {
        average_wait_time_minutes: number
        average_execution_time_minutes: number
      }
      external_steps: {
        average_wait_time_minutes: number
        average_execution_time_minutes: number
      }
    }
  }
  reliability_metrics: {
    mtbf_hours: number // Mean Time Between Failures
    mttr_minutes: number // Mean Time To Recovery
    availability_percentage: number
    error_rate: number
    common_errors: Array<{
      error_type: string
      count: number
      percentage: number
      affected_playbooks: string[]
    }>
  }
  time_series: {
    period: string // 'hourly' | 'daily' | 'weekly' | 'monthly'
    data: Array<{
      timestamp: string
      runs_started: number
      runs_completed: number
      runs_failed: number
      sla_breaches: number
      retries: number
    }>
  }
}

export async function GET(request: NextRequest) {
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

    // Check permission to view metrics
    const hasPermission = await playbookAuthService.checkPermission(
      auth.userId!,
      auth.organizationId!,
      'PLAYBOOK_METRICS_VIEW'
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const playbookId = searchParams.get('playbook_id')
    const startDate =
      searchParams.get('start_date') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days
    const endDate = searchParams.get('end_date') || new Date().toISOString()
    const groupBy = searchParams.get('group_by') || 'daily' // hourly, daily, weekly, monthly

    // Set organization context
    universalApi.setOrganizationId(auth.organizationId!)

    // Build filters
    const runFilters: any = {
      organization_id: auth.organizationId!,
      transaction_type: 'playbook_run',
      created_at: {
        $gte: startDate,
        $lte: endDate
      }
    }

    if (playbookId) {
      runFilters['metadata.playbook_id'] = playbookId
    }

    // Get all playbook runs in the time period
    const runs = await universalApi.readTransactions({
      filters: runFilters
    })

    // Get all playbooks
    const playbooks = await universalApi.readEntities({
      filters: {
        organization_id: auth.organizationId!,
        entity_type: 'playbook'
      }
    })

    // Collect all run IDs for batch querying lines
    const runIds = runs?.map(r => r.id) || []

    // Get all step lines for these runs (this is simplified - in production would batch)
    const allStepLines: any[] = []
    for (const runId of runIds) {
      const lines = await universalApi.readTransactionLines({
        transaction_id: runId
      })
      if (lines) {
        allStepLines.push(...lines.map(l => ({ ...l, run_id: runId })))
      }
    }

    // Get all related events (signals, errors, etc.)
    const relatedEvents = await universalApi.readTransactions({
      filters: {
        organization_id: auth.organizationId!,
        transaction_type: {
          $in: [
            'playbook_signal',
            'playbook_step_completion',
            'playbook_ai_error',
            'playbook_external_error',
            'playbook_orchestrator_event'
          ]
        },
        created_at: {
          $gte: startDate,
          $lte: endDate
        }
      }
    })

    // Calculate metrics
    const metrics = calculateMetrics(
      playbooks || [],
      runs || [],
      allStepLines,
      relatedEvents || [],
      groupBy
    )

    return NextResponse.json({
      success: true,
      data: metrics,
      filters: {
        playbook_id: playbookId,
        start_date: startDate,
        end_date: endDate,
        group_by: groupBy
      }
    })
  } catch (error) {
    console.error('Failed to calculate metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

function calculateMetrics(
  playbooks: any[],
  runs: any[],
  stepLines: any[],
  events: any[],
  groupBy: string
): PlaybookMetrics {
  // Overall stats
  const activeRuns = runs.filter(r =>
    ['pending', 'in_progress', 'paused'].includes(r.metadata?.status)
  )
  const completedRuns = runs.filter(r =>
    ['completed', 'failed', 'cancelled'].includes(r.metadata?.status)
  )
  const successfulRuns = runs.filter(r => r.metadata?.status === 'completed')

  // SLA metrics
  const slaMetrics = calculateSLAMetrics(stepLines, playbooks)

  // Retry metrics
  const retryMetrics = calculateRetryMetrics(stepLines, events, playbooks)

  // Performance metrics
  const performanceMetrics = calculatePerformanceMetrics(runs, stepLines, playbooks)

  // Reliability metrics
  const reliabilityMetrics = calculateReliabilityMetrics(runs, stepLines, events)

  // Time series data
  const timeSeries = generateTimeSeries(runs, stepLines, groupBy)

  // Calculate average duration
  const durations = completedRuns
    .map(r => r.metadata?.total_duration_minutes)
    .filter(d => d !== undefined && d !== null)
  const avgDuration =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

  return {
    overall_stats: {
      total_playbooks: playbooks.length,
      active_playbooks: playbooks.filter(p => p.metadata?.status === 'active').length,
      total_runs: runs.length,
      active_runs: activeRuns.length,
      success_rate:
        completedRuns.length > 0 ? (successfulRuns.length / completedRuns.length) * 100 : 0,
      average_duration_minutes: avgDuration
    },
    sla_metrics: slaMetrics,
    retry_metrics: retryMetrics,
    performance_metrics: performanceMetrics,
    reliability_metrics: reliabilityMetrics,
    time_series: timeSeries
  }
}

function calculateSLAMetrics(stepLines: any[], playbooks: any[]): PlaybookMetrics['sla_metrics'] {
  const stepsWithSLA = stepLines.filter(s => s.metadata?.expected_duration_minutes !== undefined)

  const breachedSteps = stepsWithSLA.filter(s => {
    const expected = s.metadata.expected_duration_minutes
    const actual = s.metadata.actual_duration_minutes
    return actual && actual > expected
  })

  // Calculate breach percentages
  const breachPercentages = breachedSteps.map(s => {
    const expected = s.metadata.expected_duration_minutes
    const actual = s.metadata.actual_duration_minutes
    return ((actual - expected) / expected) * 100
  })

  const avgBreachPercentage =
    breachPercentages.length > 0
      ? breachPercentages.reduce((a, b) => a + b, 0) / breachPercentages.length
      : 0

  // Group breaches by playbook and step
  const breachMap = new Map<string, any>()
  breachedSteps.forEach(step => {
    const key = `${step.metadata?.playbook_id}:${step.metadata?.step_name}`
    if (!breachMap.has(key)) {
      breachMap.set(key, {
        playbook_id: step.metadata?.playbook_id,
        playbook_name: step.metadata?.playbook_name || 'Unknown',
        step_name: step.metadata?.step_name || 'Unknown',
        breaches: [],
        breach_count: 0
      })
    }
    const entry = breachMap.get(key)
    const breachMinutes =
      step.metadata.actual_duration_minutes - step.metadata.expected_duration_minutes
    entry.breaches.push(breachMinutes)
    entry.breach_count++
  })

  // Calculate top SLA breaches
  const topBreaches = Array.from(breachMap.values())
    .map(entry => ({
      playbook_id: entry.playbook_id,
      playbook_name: entry.playbook_name,
      step_name: entry.step_name,
      breach_count: entry.breach_count,
      average_breach_minutes:
        entry.breaches.reduce((a: number, b: number) => a + b, 0) / entry.breaches.length,
      worst_breach_minutes: Math.max(...entry.breaches)
    }))
    .sort((a, b) => b.breach_count - a.breach_count)
    .slice(0, 10)

  // SLA by step type
  const slaByType: Record<string, any> = {}
  ;['human', 'system', 'ai', 'external'].forEach(stepType => {
    const typeSteps = stepsWithSLA.filter(s => s.metadata?.step_type === stepType)
    const typeBreaches = typeSteps.filter(s => {
      const expected = s.metadata.expected_duration_minutes
      const actual = s.metadata.actual_duration_minutes
      return actual && actual > expected
    })

    slaByType[stepType] = {
      total_steps: typeSteps.length,
      breaches: typeBreaches.length,
      breach_rate: typeSteps.length > 0 ? (typeBreaches.length / typeSteps.length) * 100 : 0
    }
  })

  return {
    total_steps_with_sla: stepsWithSLA.length,
    sla_breaches: breachedSteps.length,
    sla_breach_rate:
      stepsWithSLA.length > 0 ? (breachedSteps.length / stepsWithSLA.length) * 100 : 0,
    average_breach_percentage: avgBreachPercentage,
    top_sla_breaches: topBreaches,
    sla_by_step_type: slaByType
  }
}

function calculateRetryMetrics(
  stepLines: any[],
  events: any[],
  playbooks: any[]
): PlaybookMetrics['retry_metrics'] {
  const retriedSteps = stepLines.filter(s => (s.metadata?.retry_count || 0) > 0)
  const totalRetries = retriedSteps.reduce((sum, s) => sum + (s.metadata?.retry_count || 0), 0)

  // Calculate retry success rate
  const retriedAndSucceeded = retriedSteps.filter(s => s.metadata?.status === 'completed')
  const retrySuccessRate =
    retriedSteps.length > 0 ? (retriedAndSucceeded.length / retriedSteps.length) * 100 : 0

  // Average retries per failure
  const failedSteps = stepLines.filter(s => s.metadata?.status === 'failed')
  const avgRetriesPerFailure =
    failedSteps.length > 0
      ? failedSteps.reduce((sum, s) => sum + (s.metadata?.retry_count || 0), 0) / failedSteps.length
      : 0

  // Max retries reached
  const maxRetriesReached = retriedSteps.filter(
    s => s.metadata?.retry_count >= (s.metadata?.max_retries || 3)
  ).length

  // Retry by step type
  const retryByType: Record<string, any> = {}
  ;['human', 'system', 'ai', 'external'].forEach(stepType => {
    const typeRetries = retriedSteps.filter(s => s.metadata?.step_type === stepType)
    const typeSuccesses = typeRetries.filter(s => s.metadata?.status === 'completed')
    const totalTypeRetries = typeRetries.reduce((sum, s) => sum + (s.metadata?.retry_count || 0), 0)

    retryByType[stepType] = {
      total_retries: totalTypeRetries,
      success_rate: typeRetries.length > 0 ? (typeSuccesses.length / typeRetries.length) * 100 : 0,
      average_attempts: typeRetries.length > 0 ? totalTypeRetries / typeRetries.length : 0
    }
  })

  // Top retry steps
  const retryMap = new Map<string, any>()
  retriedSteps.forEach(step => {
    const key = `${step.metadata?.playbook_id}:${step.metadata?.step_name}`
    if (!retryMap.has(key)) {
      retryMap.set(key, {
        playbook_id: step.metadata?.playbook_id,
        playbook_name: step.metadata?.playbook_name || 'Unknown',
        step_name: step.metadata?.step_name || 'Unknown',
        total_retries: 0,
        successes: 0,
        errors: []
      })
    }
    const entry = retryMap.get(key)
    entry.total_retries += step.metadata?.retry_count || 0
    if (step.metadata?.status === 'completed') entry.successes++
    if (step.metadata?.error_message) entry.errors.push(step.metadata.error_message)
  })

  const topRetrySteps = Array.from(retryMap.values())
    .map(entry => ({
      playbook_id: entry.playbook_id,
      playbook_name: entry.playbook_name,
      step_name: entry.step_name,
      total_retries: entry.total_retries,
      success_rate: entry.total_retries > 0 ? (entry.successes / entry.total_retries) * 100 : 0,
      common_errors: [...new Set(entry.errors)].slice(0, 3)
    }))
    .sort((a, b) => b.total_retries - a.total_retries)
    .slice(0, 10)

  return {
    total_retries: totalRetries,
    retry_success_rate: retrySuccessRate,
    average_retries_per_failure: avgRetriesPerFailure,
    max_retries_reached: maxRetriesReached,
    retry_by_step_type: retryByType,
    top_retry_steps: topRetrySteps
  }
}

function calculatePerformanceMetrics(
  runs: any[],
  stepLines: any[],
  playbooks: any[]
): PlaybookMetrics['performance_metrics'] {
  const completedRuns = runs.filter(
    r =>
      ['completed', 'failed', 'cancelled'].includes(r.metadata?.status) &&
      r.metadata?.total_duration_minutes
  )

  // Calculate percentiles
  const durations = completedRuns
    .map(r => r.metadata.total_duration_minutes)
    .filter(d => d !== undefined && d !== null)
    .sort((a, b) => a - b)

  const p50 = getPercentile(durations, 50)
  const p90 = getPercentile(durations, 90)
  const p99 = getPercentile(durations, 99)

  // Group runs by playbook
  const playbookDurations = new Map<string, number[]>()
  completedRuns.forEach(run => {
    const playbookId = run.metadata?.playbook_id
    if (!playbookId) return

    if (!playbookDurations.has(playbookId)) {
      playbookDurations.set(playbookId, [])
    }
    playbookDurations.get(playbookId)!.push(run.metadata.total_duration_minutes)
  })

  // Calculate average duration per playbook
  const playbookStats = Array.from(playbookDurations.entries())
    .map(([playbookId, durations]) => {
      const playbook = playbooks.find(p => p.id === playbookId)
      return {
        playbook_id: playbookId,
        playbook_name: playbook?.entity_name || 'Unknown',
        average_duration_minutes: durations.reduce((a, b) => a + b, 0) / durations.length,
        run_count: durations.length
      }
    })
    .filter(p => p.run_count >= 3) // Only include playbooks with at least 3 runs

  const slowestPlaybooks = [...playbookStats]
    .sort((a, b) => b.average_duration_minutes - a.average_duration_minutes)
    .slice(0, 5)

  const fastestPlaybooks = [...playbookStats]
    .sort((a, b) => a.average_duration_minutes - b.average_duration_minutes)
    .slice(0, 5)

  // Bottleneck analysis
  const bottleneckAnalysis = calculateBottleneckAnalysis(stepLines)

  return {
    p50_duration_minutes: p50,
    p90_duration_minutes: p90,
    p99_duration_minutes: p99,
    slowest_playbooks: slowestPlaybooks,
    fastest_playbooks: fastestPlaybooks,
    bottleneck_analysis: bottleneckAnalysis
  }
}

function calculateBottleneckAnalysis(stepLines: any[]) {
  const stepTypes = ['human', 'system', 'ai', 'external']
  const analysis: any = {}

  stepTypes.forEach(type => {
    const typeSteps = stepLines.filter(s => s.metadata?.step_type === type)

    // Calculate wait times (time between activation and start)
    const waitTimes = typeSteps
      .filter(s => s.metadata?.activated_at && s.metadata?.started_at)
      .map(s => {
        const wait =
          new Date(s.metadata.started_at).getTime() - new Date(s.metadata.activated_at).getTime()
        return wait / 1000 / 60 // Convert to minutes
      })

    // Calculate execution times
    const execTimes = typeSteps
      .filter(s => s.metadata?.actual_duration_minutes)
      .map(s => s.metadata.actual_duration_minutes)

    analysis[`${type}_steps`] = {
      average_wait_time_minutes:
        waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0,
      average_execution_time_minutes:
        execTimes.length > 0 ? execTimes.reduce((a, b) => a + b, 0) / execTimes.length : 0
    }
  })

  return analysis
}

function calculateReliabilityMetrics(
  runs: any[],
  stepLines: any[],
  events: any[]
): PlaybookMetrics['reliability_metrics'] {
  const failedRuns = runs.filter(r => r.metadata?.status === 'failed')
  const completedRuns = runs.filter(r => r.metadata?.status === 'completed')

  // MTBF (Mean Time Between Failures) - time between failure events
  const failureTimestamps = failedRuns
    .map(r => new Date(r.metadata?.failed_at || r.created_at).getTime())
    .sort((a, b) => a - b)

  let totalTimeBetweenFailures = 0
  for (let i = 1; i < failureTimestamps.length; i++) {
    totalTimeBetweenFailures += failureTimestamps[i] - failureTimestamps[i - 1]
  }

  const mtbfHours =
    failureTimestamps.length > 1
      ? totalTimeBetweenFailures / (failureTimestamps.length - 1) / 1000 / 60 / 60
      : 0

  // MTTR (Mean Time To Recovery) - time to retry and succeed
  const recoveredRuns = failedRuns.filter(r => {
    // Check if there's a subsequent successful run of the same playbook
    const laterRuns = runs.filter(
      lr =>
        lr.metadata?.playbook_id === r.metadata?.playbook_id &&
        new Date(lr.created_at).getTime() > new Date(r.created_at).getTime() &&
        lr.metadata?.status === 'completed'
    )
    return laterRuns.length > 0
  })

  const recoveryTimes = recoveredRuns
    .map(r => {
      const nextSuccess = runs.find(
        lr =>
          lr.metadata?.playbook_id === r.metadata?.playbook_id &&
          new Date(lr.created_at).getTime() > new Date(r.created_at).getTime() &&
          lr.metadata?.status === 'completed'
      )
      if (!nextSuccess) return 0

      return (
        (new Date(nextSuccess.created_at).getTime() -
          new Date(r.metadata?.failed_at || r.created_at).getTime()) /
        1000 /
        60
      )
    })
    .filter(t => t > 0)

  const mttrMinutes =
    recoveryTimes.length > 0 ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length : 0

  // Availability percentage
  const totalRuntime = runs.reduce((sum, r) => {
    if (r.metadata?.total_duration_minutes) {
      return sum + r.metadata.total_duration_minutes
    }
    return sum
  }, 0)

  const failureTime = failedRuns.reduce((sum, r) => {
    return sum + (r.metadata?.total_duration_minutes || 0)
  }, 0)

  const availabilityPercentage =
    totalRuntime > 0 ? ((totalRuntime - failureTime) / totalRuntime) * 100 : 100

  // Error analysis
  const errorEvents = events.filter(
    e =>
      e.transaction_type === 'playbook_ai_error' || e.transaction_type === 'playbook_external_error'
  )

  const errorMap = new Map<string, any>()
  errorEvents.forEach(event => {
    const errorType = event.metadata?.error_message?.split(':')[0] || 'Unknown'
    if (!errorMap.has(errorType)) {
      errorMap.set(errorType, {
        error_type: errorType,
        count: 0,
        affected_playbooks: new Set()
      })
    }
    const entry = errorMap.get(errorType)
    entry.count++
    if (event.metadata?.playbook_id) {
      entry.affected_playbooks.add(event.metadata.playbook_id)
    }
  })

  const commonErrors = Array.from(errorMap.values())
    .map(entry => ({
      error_type: entry.error_type,
      count: entry.count,
      percentage: errorEvents.length > 0 ? (entry.count / errorEvents.length) * 100 : 0,
      affected_playbooks: Array.from(entry.affected_playbooks)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const errorRate = runs.length > 0 ? (failedRuns.length / runs.length) * 100 : 0

  return {
    mtbf_hours: mtbfHours,
    mttr_minutes: mttrMinutes,
    availability_percentage: availabilityPercentage,
    error_rate: errorRate,
    common_errors: commonErrors
  }
}

function generateTimeSeries(
  runs: any[],
  stepLines: any[],
  groupBy: string
): PlaybookMetrics['time_series'] {
  // Group runs by time period
  const timeGroups = new Map<string, any>()

  runs.forEach(run => {
    const timestamp = new Date(run.created_at)
    const groupKey = getTimeGroupKey(timestamp, groupBy)

    if (!timeGroups.has(groupKey)) {
      timeGroups.set(groupKey, {
        timestamp: groupKey,
        runs_started: 0,
        runs_completed: 0,
        runs_failed: 0,
        sla_breaches: 0,
        retries: 0
      })
    }

    const group = timeGroups.get(groupKey)
    group.runs_started++

    if (run.metadata?.status === 'completed') group.runs_completed++
    if (run.metadata?.status === 'failed') group.runs_failed++
  })

  // Count SLA breaches and retries per time period
  stepLines.forEach(step => {
    if (!step.metadata?.completed_at) return

    const timestamp = new Date(step.metadata.completed_at)
    const groupKey = getTimeGroupKey(timestamp, groupBy)

    if (timeGroups.has(groupKey)) {
      const group = timeGroups.get(groupKey)

      // Check for SLA breach
      if (
        step.metadata.expected_duration_minutes &&
        step.metadata.actual_duration_minutes &&
        step.metadata.actual_duration_minutes > step.metadata.expected_duration_minutes
      ) {
        group.sla_breaches++
      }

      // Count retries
      if (step.metadata.retry_count > 0) {
        group.retries += step.metadata.retry_count
      }
    }
  })

  // Convert to array and sort
  const timeSeries = Array.from(timeGroups.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return {
    period: groupBy,
    data: timeSeries
  }
}

function getPercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
}

function getTimeGroupKey(date: Date, groupBy: string): string {
  switch (groupBy) {
    case 'hourly':
      return date.toISOString().substring(0, 13) + ':00:00Z'
    case 'daily':
      return date.toISOString().substring(0, 10) + 'T00:00:00Z'
    case 'weekly':
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      return weekStart.toISOString().substring(0, 10) + 'T00:00:00Z'
    case 'monthly':
      return date.toISOString().substring(0, 7) + '-01T00:00:00Z'
    default:
      return date.toISOString()
  }
}
