/**
 * HERA Development Tracker - META Implementation
 *
 * This service implements the sacred META principle: "HERA builds HERA"
 * Every development task, code change, and system enhancement is tracked
 * using HERA's own universal 6-table architecture with smart code indexing
 *
 * Purpose: Enable perfect "vibe coding" where all development context
 * is indexed, searchable, and immediately retrievable for future AI interactions
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'

// HERA System Organization ID - Sacred constant
const HERA_SYSTEM_ORG = '719dfed1-09b4-4ca8-bfda-f682460de945'

// Development Task Interface
export interface HERADevelopmentTask {
  id: string
  taskName: string
  taskCode: string
  smartCode: string
  taskType: 'feature' | 'enhancement' | 'integration' | 'architecture' | 'breakthrough'
  module: string
  status: 'draft' | 'active' | 'inactive' | 'archived'

  // Acceleration Metrics
  traditionalTime: string
  heraTime: string
  accelerationFactor: number
  timeSaved: string

  // Technical Details
  acceptanceCriteria: string[]
  technicalNotes: string[]
  implementationDetails: {
    filesCreated: string[]
    filesModified: string[]
    apisCreated: string[]
    componentsBuilt: string[]
    smartCodesGenerated: string[]
  }

  // Business Impact
  businessValue: string
  davePatelPrinciple: string
  steveJobsPhilosophy: string

  // Relationships
  dependencies: string[]
  relatedTasks: string[]
  followUpTasks: string[]

  // Indexing
  searchKeywords: string[]
  vibeContext: string
  futureRetrievalNotes: string

  createdAt: Date
  completedAt?: Date
}

// Development Session Interface
export interface HERADevelopmentSession {
  sessionId: string
  sessionType: 'feature_development' | 'bug_fix' | 'architecture_design' | 'integration'
  startTime: Date
  endTime?: Date

  // Context
  userQuery: string
  sessionGoal: string
  contextRequired: string[]

  // Tasks Created/Modified
  tasksCreated: string[]
  tasksCompleted: string[]
  tasksModified: string[]

  // Code Changes
  filesChanged: {
    file: string
    changeType: 'created' | 'modified' | 'deleted'
    linesAdded: number
    linesRemoved: number
    smartCode?: string
  }[]

  // Knowledge Generated
  patterns: string[]
  insights: string[]
  bestPractices: string[]

  // Acceleration Achieved
  traditionalApproach: string
  heraApproach: string
  accelerationAchieved: string

  // Indexing for Future Retrieval
  vibeSignature: string
  retrievalContext: {
    whenToUse: string
    similarScenarios: string[]
    keyPatterns: string[]
  }
}

export class HERADevelopmentTracker {
  private supabase = getSupabaseAdmin()

  /**
   * Record a development task using HERA's universal architecture
   */
  async recordDevelopmentTask(task: Partial<HERADevelopmentTask>): Promise<string> {
    try {
      console.log('🧬 Recording HERA development task:', task.taskName)

      // Generate smart code for the development task
      const smartCode = this.generateDevelopmentSmartCode(task.taskType!, task.module!)

      // Step 1: Create entity in core_entities
      const { data: entity, error: entityError } = await this.supabase
        .from('core_entities')
        .insert({
          organization_id: HERA_SYSTEM_ORG,
          entity_type: 'dev_task',
          entity_name: task.taskName,
          entity_code: task.taskCode || this.generateTaskCode(task.taskName!),
          smart_code: smartCode,
          smart_code_status: 'PROD',
          status: task.status || 'active',
          metadata: {
            taskType: task.taskType,
            module: task.module,
            vibeContext: task.vibeContext,
            davePatelPrinciple: task.davePatelPrinciple,
            steveJobsPhilosophy: task.steveJobsPhilosophy
          }
        })
        .select()
        .single()

      if (entityError) throw entityError

      // Step 2: Store detailed properties in core_dynamic_data
      const dynamicFields = [
        { field_name: 'traditional_time', field_type: 'text', field_value: task.traditionalTime },
        { field_name: 'hera_time', field_type: 'text', field_value: task.heraTime },
        {
          field_name: 'acceleration_factor',
          field_type: 'number',
          field_value_number: task.accelerationFactor
        },
        { field_name: 'time_saved', field_type: 'text', field_value: task.timeSaved },
        {
          field_name: 'acceptance_criteria',
          field_type: 'json',
          field_value_json: task.acceptanceCriteria
        },
        {
          field_name: 'technical_notes',
          field_type: 'json',
          field_value_json: task.technicalNotes
        },
        {
          field_name: 'implementation_details',
          field_type: 'json',
          field_value_json: task.implementationDetails
        },
        { field_name: 'business_value', field_type: 'text', field_value: task.businessValue },
        {
          field_name: 'search_keywords',
          field_type: 'json',
          field_value_json: task.searchKeywords
        },
        {
          field_name: 'future_retrieval_notes',
          field_type: 'text',
          field_value: task.futureRetrievalNotes
        }
      ]

      const dynamicInserts = dynamicFields
        .filter(field => field.field_value || field.field_value_number || field.field_value_json)
        .map(field => ({
          organization_id: HERA_SYSTEM_ORG,
          entity_id: entity.id,
          ...field
        }))

      if (dynamicInserts.length > 0) {
        const { error: dynamicError } = await this.supabase
          .from('core_dynamic_data')
          .insert(dynamicInserts)

        if (dynamicError) throw dynamicError
      }

      // Step 3: Create relationships for dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        const relationshipInserts = task.dependencies.map(depId => ({
          organization_id: HERA_SYSTEM_ORG,
          from_entity_id: entity.id,
          to_entity_id: depId,
          relationship_type: 'depends_on',
          metadata: { context: 'development_dependency' }
        }))

        const { error: relError } = await this.supabase
          .from('core_relationships')
          .insert(relationshipInserts)

        if (relError) console.warn('Failed to create dependencies:', relError)
      }

      // Step 4: Record as transaction for analytics
      await this.recordDevelopmentTransaction({
        entityId: entity.id,
        transactionType: 'task_created',
        description: `Development task created: ${task.taskName}`,
        metadata: {
          taskType: task.taskType,
          module: task.module,
          smartCode,
          accelerationFactor: task.accelerationFactor
        }
      })

      console.log('✅ HERA development task recorded:', entity.id)
      return entity.id
    } catch (error) {
      console.error('❌ Failed to record development task:', error)
      throw error
    }
  }

  /**
   * Record a development session for vibe coding context
   */
  async recordDevelopmentSession(session: Partial<HERADevelopmentSession>): Promise<string> {
    try {
      console.log('🎯 Recording HERA development session:', session.sessionType)

      // Generate smart code for the session
      const smartCode = `HERA.SOF.DEV.SES.${session.sessionType?.toUpperCase().slice(0, 3)}.v1`

      // Step 1: Create session entity
      const { data: entity, error: entityError } = await this.supabase
        .from('core_entities')
        .insert({
          organization_id: HERA_SYSTEM_ORG,
          entity_type: 'dev_session',
          entity_name: `Session: ${session.sessionGoal}`,
          entity_code: session.sessionId || this.generateSessionId(),
          smart_code: smartCode,
          smart_code_status: 'PROD',
          status: session.endTime ? 'inactive' : 'active', // inactive = completed
          metadata: {
            sessionType: session.sessionType,
            userQuery: session.userQuery,
            vibeSignature: session.vibeSignature,
            retrievalContext: session.retrievalContext
          }
        })
        .select()
        .single()

      if (entityError) throw entityError

      // Step 2: Store session details in dynamic data
      const dynamicFields = [
        { field_name: 'session_goal', field_type: 'text', field_value: session.sessionGoal },
        {
          field_name: 'context_required',
          field_type: 'json',
          field_value_json: session.contextRequired
        },
        { field_name: 'files_changed', field_type: 'json', field_value_json: session.filesChanged },
        { field_name: 'patterns', field_type: 'json', field_value_json: session.patterns },
        { field_name: 'insights', field_type: 'json', field_value_json: session.insights },
        {
          field_name: 'best_practices',
          field_type: 'json',
          field_value_json: session.bestPractices
        },
        {
          field_name: 'traditional_approach',
          field_type: 'text',
          field_value: session.traditionalApproach
        },
        { field_name: 'hera_approach', field_type: 'text', field_value: session.heraApproach },
        {
          field_name: 'acceleration_achieved',
          field_type: 'text',
          field_value: session.accelerationAchieved
        }
      ]

      const dynamicInserts = dynamicFields
        .filter(field => field.field_value || field.field_value_json)
        .map(field => ({
          organization_id: HERA_SYSTEM_ORG,
          entity_id: entity.id,
          ...field
        }))

      if (dynamicInserts.length > 0) {
        const { error: dynamicError } = await this.supabase
          .from('core_dynamic_data')
          .insert(dynamicInserts)

        if (dynamicError) throw dynamicError
      }

      // Step 3: Record session metrics as transaction
      await this.recordDevelopmentTransaction({
        entityId: entity.id,
        transactionType: 'dev_session',
        description: `Development session: ${session.sessionGoal}`,
        amount: session.filesChanged?.length || 0,
        metadata: {
          sessionType: session.sessionType,
          filesChanged: session.filesChanged?.length || 0,
          tasksCompleted: session.tasksCompleted?.length || 0,
          smartCode
        }
      })

      console.log('✅ HERA development session recorded:', entity.id)
      return entity.id
    } catch (error) {
      console.error('❌ Failed to record development session:', error)
      throw error
    }
  }

  /**
   * Update task status and record acceleration metrics
   */
  async updateTaskStatus(
    taskId: string,
    status: HERADevelopmentTask['status'],
    completionDetails?: {
      actualTimeSpent: string
      finalAcceleration: number
      lessonsLearned: string[]
      patternsIdentified: string[]
    }
  ): Promise<void> {
    try {
      console.log('📝 Updating HERA task status:', taskId, status)

      // Update entity status
      const { error: updateError } = await this.supabase
        .from('core_entities')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('organization_id', HERA_SYSTEM_ORG)

      if (updateError) throw updateError

      // Add completion details if provided (inactive = completed)
      if (completionDetails && status === 'inactive') {
        const completionFields = [
          {
            field_name: 'actual_time_spent',
            field_type: 'text',
            field_value: completionDetails.actualTimeSpent
          },
          {
            field_name: 'final_acceleration',
            field_type: 'number',
            field_value_number: completionDetails.finalAcceleration
          },
          {
            field_name: 'lessons_learned',
            field_type: 'json',
            field_value_json: completionDetails.lessonsLearned
          },
          {
            field_name: 'patterns_identified',
            field_type: 'json',
            field_value_json: completionDetails.patternsIdentified
          },
          { field_name: 'completed_at', field_type: 'text', field_value: new Date().toISOString() }
        ]

        const completionInserts = completionFields.map(field => ({
          organization_id: HERA_SYSTEM_ORG,
          entity_id: taskId,
          ...field
        }))

        const { error: completionError } = await this.supabase
          .from('core_dynamic_data')
          .insert(completionInserts)

        if (completionError) throw completionError
      }

      // Record status change as transaction
      await this.recordDevelopmentTransaction({
        entityId: taskId,
        transactionType: 'task_status_changed',
        description: `Task status changed to: ${status}`,
        metadata: {
          newStatus: status,
          completionDetails
        }
      })

      console.log('✅ HERA task status updated:', taskId, status)
    } catch (error) {
      console.error('❌ Failed to update task status:', error)
      throw error
    }
  }

  /**
   * Search development history for vibe coding context
   */
  async searchDevelopmentContext(query: {
    keywords?: string[]
    module?: string
    taskType?: string
    similarTo?: string
    timeframe?: { from: Date; to: Date }
    includeSessions?: boolean
  }): Promise<{
    tasks: any[]
    sessions: any[]
    patterns: string[]
    recommendations: string[]
    accelerationOpportunities: string[]
  }> {
    try {
      console.log('🔍 Searching HERA development context:', query)

      // Build search query for tasks
      let taskQuery = this.supabase
        .from('core_entities')
        .select(
          `
          *,
          dynamic_data:core_dynamic_data(*),
          relationships:core_relationships(*)
        `
        )
        .eq('organization_id', HERA_SYSTEM_ORG)
        .eq('entity_type', 'dev_task')

      // Apply filters
      if (query.module) {
        taskQuery = taskQuery.like('metadata->module', `%${query.module}%`)
      }

      if (query.taskType) {
        taskQuery = taskQuery.like('metadata->taskType', `%${query.taskType}%`)
      }

      const { data: tasks, error: taskError } = await taskQuery
      if (taskError) throw taskError

      // Search sessions if requested
      let sessions = []
      if (query.includeSessions) {
        const { data: sessionData, error: sessionError } = await this.supabase
          .from('core_entities')
          .select(
            `
            *,
            dynamic_data:core_dynamic_data(*)
          `
          )
          .eq('organization_id', HERA_SYSTEM_ORG)
          .eq('entity_type', 'dev_session')

        if (!sessionError) {
          sessions = sessionData || []
        }
      }

      // Extract patterns and insights
      const patterns = new Set<string>()
      const recommendations = new Set<string>()
      const accelerationOpportunities = new Set<string>()

      // Process tasks for patterns
      tasks?.forEach((task: any) => {
        task.dynamic_data?.forEach((field: any) => {
          if (field.field_name === 'patterns_identified' && field.field_value_json) {
            field.field_value_json.forEach((pattern: string) => patterns.add(pattern))
          }
          if (field.field_name === 'lessons_learned' && field.field_value_json) {
            field.field_value_json.forEach((lesson: string) => recommendations.add(lesson))
          }
          if (field.field_name === 'acceleration_factor' && field.field_value_number > 10) {
            accelerationOpportunities.add(
              `${task.entity_name}: ${field.field_value_number}x acceleration achieved`
            )
          }
        })
      })

      // Process sessions for patterns
      sessions.forEach((session: any) => {
        session.dynamic_data?.forEach((field: any) => {
          if (field.field_name === 'patterns' && field.field_value_json) {
            field.field_value_json.forEach((pattern: string) => patterns.add(pattern))
          }
          if (field.field_name === 'best_practices' && field.field_value_json) {
            field.field_value_json.forEach((practice: string) => recommendations.add(practice))
          }
        })
      })

      console.log('✅ HERA development context retrieved:', {
        tasks: tasks?.length || 0,
        sessions: sessions.length,
        patterns: patterns.size,
        recommendations: recommendations.size
      })

      return {
        tasks: tasks || [],
        sessions,
        patterns: Array.from(patterns),
        recommendations: Array.from(recommendations),
        accelerationOpportunities: Array.from(accelerationOpportunities)
      }
    } catch (error) {
      console.error('❌ Failed to search development context:', error)
      return {
        tasks: [],
        sessions: [],
        patterns: [],
        recommendations: [],
        accelerationOpportunities: []
      }
    }
  }

  /**
   * Private helper methods
   */

  private generateDevelopmentSmartCode(taskType: string, module: string): string {
    const typeMap = {
      feature: 'FET',
      enhancement: 'ENH',
      integration: 'INT',
      architecture: 'ARC',
      breakthrough: 'BRK'
    }

    const moduleCode = module.toUpperCase().slice(0, 3)
    const typeCode = typeMap[taskType as keyof typeof typeMap] || 'GEN'

    return `HERA.SOF.DEV.TSK.${typeCode}.v1`
  }

  private generateTaskCode(taskName: string): string {
    const words = taskName.split(' ')
    const code = words.map(w => w.slice(0, 3).toUpperCase()).join('-')
    return `TASK-${code}-${Date.now().toString().slice(-4)}`
  }

  private generateSessionId(): string {
    return `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  }

  private async recordDevelopmentTransaction(data: {
    entityId: string
    transactionType: string
    description: string
    amount?: number
    metadata?: any
  }): Promise<void> {
    try {
      const { error } = await this.supabase.from('universal_transactions').insert({
        organization_id: HERA_SYSTEM_ORG,
        entity_id: data.entityId,
        transaction_type: data.transactionType,
        transaction_date: new Date().toISOString(),
        total_amount: data.amount || 0,
        description: data.description,
        status: 'posted',
        metadata: {
          ...data.metadata,
          development_tracking: true,
          meta_principle: 'HERA builds HERA'
        }
      })

      if (error) console.warn('Failed to record development transaction:', error)
    } catch (error) {
      console.warn('Development transaction recording failed:', error)
    }
  }
}

// Export singleton instance
export const heraDevTracker = new HERADevelopmentTracker()
