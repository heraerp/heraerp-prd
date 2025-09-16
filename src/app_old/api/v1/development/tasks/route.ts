import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * HERA Development Tasks API
 *
 * Meta-system for tracking HERA's own development using universal architecture:
 * - Development tasks stored as core_entities with entity_type='development_task'
 * - Work logs stored as universal_transactions with transaction_type='development_work'
 * - Sprint data in core_dynamic_data
 */

// Mock data for development
const mockTasks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945', // HERA Software Inc
    entity_type: 'development_task',
    entity_code: 'TASK-2024-001',
    entity_name: 'Implement Development Dashboard',
    smart_code: 'HERA.DEV.TASK.UI.DASH.v1',
    status: 'in_progress',
    metadata: {
      priority: 'high',
      assignee: 'Claude AI',
      estimated_hours: 4,
      actual_hours: 2.5,
      sprint: 'Sprint 2024.1',
      tags: ['meta-system', 'ui', 'dashboard'],
      completion_percentage: 75,
      acceptance_criteria: [
        'Real-time Git integration',
        'Sprint progress tracking',
        'Build metrics visualization',
        'Task management interface'
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    entity_type: 'development_task',
    entity_code: 'TASK-2024-002',
    entity_name: 'Complete Smart Code System',
    smart_code: 'HERA.DEV.TASK.CORE.SMART.v1',
    status: 'completed',
    metadata: {
      priority: 'critical',
      assignee: 'HERA Team',
      estimated_hours: 8,
      actual_hours: 6,
      sprint: 'Sprint 2024.1',
      tags: ['smart-codes', 'core', 'architecture'],
      completion_percentage: 100
    },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Mock work logs (universal_transactions)
const mockWorkLogs = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    transaction_type: 'development_work',
    transaction_date: new Date().toISOString(),
    reference_number: 'WORK-2024-001',
    description: 'Development work on HERA Dashboard',
    total_amount: 2.5, // Hours worked
    metadata: {
      task_id: '550e8400-e29b-41d4-a716-446655440001',
      developer: 'Claude AI',
      work_type: 'implementation',
      git_commits: ['abc123', 'def456']
    },
    status: 'completed'
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const sprint = searchParams.get('sprint')
    const status = searchParams.get('status')

    // Get sprint metrics
    if (action === 'sprint_metrics') {
      const sprintData = {
        sprint_id: 'sprint-2024-1',
        name: 'Sprint 2024.1 - Universal Architecture',
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        metrics: {
          velocity: 45,
          story_points_planned: 50,
          story_points_completed: 32,
          tasks_total: 8,
          tasks_completed: 5,
          tasks_in_progress: 2,
          tasks_blocked: 1,
          burndown_rate: 4.5 // Story points per day
        },
        team_members: [
          { name: 'Claude AI', capacity: 40, utilized: 32 },
          { name: 'Dev Team', capacity: 80, utilized: 65 }
        ]
      }

      return NextResponse.json({
        success: true,
        data: sprintData
      })
    }

    // Get build progress
    if (action === 'build_progress') {
      const buildProgress = {
        overall_percentage: 88,
        last_updated: new Date().toISOString(),
        categories: [
          { name: 'Universal Tables', percentage: 100, status: 'completed' },
          { name: 'Universal API', percentage: 100, status: 'completed' },
          { name: 'Universal UI', percentage: 100, status: 'completed' },
          { name: 'Smart Coding', percentage: 100, status: 'completed' },
          { name: 'Business Modules', percentage: 60, status: 'in_progress' },
          { name: 'Industry Apps', percentage: 25, status: 'in_progress' }
        ],
        recent_milestones: [
          { date: '2024-01-28', milestone: 'Smart Code System Completed' },
          { date: '2024-01-27', milestone: 'Financial Core Module Released' },
          { date: '2024-01-26', milestone: 'Universal GL System Live' }
        ]
      }

      return NextResponse.json({
        success: true,
        data: buildProgress
      })
    }

    // Get development tasks
    let tasks = [...mockTasks]

    // Filter by sprint
    if (sprint) {
      tasks = tasks.filter(task => task.metadata.sprint === sprint)
    }

    // Filter by status
    if (status) {
      tasks = tasks.filter(task => task.status === status)
    }

    // Add work logs to tasks
    const tasksWithLogs = tasks.map(task => {
      const workLogs = mockWorkLogs.filter(log => log.metadata.task_id === task.id)
      const totalHours = workLogs.reduce((sum, log) => sum + log.total_amount, 0)

      return {
        ...task,
        work_logs: workLogs,
        total_hours_logged: totalHours
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksWithLogs,
        summary: {
          total_tasks: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          blocked: tasks.filter(t => t.status === 'blocked').length,
          total_hours_estimated: tasks.reduce(
            (sum, t) => sum + (t.metadata.estimated_hours || 0),
            0
          ),
          total_hours_actual: tasks.reduce((sum, t) => sum + (t.metadata.actual_hours || 0), 0)
        }
      }
    })
  } catch (error) {
    console.error('Development tasks API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch development tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    // Create new development task
    if (action === 'create_task') {
      const newTask = {
        id: `550e8400-e29b-41d4-a716-${Date.now()}`,
        organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
        entity_type: 'development_task',
        entity_code: `TASK-2024-${String(mockTasks.length + 1).padStart(3, '0')}`,
        entity_name: data.name,
        smart_code: data.smart_code || 'HERA.DEV.TASK.GEN.NEW.v1',
        status: 'not_started',
        metadata: {
          priority: data.priority || 'medium',
          assignee: data.assignee || 'Unassigned',
          estimated_hours: data.estimated_hours || 0,
          actual_hours: 0,
          sprint: data.sprint || 'Backlog',
          tags: data.tags || [],
          completion_percentage: 0,
          description: data.description,
          acceptance_criteria: data.acceptance_criteria || []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        data: newTask,
        message: 'Development task created successfully'
      })
    }

    // Log development work
    if (action === 'log_work') {
      const workLog = {
        id: `660e8400-e29b-41d4-a716-${Date.now()}`,
        organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
        transaction_type: 'development_work',
        transaction_date: new Date().toISOString(),
        reference_number: `WORK-2024-${String(mockWorkLogs.length + 1).padStart(3, '0')}`,
        description: data.description,
        total_amount: data.hours, // Hours worked
        metadata: {
          task_id: data.task_id,
          developer: data.developer,
          work_type: data.work_type || 'development',
          git_commits: data.git_commits || [],
          notes: data.notes
        },
        status: 'completed'
      }

      return NextResponse.json({
        success: true,
        data: workLog,
        message: 'Work logged successfully'
      })
    }

    // Update task status
    if (action === 'update_status') {
      const { task_id, status, completion_percentage } = data

      return NextResponse.json({
        success: true,
        data: {
          task_id,
          status,
          completion_percentage,
          updated_at: new Date().toISOString()
        },
        message: 'Task status updated successfully'
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Development tasks API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
