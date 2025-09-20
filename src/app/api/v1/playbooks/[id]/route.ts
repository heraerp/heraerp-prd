/**
 * HERA Playbooks Individual Playbook API
 * 
 * Implements GET /playbooks/{id} with complete playbook details,
 * latest-version resolution, and related entity loading.
 */

import { NextRequest, NextResponse } from 'next/server';
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer';
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth';
import { playbookSmartCodeService } from '@/lib/playbooks/smart-codes/playbook-smart-codes';

interface PlaybookDetailParams {
  include_steps?: boolean;
  include_contracts?: boolean;
  include_policies?: boolean;
  include_runs?: boolean;
  include_analytics?: boolean;
  resolve_latest?: boolean;
  expand_relationships?: boolean;
}

/**
 * GET /api/v1/playbooks/{id} - Get playbook definition by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    playbookDataLayer.setOrganizationContext(organizationId);

    const playbookId = params.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: PlaybookDetailParams = {
      include_steps: searchParams.get('include_steps') !== 'false', // Default true
      include_contracts: searchParams.get('include_contracts') !== 'false', // Default true
      include_policies: searchParams.get('include_policies') !== 'false', // Default true
      include_runs: searchParams.get('include_runs') === 'true',
      include_analytics: searchParams.get('include_analytics') === 'true',
      resolve_latest: searchParams.get('resolve_latest') === 'true',
      expand_relationships: searchParams.get('expand_relationships') === 'true'
    };

    // Handle latest version resolution
    let targetPlaybookId = playbookId;
    let versionResolution = null;

    if (queryParams.resolve_latest && playbookId !== 'latest') {
      const latestVersion = await resolveLatestPlaybookVersion(playbookId);
      if (latestVersion) {
        targetPlaybookId = latestVersion.id;
        versionResolution = {
          requested_id: playbookId,
          resolved_id: latestVersion.id,
          resolved_version: latestVersion.version,
          resolution_type: 'latest_version'
        };
      }
    }

    // Get main playbook definition
    const playbook = await playbookDataLayer.getPlaybookDefinition(targetPlaybookId);
    
    if (!playbook) {
      return NextResponse.json({
        error: 'Playbook not found',
        code: 'NOT_FOUND',
        requested_id: playbookId,
        resolved_id: targetPlaybookId
      }, { status: 404 });
    }

    // Check if user can access this playbook
    if (!playbookAuthService.canExecutePlaybook(playbook.id) && !playbookAuthService.canManagePlaybooks()) {
      return NextResponse.json({
        error: 'Insufficient permissions to access this playbook',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Build enriched response
    const enrichedPlaybook: any = {
      ...playbook,
      smart_code_analysis: playbookSmartCodeService.parseSmartCode(playbook.smart_code)
    };

    // Include steps
    if (queryParams.include_steps) {
      const steps = await playbookDataLayer.getPlaybookSteps(playbook.id);
      enrichedPlaybook.steps = steps.map(step => ({
        ...step,
        smart_code_analysis: playbookSmartCodeService.parseSmartCode(step.smart_code)
      }));

      // Include step relationships if requested
      if (queryParams.expand_relationships) {
        enrichedPlaybook.step_relationships = await getStepRelationships(playbook.id);
      }
    }

    // Include contracts
    if (queryParams.include_contracts) {
      enrichedPlaybook.contracts = await getPlaybookContracts(playbook.id, queryParams.expand_relationships);
    }

    // Include policies
    if (queryParams.include_policies) {
      enrichedPlaybook.policies = await getPlaybookPolicies(playbook.id, queryParams.expand_relationships);
    }

    // Include recent runs
    if (queryParams.include_runs) {
      enrichedPlaybook.recent_runs = await getPlaybookRuns(playbook.id, 10);
    }

    // Include analytics
    if (queryParams.include_analytics) {
      enrichedPlaybook.analytics = await getPlaybookAnalytics(playbook.id);
    }

    // Get version history
    const versionHistory = await getPlaybookVersionHistory(playbook.name, playbook.metadata.industry);

    // Build metadata
    const metadata = {
      organization_id: organizationId,
      requested_id: playbookId,
      resolved_id: targetPlaybookId,
      version_resolution: versionResolution,
      query_time_ms: Date.now() - (request.headers.get('x-request-start') || Date.now()),
      includes_applied: queryParams,
      user_permissions: {
        can_execute: playbookAuthService.canExecutePlaybook(playbook.id),
        can_manage: playbookAuthService.canManagePlaybooks(),
        can_view_analytics: queryParams.include_analytics && playbookAuthService.hasPermission('playbooks:analytics')
      },
      version_info: {
        current_version: playbook.version,
        total_versions: versionHistory.length,
        is_latest: versionHistory.length === 0 || versionHistory[0].id === playbook.id,
        available_versions: versionHistory.map(v => ({ id: v.id, version: v.version, status: v.status }))
      }
    };

    return NextResponse.json({
      success: true,
      data: enrichedPlaybook,
      metadata
    });

  } catch (error) {
    console.error('Get playbook error:', error);
    
    return NextResponse.json({
      error: 'Failed to get playbook',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/v1/playbooks/{id} - Update playbook definition
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState();
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Check permissions
    if (!playbookAuthService.canManagePlaybooks()) {
      return NextResponse.json({
        error: 'Insufficient permissions to update playbooks',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Set organization context
    const organizationId = authState.organization.id;
    playbookDataLayer.setOrganizationContext(organizationId);

    const playbookId = params.id;
    const updates = await request.json();

    // Get existing playbook
    const existingPlaybook = await playbookDataLayer.getPlaybookDefinition(playbookId);
    if (!existingPlaybook) {
      return NextResponse.json({
        error: 'Playbook not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Update playbook
    const updatedPlaybook = await playbookDataLayer.updatePlaybookDefinition(playbookId, {
      ...updates,
      metadata: {
        ...existingPlaybook.metadata,
        ...updates.metadata,
        last_modified: new Date().toISOString(),
        modified_by: authState.user?.id || 'system'
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPlaybook,
      metadata: {
        organization_id: organizationId,
        updated_fields: Object.keys(updates),
        update_time: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update playbook error:', error);
    
    return NextResponse.json({
      error: 'Failed to update playbook',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/playbooks/{id} - Delete playbook definition
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authState = playbookAuthService.getState();
    if (!authState.isAuthenticated || !authState.organization) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Check permissions
    if (!playbookAuthService.canManagePlaybooks()) {
      return NextResponse.json({
        error: 'Insufficient permissions to delete playbooks',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Set organization context
    const organizationId = authState.organization.id;
    playbookDataLayer.setOrganizationContext(organizationId);

    const playbookId = params.id;

    // Get existing playbook
    const existingPlaybook = await playbookDataLayer.getPlaybookDefinition(playbookId);
    if (!existingPlaybook) {
      return NextResponse.json({
        error: 'Playbook not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Check if playbook has active runs
    const activeRuns = await playbookDataLayer.queryPlaybookRuns({
      filters: {
        subject_entity_id: playbookId,
        status: ['in_progress', 'queued']
      }
    });

    if (activeRuns.data.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete playbook with active runs',
        code: 'ACTIVE_RUNS_EXIST',
        active_runs_count: activeRuns.data.length
      }, { status: 409 });
    }

    // Soft delete by updating status
    const deletedPlaybook = await playbookDataLayer.updatePlaybookDefinition(playbookId, {
      status: 'deleted',
      metadata: {
        ...existingPlaybook.metadata,
        deleted_at: new Date().toISOString(),
        deleted_by: authState.user?.id || 'system',
        deletion_reason: 'manual_deletion'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: playbookId,
        status: 'deleted',
        deletion_time: new Date().toISOString()
      },
      metadata: {
        organization_id: organizationId,
        soft_delete: true,
        active_runs_checked: true
      }
    });

  } catch (error) {
    console.error('Delete playbook error:', error);
    
    return NextResponse.json({
      error: 'Failed to delete playbook',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions

/**
 * Resolve latest version of a playbook by name pattern
 */
