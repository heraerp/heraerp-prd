/**
 * ViewMeta Service - Universal UI Metadata Engine
 *
 * This service interprets smart codes and returns UI metadata that describes
 * how to render any entity type without custom code. The metadata is stored
 * in core_dynamic_data and defines widgets, fields, actions, and behaviors.
 */

import { universalApi } from '@/src/lib/universal-api'
import { industryConfigurations } from './industry-configurations'

export interface ViewMetadata {
  id: string
  smart_code: string
  view_type: 'detail' | 'list' | 'form' | 'dashboard' | 'workflow' | 'timeline'
  title: string
  description?: string
  widgets: Widget[]
  actions?: Action[]
  filters?: Filter[]
  sorts?: Sort[]
  permissions?: Permission[]
  theme?: ThemeConfig
}

export interface Widget {
  id: string
  type: 'form' | 'grid' | 'timeline' | 'stats' | 'chart' | 'kanban' | 'tree' | 'related'
  title: string
  smart_code: string
  config: WidgetConfig
  layout?: LayoutConfig
  data_source?: DataSource
  actions?: Action[]
}

export interface WidgetConfig {
  // Form widget config
  fields?: FormField[]
  validation_rules?: ValidationRule[]

  // Grid widget config
  columns?: GridColumn[]
  row_actions?: Action[]
  bulk_actions?: Action[]
  pagination?: PaginationConfig

  // Timeline widget config
  time_field?: string
  event_template?: string

  // Stats widget config
  metric?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  comparison?: 'previous_period' | 'previous_year' | 'budget'

  // Chart widget config
  chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  x_axis?: string
  y_axis?: string
  series?: ChartSeries[]

  // Related widget config
  relationship_type?: string
  related_entity_type?: string
  display_fields?: string[]
}

export interface FormField {
  name: string
  label: string
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'boolean'
    | 'textarea'
    | 'entity_selector'
    | 'smart_code_selector'
    | 'money'
    | 'percentage'
  required?: boolean
  default_value?: any
  placeholder?: string
  help_text?: string
  options?: SelectOption[]
  entity_type?: string // For entity_selector
  smart_code_pattern?: string // For smart_code_selector
  validation?: ValidationRule[]
  conditional_display?: ConditionalRule
  layout?: {
    col_span?: number
    section?: string
  }
}

export interface GridColumn {
  field: string
  header: string
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'boolean'
    | 'money'
    | 'percentage'
    | 'status'
    | 'entity_link'
    | 'actions'
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: string
  aggregation?: 'sum' | 'avg' | 'count'
  renderer?: 'default' | 'status_badge' | 'progress_bar' | 'sparkline'
}

export interface Action {
  id: string
  label: string
  icon?: string
  type: 'create' | 'edit' | 'delete' | 'workflow' | 'custom' | 'navigate'
  smart_code: string
  confirmation?: {
    title: string
    message: string
    type: 'warning' | 'danger' | 'info'
  }
  navigation?: {
    target: string
    params?: Record<string, string>
  }
  api_endpoint?: string
  success_message?: string
  refresh_after?: boolean
  conditional_display?: ConditionalRule
}

export interface DataSource {
  type: 'entities' | 'transactions' | 'relationships' | 'dynamic_data' | 'aggregate' | 'calculated'
  table?: string
  entity_type?: string
  filters?: DataFilter[]
  joins?: DataJoin[]
  aggregations?: DataAggregation[]
  calculations?: DataCalculation[]
}

export interface ConditionalRule {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logic?: 'and' | 'or'
  rules?: ConditionalRule[]
}

// Additional interfaces
interface SelectOption {
  value: string
  label: string
  icon?: string
}

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  custom_function?: string
}

interface Filter {
  field: string
  label: string
  type: 'text' | 'select' | 'date_range' | 'number_range'
  options?: SelectOption[]
}

interface Sort {
  field: string
  label: string
  direction: 'asc' | 'desc'
}

interface Permission {
  action: string
  role?: string
  condition?: ConditionalRule
}

interface ThemeConfig {
  primary_color?: string
  layout?: 'sidebar' | 'top_nav' | 'minimal'
  density?: 'compact' | 'normal' | 'spacious'
}

interface LayoutConfig {
  position?: { row: number; col: number }
  size?: { width: number; height: number }
  responsive?: {
    mobile?: { hidden?: boolean; full_width?: boolean }
    tablet?: { width?: number }
  }
}

interface PaginationConfig {
  page_size: number
  page_size_options: number[]
}

interface ChartSeries {
  name: string
  data_field: string
  color?: string
}

interface DataFilter {
  field: string
  operator: string
  value: any
}

