/**
 * Universal UI Patterns - Common configurations that work across ALL industries
 *
 * This file demonstrates the true universality of HERA's UI system.
 * The SAME patterns work for healthcare, restaurant, retail, manufacturing, etc.
 * Only the metadata configuration changes - the components remain identical.
 */

import { FormField, GridColumn, Action, Widget, ViewMetadata } from './view-meta-service'

/**
 * Universal Form Field Patterns
 * These field configurations can be reused across any industry
 */
export const universalFormPatterns = {
  // Entity identification fields - work for ANY entity
  entityFields: {
    name: {
      name: 'entity_name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      layout: { col_span: 6 }
    },
    code: {
      name: 'entity_code',
      label: 'Code',
      type: 'text' as const,
      required: true,
      layout: { col_span: 3 }
    },
    description: {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      layout: { col_span: 12 }
    }
  },

  // Date/time fields - universal across all transactions
  dateTimeFields: {
    date: {
      name: 'transaction_date',
      label: 'Date',
      type: 'date' as const,
      required: true,
      default_value: 'today',
      layout: { col_span: 3 }
    },
    dateRange: {
      start: {
        name: 'start_date',
        label: 'Start Date',
        type: 'date' as const,
        required: true,
        layout: { col_span: 3 }
      },
      end: {
        name: 'end_date',
        label: 'End Date',
        type: 'date' as const,
        required: true,
        layout: { col_span: 3 }
      }
    }
  },

  // Money/amount fields - work for any financial transaction
  moneyFields: {
    amount: {
      name: 'total_amount',
      label: 'Amount',
      type: 'money' as const,
      required: true,
      layout: { col_span: 3 }
    },
    unitPrice: {
      name: 'unit_price',
      label: 'Unit Price',
      type: 'money' as const,
      layout: { col_span: 3 }
    },
    quantity: {
      name: 'quantity',
      label: 'Quantity',
      type: 'number' as const,
      required: true,
      layout: { col_span: 2 }
    }
  },

  // Selection fields - entity relationships
  relationshipFields: {
    customer: {
      name: 'customer_id',
      label: 'Customer',
      type: 'entity_selector' as const,
      entity_type: 'customer',
      required: true,
      layout: { col_span: 6 }
    },
    vendor: {
      name: 'vendor_id',
      label: 'Vendor',
      type: 'entity_selector' as const,
      entity_type: 'vendor',
      required: true,
      layout: { col_span: 6 }
    },
    employee: {
      name: 'employee_id',
      label: 'Employee',
      type: 'entity_selector' as const,
      entity_type: 'employee',
      required: true,
      layout: { col_span: 6 }
    }
  },

  // Status and workflow fields
  statusFields: {
    status: {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      layout: { col_span: 3 }
    },
    priority: {
      name: 'priority',
      label: 'Priority',
      type: 'select' as const,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ],
      layout: { col_span: 3 }
    }
  }
}

/**
 * Universal Grid Column Patterns
 * These column configurations work across all entity types
 */
export const universalGridPatterns = {
  // Entity columns - work for any entity listing
  entityColumns: {
    name: {
      field: 'entity_name',
      header: 'Name',
      type: 'entity_link' as const,
      sortable: true,
      filterable: true
    },
    code: {
      field: 'entity_code',
      header: 'Code',
      type: 'text' as const,
      sortable: true,
      filterable: true
    },
    type: {
      field: 'entity_type',
      header: 'Type',
      type: 'text' as const,
      filterable: true
    }
  },

  // Date columns - universal time tracking
  dateColumns: {
    created: {
      field: 'created_at',
      header: 'Created',
      type: 'date' as const,
      sortable: true
    },
    modified: {
      field: 'updated_at',
      header: 'Modified',
      type: 'date' as const,
      sortable: true
    },
    transactionDate: {
      field: 'transaction_date',
      header: 'Date',
      type: 'date' as const,
      sortable: true
    }
  },

  // Amount columns - financial data
  amountColumns: {
    total: {
      field: 'total_amount',
      header: 'Total',
      type: 'money' as const,
      sortable: true,
      aggregation: 'sum' as const
    },
    unitPrice: {
      field: 'unit_price',
      header: 'Unit Price',
      type: 'money' as const,
      sortable: true
    },
    quantity: {
      field: 'quantity',
      header: 'Quantity',
      type: 'number' as const,
      sortable: true,
      aggregation: 'sum' as const
    }
  },

  // Status columns - workflow states
  statusColumns: {
    status: {
      field: 'status',
      header: 'Status',
      type: 'status' as const,
      renderer: 'status_badge' as const,
      filterable: true
    },
    progress: {
      field: 'progress_percent',
      header: 'Progress',
      type: 'percentage' as const,
      renderer: 'progress_bar' as const,
      sortable: true
    }
  }
}

