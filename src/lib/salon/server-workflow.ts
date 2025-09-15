/**
 * Server-safe Workflow Implementation
 * Uses direct Supabase calls instead of universal API
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class ServerWorkflow {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Assign a workflow to an entity
   */
  async assignWorkflow(entityId: string, workflowId: string) {
    try {
      // Create relationship between entity and workflow
      const { data, error } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: this.organizationId,
          from_entity_id: entityId,
          to_entity_id: workflowId,
          relationship_type: 'has_workflow',
          smart_code: 'HERA.WORKFLOW.ASSIGN.v1',
          relationship_data: {
            assigned_at: new Date().toISOString(),
            is_active: true
          }
        })
        .select()
        .single()

      if (error) throw error

      // Get initial status from workflow
      const { data: stages } = await supabase
        .from('core_relationships')
        .select('to_entity_id, relationship_data')
        .eq('from_entity_id', workflowId)
        .eq('relationship_type', 'has_stage')
        .eq('relationship_data->is_initial', 'true')
        .single()

      if (stages) {
        // Assign initial status
        await this.assignStatus(entityId, stages.to_entity_id, {
          userId: 'system',
          reason: 'Initial workflow assignment'
        })
      }

      return { success: true, workflowId: data.id }
    } catch (error) {
      console.error('Failed to assign workflow:', error)
      throw error
    }
  }

  /**
   * Get current status of an entity
   */
  async getCurrentStatus(entityId: string) {
    try {
      const { data } = await supabase
        .from('core_relationships')
        .select(
          `
          *,
          to_entity:to_entity_id(*)
        `
        )
        .eq('from_entity_id', entityId)
        .eq('relationship_type', 'has_workflow_status')
        .eq('relationship_data->is_active', 'true')
        .single()

      return data?.to_entity || null
    } catch (error) {
      console.error('Failed to get current status:', error)
      return null
    }
  }

  /**
   * Transition an entity to a new status
   */
  async transitionStatus(entityId: string, newStatusId: string, metadata: any = {}) {
    try {
      // Deactivate current status
      await supabase
        .from('core_relationships')
        .update({
          relationship_data: {
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivated_by: metadata.userId || 'system'
          }
        })
        .eq('from_entity_id', entityId)
        .eq('relationship_type', 'has_workflow_status')
        .eq('relationship_data->is_active', 'true')

      // Create new status relationship
      const { error } = await supabase.from('core_relationships').insert({
        organization_id: this.organizationId,
        from_entity_id: entityId,
        to_entity_id: newStatusId,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.STATUS.TRANSITION.v1',
        relationship_data: {
          is_active: true,
          assigned_at: new Date().toISOString(),
          assigned_by: metadata.userId || 'system',
          transition_reason: metadata.reason || 'Status transition'
        }
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to transition status:', error)
      throw error
    }
  }

  /**
   * Assign a status to an entity (internal helper)
   */
  private async assignStatus(entityId: string, statusId: string, metadata: any = {}) {
    try {
      const { error } = await supabase.from('core_relationships').insert({
        organization_id: this.organizationId,
        from_entity_id: entityId,
        to_entity_id: statusId,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
        relationship_data: {
          is_active: true,
          assigned_at: new Date().toISOString(),
          assigned_by: metadata.userId || 'system',
          assignment_reason: metadata.reason || 'Status assignment'
        }
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to assign status:', error)
      throw error
    }
  }
}
