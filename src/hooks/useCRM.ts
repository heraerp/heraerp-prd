/**
 * HERA CRM React Hooks
 * Smart Code: HERA.CRM.CORE.HOOKS.REACT.V1
 * 
 * React Query hooks for CRM operations with caching and optimistic updates
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { CRMClient, type CRMEntityInput, type CRMRelationshipInput } from '@/lib/crm/api'
import type { UniversalEntity } from '@/hooks/useUniversalEntity'
import { CRM_ENTITY_CODES } from '@/lib/crm/smart-codes'

// Query key factories
export const crmQueryKeys = {
  all: ['crm'] as const,
  entities: () => [...crmQueryKeys.all, 'entities'] as const,
  entity: (id: string) => [...crmQueryKeys.entities(), id] as const,
  entityType: (type: keyof typeof CRM_ENTITY_CODES) => [...crmQueryKeys.entities(), 'type', type] as const,
  relationships: (entityId: string) => [...crmQueryKeys.all, 'relationships', entityId] as const,
  transactions: (entityId: string) => [...crmQueryKeys.all, 'transactions', entityId] as const,
  search: (query: string) => [...crmQueryKeys.all, 'search', query] as const,
  leads: () => [...crmQueryKeys.all, 'leads'] as const,
  opportunities: () => [...crmQueryKeys.all, 'opportunities'] as const,
  pipeline: () => [...crmQueryKeys.all, 'pipeline'] as const,
  activities: () => [...crmQueryKeys.all, 'activities'] as const,
  tasks: () => [...crmQueryKeys.all, 'tasks'] as const
}

/**
 * Base hook for CRM client
 */
export function useCRMClient() {
  const { currentOrganization } = useHERAAuth()
  
  if (!currentOrganization?.id) {
    throw new Error('CRM operations require organization context')
  }
  
  return new CRMClient(currentOrganization.id)
}

/**
 * Entity Hooks
 */

// Get single CRM entity
export function useCRMEntity(entityId: string) {
  const client = useCRMClient()
  
  return useQuery({
    queryKey: crmQueryKeys.entity(entityId),
    queryFn: () => client.entities.getEntity(entityId),
    enabled: !!entityId
  })
}

// Get CRM entities by type
export function useCRMEntities(entityType: keyof typeof CRM_ENTITY_CODES, filters?: Record<string, any>) {
  const client = useCRMClient()
  
  return useQuery({
    queryKey: [...crmQueryKeys.entityType(entityType), JSON.stringify(filters || {})],
    queryFn: () => client.entities.getEntities(entityType, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create CRM entity mutation
export function useCreateCRMEntity() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CRMEntityInput) => client.entities.createEntity(input),
    onSuccess: (data, variables) => {
      // Invalidate and refetch entity type queries
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.entityType(variables.entity_type)
      })
      
      // Set the new entity in cache
      queryClient.setQueryData(
        crmQueryKeys.entity(data.entity_id),
        data.entity
      )
      
      // Invalidate search queries that might include this entity
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.all,
        predicate: (query) => query.queryKey.includes('search')
      })
    }
  })
}

// Update CRM entity mutation
export function useUpdateCRMEntity() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ entityId, fields }: { 
      entityId: string
      fields: Record<string, { value: any; type: 'text' | 'number' | 'boolean' | 'date' | 'json' }> 
    }) => {
      await client.entities.updateDynamicFields(entityId, fields)
      return client.entities.getEntity(entityId)
    },
    onSuccess: (updatedEntity, variables) => {
      // Update entity in cache
      queryClient.setQueryData(
        crmQueryKeys.entity(variables.entityId),
        updatedEntity
      )
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.entities()
      })
    }
  })
}

// Delete CRM entity mutation
export function useDeleteCRMEntity() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (entityId: string) => client.entities.deleteEntity(entityId),
    onSuccess: (_, entityId) => {
      // Remove entity from cache
      queryClient.removeQueries({
        queryKey: crmQueryKeys.entity(entityId)
      })
      
      // Invalidate entity lists
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.entities()
      })
    }
  })
}

// Search CRM entities
export function useSearchCRMEntities(query: string, entityTypes?: Array<keyof typeof CRM_ENTITY_CODES>) {
  const client = useCRMClient()
  
  return useQuery({
    queryKey: [...crmQueryKeys.search(query), JSON.stringify(entityTypes || [])],
    queryFn: () => client.entities.searchEntities(query, entityTypes),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Lead Management Hooks
 */

// Get all leads
export function useCRMLeads() {
  return useCRMEntities('LEAD')
}

// Create lead
export function useCreateLead() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof client.leads.createLead>[0]) => 
      client.leads.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leads() })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('LEAD') })
    }
  })
}

// Convert lead
export function useConvertLead() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ leadId, conversionData }: {
      leadId: string
      conversionData: Parameters<typeof client.leads.convertLead>[1]
    }) => client.leads.convertLead(leadId, conversionData),
    onSuccess: () => {
      // Invalidate multiple entity types since we may have created account/contact/opportunity
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('LEAD') })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('ACCOUNT') })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('CONTACT') })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('OPPORTUNITY') })
    }
  })
}

/**
 * Opportunity Pipeline Hooks
 */

