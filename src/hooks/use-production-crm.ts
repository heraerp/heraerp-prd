/**
 * Production CRM Data Hook
 * Replaces mock data with real HERA API integration
 *
 * Project Manager Priority #1: Data Persistence Foundation
 */

import { useState, useEffect, useCallback } from 'react'
import { useProgressiveAuth } from '@/src/components/auth/ProgressiveAuthProvider'
import {
  ProductionCRMService,
  createCRMService,
  CRMContact,
  CRMOpportunity,
  CRMTask,
  CRMAnalytics
} from '@/src/lib/crm/production-api'

interface CRMState {
  contacts: CRMContact[]
  opportunities: CRMOpportunity[]
  tasks: CRMTask[]
  analytics: CRMAnalytics | null
}

interface CRMActions {
  // Loading states
  isLoading: boolean
  isContactsLoading: boolean
  isOpportunitiesLoading: boolean
  isTasksLoading: boolean
  isAnalyticsLoading: boolean

  // Error states
  error: string | null
  contactsError: string | null
  opportunitiesError: string | null
  tasksError: string | null
  analyticsError: string | null

  // Data refresh methods
  refreshContacts: () => Promise<void>
  refreshOpportunities: () => Promise<void>
  refreshTasks: () => Promise<void>
  refreshAnalytics: () => Promise<void>
  refreshAll: () => Promise<void>

  // CRUD operations
  createContact: (contact: Partial<CRMContact>) => Promise<CRMContact>
  updateContact: (id: string | number, updates: Partial<CRMContact>) => Promise<CRMContact>
  deleteContact: (id: string | number) => Promise<void>

  createOpportunity: (opportunity: Partial<CRMOpportunity>) => Promise<CRMOpportunity>
  updateOpportunity: (
    id: string | number,
    updates: Partial<CRMOpportunity>
  ) => Promise<CRMOpportunity>
  deleteOpportunity: (id: string | number) => Promise<void>

  createTask: (task: Partial<CRMTask>) => Promise<CRMTask>
  updateTask: (id: string | number, updates: Partial<CRMTask>) => Promise<CRMTask>
  deleteTask: (id: string | number) => Promise<void>
}

/**
 * Production CRM Hook
 * Manages all CRM data with real HERA API integration
 */
