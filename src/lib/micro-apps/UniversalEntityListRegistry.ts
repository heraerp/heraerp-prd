/**
 * Universal Entity List Registry
 * Smart Code: HERA.MICRO_APPS.UNIVERSAL.ENTITY_LIST_REGISTRY.v1
 * 
 * Discovers and configures entity types for advanced listing operations
 * Provides glassmorphism SAP Fiori patterns with micro-app integration
 */

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  User, 
  DollarSign, 
  Settings, 
  MoreHorizontal,
  Calendar,
  Mail,
  Phone,
  Globe,
  Hash,
  CheckCircle
} from 'lucide-react'
import { microAppClient, type MicroAppEntity } from './micro-app-client'
import { UniversalEntityRegistry, type WorkspaceEntityContext } from './UniversalEntityRegistry'

// Enhanced interfaces for listing operations
export interface EntityListConfig {
  entityType: string
  entityLabel: string
  entityLabelPlural: string
  smartCodePattern: string
  columns: ColumnDef<any>[]
  searchableFields: string[]
  filterableFields: EntityFilterField[]
  sortableFields: string[]
  defaultSort: { field: string; order: 'asc' | 'desc' }
  actions: EntityListAction[]
  workspaceContext: WorkspaceEntityContext
  microAppConfig: {
    app_code: string
    app_name: string
    entity_definition: MicroAppEntity
  }
  displayConfig: {
    cardViewFields: string[]
    tableViewFields: string[]
    quickViewFields: string[]
    exportFields: string[]
  }
}

export interface EntityFilterField {
  field: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface EntityListAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  type: 'view' | 'edit' | 'delete' | 'custom'
  variant: 'default' | 'destructive' | 'outline' | 'ghost'
  requiresPermission?: string
  confirmationRequired?: boolean
  customHandler?: (entity: any) => void
}

export interface EntityColumn {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'link' | 'avatar'
  width?: number
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  format?: (value: any) => string
  render?: (value: any, entity: any) => React.ReactNode
}

/**
 * Universal Entity List Registry for advanced listing operations
 */
export class UniversalEntityListRegistry {

  /**
   * Get complete list configuration for an entity type
   */
  static async getEntityListConfig(
    entityType: string,
    appCode: string,
    workspaceContext: WorkspaceEntityContext
  ): Promise<EntityListConfig | null> {
    try {
      console.log(`🎯 Generating list config for ${entityType} from app ${appCode}`)

      // Get app definition and find the entity
      const appDefinition = await microAppClient.getAppDefinition(appCode)
      const entityDefinition = appDefinition?.entities?.find(e => e.entity_type === entityType)

      if (!entityDefinition) {
        console.error(`❌ Entity type ${entityType} not found in app ${appCode}`)
        return null
      }

      // Convert to list configuration
      const config = this.convertMicroAppEntityToListConfig(
        entityDefinition,
        appCode,
        appDefinition.display_name || appCode,
        workspaceContext
      )

      console.log('✅ Generated entity list config:', config.entityLabel)
      return config

    } catch (error) {
      console.error(`❌ Error generating list config:`, error)
      return null
    }
  }

  /**
   * Get all available entity list configurations for workspace
   */
  static async getAvailableEntityListConfigs(
    workspaceContext: WorkspaceEntityContext
  ): Promise<{
    configs: EntityListConfig[]
    appMappings: Record<string, string>
  }> {
    try {
      console.log('🔍 Discovering entity list configs for workspace:', workspaceContext)

      // Get available entity types from UniversalEntityRegistry
      const { entityTypes, appMappings } = await UniversalEntityRegistry.getAvailableEntityTypes(workspaceContext)

      // Convert each entity type to list configuration
      const configs: EntityListConfig[] = []

      for (const entityType of entityTypes) {
        const appCode = appMappings[entityType.entity_type] || 'HERA_DEFAULT'
        
        if (appCode === 'HERA_DEFAULT') {
          // Generate default list config
          const defaultConfig = this.generateDefaultListConfig(entityType, workspaceContext)
          if (defaultConfig) {
            configs.push(defaultConfig)
          }
        } else {
          // Generate micro-app based config
          const config = await this.getEntityListConfig(entityType.entity_type, appCode, workspaceContext)
          if (config) {
            configs.push(config)
          }
        }
      }

      console.log(`✅ Generated ${configs.length} entity list configurations`)
      return { configs, appMappings }

    } catch (error) {
      console.error('❌ Error discovering entity list configs:', error)
      return { configs: [], appMappings: {} }
    }
  }

