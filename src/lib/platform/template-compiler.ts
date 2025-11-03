/**
 * HERA v3.0 Template Compiler
 * Converts JSON template packs into React components and TypeScript types
 */

import React from 'react'
import { 
  type EntityTemplate, 
  type DynamicFieldConfig,
  type FormViewConfig,
  type ListViewConfig 
} from './template-registry'
import { type IndustryType } from './constants'

export interface CompiledTemplate {
  templateId: string
  entityType: string
  formComponent: React.ComponentType<FormComponentProps>
  listComponent: React.ComponentType<ListComponentProps>
  cardComponent: React.ComponentType<CardComponentProps>
  typeDefinition: string
  validationSchema: Record<string, any>
}

export interface FormComponentProps {
  entityId?: string
  initialData?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void
  onCancel: () => void
  mode: 'create' | 'edit' | 'view'
  organizationId: string
}

export interface ListComponentProps {
  data: any[]
  onRowClick: (entityId: string) => void
  onEdit: (entityId: string) => void
  onDelete: (entityId: string) => void
  loading?: boolean
  organizationId: string
}

export interface CardComponentProps {
  entity: any
  onClick: (entityId: string) => void
  onEdit: (entityId: string) => void
  compact?: boolean
}

/**
 * Template Compiler Class
 */
export class TemplateCompiler {
  private compiledCache = new Map<string, CompiledTemplate>()

  /**
   * Compile entity template into React components
   */
  async compileEntityTemplate(
    template: EntityTemplate,
    industry: IndustryType
  ): Promise<CompiledTemplate> {
    const cacheKey = `${industry}_${template.template_id}`
    
    // Check cache first
    if (this.compiledCache.has(cacheKey)) {
      return this.compiledCache.get(cacheKey)!
    }

    try {
      // Generate TypeScript type definition
      const typeDefinition = this.generateTypeDefinition(template)
      
      // Generate validation schema
      const validationSchema = this.generateValidationSchema(template)
      
      // Compile form component
      const formComponent = this.compileFormComponent(template)
      
      // Compile list component
      const listComponent = this.compileListComponent(template)
      
      // Compile card component
      const cardComponent = this.compileCardComponent(template)

      const compiled: CompiledTemplate = {
        templateId: template.template_id,
        entityType: template.entity_type,
        formComponent,
        listComponent,
        cardComponent,
        typeDefinition,
        validationSchema
      }

      // Cache the result
      this.compiledCache.set(cacheKey, compiled)
      
      console.log(`✅ Compiled template: ${template.template_id}`)
      return compiled
      
    } catch (error) {
      console.error(`❌ Failed to compile template ${template.template_id}:`, error)
      throw error
    }
  }

  /**
   * Generate TypeScript type definition from template
   */
  private generateTypeDefinition(template: EntityTemplate): string {
    const fields: string[] = []
    
    // Add standard fields
    Object.entries(template.standard_fields).forEach(([fieldName, config]) => {
      const type = this.getTypeScriptType(fieldName, config.required)
      fields.push(`  ${fieldName}: ${type}`)
    })
    
    // Add dynamic fields
    template.dynamic_fields.forEach(field => {
      const type = this.getTypeScriptTypeFromField(field)
      const optional = field.required ? '' : '?'
      fields.push(`  ${field.field_name}${optional}: ${type}`)
    })

    return `export interface ${this.toPascalCase(template.entity_type)} {
${fields.join('\n')}
  
  // System fields
  id: string
  organization_id: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}`
  }

  /**
   * Generate validation schema from template
   */
  private generateValidationSchema(template: EntityTemplate): Record<string, any> {
    const schema: Record<string, any> = {}
    
    // Standard fields validation
    Object.entries(template.standard_fields).forEach(([fieldName, config]) => {
      schema[fieldName] = {
        required: config.required,
        ...config.validation
      }
    })
    
    // Dynamic fields validation
    template.dynamic_fields.forEach(field => {
      schema[field.field_name] = {
        required: field.required || false,
        type: field.field_type,
        ...field.validation_rules
      }
    })
    
    return schema
  }

  /**
   * Compile form component from template
   */
  private compileFormComponent(template: EntityTemplate): React.ComponentType<FormComponentProps> {
    const FormComponent: React.FC<FormComponentProps> = (props) => {
      return React.createElement('div', {
        className: 'template-form-container',
        'data-template-id': template.template_id
      }, [
        React.createElement('div', {
          key: 'form-header',
          className: 'form-header'
        }, [
          React.createElement('h2', { key: 'title' }, template.template_name),
          React.createElement('p', { 
            key: 'description',
            className: 'text-gray-600' 
          }, template.description)
        ]),
        React.createElement('div', {
          key: 'form-tabs',
          className: 'form-tabs-container'
        }, this.renderFormTabs(template.ui_config.form_view, props)),
        React.createElement('div', {
          key: 'form-actions',
          className: 'form-actions flex gap-2 mt-6'
        }, [
          React.createElement('button', {
            key: 'submit',
            type: 'submit',
            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
            onClick: () => props.onSubmit({}) // TODO: Collect form data
          }, 'Save'),
          React.createElement('button', {
            key: 'cancel',
            type: 'button',
            className: 'px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50',
            onClick: props.onCancel
          }, 'Cancel')
        ])
      ])
    }

    FormComponent.displayName = `${template.template_id}_Form`
    return FormComponent
  }

