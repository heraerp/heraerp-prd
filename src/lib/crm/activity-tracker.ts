/**
 * HERA CRM Activity Tracker & Audit Trail System
 * Comprehensive activity logging and audit trail for production CRM
 * 
 * Project Manager Task: Activity History and Audit Trail (Task #8)
 */

import { heraApi } from '@/lib/hera-api'

// Types for activity tracking
export interface ActivityEvent {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_email: string
  organization_id: string
  
  // Activity details
  action_type: 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'email' | 'call' | 'meeting' | 'note'
  entity_type: 'contact' | 'opportunity' | 'task' | 'document' | 'email' | 'call' | 'meeting' | 'note' | 'import_batch'
  entity_id: string
  entity_name: string
  
  // Change tracking
  changes?: Array<{
    field: string
    old_value: any
    new_value: any
  }>
  
  // Context and metadata
  description: string
  category: 'data_change' | 'communication' | 'document' | 'system' | 'integration'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: 'web_app' | 'mobile_app' | 'api' | 'import' | 'system'
  ip_address?: string
  user_agent?: string
  session_id?: string
  
  // Related entities
  related_contacts?: string[]
  related_opportunities?: string[]
  related_tasks?: string[]
  
  // Additional metadata
  metadata?: {
    [key: string]: any
  }
}

export interface ActivityFilter {
  user_id?: string
  entity_type?: string
  entity_id?: string
  action_type?: string
  category?: string
  date_range?: {
    start: string
    end: string
  }
  search_query?: string
  related_to?: {
    type: 'contact' | 'opportunity' | 'task'
    id: string
  }
}

export interface ActivitySummary {
  total_activities: number
  activities_by_type: Record<string, number>
  activities_by_user: Record<string, number>
  activities_by_category: Record<string, number>
  recent_activities: ActivityEvent[]
  most_active_entities: Array<{
    entity_type: string
    entity_id: string
    entity_name: string
    activity_count: number
  }>
}

export class ActivityTracker {
  private organizationId: string
  private userId: string
  private userName: string
  private userEmail: string

  constructor(organizationId: string, userId: string, userName: string, userEmail: string) {
    this.organizationId = organizationId
    this.userId = userId
    this.userName = userName
    this.userEmail = userEmail
  }

  /**
   * Track a new activity event
   */
  async trackActivity(event: Partial<ActivityEvent>): Promise<void> {
    try {
      const fullEvent: ActivityEvent = {
        id: this.generateActivityId(),
        timestamp: new Date().toISOString(),
        user_id: this.userId,
        user_name: this.userName,
        user_email: this.userEmail,
        organization_id: this.organizationId,
        source: 'web_app',
        severity: 'low',
        category: 'data_change',
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        session_id: this.getSessionId(),
        ...event
      } as ActivityEvent

      // Store in HERA universal tables
      await this.storeActivity(fullEvent)

      console.log('Activity tracked:', fullEvent)
    } catch (error) {
      console.error('Failed to track activity:', error)
      // Don't throw - activity tracking should not break the main flow
    }
  }

  /**
   * Track contact-related activities
   */
  async trackContactActivity(
    action: 'create' | 'update' | 'delete' | 'view',
    contactId: string,
    contactName: string,
    changes?: Array<{ field: string; old_value: any; new_value: any }>
  ): Promise<void> {
    const descriptions = {
      create: `Created new contact: ${contactName}`,
      update: `Updated contact: ${contactName}`,
      delete: `Deleted contact: ${contactName}`,
      view: `Viewed contact: ${contactName}`
    }

    await this.trackActivity({
      action_type: action,
      entity_type: 'contact',
      entity_id: contactId,
      entity_name: contactName,
      description: descriptions[action],
      category: 'data_change',
      severity: action === 'delete' ? 'high' : 'low',
      changes
    })
  }

  /**
   * Track opportunity-related activities
   */
  async trackOpportunityActivity(
    action: 'create' | 'update' | 'delete' | 'view',
    opportunityId: string,
    opportunityName: string,
    changes?: Array<{ field: string; old_value: any; new_value: any }>
  ): Promise<void> {
    const descriptions = {
      create: `Created new opportunity: ${opportunityName}`,
      update: `Updated opportunity: ${opportunityName}`,
      delete: `Deleted opportunity: ${opportunityName}`,
      view: `Viewed opportunity: ${opportunityName}`
    }

    await this.trackActivity({
      action_type: action,
      entity_type: 'opportunity',
      entity_id: opportunityId,
      entity_name: opportunityName,
      description: descriptions[action],
      category: 'data_change',
      severity: action === 'delete' ? 'high' : 'medium',
      changes
    })
  }

