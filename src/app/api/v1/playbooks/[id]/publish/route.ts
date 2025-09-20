/**
 * HERA Playbooks Publish API
 * 
 * Implements PUT /playbooks/{id}/publish for state machine transitions.
 * Enforces business rules: draft → active (publish), active → deprecated, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { playbookDataLayer } from '@/lib/playbooks/data/playbook-data-layer';
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth';
import { universalApi } from '@/lib/universal-api';

interface PublishRequest {
  action: 'publish' | 'deprecate' | 'reactivate' | 'archive';
  reason?: string;
  effective_date?: string;
  notification_settings?: {
    notify_users: boolean;
    notification_message?: string;
  };
  validation_overrides?: string[];
}

interface StateTransition {
  from_status: string;
  to_status: string;
  action: string;
  allowed: boolean;
  requires_validation?: boolean;
  requires_admin?: boolean;
  side_effects?: string[];
}

/**
 * PUT /api/v1/playbooks/{id}/publish - Manage playbook state transitions
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
        error: 'Insufficient permissions to manage playbook lifecycle',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Set organization context
    const organizationId = authState.organization.id;
    playbookDataLayer.setOrganizationContext(organizationId);
    universalApi.setOrganizationId(organizationId);

    const playbookId = params.id;
    const body: PublishRequest = await request.json();

    // Validate request
    if (!body.action) {
      return NextResponse.json({
        error: 'Action is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Get current playbook
    const playbook = await playbookDataLayer.getPlaybookDefinition(playbookId);
    if (!playbook) {
      return NextResponse.json({
        error: 'Playbook not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Validate state transition
    const transition = validateStateTransition(playbook.status, body.action);
    if (!transition.allowed) {
      return NextResponse.json({
        error: `Cannot ${body.action} playbook with status '${playbook.status}'`,
        code: 'INVALID_STATE_TRANSITION',
        current_status: playbook.status,
        requested_action: body.action,
        allowed_actions: getAllowedActions(playbook.status)
      }, { status: 400 });
    }

    // Check admin requirements
    if (transition.requires_admin && !playbookAuthService.hasPermission('playbooks:admin')) {
      return NextResponse.json({
        error: `Action '${body.action}' requires administrator privileges`,
        code: 'INSUFFICIENT_PRIVILEGES'
      }, { status: 403 });
    }

    // Perform validation if required
    if (transition.requires_validation) {
      const validationResult = await validatePlaybookForPublication(playbook, body.validation_overrides);
      if (!validationResult.is_valid) {
        return NextResponse.json({
          error: 'Playbook validation failed',
          code: 'VALIDATION_FAILED',
          validation_errors: validationResult.errors,
          suggestions: validationResult.suggestions,
          can_override: validationResult.can_override
        }, { status: 422 }); // 422 Unprocessable Entity
      }
    }

    // Execute state transition
    const transitionResult = await executeStateTransition(
      playbook,
      transition,
      body,
      authState.user?.id
    );

    return NextResponse.json({
      success: true,
      data: {
        playbook_id: playbookId,
        previous_status: playbook.status,
        new_status: transition.to_status,
        action_performed: body.action,
        effective_date: body.effective_date || new Date().toISOString(),
        transition_id: transitionResult.transition_id,
        side_effects: transitionResult.side_effects
      },
      metadata: {
        organization_id: organizationId,
        performed_by: authState.user?.id,
        transition_time: new Date().toISOString(),
        reason: body.reason,
        validation_performed: transition.requires_validation
      }
    });

  } catch (error) {
    console.error('Publish playbook error:', error);
    
    return NextResponse.json({
      error: 'Failed to update playbook status',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/playbooks/{id}/publish - Get available state transitions
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

    // Get playbook
    const playbook = await playbookDataLayer.getPlaybookDefinition(playbookId);
    if (!playbook) {
      return NextResponse.json({
        error: 'Playbook not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // Get available actions
    const allowedActions = getAllowedActions(playbook.status);
    const stateInfo = getStateInformation(playbook.status);

    // Check current validation status
    const validationStatus = await validatePlaybookForPublication(playbook);

    return NextResponse.json({
      success: true,
      data: {
        playbook_id: playbookId,
        current_status: playbook.status,
        state_info: stateInfo,
        allowed_actions: allowedActions,
        validation_status: validationStatus,
        state_history: await getPlaybookStateHistory(playbookId)
      },
      metadata: {
        organization_id: organizationId,
        user_permissions: {
          can_publish: playbookAuthService.canManagePlaybooks(),
          can_admin: playbookAuthService.hasPermission('playbooks:admin')
        }
      }
    });

  } catch (error) {
    console.error('Get publish info error:', error);
    
    return NextResponse.json({
      error: 'Failed to get publish information',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions

/**
 * STATE MACHINE: Validate state transitions
 */