  /**
   * Convert MicroAppEntity to EntityListConfig
   */
  private static convertMicroAppEntityToListConfig(
    entityDefinition: MicroAppEntity,
    appCode: string,
    appName: string,
    workspaceContext: WorkspaceEntityContext
  ): EntityListConfig {
    // Generate smart code pattern
    const smartCodePattern = `HERA.${appCode.toUpperCase()}.${entityDefinition.entity_type.toUpperCase()}.{VARIANT}.v1`

    // Generate columns from entity fields
    const columns = this.generateColumnsFromFields(entityDefinition.fields)

    // Generate searchable fields
    const searchableFields = this.getSearchableFields(entityDefinition.fields)

    // Generate filterable fields
    const filterableFields = this.getFilterableFields(entityDefinition.fields)

    // Generate sortable fields
    const sortableFields = this.getSortableFields(entityDefinition.fields)

    // Default sort configuration
    const defaultSort = this.getDefaultSort(entityDefinition.fields)

    // Generate standard actions
    const actions = this.generateStandardActions()

    // Display configuration
    const displayConfig = this.generateDisplayConfig(entityDefinition.fields)

    return {
      entityType: entityDefinition.entity_type,
      entityLabel: entityDefinition.display_name,
      entityLabelPlural: entityDefinition.display_name_plural,
      smartCodePattern,
      columns,
      searchableFields,
      filterableFields,
      sortableFields,
      defaultSort,
      actions,
      workspaceContext,
      microAppConfig: {
        app_code: appCode,
        app_name: appName,
        entity_definition: entityDefinition
      },
      displayConfig
    }
  }

  /**
   * Generate default list config for fallback entities
   */
  private static generateDefaultListConfig(
    entityType: MicroAppEntity,
    workspaceContext: WorkspaceEntityContext
  ): EntityListConfig | null {
    try {
      const smartCodePattern = `HERA.DEFAULT.${entityType.entity_type.toUpperCase()}.STANDARD.v1`

      return {
        entityType: entityType.entity_type,
        entityLabel: entityType.display_name,
        entityLabelPlural: entityType.display_name_plural,
        smartCodePattern,
        columns: this.generateColumnsFromFields(entityType.fields),
        searchableFields: this.getSearchableFields(entityType.fields),
        filterableFields: this.getFilterableFields(entityType.fields),
        sortableFields: this.getSortableFields(entityType.fields),
        defaultSort: this.getDefaultSort(entityType.fields),
        actions: this.generateStandardActions(),
        workspaceContext,
        microAppConfig: {
          app_code: 'HERA_DEFAULT',
          app_name: 'HERA Default',
          entity_definition: entityType
        },
        displayConfig: this.generateDisplayConfig(entityType.fields)
      }
    } catch (error) {
      console.error('Error generating default list config:', error)
      return null
    }
  }

  /**
   * Generate table columns from entity fields
   */
  private static generateColumnsFromFields(fields: any[]): ColumnDef<any>[] {
    const columns: ColumnDef<any>[] = []

    // Standard entity name column (always first)
    columns.push({
      accessorKey: 'entity_name',
      header: 'Name',
      cell: ({ row }: any) => {
        const React = require('react')
        const { FileText } = require('lucide-react')
        
        return React.createElement('div', { className: 'flex items-center gap-3' }, [
          React.createElement('div', { 
            key: 'icon',
            className: 'w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center'
          }, React.createElement(FileText, { className: 'w-4 h-4 text-blue-600' })),
          React.createElement('div', { key: 'content' }, [
            React.createElement('div', { 
              key: 'name',
              className: 'font-medium text-slate-900 dark:text-slate-100'
            }, row.original.entity_name),
            React.createElement('div', { 
              key: 'type',
              className: 'text-xs text-slate-500 dark:text-slate-400'
            }, row.original.entity_type?.replace('_', ' ').toUpperCase())
          ])
        ])
      },
      enableSorting: true
    })

    // Generate columns for each field
    fields
      .sort((a, b) => (a.field_order || 0) - (b.field_order || 0))
      .slice(0, 5) // Limit to 5 additional columns for table readability
      .forEach(field => {
        const column = this.generateColumnFromField(field)
        if (column) {
          columns.push(column)
        }
      })

    // Smart code column (always last visible column)
    columns.push({
      accessorKey: 'smart_code',
      header: 'Smart Code',
      cell: ({ row }: any) => {
        const React = require('react')
        const { Badge } = require('@/components/ui/badge')
        
        return React.createElement(Badge, { 
          variant: 'outline', 
          className: 'font-mono text-xs'
        }, row.original.smart_code)
      },
      enableSorting: true
    })

    // Status/Updated column
    columns.push({
      accessorKey: 'updated_at',
      header: 'Last Updated',
      cell: ({ row }: any) => {
        const React = require('react')
        const date = row.original.updated_at ? new Date(row.original.updated_at) : null
        
        return React.createElement('div', { 
          className: 'text-sm text-slate-600 dark:text-slate-400'
        }, date ? date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'N/A')
      },
      enableSorting: true
    })

    return columns
  }

