/**
 * HERA Playbooks Orchestrator Control API
 *
 * Provides endpoints to manage the playbook orchestrator daemon lifecycle.
 */
import { NextRequest, NextResponse } from 'next/server'
import { playbookAuthService } from '@/lib/playbooks/auth/playbook-auth'
import { PlaybookOrchestratorDaemon } from '@/lib/playbooks/orchestrator/playbook-orchestrator-daemon'
import { universalApi } from '@/lib/universal-api'

// Global orchestrator instance (in production, this would be a separate service)
let orchestratorInstance: PlaybookOrchestratorDaemon | null = null

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

    // Check permission
    const hasPermission = await playbookAuthService.checkPermission(
      auth.userId!,
      auth.organizationId!,
      'PLAYBOOK_ORCHESTRATOR_VIEW'
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

    // Return orchestrator status
    const status = {
      running: orchestratorInstance !== null && orchestratorInstance.isRunning(),
      statistics: orchestratorInstance?.getStatistics() || {
        total_runs_started: 0,
        total_steps_executed: 0,
        successful_steps: 0,
        failed_steps: 0,
        active_runs: 0,
        pending_steps: 0
      },
      config: orchestratorInstance?.getConfig() || null,
      uptime_seconds: orchestratorInstance?.getUptime() || 0
    }

    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Failed to get orchestrator status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Check permission
    const hasPermission = await playbookAuthService.checkPermission(
      auth.userId!,
      auth.organizationId!,
      'PLAYBOOK_ORCHESTRATOR_MANAGE'
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

    const body = await request.json()
    const action = body.action // 'start' | 'stop' | 'restart' | 'configure'

    // Set organization context
    universalApi.setOrganizationId(auth.organizationId!)

    switch (action) {
      case 'start':
        if (orchestratorInstance && orchestratorInstance.isRunning()) {
          return NextResponse.json(
            {
              success: false,
              error: 'Orchestrator is already running'
            },
            { status: 400 }
          )
        }

        // Create and start orchestrator
        const config = body.config || {
          polling_interval_ms: 5000,
          max_concurrent_runs: 10,
          max_concurrent_steps_per_run: 3,
          enable_parallel_execution: true,
          worker_timeout_minutes: 30,
          retry_delays_ms: [1000, 5000, 15000],
          organizations: [auth.organizationId!]
        }

        orchestratorInstance = new PlaybookOrchestratorDaemon(config)
        await orchestratorInstance.start()

        // Log start event
        await universalApi.createTransaction({
          transaction_type: 'playbook_orchestrator_event',
          organization_id: auth.organizationId!,
          smart_code: 'HERA.PLAYBOOK.ORCHESTRATOR.START.V1',
          total_amount: 0,
          metadata: {
            action: 'start',
            config,
            started_by: auth.userId,
            timestamp: new Date().toISOString()
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Orchestrator started successfully',
          data: {
            status: 'running',
            config
          }
        })

      case 'stop':
        if (!orchestratorInstance || !orchestratorInstance.isRunning()) {
          return NextResponse.json(
            {
              success: false,
              error: 'Orchestrator is not running'
            },
            { status: 400 }
          )
        }

        // Get final statistics
        const finalStats = orchestratorInstance.getStatistics()

        // Stop orchestrator
        await orchestratorInstance.stop()
        orchestratorInstance = null

        // Log stop event
        await universalApi.createTransaction({
          transaction_type: 'playbook_orchestrator_event',
          organization_id: auth.organizationId!,
          smart_code: 'HERA.PLAYBOOK.ORCHESTRATOR.STOP.V1',
          total_amount: 0,
          metadata: {
            action: 'stop',
            final_statistics: finalStats,
            stopped_by: auth.userId,
            timestamp: new Date().toISOString()
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Orchestrator stopped successfully',
          data: {
            status: 'stopped',
            final_statistics: finalStats
          }
        })

      case 'restart':
        // Stop if running
        if (orchestratorInstance && orchestratorInstance.isRunning()) {
          await orchestratorInstance.stop()
        }

        // Start with new or existing config
        const restartConfig = body.config ||
          orchestratorInstance?.getConfig() || {
            polling_interval_ms: 5000,
            max_concurrent_runs: 10,
            max_concurrent_steps_per_run: 3,
            enable_parallel_execution: true,
            worker_timeout_minutes: 30,
            retry_delays_ms: [1000, 5000, 15000],
            organizations: [auth.organizationId!]
          }

        orchestratorInstance = new PlaybookOrchestratorDaemon(restartConfig)
        await orchestratorInstance.start()

        // Log restart event
        await universalApi.createTransaction({
          transaction_type: 'playbook_orchestrator_event',
          organization_id: auth.organizationId!,
          smart_code: 'HERA.PLAYBOOK.ORCHESTRATOR.RESTART.V1',
          total_amount: 0,
          metadata: {
            action: 'restart',
            config: restartConfig,
            restarted_by: auth.userId,
            timestamp: new Date().toISOString()
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Orchestrator restarted successfully',
          data: {
            status: 'running',
            config: restartConfig
          }
        })

      case 'configure':
        if (!body.config) {
          return NextResponse.json(
            {
              success: false,
              error: 'Configuration required'
            },
            { status: 400 }
          )
        }

        // Update configuration (requires restart)
        const wasRunning = orchestratorInstance && orchestratorInstance.isRunning()
        if (wasRunning) {
          await orchestratorInstance!.stop()
        }

        orchestratorInstance = new PlaybookOrchestratorDaemon(body.config)
        if (wasRunning) {
          await orchestratorInstance.start()
        }

        // Log configuration change
        await universalApi.createTransaction({
          transaction_type: 'playbook_orchestrator_event',
          organization_id: auth.organizationId!,
          smart_code: 'HERA.PLAYBOOK.ORCHESTRATOR.CONFIG.V1',
          total_amount: 0,
          metadata: {
            action: 'configure',
            config: body.config,
            was_running: wasRunning,
            configured_by: auth.userId,
            timestamp: new Date().toISOString()
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Orchestrator configured successfully',
          data: {
            status: wasRunning ? 'running' : 'stopped',
            config: body.config
          }
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action: ${action}`
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Failed to control orchestrator:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