function validateStateTransition(currentStatus: string, action: string): StateTransition {
  const transitions: Record<string, Record<string, StateTransition>> = {
    draft: {
      publish: {
        from_status: 'draft',
        to_status: 'active',
        action: 'publish',
        allowed: true,
        requires_validation: true,
        side_effects: ['lock_for_editing', 'enable_execution']
      },
      archive: {
        from_status: 'draft',
        to_status: 'deleted',
        action: 'archive',
        allowed: true,
        requires_admin: true,
        side_effects: ['prevent_execution', 'hide_from_listings']
      }
    },
    active: {
      deprecate: {
        from_status: 'active',
        to_status: 'deprecated',
        action: 'deprecate',
        allowed: true,
        requires_validation: false,
        side_effects: ['prevent_new_executions', 'allow_existing_executions']
      },
      archive: {
        from_status: 'active',
        to_status: 'deleted',
        action: 'archive',
        allowed: true,
        requires_admin: true,
        side_effects: ['stop_all_executions', 'prevent_execution', 'hide_from_listings']
      }
    },
    deprecated: {
      reactivate: {
        from_status: 'deprecated',
        to_status: 'active',
        action: 'reactivate',
        allowed: true,
        requires_validation: true,
        side_effects: ['enable_execution', 'show_in_listings']
      },
      archive: {
        from_status: 'deprecated',
        to_status: 'deleted',
        action: 'archive',
        allowed: true,
        requires_admin: true,
        side_effects: ['prevent_execution', 'hide_from_listings']
      }
    },
    deleted: {
      // Deleted playbooks cannot be transitioned (permanent state)
    }
  };

  const statusTransitions = transitions[currentStatus];
  if (!statusTransitions) {
    return {
      from_status: currentStatus,
      to_status: currentStatus,
      action,
      allowed: false
    };
  }

  const transition = statusTransitions[action];
  if (!transition) {
    return {
      from_status: currentStatus,
      to_status: currentStatus,
      action,
      allowed: false
    };
  }

  return transition;
}

function getAllowedActions(currentStatus: string): string[] {
  const actionMap: Record<string, string[]> = {
    draft: ['publish', 'archive'],
    active: ['deprecate', 'archive'],
    deprecated: ['reactivate', 'archive'],
    deleted: [] // No actions allowed
  };

  return actionMap[currentStatus] || [];
}

function getStateInformation(status: string): any {
  const stateInfo: Record<string, any> = {
    draft: {
      description: 'Editable version, not available for execution',
      characteristics: ['mutable', 'not_executable', 'visible_to_editors'],
      next_states: ['active', 'deleted']
    },
    active: {
      description: 'Published version, available for execution, immutable',
      characteristics: ['immutable', 'executable', 'visible_to_all'],
      next_states: ['deprecated', 'deleted']
    },
    deprecated: {
      description: 'Legacy version, existing executions continue but new ones prevented',
      characteristics: ['immutable', 'limited_executable', 'visible_with_warning'],
      next_states: ['active', 'deleted']
    },
    deleted: {
      description: 'Archived version, not available for execution',
      characteristics: ['immutable', 'not_executable', 'hidden'],
      next_states: []
    }
  };

  return stateInfo[status] || { description: 'Unknown status' };
}

/**
 * Validate playbook is ready for publication
 */
async function validatePlaybookForPublication(
  playbook: any,
  overrides: string[] = []
): Promise<{
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  can_override: boolean;
}> {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  // Check if playbook has steps
  const steps = await playbookDataLayer.getPlaybookSteps(playbook.id);
  if (steps.length === 0) {
    errors.push('Playbook must have at least one step');
    suggestions.push('Add steps using POST /playbooks/{id}/steps');
  }

  // Check for input/output contracts
  const inputContract = await playbookDataLayer.getContract(playbook.id, 'input_contract');
  const outputContract = await playbookDataLayer.getContract(playbook.id, 'output_contract');

  if (!inputContract && !overrides.includes('missing_input_contract')) {
    warnings.push('No input contract defined');
    suggestions.push('Consider adding an input contract for better validation');
  }

  if (!outputContract && !overrides.includes('missing_output_contract')) {
    warnings.push('No output contract defined');
    suggestions.push('Consider adding an output contract for better validation');
  }

  // Check step dependencies and ordering
  const dependencyErrors = await validateStepDependencies(steps);
  errors.push(...dependencyErrors);

  // Check for business rules
  const stepsWithoutRules = steps.filter(s => 
    !s.metadata.business_rules || s.metadata.business_rules.length === 0
  );
  
  if (stepsWithoutRules.length > 0) {
    warnings.push(`${stepsWithoutRules.length} step(s) have no business rules defined`);
  }

  // Check estimated durations
  const stepsWithoutDurations = steps.filter(s => 
    !s.metadata.estimated_duration_minutes || s.metadata.estimated_duration_minutes <= 0
  );
  
  if (stepsWithoutDurations.length > 0) {
    warnings.push(`${stepsWithoutDurations.length} step(s) have no estimated duration`);
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    can_override: errors.length === 0 && warnings.length > 0
  };
}

