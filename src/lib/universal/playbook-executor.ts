// src/lib/universal/playbook-executor.ts
// Playbook execution engine with signature registry integration

import { serverSupabase } from './supabase'
import { guardSmartCode, guardOrganization, GuardrailViolation } from './guardrails'
import { getFnSignatures } from './signature-registry'
import { expr, boolExpr } from './expr'

// ================================================================================
// TYPE DEFINITIONS
// ================================================================================

export interface PlaybookStep {
  step_name: string
  step_type: 'rpc' | 'condition' | 'loop' | 'parallel'
  function_name?: string
  parameters?: Record<string, any>
  condition?: string
  on_success?: PlaybookStep[]
  on_failure?: PlaybookStep[]
  retry_count?: number
  retry_delay_ms?: number
}

export interface PlaybookExecution {
  playbook_id: string
  organization_id: string
  execution_id: string
  status: 'running' | 'completed' | 'failed' | 'aborted'
  started_at: string
  completed_at?: string
  step_results: StepResult[]
  final_result?: any
  error?: string
}

export interface StepResult {
  step_name: string
  status: 'success' | 'failure' | 'skipped'
  result?: any
  error?: string
  started_at: string
  completed_at: string
  retries?: number
}

// ================================================================================
// PLAYBOOK EXECUTOR CLASS
// ================================================================================

export class PlaybookExecutor {
  private supabase = serverSupabase()
  private executionContext: Record<string, any> = {}

  /**
   * Execute a playbook by smart code
   */
  async execute(
    smartCode: string,
    organizationId: string,
    initialParams: Record<string, any> = {}
  ): Promise<PlaybookExecution> {
    guardSmartCode(smartCode)
    guardOrganization(organizationId)

    // Load playbook from UCR
    const { loadUCRBundle } = await import('./ucr-loader')
    const bundle = await loadUCRBundle(smartCode, organizationId)

    if (!bundle || bundle.kind !== 'playbook') {
      throw new GuardrailViolation('PLAYBOOK_NOT_FOUND', `Playbook not found: ${smartCode}`)
    }

    const execution: PlaybookExecution = {
      playbook_id: smartCode,
      organization_id: organizationId,
      execution_id: crypto.randomUUID(),
      status: 'running',
      started_at: new Date().toISOString(),
      step_results: []
    }

    // Initialize execution context
    this.executionContext = {
      ...initialParams,
      organization_id: organizationId,
      execution_id: execution.execution_id,
      _results: {} // Store step results
    }

    try {
      // Execute playbook steps
      const steps = bundle.playbook?.steps || []
      const finalResult = await this.executeSteps(steps, execution)

      execution.status = 'completed'
      execution.completed_at = new Date().toISOString()
      execution.final_result = finalResult
    } catch (error) {
      execution.status = 'failed'
      execution.completed_at = new Date().toISOString()
      execution.error = error.message
      throw error
    }

    // Store execution record
    await this.storeExecution(execution)

    return execution
  }

  /**
   * Execute a list of steps sequentially
   */
  private async executeSteps(steps: PlaybookStep[], execution: PlaybookExecution): Promise<any> {
    let lastResult: any = null

    for (const step of steps) {
      const stepResult = await this.executeStep(step, execution)

      if (stepResult.status === 'success') {
        lastResult = stepResult.result
        this.executionContext._results[step.step_name] = stepResult.result

        // Execute success branch if defined
        if (step.on_success && step.on_success.length > 0) {
          lastResult = await this.executeSteps(step.on_success, execution)
        }
      } else if (stepResult.status === 'failure') {
        // Execute failure branch if defined
        if (step.on_failure && step.on_failure.length > 0) {
          lastResult = await this.executeSteps(step.on_failure, execution)
        } else {
          throw new Error(`Step ${step.step_name} failed: ${stepResult.error}`)
        }
      }
    }

    return lastResult
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: PlaybookStep, execution: PlaybookExecution): Promise<StepResult> {
    const stepResult: StepResult = {
      step_name: step.step_name,
      status: 'success',
      started_at: new Date().toISOString(),
      completed_at: '',
      retries: 0
    }

    try {
      switch (step.step_type) {
        case 'rpc':
          stepResult.result = await this.executeRPCStep(step)
          break

        case 'condition':
          stepResult.result = await this.executeConditionStep(step, execution)
          break

        case 'loop':
          stepResult.result = await this.executeLoopStep(step, execution)
          break

        case 'parallel':
          stepResult.result = await this.executeParallelStep(step, execution)
          break

        default:
          throw new Error(`Unknown step type: ${step.step_type}`)
      }

      stepResult.status = 'success'
    } catch (error) {
      stepResult.status = 'failure'
      stepResult.error = error.message

      // Retry logic
      if (step.retry_count && stepResult.retries < step.retry_count) {
        stepResult.retries++
        await this.delay(step.retry_delay_ms || 1000)
        return this.executeStep(step, execution)
      }
    }

    stepResult.completed_at = new Date().toISOString()
    execution.step_results.push(stepResult)

    return stepResult
  }