interface DataJoin {
  table: string
  on: string
  type?: 'inner' | 'left' | 'right'
}

interface DataAggregation {
  field: string
  function: 'sum' | 'avg' | 'count' | 'min' | 'max'
  alias: string
}

interface DataCalculation {
  alias: string
  formula: string
}

export class ViewMetaService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Get view metadata for a smart code
   */
  async getViewMeta(smartCode: string, viewType: string = 'detail'): Promise<ViewMetadata | null> {
    try {
      // First, check if there's custom metadata for this specific smart code
      const customMetaResult = await universalApi.query('core_dynamic_data', {
        field_name: 'view_metadata',
        'field_value_json->>smart_code': smartCode,
        'field_value_json->>view_type': viewType
      })

      if (customMetaResult.data && customMetaResult.data.length > 0) {
        return customMetaResult.data[0].field_value_json as ViewMetadata
      }

      // If no custom metadata, generate based on smart code patterns
      return this.generateViewMeta(smartCode, viewType)
    } catch (error) {
      console.error('Failed to get view metadata:', error)
      return null
    }
  }

  /**
   * Generate view metadata based on smart code patterns
   */
  private generateViewMeta(smartCode: string, viewType: string): ViewMetadata {
    // Parse smart code to understand entity type and context
    const parts = smartCode.split('.')
    const industry = parts[1] // e.g., FURN for furniture, HLTH for healthcare
    const module = parts[2] // e.g., BOM for bill of materials, PAT for patient
    const entityType = parts[3] // e.g., ITEM for item/product, ENT for entity

    // Check if this is an industry-specific configuration
    const industryKey = this.getIndustryKey(industry)
    if (industryKey && industryConfigurations[industryKey]) {
      const viewKey = this.getViewKey(module, entityType, viewType)
      const industryConfig = industryConfigurations[industryKey][viewKey]
      if (industryConfig) {
        return industryConfig
      }
    }

    // Generate metadata based on patterns
    if (module === 'BOM') {
      return this.generateBOMViewMeta(smartCode, viewType, entityType)
    }

    // Default metadata generation
    return this.generateDefaultViewMeta(smartCode, viewType)
  }

  /**
   * Map industry code to configuration key
   */
  private getIndustryKey(industry: string): string | null {
    const industryMap: Record<string, string> = {
      HLTH: 'healthcare',
      REST: 'restaurant',
      PROF: 'professionalServices',
      RET: 'retail',
      FURN: 'furniture'
    }
    return industryMap[industry] || null
  }

  /**
   * Map module/entity/view to configuration view key
   */
  private getViewKey(module: string, entityType: string, viewType: string): string {
    // Common patterns
    if (module === 'PAT' && viewType === 'detail') return 'patientDetail'
    if (module === 'PAT' && viewType === 'list') return 'patientList'
    if (module === 'POS' && viewType === 'form') return 'orderEntry'
    if (module === 'KDS' && viewType === 'dashboard') return 'kitchenDisplay'
    if (module === 'TIME' && viewType === 'form') return 'timeEntry'
    if (module === 'PROJ' && viewType === 'dashboard') return 'projectDashboard'
    if (module === 'INV' && viewType === 'detail') return 'inventoryManagement'
    if (module === 'SALES' && viewType === 'dashboard') return 'salesDashboard'

    // Default key format
    return `${module.toLowerCase()}${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`
  }

  /**
   * Generate BOM-specific view metadata
   */
  private generateBOMViewMeta(
    smartCode: string,
    viewType: string,
    entityType: string
  ): ViewMetadata {
    if (viewType === 'detail' && entityType === 'ITEM') {
      return {
        id: `${smartCode}-detail-view`,
        smart_code: smartCode,
        view_type: 'detail',
        title: 'Bill of Materials',
        description: 'Manage product structure and components',
        widgets: [
          // Header stats widget
          {
            id: 'bom-stats',
            type: 'stats',
            title: 'BOM Overview',
            smart_code: 'HERA.FURN.BOM.STATS.OVERVIEW.v1',
            config: {
              metric: 'total_cost',
              aggregation: 'sum'
            },
            layout: {
              position: { row: 0, col: 0 },
              size: { width: 12, height: 1 }
            },
            data_source: {
              type: 'calculated',
              calculations: [
                { alias: 'total_cost', formula: 'sum(unit_cost * quantity)' },
                { alias: 'component_count', formula: 'count(distinct component_id)' },
                { alias: 'lead_time', formula: 'max(component_lead_time)' },
                { alias: 'revision', formula: 'current_revision' }
              ]
            }
          },

          // Main form widget
          {
            id: 'bom-form',
            type: 'form',
            title: 'Product Information',
            smart_code: 'HERA.FURN.BOM.FORM.PRODUCT.v1',
            config: {
              fields: [
                {
                  name: 'entity_name',
                  label: 'Product Name',
                  type: 'text',
                  required: true,
                  layout: { col_span: 6 }
                },
                {
                  name: 'entity_code',
                  label: 'SKU/Part Number',
                  type: 'text',
                  required: true,
                  layout: { col_span: 3 }
                },
                {
                  name: 'revision',
                  label: 'Revision',
                  type: 'text',
                  default_value: 'A',
                  layout: { col_span: 3 }
                },
                {
                  name: 'description',
                  label: 'Description',
                  type: 'textarea',
                  layout: { col_span: 12 }
                },
                {
                  name: 'unit_cost',
                  label: 'Unit Cost',
                  type: 'money',
                  required: true,
                  layout: { col_span: 4 }
                },
                {
                  name: 'lead_time_days',
                  label: 'Lead Time (Days)',
                  type: 'number',
                  layout: { col_span: 4 }
                },
                {
                  name: 'minimum_order_quantity',
                  label: 'MOQ',
                  type: 'number',
                  layout: { col_span: 4 }
                }
              ]
            },
            layout: {
              position: { row: 1, col: 0 },
              size: { width: 12, height: 2 }
            }
          },

          // Components grid widget
          {
            id: 'bom-components',
            type: 'grid',
            title: 'Components',
            smart_code: 'HERA.FURN.BOM.GRID.COMPONENTS.v1',
            config: {
              columns: [
                {
                  field: 'entity_name',
                  header: 'Component',
                  type: 'entity_link',
                  sortable: true,
                  filterable: true
                },
                {
                  field: 'entity_code',
                  header: 'Part Number',
                  type: 'text',
                  sortable: true
                },
                {
                  field: 'quantity',
                  header: 'Quantity',
                  type: 'number',
                  sortable: true
                },
                {
                  field: 'unit_of_measure',
                  header: 'UOM',
                  type: 'text'
                },
                {
                  field: 'unit_cost',
                  header: 'Unit Cost',
                  type: 'money',
                  sortable: true
                },
                {
                  field: 'extended_cost',
                  header: 'Total Cost',
                  type: 'money',
                  sortable: true,
                  aggregation: 'sum'
                },
                {
                  field: 'lead_time_days',
                  header: 'Lead Time',
                  type: 'number'
                },
                {
                  field: 'supplier_name',
                  header: 'Supplier',
                  type: 'entity_link'
                }
              ],
              row_actions: [
                {
                  id: 'edit-component',
                  label: 'Edit',
                  icon: 'edit',
                  type: 'edit',
                  smart_code: 'HERA.FURN.BOM.ACTION.EDIT_COMPONENT.v1'
                },
                {
                  id: 'remove-component',
                  label: 'Remove',
                  icon: 'trash',
                  type: 'delete',
                  smart_code: 'HERA.FURN.BOM.ACTION.REMOVE_COMPONENT.v1',
                  confirmation: {
                    title: 'Remove Component',
                    message: 'Are you sure you want to remove this component?',
                    type: 'warning'
                  }
                }
              ],
              bulk_actions: [
                {
                  id: 'add-component',
                  label: 'Add Component',
                  icon: 'plus',
                  type: 'create',
                  smart_code: 'HERA.FURN.BOM.ACTION.ADD_COMPONENT.v1'
                }
              ]
            },
            layout: {
              position: { row: 3, col: 0 },
              size: { width: 8, height: 4 }
            },
            data_source: {
              type: 'relationships',
              filters: [
                {
                  field: 'relationship_type',
                  operator: 'equals',
                  value: 'has_component'
                }
              ]
            }
          },

          // Cost breakdown chart
          {
            id: 'cost-breakdown',
            type: 'chart',
            title: 'Cost Breakdown',
            smart_code: 'HERA.FURN.BOM.CHART.COST_BREAKDOWN.v1',
            config: {
              chart_type: 'pie',
              series: [
                {
                  name: 'Material Cost',
                  data_field: 'material_cost',
                  color: '#3B82F6'
                },
                {
                  name: 'Labor Cost',
                  data_field: 'labor_cost',
                  color: '#10B981'
                },
                {
                  name: 'Overhead',
                  data_field: 'overhead_cost',
                  color: '#F59E0B'
                }
              ]
            },
            layout: {
              position: { row: 3, col: 8 },
              size: { width: 4, height: 4 }
            }
          },

          // Timeline widget
          {
            id: 'bom-timeline',
            type: 'timeline',
            title: 'Revision History',
            smart_code: 'HERA.FURN.BOM.TIMELINE.REVISIONS.v1',
            config: {
              time_field: 'created_at',
              event_template: '{{user_name}} {{action}} - {{description}}'
            },
            layout: {
              position: { row: 7, col: 0 },
              size: { width: 12, height: 2 }
            },
            data_source: {
              type: 'transactions',
              filters: [
                {
                  field: 'transaction_type',
                  operator: 'equals',
                  value: 'bom_revision'
                }
              ]
            }
          }
        ],
        actions: [
          {
            id: 'save-bom',
            label: 'Save',
            icon: 'save',
            type: 'custom',
            smart_code: 'HERA.FURN.BOM.ACTION.SAVE.v1',
            api_endpoint: '/api/v1/universal',
            success_message: 'BOM saved successfully',
            refresh_after: true
          },
          {
            id: 'release-bom',
            label: 'Release',
            icon: 'check-circle',
            type: 'workflow',
            smart_code: 'HERA.FURN.BOM.ACTION.RELEASE.v1',
            confirmation: {
              title: 'Release BOM',
              message: 'Releasing will lock this BOM for production. Continue?',
              type: 'warning'
            }
          },
          {
            id: 'copy-bom',
            label: 'Copy',
            icon: 'copy',
            type: 'custom',
            smart_code: 'HERA.FURN.BOM.ACTION.COPY.v1'
          },
          {
            id: 'export-bom',
            label: 'Export',
            icon: 'download',
            type: 'custom',
            smart_code: 'HERA.FURN.BOM.ACTION.EXPORT.v1'
          }
        ]
      }
    }

    if (viewType === 'list') {
      return this.generateBOMListViewMeta(smartCode)
    }

    if (viewType === 'dashboard') {
      return this.generateBOMDashboardMeta(smartCode)
    }

    return this.generateDefaultViewMeta(smartCode, viewType)
  }

  /**
   * Generate BOM list view metadata
   */
  private generateBOMListViewMeta(smartCode: string): ViewMetadata {
    return {
      id: `${smartCode}-list-view`,
      smart_code: smartCode,
      view_type: 'list',
      title: 'Bills of Materials',
      widgets: [
        {
          id: 'bom-list',
          type: 'grid',
          title: 'Products',
          smart_code: 'HERA.FURN.BOM.GRID.PRODUCTS.v1',
          config: {
            columns: [
              {
                field: 'entity_name',
                header: 'Product Name',
                type: 'entity_link',
                sortable: true,
                filterable: true
              },
              {
                field: 'entity_code',
                header: 'SKU',
                type: 'text',
                sortable: true,
                filterable: true
              },
              {
                field: 'revision',
                header: 'Rev',
                type: 'text',
                width: '60px'
              },
              {
                field: 'status',
                header: 'Status',
                type: 'status',
                renderer: 'status_badge',
                filterable: true
              },
              {
                field: 'component_count',
                header: 'Components',
                type: 'number',
                align: 'center'
              },
              {
                field: 'total_cost',
                header: 'Total Cost',
                type: 'money',
                sortable: true
              },
              {
                field: 'last_modified',
                header: 'Last Modified',
                type: 'date',
                sortable: true
              }
            ],
            row_actions: [
              {
                id: 'view-bom',
                label: 'View',
                icon: 'eye',
                type: 'navigate',
                smart_code: 'HERA.FURN.BOM.ACTION.VIEW.v1',
                navigation: {
                  target: '/bom/{{id}}'
                }
              },
              {
                id: 'edit-bom',
                label: 'Edit',
                icon: 'edit',
                type: 'navigate',
                smart_code: 'HERA.FURN.BOM.ACTION.EDIT.v1',
                navigation: {
                  target: '/bom/{{id}}/edit'
                }
              }
            ],
            bulk_actions: [
              {
                id: 'create-bom',
                label: 'Create New BOM',
                icon: 'plus',
                type: 'navigate',
                smart_code: 'HERA.FURN.BOM.ACTION.CREATE.v1',
                navigation: {
                  target: '/bom/new'
                }
              }
            ],
            pagination: {
              page_size: 25,
              page_size_options: [10, 25, 50, 100]
            }
          },
          data_source: {
            type: 'entities',
            entity_type: 'product',
            filters: [
              {
                field: 'has_bom',
                operator: 'equals',
                value: true
              }
            ]
          }
        }
      ],
      filters: [
        {
          field: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'in_review', label: 'In Review' },
            { value: 'released', label: 'Released' },
            { value: 'superseded', label: 'Superseded' },
            { value: 'archived', label: 'Archived' }
          ]
        },
        {
          field: 'category',
          label: 'Category',
          type: 'select',
          options: [
            { value: 'chair', label: 'Chairs' },
            { value: 'table', label: 'Tables' },
            { value: 'cabinet', label: 'Cabinets' },
            { value: 'desk', label: 'Desks' }
          ]
        }
      ]
    }
  }

  /**
   * Generate BOM dashboard metadata
   */
  private generateBOMDashboardMeta(smartCode: string): ViewMetadata {
    return {
      id: `${smartCode}-dashboard-view`,
      smart_code: smartCode,
      view_type: 'dashboard',
      title: 'BOM Analytics',
      widgets: [
        // KPI stats row
        {
          id: 'kpi-stats',
          type: 'stats',
          title: 'Key Metrics',
          smart_code: 'HERA.FURN.BOM.STATS.KPI.v1',
          layout: {
            position: { row: 0, col: 0 },
            size: { width: 12, height: 1 }
          },
          config: {},
          data_source: {
            type: 'aggregate',
            aggregations: [
              { field: 'id', function: 'count', alias: 'total_boms' },
              { field: 'total_cost', function: 'avg', alias: 'avg_cost' },
              { field: 'component_count', function: 'avg', alias: 'avg_components' },
              { field: 'revision_count', function: 'sum', alias: 'total_revisions' }
            ]
          }
        },

        // Cost trend chart
        {
          id: 'cost-trend',
          type: 'chart',
          title: 'Cost Trends',
          smart_code: 'HERA.FURN.BOM.CHART.COST_TREND.v1',
          config: {
            chart_type: 'line',
            x_axis: 'month',
            y_axis: 'average_cost',
            series: [
              {
                name: 'Average Cost',
                data_field: 'avg_cost'
              },
              {
                name: 'Material Cost',
                data_field: 'avg_material_cost'
              }
            ]
          },
          layout: {
            position: { row: 1, col: 0 },
            size: { width: 8, height: 3 }
          }
        },

        // Top products by cost
        {
          id: 'top-products',
          type: 'grid',
          title: 'Top Products by Cost',
          smart_code: 'HERA.FURN.BOM.GRID.TOP_COST.v1',
          config: {
            columns: [
              {
                field: 'entity_name',
                header: 'Product',
                type: 'entity_link'
              },
              {
                field: 'total_cost',
                header: 'Total Cost',
                type: 'money'
              },
              {
                field: 'cost_variance',
                header: 'Variance %',
                type: 'percentage',
                renderer: 'progress_bar'
              }
            ]
          },
          layout: {
            position: { row: 1, col: 8 },
            size: { width: 4, height: 3 }
          },
          data_source: {
            type: 'entities',
            entity_type: 'product',
            filters: [
              {
                field: 'has_bom',
                operator: 'equals',
                value: true
              }
            ]
          }
        }
      ]
    }
  }

  /**
   * Generate default view metadata for any entity
   */
  private generateDefaultViewMeta(smartCode: string, viewType: string): ViewMetadata {
    return {
      id: `${smartCode}-${viewType}-view`,
      smart_code: smartCode,
      view_type: viewType as any,
      title: 'Universal View',
      widgets: [
        {
          id: 'default-widget',
          type: viewType === 'list' ? 'grid' : 'form',
          title: 'Data',
          smart_code: smartCode,
          config:
            viewType === 'list'
              ? {
                  columns: [
                    { field: 'entity_name', header: 'Name', type: 'text' },
                    { field: 'entity_code', header: 'Code', type: 'text' },
                    { field: 'created_at', header: 'Created', type: 'date' }
                  ]
                }
              : {
                  fields: [
                    { name: 'entity_name', label: 'Name', type: 'text', required: true },
                    { name: 'entity_code', label: 'Code', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' }
                  ]
                }
        }
      ]
    }
  }

  /**
   * Save custom view metadata
   */
  async saveViewMeta(metadata: ViewMetadata): Promise<boolean> {
    try {
      const result = await universalApi.createEntity({
        organization_id: this.organizationId,
        entity_type: 'view_metadata',
        entity_name: metadata.title,
        entity_code: `VIEW_${metadata.smart_code}`,
        smart_code: 'HERA.UI.VIEW.METADATA.v1'
      })

      if (result.success && result.data) {
        // Store the actual metadata in dynamic data
        await universalApi.query('core_dynamic_data', {
          organization_id: this.organizationId,
          entity_id: result.data.id,
          field_name: 'view_metadata',
          field_value_json: metadata,
          smart_code: 'HERA.UI.VIEW.CONFIG.v1'
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Failed to save view metadata:', error)
      return false
    }
  }
}