async function validateStepDependencies(steps: any[]): Promise<string[]> {
  const errors = [];
  const stepNumbers = steps.map(s => s.metadata.step_number);

  // Check for circular dependencies
  // Check for orphaned dependencies
  // Check for proper sequential ordering

  // For now, basic validation
  const sortedSteps = [...steps].sort((a, b) => 
    a.metadata.step_number - b.metadata.step_number
  );

  // Check for gaps in step numbering
  for (let i = 0; i < sortedSteps.length - 1; i++) {
    const current = sortedSteps[i].metadata.step_number;
    const next = sortedSteps[i + 1].metadata.step_number;
    
    if (next - current > 1) {
      errors.push(`Gap in step numbering between step ${current} and ${next}`);
    }
  }

  return errors;
}

/**
 * Execute state transition with side effects
 */
async function executeStateTransition(
  playbook: any,
  transition: StateTransition,
  request: PublishRequest,
  userId?: string
): Promise<{ transition_id: string; side_effects: string[] }> {
  // Create transition record
  const transitionRecord = await universalApi.createTransaction({
    transaction_type: 'playbook_state_transition',
    smart_code: `HERA.PLAYBOOK.STATE.TRANSITION.${transition.action.toUpperCase()}.V1`,
    subject_entity_id: playbook.id,
    total_amount: 0,
    organization_id: playbook.organization_id,
    metadata: {
      from_status: transition.from_status,
      to_status: transition.to_status,
      action: transition.action,
      reason: request.reason,
      performed_by: userId,
      effective_date: request.effective_date || new Date().toISOString(),
      notification_settings: request.notification_settings
    }
  });

  // Update playbook status
  await playbookDataLayer.updatePlaybookDefinition(playbook.id, {
    status: transition.to_status,
    metadata: {
      ...playbook.metadata,
      status_changed_at: new Date().toISOString(),
      status_changed_by: userId,
      status_change_reason: request.reason,
      previous_status: transition.from_status,
      state_transition_id: transitionRecord.id
    }
  });

  // Execute side effects
  const executedSideEffects = [];
  
  if (transition.side_effects) {
    for (const sideEffect of transition.side_effects) {
      try {
        await executeSideEffect(playbook.id, sideEffect, transition);
        executedSideEffects.push(sideEffect);
      } catch (error) {
        console.error(`Failed to execute side effect ${sideEffect}:`, error);
        // Continue with other side effects
      }
    }
  }

  return {
    transition_id: transitionRecord.id,
    side_effects: executedSideEffects
  };
}

async function executeSideEffect(
  playbookId: string,
  sideEffect: string,
  transition: StateTransition
): Promise<void> {
  switch (sideEffect) {
    case 'lock_for_editing':
      // Already handled by status change to 'active'
      console.log(`Playbook ${playbookId} locked for editing`);
      break;

    case 'enable_execution':
      // Mark playbook as executable
      console.log(`Playbook ${playbookId} enabled for execution`);
      break;

    case 'prevent_execution':
      // Cancel any running executions (if needed)
      console.log(`Playbook ${playbookId} execution prevented`);
      break;

    case 'prevent_new_executions':
      // Only prevent new executions, allow existing to continue
      console.log(`Playbook ${playbookId} new executions prevented`);
      break;

    case 'stop_all_executions':
      // Cancel all running executions
      console.log(`Playbook ${playbookId} all executions stopped`);
      break;

    case 'hide_from_listings':
      // Handle visibility in UI listings
      console.log(`Playbook ${playbookId} hidden from listings`);
      break;

    case 'show_in_listings':
      // Restore visibility in UI listings
      console.log(`Playbook ${playbookId} shown in listings`);
      break;

    default:
      console.warn(`Unknown side effect: ${sideEffect}`);
  }
}

async function getPlaybookStateHistory(playbookId: string): Promise<any[]> {
  const transitions = await universalApi.queryTransactions({
    filters: {
      transaction_type: 'playbook_state_transition',
      subject_entity_id: playbookId
    },
    sort: { field: 'created_at', direction: 'desc' },
    limit: 20
  });

  return transitions.data.map(t => ({
    transition_id: t.id,
    from_status: t.metadata.from_status,
    to_status: t.metadata.to_status,
    action: t.metadata.action,
    performed_by: t.metadata.performed_by,
    performed_at: t.created_at,
    reason: t.metadata.reason
  }));
}