  /**
   * Generate single column from field definition
   */
  private static generateColumnFromField(field: any): ColumnDef<any> | null {
    const fieldName = field.field_name
    const fieldType = field.field_type
    const displayLabel = field.display_label || fieldName

    // Skip internal fields
    if (fieldName.startsWith('_') || fieldName.includes('id') || fieldName === 'entity_name') {
      return null
    }

    const column: ColumnDef<any> = {
      accessorKey: `dynamic_data.${fieldName}`,
      header: displayLabel,
      enableSorting: true
    }

    // Type-specific cell rendering
    switch (fieldType) {
      case 'number':
        column.cell = ({ getValue }) => {
          const React = require('react')
          const value = getValue() as number
          return value != null ? 
            React.createElement('div', { className: 'text-right font-mono' }, 
              typeof value === 'number' ? value.toLocaleString() : value
            ) : React.createElement('span', { className: 'text-slate-400' }, '—')
        }
        break

      case 'boolean':
        column.cell = ({ getValue }) => {
          const React = require('react')
          const { CheckCircle } = require('lucide-react')
          const value = getValue() as boolean
          return React.createElement('div', { className: 'flex items-center' },
            value ? 
              React.createElement(CheckCircle, { className: 'w-4 h-4 text-green-500' }) :
              React.createElement('div', { className: 'w-4 h-4 rounded-full border-2 border-slate-300' })
          )
        }
        break

      case 'date':
        column.cell = ({ getValue }) => {
          const React = require('react')
          const value = getValue() as string
          if (!value) return React.createElement('span', { className: 'text-slate-400' }, '—')
          const date = new Date(value)
          return React.createElement('div', { className: 'text-sm' },
            date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          )
        }
        break

      case 'email':
        column.cell = ({ getValue }) => {
          const React = require('react')
          const { Mail } = require('lucide-react')
          const value = getValue() as string
          return value ? 
            React.createElement('div', { className: 'flex items-center gap-2' }, [
              React.createElement(Mail, { key: 'icon', className: 'w-4 h-4 text-slate-400' }),
              React.createElement('a', { 
                key: 'link',
                href: `mailto:${value}`, 
                className: 'text-blue-600 hover:underline' 
              }, value)
            ]) : React.createElement('span', { className: 'text-slate-400' }, '—')
        }
        break

      case 'phone':
        column.cell = ({ getValue }) => {
          const React = require('react')
          const { Phone } = require('lucide-react')
          const value = getValue() as string
          return value ? 
            React.createElement('div', { className: 'flex items-center gap-2' }, [
              React.createElement(Phone, { key: 'icon', className: 'w-4 h-4 text-slate-400' }),
              React.createElement('span', { key: 'value', className: 'font-mono' }, value)
            ]) : React.createElement('span', { className: 'text-slate-400' }, '—')
        }
        break

      case 'url':
        column.cell = ({ getValue }) => {
          const React = require('react')
          const { Globe } = require('lucide-react')
          const value = getValue() as string
          return value ? 
            React.createElement('div', { className: 'flex items-center gap-2' }, [
              React.createElement(Globe, { key: 'icon', className: 'w-4 h-4 text-slate-400' }),
              React.createElement('a', { 
                key: 'link',
                href: value, 
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'text-blue-600 hover:underline' 
              }, new URL(value).hostname)
            ]) : React.createElement('span', { className: 'text-slate-400' }, '—')
        }
        break

      default:
        column.cell = ({ getValue }) => {
          const React = require('react')
          const value = getValue() as string
          return value ? 
            React.createElement('div', { 
              className: 'max-w-[200px] truncate', 
              title: value 
            }, value) : React.createElement('span', { className: 'text-slate-400' }, '—')
        }
    }

    return column
  }

  /**
   * Get searchable fields from entity definition
   */
  private static getSearchableFields(fields: any[]): string[] {
    const searchableFields = ['entity_name'] // Always include entity name

    fields.forEach(field => {
      if (field.field_type === 'text' || field.field_type === 'email') {
        searchableFields.push(field.field_name)
      }
    })

    return searchableFields
  }