/**
 * Universal Action Patterns
 * These actions apply to any entity type
 */
export const universalActionPatterns = {
  // CRUD actions - work for any entity
  crud: {
    create: {
      id: 'create',
      label: 'Create New',
      type: 'create' as const,
      icon: 'plus',
      smart_code: 'HERA.UI.ACTION.CREATE.v1'
    },
    edit: {
      id: 'edit',
      label: 'Edit',
      type: 'edit' as const,
      icon: 'edit',
      smart_code: 'HERA.UI.ACTION.EDIT.v1'
    },
    delete: {
      id: 'delete',
      label: 'Delete',
      type: 'delete' as const,
      icon: 'trash',
      smart_code: 'HERA.UI.ACTION.DELETE.v1',
      confirmation: {
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item?',
        type: 'danger' as const
      }
    },
    view: {
      id: 'view',
      label: 'View',
      type: 'navigate' as const,
      icon: 'eye',
      smart_code: 'HERA.UI.ACTION.VIEW.v1'
    }
  },

  // Workflow actions - universal business processes
  workflow: {
    approve: {
      id: 'approve',
      label: 'Approve',
      type: 'workflow' as const,
      icon: 'check-circle',
      smart_code: 'HERA.UI.ACTION.APPROVE.v1'
    },
    reject: {
      id: 'reject',
      label: 'Reject',
      type: 'workflow' as const,
      icon: 'x-circle',
      smart_code: 'HERA.UI.ACTION.REJECT.v1',
      confirmation: {
        title: 'Reject Item',
        message: 'Please provide a reason for rejection',
        type: 'warning' as const
      }
    },
    submit: {
      id: 'submit',
      label: 'Submit for Approval',
      type: 'workflow' as const,
      icon: 'send',
      smart_code: 'HERA.UI.ACTION.SUBMIT.v1'
    }
  },

  // Export/report actions
  export: {
    pdf: {
      id: 'export-pdf',
      label: 'Export PDF',
      type: 'custom' as const,
      icon: 'file-text',
      smart_code: 'HERA.UI.ACTION.EXPORT_PDF.v1'
    },
    excel: {
      id: 'export-excel',
      label: 'Export Excel',
      type: 'custom' as const,
      icon: 'table',
      smart_code: 'HERA.UI.ACTION.EXPORT_EXCEL.v1'
    },
    print: {
      id: 'print',
      label: 'Print',
      type: 'custom' as const,
      icon: 'printer',
      smart_code: 'HERA.UI.ACTION.PRINT.v1'
    }
  }
}

/**
 * Universal Widget Configurations
 * These widget patterns work across all industries
 */
export const universalWidgetPatterns = {
  // Stats widget for KPIs
  statsWidget: (title: string, calculations: any[]): Widget => ({
    id: 'stats-widget',
    type: 'stats',
    title,
    smart_code: 'HERA.UI.WIDGET.STATS.v1',
    config: {},
    layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 1 } },
    data_source: {
      type: 'calculated',
      calculations
    }
  }),

  // Form widget for data entry
  formWidget: (title: string, fields: FormField[]): Widget => ({
    id: 'form-widget',
    type: 'form',
    title,
    smart_code: 'HERA.UI.WIDGET.FORM.v1',
    config: { fields },
    layout: { position: { row: 1, col: 0 }, size: { width: 12, height: 2 } }
  }),

  // Grid widget for listings
  gridWidget: (title: string, columns: GridColumn[], filters?: any[]): Widget => ({
    id: 'grid-widget',
    type: 'grid',
    title,
    smart_code: 'HERA.UI.WIDGET.GRID.v1',
    config: {
      columns,
      pagination: {
        page_size: 25,
        page_size_options: [10, 25, 50, 100]
      }
    },
    layout: { position: { row: 2, col: 0 }, size: { width: 12, height: 4 } },
    data_source: filters
      ? {
          type: 'entities',
          filters
        }
      : undefined
  }),

  // Chart widget for analytics
  chartWidget: (title: string, chartType: string, series: any[]): Widget => ({
    id: 'chart-widget',
    type: 'chart',
    title,
    smart_code: 'HERA.UI.WIDGET.CHART.v1',
    config: {
      chart_type: chartType as any,
      series
    },
    layout: { position: { row: 3, col: 0 }, size: { width: 8, height: 3 } }
  }),

  // Timeline widget for history
  timelineWidget: (title: string): Widget => ({
    id: 'timeline-widget',
    type: 'timeline',
    title,
    smart_code: 'HERA.UI.WIDGET.TIMELINE.v1',
    config: {
      time_field: 'created_at',
      event_template: '{{user}} {{action}} - {{description}}'
    },
    layout: { position: { row: 4, col: 0 }, size: { width: 12, height: 2 } }
  })
}

