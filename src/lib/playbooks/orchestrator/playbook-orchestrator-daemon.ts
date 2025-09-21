/**
 * HERA Playbooks Orchestrator Daemon
 *
 * Implements orchestrator daemon: pick next pending line, execute per worker_type.
 * Continuously monitors and processes playbook run steps.
 */

import { universalApi } from '@/lib/universal-api'
import { playbookDataLayer } from '../data/playbook-data-layer'
import { PlaybookSmartCodes } from '../smart-codes/playbook-smart-codes'

// Worker type handlers
import { SystemWorkerHandler } from './workers/system-worker-handler'
import { HumanWorkerHandler } from './workers/human-worker-handler'
import { AIWorkerHandler } from './workers/ai-worker-handler'
import { ExternalWorkerHandler } from './workers/external-worker-handler'

// Security
import { playbookSecurityMiddleware } from '../security/playbook-security-middleware'

export interface OrchestratorConfig {
  polling_interval_ms: number
  max_concurrent_runs: number
  max_concurrent_steps_per_run: number
  enable_parallel_execution: boolean
  worker_timeout_minutes: number
  retry_delays_ms: number[]
  organizations: string[]
}

export interface PendingStepLine {
  id: string
  transaction_id: string
  line_number: number
  step_id: string
  step_name: string
  step_type: 'human' | 'system' | 'ai' | 'external'
  worker_type: string
  status: string
  input_data: Record<string, any>
  metadata: Record<string, any>
  dependencies: Array<{ step_number: number; dependency_type: string }>
  retry_count: number
  max_retries: number
}

export interface RunContext {
  run_id: string
  playbook_id: string
  playbook_name: string
  organization_id: string
  total_steps: number
  current_step: number
  status: string
  input_data: Record<string, any>
  execution_context: Record<string, any>
}

export interface ExecutionResult {
  success: boolean
  output_data?: Record<string, any>
  error?: {
    code: string
    message: string
    details?: any
    recoverable: boolean
  }
  duration_ms: number
  worker_info?: {
    worker_id: string
    worker_type: string
  }
}

/**
 * PlaybookOrchestratorDaemon - Core orchestration service
 */