// Get all opportunities
export function useCRMOpportunities() {
  return useCRMEntities('OPPORTUNITY')
}

// Create opportunity
export function useCreateOpportunity() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof client.opportunities.createOpportunity>[0]) => 
      client.opportunities.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.opportunities() })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('OPPORTUNITY') })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.pipeline() })
    }
  })
}

// Move opportunity stage
export function useMoveOpportunityStage() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ opportunityId, newStage }: { opportunityId: string; newStage: string }) => 
      client.opportunities.moveOpportunityStage(opportunityId, newStage),
    onSuccess: (_, { opportunityId }) => {
      // Update the specific opportunity
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entity(opportunityId) })
      
      // Update pipeline views
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.opportunities() })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.pipeline() })
    }
  })
}

// Get pipeline data with stages
export function useCRMPipeline() {
  const { data: opportunities = [], ...query } = useCRMOpportunities()
  
  // Transform opportunities into pipeline stages
  const pipelineStages = opportunities.reduce((stages, opp) => {
    const stage = opp.dynamic_fields?.stage?.value || 'Unknown'
    
    if (!stages[stage]) {
      stages[stage] = []
    }
    
    stages[stage].push({
      id: opp.entity_id || '',
      entity_name: opp.entity_name,
      amount: opp.dynamic_fields?.amount?.value || 0,
      currency: 'USD',
      probability: opp.dynamic_fields?.probability?.value || 0,
      close_date: opp.dynamic_fields?.close_date?.value || '',
      stage: stage,
      // Add other fields as needed
    })
    
    return stages
  }, {} as Record<string, any[]>)
  
  return {
    ...query,
    data: pipelineStages,
    opportunities
  }
}

/**
 * Activity & Task Hooks
 */

// Get activities
export function useCRMActivities(entityId?: string) {
  const client = useCRMClient()
  
  return useQuery({
    queryKey: entityId ? crmQueryKeys.transactions(entityId) : crmQueryKeys.activities(),
    queryFn: () => {
      if (entityId) {
        return client.transactions.getEntityTransactions(entityId)
      }
      return client.entities.getEntities('ACTIVITY')
    },
    staleTime: 2 * 60 * 1000
  })
}

// Log activity
export function useLogActivity() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof client.activities.logActivity>[0]) => 
      client.activities.logActivity(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.activities() })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('ACTIVITY') })
      
      // If activity is related to an entity, invalidate its transactions
      if (variables.relatedEntityId) {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.transactions(variables.relatedEntityId) 
        })
      }
    }
  })
}

// Get tasks
export function useCRMTasks(filters?: Record<string, any>) {
  return useCRMEntities('TASK', filters)
}

// Create task
export function useCreateTask() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof client.activities.createTask>[0]) => 
      client.activities.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.entityType('TASK') })
    }
  })
}

/**
 * Relationship Hooks
 */

// Get entity relationships
export function useCRMEntityRelationships(entityId: string, relationshipType?: string) {
  const client = useCRMClient()
  
  return useQuery({
    queryKey: [...crmQueryKeys.relationships(entityId), relationshipType || 'all'],
    queryFn: () => client.relationships.getEntityRelationships(entityId, relationshipType as any),
    enabled: !!entityId,
    staleTime: 5 * 60 * 1000
  })
}

// Create relationship
export function useCreateCRMRelationship() {
  const client = useCRMClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CRMRelationshipInput) => client.relationships.createRelationship(input),
    onSuccess: (_, variables) => {
      // Invalidate relationships for both entities
      queryClient.invalidateQueries({ 
        queryKey: crmQueryKeys.relationships(variables.source_entity_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: crmQueryKeys.relationships(variables.target_entity_id) 
      })
    }
  })
}

/**
 * Composite Hooks for Common Patterns
 */

// Get account with related contacts and opportunities
export function useCRMAccountDetails(accountId: string) {
  const account = useCRMEntity(accountId)
  const contacts = useCRMEntityRelationships(accountId, 'CONTACT_OF_ACCOUNT')
  const opportunities = useCRMEntityRelationships(accountId, 'OPPORTUNITY_OF_ACCOUNT')
  const activities = useCRMActivities(accountId)
  
  return {
    account,
    contacts,
    opportunities,
    activities,
    isLoading: account.isLoading || contacts.isLoading || opportunities.isLoading,
    error: account.error || contacts.error || opportunities.error
  }
}

// Get contact with related account and opportunities
export function useCRMContactDetails(contactId: string) {
  const contact = useCRMEntity(contactId)
  const opportunities = useCRMEntityRelationships(contactId, 'OPPORTUNITY_OF_CONTACT')
  const activities = useCRMActivities(contactId)
  
  return {
    contact,
    opportunities,
    activities,
    isLoading: contact.isLoading || opportunities.isLoading,
    error: contact.error || opportunities.error
  }
}

// Get opportunity with related account, contact, and activities
export function useCRMOpportunityDetails(opportunityId: string) {
  const opportunity = useCRMEntity(opportunityId)
  const activities = useCRMActivities(opportunityId)
  const tasks = useCRMTasks({ related_entity_id: opportunityId })
  
  return {
    opportunity,
    activities,
    tasks,
    isLoading: opportunity.isLoading || activities.isLoading,
    error: opportunity.error || activities.error
  }
}