/**
 * Create a universal list view for any entity type
 * This demonstrates how the same pattern works everywhere
 */
export function createUniversalListView(
  entityType: string,
  title: string,
  columns: GridColumn[],
  actions?: Action[]
): ViewMetadata {
  return {
    id: `${entityType}-list-view`,
    smart_code: `HERA.UI.LIST.${entityType.toUpperCase()}.v1`,
    view_type: 'list',
    title,
    widgets: [
      {
        id: `${entityType}-grid`,
        type: 'grid',
        title,
        smart_code: `HERA.UI.GRID.${entityType.toUpperCase()}.v1`,
        config: {
          columns,
          row_actions: actions?.filter(a => ['view', 'edit', 'delete'].includes(a.id)),
          bulk_actions: actions?.filter(a => a.id === 'create'),
          pagination: {
            page_size: 25,
            page_size_options: [10, 25, 50, 100]
          }
        },
        data_source: {
          type: 'entities',
          entity_type: entityType
        }
      } as Widget
    ],
    actions
  }
}

/**
 * Create a universal detail view for any entity
 * Shows how form + related data work universally
 */
export function createUniversalDetailView(
  entityType: string,
  title: string,
  fields: FormField[],
  relatedGrids?: { title: string; relationship: string; columns: GridColumn[] }[]
): ViewMetadata {
  const widgets: Widget[] = [
    // Main form widget
    {
      id: `${entityType}-form`,
      type: 'form',
      title: 'Details',
      smart_code: `HERA.UI.FORM.${entityType.toUpperCase()}.v1`,
      config: { fields },
      layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 2 } }
    }
  ]

  // Add related grids
  relatedGrids?.forEach((grid, index) => {
    widgets.push({
      id: `${entityType}-related-${index}`,
      type: 'grid',
      title: grid.title,
      smart_code: `HERA.UI.GRID.RELATED.${entityType.toUpperCase()}.v1`,
      config: { columns: grid.columns },
      layout: { position: { row: 2 + index * 2, col: 0 }, size: { width: 12, height: 2 } },
      data_source: {
        type: 'relationships',
        filters: [{ field: 'relationship_type', operator: 'equals', value: grid.relationship }]
      }
    })
  })

  return {
    id: `${entityType}-detail-view`,
    smart_code: `HERA.UI.DETAIL.${entityType.toUpperCase()}.v1`,
    view_type: 'detail',
    title,
    widgets
  }
}

/**
 * Example: How ANY business can use these patterns
 *
 * // For a veterinary clinic:
 * const petListView = createUniversalListView('pet', 'Pets', [
 *   universalGridPatterns.entityColumns.name,
 *   { field: 'species', header: 'Species', type: 'text' },
 *   { field: 'owner_name', header: 'Owner', type: 'entity_link' },
 *   universalGridPatterns.dateColumns.created
 * ])
 *
 * // For a law firm:
 * const caseListView = createUniversalListView('legal_case', 'Cases', [
 *   { field: 'case_number', header: 'Case #', type: 'text' },
 *   universalGridPatterns.entityColumns.name,
 *   { field: 'client_name', header: 'Client', type: 'entity_link' },
 *   universalGridPatterns.statusColumns.status
 * ])
 *
 * // For a gym:
 * const memberListView = createUniversalListView('member', 'Members', [
 *   universalGridPatterns.entityColumns.name,
 *   { field: 'membership_type', header: 'Type', type: 'text' },
 *   { field: 'expiry_date', header: 'Expires', type: 'date' },
 *   universalGridPatterns.statusColumns.status
 * ])
 *
 * ALL use the SAME grid widget, just different metadata!
 */
