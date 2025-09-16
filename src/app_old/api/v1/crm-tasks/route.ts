import { NextRequest, NextResponse } from 'next/server'

// CRM Tasks API - Task & Reminder Management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || 'demo_org'
    const completed = searchParams.get('completed')

    // Demo tasks data
    const tasks = [
      {
        id: 1,
        entity_type: 'crm_task',
        entity_name: 'Follow up with Sarah Johnson',
        entity_code: 'TASK-001',
        organization_id: organizationId,
        dynamic_fields: {
          contact_name: 'Sarah Johnson',
          company: 'Tech Solutions Inc',
          task_type: 'follow_up',
          priority: 'high',
          due_date: '2024-01-20',
          completed: false,
          description: 'Follow up on proposal discussion',
          assigned_to: 'John Smith',
          related_opportunity: 'Tech Solutions - Q1 Implementation',
          reminder_date: '2024-01-19',
          estimated_duration: 30
        }
      },
      {
        id: 2,
        entity_type: 'crm_task',
        entity_name: 'Send proposal to Mike Chen',
        entity_code: 'TASK-002',
        organization_id: organizationId,
        dynamic_fields: {
          contact_name: 'Mike Chen',
          company: 'StartupCo',
          task_type: 'send_proposal',
          priority: 'medium',
          due_date: '2024-01-22',
          completed: false,
          description: 'Prepare and send pilot program proposal',
          assigned_to: 'Jane Doe',
          related_opportunity: 'StartupCo - Pilot Program',
          reminder_date: '2024-01-21',
          estimated_duration: 45
        }
      },
      {
        id: 3,
        entity_type: 'crm_task',
        entity_name: 'Contract negotiation call',
        entity_code: 'TASK-003',
        organization_id: organizationId,
        dynamic_fields: {
          contact_name: 'Emily Rodriguez',
          company: 'Global Enterprises',
          task_type: 'meeting',
          priority: 'high',
          due_date: '2024-01-19',
          completed: true,
          description: 'Discuss contract terms and pricing',
          assigned_to: 'John Smith',
          related_opportunity: 'Global Enterprises - Enterprise License',
          reminder_date: '2024-01-18',
          estimated_duration: 60,
          completed_date: '2024-01-19'
        }
      },
      {
        id: 4,
        entity_type: 'crm_task',
        entity_name: 'Demo preparation',
        entity_code: 'TASK-004',
        organization_id: organizationId,
        dynamic_fields: {
          contact_name: 'Sarah Johnson',
          company: 'Tech Solutions Inc',
          task_type: 'preparation',
          priority: 'medium',
          due_date: '2024-01-25',
          completed: false,
          description: 'Prepare customized demo for Tech Solutions',
          assigned_to: 'Technical Team',
          related_opportunity: 'Tech Solutions - Q1 Implementation',
          reminder_date: '2024-01-24',
          estimated_duration: 120
        }
      }
    ]

    // Filter by completion status if specified
    let filteredTasks = tasks
    if (completed !== null) {
      const isCompleted = completed === 'true'
      filteredTasks = tasks.filter(task => task.dynamic_fields.completed === isCompleted)
    }

    const pendingTasks = tasks.filter(task => !task.dynamic_fields.completed)
    const completedTasks = tasks.filter(task => task.dynamic_fields.completed)

    return NextResponse.json({
      success: true,
      data: filteredTasks,
      count: filteredTasks.length,
      summary: {
        total_tasks: tasks.length,
        pending_tasks: pendingTasks.length,
        completed_tasks: completedTasks.length,
        overdue_tasks: pendingTasks.filter(
          task => new Date(task.dynamic_fields.due_date) < new Date()
        ).length,
        high_priority_tasks: pendingTasks.filter(task => task.dynamic_fields.priority === 'high')
          .length
      },
      message: 'Tasks retrieved successfully'
    })
  } catch (error) {
    console.error('CRM Tasks API error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      title,
      contact_name,
      task_type,
      priority,
      due_date,
      description,
      assigned_to,
      related_opportunity
    } = body

    if (!title || !contact_name || !due_date) {
      return NextResponse.json(
        { success: false, message: 'Title, contact name, and due date are required' },
        { status: 400 }
      )
    }

    // Create new task using HERA universal architecture
    const newTask = {
      id: Date.now(),
      entity_type: 'crm_task',
      entity_name: title,
      entity_code: `TASK-${Date.now().toString().slice(-6)}`,
      organization_id: organization_id || 'demo_org',
      status: 'active',
      created_at: new Date().toISOString(),
      dynamic_fields: {
        contact_name,
        task_type: task_type || 'general',
        priority: priority || 'medium',
        due_date,
        completed: false,
        description,
        assigned_to: assigned_to || 'System User',
        related_opportunity,
        created_date: new Date().toISOString().split('T')[0],
        reminder_date: new Date(new Date(due_date).getTime() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 1 day before due date
        estimated_duration: 30
      }
    }

    return NextResponse.json({
      success: true,
      data: newTask,
      message: 'Task created successfully'
    })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create task' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, completed, priority, due_date, description } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'Task ID is required' }, { status: 400 })
    }

    // Update task - this would update the universal tables
    const updatedTask = {
      id,
      updated_at: new Date().toISOString(),
      dynamic_fields: {
        completed: completed !== undefined ? completed : false,
        priority,
        due_date,
        description,
        completed_date: completed ? new Date().toISOString().split('T')[0] : null,
        last_modified: new Date().toISOString().split('T')[0]
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update task' }, { status: 500 })
  }
}
