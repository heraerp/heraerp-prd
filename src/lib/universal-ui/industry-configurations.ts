/**
 * Universal UI Industry Configurations
 * 
 * These configurations demonstrate how the SAME Universal UI components
 * can be reused for ANY industry without code changes. Only the ViewMeta
 * configuration changes - the widgets and renderer remain exactly the same.
 * 
 * This is the revolutionary power of HERA's Universal UI system.
 */

import { ViewMetadata } from './view-meta-service'

export const industryConfigurations: Record<string, Record<string, ViewMetadata>> = {
  /**
   * HEALTHCARE - Patient Management System
   * Same widgets used for medical records, appointments, billing
   */
  healthcare: {
    // Patient Detail View - Using SAME widgets as other industries
    patientDetail: {
      id: 'healthcare-patient-detail',
      smart_code: 'HERA.HLTH.PAT.ENT.PROF.v1',
      view_type: 'detail',
      title: 'Patient Medical Record',
      description: 'Complete patient health profile and medical history',
      widgets: [
        // Stats Widget - Same as restaurant/retail, just different metrics
        {
          id: 'patient-vitals',
          type: 'stats',
          title: 'Current Vitals',
          smart_code: 'HERA.HLTH.PAT.STATS.VITALS.v1',
          config: {
            metric: 'health_score',
            aggregation: 'avg',
            comparison: 'previous_period'
          },
          layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 1 } },
          data_source: {
            type: 'calculated',
            calculations: [
              { alias: 'blood_pressure', formula: 'latest(bp_systolic)/latest(bp_diastolic)' },
              { alias: 'heart_rate', formula: 'latest(heart_rate_bpm)' },
              { alias: 'temperature', formula: 'latest(temperature_celsius)' },
              { alias: 'last_visit', formula: 'days_since_last_visit()' }
            ]
          }
        },
        
        // Form Widget - Same component, different fields
        {
          id: 'patient-info',
          type: 'form',
          title: 'Patient Information',
          smart_code: 'HERA.HLTH.PAT.FORM.INFO.v1',
          config: {
            fields: [
              { name: 'entity_name', label: 'Patient Name', type: 'text', required: true, layout: { col_span: 6 } },
              { name: 'patient_id', label: 'Medical Record #', type: 'text', required: true, layout: { col_span: 3 } },
              { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true, layout: { col_span: 3 } },
              { name: 'blood_type', label: 'Blood Type', type: 'select', layout: { col_span: 3 },
                options: [
                  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }
                ]
              },
              { name: 'allergies', label: 'Known Allergies', type: 'multiselect', layout: { col_span: 6 },
                options: [
                  { value: 'penicillin', label: 'Penicillin' },
                  { value: 'sulfa', label: 'Sulfa drugs' },
                  { value: 'aspirin', label: 'Aspirin' },
                  { value: 'latex', label: 'Latex' },
                  { value: 'peanuts', label: 'Peanuts' }
                ]
              },
              { name: 'insurance_provider', label: 'Insurance Provider', type: 'entity_selector',
                entity_type: 'insurance_company', layout: { col_span: 3 } },
              { name: 'primary_physician', label: 'Primary Care Physician', type: 'entity_selector',
                entity_type: 'physician', layout: { col_span: 6 } },
              { name: 'emergency_contact', label: 'Emergency Contact', type: 'text', layout: { col_span: 6 } }
            ]
          },
          layout: { position: { row: 1, col: 0 }, size: { width: 12, height: 2 } }
        },
        
        // Grid Widget - Same as other industries, medical context
        {
          id: 'appointment-history',
          type: 'grid',
          title: 'Appointment History',
          smart_code: 'HERA.HLTH.PAT.GRID.APPOINTMENTS.v1',
          config: {
            columns: [
              { field: 'appointment_date', header: 'Date', type: 'date', sortable: true },
              { field: 'provider_name', header: 'Provider', type: 'entity_link' },
              { field: 'appointment_type', header: 'Type', type: 'text',
                renderer: 'status_badge' },
              { field: 'diagnosis', header: 'Diagnosis', type: 'text' },
              { field: 'prescribed_medications', header: 'Prescriptions', type: 'text' },
              { field: 'follow_up_required', header: 'Follow-up', type: 'boolean' },
              { field: 'billing_status', header: 'Billing', type: 'status',
                renderer: 'status_badge' }
            ],
            row_actions: [
              { id: 'view-details', label: 'View Details', type: 'navigate',
                smart_code: 'HERA.HLTH.APPT.ACTION.VIEW.v1' },
              { id: 'print-summary', label: 'Print Summary', type: 'custom',
                smart_code: 'HERA.HLTH.APPT.ACTION.PRINT.v1' }
            ]
          },
          layout: { position: { row: 3, col: 0 }, size: { width: 8, height: 3 } },
          data_source: {
            type: 'transactions',
            filters: [
              { field: 'transaction_type', operator: 'equals', value: 'medical_appointment' },
              { field: 'patient_id', operator: 'equals', value: '{{entity_id}}' }
            ]
          }
        },
        
        // Timeline Widget - Medical history timeline
        {
          id: 'medical-timeline',
          type: 'timeline',
          title: 'Medical History',
          smart_code: 'HERA.HLTH.PAT.TIMELINE.HISTORY.v1',
          config: {
            time_field: 'event_date',
            event_template: '{{event_type}}: {{description}} - Dr. {{provider_name}}'
          },
          layout: { position: { row: 3, col: 8 }, size: { width: 4, height: 3 } }
        }
      ],
      actions: [
        { id: 'schedule-appointment', label: 'Schedule Appointment', type: 'create',
          smart_code: 'HERA.HLTH.PAT.ACTION.SCHEDULE.v1', icon: 'calendar' },
        { id: 'prescribe-medication', label: 'Prescribe', type: 'custom',
          smart_code: 'HERA.HLTH.PAT.ACTION.PRESCRIBE.v1', icon: 'pill' },
        { id: 'order-lab', label: 'Order Lab Tests', type: 'custom',
          smart_code: 'HERA.HLTH.PAT.ACTION.LAB.v1', icon: 'test-tube' }
      ]
    },

    // Patient List View
    patientList: {
      id: 'healthcare-patient-list',
      smart_code: 'HERA.HLTH.PAT.LIST.ALL.v1',
      view_type: 'list',
      title: 'Patient Registry',
      description: 'All patients in the healthcare system',
      widgets: [
        {
          id: 'patient-grid',
          type: 'grid',
          title: 'Patients',
          smart_code: 'HERA.HLTH.PAT.GRID.ALL.v1',
          config: {
            columns: [
              { field: 'entity_name', header: 'Patient Name', type: 'entity_link',
                sortable: true, filterable: true },
              { field: 'patient_id', header: 'MRN', type: 'text', sortable: true },
              { field: 'date_of_birth', header: 'DOB', type: 'date' },
              { field: 'last_visit', header: 'Last Visit', type: 'date', sortable: true },
              { field: 'primary_physician', header: 'Primary Care', type: 'entity_link' },
              { field: 'risk_level', header: 'Risk Level', type: 'status',
                renderer: 'status_badge' },
              { field: 'insurance_status', header: 'Insurance', type: 'text' }
            ],
            row_actions: [
              { id: 'view-record', label: 'View Record', type: 'navigate',
                smart_code: 'HERA.HLTH.PAT.ACTION.VIEW.v1' },
              { id: 'schedule', label: 'Schedule', type: 'custom',
                smart_code: 'HERA.HLTH.PAT.ACTION.SCHEDULE.v1' }
            ],
            pagination: { page_size: 25, page_size_options: [10, 25, 50, 100] }
          }
        }
      ]
    }
  },

  /**
   * RESTAURANT - POS and Order Management
   * Same widgets handle menu items, orders, kitchen display
   */
  restaurant: {
    // Order Entry View - Using form, grid, stats widgets
    orderEntry: {
      id: 'restaurant-order-entry',
      smart_code: 'HERA.REST.POS.TXN.ORDER.v1',
      view_type: 'form',
      title: 'New Order',
      description: 'Restaurant point of sale order entry',
      widgets: [
        // Stats Widget - Order totals
        {
          id: 'order-totals',
          type: 'stats',
          title: 'Order Summary',
          smart_code: 'HERA.REST.POS.STATS.ORDER.v1',
          config: {},
          layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 1 } },
          data_source: {
            type: 'calculated',
            calculations: [
              { alias: 'subtotal', formula: 'sum(line_amount)' },
              { alias: 'tax_amount', formula: 'subtotal * tax_rate' },
              { alias: 'total_amount', formula: 'subtotal + tax_amount' },
              { alias: 'item_count', formula: 'count(line_items)' }
            ]
          }
        },
        
        // Form Widget - Customer and table info
        {
          id: 'order-header',
          type: 'form',
          title: 'Order Details',
          smart_code: 'HERA.REST.POS.FORM.ORDER.v1',
          config: {
            fields: [
              { name: 'table_number', label: 'Table #', type: 'select', required: true,
                layout: { col_span: 3 },
                options: Array.from({length: 20}, (_, i) => ({
                  value: `T${i+1}`, label: `Table ${i+1}`
                }))
              },
              { name: 'server_id', label: 'Server', type: 'entity_selector',
                entity_type: 'employee', required: true, layout: { col_span: 3 } },
              { name: 'guest_count', label: 'Guests', type: 'number', default_value: 2,
                layout: { col_span: 2 } },
              { name: 'order_type', label: 'Type', type: 'select', default_value: 'dine_in',
                layout: { col_span: 4 },
                options: [
                  { value: 'dine_in', label: 'Dine In' },
                  { value: 'takeout', label: 'Takeout' },
                  { value: 'delivery', label: 'Delivery' },
                  { value: 'catering', label: 'Catering' }
                ]
              },
              { name: 'customer_name', label: 'Customer Name', type: 'text',
                layout: { col_span: 6 },
                conditional_display: {
                  field: 'order_type',
                  operator: 'in',
                  value: ['takeout', 'delivery', 'catering']
                }
              },
              { name: 'special_instructions', label: 'Special Instructions', type: 'textarea',
                layout: { col_span: 12 } }
            ]
          },
          layout: { position: { row: 1, col: 0 }, size: { width: 12, height: 1 } }
        },
        
        // Grid Widget - Menu item selection
        {
          id: 'menu-items',
          type: 'grid',
          title: 'Menu Items',
          smart_code: 'HERA.REST.MENU.GRID.ITEMS.v1',
          config: {
            columns: [
              { field: 'category', header: 'Category', type: 'text', filterable: true },
              { field: 'item_name', header: 'Item', type: 'text', filterable: true },
              { field: 'description', header: 'Description', type: 'text' },
              { field: 'price', header: 'Price', type: 'money' },
              { field: 'prep_time', header: 'Prep Time', type: 'text' },
              { field: 'availability', header: 'Available', type: 'boolean' }
            ],
            row_actions: [
              { id: 'add-to-order', label: 'Add', type: 'custom',
                smart_code: 'HERA.REST.POS.ACTION.ADD_ITEM.v1', icon: 'plus' }
            ]
          },
          layout: { position: { row: 2, col: 0 }, size: { width: 7, height: 4 } },
          data_source: {
            type: 'entities',
            entity_type: 'menu_item',
            filters: [
              { field: 'active', operator: 'equals', value: true }
            ]
          }
        },
        
        // Grid Widget - Current order items
        {
          id: 'order-items',
          type: 'grid',
          title: 'Order Items',
          smart_code: 'HERA.REST.POS.GRID.ORDER_ITEMS.v1',
          config: {
            columns: [
              { field: 'quantity', header: 'Qty', type: 'number', width: '60px' },
              { field: 'item_name', header: 'Item', type: 'text' },
              { field: 'modifiers', header: 'Modifiers', type: 'text' },
              { field: 'unit_price', header: 'Price', type: 'money' },
              { field: 'line_amount', header: 'Total', type: 'money', aggregation: 'sum' }
            ],
            row_actions: [
              { id: 'modify-item', label: 'Modify', type: 'edit',
                smart_code: 'HERA.REST.POS.ACTION.MODIFY.v1' },
              { id: 'remove-item', label: 'Remove', type: 'delete',
                smart_code: 'HERA.REST.POS.ACTION.REMOVE.v1' }
            ]
          },
          layout: { position: { row: 2, col: 7 }, size: { width: 5, height: 4 } }
        }
      ],
      actions: [
        { id: 'send-to-kitchen', label: 'Send to Kitchen', type: 'workflow',
          smart_code: 'HERA.REST.POS.ACTION.SEND_KITCHEN.v1', icon: 'send' },
        { id: 'print-bill', label: 'Print Bill', type: 'custom',
          smart_code: 'HERA.REST.POS.ACTION.PRINT_BILL.v1', icon: 'printer' },
        { id: 'process-payment', label: 'Payment', type: 'workflow',
          smart_code: 'HERA.REST.POS.ACTION.PAYMENT.v1', icon: 'credit-card' }
      ]
    },

    // Kitchen Display View
    kitchenDisplay: {
      id: 'restaurant-kitchen-display',
      smart_code: 'HERA.REST.KDS.VIEW.ORDERS.v1',
      view_type: 'dashboard',
      title: 'Kitchen Display System',
      widgets: [
        // Kanban Widget - Orders by status
        {
          id: 'order-kanban',
          type: 'kanban',
          title: 'Active Orders',
          smart_code: 'HERA.REST.KDS.KANBAN.ORDERS.v1',
          config: {
            columns: [
              { id: 'new', title: 'New Orders', color: '#ef4444' },
              { id: 'preparing', title: 'Preparing', color: '#f59e0b' },
              { id: 'ready', title: 'Ready', color: '#10b981' },
              { id: 'delivered', title: 'Delivered', color: '#6b7280' }
            ],
            card_template: `
              <div class="font-bold">Table {{table_number}} - Order #{{order_number}}</div>
              <div class="text-sm text-muted-foreground">{{item_count}} items</div>
              <div class="text-xs mt-2">{{elapsed_time}} ago</div>
            `,
            group_by: 'status',
            sort_by: 'created_at'
          },
          layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 5 } }
        }
      ]
    }
  },

  /**
   * PROFESSIONAL SERVICES - Time Billing and Project Management
   * Same widgets for timesheets, projects, invoicing
   */
  professionalServices: {
    // Time Entry Form
    timeEntry: {
      id: 'professional-time-entry',
      smart_code: 'HERA.PROF.TIME.TXN.ENTRY.v1',
      view_type: 'form',
      title: 'Time Entry',
      description: 'Record billable and non-billable time',
      widgets: [
        // Form Widget - Time entry details
        {
          id: 'time-form',
          type: 'form',
          title: 'Time Details',
          smart_code: 'HERA.PROF.TIME.FORM.ENTRY.v1',
          config: {
            fields: [
              { name: 'entry_date', label: 'Date', type: 'date', required: true,
                default_value: 'today', layout: { col_span: 3 } },
              { name: 'client_id', label: 'Client', type: 'entity_selector',
                entity_type: 'customer', required: true, layout: { col_span: 6 } },
              { name: 'project_id', label: 'Project', type: 'entity_selector',
                entity_type: 'project', required: true, layout: { col_span: 3 },
                conditional_display: {
                  field: 'client_id',
                  operator: 'not_equals',
                  value: null
                }
              },
              { name: 'task_category', label: 'Task Category', type: 'select',
                required: true, layout: { col_span: 4 },
                options: [
                  { value: 'consulting', label: 'Consulting' },
                  { value: 'development', label: 'Development' },
                  { value: 'design', label: 'Design' },
                  { value: 'project_mgmt', label: 'Project Management' },
                  { value: 'support', label: 'Support' },
                  { value: 'training', label: 'Training' },
                  { value: 'travel', label: 'Travel' },
                  { value: 'admin', label: 'Administration' }
                ]
              },
              { name: 'hours', label: 'Hours', type: 'number', required: true,
                layout: { col_span: 2 }, validation: [
                  { type: 'min', value: 0.25, message: 'Minimum 0.25 hours' },
                  { type: 'max', value: 24, message: 'Maximum 24 hours' }
                ]
              },
              { name: 'rate_type', label: 'Rate Type', type: 'select',
                default_value: 'standard', layout: { col_span: 3 },
                options: [
                  { value: 'standard', label: 'Standard Rate' },
                  { value: 'overtime', label: 'Overtime (1.5x)' },
                  { value: 'weekend', label: 'Weekend (2x)' },
                  { value: 'fixed', label: 'Fixed Fee' },
                  { value: 'non_billable', label: 'Non-Billable' }
                ]
              },
              { name: 'hourly_rate', label: 'Rate/Hour', type: 'money',
                layout: { col_span: 3 },
                conditional_display: {
                  field: 'rate_type',
                  operator: 'not_equals',
                  value: 'non_billable'
                }
              },
              { name: 'description', label: 'Work Description', type: 'textarea',
                required: true, layout: { col_span: 12 },
                placeholder: 'Describe the work performed...' },
              { name: 'internal_notes', label: 'Internal Notes', type: 'textarea',
                layout: { col_span: 12 },
                help_text: 'These notes are not visible to clients' }
            ]
          },
          layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 3 } }
        },
        
        // Stats Widget - Weekly summary
        {
          id: 'week-summary',
          type: 'stats',
          title: 'This Week',
          smart_code: 'HERA.PROF.TIME.STATS.WEEK.v1',
          config: {},
          layout: { position: { row: 3, col: 0 }, size: { width: 12, height: 1 } },
          data_source: {
            type: 'calculated',
            calculations: [
              { alias: 'total_hours', formula: 'sum(hours) where week = current_week' },
              { alias: 'billable_hours', formula: 'sum(hours) where billable = true' },
              { alias: 'billable_amount', formula: 'sum(hours * hourly_rate) where billable = true' },
              { alias: 'utilization', formula: '(billable_hours / 40) * 100' }
            ]
          }
        },
        
        // Grid Widget - Recent time entries
        {
          id: 'recent-entries',
          type: 'grid',
          title: 'Recent Entries',
          smart_code: 'HERA.PROF.TIME.GRID.RECENT.v1',
          config: {
            columns: [
              { field: 'entry_date', header: 'Date', type: 'date', sortable: true },
              { field: 'client_name', header: 'Client', type: 'entity_link' },
              { field: 'project_name', header: 'Project', type: 'entity_link' },
              { field: 'task_category', header: 'Category', type: 'text' },
              { field: 'hours', header: 'Hours', type: 'number', align: 'right' },
              { field: 'hourly_rate', header: 'Rate', type: 'money' },
              { field: 'total_amount', header: 'Amount', type: 'money', aggregation: 'sum' },
              { field: 'invoice_status', header: 'Status', type: 'status', renderer: 'status_badge' }
            ]
          },
          layout: { position: { row: 4, col: 0 }, size: { width: 12, height: 3 } }
        }
      ],
      actions: [
        { id: 'save-entry', label: 'Save Time Entry', type: 'create',
          smart_code: 'HERA.PROF.TIME.ACTION.SAVE.v1' },
        { id: 'start-timer', label: 'Start Timer', type: 'custom',
          smart_code: 'HERA.PROF.TIME.ACTION.TIMER.v1' }
      ]
    },

    // Project Dashboard
    projectDashboard: {
      id: 'professional-project-dashboard',
      smart_code: 'HERA.PROF.PROJ.DASH.OVERVIEW.v1',
      view_type: 'dashboard',
      title: 'Project Overview',
      widgets: [
        // Stats Widget - Project metrics
        {
          id: 'project-kpis',
          type: 'stats',
          title: 'Project Health',
          smart_code: 'HERA.PROF.PROJ.STATS.KPI.v1',
          config: {},
          layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 1 } },
          data_source: {
            type: 'calculated',
            calculations: [
              { alias: 'budget_used', formula: '(actual_cost / budget) * 100' },
              { alias: 'time_elapsed', formula: '(days_elapsed / total_days) * 100' },
              { alias: 'tasks_completed', formula: '(completed_tasks / total_tasks) * 100' },
              { alias: 'profit_margin', formula: '((revenue - cost) / revenue) * 100' }
            ]
          }
        },
        
        // Chart Widget - Burn down
        {
          id: 'burndown-chart',
          type: 'chart',
          title: 'Project Burn Down',
          smart_code: 'HERA.PROF.PROJ.CHART.BURNDOWN.v1',
          config: {
            chart_type: 'line',
            x_axis: 'date',
            y_axis: 'remaining_hours',
            series: [
              { name: 'Planned', data_field: 'planned_hours', color: '#3b82f6' },
              { name: 'Actual', data_field: 'actual_hours', color: '#10b981' }
            ]
          },
          layout: { position: { row: 1, col: 0 }, size: { width: 8, height: 3 } }
        },
        
        // Tree Widget - Work breakdown structure
        {
          id: 'wbs-tree',
          type: 'tree',
          title: 'Work Breakdown Structure',
          smart_code: 'HERA.PROF.PROJ.TREE.WBS.v1',
          config: {
            node_template: '{{task_name}} ({{hours}}h)',
            expand_level: 2
          },
          layout: { position: { row: 1, col: 8 }, size: { width: 4, height: 3 } }
        }
      ]
    }
  },

  /**
   * RETAIL - Inventory and Sales Management
   * Same widgets for products, stock levels, sales analytics
   */
  retail: {
    // Inventory Management View
    inventoryManagement: {
      id: 'retail-inventory-management',
      smart_code: 'HERA.RET.INV.VIEW.STOCK.v1',
      view_type: 'detail',
      title: 'Inventory Management',
      description: 'Stock levels, reordering, and movement tracking',
      widgets: [
        // Stats Widget - Inventory KPIs
        {
          id: 'inventory-stats',
          type: 'stats',
          title: 'Inventory Overview',
          smart_code: 'HERA.RET.INV.STATS.KPI.v1',
          config: {},
          layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 1 } },
          data_source: {
            type: 'calculated',
            calculations: [
              { alias: 'total_skus', formula: 'count(distinct sku)' },
              { alias: 'total_value', formula: 'sum(quantity * unit_cost)' },
              { alias: 'low_stock_items', formula: 'count(quantity < reorder_point)' },
              { alias: 'turnover_rate', formula: 'annual_sales / average_inventory' }
            ]
          }
        },
        
        // Grid Widget - Stock levels with intelligent columns
        {
          id: 'stock-levels',
          type: 'grid',
          title: 'Current Stock Levels',
          smart_code: 'HERA.RET.INV.GRID.STOCK.v1',
          config: {
            columns: [
              { field: 'sku', header: 'SKU', type: 'text', sortable: true, filterable: true },
              { field: 'product_name', header: 'Product', type: 'entity_link', filterable: true },
              { field: 'category', header: 'Category', type: 'text', filterable: true },
              { field: 'quantity_on_hand', header: 'On Hand', type: 'number', sortable: true,
                renderer: 'progress_bar' },
              { field: 'quantity_available', header: 'Available', type: 'number' },
              { field: 'quantity_reserved', header: 'Reserved', type: 'number' },
              { field: 'reorder_point', header: 'Reorder At', type: 'number' },
              { field: 'unit_cost', header: 'Unit Cost', type: 'money' },
              { field: 'total_value', header: 'Total Value', type: 'money', sortable: true },
              { field: 'last_sold', header: 'Last Sold', type: 'date' },
              { field: 'stock_status', header: 'Status', type: 'status', renderer: 'status_badge' }
            ],
            row_actions: [
              { id: 'adjust-stock', label: 'Adjust', type: 'custom',
                smart_code: 'HERA.RET.INV.ACTION.ADJUST.v1' },
              { id: 'transfer-stock', label: 'Transfer', type: 'workflow',
                smart_code: 'HERA.RET.INV.ACTION.TRANSFER.v1' },
              { id: 'create-po', label: 'Reorder', type: 'create',
                smart_code: 'HERA.RET.PUR.ACTION.CREATE_PO.v1' }
            ],
            bulk_actions: [
              { id: 'count-inventory', label: 'Physical Count', type: 'workflow',
                smart_code: 'HERA.RET.INV.ACTION.COUNT.v1' },
              { id: 'generate-po', label: 'Generate Purchase Orders', type: 'custom',
                smart_code: 'HERA.RET.INV.ACTION.GENERATE_PO.v1' }
            ]
          },
          layout: { position: { row: 1, col: 0 }, size: { width: 12, height: 4 } }
        },
        
        // Chart Widget - Stock movement trends
        {
          id: 'movement-chart',
          type: 'chart',
          title: 'Stock Movement - Last 30 Days',
          smart_code: 'HERA.RET.INV.CHART.MOVEMENT.v1',
          config: {
            chart_type: 'area',
            x_axis: 'date',
            series: [
              { name: 'Inbound', data_field: 'inbound_qty', color: '#10b981' },
              { name: 'Outbound', data_field: 'outbound_qty', color: '#ef4444' },
              { name: 'Net Change', data_field: 'net_change', color: '#3b82f6' }
            ]
          },
          layout: { position: { row: 5, col: 0 }, size: { width: 8, height: 3 } }
        },
        
        // Related Widget - Recent transactions
        {
          id: 'recent-movements',
          type: 'related',
          title: 'Recent Stock Movements',
          smart_code: 'HERA.RET.INV.RELATED.MOVEMENTS.v1',
          config: {
            relationship_type: 'stock_movement',
            related_entity_type: 'inventory_transaction',
            display_fields: ['transaction_date', 'movement_type', 'quantity', 'reason', 'user']
          },
          layout: { position: { row: 5, col: 8 }, size: { width: 4, height: 3 } }
        }
      ],
      filters: [
        { field: 'category', label: 'Category', type: 'select',
          options: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'clothing', label: 'Clothing' },
            { value: 'food', label: 'Food & Beverages' },
            { value: 'home', label: 'Home & Garden' }
          ]
        },
        { field: 'stock_status', label: 'Stock Status', type: 'select',
          options: [
            { value: 'in_stock', label: 'In Stock' },
            { value: 'low_stock', label: 'Low Stock' },
            { value: 'out_of_stock', label: 'Out of Stock' },
            { value: 'discontinued', label: 'Discontinued' }
          ]
        },
        { field: 'supplier', label: 'Supplier', type: 'entity_selector', entity_type: 'vendor' }
      ]
    },

    // Sales Dashboard
    salesDashboard: {
      id: 'retail-sales-dashboard',
      smart_code: 'HERA.RET.SALES.DASH.OVERVIEW.v1',
      view_type: 'dashboard',
      title: 'Sales Analytics',
      widgets: [
        // Stats Widget - Sales KPIs
        {
          id: 'sales-kpis',
          type: 'stats',
          title: "Today's Performance",
          smart_code: 'HERA.RET.SALES.STATS.TODAY.v1',
          config: {},
          layout: { position: { row: 0, col: 0 }, size: { width: 12, height: 1 } },
          data_source: {
            type: 'calculated',
            calculations: [
              { alias: 'revenue_today', formula: 'sum(total_amount) where date = today' },
              { alias: 'transactions_today', formula: 'count(transaction_id) where date = today' },
              { alias: 'avg_basket_size', formula: 'avg(total_amount) where date = today' },
              { alias: 'conversion_rate', formula: '(transactions / visitors) * 100' }
            ]
          }
        },
        
        // Chart Widget - Sales by hour
        {
          id: 'hourly-sales',
          type: 'chart',
          title: 'Sales by Hour',
          smart_code: 'HERA.RET.SALES.CHART.HOURLY.v1',
          config: {
            chart_type: 'bar',
            x_axis: 'hour',
            y_axis: 'sales_amount',
            series: [
              { name: 'Sales', data_field: 'total_sales', color: '#10b981' }
            ]
          },
          layout: { position: { row: 1, col: 0 }, size: { width: 6, height: 3 } }
        },
        
        // Chart Widget - Top selling products
        {
          id: 'top-products-chart',
          type: 'chart',
          title: 'Top 10 Products',
          smart_code: 'HERA.RET.SALES.CHART.TOP_PRODUCTS.v1',
          config: {
            chart_type: 'pie',
            series: [
              { name: 'Revenue', data_field: 'product_revenue' }
            ]
          },
          layout: { position: { row: 1, col: 6 }, size: { width: 6, height: 3 } }
        }
      ]
    }
  }
}

