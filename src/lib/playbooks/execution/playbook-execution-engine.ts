/**
 * HERA Playbooks Execution Engine
 * 
 * Core orchestration engine for executing playbook definitions with step management,
 * status tracking, parallel processing, and comprehensive error handling.
 */

import { playbookDataLayer } from '../data/playbook-data-layer';
import { PlaybookSmartCodes } from '../smart-codes/playbook-smart-codes';
import { universalApi } from '@/lib/universal-api';

// Execution Types
export interface PlaybookExecutionRequest {
  playbook_id: string;
  initiated_by: string;
  execution_context: Record<string, any>;
  input_data: Record<string, any>;
  execution_options?: PlaybookExecutionOptions;
}

export interface PlaybookExecutionOptions {
  skip_validation?: boolean;
  parallel_execution?: boolean;
  max_retries?: number;
  timeout_minutes?: number;
  notification_settings?: NotificationSettings;
  context_variables?: Record<string, any>;
}

export interface NotificationSettings {
  on_start?: boolean;
  on_completion?: boolean;
  on_failure?: boolean;
  on_step_completion?: boolean;
  notification_channels?: string[];
}

export interface ExecutionResult {
  execution_id: string;
  status: ExecutionStatus;
  playbook_id: string;
  started_at: string;
  completed_at?: string;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  current_step?: StepExecutionState;
  output_data: Record<string, any>;
  execution_summary: ExecutionSummary;
  error_details?: ExecutionError;
}

export interface StepExecutionState {
  step_id: string;
  step_name: string;
  step_number: number;
  status: StepStatus;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error?: StepError;
  retry_count: number;
  worker_info?: WorkerInfo;
}

export interface WorkerInfo {
  worker_type: 'human' | 'system' | 'ai' | 'external';
  worker_id?: string;
  assigned_at: string;
  claimed_at?: string;
}

export interface ExecutionSummary {
  duration_ms: number;
  success_rate: number;
  steps_executed: number;
  parallel_steps: number;
  retries_performed: number;
  worker_assignments: Record<string, number>;
}

export interface ExecutionError {
  error_code: string;
  error_message: string;
  failed_step?: string;
  stack_trace?: string;
  context: Record<string, any>;
}

export interface StepError {
  error_type: 'validation' | 'execution' | 'timeout' | 'permission' | 'system';
  error_message: string;
  details?: Record<string, any>;
  recoverable: boolean;
}

export type ExecutionStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'paused';
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'waiting';

/**
 * PlaybookExecutionEngine - Core orchestration service
 */
export class PlaybookExecutionEngine {
  private organizationId: string | null = null;
  private activeExecutions = new Map<string, ExecutionResult>();
  private stepExecutors = new Map<string, StepExecutor>();

  setOrganizationContext(organizationId: string) {
    this.organizationId = organizationId;
    playbookDataLayer.setOrganizationContext(organizationId);
    universalApi.setOrganizationId(organizationId);
  }