  /**
   * Track task-related activities
   */
  async trackTaskActivity(
    action: 'create' | 'update' | 'delete' | 'view',
    taskId: string,
    taskTitle: string,
    changes?: Array<{ field: string; old_value: any; new_value: any }>
  ): Promise<void> {
    const descriptions = {
      create: `Created new task: ${taskTitle}`,
      update: `Updated task: ${taskTitle}`,
      delete: `Deleted task: ${taskTitle}`,
      view: `Viewed task: ${taskTitle}`
    }

    await this.trackActivity({
      action_type: action,
      entity_type: 'task',
      entity_id: taskId,
      entity_name: taskTitle,
      description: descriptions[action],
      category: 'data_change',
      severity: 'low',
      changes
    })
  }

  /**
   * Track communication activities
   */
  async trackCommunication(
    type: 'email' | 'call' | 'meeting',
    description: string,
    relatedContacts?: string[],
    relatedOpportunities?: string[],
    metadata?: any
  ): Promise<void> {
    await this.trackActivity({
      action_type: type,
      entity_type: type,
      entity_id: this.generateActivityId(),
      entity_name: description,
      description: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${description}`,
      category: 'communication',
      severity: 'medium',
      related_contacts: relatedContacts,
      related_opportunities: relatedOpportunities,
      metadata
    })
  }

  /**
   * Track document activities
   */
  async trackDocumentActivity(
    action: 'upload' | 'download' | 'delete' | 'view',
    documentName: string,
    entityType: string,
    entityId: string,
    metadata?: any
  ): Promise<void> {
    const descriptions = {
      upload: `Uploaded document: ${documentName}`,
      download: `Downloaded document: ${documentName}`,
      delete: `Deleted document: ${documentName}`,
      view: `Viewed document: ${documentName}`
    }

    await this.trackActivity({
      action_type: action === 'upload' ? 'create' : action === 'download' ? 'view' : action,
      entity_type: 'document',
      entity_id: entityId,
      entity_name: documentName,
      description: descriptions[action],
      category: 'document',
      severity: action === 'delete' ? 'medium' : 'low',
      metadata: {
        ...metadata,
        related_entity_type: entityType,
        related_entity_id: entityId
      }
    })
  }

  /**
   * Track data import/export activities
   */
  async trackDataActivity(
    action: 'import' | 'export',
    entityType: string,
    recordCount: number,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    await this.trackActivity({
      action_type: action,
      entity_type: 'import_batch',
      entity_id: this.generateActivityId(),
      entity_name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${entityType}`,
      description: `${success ? 'Successfully' : 'Failed to'} ${action} ${recordCount} ${entityType} record(s)`,
      category: 'system',
      severity: success ? 'medium' : 'high',
      metadata: {
        ...metadata,
        entity_type: entityType,
        record_count: recordCount,
        success
      }
    })
  }

  /**
   * Get activity history with filtering
   */
  async getActivityHistory(
    filters: ActivityFilter = {},
    limit = 50,
    offset = 0
  ): Promise<{
    activities: ActivityEvent[]
    total_count: number
    has_more: boolean
  }> {
    try {
      // In production, this would query the actual database
      // For now, return demo activity data
      const demoActivities = this.generateDemoActivities()
      
      let filteredActivities = demoActivities

      // Apply filters
      if (filters.user_id) {
        filteredActivities = filteredActivities.filter(a => a.user_id === filters.user_id)
      }

      if (filters.entity_type) {
        filteredActivities = filteredActivities.filter(a => a.entity_type === filters.entity_type)
      }

      if (filters.entity_id) {
        filteredActivities = filteredActivities.filter(a => a.entity_id === filters.entity_id)
      }

      if (filters.action_type) {
        filteredActivities = filteredActivities.filter(a => a.action_type === filters.action_type)
      }

      if (filters.category) {
        filteredActivities = filteredActivities.filter(a => a.category === filters.category)
      }

      if (filters.date_range) {
        const startDate = new Date(filters.date_range.start)
        const endDate = new Date(filters.date_range.end)
        filteredActivities = filteredActivities.filter(a => {
          const activityDate = new Date(a.timestamp)
          return activityDate >= startDate && activityDate <= endDate
        })
      }

      if (filters.search_query) {
        const query = filters.search_query.toLowerCase()
        filteredActivities = filteredActivities.filter(a =>
          a.description.toLowerCase().includes(query) ||
          a.entity_name.toLowerCase().includes(query) ||
          a.user_name.toLowerCase().includes(query)
        )
      }

      // Sort by timestamp descending
      filteredActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // Apply pagination
      const paginatedActivities = filteredActivities.slice(offset, offset + limit)

      return {
        activities: paginatedActivities,
        total_count: filteredActivities.length,
        has_more: filteredActivities.length > offset + limit
      }
    } catch (error) {
      console.error('Failed to get activity history:', error)
      return {
        activities: [],
        total_count: 0,
        has_more: false
      }
    }
  }

