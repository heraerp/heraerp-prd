/**
 * HERA CRM Search Service
 * Advanced search and filtering functionality for production CRM
 *
 * Project Manager Task: Advanced Search and Filtering Capabilities (Task #7)
 */

import { heraApi } from '@/lib/hera-api'
import type {
  SearchFilters,
  SortOptions,
  SearchResult
} from '@/components/crm/AdvancedSearchFilter'

// Types for search results
export interface CRMContact {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: string
  last_contact: string
  value: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CRMOpportunity {
  id: string
  name: string
  contact_id: string
  contact_name: string
  stage: string
  value: number
  close_date: string
  probability: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CRMTask {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assignee: string
  due_date: string
  contact_id?: string
  opportunity_id?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export type CRMEntity = CRMContact | CRMOpportunity | CRMTask

export class CRMSearchService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Perform advanced search across all CRM entities
   */
  async search(filters: SearchFilters, sort: SortOptions): Promise<SearchResult> {
    const startTime = performance.now()

    try {
      let results: CRMEntity[] = []

      // Global search across all entity types
      if (filters.entityType === 'all' || !filters.entityType) {
        const [contacts, opportunities, tasks] = await Promise.all([
          this.searchContacts(filters, sort),
          this.searchOpportunities(filters, sort),
          this.searchTasks(filters, sort)
        ])

        results = [...contacts.results, ...opportunities.results, ...tasks.results]
      } else {
        // Search specific entity type
        switch (filters.entityType) {
          case 'contact':
            const contactResults = await this.searchContacts(filters, sort)
            results = contactResults.results
            break
          case 'opportunity':
            const opportunityResults = await this.searchOpportunities(filters, sort)
            results = opportunityResults.results
            break
          case 'task':
            const taskResults = await this.searchTasks(filters, sort)
            results = taskResults.results
            break
        }
      }

      // Apply global search filter if specified
      if (filters.globalSearch) {
        results = this.applyGlobalSearch(results, filters.globalSearch)
      }

      // Apply sorting
      results = this.applySorting(results, sort)

      // Apply date range filtering
      if (filters.dateRange.start || filters.dateRange.end) {
        results = this.applyDateRangeFilter(results, filters.dateRange)
      }

      // Apply tag filtering
      if (filters.tags.length > 0) {
        results = results.filter(item => filters.tags.some(tag => item.tags?.includes(tag)))
      }

      const endTime = performance.now()
      const searchTime = Math.round(endTime - startTime)

      // Generate facets for advanced filtering
      const facets = this.generateFacets(results)

      return {
        results,
        totalCount: results.length,
        filteredCount: results.length,
        searchTime,
        facets
      }
    } catch (error) {
      console.error('Search error:', error)
      throw new Error('Search failed. Please try again.')
    }
  }

  /**
   * Search contacts with specific filters
   */
  private async searchContacts(
    filters: SearchFilters,
    sort: SortOptions
  ): Promise<SearchResult<CRMContact>> {
    try {
      // In production, this would call the HERA API
      // For now, we'll use demo data with filtering logic
      const demoContacts: CRMContact[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          company: 'Tech Solutions Inc',
          email: 'sarah@techsolutions.com',
          phone: '(555) 123-4567',
          status: 'customer',
          last_contact: '2024-01-15',
          value: 25000,
          tags: ['Hot Lead', 'Enterprise'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'Mike Chen',
          company: 'StartupCo',
          email: 'mike@startupco.com',
          phone: '(555) 987-6543',
          status: 'prospect',
          last_contact: '2024-01-10',
          value: 5000,
          tags: ['Cold Lead'],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z'
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          company: 'Global Enterprises',
          email: 'emily@global.com',
          phone: '(555) 456-7890',
          status: 'customer',
          last_contact: '2024-01-18',
          value: 50000,
          tags: ['VIP', 'Renewal'],
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-18T00:00:00Z'
        },
        {
          id: '4',
          name: 'David Wilson',
          company: 'Enterprise Corp',
          email: 'david@enterprise.com',
          phone: '(555) 321-9876',
          status: 'prospect',
          last_contact: '2024-01-20',
          value: 75000,
          tags: ['Hot Lead', 'VIP'],
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z'
        },
        {
          id: '5',
          name: 'Lisa Anderson',
          company: 'Innovation Labs',
          email: 'lisa@innovation.com',
          phone: '(555) 654-3210',
          status: 'inactive',
          last_contact: '2023-12-15',
          value: 15000,
          tags: ['Enterprise'],
          created_at: '2023-12-01T00:00:00Z',
          updated_at: '2023-12-15T00:00:00Z'
        }
      ]

      let filteredContacts = demoContacts

      // Apply contact-specific filters
      if (filters.contactName) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.name.toLowerCase().includes(filters.contactName.toLowerCase())
        )
      }

      if (filters.company) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.company.toLowerCase().includes(filters.company.toLowerCase())
        )
      }