async function resolveLatestPlaybookVersion(identifier: string) {
  try {
    // First try to get the playbook directly
    const directPlaybook = await playbookDataLayer.getPlaybookDefinition(identifier);
    if (directPlaybook) {
      // Find other versions of the same playbook
      const versions = await playbookDataLayer.queryPlaybookDefinitions({
        filters: {
          entity_name: directPlaybook.name,
          'metadata->>industry': directPlaybook.metadata.industry
        }
      });

      // Sort by version and return latest
      const sorted = versions.data.sort((a, b) => {
        const versionA = parseVersion(a.version);
        const versionB = parseVersion(b.version);
        
        if (versionA.major !== versionB.major) return versionB.major - versionA.major;
        if (versionA.minor !== versionB.minor) return versionB.minor - versionA.minor;
        return versionB.patch - versionA.patch;
      });

      return sorted[0] || directPlaybook;
    }

    return null;
  } catch (error) {
    console.error('Error resolving latest version:', error);
    return null;
  }
}

/**
 * Parse version string into components
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(p => parseInt(p) || 0);
  return {
    major: parts[0] || 1,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

/**
 * Get step relationships for a playbook
 */
async function getStepRelationships(playbookId: string) {
  const relationships = await playbookDataLayer.queryRelationships({
    filters: {
      from_entity_id: playbookId,
      smart_code: 'HERA.PLAYBOOK.CONTAINS.STEP.V1'
    }
  });

  const stepSequenceRels = await playbookDataLayer.queryRelationships({
    filters: {
      smart_code: 'HERA.PLAYBOOK.STEP.FOLLOWS.STEP.V1'
    }
  });

  return {
    playbook_contains_steps: relationships.data,
    step_sequences: stepSequenceRels.data
  };
}