  /**
   * Get activity summary for dashboard
   */
  async getActivitySummary(days = 30): Promise<ActivitySummary> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

      const { activities } = await this.getActivityHistory({
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }, 1000) // Get more activities for summary

      const summary: ActivitySummary = {
        total_activities: activities.length,
        activities_by_type: {},
        activities_by_user: {},
        activities_by_category: {},
        recent_activities: activities.slice(0, 10),
        most_active_entities: []
      }

      // Calculate summaries
      activities.forEach(activity => {
        // By type
        summary.activities_by_type[activity.action_type] = 
          (summary.activities_by_type[activity.action_type] || 0) + 1

        // By user
        summary.activities_by_user[activity.user_name] = 
          (summary.activities_by_user[activity.user_name] || 0) + 1

        // By category
        summary.activities_by_category[activity.category] = 
          (summary.activities_by_category[activity.category] || 0) + 1
      })

      // Most active entities
      const entityCounts: Record<string, { entity_type: string; entity_name: string; count: number }> = {}
      activities.forEach(activity => {
        const key = `${activity.entity_type}:${activity.entity_id}`
        if (!entityCounts[key]) {
          entityCounts[key] = {
            entity_type: activity.entity_type,
            entity_name: activity.entity_name,
            count: 0
          }
        }
        entityCounts[key].count++
      })

      summary.most_active_entities = Object.entries(entityCounts)
        .map(([key, data]) => ({
          entity_type: data.entity_type,
          entity_id: key.split(':')[1],
          entity_name: data.entity_name,
          activity_count: data.count
        }))
        .sort((a, b) => b.activity_count - a.activity_count)
        .slice(0, 10)

