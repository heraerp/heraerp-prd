/**
 * HERA Playbooks Orchestrator Interface
 *
 * Simplified interface for orchestrator operations and step completion processing.
 */

import { playbookOrchestratorDaemon } from './playbook-orchestrator-daemon'
import { universalApi } from '@/lib/universal-api'

export interface StepCompletionNotification {
  runId: string
  stepId: string
  stepSequence: number
  organizationId: string
  outputs?: Record<string, any>
  aiConfidence?: number
}

/**
 * Orchestrator service for playbook execution management
 */
export class PlaybookOrchestrator {
  /**
   * Process step completion and trigger next steps
   */
  async processStepCompletion(notification: StepCompletionNotification): Promise<void> {
    try {
      // Set organization context
      universalApi.setOrganizationId(notification.organizationId)

      // Get all step lines for the run
      const stepLines = await universalApi.readTransactionLines({
        transaction_id: notification.runId
      })

      if (!stepLines || stepLines.length === 0) {
        throw new Error(`No steps found for run ${notification.runId}`)
      }

      // Find and activate dependent steps
      await this.activateDependentSteps(
        notification.runId,
        notification.stepSequence,
        stepLines,
        notification.organizationId
      )

      // Check if run is complete
      await this.checkRunCompletion(notification.runId, stepLines, notification.organizationId)

      // Notify daemon of changes
      await playbookOrchestratorDaemon.notifyNewRun(notification.runId)
    } catch (error) {
      console.error('Error processing step completion:', error)
      throw error
    }
  }

  /**
   * Activate steps that depend on the completed step
   */
  private async activateDependentSteps(
    runId: string,
    completedSequence: number,
    allLines: any[],
    organizationId: string
  ): Promise<void> {
    for (const line of allLines) {
      const dependencies = line.metadata?.dependencies || []

      // Check if this step depends on the completed step
      const dependsOnCompleted = dependencies.some(
        (dep: any) => dep.step_sequence === completedSequence
      )

      if (dependsOnCompleted && line.metadata?.status === 'pending') {
        // Check if all dependencies are satisfied
        const allDependenciesMet = this.checkAllDependencies(dependencies, allLines)

        if (allDependenciesMet) {
          // Activate the step
          await universalApi.updateTransactionLine(runId, line.line_number, {
            metadata: {
              ...line.metadata,
              status: 'ready',
              activated_at: new Date().toISOString(),
              activated_by_step: completedSequence
            }
          })

          console.log(`Activated step ${line.metadata?.step_name} (sequence ${line.line_number})`)
        }
      }
    }
  }

  /**
   * Check if all dependencies for a step are satisfied
   */
  private checkAllDependencies(dependencies: any[], allLines: any[]): boolean {
    for (const dep of dependencies) {
      const depLine = allLines.find(l => l.line_number === dep.step_sequence)
      if (!depLine) return false

      const depStatus = depLine.metadata?.status

      // Check based on dependency type
      switch (dep.dependency_type) {
        case 'completion':
        case 'success':
          if (depStatus !== 'completed') return false
          break
        case 'any':
          if (!['completed', 'failed', 'cancelled'].includes(depStatus)) return false
          break
        default:
          if (depStatus !== 'completed') return false
      }
    }

    return true
  }

  /**
   * Check if the run is complete and update status
   */
  private async checkRunCompletion(
    runId: string,
    stepLines: any[],
    organizationId: string
  ): Promise<void> {
    // Check if all steps are in terminal states
    const allComplete = stepLines.every(line => {
      const status = line.metadata?.status
      return ['completed', 'failed', 'cancelled', 'skipped'].includes(status)
    })

    if (allComplete) {
      // Calculate final status
      const hasFailures = stepLines.some(l => l.metadata?.status === 'failed')
      const hasCancellations = stepLines.some(l => l.metadata?.status === 'cancelled')

      let runStatus = 'completed'
      if (hasFailures) runStatus = 'completed_with_errors'
      if (hasCancellations) runStatus = 'partially_completed'

      // Get and update run
      const runs = await universalApi.readTransactions({
        filters: { id: runId }
      })

      if (runs && runs.length > 0) {
        const run = runs[0]

        await universalApi.updateTransaction(runId, {
          metadata: {
            ...run.metadata,
            status: runStatus,
            completed_at: new Date().toISOString(),
            total_duration_minutes: this.calculateRunDuration(run),
            completion_stats: {
              total_steps: stepLines.length,
              completed: stepLines.filter(l => l.metadata?.status === 'completed').length,
              failed: stepLines.filter(l => l.metadata?.status === 'failed').length,
              cancelled: stepLines.filter(l => l.metadata?.status === 'cancelled').length,
              skipped: stepLines.filter(l => l.metadata?.status === 'skipped').length
            }
          }
        })

        console.log(`Run ${runId} completed with status: ${runStatus}`)
      }
    }
  }

  /**
   * Calculate total run duration in minutes
   */
  private calculateRunDuration(run: any): number {
    const startTime = new Date(run.created_at || run.metadata?.started_at).getTime()
    const endTime = Date.now()
    return Math.round((endTime - startTime) / 1000 / 60)
  }

  /**
   * Start the orchestrator daemon
   */
  async startDaemon(): Promise<void> {
    return playbookOrchestratorDaemon.start()
  }

  /**
   * Stop the orchestrator daemon
   */
  async stopDaemon(): Promise<void> {
    return playbookOrchestratorDaemon.stop()
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return playbookOrchestratorDaemon.getStatus()
  }
}

// Export singleton instance
export const playbookOrchestrator = new PlaybookOrchestrator()
