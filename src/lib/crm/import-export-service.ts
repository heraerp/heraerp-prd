/**
 * HERA CRM Import/Export Service
 * Enables customer data migration from other CRM systems
 * 
 * Project Manager Priority #5: Data Import/Export
 */

import { CRMContact, CRMOpportunity, CRMTask } from './production-api'
import { heraApi } from '@/lib/hera-api'

export interface ImportMapping {
  sourceField: string
  targetField: string
  transformer?: (value: any) => any
}

export interface ImportTemplate {
  id: string
  name: string
  sourceSystem: 'salesforce' | 'hubspot' | 'pipedrive' | 'custom' | 'csv'
  entityType: 'contact' | 'opportunity' | 'task'
  fieldMappings: ImportMapping[]
  defaultValues?: Record<string, any>
}

export interface ImportResult {
  success: boolean
  totalRecords: number
  importedRecords: number
  failedRecords: number
  errors: ImportError[]
  importedIds: string[]
}

export interface ImportError {
  row: number
  field?: string
  value?: any
  error: string
}

export interface ExportOptions {
  entityType: 'contact' | 'opportunity' | 'task' | 'all'
  format: 'csv' | 'json' | 'excel'
  filters?: {
    dateRange?: { start: string; end: string }
    status?: string[]
    tags?: string[]
  }
  fields?: string[]
}

/**
 * CRM Import/Export Service
 * Handles data migration from various CRM systems
 */
export class CRMImportExportService {
  private organizationId: string
  
