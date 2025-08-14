'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getHeraAPI } from '@/lib/hera-api'

/**
 * HERA Software Company - Development Tasks API
 * Smart Code: HERA.SOF.DEV.TSK.MGT.v1
 * 
 * META BREAKTHROUGH IMPLEMENTATION:
 * This API manages HERA's own development tasks using HERA's universal architecture.
 * It proves that HERA can use its own system for any business type, including software development.
 * 
 * Universal Architecture Usage:
 * - core_entities: Store development tasks as entities with entity_type = 'dev_task'
 * - core_dynamic_data: Store task metadata (acceleration factors, time estimates, smart codes)
 * - core_relationships: Link tasks to projects, team members, modules
 * - universal_transactions: Track task status changes as transactions
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status') // pending, in_progress, completed
    const priority = searchParams.get('priority') // high, medium, low
    const assignedTo = searchParams.get('assigned_to')
    const includeAcceleration = searchParams.get('include_acceleration') === 'true'
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const heraApi = getHeraAPI()
    
    // Get development tasks using universal patterns
    const devTasks = await heraApi.getEntities('dev_task', {
      organization_id: organizationId,
      ...(status && { task_status: status }),
      ...(priority && { priority: priority }),
      ...(assignedTo && { assigned_to: assignedTo }),
      include_dynamic_data: true,
      order_by: 'created_at DESC'
    })

    // Format tasks with development-specific data
    const formattedTasks = await Promise.all(devTasks.map(async task => {
      // Get acceleration data if requested
      let accelerationData = null
      if (includeAcceleration) {
        const accelerationFields = await heraApi.getDynamicData(task.id, [
          'traditional_time',
          'hera_time', 
          'acceleration_factor',
          'time_saved'
        ])
        
        accelerationData = {
          traditional_time: accelerationFields.traditional_time || 'Not specified',
          hera_time: accelerationFields.hera_time || 'Not specified',
          acceleration_factor: accelerationFields.acceleration_factor || 'Calculating...',
          time_saved: accelerationFields.time_saved || 'Significant'
        }
      }

      // Get related team members and projects
      const relationships = await heraApi.getRelationships(task.id, ['assigned_to', 'part_of_project'])

      return {
        ...task,
        smart_code: 'HERA.SOF.DEV.TSK.MGT.v1',
        task_id: task.entity_code,
        title: task.entity_name,
        description: task.description || '',
        status: task.task_status || 'pending',
        priority: task.priority || 'medium',
        smart_code_pattern: task.smart_code_pattern || `HERA.SOF.DEV.TSK.${task.entity_name?.substring(0, 3).toUpperCase()}.v1`,
        created_date: task.created_at,
        completed_date: task.completed_at || null,
        acceleration_data: accelerationData,
        relationships: {
          assigned_to: relationships.filter(r => r.relationship_type === 'assigned_to'),
          projects: relationships.filter(r => r.relationship_type === 'part_of_project')
        },
        meta_breakthrough: true // This task is managed by HERA itself
      }
    }))

    // Calculate development statistics
    const stats = {
      total_tasks: formattedTasks.length,
      by_status: {
        pending: formattedTasks.filter(t => t.status === 'pending').length,
        in_progress: formattedTasks.filter(t => t.status === 'in_progress').length,
        completed: formattedTasks.filter(t => t.status === 'completed').length
      },
      by_priority: {
        high: formattedTasks.filter(t => t.priority === 'high').length,
        medium: formattedTasks.filter(t => t.priority === 'medium').length,
        low: formattedTasks.filter(t => t.priority === 'low').length
      },
      completion_rate: formattedTasks.length > 0 ? 
        (formattedTasks.filter(t => t.status === 'completed').length / formattedTasks.length * 100).toFixed(1) : '0',
      meta_breakthrough_active: true
    }

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      smart_code: 'HERA.SOF.DEV.TSK.MGT.v1',
      development_stats: stats,
      meta_breakthrough: {
        message: 'HERA using HERA to manage its own development',
        proof_of_concept: 'Universal architecture validated for software development',
        acceleration_advantage: 'Development task management: seconds vs weeks'
      },
      hera_advantages: {
        universal_architecture: 'Any business type supported without schema changes',
        real_time_tracking: 'Live task status and acceleration metrics',
        meta_validation: 'HERA proves itself by managing its own development'
      }
    })
  } catch (error) {
    console.error('Development Tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve development tasks', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, task_data, action_type = 'create_task' } = body

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const heraApi = getHeraAPI()
    
    if (action_type === 'create_task') {
      // Create new development task
      const newTask = await heraApi.createEntity({
        organization_id,
        entity_type: 'dev_task',
        entity_name: task_data.title,
        entity_code: `TASK-${Date.now()}`,
        smart_code: 'HERA.SOF.DEV.TSK.MGT.v1',
        description: task_data.description,
        task_status: 'pending',
        priority: task_data.priority || 'medium',
        smart_code_pattern: task_data.smart_code || `HERA.SOF.DEV.TSK.${task_data.title?.substring(0, 3).toUpperCase()}.v1`,
        assigned_to: task_data.assigned_to,
        estimated_effort: task_data.estimated_effort,
        business_value: task_data.business_value || 'high',
        module_category: task_data.module_category || 'core'
      })

      // Store acceleration data in core_dynamic_data
      if (task_data.traditional_time || task_data.hera_time) {
        const accelerationFactor = calculateAccelerationFactor(
          task_data.traditional_time, 
          task_data.hera_time
        )
        
        await heraApi.setDynamicData(newTask.id, {
          traditional_time: task_data.traditional_time,
          hera_time: task_data.hera_time,
          acceleration_factor: accelerationFactor,
          time_saved: calculateTimeSaved(task_data.traditional_time, task_data.hera_time)
        })
      }

      // Create task creation transaction
      await heraApi.createTransaction({
        organization_id,
        transaction_type: 'task_created',
        entity_id: newTask.id,
        transaction_data: {
          task_title: task_data.title,
          priority: task_data.priority,
          created_by: task_data.created_by
        },
        smart_code: 'HERA.SOF.DEV.TSK.MGT.v1'
      })

      return NextResponse.json({
        success: true,
        data: newTask,
        message: 'Development task created successfully',
        smart_code: 'HERA.SOF.DEV.TSK.MGT.v1',
        meta_breakthrough: 'Task created using HERA universal architecture'
      })
    }

    if (action_type === 'bulk_import_meta_tasks') {
      // Import the complete Meta Breakthrough task list
      const metaTasks = [
        {
          title: 'Universal 6-Table Schema Implementation',
          description: 'Complete implementation of the universal 6-table architecture that handles any business complexity',
          priority: 'high',
          smart_code: 'HERA.SOF.DEV.TSK.SCHEMA.v1',
          traditional_time: '12-18 months',
          hera_time: '2 weeks',
          status: 'completed'
        },
        {
          title: 'Smart Code System Development', 
          description: 'Build the hierarchical smart code system for universal business patterns',
          priority: 'high',
          smart_code: 'HERA.SOF.DEV.TSK.SMART.v1',
          traditional_time: '8-12 months',
          hera_time: '3 weeks',
          status: 'completed'
        },
        {
          title: 'HERA-SPEAR Template System',
          description: '24-hour ERP implementation framework with industry-specific templates',
          priority: 'high',
          smart_code: 'HERA.SOF.DEV.TSK.SPEAR.v1',
          traditional_time: '18-24 months', 
          hera_time: '4 weeks',
          status: 'completed'
        },
        {
          title: 'Universal API Layer',
          description: 'Complete API layer supporting all business operations through universal patterns',
          priority: 'high',
          smart_code: 'HERA.SOF.DEV.TSK.API.v1',
          traditional_time: '6-10 months',
          hera_time: '2 weeks',
          status: 'completed'
        },
        {
          title: 'Module Generation System',
          description: 'Complete module generators achieving 200x acceleration in development',
          priority: 'high', 
          smart_code: 'HERA.SOF.DEV.TSK.GEN.v1',
          traditional_time: '26-52 weeks per module',
          hera_time: '30 seconds per module',
          status: 'completed'
        },
        {
          title: 'Anti-Amnesia DNA System',
          description: 'Permanent embedding of 200x acceleration to prevent development amnesia',
          priority: 'high',
          smart_code: 'HERA.SOF.DEV.TSK.DNA.v1',
          traditional_time: 'Never achieved in traditional development',
          hera_time: '1 day',
          status: 'completed'
        },
        {
          title: 'Meta Breakthrough Implementation',
          description: 'HERA using HERA to manage its own development - proving the universal architecture',
          priority: 'high',
          smart_code: 'HERA.SOF.DEV.TSK.META.v1',
          traditional_time: 'Impossible with traditional ERPs',
          hera_time: 'Real-time',
          status: 'in_progress'
        }
      ]

      const createdTasks = []
      for (const taskTemplate of metaTasks) {
        const task = await heraApi.createEntity({
          organization_id,
          entity_type: 'dev_task',
          entity_name: taskTemplate.title,
          entity_code: `META-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          smart_code: taskTemplate.smart_code,
          description: taskTemplate.description,
          task_status: taskTemplate.status,
          priority: taskTemplate.priority,
          smart_code_pattern: taskTemplate.smart_code,
          assigned_to: 'HERA Team',
          business_value: 'critical',
          module_category: 'meta_breakthrough'
        })

        // Store acceleration data
        const accelerationFactor = calculateAccelerationFactor(
          taskTemplate.traditional_time,
          taskTemplate.hera_time
        )
        
        await heraApi.setDynamicData(task.id, {
          traditional_time: taskTemplate.traditional_time,
          hera_time: taskTemplate.hera_time,
          acceleration_factor: accelerationFactor,
          time_saved: calculateTimeSaved(taskTemplate.traditional_time, taskTemplate.hera_time)
        })

        createdTasks.push(task)
      }

      return NextResponse.json({
        success: true,
        data: createdTasks,
        message: `${createdTasks.length} Meta Breakthrough tasks imported`,
        smart_code: 'HERA.SOF.DEV.TSK.MGT.v1',
        meta_breakthrough: 'Complete HERA development history now managed by HERA itself'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action_type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Development Tasks creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create development task', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, task_id, updates, action } = body

    if (!organization_id || !task_id) {
      return NextResponse.json(
        { error: 'organization_id and task_id are required' },
        { status: 400 }
      )
    }

    const heraApi = getHeraAPI()
    
    if (action === 'update_status') {
      // Update task status with transaction tracking
      const updatedTask = await heraApi.updateEntity(task_id, {
        organization_id,
        task_status: updates.status,
        completed_at: updates.status === 'completed' ? new Date().toISOString() : null,
        completed_by: updates.status === 'completed' ? updates.user_id : null
      })

      // Create status change transaction
      await heraApi.createTransaction({
        organization_id,
        transaction_type: 'task_status_changed',
        entity_id: task_id,
        transaction_data: {
          previous_status: updates.previous_status,
          new_status: updates.status,
          changed_by: updates.user_id,
          timestamp: new Date().toISOString()
        },
        smart_code: 'HERA.SOF.DEV.TSK.MGT.v1'
      })

      return NextResponse.json({
        success: true,
        data: updatedTask,
        message: `Task status updated to ${updates.status}`,
        smart_code: 'HERA.SOF.DEV.TSK.MGT.v1',
        meta_breakthrough: 'Status change tracked in universal transaction system'
      })
    }
    
    // General task update
    const updatedTask = await heraApi.updateEntity(task_id, {
      organization_id,
      ...updates
    })

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Development Tasks update error:', error)
    return NextResponse.json(
      { error: 'Failed to update task', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions for acceleration calculations
function calculateAccelerationFactor(traditional: string, hera: string): string {
  if (!traditional || !hera) return 'N/A'
  
  // Parse time strings and convert to a common unit (hours)
  const traditionalHours = parseTimeToHours(traditional)
  const heraHours = parseTimeToHours(hera)
  
  if (heraHours === 0) return '∞x faster'
  
  const factor = Math.round(traditionalHours / heraHours)
  return `${factor}x faster`
}

function calculateTimeSaved(traditional: string, hera: string): string {
  if (!traditional || !hera) return 'Significant time savings'
  
  const traditionalHours = parseTimeToHours(traditional)
  const heraHours = parseTimeToHours(hera)
  const savedHours = traditionalHours - heraHours
  
  if (savedHours > 8760) { // More than a year
    return `${Math.round(savedHours / 8760)} years saved`
  } else if (savedHours > 168) { // More than a week
    return `${Math.round(savedHours / 168)} weeks saved`
  } else if (savedHours > 24) { // More than a day
    return `${Math.round(savedHours / 24)} days saved`
  } else {
    return `${Math.round(savedHours)} hours saved`
  }
}

function parseTimeToHours(timeString: string): number {
  const lowerStr = timeString.toLowerCase()
  const numberMatch = lowerStr.match(/\d+/)
  const number = numberMatch ? parseInt(numberMatch[0]) : 1
  
  if (lowerStr.includes('second')) return number / 3600
  if (lowerStr.includes('minute')) return number / 60
  if (lowerStr.includes('hour')) return number
  if (lowerStr.includes('day')) return number * 24
  if (lowerStr.includes('week')) return number * 168
  if (lowerStr.includes('month')) return number * 730 // Approximate
  if (lowerStr.includes('year')) return number * 8760
  
  // Default to hours if no unit specified
  return number
}