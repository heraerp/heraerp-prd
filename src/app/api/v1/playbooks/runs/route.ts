/**
 * HERA Playbooks Runs API
 * 
 * Implements GET /playbooks/runs for listing and filtering playbook executions
 * with comprehensive filtering, pagination, and analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { playbookExecutionEngine } from '@/lib/playbooks/execution/playbook-execution-engine';
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth';
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer';

interface RunsQueryParams {
  playbook_id?: string;
  status?: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'paused';
  initiated_by?: string;
  date_from?: string;
  date_to?: string;
  include_steps?: boolean;
  include_analytics?: boolean;
  include_output_data?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'started_at' | 'completed_at' | 'duration' | 'status';
  sort_direction?: 'asc' | 'desc';
}

/**
 * GET /api/v1/playbooks/runs - List playbook executions
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState();
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Set organization context
    const organizationId = authState.organization.id;
    playbookExecutionEngine.setOrganizationContext(organizationId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: RunsQueryParams = {
      playbook_id: searchParams.get('playbook_id') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      initiated_by: searchParams.get('initiated_by') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      include_steps: searchParams.get('include_steps') === 'true',
      include_analytics: searchParams.get('include_analytics') === 'true',
      include_output_data: searchParams.get('include_output_data') === 'true',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: (searchParams.get('sort_by') as any) || 'started_at',
      sort_direction: (searchParams.get('sort_direction') as any) || 'desc'
    };

    // Validate parameters
    if (queryParams.limit && (queryParams.limit < 1 || queryParams.limit > 100)) {
      return NextResponse.json({
        error: 'Limit must be between 1 and 100',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Check permissions for specific playbook
    if (queryParams.playbook_id) {
      if (!playbookAuthService.canExecutePlaybook(queryParams.playbook_id) && 
          !playbookAuthService.canManagePlaybooks()) {
        return NextResponse.json({
          error: 'Insufficient permissions to view executions for this playbook',
          code: 'FORBIDDEN'
        }, { status: 403 });
      }
    }

    // Get executions
    const executionsResult = await playbookExecutionEngine.listExecutions({
      playbook_id: queryParams.playbook_id,
      status: queryParams.status,
      initiated_by: queryParams.initiated_by,
      limit: queryParams.limit,
      offset: queryParams.offset
    });

    // Filter by date range if specified
    let filteredExecutions = executionsResult.data;
    
    if (queryParams.date_from || queryParams.date_to) {
      filteredExecutions = filteredExecutions.filter(execution => {
        const executionDate = new Date(execution.started_at);
        
        if (queryParams.date_from) {
          const fromDate = new Date(queryParams.date_from);
          if (executionDate < fromDate) return false;
        }
        
        if (queryParams.date_to) {
          const toDate = new Date(queryParams.date_to);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (executionDate > toDate) return false;
        }
        
        return true;
      });
    }

    // Sort executions
    if (queryParams.sort_by) {
      filteredExecutions.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (queryParams.sort_by) {
          case 'started_at':
            aValue = new Date(a.started_at);
            bValue = new Date(b.started_at);
            break;
          case 'completed_at':
            aValue = a.completed_at ? new Date(a.completed_at) : new Date(0);
            bValue = b.completed_at ? new Date(b.completed_at) : new Date(0);
            break;
          case 'duration':
            aValue = a.execution_summary.duration_ms;
            bValue = b.execution_summary.duration_ms;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = a.started_at;
            bValue = b.started_at;
        }
        
        if (queryParams.sort_direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    // Enrich executions with additional data
    const enrichedExecutions = [];
    
    for (const execution of filteredExecutions) {
      const enriched: any = { ...execution };

      // Get playbook details
      const playbook = await playbookDataLayer.getPlaybookDefinition(execution.playbook_id);
      if (playbook) {
        enriched.playbook_name = playbook.name;
        enriched.playbook_industry = playbook.metadata.industry;
        enriched.playbook_version = playbook.version;
      }

      // Include step details if requested
      if (queryParams.include_steps) {
        enriched.step_executions = await getExecutionStepDetails(execution.execution_id);
      }

      // Include analytics if requested
      if (queryParams.include_analytics) {
        enriched.performance_metrics = calculatePerformanceMetrics(execution);
      }

      // Remove output data if not requested (for performance)
      if (!queryParams.include_output_data) {
        delete enriched.output_data;
      }

      enrichedExecutions.push(enriched);
    }

    // Calculate summary statistics
    const summary = {
      total_executions: executionsResult.total,
      filtered_executions: filteredExecutions.length,
      status_breakdown: getStatusBreakdown(filteredExecutions),
      average_duration_minutes: getAverageDuration(filteredExecutions),
      success_rate: getSuccessRate(filteredExecutions),
      most_executed_playbooks: getMostExecutedPlaybooks(filteredExecutions),
      recent_trends: getRecentTrends(filteredExecutions)
    };

    return NextResponse.json({
      success: true,
      data: enrichedExecutions,
      pagination: {
        total: executionsResult.total,
        filtered: filteredExecutions.length,
        page: Math.floor((queryParams.offset || 0) / (queryParams.limit || 20)) + 1,
        limit: queryParams.limit || 20,
        offset: queryParams.offset || 0,
        has_more: executionsResult.has_more
      },
      summary,
      filters_applied: queryParams,
      metadata: {
        organization_id: organizationId,
        query_time_ms: Date.now() - (parseInt(request.headers.get('x-request-start') || '0') || Date.now()),
        includes_applied: {
          steps: queryParams.include_steps,
          analytics: queryParams.include_analytics,
          output_data: queryParams.include_output_data
        }
      }
    });

  } catch (error) {
    console.error('List playbook runs error:', error);
    
    return NextResponse.json({
      error: 'Failed to list playbook runs',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions

async function getExecutionStepDetails(executionId: string) {
  // This would query universal_transaction_lines for step execution details
  // For now, return a placeholder
  return [
    {
      step_number: 1,
      step_name: 'Initial Processing',
      status: 'completed',
      duration_ms: 5000,
      worker_type: 'system'
    }
  ];
}

function calculatePerformanceMetrics(execution: any) {
  const duration = execution.execution_summary.duration_ms;
  
  return {
    execution_efficiency: execution.execution_summary.success_rate,
    time_per_step: duration / (execution.completed_steps || 1),
    performance_grade: getPerformanceGrade(execution),
    bottlenecks: identifyBottlenecks(execution)
  };
}

function getPerformanceGrade(execution: any): string {
  const successRate = execution.execution_summary.success_rate;
  const duration = execution.execution_summary.duration_ms;
  
  if (successRate >= 95 && duration < 30000) return 'A+';
  if (successRate >= 90 && duration < 60000) return 'A';
  if (successRate >= 85 && duration < 120000) return 'B+';
  if (successRate >= 80 && duration < 180000) return 'B';
  if (successRate >= 70) return 'C';
  return 'D';
}

function identifyBottlenecks(execution: any): string[] {
  const bottlenecks = [];
  
  if (execution.execution_summary.retries_performed > 2) {
    bottlenecks.push('High retry rate detected');
  }
  
  if (execution.execution_summary.duration_ms > 300000) { // 5 minutes
    bottlenecks.push('Long execution time');
  }
  
  if (execution.failed_steps > 0) {
    bottlenecks.push('Step failures occurred');
  }
  
  return bottlenecks;
}

function getStatusBreakdown(executions: any[]) {
  const breakdown: Record<string, number> = {};
  
  for (const execution of executions) {
    breakdown[execution.status] = (breakdown[execution.status] || 0) + 1;
  }
  
  return breakdown;
}

function getAverageDuration(executions: any[]): number {
  const completedExecutions = executions.filter(e => e.status === 'completed');
  
  if (completedExecutions.length === 0) return 0;
  
  const totalDuration = completedExecutions.reduce((sum, e) => 
    sum + e.execution_summary.duration_ms, 0
  );
  
  return Math.round(totalDuration / completedExecutions.length / 1000 / 60); // minutes
}

function getSuccessRate(executions: any[]): number {
  if (executions.length === 0) return 0;
  
  const successfulExecutions = executions.filter(e => e.status === 'completed').length;
  
  return Math.round((successfulExecutions / executions.length) * 100);
}

function getMostExecutedPlaybooks(executions: any[]) {
  const playbookCounts: Record<string, { count: number; name?: string }> = {};
  
  for (const execution of executions) {
    const id = execution.playbook_id;
    if (!playbookCounts[id]) {
      playbookCounts[id] = { count: 0, name: execution.playbook_name };
    }
    playbookCounts[id].count++;
  }
  
  return Object.entries(playbookCounts)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)
    .map(([id, data]) => ({
      playbook_id: id,
      playbook_name: data.name || 'Unknown',
      execution_count: data.count
    }));
}

function getRecentTrends(executions: any[]) {
  const last7Days = executions.filter(e => {
    const executionDate = new Date(e.started_at);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return executionDate >= sevenDaysAgo;
  });
  
  const last30Days = executions.filter(e => {
    const executionDate = new Date(e.started_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return executionDate >= thirtyDaysAgo;
  });
  
  return {
    last_7_days: {
      total_executions: last7Days.length,
      success_rate: getSuccessRate(last7Days),
      average_duration_minutes: getAverageDuration(last7Days)
    },
    last_30_days: {
      total_executions: last30Days.length,
      success_rate: getSuccessRate(last30Days),
      average_duration_minutes: getAverageDuration(last30Days)
    }
  };
}