  /**
   * Execute RPC step with dynamic signature loading
   */
  private async executeRPCStep(step: PlaybookStep): Promise<any> {
    if (!step.function_name) {
      throw new Error('RPC step requires function_name')
    }

    // Get function signature from registry
    const signatures = await getFnSignatures(step.function_name)
    if (!signatures) {
      throw new Error(`No signature found for function: ${step.function_name}`)
    }

    // Handle multiple signatures
    const sigArray = Array.isArray(signatures) ? signatures : [signatures]

    // Build parameters from context and step parameters
    const params = this.resolveParameters(step.parameters || {})

    // Try each signature until one succeeds
    let lastError: any
    for (const sig of sigArray) {
      try {
        // Build RPC parameters based on signature
        const rpcParams: Record<string, any> = {}

        for (const paramName of sig.params) {
          // Check aliases first
          let value = params[paramName]
          if (value === undefined && sig.aliases) {
            for (const [alias, original] of Object.entries(sig.aliases)) {
              if (original === paramName && params[alias] !== undefined) {
                value = params[alias]
                break
              }
            }
          }

          if (value !== undefined) {
            rpcParams[paramName] = value
          }
        }

        // Special handling for header-lines mode
        if (sig.mode === 'header-lines') {
          const result = await this.supabase.rpc(step.function_name, {
            p_header: params.p_header || params,
            p_lines: params.p_lines || [],
            p_actor_user_id: params.p_actor_user_id || null
          })

          if (result.error) throw result.error
          return result.data
        } else {
          // Standard RPC call
          const result = await this.supabase.rpc(step.function_name, rpcParams)

          if (result.error) throw result.error
          return result.data
        }
      } catch (error) {
        lastError = error
        continue // Try next signature
      }
    }

    // All signatures failed
    throw lastError || new Error(`Failed to execute ${step.function_name}`)
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(
    step: PlaybookStep,
    execution: PlaybookExecution
  ): Promise<any> {
    if (!step.condition) {
      throw new Error('Condition step requires condition expression')
    }

    // Evaluate condition using safe expression evaluator
    const conditionResult = boolExpr(step.condition, this.executionContext)

    if (conditionResult && step.on_success) {
      return await this.executeSteps(step.on_success, execution)
    } else if (!conditionResult && step.on_failure) {
      return await this.executeSteps(step.on_failure, execution)
    }

    return conditionResult
  }

  /**
   * Execute loop step
   */
  private async executeLoopStep(step: PlaybookStep, execution: PlaybookExecution): Promise<any[]> {
    // Loop implementation would go here
    // This is a simplified version
    const results: any[] = []

    // Execute nested steps for each iteration
    if (step.on_success) {
      // Would iterate based on loop condition
      const result = await this.executeSteps(step.on_success, execution)
      results.push(result)
    }

    return results
  }

  /**
   * Execute parallel steps
   */
  private async executeParallelStep(
    step: PlaybookStep,
    execution: PlaybookExecution
  ): Promise<any[]> {
    if (!step.on_success || step.on_success.length === 0) {
      return []
    }

    // Execute all steps in parallel
    const promises = step.on_success.map(s => this.executeStep(s, execution).then(r => r.result))

    return Promise.all(promises)
  }

  /**
   * Resolve parameters from context and expressions
   */
  private resolveParameters(params: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Expression reference
        const expression = value.slice(2, -2).trim()
        resolved[key] = expr(expression, this.executionContext)
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * Store execution record in database
   */
  private async storeExecution(execution: PlaybookExecution): Promise<void> {
    // Store as transaction for audit trail
    await this.supabase.rpc('hera_txn_emit_v1', {
      p_organization_id: execution.organization_id,
      p_transaction_type: 'playbook_execution',
      p_smart_code: `HERA.UNIV.PLAYBOOK.EXEC.${execution.status.toUpperCase()}.v1`,
      p_transaction_code: execution.execution_id,
      p_transaction_date: execution.started_at.split('T')[0],
      p_metadata: {
        playbook_id: execution.playbook_id,
        step_results: execution.step_results,
        final_result: execution.final_result,
        error: execution.error
      },
      p_actor_user_id: this.executionContext.actor_user_id || null
    })
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Load and execute a playbook by ID
   */
  static async executeById(
    playbookId: string,
    organizationId: string,
    params: Record<string, any> = {}
  ): Promise<PlaybookExecution> {
    const executor = new PlaybookExecutor()
    return executor.execute(playbookId, organizationId, params)
  }
}