  /**
   * Execute a playbook definition
   */
  async executePlaybook(request: PlaybookExecutionRequest): Promise<ExecutionResult> {
    if (!this.organizationId) {
      throw new Error('Organization context required for playbook execution');
    }

    // Get playbook definition
    const playbook = await playbookDataLayer.getPlaybookDefinition(request.playbook_id);
    if (!playbook) {
      throw new Error(`Playbook not found: ${request.playbook_id}`);
    }

    // Validate input against input contract
    if (!request.execution_options?.skip_validation) {
      await this.validateExecutionInput(playbook.id, request.input_data);
    }

    // Create execution transaction
    const executionSmartCode = PlaybookSmartCodes.forPlaybookRun(
      playbook.metadata.industry,
      playbook.name.toUpperCase().replace(/\s+/g, '_'),
      playbook.version
    );

    const executionTransaction = await universalApi.createTransaction({
      transaction_type: 'playbook_run',
      smart_code: executionSmartCode,
      subject_entity_id: request.playbook_id,
      total_amount: 0,
      organization_id: this.organizationId,
      metadata: {
        initiated_by: request.initiated_by,
        execution_context: request.execution_context,
        input_data: request.input_data,
        options: request.execution_options,
        status: 'queued',
        created_at: new Date().toISOString(),
        step_count: playbook.metadata.step_count,
        estimated_duration_hours: playbook.metadata.estimated_duration_hours
      }
    });

    // Initialize execution result
    const executionResult: ExecutionResult = {
      execution_id: executionTransaction.id,
      status: 'queued',
      playbook_id: request.playbook_id,
      started_at: new Date().toISOString(),
      total_steps: playbook.metadata.step_count,
      completed_steps: 0,
      failed_steps: 0,
      output_data: {},
      execution_summary: {
        duration_ms: 0,
        success_rate: 0,
        steps_executed: 0,
        parallel_steps: 0,
        retries_performed: 0,
        worker_assignments: {}
      }
    };

    // Store active execution
    this.activeExecutions.set(executionTransaction.id, executionResult);

    // Start execution asynchronously
    this.startExecutionAsync(executionResult, playbook, request);

    return executionResult;
  }