  // Pre-built import templates for common CRM systems
  private static readonly IMPORT_TEMPLATES: ImportTemplate[] = [
    {
      id: 'salesforce-contacts',
      name: 'Salesforce Contacts',
      sourceSystem: 'salesforce',
      entityType: 'contact',
      fieldMappings: [
        { sourceField: 'Name', targetField: 'name' },
        { sourceField: 'Company', targetField: 'company' },
        { sourceField: 'Email', targetField: 'email' },
        { sourceField: 'Phone', targetField: 'phone' },
        { sourceField: 'Lead Status', targetField: 'status', transformer: (v) => v?.toLowerCase() || 'lead' },
        { sourceField: 'Industry', targetField: 'industry' },
        { sourceField: 'Annual Revenue', targetField: 'value', transformer: (v) => parseFloat(v) || 0 },
        { sourceField: 'Lead Source', targetField: 'source' },
        { sourceField: 'Description', targetField: 'notes' }
      ]
    },
    {
      id: 'hubspot-contacts',
      name: 'HubSpot Contacts',
      sourceSystem: 'hubspot',
      entityType: 'contact',
      fieldMappings: [
        { sourceField: 'firstname lastname', targetField: 'name', transformer: (v, row) => `${row.firstname || ''} ${row.lastname || ''}`.trim() },
        { sourceField: 'company', targetField: 'company' },
        { sourceField: 'email', targetField: 'email' },
        { sourceField: 'phone', targetField: 'phone' },
        { sourceField: 'lifecyclestage', targetField: 'status' },
        { sourceField: 'industry', targetField: 'industry' },
        { sourceField: 'annualrevenue', targetField: 'value', transformer: (v) => parseFloat(v) || 0 },
        { sourceField: 'hs_lead_status', targetField: 'source' },
        { sourceField: 'note', targetField: 'notes' }
      ]
    },
    {
      id: 'pipedrive-deals',
      name: 'Pipedrive Deals',
      sourceSystem: 'pipedrive',
      entityType: 'opportunity',
      fieldMappings: [
        { sourceField: 'title', targetField: 'name' },
        { sourceField: 'person_name', targetField: 'contact' },
        { sourceField: 'org_name', targetField: 'company' },
        { sourceField: 'stage', targetField: 'stage' },
        { sourceField: 'value', targetField: 'value' },
        { sourceField: 'expected_close_date', targetField: 'closeDate' },
        { sourceField: 'probability', targetField: 'probability' },
        { sourceField: 'owner_name', targetField: 'assignedTo' }
      ]
    }
  ]

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Import contacts from CSV or JSON
   */
  async importContacts(
    data: any[],
    template?: ImportTemplate,
    options?: {
      updateExisting?: boolean
      skipDuplicates?: boolean
      dryRun?: boolean
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRecords: data.length,
      importedRecords: 0,
      failedRecords: 0,
      errors: [],
      importedIds: []
    }

    try {
      // Get existing contacts for duplicate checking
      const existingContacts = options?.skipDuplicates 
        ? await this.getExistingContacts()
        : []

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        
        try {
          // Apply field mappings if template provided
          const mappedData = template 
            ? this.applyFieldMappings(row, template.fieldMappings)
            : row

          // Check for duplicates
          if (options?.skipDuplicates) {
            const isDuplicate = existingContacts.some(c => 
              c.email === mappedData.email || 
              (c.name === mappedData.name && c.company === mappedData.company)
            )
            
            if (isDuplicate) {
              result.errors.push({
                row: i + 1,
                error: 'Duplicate contact found'
              })
              result.failedRecords++
              continue
            }
          }

          // Validate required fields
          const validation = this.validateContact(mappedData)
          if (!validation.valid) {
            result.errors.push({
              row: i + 1,
              field: validation.field,
              error: validation.error || 'Validation failed'
            })
            result.failedRecords++
            continue
          }

          // Import contact if not dry run
          if (!options?.dryRun) {
            const contact = await this.createContact(mappedData)
            result.importedIds.push(contact.id.toString())
            result.importedRecords++
          } else {
            // Dry run - just count as successful
            result.importedRecords++
          }
        } catch (error) {
          result.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Import failed'
          })
          result.failedRecords++
        }
      }

      result.success = result.importedRecords > 0
      return result
    } catch (error) {
      console.error('Import error:', error)
      result.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : 'Import failed'
      })
      return result
    }
  }

  /**
   * Import opportunities from CSV or JSON
   */
  async importOpportunities(
    data: any[],
    template?: ImportTemplate,
    options?: {
      linkToContacts?: boolean
      dryRun?: boolean
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRecords: data.length,
      importedRecords: 0,
      failedRecords: 0,
      errors: [],
      importedIds: []
    }

    try {
      // Get existing contacts for linking
      const contacts = options?.linkToContacts 
        ? await this.getExistingContacts()
        : []

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        
        try {
          // Apply field mappings
          const mappedData = template 
            ? this.applyFieldMappings(row, template.fieldMappings)
            : row

          // Try to link to existing contact
          if (options?.linkToContacts && mappedData.contact) {
            const linkedContact = contacts.find(c => 
              c.name === mappedData.contact || 
              c.email === mappedData.contact
            )
            
            if (linkedContact) {
              mappedData.contactId = linkedContact.id
            }
          }

          // Validate opportunity
          const validation = this.validateOpportunity(mappedData)
          if (!validation.valid) {
            result.errors.push({
              row: i + 1,
              field: validation.field,
              error: validation.error || 'Validation failed'
            })
            result.failedRecords++
            continue
          }

          // Import opportunity
          if (!options?.dryRun) {
            const opportunity = await this.createOpportunity(mappedData)
            result.importedIds.push(opportunity.id.toString())
            result.importedRecords++
          } else {
            result.importedRecords++
          }
        } catch (error) {
          result.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Import failed'
          })
          result.failedRecords++
        }
      }

      result.success = result.importedRecords > 0
      return result
    } catch (error) {
      console.error('Import error:', error)
      result.errors.push({
        row: 0,
        error: error instanceof Error ? error.message : 'Import failed'
      })
      return result
    }
  }

  /**
   * Export CRM data
   */
  async exportData(options: ExportOptions): Promise<{
    success: boolean
    data?: any
    filename?: string
    error?: string
  }> {
    try {
      let allData: any[] = []

      // Fetch data based on entity type
      if (options.entityType === 'contact' || options.entityType === 'all') {
        const contacts = await this.getExistingContacts()
        allData.push(...contacts.map(c => ({ ...c, _type: 'contact' })))
      }

      if (options.entityType === 'opportunity' || options.entityType === 'all') {
        const opportunities = await this.getExistingOpportunities()
        allData.push(...opportunities.map(o => ({ ...o, _type: 'opportunity' })))
      }

      if (options.entityType === 'task' || options.entityType === 'all') {
        const tasks = await this.getExistingTasks()
        allData.push(...tasks.map(t => ({ ...t, _type: 'task' })))
      }

      // Apply filters
      if (options.filters) {
        allData = this.applyExportFilters(allData, options.filters)
      }

      // Filter fields if specified
      if (options.fields && options.fields.length > 0) {
        allData = allData.map(item => {
          const filtered: any = {}
          options.fields!.forEach(field => {
            if (field in item) {
              filtered[field] = item[field]
            }
          })
          return filtered
        })
      }

      // Format data based on export format
      let exportData: any
      let filename: string

      switch (options.format) {
        case 'csv':
          exportData = this.convertToCSV(allData)
          filename = `hera-crm-export-${Date.now()}.csv`
          break
        
        case 'json':
          exportData = JSON.stringify(allData, null, 2)
          filename = `hera-crm-export-${Date.now()}.json`
          break
        
        case 'excel':
          // TODO: Implement Excel export
          throw new Error('Excel export not yet implemented')
        
        default:
          throw new Error('Invalid export format')
      }

      return {
        success: true,
        data: exportData,
        filename
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
   * Get available import templates
   */
  getImportTemplates(): ImportTemplate[] {
    return CRMImportExportService.IMPORT_TEMPLATES
  }

  /**
   * Parse CSV data
   */
  parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = this.parseCSVLine(lines[0])
    const data: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        data.push(row)
      }
    }

    return data
  }

  /**
   * Private helper methods
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    // Get all unique headers
    const headers = new Set<string>()
    data.forEach(item => {
      Object.keys(item).forEach(key => headers.add(key))
    })

    const headerArray = Array.from(headers)
    const csvLines: string[] = []

    // Add header row
    csvLines.push(headerArray.map(h => `"${h}"`).join(','))

    // Add data rows
    data.forEach(item => {
      const values = headerArray.map(header => {
        const value = item[header] ?? ''
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`
      })
      csvLines.push(values.join(','))
    })

    return csvLines.join('\n')
  }

  private applyFieldMappings(row: any, mappings: ImportMapping[]): any {
    const mapped: any = {}
    
    mappings.forEach(mapping => {
      const sourceValue = row[mapping.sourceField]
      if (sourceValue !== undefined) {
        mapped[mapping.targetField] = mapping.transformer 
          ? mapping.transformer(sourceValue, row)
          : sourceValue
      }
    })

    return mapped
  }

  private validateContact(data: any): { valid: boolean; field?: string; error?: string } {
    if (!data.name || !data.name.trim()) {
      return { valid: false, field: 'name', error: 'Name is required' }
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      return { valid: false, field: 'email', error: 'Valid email is required' }
    }

    return { valid: true }
  }

  private validateOpportunity(data: any): { valid: boolean; field?: string; error?: string } {
    if (!data.name || !data.name.trim()) {
      return { valid: false, field: 'name', error: 'Opportunity name is required' }
    }
    
    if (!data.value || isNaN(parseFloat(data.value))) {
      return { valid: false, field: 'value', error: 'Valid value is required' }
    }

    return { valid: true }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private applyExportFilters(data: any[], filters: any): any[] {
    let filtered = [...data]

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt || item.created_at)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(item => 
        filters.status.includes(item.status)
      )
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item => 
        item.tags && filters.tags.some((tag: string) => 
          item.tags.includes(tag)
        )
      )
    }

    return filtered
  }

  // Data access methods (using production API)
  private async getExistingContacts(): Promise<CRMContact[]> {
    const contacts = await heraApi.getEntities('contact', {
      organization_id: this.organizationId
    })

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
      organizationId: contact.organization_id,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at
    } as CRMContact))
  }

  private async getExistingOpportunities(): Promise<CRMOpportunity[]> {
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
      organizationId: opp.organization_id,
      createdAt: opp.created_at,
      updatedAt: opp.updated_at
    } as CRMOpportunity))
  }

  private async getExistingTasks(): Promise<CRMTask[]> {
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
    } as CRMTask))
  }

  private async createContact(data: Partial<CRMContact>): Promise<CRMContact> {
    const entityData = {
      entity_type: 'contact',
      entity_name: data.name || '',
      organization_id: this.organizationId,
      smart_code: 'HERA.CRM.CONTACT.v1',
      dynamic_data: {
        company: data.company,
        email: data.email,
        phone: data.phone,
        status: data.status || 'lead',
        industry: data.industry,
        value: data.value?.toString(),
        probability: data.probability?.toString(),
        tags: JSON.stringify(data.tags || []),
        assigned_to: data.assignedTo,
        source: data.source,
        notes: data.notes
      }
    }

    const newContact = await heraApi.createEntity(entityData)
    
    return {
      id: newContact.entity_id,
      name: newContact.entity_name,
      company: data.company || '',
      email: data.email || '',
      phone: data.phone || '',
      status: data.status || 'lead',
      industry: data.industry || '',
      lastContact: new Date().toISOString(),
      value: data.value || 0,
      probability: data.probability || 0,
      tags: data.tags || [],
      assignedTo: data.assignedTo || '',
      source: data.source || '',
      notes: data.notes || '',
      organizationId: this.organizationId,
      createdAt: newContact.created_at,
      updatedAt: newContact.updated_at
    }
  }

  private async createOpportunity(data: Partial<CRMOpportunity>): Promise<CRMOpportunity> {
    const entityData = {
      entity_type: 'opportunity',
      entity_name: data.name || '',
      organization_id: this.organizationId,
      smart_code: 'HERA.CRM.OPPORTUNITY.v1',
      dynamic_data: {
        contact: data.contact,
        contact_id: data.contactId?.toString(),
        company: data.company,
        stage: data.stage || 'discovery',
        value: data.value?.toString(),
        close_date: data.closeDate,
        probability: data.probability?.toString(),
        assigned_to: data.assignedTo,
        source: data.source,
        description: data.description
      }
    }

    const newOpp = await heraApi.createEntity(entityData)
    
    return {
      id: newOpp.entity_id,
      name: newOpp.entity_name,
      contact: data.contact || '',
      contactId: data.contactId || '',
      company: data.company || '',
      stage: data.stage || 'discovery',
      value: data.value || 0,
      closeDate: data.closeDate || '',
      probability: data.probability || 0,
      assignedTo: data.assignedTo || '',
      source: data.source || '',
      description: data.description || '',
      organizationId: this.organizationId,
      createdAt: newOpp.created_at,
      updatedAt: newOpp.updated_at
    }
  }
}

/**
 * Create import/export service instance
 */
export const createImportExportService = (organizationId: string) => {
  return new CRMImportExportService(organizationId)
}