/**
 * Get ViewMetadata for any industry and view
 * This demonstrates the universal nature - same function works for all industries
 */
export function getIndustryViewMeta(
  industry: keyof typeof industryConfigurations,
  viewName: string
): ViewMetadata | null {
  const industryConfig = industryConfigurations[industry]
  if (!industryConfig) return null
  
  return industryConfig[viewName] || null
}

/**
 * Get all available views for an industry
 */
export function getIndustryViews(industry: keyof typeof industryConfigurations): string[] {
  const industryConfig = industryConfigurations[industry]
  if (!industryConfig) return []
  
  return Object.keys(industryConfig)
}

/**
 * Common widget patterns that work across ALL industries
 * These demonstrate the true universality of the system
 */
export const universalWidgetPatterns = {
  // Universal form fields that adapt to context
  universalFormFields: {
    name: { name: 'entity_name', label: 'Name', type: 'text', required: true },
    code: { name: 'entity_code', label: 'Code', type: 'text', required: true },
    date: { name: 'transaction_date', label: 'Date', type: 'date', default_value: 'today' },
    amount: { name: 'total_amount', label: 'Amount', type: 'money' },
    notes: { name: 'notes', label: 'Notes', type: 'textarea' },
    status: { name: 'status', label: 'Status', type: 'select' }
  },
  
  // Universal grid columns that work everywhere
  universalGridColumns: {
    name: { field: 'entity_name', header: 'Name', type: 'entity_link' },
    code: { field: 'entity_code', header: 'Code', type: 'text' },
    date: { field: 'created_at', header: 'Date', type: 'date', sortable: true },
    amount: { field: 'total_amount', header: 'Amount', type: 'money', sortable: true },
    status: { field: 'status', header: 'Status', type: 'status', renderer: 'status_badge' }
  },
  
  // Universal actions that apply to any entity
  universalActions: {
    create: { type: 'create', label: 'Create New', icon: 'plus' },
    edit: { type: 'edit', label: 'Edit', icon: 'edit' },
    delete: { type: 'delete', label: 'Delete', icon: 'trash' },
    view: { type: 'navigate', label: 'View', icon: 'eye' },
    duplicate: { type: 'custom', label: 'Duplicate', icon: 'copy' }
  }
}