/**
 * Get contracts for a playbook
 */
async function getPlaybookContracts(playbookId: string, expandRelationships = false) {
  const contractTypes = ['input_contract', 'output_contract'];
  const contracts = [];
  
  for (const type of contractTypes) {
    const contract = await playbookDataLayer.getContract(playbookId, type);
    if (contract) {
      const enriched = {
        ...contract,
        schema_analysis: analyzeJsonSchema(contract.value_json)
      };

      if (expandRelationships) {
        enriched.usage_info = await getContractUsageInfo(contract.id);
      }

      contracts.push(enriched);
    }
  }
  
  return contracts;
}

/**
 * Get policies for a playbook
 */
async function getPlaybookPolicies(playbookId: string, expandRelationships = false) {
  const policyTypes = ['sla_policy', 'quorum_policy', 'segregation_policy', 'approval_policy', 'retry_policy'];
  const policies = [];
  
  for (const type of policyTypes) {
    const policy = await playbookDataLayer.getContract(playbookId, type);
    if (policy) {
      const enriched = {
        ...policy,
        rules_analysis: analyzePolicyRules(policy.value_json)
      };

      if (expandRelationships) {
        enriched.enforcement_history = await getPolicyEnforcementHistory(policy.id);
      }

      policies.push(enriched);
    }
  }
  
  return policies;
}

/**
 * Get recent playbook runs
 */
async function getPlaybookRuns(playbookId: string, limit = 10) {
  const runs = await playbookDataLayer.queryPlaybookRuns({
    filters: {
      subject_entity_id: playbookId
    },
    sort: { field: 'occurred_at', direction: 'desc' },
    limit
  });

  return runs.data.map(run => ({
    ...run,
    duration_summary: calculateRunDuration(run),
    status_summary: {
      current_status: run.status,
      current_step: run.metadata.current_step,
      progress_percentage: (run.metadata.current_step / (run.metadata.step_count || 1)) * 100
    }
  }));
}

/**
 * Get playbook analytics
 */
async function getPlaybookAnalytics(playbookId: string) {
  const runs = await playbookDataLayer.queryPlaybookRuns({
    filters: {
      subject_entity_id: playbookId
    }
  });

  const totalRuns = runs.data.length;
  const completedRuns = runs.data.filter(r => r.status === 'completed');
  const failedRuns = runs.data.filter(r => r.status === 'failed');

  return {
    execution_stats: {
      total_runs: totalRuns,
      completed_runs: completedRuns.length,
      failed_runs: failedRuns.length,
      success_rate: totalRuns > 0 ? (completedRuns.length / totalRuns) * 100 : 0,
      average_duration_hours: completedRuns.length > 0 ? 
        completedRuns.reduce((sum, run) => sum + calculateRunDurationHours(run), 0) / completedRuns.length : 0
    },
    performance_trends: {
      last_30_days: getPerformanceTrend(runs.data, 30),
      last_7_days: getPerformanceTrend(runs.data, 7)
    },
    common_failure_points: getCommonFailurePoints(failedRuns),
    usage_patterns: {
      peak_hours: getUsagePatterns(runs.data),
      frequent_users: getFrequentUsers(runs.data)
    }
  };
}

