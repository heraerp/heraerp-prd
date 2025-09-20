/**
 * HERA Playbook State Machine Service
 * 
 * Manages state transitions for:
 * - Playbook Definitions (draft → published → archived)
 * - Playbook Runs (queued → in_progress → completed/failed/cancelled)
 * - Step Executions (pending → running → completed/failed/skipped)
 * 
 * All transitions are recorded as transactions for complete audit trail
 */

import { universalApi } from '@/lib/universal-api';
import { 
  PlaybookEntity, 
  PlaybookRunTransaction, 
  StepExecutionLine,
  PlaybookRunStatus,
  StepExecutionStatus 
} from './types';

export type EntityType = 'playbook' | 'run' | 'step';
export type PlaybookState = 'draft' | 'published' | 'archived';
export type RunState = PlaybookRunStatus;
export type StepState = StepExecutionStatus | 'waiting_input';

export interface TransitionContext {
  organizationId: string;
  userId: string;
  reason?: string;
  data?: Record<string, any>;
  force?: boolean; // Force transition even with warnings
}

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
  warnings?: string[];
}

export interface TransitionRule {
  fromState: string;
  toState: string;
  smartCode: string;
  validations: ((context: any) => Promise<TransitionValidationResult>)[];
  postActions?: ((entityId: string, context: TransitionContext) => Promise<void>)[];
}

export class PlaybookStateMachine {
  private transitionRules: Map<string, TransitionRule[]>;

  constructor() {
    this.transitionRules = this.initializeTransitionRules();
  }

  /**
   * Initialize all state transition rules
   */
  private initializeTransitionRules(): Map<string, TransitionRule[]> {
    const rules = new Map<string, TransitionRule[]>();

    // Playbook Definition transitions
    rules.set('playbook', [
      {
        fromState: 'draft',
        toState: 'published',
        smartCode: 'HERA.PLAYBOOK.TRANSITION.PUBLISH.V1',
        validations: [
          this.validatePlaybookComplete,
          this.validatePlaybookSchemas,
          this.validatePlaybookSteps
        ],
        postActions: [
          this.notifyPlaybookPublished,
          this.createVersionRelationship
        ]
      },
      {
        fromState: 'published',
        toState: 'archived',
        smartCode: 'HERA.PLAYBOOK.TRANSITION.ARCHIVE.V1',
        validations: [
          this.validateNoActiveRuns
        ],
        postActions: [
          this.cancelActiveRuns,
          this.notifyPlaybookArchived
        ]
      }
    ]);

    // Run transitions
    rules.set('run', [
      {
        fromState: 'queued',
        toState: 'in_progress',
        smartCode: 'HERA.PLAYBOOK.RUN.TRANSITION.START.V1',
        validations: [
          this.validatePlaybookPublished,
          this.validateRunInputs,
          this.validateResourceCapacity
        ],
        postActions: [
          this.initializeFirstStep,
          this.notifyRunStarted
        ]
      },
      {
        fromState: 'in_progress',
        toState: 'blocked',
        smartCode: 'HERA.PLAYBOOK.RUN.TRANSITION.BLOCK.V1',
        validations: [],
        postActions: [
          this.startBlockedTimer,
          this.sendEscalationNotification
        ]
      },
      {
        fromState: 'in_progress',
        toState: 'completed',
        smartCode: 'HERA.PLAYBOOK.RUN.TRANSITION.COMPLETE.V1',
        validations: [
          this.validateAllStepsComplete,
          this.validateOutputContract
        ],
        postActions: [
          this.calculateTotalCost,
          this.triggerDownstreamWorkflows
        ]
      },
      {
        fromState: 'in_progress',
        toState: 'failed',
        smartCode: 'HERA.PLAYBOOK.RUN.TRANSITION.FAIL.V1',
        validations: [],
        postActions: [
          this.executeFailureHandlers,
          this.notifyRunFailed
        ]
      }
    ]);

    // Step transitions
    rules.set('step', [
      {
        fromState: 'pending',
        toState: 'running',
        smartCode: 'HERA.PLAYBOOK.STEP.TRANSITION.START.V1',
        validations: [
          this.validateStepInputs,
          this.validateWorkerAvailable,
          this.validateWithinSLA
        ],
        postActions: [
          this.assignWorker,
          this.lockResources,
          this.startExecutionTimer
        ]
      },
      {
        fromState: 'running',
        toState: 'waiting_input',
        smartCode: 'HERA.PLAYBOOK.STEP.TRANSITION.WAIT.V1',
        validations: [],
        postActions: [
          this.createInputRequest,
          this.pauseExecutionTimer
        ]
      },
      {
        fromState: 'running',
        toState: 'completed',
        smartCode: 'HERA.PLAYBOOK.STEP.TRANSITION.COMPLETE.V1',
        validations: [
          this.validateStepOutputs,
          this.validateSideEffects
        ],
        postActions: [
          this.updateRunProgress,
          this.triggerNextSteps
        ]
      },
      {
        fromState: 'running',
        toState: 'failed',
        smartCode: 'HERA.PLAYBOOK.STEP.TRANSITION.FAIL.V1',
        validations: [],
        postActions: [
          this.checkRetryPolicy,
          this.notifyStepFailed
        ]
      }
    ]);

    return rules;
  }