      return summary
    } catch (error) {
      console.error('Failed to get activity summary:', error)
      return {
        total_activities: 0,
        activities_by_type: {},
        activities_by_user: {},
        activities_by_category: {},
        recent_activities: [],
        most_active_entities: []
      }
    }
  }

  /**
   * Export activity history
   */
  async exportActivityHistory(
    filters: ActivityFilter = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<{
    success: boolean
    data?: string
    filename?: string
    error?: string
  }> {
    try {
      const { activities } = await this.getActivityHistory(filters, 10000)

      if (activities.length === 0) {
        return { success: false, error: 'No activities to export' }
      }

      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'json') {
        return {
          success: true,
          data: JSON.stringify(activities, null, 2),
          filename: `crm-activity-history-${timestamp}.json`
        }
      } else {
        // Convert to CSV
        const headers = [
          'timestamp', 'user_name', 'action_type', 'entity_type', 
          'entity_name', 'description', 'category', 'severity'
        ]
        
        const csvContent = [
          headers.join(','),
          ...activities.map(activity => [
            activity.timestamp,
            `"${activity.user_name}"`,
            activity.action_type,
            activity.entity_type,
            `"${activity.entity_name}"`,
            `"${activity.description}"`,
            activity.category,
            activity.severity
          ].join(','))
        ].join('\n')

        return {
          success: true,
          data: csvContent,
          filename: `crm-activity-history-${timestamp}.csv`
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      }
    }
  }

  /**
   * Store activity in HERA universal tables
   */
  private async storeActivity(activity: ActivityEvent): Promise<void> {
    try {
      // Create activity entity
      const activityEntity = {
        entity_type: 'activity_log',
        entity_name: activity.description,
        entity_code: activity.id,
        organization_id: this.organizationId,
        status: 'active',
        metadata: {
          action_type: activity.action_type,
          entity_type: activity.entity_type,
          entity_id: activity.entity_id,
          category: activity.category,
          severity: activity.severity,
          source: activity.source
        }
      }

      const createdEntity = await heraApi.createEntity(activityEntity)

      // Store detailed activity data in dynamic fields
      const dynamicFields = [
        { field_name: 'timestamp', field_value: activity.timestamp },
        { field_name: 'user_id', field_value: activity.user_id },
        { field_name: 'user_name', field_value: activity.user_name },
        { field_name: 'user_email', field_value: activity.user_email },
        { field_name: 'description', field_value: activity.description },
        { field_name: 'ip_address', field_value: activity.ip_address },
        { field_name: 'user_agent', field_value: activity.user_agent },
        { field_name: 'session_id', field_value: activity.session_id }
      ]

      if (activity.changes) {
        dynamicFields.push({ 
          field_name: 'changes', 
          field_value: JSON.stringify(activity.changes) 
        })
      }

      if (activity.related_contacts) {
        dynamicFields.push({ 
          field_name: 'related_contacts', 
          field_value: JSON.stringify(activity.related_contacts) 
        })
      }

      if (activity.metadata) {
        dynamicFields.push({ 
          field_name: 'activity_metadata', 
          field_value: JSON.stringify(activity.metadata) 
        })
      }

      // Store all dynamic fields
      for (const field of dynamicFields) {
        await heraApi.setDynamicData(createdEntity.id, field)
      }

      console.log('Activity stored successfully:', activity.id)
    } catch (error) {
      console.error('Failed to store activity:', error)
      // Don't throw - this is background logging
    }
  }

  // Utility methods
  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getClientIP(): Promise<string> {
    try {
      // In production, you might want to get the real IP from the request
      return 'localhost'
    } catch {
      return 'unknown'
    }
  }

  private getSessionId(): string {
    // Get or generate session ID
    let sessionId = sessionStorage.getItem('hera_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('hera_session_id', sessionId)
    }
    return sessionId
  }

  private generateDemoActivities(): ActivityEvent[] {
    const now = new Date()
    const activities: ActivityEvent[] = []

    // Generate demo activities for the last 7 days
    for (let i = 0; i < 50; i++) {
      const daysBack = Math.floor(Math.random() * 7)
      const hoursBack = Math.floor(Math.random() * 24)
      const timestamp = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000) - (hoursBack * 60 * 60 * 1000))

      const actions = ['create', 'update', 'view', 'delete', 'email', 'call'] as const
      const entities = ['contact', 'opportunity', 'task', 'document'] as const
      const categories = ['data_change', 'communication', 'document', 'system'] as const
      const users = ['Mario Rossi', 'Sarah Johnson', 'Mike Chen', 'Emily Rodriguez']

      const action = actions[Math.floor(Math.random() * actions.length)]
      const entity = entities[Math.floor(Math.random() * entities.length)]
      const category = categories[Math.floor(Math.random() * categories.length)]
      const user = users[Math.floor(Math.random() * users.length)]

      activities.push({
        id: this.generateActivityId(),
        timestamp: timestamp.toISOString(),
        user_id: `user_${user.toLowerCase().replace(' ', '_')}`,
        user_name: user,
        user_email: `${user.toLowerCase().replace(' ', '.')}@company.com`,
        organization_id: this.organizationId,
        action_type: action,
        entity_type: entity,
        entity_id: `${entity}_${i}`,
        entity_name: `${entity.charAt(0).toUpperCase() + entity.slice(1)} ${i + 1}`,
        description: `${user} ${action}d ${entity} "${entity.charAt(0).toUpperCase() + entity.slice(1)} ${i + 1}"`,
        category: category,
        severity: action === 'delete' ? 'high' : 'low',
        source: 'web_app',
        ip_address: '192.168.1.' + (100 + Math.floor(Math.random() * 50)),
        user_agent: 'Mozilla/5.0 (Demo Browser)',
        session_id: `session_${user.replace(' ', '_')}`
      })
    }

    return activities
  }
}

// Factory function to create activity tracker
export function createActivityTracker(
  organizationId: string, 
  userId: string, 
  userName: string, 
  userEmail: string
): ActivityTracker {
  return new ActivityTracker(organizationId, userId, userName, userEmail)
}

// Export types
export type { ActivityEvent, ActivityFilter, ActivitySummary }