  /**
   * Compile list component from template
   */
  private compileListComponent(template: EntityTemplate): React.ComponentType<ListComponentProps> {
    const ListComponent: React.FC<ListComponentProps> = (props) => {
      return React.createElement('div', {
        className: 'template-list-container',
        'data-template-id': template.template_id
      }, [
        React.createElement('div', {
          key: 'list-header',
          className: 'list-header flex justify-between items-center mb-4'
        }, [
          React.createElement('h2', { key: 'title' }, `${template.template_name} List`),
          React.createElement('button', {
            key: 'add-new',
            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          }, `Add ${template.template_name}`)
        ]),
        React.createElement('div', {
          key: 'list-table',
          className: 'list-table-container'
        }, this.renderDataTable(template.ui_config.list_view, props))
      ])
    }

    ListComponent.displayName = `${template.template_id}_List`
    return ListComponent
  }

  /**
   * Compile card component from template
   */
  private compileCardComponent(template: EntityTemplate): React.ComponentType<CardComponentProps> {
    const CardComponent: React.FC<CardComponentProps> = (props) => {
      return React.createElement('div', {
        className: `template-card-container border rounded-lg p-4 hover:shadow-md cursor-pointer ${props.compact ? 'compact' : ''}`,
        'data-template-id': template.template_id,
        onClick: () => props.onClick(props.entity.id)
      }, [
        React.createElement('div', {
          key: 'card-header',
          className: 'card-header flex justify-between items-start mb-2'
        }, [
          React.createElement('h3', {
            key: 'title',
            className: 'font-semibold'
          }, props.entity.entity_name || 'Untitled'),
          React.createElement('button', {
            key: 'edit',
            className: 'text-gray-500 hover:text-gray-700',
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation()
              props.onEdit(props.entity.id)
            }
          }, '✏️')
        ]),
        React.createElement('div', {
          key: 'card-fields',
          className: 'card-fields space-y-1'
        }, this.renderCardFields(template.ui_config.card_view, props.entity))
      ])
    }

    CardComponent.displayName = `${template.template_id}_Card`
    return CardComponent
  }

  /**
   * Render form tabs from template configuration
   */
  private renderFormTabs(formConfig: FormViewConfig, props: FormComponentProps): React.ReactElement[] {
    return formConfig.tabs.map((tab, index) => 
      React.createElement('div', {
        key: tab.id,
        className: 'form-tab',
        'data-tab-id': tab.id
      }, [
        React.createElement('h3', {
          key: 'tab-title',
          className: 'text-lg font-medium mb-4'
        }, tab.label),
        React.createElement('div', {
          key: 'tab-fields',
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
        }, tab.fields.map(fieldName => 
          React.createElement('div', {
            key: fieldName,
            className: 'field-container'
          }, [
            React.createElement('label', {
              key: 'label',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, fieldName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())),
            React.createElement('input', {
              key: 'input',
              type: 'text',
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              placeholder: `Enter ${fieldName}`
            })
          ])
        ))
      ])
    )
  }

  /**
   * Render data table from list configuration
   */
  private renderDataTable(listConfig: ListViewConfig, props: ListComponentProps): React.ReactElement {
    return React.createElement('div', {
      className: 'overflow-x-auto'
    }, [
      React.createElement('table', {
        key: 'table',
        className: 'min-w-full divide-y divide-gray-200'
      }, [
        React.createElement('thead', {
          key: 'thead',
          className: 'bg-gray-50'
        }, [
          React.createElement('tr', {
            key: 'header-row'
          }, listConfig.columns.map(column =>
            React.createElement('th', {
              key: column.field,
              className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            }, column.label)
          ))
        ]),
        React.createElement('tbody', {
          key: 'tbody',
          className: 'bg-white divide-y divide-gray-200'
        }, props.data.map((row, index) =>
          React.createElement('tr', {
            key: row.id || index,
            className: 'hover:bg-gray-50 cursor-pointer',
            onClick: () => props.onRowClick(row.id)
          }, listConfig.columns.map(column =>
            React.createElement('td', {
              key: column.field,
              className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'
            }, row[column.field] || '-')
          ))
        ))
      ])
    ])
  }

  /**
   * Render card fields from card configuration
   */
  private renderCardFields(cardConfig: CardViewConfig, entity: any): React.ReactElement[] {
    return cardConfig.mobile_fields.map(fieldName =>
      React.createElement('div', {
        key: fieldName,
        className: 'text-sm text-gray-600'
      }, `${fieldName.replace('_', ' ')}: ${entity[fieldName] || '-'}`)
    )
  }

  /**
   * Get TypeScript type for standard fields
   */
  private getTypeScriptType(fieldName: string, required: boolean): string {
    const baseType = fieldName.includes('id') ? 'string' :
                    fieldName.includes('email') ? 'string' :
                    fieldName.includes('phone') ? 'string' :
                    fieldName.includes('date') ? 'string' :
                    fieldName.includes('count') ? 'number' :
                    fieldName.includes('amount') ? 'number' :
                    'string'
    
    return required ? baseType : `${baseType} | null`
  }

  /**
   * Get TypeScript type from dynamic field configuration
   */
  private getTypeScriptTypeFromField(field: DynamicFieldConfig): string {
    const typeMap: Record<string, string> = {
      text: 'string',
      number: 'number',
      email: 'string',
      phone: 'string',
      date: 'string',
      boolean: 'boolean',
      json: 'Record<string, any>'
    }
    
    const baseType = typeMap[field.field_type] || 'string'
    return field.required ? baseType : `${baseType} | null`
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/_(.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, char => char.toUpperCase())
  }

  /**
   * Clear compilation cache
   */
  clearCache(): void {
    this.compiledCache.clear()
    console.log('✅ Template compilation cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.compiledCache.size,
      keys: Array.from(this.compiledCache.keys())
    }
  }
}

/**
 * Singleton instance
 */
export const templateCompiler = new TemplateCompiler()