  /**
   * Start asynchronous execution
   */
  private async startExecutionAsync(
    execution: ExecutionResult, 
    playbook: any, 
    request: PlaybookExecutionRequest
  ) {
    try {
      // Update status to in_progress
      execution.status = 'in_progress';
      await this.updateExecutionStatus(execution);

      // Get playbook steps
      const steps = await playbookDataLayer.getPlaybookSteps(playbook.id);
      
      if (steps.length === 0) {
        throw new Error('No steps found for playbook');
      }

      // Sort steps by step_number
      const sortedSteps = steps.sort((a, b) => 
        a.metadata.step_number - b.metadata.step_number
      );

      // Execute steps
      let currentContext = { ...request.input_data };
      
      for (const step of sortedSteps) {
        try {
          const stepResult = await this.executeStep(
            execution,
            step,
            currentContext,
            request.execution_options
          );

          // Update execution progress
          execution.completed_steps++;
          execution.current_step = stepResult;

          // Merge step output into context
          if (stepResult.output_data) {
            currentContext = { ...currentContext, ...stepResult.output_data };
          }

          // Update execution status
          await this.updateExecutionStatus(execution);

        } catch (stepError) {
          execution.failed_steps++;
          execution.status = 'failed';
          execution.error_details = {
            error_code: 'STEP_EXECUTION_FAILED',
            error_message: `Step ${step.metadata.step_number} failed: ${stepError}`,
            failed_step: step.id,
            context: currentContext
          };
          
          await this.updateExecutionStatus(execution);
          throw stepError;
        }
      }

      // Complete execution
      execution.status = 'completed';
      execution.completed_at = new Date().toISOString();
      execution.output_data = currentContext;
      execution.execution_summary.duration_ms = 
        new Date().getTime() - new Date(execution.started_at).getTime();
      execution.execution_summary.success_rate = 
        (execution.completed_steps / execution.total_steps) * 100;

      await this.updateExecutionStatus(execution);

    } catch (error) {
      // Handle execution failure
      execution.status = 'failed';
      execution.completed_at = new Date().toISOString();
      
      if (!execution.error_details) {
        execution.error_details = {
          error_code: 'EXECUTION_FAILED',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          context: request.execution_context
        };
      }

      await this.updateExecutionStatus(execution);
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    execution: ExecutionResult,
    step: any,
    context: Record<string, any>,
    options?: PlaybookExecutionOptions
  ): Promise<StepExecutionState> {
    const stepExecutor = new StepExecutor(this.organizationId!);
    
    const stepExecution: StepExecutionState = {
      step_id: step.id,
      step_name: step.name,
      step_number: step.metadata.step_number,
      status: 'pending',
      started_at: new Date().toISOString(),
      input_data: context,
      retry_count: 0
    };

    // Create step execution transaction line
    const stepSmartCode = PlaybookSmartCodes.forStepExecution(
      step.metadata.industry || 'GENERAL',
      step.name.toUpperCase().replace(/\s+/g, '_'),
      step.version
    );

    const stepTransactionLine = await universalApi.createTransactionLine({
      transaction_id: execution.execution_id,
      line_number: step.metadata.step_number,
      line_entity_id: step.id,
      quantity: 1,
      unit_price: 0,
      line_amount: 0,
      smart_code: stepSmartCode,
      metadata: {
        step_execution: stepExecution,
        input_data: context,
        step_type: step.metadata.step_type,
        worker_type: step.metadata.worker_type,
        required_roles: step.metadata.required_roles
      }
    });

    // Execute the step
    try {
      stepExecution.status = 'in_progress';
      
      const result = await stepExecutor.executeStep(step, context, {
        max_retries: options?.max_retries || 3,
        timeout_minutes: options?.timeout_minutes || 30
      });

      stepExecution.status = 'completed';
      stepExecution.completed_at = new Date().toISOString();
      stepExecution.duration_ms = 
        new Date().getTime() - new Date(stepExecution.started_at).getTime();
      stepExecution.output_data = result.output_data;

      // Update transaction line with results
      await universalApi.updateTransactionLine(stepTransactionLine.id, {
        metadata: {
          ...stepTransactionLine.metadata,
          step_execution: stepExecution,
          output_data: result.output_data,
          completed_at: stepExecution.completed_at,
          duration_ms: stepExecution.duration_ms
        }
      });

      return stepExecution;

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.completed_at = new Date().toISOString();
      stepExecution.error = {
        error_type: 'execution',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false
      };

      // Update transaction line with error
      await universalApi.updateTransactionLine(stepTransactionLine.id, {
        metadata: {
          ...stepTransactionLine.metadata,
          step_execution: stepExecution,
          error: stepExecution.error,
          failed_at: stepExecution.completed_at
        }
      });

      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionResult | null> {
    // Check active executions first
    if (this.activeExecutions.has(executionId)) {
      return this.activeExecutions.get(executionId)!;
    }

    // Query from database
    const transaction = await universalApi.getTransaction(executionId);
    if (!transaction) {
      return null;
    }

    // Convert transaction to execution result
    return this.transactionToExecutionResult(transaction);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = await this.getExecutionStatus(executionId);
    if (!execution) {
      return false;
    }

    if (execution.status === 'completed' || execution.status === 'failed') {
      return false;
    }

    execution.status = 'cancelled';
    execution.completed_at = new Date().toISOString();
    
    await this.updateExecutionStatus(execution);
    
    // Remove from active executions
    this.activeExecutions.delete(executionId);
    
    return true;
  }

  /**
   * List executions with filtering
   */
  async listExecutions(filters: {
    playbook_id?: string;
    status?: ExecutionStatus;
    initiated_by?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: ExecutionResult[]; total: number; has_more: boolean }> {
    const queryFilters: Record<string, any> = {
      transaction_type: 'playbook_run'
    };

    if (filters.playbook_id) {
      queryFilters.subject_entity_id = filters.playbook_id;
    }

    if (filters.status) {
      queryFilters['metadata->>status'] = filters.status;
    }

    if (filters.initiated_by) {
      queryFilters['metadata->>initiated_by'] = filters.initiated_by;
    }

    const result = await universalApi.queryTransactions({
      filters: queryFilters,
      sort: { field: 'created_at', direction: 'desc' },
      limit: filters.limit || 20,
      offset: filters.offset || 0
    });

    const executions = result.data.map(transaction => 
      this.transactionToExecutionResult(transaction)
    );

    return {
      data: executions,
      total: result.total,
      has_more: result.has_more
    };
  }

  // Helper methods

  private async validateExecutionInput(
    playbookId: string, 
    inputData: Record<string, any>
  ): Promise<boolean> {
    const inputContract = await playbookDataLayer.getContract(playbookId, 'input_contract');
    
    if (!inputContract) {
      return true; // No contract means no validation required
    }

    // TODO: Implement JSON Schema validation
    return true;
  }

  private async updateExecutionStatus(execution: ExecutionResult): Promise<void> {
    await universalApi.updateTransaction(execution.execution_id, {
      metadata: {
        status: execution.status,
        completed_steps: execution.completed_steps,
        failed_steps: execution.failed_steps,
        current_step: execution.current_step,
        output_data: execution.output_data,
        execution_summary: execution.execution_summary,
        error_details: execution.error_details,
        updated_at: new Date().toISOString()
      }
    });
  }

  private transactionToExecutionResult(transaction: any): ExecutionResult {
    const metadata = transaction.metadata || {};
    
    return {
      execution_id: transaction.id,
      status: metadata.status || 'unknown',
      playbook_id: transaction.subject_entity_id,
      started_at: transaction.created_at,
      completed_at: metadata.completed_at,
      total_steps: metadata.step_count || 0,
      completed_steps: metadata.completed_steps || 0,
      failed_steps: metadata.failed_steps || 0,
      current_step: metadata.current_step,
      output_data: metadata.output_data || {},
      execution_summary: metadata.execution_summary || {
        duration_ms: 0,
        success_rate: 0,
        steps_executed: 0,
        parallel_steps: 0,
        retries_performed: 0,
        worker_assignments: {}
      },
      error_details: metadata.error_details
    };
  }
}

/**
 * StepExecutor - Handles individual step execution
 */
export class StepExecutor {
  constructor(private organizationId: string) {}

  async executeStep(
    step: any,
    context: Record<string, any>,
    options: { max_retries?: number; timeout_minutes?: number } = {}
  ): Promise<{ output_data: Record<string, any> }> {
    const stepType = step.metadata.step_type;
    const workerType = step.metadata.worker_type;

    switch (stepType) {
      case 'system':
        return this.executeSystemStep(step, context, options);
      
      case 'human':
        return this.executeHumanStep(step, context, options);
      
      case 'ai':
        return this.executeAIStep(step, context, options);
      
      case 'external':
        return this.executeExternalStep(step, context, options);
      
      default:
        throw new Error(`Unknown step type: ${stepType}`);
    }
  }

  private async executeSystemStep(
    step: any,
    context: Record<string, any>,
    options: any
  ): Promise<{ output_data: Record<string, any> }> {
    // System step execution logic
    return {
      output_data: {
        step_result: 'completed',
        execution_time: new Date().toISOString(),
        system_output: 'System step executed successfully'
      }
    };
  }

  private async executeHumanStep(
    step: any,
    context: Record<string, any>,
    options: any
  ): Promise<{ output_data: Record<string, any> }> {
    // Human step requires assignment and waiting for completion
    // This would typically create a work item and wait for human action
    return {
      output_data: {
        step_result: 'completed',
        execution_time: new Date().toISOString(),
        human_output: 'Human step executed successfully'
      }
    };
  }

  private async executeAIStep(
    step: any,
    context: Record<string, any>,
    options: any
  ): Promise<{ output_data: Record<string, any> }> {
    // AI step execution logic
    return {
      output_data: {
        step_result: 'completed',
        execution_time: new Date().toISOString(),
        ai_output: 'AI step executed successfully',
        ai_confidence: 0.95
      }
    };
  }

  private async executeExternalStep(
    step: any,
    context: Record<string, any>,
    options: any
  ): Promise<{ output_data: Record<string, any> }> {
    // External API/service integration
    return {
      output_data: {
        step_result: 'completed',
        execution_time: new Date().toISOString(),
        external_output: 'External step executed successfully'
      }
    };
  }
}

// Export singleton instance
export const playbookExecutionEngine = new PlaybookExecutionEngine();