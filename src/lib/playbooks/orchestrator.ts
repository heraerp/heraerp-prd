/**
 * HERA Playbook Orchestrator Service
 * 
 * Manages the execution of playbook runs by:
 * - Polling for pending steps
 * - Executing steps based on worker type
 * - Managing retries and failures
 * - Advancing runs through completion
 * 
 * All state stored in HERA's 6 sacred tables
 */

import { universalApi } from '@/lib/universal-api';
import { playbookStateMachine } from './state-machine';
import axios, { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import {
  StepExecutionLine,
  PlaybookRunTransaction,
  StepExecutionStatus,
  PlaybookRunStatus
} from './types';

export interface OrchestratorConfig {
  organizationId: string;
  pollIntervalMs?: number;
  maxConcurrentSteps?: number;
  serviceToken?: string;
  aiService?: AIService;
  eventBus?: EventEmitter;
}

export interface StepExecution {
  stepId: string;
  runId: string;
  startTime: number;
  abortController: AbortController;
}

export interface StepCompletion {
  outputs: Record<string, any>;
  latency_ms: number;
  ai_confidence?: number;
  ai_insights?: string;
  worker_notes?: string;
  response_metadata?: Record<string, any>;
  token_usage?: Record<string, any>;
}

export interface AIService {
  process(request: AIRequest): Promise<AIResponse>;
}

export interface AIRequest {
  model: string;
  prompt: string;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  temperature?: number;
  max_tokens?: number;
}

export interface AIResponse {
  outputs: Record<string, any>;
  confidence?: number;
  insights?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PlaybookOrchestrator {
  private readonly config: Required<OrchestratorConfig>;
  private readonly activeSteps = new Map<string, StepExecution>();
  private readonly eventBus: EventEmitter;
  private pollTimer?: NodeJS.Timer;
  private isRunning = false;

  constructor(config: OrchestratorConfig) {
    this.config = {
      pollIntervalMs: 5000,
      maxConcurrentSteps: 10,
      serviceToken: '',
      aiService: null as any,
      eventBus: new EventEmitter(),
      ...config
    };
    this.eventBus = config.eventBus || new EventEmitter();
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Orchestrator already running');
    }

    this.isRunning = true;
    console.log(`[Orchestrator] Starting for organization ${this.config.organizationId}`);

    // Start polling loop
    this.pollTimer = setInterval(
      () => this.processPendingSteps().catch(console.error),
      this.config.pollIntervalMs
    );

    // Start signal listener
    this.listenForSignals();

    // Process immediately on start
    await this.processPendingSteps();
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    // Cancel active executions
    for (const [stepId, execution] of this.activeSteps) {
      execution.abortController.abort();
    }
    
    this.activeSteps.clear();
    console.log('[Orchestrator] Stopped');
  }

  /**
   * Main processing loop
   */
  private async processPendingSteps(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const pendingSteps = await this.findExecutableSteps();
      
      for (const step of pendingSteps) {
        if (this.activeSteps.size >= this.config.maxConcurrentSteps) {
          break; // At capacity
        }
        
        // Mark as active
        const execution: StepExecution = {
          stepId: step.id,
          runId: step.transaction_id,
          startTime: Date.now(),
          abortController: new AbortController()
        };
        
        this.activeSteps.set(step.id, execution);
        
        // Process asynchronously
        this.processStep(step)
          .catch(error => this.handleStepError(step, error));
      }
    } catch (error) {
      console.error('[Orchestrator] Poll error:', error);
    }
  }

  /**
   * Find steps ready for execution
   */
  private async findExecutableSteps(): Promise<StepExecutionLine[]> {
    // Get pending steps from active runs
    const response = await universalApi.queryTransactionLines({
      organization_id: this.config.organizationId,
      filters: {
        'metadata.status': 'pending',
        'transaction.status': 'in_progress',
        'transaction.transaction_type': 'playbook_run'
      },
      limit: 20
    });

    const pendingSteps = response.data || [];
    const executableSteps: StepExecutionLine[] = [];

    // Check prerequisites
    for (const step of pendingSteps) {
      // Skip if already active
      if (this.activeSteps.has(step.id)) {
        continue;
      }

      if (await this.checkPrerequisites(step)) {
        executableSteps.push(step);
      }
    }

    // Sort by priority and sequence
    return executableSteps.sort((a, b) => {
      // Priority first
      const priorityA = this.getPriorityValue(a.metadata?.priority);
      const priorityB = this.getPriorityValue(b.metadata?.priority);
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Then by sequence
      return (a.metadata?.sequence || 0) - (b.metadata?.sequence || 0);
    });
  }

  /**
   * Check if step prerequisites are met
   */
  private async checkPrerequisites(step: StepExecutionLine): Promise<boolean> {
    const runId = step.transaction_id;
    const sequence = step.metadata?.sequence || 1;

    // For first step, check if run should start
    if (sequence === 1) {
      const run = await universalApi.getTransaction(runId);
      if (run.status === 'queued') {
        // Transition run to in_progress
        await playbookStateMachine.transition('run', runId, 'in_progress', {
          organizationId: this.config.organizationId,
          userId: 'system-orchestrator',
          reason: 'Starting execution'
        });
      }
    }

    // Check previous steps
    if (sequence > 1) {
      const previousSteps = await this.getPreviousSteps(step);
      for (const prevStep of previousSteps) {
        const status = prevStep.metadata?.status;
        if (status !== 'completed' && status !== 'skipped') {
          return false;
        }
      }
    }

    // Check explicit dependencies
    const dependsOn = step.metadata?.depends_on || [];
    for (const depStepSeq of dependsOn) {
      const depStep = await this.getStepBySequence(runId, depStepSeq);
      if (depStep && depStep.metadata?.status !== 'completed') {
        return false;
      }
    }

    // Check signals
    const requiredSignals = step.metadata?.required_signals || [];
    for (const signal of requiredSignals) {
      if (!await this.hasSignal(runId, signal)) {
        return false;
      }
    }

    // Check time constraints
    const earliestStart = step.metadata?.earliest_start_time;
    if (earliestStart && new Date(earliestStart) > new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Process a single step based on worker type
   */
  private async processStep(step: StepExecutionLine): Promise<void> {
    const workerType = step.metadata?.worker_type || 'system';
    
    console.log(`[Orchestrator] Processing step ${step.id} (${workerType})`);

    switch (workerType) {
      case 'system':
        await this.processSystemStep(step);
        break;
      case 'ai':
        await this.processAIStep(step);
        break;
      case 'human':
        await this.processHumanStep(step);
        break;
      case 'external':
        await this.processExternalStep(step);
        break;
      default:
        throw new Error(`Unknown worker type: ${workerType}`);
    }
  }

  /**
   * Process system worker step
   */
  private async processSystemStep(step: StepExecutionLine): Promise<void> {
    const startTime = Date.now();
    const execution = this.activeSteps.get(step.id);
    if (!execution) return;

    try {
      // Update to running
      await this.updateStepStatus(step.id, 'running', {
        started_at: new Date().toISOString(),
        worker_id: 'system-orchestrator'
      });

      // Resolve inputs
      const inputs = await this.resolveInputs(step);
      const endpoint = step.metadata?.service_endpoint;
      if (!endpoint) {
        throw new Error('Service endpoint not configured');
      }

      // Call service
      const response = await axios.post(endpoint, {
        step_id: step.id,
        run_id: step.transaction_id,
        inputs: inputs,
        context: {
          organization_id: this.config.organizationId,
          correlation_id: step.metadata?.correlation_id
        }
      }, {
        timeout: (step.metadata?.sla_seconds || 300) * 1000,
        signal: execution.abortController.signal,
        headers: {
          'X-Idempotency-Key': this.generateIdempotencyKey(step),
          'Authorization': `Bearer ${this.config.serviceToken}`
        }
      });

      // Validate and complete
      const outputs = response.data.outputs || response.data;
      await this.validateOutputs(step, outputs);
      
      await this.completeStep(step.id, {
        outputs,
        latency_ms: Date.now() - startTime,
        response_metadata: response.data.metadata
      });

    } catch (error) {
      await this.handleStepFailure(step, error as Error, startTime);
    } finally {
      this.activeSteps.delete(step.id);
    }
  }

  /**
   * Process AI worker step
   */
  private async processAIStep(step: StepExecutionLine): Promise<void> {
    const startTime = Date.now();

    try {
      if (!this.config.aiService) {
        throw new Error('AI service not configured');
      }

      // Update to running
      await this.updateStepStatus(step.id, 'running', {
        started_at: new Date().toISOString(),
        worker_id: 'ai-orchestrator'
      });

      // Build prompt
      const inputs = await this.resolveInputs(step);
      const prompt = await this.buildAIPrompt(step, inputs);

      // Call AI service
      const aiResponse = await this.config.aiService.process({
        model: step.metadata?.ai_model_preference || 'gpt-4',
        prompt,
        input_schema: step.metadata?.input_contract,
        output_schema: step.metadata?.output_contract,
        temperature: 0.7,
        max_tokens: 2000
      });

      // Complete step
      await this.completeStep(step.id, {
        outputs: aiResponse.outputs,
        latency_ms: Date.now() - startTime,
        ai_confidence: aiResponse.confidence || 0.85,
        ai_insights: aiResponse.insights,
        token_usage: aiResponse.usage
      });

    } catch (error) {
      await this.handleStepFailure(step, error as Error, startTime);
    } finally {
      this.activeSteps.delete(step.id);
    }
  }

  /**
   * Process human worker step
   */
  private async processHumanStep(step: StepExecutionLine): Promise<void> {
    try {
      // Update to running
      await this.updateStepStatus(step.id, 'running', {
        started_at: new Date().toISOString(),
        worker_id: 'human-task-creator'
      });

      // Create task
      const inputs = await this.resolveInputs(step);
      const task = await this.createHumanTask(step, inputs);

      // Update step with task reference
      await this.updateStepMetadata(step.id, {
        task_id: task.id,
        assignee: task.metadata?.assignee_email,
        assigned_at: new Date().toISOString(),
        due_at: task.metadata?.due_at
      });

      // Step will be completed via API when human completes task
      this.activeSteps.delete(step.id);

    } catch (error) {
      await this.handleStepFailure(step, error as Error, Date.now());
      this.activeSteps.delete(step.id);
    }
  }

  /**
   * Process external worker step
   */
  private async processExternalStep(step: StepExecutionLine): Promise<void> {
    // Similar to system step but may wait for webhook callback
    await this.processSystemStep(step);
  }

  /**
   * Complete a step and advance the run
   */
  private async completeStep(
    stepId: string,
    completion: StepCompletion
  ): Promise<void> {
    const step = await universalApi.getTransactionLine(stepId);
    
    // Update step
    await this.updateStepStatus(stepId, 'completed', {
      completed_at: new Date().toISOString(),
      outputs: completion.outputs,
      ...completion
    });

    // Update run progress
    await this.updateRunProgress(step.transaction_id);

    // Queue next steps
    await this.queueNextSteps(step);

    // Emit event
    this.eventBus.emit('step:completed', {
      stepId,
      runId: step.transaction_id,
      outputs: completion.outputs
    });
  }

  /**
   * Handle step failure
   */
  private async handleStepFailure(
    step: StepExecutionLine,
    error: Error,
    startTime: number
  ): Promise<void> {
    const attempt = (step.metadata?.attempt || 0) + 1;
    const retryPolicy = step.metadata?.retry_policy || {
      max_attempts: 3,
      backoff_seconds: [5, 30, 120]
    };

    const errorData = {
      code: (error as any).code || 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
      details: (error as any).details || {}
    };

    console.error(`[Orchestrator] Step ${step.id} failed:`, errorData);

    if (attempt < retryPolicy.max_attempts) {
      // Schedule retry
      const backoff = retryPolicy.backoff_seconds[attempt - 1] || 60;
      
      await this.updateStepStatus(stepId, 'pending', {
        error: errorData,
        attempt,
        retry_scheduled_at: new Date(Date.now() + backoff * 1000).toISOString(),
        latency_ms: Date.now() - startTime
      });

      console.log(`[Orchestrator] Scheduling retry ${attempt}/${retryPolicy.max_attempts} in ${backoff}s`);

    } else {
      // Fail step
      await this.updateStepStatus(stepId, 'failed', {
        error: errorData,
        attempt,
        failed_at: new Date().toISOString(),
        latency_ms: Date.now() - startTime
      });

      // Check if critical
      if (step.metadata?.critical) {
        await this.failRun(step.transaction_id, {
          failed_step_id: stepId,
          failure_reason: `Critical step failed: ${error.message}`
        });
      }
    }

    this.eventBus.emit('step:failed', {
      stepId,
      runId: step.transaction_id,
      error: errorData,
      attempt
    });
  }

  /**
   * Update run progress
   */
  private async updateRunProgress(runId: string): Promise<void> {
    const lines = await universalApi.queryTransactionLines({
      transaction_id: runId
    });

    const completed = lines.filter(
      l => l.metadata?.status === 'completed'
    ).length;
    
    const failed = lines.filter(
      l => l.metadata?.status === 'failed'
    ).length;

    await universalApi.updateTransaction(runId, {
      metadata: {
        completed_steps: completed,
        failed_steps: failed,
        total_steps: lines.length,
        last_activity_at: new Date().toISOString()
      }
    });

    // Check if run should complete
    if (completed + failed === lines.length) {
      if (failed > 0) {
        await this.failRun(runId, {
          failure_reason: `${failed} steps failed`
        });
      } else {
        await this.completeRun(runId);
      }
    }
  }

  /**
   * Queue next steps after completion
   */
  private async queueNextSteps(completedStep: StepExecutionLine): Promise<void> {
    const runId = completedStep.transaction_id;
    const sequence = completedStep.metadata?.sequence || 0;

    // Find next sequential step
    const nextStep = await this.getStepBySequence(runId, sequence + 1);
    if (nextStep && nextStep.metadata?.status === 'queued') {
      await this.updateStepStatus(nextStep.id, 'pending', {
        triggered_by: completedStep.id,
        prerequisites_met_at: new Date().toISOString()
      });
    }

    // Find dependent steps
    const dependentSteps = await this.findDependentSteps(runId, sequence);
    for (const depStep of dependentSteps) {
      if (await this.checkPrerequisites(depStep)) {
        await this.updateStepStatus(depStep.id, 'pending', {
          triggered_by: completedStep.id,
          prerequisites_met_at: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Complete a run
   */
  private async completeRun(runId: string): Promise<void> {
    await playbookStateMachine.transition('run', runId, 'completed', {
      organizationId: this.config.organizationId,
      userId: 'system-orchestrator',
      reason: 'All steps completed successfully'
    });

    this.eventBus.emit('run:completed', { runId });
  }

  /**
   * Fail a run
   */
  private async failRun(runId: string, reason: any): Promise<void> {
    await playbookStateMachine.transition('run', runId, 'failed', {
      organizationId: this.config.organizationId,
      userId: 'system-orchestrator',
      reason: reason.failure_reason,
      data: reason
    });

    this.eventBus.emit('run:failed', { runId, reason });
  }

  /**
   * Listen for external signals
   */
  private listenForSignals(): void {
    this.eventBus.on('playbook:signal', async (signal) => {
      try {
        await this.processSignal(signal);
      } catch (error) {
        console.error('[Orchestrator] Signal processing error:', error);
      }
    });
  }

  /**
   * Process incoming signal
   */
  private async processSignal(signal: any): Promise<void> {
    console.log(`[Orchestrator] Processing signal:`, signal);
    
    // Signal processing logic here
    switch (signal.type) {
      case 'STEP_READY':
        // Re-check prerequisites for waiting steps
        await this.processPendingSteps();
        break;
        
      case 'PAUSE_REQUESTED':
        // Pause run execution
        // Implementation depends on requirements
        break;
        
      case 'RESUME_REQUESTED':
        // Resume paused run
        // Implementation depends on requirements
        break;
    }
  }

  // Helper methods

  private async updateStepStatus(
    stepId: string,
    status: StepExecutionStatus | 'waiting_input',
    metadata: Record<string, any>
  ): Promise<void> {
    await universalApi.updateTransactionLine(stepId, {
      metadata: {
        status,
        ...metadata
      }
    });
  }

  private async updateStepMetadata(
    stepId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const step = await universalApi.getTransactionLine(stepId);
    await universalApi.updateTransactionLine(stepId, {
      metadata: {
        ...step.metadata,
        ...metadata
      }
    });
  }

  private async resolveInputs(step: StepExecutionLine): Promise<any> {
    // Get run inputs
    const run = await universalApi.getTransaction(step.transaction_id);
    const runInputs = run.metadata?.inputs || {};

    // Get outputs from previous steps
    const previousOutputs = await this.getPreviousOutputs(step);

    // Merge inputs
    return {
      ...runInputs,
      ...previousOutputs,
      ...(step.metadata?.inputs || {})
    };
  }

  private async validateOutputs(
    step: StepExecutionLine,
    outputs: any
  ): Promise<void> {
    // TODO: Implement JSON schema validation
    if (!outputs) {
      throw new Error('Step outputs are required');
    }
  }

  private async buildAIPrompt(
    step: StepExecutionLine,
    inputs: any
  ): Promise<string> {
    const stepDef = await universalApi.getEntity(step.line_entity_id);
    
    return `
Task: ${stepDef.entity_name}
Description: ${stepDef.metadata?.description || 'No description'}

Input Data:
${JSON.stringify(inputs, null, 2)}

Expected Output Format:
${JSON.stringify(step.metadata?.output_contract || {}, null, 2)}

Please process the input data and generate output matching the expected format.
Provide your confidence level (0-1) and any relevant insights.
`;
  }

  private async createHumanTask(
    step: StepExecutionLine,
    inputs: any
  ): Promise<any> {
    const stepDef = await universalApi.getEntity(step.line_entity_id);
    
    // Create task entity
    const task = await universalApi.createEntity({
      entity_type: 'playbook_task',
      entity_name: `Complete: ${stepDef.entity_name}`,
      entity_code: `TASK-${step.id}`,
      smart_code: 'HERA.PLAYBOOK.TASK.HUMAN.V1',
      organization_id: this.config.organizationId,
      metadata: {
        step_id: step.id,
        run_id: step.transaction_id,
        status: 'open',
        inputs,
        input_schema: step.metadata?.input_contract,
        output_schema: step.metadata?.output_contract,
        due_at: this.calculateDueDate(step),
        priority: step.metadata?.priority,
        skills_required: step.metadata?.human_skills_required
      }
    });

    return task;
  }

  private calculateDueDate(step: StepExecutionLine): string {
    const slaSeconds = step.metadata?.sla_seconds || 86400; // Default 24h
    return new Date(Date.now() + slaSeconds * 1000).toISOString();
  }

  private generateIdempotencyKey(step: StepExecutionLine): string {
    const attempt = step.metadata?.attempt || 0;
    return `${step.id}-${attempt}`;
  }

  private getPriorityValue(priority?: string): number {
    switch (priority) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'normal': return 3;
      case 'low': return 4;
      default: return 3;
    }
  }

  private async getPreviousSteps(step: StepExecutionLine): Promise<any[]> {
    const sequence = step.metadata?.sequence || 1;
    if (sequence <= 1) return [];

    const lines = await universalApi.queryTransactionLines({
      transaction_id: step.transaction_id
    });

    return lines.filter(l => 
      (l.metadata?.sequence || 0) < sequence
    );
  }

  private async getStepBySequence(
    runId: string,
    sequence: number
  ): Promise<any | null> {
    const lines = await universalApi.queryTransactionLines({
      transaction_id: runId
    });

    return lines.find(l => l.metadata?.sequence === sequence) || null;
  }

  private async findDependentSteps(
    runId: string,
    completedSequence: number
  ): Promise<any[]> {
    const lines = await universalApi.queryTransactionLines({
      transaction_id: runId
    });

    return lines.filter(l => {
      const dependsOn = l.metadata?.depends_on || [];
      return dependsOn.includes(completedSequence);
    });
  }

  private async getPreviousOutputs(step: StepExecutionLine): Promise<any> {
    const previousSteps = await this.getPreviousSteps(step);
    const outputs: Record<string, any> = {};

    for (const prevStep of previousSteps) {
      if (prevStep.metadata?.status === 'completed') {
        const stepName = `step_${prevStep.metadata?.sequence}`;
        outputs[stepName] = prevStep.metadata?.outputs || {};
      }
    }

    return outputs;
  }

  private async hasSignal(runId: string, signalType: string): Promise<boolean> {
    // Check for signal in transaction metadata or separate signal tracking
    const run = await universalApi.getTransaction(runId);
    const signals = run.metadata?.signals || [];
    return signals.includes(signalType);
  }
}

// Export factory function
export function createOrchestrator(config: OrchestratorConfig): PlaybookOrchestrator {
  return new PlaybookOrchestrator(config);
}