export class PlaybookOrchestratorDaemon {
  private config: OrchestratorConfig
  private isRunning = false
  private activeRuns = new Map<string, RunContext>()
  private workerHandlers = new Map<string, any>()
  private processingSteps = new Set<string>()
  private pollTimer?: NodeJS.Timeout

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      polling_interval_ms: 5000, // 5 seconds
      max_concurrent_runs: 100,
      max_concurrent_steps_per_run: 5,
      enable_parallel_execution: true,
      worker_timeout_minutes: 30,
      retry_delays_ms: [1000, 2000, 5000, 10000, 20000], // Exponential backoff
      organizations: [], // Empty means all organizations
      ...config
    }

    this.initializeWorkerHandlers()
  }

  /**
   * Initialize worker type handlers
   */
  private initializeWorkerHandlers() {
    this.workerHandlers.set('system', new SystemWorkerHandler())
    this.workerHandlers.set('human', new HumanWorkerHandler())
    this.workerHandlers.set('ai', new AIWorkerHandler())
    this.workerHandlers.set('external', new ExternalWorkerHandler())
  }

  /**
   * Start the orchestrator daemon
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Orchestrator daemon is already running')
      return
    }

    console.log('Starting Playbook Orchestrator Daemon...', {
      polling_interval_ms: this.config.polling_interval_ms,
      max_concurrent_runs: this.config.max_concurrent_runs,
      organizations: this.config.organizations.length || 'all'
    })

    this.isRunning = true
    await this.orchestrationLoop()
  }

  /**
   * Stop the orchestrator daemon
   */
  async stop(): Promise<void> {
    console.log('Stopping Playbook Orchestrator Daemon...')
    this.isRunning = false

    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
    }

    // Wait for active steps to complete
    const maxWaitMs = 30000 // 30 seconds
    const startTime = Date.now()

    while (this.processingSteps.size > 0 && Date.now() - startTime < maxWaitMs) {
      console.log(`Waiting for ${this.processingSteps.size} active steps to complete...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('Playbook Orchestrator Daemon stopped')
  }

  /**
   * Main orchestration loop
   */
  private async orchestrationLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processOrchestrationCycle()
      } catch (error) {
        console.error('Error in orchestration cycle:', error)
      }

      // Wait for next cycle
      if (this.isRunning) {
        await new Promise(resolve => {
          this.pollTimer = setTimeout(resolve, this.config.polling_interval_ms)
        })
      }
    }
  }

  /**
   * Process one orchestration cycle
   */
  private async processOrchestrationCycle(): Promise<void> {
    // 1. Refresh active runs
    await this.refreshActiveRuns()

    // 2. Find pending steps across all active runs
    const pendingSteps = await this.findPendingSteps()

    // 3. Filter steps that are ready to execute (dependencies met)
    const readySteps = await this.filterReadySteps(pendingSteps)

    // 4. Execute ready steps (respecting concurrency limits)
    await this.executeReadySteps(readySteps)

    // 5. Clean up completed runs
    await this.cleanupCompletedRuns()

    // Log status
    console.log(
      `Orchestration cycle: ${this.activeRuns.size} active runs, ${pendingSteps.length} pending steps, ${readySteps.length} ready steps, ${this.processingSteps.size} processing`
    )
  }

  /**
   * Refresh list of active runs
   */
  private async refreshActiveRuns(): Promise<void> {
    try {
      // Query for in_progress playbook runs
      const filters: Record<string, any> = {
        transaction_type: 'playbook_run',
        'metadata->>status': 'in_progress'
      }

      // Filter by organizations if specified
      if (this.config.organizations.length > 0) {
        filters.organization_id = this.config.organizations
      }

      const runsResult = await universalApi.queryTransactions({
        filters,
        limit: this.config.max_concurrent_runs * 2 // Query more than limit to ensure we don't miss any
      })

      // Update active runs map
      this.activeRuns.clear()

      for (const run of runsResult.data.slice(0, this.config.max_concurrent_runs)) {
        const runContext: RunContext = {
          run_id: run.id,
          playbook_id: run.subject_entity_id,
          playbook_name: run.metadata.playbook_name,
          organization_id: run.organization_id,
          total_steps: run.metadata.total_steps,
          current_step: run.metadata.current_step,
          status: run.metadata.status,
          input_data: run.metadata.input_data,
          execution_context: run.metadata.execution_context
        }

        this.activeRuns.set(run.id, runContext)
      }
    } catch (error) {
      console.error('Error refreshing active runs:', error)
    }
  }

  /**
   * Find pending steps across all active runs
   */
  private async findPendingSteps(): Promise<PendingStepLine[]> {
    const pendingSteps: PendingStepLine[] = []

    for (const [runId, runContext] of this.activeRuns) {
      try {
        // Set organization context for this run
        universalApi.setOrganizationId(runContext.organization_id)

        // Query pending step lines for this run
        const stepLinesResult = await universalApi.queryTransactionLines({
          filters: {
            transaction_id: runId,
            'metadata->>status': ['pending', 'not_ready', 'retry_pending']
          },
          sort: { field: 'line_number', direction: 'asc' }
        })

        for (const stepLine of stepLinesResult.data) {
          // Skip if already being processed
          if (this.processingSteps.has(stepLine.id)) {
            continue
          }

          const pendingStep: PendingStepLine = {
            id: stepLine.id,
            transaction_id: runId,
            line_number: stepLine.line_number,
            step_id: stepLine.line_entity_id,
            step_name: stepLine.metadata.step_name,
            step_type: stepLine.metadata.step_type,
            worker_type: stepLine.metadata.worker_type,
            status: stepLine.metadata.status,
            input_data: stepLine.metadata.input_data || runContext.input_data,
            metadata: stepLine.metadata,
            dependencies: stepLine.metadata.dependencies || [],
            retry_count: stepLine.metadata.retry_count || 0,
            max_retries: stepLine.metadata.max_retries || 3
          }

          pendingSteps.push(pendingStep)
        }
      } catch (error) {
        console.error(`Error finding pending steps for run ${runId}:`, error)
      }
    }

    return pendingSteps
  }

  /**
   * Filter steps that are ready to execute (dependencies met)
   */
  private async filterReadySteps(pendingSteps: PendingStepLine[]): Promise<PendingStepLine[]> {
    const readySteps: PendingStepLine[] = []

    for (const step of pendingSteps) {
      try {
        // Check if step is ready (dependencies satisfied)
        const isReady = await this.checkStepDependencies(step)

        if (isReady) {
          // Update step status to pending if it was not_ready
          if (step.status === 'not_ready') {
            await this.updateStepStatus(step.id, 'pending')
            step.status = 'pending'
          }

          // Check retry delay
          if (step.status === 'retry_pending') {
            const canRetry = await this.checkRetryDelay(step)
            if (!canRetry) {
              continue
            }
          }

          readySteps.push(step)
        }
      } catch (error) {
        console.error(`Error checking dependencies for step ${step.id}:`, error)
      }
    }

    return readySteps
  }

  /**
   * Execute ready steps with concurrency control
   */
  private async executeReadySteps(readySteps: PendingStepLine[]): Promise<void> {
    const executions: Promise<void>[] = []

    for (const step of readySteps) {
      // Check concurrency limits
      const runContext = this.activeRuns.get(step.transaction_id)
      if (!runContext) continue

      const stepsInRunBeingProcessed = Array.from(this.processingSteps).filter(stepId => {
        const [runId] = stepId.split('-')
        return runId === step.transaction_id
      }).length

      if (stepsInRunBeingProcessed >= this.config.max_concurrent_steps_per_run) {
        continue // Skip this step due to concurrency limit
      }

      // Start step execution asynchronously
      const execution = this.executeStep(step, runContext)
      executions.push(execution)

      // Mark step as being processed
      this.processingSteps.add(step.id)
    }

    // Wait for all executions to complete (or timeout)
    if (executions.length > 0) {
      try {
        await Promise.allSettled(executions)
      } catch (error) {
        console.error('Error in step executions:', error)
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: PendingStepLine, runContext: RunContext): Promise<void> {
    const stepExecutionId = `${step.transaction_id}-${step.id}`

    try {
      console.log(`Executing step: ${step.step_name} (${step.step_type}/${step.worker_type})`)

      // Set organization context
      universalApi.setOrganizationId(runContext.organization_id)

      // Check step execution permissions
      const permissionCheck = await playbookSecurityMiddleware.validateStepExecution(
        step.transaction_id,
        step.line_number,
        'system', // Orchestrator executes as system user
        runContext.organization_id
      )

      if (!permissionCheck.allowed) {
        throw new Error(
          `Permission denied for step execution: ${permissionCheck.reason}. ` +
            `Missing permissions: ${permissionCheck.missingPermissions?.join(', ')}`
        )
      }

      // Update step status to in_progress
      await this.updateStepStatus(step.id, 'in_progress', {
        started_at: new Date().toISOString(),
        worker_assigned: true
      })

      // Get worker handler
      const workerHandler = this.workerHandlers.get(step.step_type)
      if (!workerHandler) {
        throw new Error(`No worker handler found for step type: ${step.step_type}`)
      }

      // Execute step with timeout
      const timeoutMs = this.config.worker_timeout_minutes * 60 * 1000
      const startTime = Date.now()

      const executionPromise = workerHandler.executeStep({
        step_id: step.step_id,
        step_name: step.step_name,
        step_type: step.step_type,
        worker_type: step.worker_type,
        input_data: step.input_data,
        metadata: step.metadata,
        run_context: runContext
      })

      const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
        setTimeout(() => reject(new Error('Step execution timeout')), timeoutMs)
      })

      const result = await Promise.race([executionPromise, timeoutPromise])
      const duration = Date.now() - startTime

      // Handle execution result
      if (result.success) {
        await this.handleStepSuccess(step, result, duration, runContext)
      } else {
        await this.handleStepFailure(step, result, duration, runContext)
      }
    } catch (error) {
      console.error(`Error executing step ${step.id}:`, error)

      const errorResult: ExecutionResult = {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true
        },
        duration_ms: Date.now() - Date.now()
      }

      await this.handleStepFailure(step, errorResult, 0, runContext)
    } finally {
      // Remove from processing set
      this.processingSteps.delete(step.id)
    }
  }

  /**
   * Handle successful step execution
   */
  private async handleStepSuccess(
    step: PendingStepLine,
    result: ExecutionResult,
    duration: number,
    runContext: RunContext
  ): Promise<void> {
    try {
      // Update step status to completed
      await this.updateStepStatus(step.id, 'completed', {
        completed_at: new Date().toISOString(),
        duration_ms: duration,
        output_data: result.output_data,
        worker_info: result.worker_info
      })

      // Check if this was the last step in the run
      const isLastStep = step.line_number === runContext.total_steps

      if (isLastStep) {
        // Complete the run
        await this.completeRun(runContext.run_id, result.output_data)
      } else {
        // Update run progress
        await this.updateRunProgress(runContext.run_id, step.line_number + 1)
      }

      console.log(`Step completed successfully: ${step.step_name}`)
    } catch (error) {
      console.error(`Error handling step success for ${step.id}:`, error)
    }
  }

  /**
   * Handle failed step execution
   */
  private async handleStepFailure(
    step: PendingStepLine,
    result: ExecutionResult,
    duration: number,
    runContext: RunContext
  ): Promise<void> {
    try {
      const newRetryCount = step.retry_count + 1
      const canRetry = result.error?.recoverable && newRetryCount <= step.max_retries

      if (canRetry) {
        // Schedule retry
        const retryDelay =
          this.config.retry_delays_ms[
            Math.min(newRetryCount - 1, this.config.retry_delays_ms.length - 1)
          ]
        const retryAt = new Date(Date.now() + retryDelay).toISOString()

        await this.updateStepStatus(step.id, 'retry_pending', {
          retry_count: newRetryCount,
          last_error: result.error,
          retry_at: retryAt,
          duration_ms: duration
        })

        console.log(
          `Step scheduled for retry (${newRetryCount}/${step.max_retries}): ${step.step_name}`
        )
      } else {
        // Step failed permanently
        await this.updateStepStatus(step.id, 'failed', {
          failed_at: new Date().toISOString(),
          final_error: result.error,
          retry_count: newRetryCount,
          duration_ms: duration
        })

        // Fail the entire run
        await this.failRun(runContext.run_id, result.error)

        console.error(`Step failed permanently: ${step.step_name}`, result.error)
      }
    } catch (error) {
      console.error(`Error handling step failure for ${step.id}:`, error)
    }
  }

  /**
   * Check if step dependencies are satisfied
   */
  private async checkStepDependencies(step: PendingStepLine): Promise<boolean> {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true // No dependencies
    }

    try {
      // Get all step lines for this run
      const stepLinesResult = await universalApi.queryTransactionLines({
        filters: { transaction_id: step.transaction_id },
        sort: { field: 'line_number', direction: 'asc' }
      })

      // Check each dependency
      for (const dependency of step.dependencies) {
        const dependentStep = stepLinesResult.data.find(
          line => line.line_number === dependency.step_number
        )

        if (!dependentStep) {
          return false // Dependent step not found
        }

        if (dependency.dependency_type === 'sequential') {
          // Sequential dependency: dependent step must be completed
          if (dependentStep.metadata.status !== 'completed') {
            return false
          }
        }

        // TODO: Add support for other dependency types (conditional, data)
      }

      return true // All dependencies satisfied
    } catch (error) {
      console.error(`Error checking dependencies for step ${step.id}:`, error)
      return false
    }
  }

  /**
   * Check if step can be retried based on retry delay
   */
  private async checkRetryDelay(step: PendingStepLine): Promise<boolean> {
    const retryAt = step.metadata.retry_at
    if (!retryAt) return true

    return new Date(retryAt) <= new Date()
  }

  /**
   * Update step status
   */
  private async updateStepStatus(
    stepLineId: string,
    status: string,
    additionalMetadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const currentLine = await universalApi.getTransactionLine(stepLineId)
      if (!currentLine) return

      await universalApi.updateTransactionLine(stepLineId, {
        metadata: {
          ...currentLine.metadata,
          status,
          ...additionalMetadata,
          updated_at: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error(`Error updating step status for ${stepLineId}:`, error)
    }
  }

  /**
   * Update run progress
   */
  private async updateRunProgress(runId: string, currentStep: number): Promise<void> {
    try {
      const currentRun = await universalApi.getTransaction(runId)
      if (!currentRun) return

      await universalApi.updateTransaction(runId, {
        metadata: {
          ...currentRun.metadata,
          current_step: currentStep,
          updated_at: new Date().toISOString()
        }
      })

      // Update local cache
      const runContext = this.activeRuns.get(runId)
      if (runContext) {
        runContext.current_step = currentStep
      }
    } catch (error) {
      console.error(`Error updating run progress for ${runId}:`, error)
    }
  }

  /**
   * Complete a run
   */
  private async completeRun(runId: string, finalOutputData?: Record<string, any>): Promise<void> {
    try {
      const currentRun = await universalApi.getTransaction(runId)
      if (!currentRun) return

      await universalApi.updateTransaction(runId, {
        metadata: {
          ...currentRun.metadata,
          status: 'completed',
          completed_at: new Date().toISOString(),
          final_output_data: finalOutputData,
          updated_at: new Date().toISOString()
        }
      })

      // Remove from active runs
      this.activeRuns.delete(runId)

      console.log(`Run completed: ${runId}`)
    } catch (error) {
      console.error(`Error completing run ${runId}:`, error)
    }
  }

  /**
   * Fail a run
   */
  private async failRun(runId: string, error?: any): Promise<void> {
    try {
      const currentRun = await universalApi.getTransaction(runId)
      if (!currentRun) return

      await universalApi.updateTransaction(runId, {
        metadata: {
          ...currentRun.metadata,
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: error,
          updated_at: new Date().toISOString()
        }
      })

      // Remove from active runs
      this.activeRuns.delete(runId)

      console.error(`Run failed: ${runId}`, error)
    } catch (error) {
      console.error(`Error failing run ${runId}:`, error)
    }
  }

  /**
   * Clean up completed runs from memory
   */
  private async cleanupCompletedRuns(): Promise<void> {
    const completedRuns = Array.from(this.activeRuns.entries()).filter(
      ([_, runContext]) => runContext.status === 'completed' || runContext.status === 'failed'
    )

    for (const [runId] of completedRuns) {
      this.activeRuns.delete(runId)
    }
  }

  /**
   * Notify daemon of new run (external trigger)
   */
  async notifyNewRun(runId: string): Promise<void> {
    console.log(`New run notification received: ${runId}`)

    // If daemon is running, it will pick up the run in the next cycle
    // If not running, we could queue it for later

    if (!this.isRunning) {
      console.warn('Orchestrator daemon is not running - run will be processed when daemon starts')
    }
  }

  /**
   * Get daemon status
   */
  getStatus(): {
    is_running: boolean
    active_runs: number
    processing_steps: number
    config: OrchestratorConfig
  } {
    return {
      is_running: this.isRunning,
      active_runs: this.activeRuns.size,
      processing_steps: this.processingSteps.size,
      config: this.config
    }
  }
}

// Export singleton instance
export const playbookOrchestratorDaemon = new PlaybookOrchestratorDaemon()
