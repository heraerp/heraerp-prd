/**
 * HERA CRM Production API Service
 * Replaces all mock data with real HERA API integration
 *
 * Project Manager Priority #1: Data Persistence Foundation
 */

import { heraApi } from '@/src/lib/hera-api'

export interface CRMContact {
  id: string | number
  name: string
  company: string
  email: string
  phone: string
  status: 'lead' | 'prospect' | 'customer' | 'champion'
  industry?: string
  lastContact: string
  value: number
  probability?: number
  tags: string[]
  assignedTo?: string
  source?: string
  notes?: string
  nextAction?: string
  nextActionDate?: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CRMOpportunity {
  id: string | number
  name: string
  contact: string
  contactId: string | number
  company: string
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  value: number
  closeDate: string
  probability: number
  assignedTo: string
  source: string
  description: string
  competitorInfo?: string
  winProbability?: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CRMTask {
  id: string | number
  title: string
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow-up'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  contactId: string | number
  assignedTo: string
  notes?: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CRMAnalytics {
  totalPipelineValue: number
  weightedPipeline: number
  averageDealSize: number
  conversionRate: number
  averageSalesCycle: number
  quarterlyTarget: number
  quarterlyAchieved: number
  stageMetrics: Array<{
    stage: string
    count: number
    value: number
  }>
  industryBreakdown: Array<{
    industry: string
    value: number
    deals: number
  }>
}

/**
 * Production CRM API Service
 * Replaces mock data with real HERA universal table operations
 */
export class ProductionCRMService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * CONTACTS - Replace demoContacts with real API calls
   */
  async getContacts(): Promise<CRMContact[]> {
    try {
      // Get all contact entities from HERA universal tables
      const contacts = await heraApi.getEntities('contact', {
        organization_id: this.organizationId
      })

      // Transform to CRM format
      return contacts.map(contact => ({
        id: contact.entity_id,
        name: contact.entity_name,
        company: contact.dynamic_data?.company || '',
        email: contact.dynamic_data?.email || '',
        phone: contact.dynamic_data?.phone || '',
        status: contact.dynamic_data?.status || 'lead',
        industry: contact.dynamic_data?.industry || '',
        lastContact: contact.dynamic_data?.last_contact || contact.updated_at,
        value: parseInt(contact.dynamic_data?.value || '0'),
        probability: parseInt(contact.dynamic_data?.probability || '0'),
        tags: JSON.parse(contact.dynamic_data?.tags || '[]'),
        assignedTo: contact.dynamic_data?.assigned_to || '',
        source: contact.dynamic_data?.source || '',
        notes: contact.dynamic_data?.notes || '',
        nextAction: contact.dynamic_data?.next_action || '',
        nextActionDate: contact.dynamic_data?.next_action_date || '',
        organizationId: contact.organization_id,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      }))
    } catch (error) {
      console.error('Error fetching contacts:', error)
      throw new Error('Failed to fetch contacts from HERA API')
    }
  }

  async createContact(contactData: Partial<CRMContact>): Promise<CRMContact> {
    try {
      // Create contact entity in HERA universal tables
      const entityData = {
        entity_type: 'contact',
        entity_name: contactData.name || '',
        organization_id: this.organizationId,
        smart_code: 'HERA.CRM.CONTACT.v1',
        dynamic_data: {
          company: contactData.company,
          email: contactData.email,
          phone: contactData.phone,
          status: contactData.status || 'lead',
          industry: contactData.industry,
          value: contactData.value?.toString(),
          probability: contactData.probability?.toString(),
          tags: JSON.stringify(contactData.tags || []),
          assigned_to: contactData.assignedTo,
          source: contactData.source,
          notes: contactData.notes,
          next_action: contactData.nextAction,
          next_action_date: contactData.nextActionDate
        }
      }

      const newContact = await heraApi.createEntity(entityData)

      // Return formatted contact
      return {
        id: newContact.entity_id,
        name: newContact.entity_name,
        company: contactData.company || '',
        email: contactData.email || '',
        phone: contactData.phone || '',
        status: contactData.status || 'lead',
        industry: contactData.industry || '',
        lastContact: new Date().toISOString(),
        value: contactData.value || 0,
        probability: contactData.probability || 0,
        tags: contactData.tags || [],
        assignedTo: contactData.assignedTo || '',
        source: contactData.source || '',
        notes: contactData.notes || '',
        nextAction: contactData.nextAction || '',
        nextActionDate: contactData.nextActionDate || '',
        organizationId: this.organizationId,
        createdAt: newContact.created_at,
        updatedAt: newContact.updated_at
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      throw new Error('Failed to create contact in HERA API')
    }
  }

  /**
   * OPPORTUNITIES - Replace demoOpportunities with real API calls
   */
  async getOpportunities(): Promise<CRMOpportunity[]> {
    try {
      const opportunities = await heraApi.getEntities('opportunity', {
        organization_id: this.organizationId
      })

      return opportunities.map(opp => ({
        id: opp.entity_id,
        name: opp.entity_name,
        contact: opp.dynamic_data?.contact || '',
        contactId: opp.dynamic_data?.contact_id || '',
        company: opp.dynamic_data?.company || '',
        stage: opp.dynamic_data?.stage || 'discovery',
        value: parseInt(opp.dynamic_data?.value || '0'),
        closeDate: opp.dynamic_data?.close_date || '',
        probability: parseInt(opp.dynamic_data?.probability || '0'),
        assignedTo: opp.dynamic_data?.assigned_to || '',
        source: opp.dynamic_data?.source || '',
        description: opp.dynamic_data?.description || '',
        competitorInfo: opp.dynamic_data?.competitor_info || '',
        winProbability: opp.dynamic_data?.win_probability || '',
        organizationId: opp.organization_id,
        createdAt: opp.created_at,
        updatedAt: opp.updated_at
      }))
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      throw new Error('Failed to fetch opportunities from HERA API')
    }
  }

  async createOpportunity(oppData: Partial<CRMOpportunity>): Promise<CRMOpportunity> {
    try {
      const entityData = {
        entity_type: 'opportunity',
        entity_name: oppData.name || '',
        organization_id: this.organizationId,
        smart_code: 'HERA.CRM.OPPORTUNITY.v1',
        dynamic_data: {
          contact: oppData.contact,
          contact_id: oppData.contactId?.toString(),
          company: oppData.company,
          stage: oppData.stage || 'discovery',
          value: oppData.value?.toString(),
          close_date: oppData.closeDate,
          probability: oppData.probability?.toString(),
          assigned_to: oppData.assignedTo,
          source: oppData.source,
          description: oppData.description,
          competitor_info: oppData.competitorInfo,
          win_probability: oppData.winProbability
        }
      }

      const newOpp = await heraApi.createEntity(entityData)

      return {
        id: newOpp.entity_id,
        name: newOpp.entity_name,
        contact: oppData.contact || '',
        contactId: oppData.contactId || '',
        company: oppData.company || '',
        stage: oppData.stage || 'discovery',
        value: oppData.value || 0,
        closeDate: oppData.closeDate || '',
        probability: oppData.probability || 0,
        assignedTo: oppData.assignedTo || '',
        source: oppData.source || '',
        description: oppData.description || '',
        competitorInfo: oppData.competitorInfo || '',
        winProbability: oppData.winProbability || '',
        organizationId: this.organizationId,
        createdAt: newOpp.created_at,
        updatedAt: newOpp.updated_at
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
      throw new Error('Failed to create opportunity in HERA API')
    }
  }

  /**
   * TASKS - Replace demoTasks with real API calls
   */
  async getTasks(): Promise<CRMTask[]> {
    try {
      const tasks = await heraApi.getEntities('task', {
        organization_id: this.organizationId
      })

      return tasks.map(task => ({
        id: task.entity_id,
        title: task.entity_name,
        type: task.dynamic_data?.type || 'call',
        priority: task.dynamic_data?.priority || 'medium',
        dueDate: task.dynamic_data?.due_date || '',
        status: task.dynamic_data?.status || 'pending',
        contactId: task.dynamic_data?.contact_id || '',
        assignedTo: task.dynamic_data?.assigned_to || '',
        notes: task.dynamic_data?.notes || '',
        organizationId: task.organization_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw new Error('Failed to fetch tasks from HERA API')
    }
  }

  async createTask(taskData: Partial<CRMTask>): Promise<CRMTask> {
    try {
      const entityData = {
        entity_type: 'task',
        entity_name: taskData.title || '',
        organization_id: this.organizationId,
        smart_code: 'HERA.CRM.TASK.v1',
        dynamic_data: {
          type: taskData.type || 'call',
          priority: taskData.priority || 'medium',
          due_date: taskData.dueDate,
          status: taskData.status || 'pending',
          contact_id: taskData.contactId?.toString(),
          assigned_to: taskData.assignedTo,
          notes: taskData.notes
        }
      }

      const newTask = await heraApi.createEntity(entityData)

      return {
        id: newTask.entity_id,
        title: newTask.entity_name,
        type: taskData.type || 'call',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || '',
        status: taskData.status || 'pending',
        contactId: taskData.contactId || '',
        assignedTo: taskData.assignedTo || '',
        notes: taskData.notes || '',
        organizationId: this.organizationId,
        createdAt: newTask.created_at,
        updatedAt: newTask.updated_at
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw new Error('Failed to create task in HERA API')
    }
  }

  /**
   * ANALYTICS - Replace static calculations with real API data
   */
  async getAnalytics(): Promise<CRMAnalytics> {
    try {
      const [contacts, opportunities, tasks] = await Promise.all([
        this.getContacts(),
        this.getOpportunities(),
        this.getTasks()
      ])

      // Calculate real analytics from actual data
      const totalPipelineValue = opportunities.reduce((sum, opp) => sum + opp.value, 0)
      const weightedPipeline = opportunities.reduce(
        (sum, opp) => sum + (opp.value * opp.probability) / 100,
        0
      )
      const averageDealSize =
        opportunities.length > 0 ? totalPipelineValue / opportunities.length : 0

      // Calculate conversion rate from actual data
      const closedWonOpps = opportunities.filter(opp => opp.stage === 'closed-won')
      const totalOpps = opportunities.length
      const conversionRate = totalOpps > 0 ? (closedWonOpps.length / totalOpps) * 100 : 0

      // Stage metrics from real data
      const stages = [
        'discovery',
        'qualification',
        'proposal',
        'negotiation',
        'closed-won',
        'closed-lost'
      ]
      const stageMetrics = stages.map(stage => {
        const stageOpps = opportunities.filter(opp => opp.stage === stage)
        return {
          stage,
          count: stageOpps.length,
          value: stageOpps.reduce((sum, opp) => sum + opp.value, 0)
        }
      })

      // Industry breakdown from real data
      const industries = [...new Set(contacts.map(c => c.industry).filter(Boolean))]
      const industryBreakdown = industries.map(industry => {
        const industryContacts = contacts.filter(c => c.industry === industry)
        const industryOpps = opportunities.filter(opp =>
          industryContacts.some(contact => contact.name === opp.contact)
        )
        return {
          industry: industry || 'Unknown',
          value: industryOpps.reduce((sum, opp) => sum + opp.value, 0),
          deals: industryOpps.length
        }
      })

      return {
        totalPipelineValue,
        weightedPipeline,
        averageDealSize,
        conversionRate,
        averageSalesCycle: 90, // TODO: Calculate from actual data
        quarterlyTarget: 1000000, // TODO: Get from organization settings
        quarterlyAchieved: closedWonOpps.reduce((sum, opp) => sum + opp.value, 0),
        stageMetrics,
        industryBreakdown
      }
    } catch (error) {
      console.error('Error calculating analytics:', error)
      throw new Error('Failed to calculate analytics from HERA API')
    }
  }

  /**
   * Update methods for real CRUD operations
   */
  async updateContact(
    contactId: string | number,
    updates: Partial<CRMContact>
  ): Promise<CRMContact> {
    try {
      await heraApi.updateEntity(contactId.toString(), {
        entity_name: updates.name,
        dynamic_data: {
          company: updates.company,
          email: updates.email,
          phone: updates.phone,
          status: updates.status,
          industry: updates.industry,
          value: updates.value?.toString(),
          probability: updates.probability?.toString(),
          tags: JSON.stringify(updates.tags || []),
          assigned_to: updates.assignedTo,
          source: updates.source,
          notes: updates.notes,
          next_action: updates.nextAction,
          next_action_date: updates.nextActionDate
        }
      })

      // Return updated contact
      const contacts = await this.getContacts()
      const updatedContact = contacts.find(c => c.id === contactId)
      if (!updatedContact) throw new Error('Contact not found after update')

      return updatedContact
    } catch (error) {
      console.error('Error updating contact:', error)
      throw new Error('Failed to update contact in HERA API')
    }
  }

  async deleteContact(contactId: string | number): Promise<void> {
    try {
      await heraApi.deleteEntity(contactId.toString())
    } catch (error) {
      console.error('Error deleting contact:', error)
      throw new Error('Failed to delete contact from HERA API')
    }
  }
}

/**
 * Export singleton instance for use throughout CRM
 * Requires organization context from authentication
 */
export const createCRMService = (organizationId: string) => {
  return new ProductionCRMService(organizationId)
}