/**
 * Get version history for a playbook
 */
async function getPlaybookVersionHistory(name: string, industry: string) {
  const versions = await playbookDataLayer.queryPlaybookDefinitions({
    filters: {
      entity_name: name,
      'metadata->>industry': industry
    },
    sort: { field: 'version', direction: 'desc' }
  });

  return versions.data;
}

// Analysis helper functions

function analyzeJsonSchema(schema: any) {
  return {
    type: schema.type || 'unknown',
    required_fields: schema.required || [],
    optional_fields: schema.properties ? Object.keys(schema.properties).filter(k => !schema.required?.includes(k)) : [],
    total_fields: schema.properties ? Object.keys(schema.properties).length : 0,
    has_validation: !!(schema.pattern || schema.format || schema.minimum || schema.maximum)
  };
}

function analyzePolicyRules(policyData: any) {
  const rules = policyData.rules || {};
  return {
    rule_count: Object.keys(rules).length,
    rule_types: Object.keys(rules),
    has_thresholds: Object.values(rules).some((rule: any) => 
      rule.threshold || rule.minimum || rule.maximum || rule.duration
    ),
    complexity_score: Object.keys(rules).length * 2 + 
      Object.values(rules).filter((rule: any) => typeof rule === 'object').length
  };
}

function calculateRunDuration(run: any) {
  const startTime = new Date(run.occurred_at);
  const endTime = run.metadata.completed_at ? new Date(run.metadata.completed_at) : new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  
  return {
    duration_ms: durationMs,
    duration_minutes: Math.round(durationMs / (1000 * 60)),
    duration_hours: Math.round(durationMs / (1000 * 60 * 60) * 10) / 10,
    is_completed: !!run.metadata.completed_at
  };
}

function calculateRunDurationHours(run: any): number {
  const duration = calculateRunDuration(run);
  return duration.duration_hours;
}

function getPerformanceTrend(runs: any[], days: number) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentRuns = runs.filter(run => new Date(run.occurred_at) >= cutoffDate);
  
  return {
    total_runs: recentRuns.length,
    success_rate: recentRuns.length > 0 ? 
      (recentRuns.filter(r => r.status === 'completed').length / recentRuns.length) * 100 : 0,
    average_duration: recentRuns.length > 0 ? 
      recentRuns.reduce((sum, run) => sum + calculateRunDurationHours(run), 0) / recentRuns.length : 0
  };
}

function getCommonFailurePoints(failedRuns: any[]) {
  const failurePoints: Record<string, number> = {};
  
  for (const run of failedRuns) {
    const step = run.metadata.current_step || 'unknown';
    failurePoints[step] = (failurePoints[step] || 0) + 1;
  }
  
  return Object.entries(failurePoints)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([step, count]) => ({ step, failure_count: count }));
}

function getUsagePatterns(runs: any[]) {
  const hourCounts: Record<number, number> = {};
  
  for (const run of runs) {
    const hour = new Date(run.occurred_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  
  return Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), run_count: count }));
}

function getFrequentUsers(runs: any[]) {
  const userCounts: Record<string, number> = {};
  
  for (const run of runs) {
    const user = run.metadata.initiated_by || 'unknown';
    userCounts[user] = (userCounts[user] || 0) + 1;
  }
  
  return Object.entries(userCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([user, count]) => ({ user_id: user, run_count: count }));
}

async function getContractUsageInfo(contractId: string) {
  // Placeholder for contract usage tracking
  return {
    validation_count: 0,
    last_used: null,
    failure_rate: 0
  };
}

async function getPolicyEnforcementHistory(policyId: string) {
  // Placeholder for policy enforcement tracking
  return {
    enforcement_count: 0,
    violation_count: 0,
    last_enforced: null
  };
}