  /**
   * Get filterable fields from entity definition
   */
  private static getFilterableFields(fields: any[]): EntityFilterField[] {
    const filterableFields: EntityFilterField[] = []

    fields.forEach(field => {
      if (field.field_type === 'select' || field.field_type === 'boolean') {
        filterableFields.push({
          field: field.field_name,
          label: field.display_label,
          type: field.field_type,
          icon: this.getFieldIcon(field.field_name),
          placeholder: `Filter by ${field.display_label.toLowerCase()}`
        })
      }
    })

    return filterableFields
  }

  /**
   * Get sortable fields from entity definition
   */
  private static getSortableFields(fields: any[]): string[] {
    const sortableFields = ['entity_name', 'updated_at', 'created_at']

    fields.forEach(field => {
      if (['text', 'number', 'date'].includes(field.field_type)) {
        sortableFields.push(field.field_name)
      }
    })

    return sortableFields
  }

  /**
   * Get default sort configuration
   */
  private static getDefaultSort(fields: any[]): { field: string; order: 'asc' | 'desc' } {
    // Look for a name or title field first
    const nameField = fields.find(f => 
      f.field_name.toLowerCase().includes('name') || 
      f.field_name.toLowerCase().includes('title')
    )

    if (nameField) {
      return { field: nameField.field_name, order: 'asc' }
    }

    // Default to entity_name
    return { field: 'entity_name', order: 'asc' }
  }

  /**
   * Generate standard CRUD actions
   */
  private static generateStandardActions(): EntityListAction[] {
    return [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        type: 'view',
        variant: 'ghost'
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        type: 'edit',
        variant: 'ghost',
        requiresPermission: 'entity.edit'
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        type: 'delete',
        variant: 'destructive',
        requiresPermission: 'entity.delete',
        confirmationRequired: true
      }
    ]
  }

  /**
   * Generate display configuration for different view modes
   */
  private static generateDisplayConfig(fields: any[]): EntityListConfig['displayConfig'] {
    const allFields = fields.map(f => f.field_name)
    
    return {
      cardViewFields: allFields.slice(0, 3), // First 3 fields for card view
      tableViewFields: allFields.slice(0, 6), // First 6 fields for table view
      quickViewFields: allFields.slice(0, 2), // First 2 fields for quick preview
      exportFields: allFields // All fields for export
    }
  }

  /**
   * Get appropriate icon for field
   */
  private static getFieldIcon(fieldName: string): React.ComponentType<{ className?: string }> {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      email: Mail,
      phone: Phone,
      date: Calendar,
      amount: DollarSign,
      price: DollarSign,
      cost: DollarSign,
      count: Hash,
      number: Hash,
      status: Settings
    }

    const lowerFieldName = fieldName.toLowerCase()
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerFieldName.includes(key)) {
        return icon
      }
    }

    return FileText
  }

  /**
   * Get entity list configuration by entity type (with fallback)
   */
  static async getEntityConfigByType(
    entityType: string,
    workspaceContext: WorkspaceEntityContext
  ): Promise<EntityListConfig | null> {
    try {
      // Check if entity type is available in micro-apps
      const { available, appCode } = await UniversalEntityRegistry.isEntityTypeAvailable(
        entityType,
        workspaceContext.organization_id
      )

      if (available && appCode) {
        return this.getEntityListConfig(entityType, appCode, workspaceContext)
      }

      // Fallback to default entity types
      const { entityTypes } = await UniversalEntityRegistry.getAvailableEntityTypes(workspaceContext)
      const defaultEntity = entityTypes.find(e => e.entity_type === entityType)

      if (defaultEntity) {
        return this.generateDefaultListConfig(defaultEntity, workspaceContext)
      }

      return null
    } catch (error) {
      console.error(`Error getting entity config for ${entityType}:`, error)
      return null
    }
  }

  /**
   * Get quick list options for workspace dashboard
   */
  static async getQuickListOptions(
    workspaceContext: WorkspaceEntityContext
  ): Promise<Array<{ entityType: string; label: string; count: number; icon: string }>> {
    try {
      const { configs } = await this.getAvailableEntityListConfigs(workspaceContext)
      
      // Return first 4 entity types for quick access
      return configs.slice(0, 4).map(config => ({
        entityType: config.entityType,
        label: config.entityLabelPlural,
        count: 0, // Will be populated by service layer
        icon: '📋' // Default icon, can be enhanced based on entity type
      }))
    } catch (error) {
      console.error('Error getting quick list options:', error)
      return []
    }
  }
}

export default UniversalEntityListRegistry