export function useProductionCRM(): CRMState & CRMActions {
  const { workspace } = useProgressiveAuth()
  const [crmService, setCrmService] = useState<ProductionCRMService | null>(null)

  // Data state
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([])
  const [tasks, setTasks] = useState<CRMTask[]>([])
  const [analytics, setAnalytics] = useState<CRMAnalytics | null>(null)

  // Loading states
  const [isContactsLoading, setIsContactsLoading] = useState(false)
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(false)
  const [isTasksLoading, setIsTasksLoading] = useState(false)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)

  // Error states
  const [contactsError, setContactsError] = useState<string | null>(null)
  const [opportunitiesError, setOpportunitiesError] = useState<string | null>(null)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // Initialize CRM service when user context is available
  useEffect(() => {
    if (workspace?.organization_id) {
      const service = createCRMService(workspace.organization_id)
      setCrmService(service)
    } else {
      setCrmService(null)
    }
  }, [workspace])

  // Auto-load initial data when service is ready
  useEffect(() => {
    if (crmService) {
      refreshAll()
    }
  }, [crmService])

  // Data loading methods
  const refreshContacts = useCallback(async () => {
    if (!crmService) return

    setIsContactsLoading(true)
    setContactsError(null)

    try {
      const data = await crmService.getContacts()
      setContacts(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load contacts'
      setContactsError(errorMessage)
      console.error('Error loading contacts:', error)
    } finally {
      setIsContactsLoading(false)
    }
  }, [crmService])

  const refreshOpportunities = useCallback(async () => {
    if (!crmService) return

    setIsOpportunitiesLoading(true)
    setOpportunitiesError(null)

    try {
      const data = await crmService.getOpportunities()
      setOpportunities(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load opportunities'
      setOpportunitiesError(errorMessage)
      console.error('Error loading opportunities:', error)
    } finally {
      setIsOpportunitiesLoading(false)
    }
  }, [crmService])

  const refreshTasks = useCallback(async () => {
    if (!crmService) return

    setIsTasksLoading(true)
    setTasksError(null)

    try {
      const data = await crmService.getTasks()
      setTasks(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks'
      setTasksError(errorMessage)
      console.error('Error loading tasks:', error)
    } finally {
      setIsTasksLoading(false)
    }
  }, [crmService])

  const refreshAnalytics = useCallback(async () => {
    if (!crmService) return

    setIsAnalyticsLoading(true)
    setAnalyticsError(null)

    try {
      const data = await crmService.getAnalytics()
      setAnalytics(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics'
      setAnalyticsError(errorMessage)
      console.error('Error loading analytics:', error)
    } finally {
      setIsAnalyticsLoading(false)
    }
  }, [crmService])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshContacts(),
      refreshOpportunities(),
      refreshTasks(),
      refreshAnalytics()
    ])
  }, [refreshContacts, refreshOpportunities, refreshTasks, refreshAnalytics])

  // CRUD operations for contacts
  const createContact = useCallback(
    async (contactData: Partial<CRMContact>) => {
      if (!crmService) throw new Error('CRM service not initialized')

      const newContact = await crmService.createContact(contactData)
      setContacts(prev => [...prev, newContact])

      // Refresh analytics to reflect new data
      refreshAnalytics()

      return newContact
    },
    [crmService, refreshAnalytics]
  )

  const updateContact = useCallback(
    async (id: string | number, updates: Partial<CRMContact>) => {
      if (!crmService) throw new Error('CRM service not initialized')

      const updatedContact = await crmService.updateContact(id, updates)
      setContacts(prev => prev.map(c => (c.id === id ? updatedContact : c)))

      // Refresh analytics to reflect updated data
      refreshAnalytics()

      return updatedContact
    },
    [crmService, refreshAnalytics]
  )

  const deleteContact = useCallback(
    async (id: string | number) => {
      if (!crmService) throw new Error('CRM service not initialized')

      await crmService.deleteContact(id)
      setContacts(prev => prev.filter(c => c.id !== id))

      // Refresh analytics to reflect deleted data
      refreshAnalytics()
    },
    [crmService, refreshAnalytics]
  )

  // CRUD operations for opportunities (similar pattern)
  const createOpportunity = useCallback(
    async (opportunityData: Partial<CRMOpportunity>) => {
      if (!crmService) throw new Error('CRM service not initialized')

      const newOpportunity = await crmService.createOpportunity(opportunityData)
      setOpportunities(prev => [...prev, newOpportunity])
      refreshAnalytics()

      return newOpportunity
    },
    [crmService, refreshAnalytics]
  )

  const updateOpportunity = useCallback(
    async (id: string | number, updates: Partial<CRMOpportunity>) => {
      if (!crmService) throw new Error('CRM service not initialized')

      // TODO: Implement updateOpportunity in service
      throw new Error('updateOpportunity not yet implemented')
    },
    [crmService]
  )

  const deleteOpportunity = useCallback(
    async (id: string | number) => {
      if (!crmService) throw new Error('CRM service not initialized')

      // TODO: Implement deleteOpportunity in service
      throw new Error('deleteOpportunity not yet implemented')
    },
    [crmService]
  )

  // CRUD operations for tasks (similar pattern)
  const createTask = useCallback(
    async (taskData: Partial<CRMTask>) => {
      if (!crmService) throw new Error('CRM service not initialized')

      const newTask = await crmService.createTask(taskData)
      setTasks(prev => [...prev, newTask])

      return newTask
    },
    [crmService]
  )

  const updateTask = useCallback(
    async (id: string | number, updates: Partial<CRMTask>) => {
      if (!crmService) throw new Error('CRM service not initialized')

      // TODO: Implement updateTask in service
      throw new Error('updateTask not yet implemented')
    },
    [crmService]
  )

  const deleteTask = useCallback(
    async (id: string | number) => {
      if (!crmService) throw new Error('CRM service not initialized')

      // TODO: Implement deleteTask in service
      throw new Error('deleteTask not yet implemented')
    },
    [crmService]
  )

  // Computed values
  const isLoading =
    isContactsLoading || isOpportunitiesLoading || isTasksLoading || isAnalyticsLoading
  const error = contactsError || opportunitiesError || tasksError || analyticsError

  return {
    // Data state
    contacts,
    opportunities,
    tasks,
    analytics,

    // Loading states
    isLoading,
    isContactsLoading,
    isOpportunitiesLoading,
    isTasksLoading,
    isAnalyticsLoading,

    // Error states
    error,
    contactsError,
    opportunitiesError,
    tasksError,
    analyticsError,

    // Data refresh methods
    refreshContacts,
    refreshOpportunities,
    refreshTasks,
    refreshAnalytics,
    refreshAll,

    // CRUD operations
    createContact,
    updateContact,
    deleteContact,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    createTask,
    updateTask,
    deleteTask
  }
}

/**
 * Demo Fallback Hook
 * For development/demo when HERA API is not available
 */
export function useDemoCRM() {
  // Import demo data
  const demoContacts: CRMContact[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      company: 'Tech Solutions Inc',
      email: 'sarah@techsolutions.com',
      phone: '(555) 123-4567',
      status: 'customer',
      lastContact: '2024-01-15',
      value: 25000,
      probability: 75,
      tags: ['Hot Lead', 'Enterprise'],
      organizationId: 'demo-org',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    }
    // ... more demo data
  ]

  return {
    contacts: demoContacts,
    opportunities: [],
    tasks: [],
    analytics: null,
    isLoading: false
    // ... rest of interface with no-op implementations
  }
}