      if (filters.email) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.email.toLowerCase().includes(filters.email.toLowerCase())
        )
      }

      if (filters.phone) {
        filteredContacts = filteredContacts.filter(contact => contact.phone.includes(filters.phone))
      }

      if (filters.contactStatus.length > 0) {
        filteredContacts = filteredContacts.filter(contact =>
          filters.contactStatus.includes(contact.status)
        )
      }

      if (filters.contactTags.length > 0) {
        filteredContacts = filteredContacts.filter(contact =>
          filters.contactTags.some(tag => contact.tags.includes(tag))
        )
      }

      // Apply value range filter
      if (filters.valueRange.min > 0 || filters.valueRange.max < 1000000) {
        filteredContacts = filteredContacts.filter(
          contact =>
            contact.value >= filters.valueRange.min && contact.value <= filters.valueRange.max
        )
      }

      return {
        results: filteredContacts,
        totalCount: demoContacts.length,
        filteredCount: filteredContacts.length,
        searchTime: 0,
        facets: {}
      }
    } catch (error) {
      console.error('Contact search error:', error)
      return {
        results: [],
        totalCount: 0,
        filteredCount: 0,
        searchTime: 0,
        facets: {}
      }
    }
  }

  /**
   * Search opportunities with specific filters
   */
  private async searchOpportunities(
    filters: SearchFilters,
    sort: SortOptions
  ): Promise<SearchResult<CRMOpportunity>> {
    try {
      const demoOpportunities: CRMOpportunity[] = [
        {
          id: '1',
          name: 'Tech Solutions - Q1 Implementation',
          contact_id: '1',
          contact_name: 'Sarah Johnson',
          stage: 'proposal',
          value: 25000,
          close_date: '2024-02-15',
          probability: 75,
          tags: ['Enterprise', 'Q1'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'StartupCo - Pilot Program',
          contact_id: '2',
          contact_name: 'Mike Chen',
          stage: 'discovery',
          value: 5000,
          close_date: '2024-03-01',
          probability: 25,
          tags: ['Pilot'],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z'
        },
        {
          id: '3',
          name: 'Global Enterprises - Enterprise License',
          contact_id: '3',
          contact_name: 'Emily Rodriguez',
          stage: 'negotiation',
          value: 50000,
          close_date: '2024-01-30',
          probability: 90,
          tags: ['Enterprise', 'VIP'],
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-18T00:00:00Z'
        },
        {
          id: '4',
          name: 'Enterprise Corp - Platform Integration',
          contact_id: '4',
          contact_name: 'David Wilson',
          stage: 'proposal',
          value: 75000,
          close_date: '2024-02-28',
          probability: 60,
          tags: ['Enterprise', 'Integration'],
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z'
        }
      ]

      let filteredOpportunities = demoOpportunities

      // Apply opportunity-specific filters
      if (filters.opportunityName) {
        filteredOpportunities = filteredOpportunities.filter(opp =>
          opp.name.toLowerCase().includes(filters.opportunityName.toLowerCase())
        )
      }

      if (filters.stage.length > 0) {
        filteredOpportunities = filteredOpportunities.filter(opp =>
          filters.stage.includes(opp.stage)
        )
      }

      if (filters.valueRange.min > 0 || filters.valueRange.max < 1000000) {
        filteredOpportunities = filteredOpportunities.filter(
          opp => opp.value >= filters.valueRange.min && opp.value <= filters.valueRange.max
        )
      }

      if (filters.probabilityRange.min > 0 || filters.probabilityRange.max < 100) {
        filteredOpportunities = filteredOpportunities.filter(
          opp =>
            opp.probability >= filters.probabilityRange.min &&
            opp.probability <= filters.probabilityRange.max
        )
      }

      if (filters.closeDate.start || filters.closeDate.end) {
        filteredOpportunities = filteredOpportunities.filter(opp => {
          const closeDate = new Date(opp.close_date)
          const startDate = filters.closeDate.start ? new Date(filters.closeDate.start) : null
          const endDate = filters.closeDate.end ? new Date(filters.closeDate.end) : null

          return (!startDate || closeDate >= startDate) && (!endDate || closeDate <= endDate)
        })
      }

      return {
        results: filteredOpportunities,
        totalCount: demoOpportunities.length,
        filteredCount: filteredOpportunities.length,
        searchTime: 0,
        facets: {}
      }
    } catch (error) {
      console.error('Opportunity search error:', error)
      return {
        results: [],
        totalCount: 0,
        filteredCount: 0,
        searchTime: 0,
        facets: {}
      }
    }
  }

  /**
   * Search tasks with specific filters
   */
  private async searchTasks(
    filters: SearchFilters,
    sort: SortOptions
  ): Promise<SearchResult<CRMTask>> {
    try {
      const demoTasks: CRMTask[] = [
        {
          id: '1',
          title: 'Follow up with Sarah Johnson',
          description: 'Discuss Q1 implementation timeline',
          status: 'pending',
          priority: 'high',
          assignee: 'Me',
          due_date: '2024-01-25',
          contact_id: '1',
          opportunity_id: '1',
          tags: ['Follow-up'],
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          title: 'Prepare proposal for StartupCo',
          description: 'Create pilot program proposal',
          status: 'in-progress',
          priority: 'medium',
          assignee: 'Team Lead',
          due_date: '2024-01-30',
          contact_id: '2',
          opportunity_id: '2',
          tags: ['Proposal'],
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z'
        },
        {
          id: '3',
          title: 'Contract review - Global Enterprises',
          description: 'Review enterprise license terms',
          status: 'completed',
          priority: 'high',
          assignee: 'Sales Rep',
          due_date: '2024-01-20',
          contact_id: '3',
          opportunity_id: '3',
          tags: ['Contract', 'Legal'],
          created_at: '2024-01-18T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z'
        }
      ]

      let filteredTasks = demoTasks

      // Apply task-specific filters
      if (filters.taskTitle) {
        filteredTasks = filteredTasks.filter(
          task =>
            task.title.toLowerCase().includes(filters.taskTitle.toLowerCase()) ||
            task.description.toLowerCase().includes(filters.taskTitle.toLowerCase())
        )
      }

      if (filters.taskStatus.length > 0) {
        filteredTasks = filteredTasks.filter(task => filters.taskStatus.includes(task.status))
      }

      if (filters.priority.length > 0) {
        filteredTasks = filteredTasks.filter(task => filters.priority.includes(task.priority))
      }

      if (filters.assignee.length > 0) {
        filteredTasks = filteredTasks.filter(task => filters.assignee.includes(task.assignee))
      }

      if (filters.dueDate.start || filters.dueDate.end) {
        filteredTasks = filteredTasks.filter(task => {
          const dueDate = new Date(task.due_date)
          const startDate = filters.dueDate.start ? new Date(filters.dueDate.start) : null
          const endDate = filters.dueDate.end ? new Date(filters.dueDate.end) : null

          return (!startDate || dueDate >= startDate) && (!endDate || dueDate <= endDate)
        })
      }

      return {
        results: filteredTasks,
        totalCount: demoTasks.length,
        filteredCount: filteredTasks.length,
        searchTime: 0,
        facets: {}
      }
    } catch (error) {
      console.error('Task search error:', error)
      return {
        results: [],
        totalCount: 0,
        filteredCount: 0,
        searchTime: 0,
        facets: {}
      }
    }
  }

  /**
   * Apply global search across all fields
   */
  private applyGlobalSearch(results: CRMEntity[], searchTerm: string): CRMEntity[] {
    const term = searchTerm.toLowerCase()

    return results.filter(item => {
      // Search in all text fields
      const searchableFields = Object.values(item)
        .filter(value => typeof value === 'string')
        .join(' ')
        .toLowerCase()

      // Also search in tags if they exist
      const tagsString = item.tags ? item.tags.join(' ').toLowerCase() : ''

      return searchableFields.includes(term) || tagsString.includes(term)
    })
  }

  /**
   * Apply sorting to results
   */
  private applySorting(results: CRMEntity[], sort: SortOptions): CRMEntity[] {
    return results.sort((a, b) => {
      const aValue = (a as any)[sort.field]
      const bValue = (b as any)[sort.field]

      let comparison = 0

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        // Handle dates and other types
        comparison = new Date(aValue).getTime() - new Date(bValue).getTime()
      }

      return sort.direction === 'desc' ? -comparison : comparison
    })
  }

  /**
   * Apply date range filtering
   */
  private applyDateRangeFilter(
    results: CRMEntity[],
    dateRange: { start: string; end: string }
  ): CRMEntity[] {
    if (!dateRange.start && !dateRange.end) return results

    return results.filter(item => {
      // Use updated_at as the primary date field
      const itemDate = new Date(item.updated_at)
      const startDate = dateRange.start ? new Date(dateRange.start) : null
      const endDate = dateRange.end ? new Date(dateRange.end) : null

      return (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate)
    })
  }

  /**
   * Generate facets for filtering UI
   */
  private generateFacets(
    results: CRMEntity[]
  ): Record<string, Array<{ value: string; count: number }>> {
    const facets: Record<string, Record<string, number>> = {}

    // Generate facets for common fields
    results.forEach(item => {
      // Status facet
      if ('status' in item) {
        facets.status = facets.status || {}
        facets.status[item.status] = (facets.status[item.status] || 0) + 1
      }

      // Tags facet
      if (item.tags) {
        facets.tags = facets.tags || {}
        item.tags.forEach(tag => {
          facets.tags[tag] = (facets.tags[tag] || 0) + 1
        })
      }

      // Priority facet (for tasks)
      if ('priority' in item) {
        facets.priority = facets.priority || {}
        facets.priority[(item as CRMTask).priority] =
          (facets.priority[(item as CRMTask).priority] || 0) + 1
      }

      // Stage facet (for opportunities)
      if ('stage' in item) {
        facets.stage = facets.stage || {}
        facets.stage[(item as CRMOpportunity).stage] =
          (facets.stage[(item as CRMOpportunity).stage] || 0) + 1
      }
    })

    // Convert to the expected format
    const result: Record<string, Array<{ value: string; count: number }>> = {}

    Object.keys(facets).forEach(key => {
      result[key] = Object.entries(facets[key])
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count) // Sort by count descending
    })

    return result
  }

  /**
   * Get search suggestions based on partial input
   */
  async getSearchSuggestions(query: string, entityType?: string): Promise<string[]> {
    // In production, this would call an API for search suggestions
    const commonSuggestions = [
      'enterprise customer',
      'high value opportunity',
      'pending tasks',
      'recent activity',
      'hot leads',
      'renewal opportunities',
      'overdue tasks'
    ]

    return commonSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(query.toLowerCase())
    )
  }

  /**
   * Export search results
   */
  async exportResults(
    results: CRMEntity[],
    format: 'csv' | 'json' | 'excel'
  ): Promise<{
    success: boolean
    data?: string
    filename?: string
    error?: string
  }> {
    try {
      const timestamp = new Date().toISOString().split('T')[0]

      if (format === 'json') {
        return {
          success: true,
          data: JSON.stringify(results, null, 2),
          filename: `crm-search-results-${timestamp}.json`
        }
      } else if (format === 'csv') {
        // Convert to CSV
        if (results.length === 0) {
          return { success: false, error: 'No results to export' }
        }

        const headers = Object.keys(results[0]).filter(key => key !== 'tags')
        const csvContent = [
          headers.join(','),
          ...results.map(row =>
            headers
              .map(header => {
                const value = (row as any)[header]
                return typeof value === 'string' ? `"${value}"` : value
              })
              .join(',')
          )
        ].join('\n')

        return {
          success: true,
          data: csvContent,
          filename: `crm-search-results-${timestamp}.csv`
        }
      }

      return { success: false, error: 'Unsupported format' }
    } catch (error) {
      console.error('Export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }
}

// Factory function to create search service
export function createCRMSearchService(organizationId: string): CRMSearchService {
  return new CRMSearchService(organizationId)
}

// Export types
export type { SearchFilters, SortOptions, SearchResult }