  /**
   * Get current state of an entity
   */
  async getCurrentState(entityType: EntityType, entityId: string): Promise<string> {
    switch (entityType) {
      case 'playbook':
        const playbook = await universalApi.getEntity(entityId);
        return playbook.metadata?.status || 'draft';
      
      case 'run':
        const run = await universalApi.getTransaction(entityId);
        return run.status || 'queued';
      
      case 'step':
        const step = await universalApi.getTransactionLine(entityId);
        return step.metadata?.status || 'pending';
      
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Check if a state transition is allowed
   */
  async canTransition(
    entityType: EntityType,
    entityId: string,
    toState: string,
    context: TransitionContext
  ): Promise<{ allowed: boolean; reason?: string; warnings?: string[] }> {
    const currentState = await this.getCurrentState(entityType, entityId);
    const rules = this.transitionRules.get(entityType) || [];
    
    const rule = rules.find(
      r => r.fromState === currentState && r.toState === toState
    );
    
    if (!rule) {
      return { 
        allowed: false, 
        reason: `Invalid transition: ${currentState} → ${toState}` 
      };
    }

    // Run all validations
    const warnings: string[] = [];
    for (const validation of rule.validations) {
      const result = await validation({ entityId, ...context });
      if (!result.valid) {
        if (context.force && result.warnings) {
          warnings.push(...result.warnings);
        } else {
          return { allowed: false, reason: result.reason };
        }
      }
    }

    return { allowed: true, warnings };
  }

  /**
   * Execute a state transition
   */
  async transition(
    entityType: EntityType,
    entityId: string,
    toState: string,
    context: TransitionContext
  ): Promise<void> {
    // Get current state
    const currentState = await this.getCurrentState(entityType, entityId);
    
    // Validate transition
    const validation = await this.canTransition(
      entityType,
      entityId,
      toState,
      context
    );
    
    if (!validation.allowed) {
      throw new Error(`State transition not allowed: ${validation.reason}`);
    }

    // Get transition rule
    const rules = this.transitionRules.get(entityType) || [];
    const rule = rules.find(
      r => r.fromState === currentState && r.toState === toState
    );
    
    if (!rule) {
      throw new Error('Transition rule not found');
    }

    // Create audit transaction
    await universalApi.createTransaction({
      transaction_type: 'state_transition',
      smart_code: rule.smartCode,
      organization_id: context.organizationId,
      reference_entity_id: entityId,
      from_entity_id: context.userId,
      metadata: {
        entity_type: entityType,
        from_state: currentState,
        to_state: toState,
        transition_reason: context.reason,
        transition_data: context.data,
        warnings: validation.warnings,
        timestamp: new Date().toISOString()
      }
    });

    // Update entity state
    await this.updateEntityState(entityType, entityId, toState, context);

    // Execute post-transition actions
    if (rule.postActions) {
      for (const action of rule.postActions) {
        await action(entityId, context);
      }
    }
  }

  /**
   * Update entity state in the appropriate table
   */
  private async updateEntityState(
    entityType: EntityType,
    entityId: string,
    newState: string,
    context: TransitionContext
  ): Promise<void> {
    switch (entityType) {
      case 'playbook':
        await universalApi.updateEntity(entityId, {
          metadata: {
            status: newState,
            [`${newState}_at`]: new Date().toISOString(),
            [`${newState}_by`]: context.userId
          }
        });
        break;
      
      case 'run':
        await universalApi.updateTransaction(entityId, {
          status: newState as RunState,
          metadata: {
            [`${newState}_at`]: new Date().toISOString()
          }
        });
        break;
      
      case 'step':
        await universalApi.updateTransactionLine(entityId, {
          metadata: {
            status: newState,
            [`${newState}_at`]: new Date().toISOString(),
            state_history: [
              // Append to existing history
              {
                to_state: newState,
                transitioned_at: new Date().toISOString(),
                transitioned_by: context.userId,
                reason: context.reason
              }
            ]
          }
        });
        break;
    }
  }

  /**
   * Get state transition history for an entity
   */
  async getStateHistory(
    entityType: EntityType,
    entityId: string,
    organizationId: string
  ): Promise<StateTransition[]> {
    const transitions = await universalApi.queryTransactions({
      transaction_type: 'state_transition',
      reference_entity_id: entityId,
      organization_id: organizationId
    });

    return transitions.map(t => ({
      id: t.id,
      timestamp: t.created_at,
      fromState: t.metadata.from_state,
      toState: t.metadata.to_state,
      smartCode: t.smart_code,
      initiatedBy: t.from_entity_id,
      reason: t.metadata.transition_reason,
      data: t.metadata.transition_data
    }));
  }

  // Validation functions (examples)
  private async validatePlaybookComplete(context: any): Promise<TransitionValidationResult> {
    const playbook = await universalApi.getEntity(context.entityId);
    const dynamicData = await universalApi.getDynamicData(context.entityId);
    
    if (!dynamicData.input_schema || !dynamicData.output_schema) {
      return { valid: false, reason: 'Input/output schemas are required' };
    }
    
    return { valid: true };
  }

  private async validatePlaybookSchemas(context: any): Promise<TransitionValidationResult> {
    // Validate JSON schemas
    return { valid: true };
  }

  private async validatePlaybookSteps(context: any): Promise<TransitionValidationResult> {
    // Ensure at least one step exists
    const relationships = await universalApi.queryRelationships({
      from_entity_id: context.entityId,
      relationship_type: 'playbook_has_step'
    });
    
    if (relationships.length === 0) {
      return { valid: false, reason: 'At least one step is required' };
    }
    
    return { valid: true };
  }

  private async validateNoActiveRuns(context: any): Promise<TransitionValidationResult> {
    const activeRuns = await universalApi.queryTransactions({
      reference_entity_id: context.entityId,
      transaction_type: 'playbook_run',
      status: ['queued', 'in_progress', 'blocked']
    });
    
    if (activeRuns.length > 0 && !context.force) {
      return { 
        valid: false, 
        reason: `${activeRuns.length} active runs exist`,
        warnings: ['Active runs will be cancelled']
      };
    }
    
    return { valid: true };
  }

  // Post-action functions (stubs)
  private async notifyPlaybookPublished(entityId: string, context: TransitionContext): Promise<void> {
    // Send notifications
  }

  private async createVersionRelationship(entityId: string, context: TransitionContext): Promise<void> {
    // Create version relationship if needed
  }

  private async cancelActiveRuns(entityId: string, context: TransitionContext): Promise<void> {
    // Cancel any active runs
  }

  private async notifyPlaybookArchived(entityId: string, context: TransitionContext): Promise<void> {
    // Send notifications
  }

  private async validatePlaybookPublished(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async validateRunInputs(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async validateResourceCapacity(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async initializeFirstStep(entityId: string, context: TransitionContext): Promise<void> {
    // Initialize first step as pending
  }

  private async notifyRunStarted(entityId: string, context: TransitionContext): Promise<void> {
    // Send notifications
  }

  private async startBlockedTimer(entityId: string, context: TransitionContext): Promise<void> {
    // Start SLA timer
  }

  private async sendEscalationNotification(entityId: string, context: TransitionContext): Promise<void> {
    // Send escalation
  }

  private async validateAllStepsComplete(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async validateOutputContract(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async calculateTotalCost(entityId: string, context: TransitionContext): Promise<void> {
    // Calculate and update total cost
  }

  private async triggerDownstreamWorkflows(entityId: string, context: TransitionContext): Promise<void> {
    // Trigger any downstream workflows
  }

  private async executeFailureHandlers(entityId: string, context: TransitionContext): Promise<void> {
    // Execute failure handlers
  }

  private async notifyRunFailed(entityId: string, context: TransitionContext): Promise<void> {
    // Send failure notifications
  }

  private async validateStepInputs(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async validateWorkerAvailable(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async validateWithinSLA(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async assignWorker(entityId: string, context: TransitionContext): Promise<void> {
    // Assign to worker
  }

  private async lockResources(entityId: string, context: TransitionContext): Promise<void> {
    // Lock required resources
  }

  private async startExecutionTimer(entityId: string, context: TransitionContext): Promise<void> {
    // Start timer
  }

  private async createInputRequest(entityId: string, context: TransitionContext): Promise<void> {
    // Create input request
  }

  private async pauseExecutionTimer(entityId: string, context: TransitionContext): Promise<void> {
    // Pause timer
  }

  private async validateStepOutputs(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async validateSideEffects(context: any): Promise<TransitionValidationResult> {
    return { valid: true };
  }

  private async updateRunProgress(entityId: string, context: TransitionContext): Promise<void> {
    // Update run progress
  }

  private async triggerNextSteps(entityId: string, context: TransitionContext): Promise<void> {
    // Trigger next steps
  }

  private async checkRetryPolicy(entityId: string, context: TransitionContext): Promise<void> {
    // Check if retry is allowed
  }

  private async notifyStepFailed(entityId: string, context: TransitionContext): Promise<void> {
    // Send notifications
  }
}

export interface StateTransition {
  id: string;
  timestamp: string;
  fromState: string;
  toState: string;
  smartCode: string;
  initiatedBy: string;
  reason?: string;
  data?: Record<string, any>;
}

// Export singleton instance
export const playbookStateMachine = new PlaybookStateMachine();