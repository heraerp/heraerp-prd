#!/usr/bin/env tsx

/**
 * HERA Universal Tile System - Seed Core Templates
 * Creates the 5 foundational tile templates in the platform organization
 * Smart Code: HERA.PLATFORM.SCRIPT.SEED.TILE_TEMPLATES.v1
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Constants
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Type definitions
interface TileTemplate {
  entity_code: string
  entity_name: string
  entity_description: string
  smart_code: string
  dynamic_fields: {
    tile_type: string
    operation_category: string
    ui_schema: object
    action_templates: object[]
    stat_templates: object[]
    default_layout_config: object
  }
}

// Template definitions
const TILE_TEMPLATES: TileTemplate[] = [
  {
    entity_code: 'TILE_TPL_ENTITIES',
    entity_name: 'Entities Tile Template',
    entity_description: 'Universal tile for displaying and managing entities - customers, products, staff, etc.',
    smart_code: 'HERA.PLATFORM.UI.TILE.TPL.ENTITIES.v1',
    dynamic_fields: {
      tile_type: 'ENTITIES',
      operation_category: 'READ',
      ui_schema: {
        icon: 'Database',
        color: 'blue',
        gradient: 'blue-to-indigo',
        size: 'standard',
        badge_position: 'top-right'
      },
      action_templates: [
        {
          action_id: 'view_all',
          label: 'View All',
          action_type: 'NAVIGATE',
          route_template: '/entities?type={{entity_type}}',
          icon: 'Eye',
          is_primary: true,
          visibility_when: { all: [] }
        },
        {
          action_id: 'create_new',
          label: 'Create New',
          action_type: 'NAVIGATE', 
          route_template: '/entities/create?type={{entity_type}}',
          icon: 'Plus',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.permissions', operator: 'contains', value: 'entity.create' }] }
        },
        {
          action_id: 'bulk_import',
          label: 'Bulk Import',
          action_type: 'MODAL',
          modal_component: 'BulkImportModal',
          icon: 'Upload',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.role', operator: 'in', value: ['admin', 'manager'] }] }
        }
      ],
      stat_templates: [
        {
          stat_id: 'total_count',
          label: 'Total',
          query: {
            table: 'core_entities',
            operation: 'count',
            conditions: {
              all: [
                { field: 'entity_type', operator: 'eq', value: '{{entity_type}}' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' }
              ]
            }
          },
          format: 'number',
          is_primary: true
        },
        {
          stat_id: 'recent_count',
          label: 'This Week',
          query: {
            table: 'core_entities',
            operation: 'count',
            conditions: {
              all: [
                { field: 'entity_type', operator: 'eq', value: '{{entity_type}}' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'created_at', operator: 'gte', value: '{{week_start}}' }
              ]
            }
          },
          format: 'number',
          is_primary: false
        }
      ],
      default_layout_config: {
        show_badge: true,
        show_recent_items: true,
        recent_items_limit: 3,
        show_quick_actions: true,
        quick_actions_limit: 2
      }
    }
  },
  {
    entity_code: 'TILE_TPL_TRANSACTIONS',
    entity_name: 'Transactions Tile Template',
    entity_description: 'Universal tile for displaying and managing business transactions - sales, purchases, payments, etc.',
    smart_code: 'HERA.PLATFORM.UI.TILE.TPL.TRANSACTIONS.v1',
    dynamic_fields: {
      tile_type: 'TRANSACTIONS',
      operation_category: 'READ',
      ui_schema: {
        icon: 'Receipt',
        color: 'green',
        gradient: 'green-to-emerald',
        size: 'standard',
        badge_position: 'top-right'
      },
      action_templates: [
        {
          action_id: 'view_all',
          label: 'View All',
          action_type: 'NAVIGATE',
          route_template: '/transactions?type={{transaction_type}}',
          icon: 'List',
          is_primary: true,
          visibility_when: { all: [] }
        },
        {
          action_id: 'create_new',
          label: 'Create New',
          action_type: 'NAVIGATE',
          route_template: '/transactions/create?type={{transaction_type}}',
          icon: 'Plus',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.permissions', operator: 'contains', value: 'transaction.create' }] }
        },
        {
          action_id: 'reports',
          label: 'Reports',
          action_type: 'NAVIGATE',
          route_template: '/reports/transactions?type={{transaction_type}}',
          icon: 'BarChart3',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.permissions', operator: 'contains', value: 'reports.view' }] }
        }
      ],
      stat_templates: [
        {
          stat_id: 'total_amount',
          label: 'Total Value',
          query: {
            table: 'universal_transactions',
            operation: 'sum',
            field: 'total_amount',
            conditions: {
              all: [
                { field: 'transaction_type', operator: 'eq', value: '{{transaction_type}}' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'transaction_status', operator: 'neq', value: 'CANCELLED' }
              ]
            }
          },
          format: 'currency',
          is_primary: true
        },
        {
          stat_id: 'count_today',
          label: 'Today',
          query: {
            table: 'universal_transactions',
            operation: 'count',
            conditions: {
              all: [
                { field: 'transaction_type', operator: 'eq', value: '{{transaction_type}}' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'transaction_date', operator: 'gte', value: '{{today_start}}' },
                { field: 'transaction_date', operator: 'lt', value: '{{today_end}}' }
              ]
            }
          },
          format: 'number',
          is_primary: false
        }
      ],
      default_layout_config: {
        show_badge: true,
        show_recent_items: true,
        recent_items_limit: 5,
        show_quick_actions: true,
        quick_actions_limit: 3
      }
    }
  },
  {
    entity_code: 'TILE_TPL_WORKFLOW',
    entity_name: 'Workflow Tile Template',
    entity_description: 'Universal tile for workflow and process management - approvals, tasks, status tracking, etc.',
    smart_code: 'HERA.PLATFORM.UI.TILE.TPL.WORKFLOW.v1',
    dynamic_fields: {
      tile_type: 'WORKFLOW',
      operation_category: 'PROCESS',
      ui_schema: {
        icon: 'Workflow',
        color: 'purple',
        gradient: 'purple-to-violet',
        size: 'standard',
        badge_position: 'top-right'
      },
      action_templates: [
        {
          action_id: 'pending_tasks',
          label: 'Pending Tasks',
          action_type: 'NAVIGATE',
          route_template: '/workflow/tasks?status=pending&assignee={{user_id}}',
          icon: 'Clock',
          is_primary: true,
          visibility_when: { all: [] }
        },
        {
          action_id: 'approve_queue',
          label: 'Approval Queue',
          action_type: 'NAVIGATE',
          route_template: '/workflow/approvals?approver={{user_id}}',
          icon: 'CheckCircle',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.permissions', operator: 'contains', value: 'workflow.approve' }] }
        },
        {
          action_id: 'workflow_designer',
          label: 'Design Workflows',
          action_type: 'NAVIGATE',
          route_template: '/workflow/designer',
          icon: 'Settings',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.role', operator: 'in', value: ['admin', 'workflow_designer'] }] }
        }
      ],
      stat_templates: [
        {
          stat_id: 'pending_count',
          label: 'Pending',
          query: {
            table: 'universal_transactions',
            operation: 'count',
            conditions: {
              all: [
                { field: 'transaction_type', operator: 'eq', value: 'WORKFLOW_TASK' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'transaction_status', operator: 'eq', value: 'PENDING' },
                { field: 'target_entity_id', operator: 'eq', value: '{{user_entity_id}}' }
              ]
            }
          },
          format: 'number',
          is_primary: true
        },
        {
          stat_id: 'overdue_count',
          label: 'Overdue',
          query: {
            table: 'universal_transactions',
            operation: 'count',
            conditions: {
              all: [
                { field: 'transaction_type', operator: 'eq', value: 'WORKFLOW_TASK' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'transaction_status', operator: 'eq', value: 'PENDING' },
                { field: 'target_entity_id', operator: 'eq', value: '{{user_entity_id}}' },
                { field: 'due_date', operator: 'lt', value: '{{now}}' }
              ]
            }
          },
          format: 'number',
          is_primary: false
        }
      ],
      default_layout_config: {
        show_badge: true,
        show_recent_items: true,
        recent_items_limit: 4,
        show_quick_actions: true,
        quick_actions_limit: 2
      }
    }
  },
  {
    entity_code: 'TILE_TPL_RELATIONSHIPS',
    entity_name: 'Relationships Tile Template',
    entity_description: 'Universal tile for managing entity relationships - hierarchies, associations, mappings, etc.',
    smart_code: 'HERA.PLATFORM.UI.TILE.TPL.RELATIONSHIPS.v1',
    dynamic_fields: {
      tile_type: 'RELATIONSHIPS',
      operation_category: 'READ',
      ui_schema: {
        icon: 'Network',
        color: 'orange',
        gradient: 'orange-to-red',
        size: 'standard',
        badge_position: 'top-right'
      },
      action_templates: [
        {
          action_id: 'view_network',
          label: 'View Network',
          action_type: 'NAVIGATE',
          route_template: '/relationships/network?type={{relationship_type}}',
          icon: 'Network',
          is_primary: true,
          visibility_when: { all: [] }
        },
        {
          action_id: 'create_link',
          label: 'Create Link',
          action_type: 'MODAL',
          modal_component: 'CreateRelationshipModal',
          icon: 'Link',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.permissions', operator: 'contains', value: 'relationship.create' }] }
        },
        {
          action_id: 'hierarchy_view',
          label: 'Hierarchy',
          action_type: 'NAVIGATE',
          route_template: '/relationships/hierarchy?type={{relationship_type}}',
          icon: 'TreePine',
          is_primary: false,
          visibility_when: { all: [] }
        }
      ],
      stat_templates: [
        {
          stat_id: 'total_relationships',
          label: 'Total Links',
          query: {
            table: 'core_relationships',
            operation: 'count',
            conditions: {
              all: [
                { field: 'relationship_type', operator: 'eq', value: '{{relationship_type}}' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'effective_date', operator: 'lte', value: '{{now}}' },
                { any: [
                  { field: 'expiration_date', operator: 'is_null', value: null },
                  { field: 'expiration_date', operator: 'gt', value: '{{now}}' }
                ] }
              ]
            }
          },
          format: 'number',
          is_primary: true
        },
        {
          stat_id: 'recent_changes',
          label: 'Recent Changes',
          query: {
            table: 'core_relationships',
            operation: 'count',
            conditions: {
              all: [
                { field: 'relationship_type', operator: 'eq', value: '{{relationship_type}}' },
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'updated_at', operator: 'gte', value: '{{week_start}}' }
              ]
            }
          },
          format: 'number',
          is_primary: false
        }
      ],
      default_layout_config: {
        show_badge: true,
        show_recent_items: true,
        recent_items_limit: 3,
        show_quick_actions: true,
        quick_actions_limit: 3
      }
    }
  },
  {
    entity_code: 'TILE_TPL_ANALYTICS',
    entity_name: 'Analytics Tile Template',
    entity_description: 'Universal tile for displaying analytics, KPIs, charts, and business intelligence data.',
    smart_code: 'HERA.PLATFORM.UI.TILE.TPL.ANALYTICS.v1',
    dynamic_fields: {
      tile_type: 'ANALYTICS',
      operation_category: 'ANALYTICS',
      ui_schema: {
        icon: 'BarChart3',
        color: 'cyan',
        gradient: 'cyan-to-blue',
        size: 'large',
        badge_position: 'top-right'
      },
      action_templates: [
        {
          action_id: 'full_dashboard',
          label: 'Full Dashboard',
          action_type: 'NAVIGATE',
          route_template: '/analytics/dashboard?category={{analytics_category}}',
          icon: 'LayoutDashboard',
          is_primary: true,
          visibility_when: { all: [] }
        },
        {
          action_id: 'export_data',
          label: 'Export Data',
          action_type: 'API_CALL',
          api_endpoint: '/api/v2/analytics/export',
          icon: 'Download',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.permissions', operator: 'contains', value: 'analytics.export' }] }
        },
        {
          action_id: 'configure_kpis',
          label: 'Configure KPIs',
          action_type: 'NAVIGATE',
          route_template: '/analytics/configure?category={{analytics_category}}',
          icon: 'Settings',
          is_primary: false,
          visibility_when: { all: [{ field: 'user.role', operator: 'in', value: ['admin', 'analyst'] }] }
        }
      ],
      stat_templates: [
        {
          stat_id: 'primary_kpi',
          label: 'Primary KPI',
          query: {
            table: 'custom_analytics_query',
            operation: 'custom',
            custom_query: '{{kpi_query}}',
            conditions: {
              all: [
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'date_range', operator: 'eq', value: '{{date_range}}' }
              ]
            }
          },
          format: '{{kpi_format}}',
          is_primary: true
        },
        {
          stat_id: 'trend_indicator',
          label: 'Trend',
          query: {
            table: 'custom_analytics_query',
            operation: 'custom',
            custom_query: '{{trend_query}}',
            conditions: {
              all: [
                { field: 'organization_id', operator: 'eq', value: '{{organization_id}}' },
                { field: 'comparison_period', operator: 'eq', value: '{{comparison_period}}' }
              ]
            }
          },
          format: 'percentage',
          is_primary: false
        }
      ],
      default_layout_config: {
        show_badge: true,
        show_recent_items: false,
        recent_items_limit: 0,
        show_quick_actions: true,
        quick_actions_limit: 3,
        show_chart: true,
        chart_type: 'line',
        chart_height: 120
      }
    }
  }
]

/**
 * Seed a single tile template with all its dynamic data
 */
async function seedTileTemplate(template: TileTemplate): Promise<boolean> {
  try {
    console.log(`📦 Seeding template: ${template.entity_name}`)
    
    // Check if template already exists
    const { data: existingTemplate, error: checkError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'APP_TILE_TEMPLATE')
      .eq('entity_code', template.entity_code)
      .eq('organization_id', PLATFORM_ORG_ID)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`❌ Error checking existing template ${template.entity_code}:`, checkError)
      return false
    }
    
    let templateEntityId: string
    
    if (existingTemplate) {
      console.log(`   ⏭️  Template already exists, updating...`)
      templateEntityId = existingTemplate.id
      
      // Update existing template
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({
          entity_name: template.entity_name,
          entity_description: template.entity_description,
          smart_code: template.smart_code,
          updated_by: SYSTEM_USER_ID,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateEntityId)
      
      if (updateError) {
        console.error(`❌ Error updating template ${template.entity_code}:`, updateError)
        return false
      }
    } else {
      console.log(`   ➕ Creating new template...`)
      
      // Create new template entity
      const { data: newTemplate, error: createError } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'APP_TILE_TEMPLATE',
          entity_code: template.entity_code,
          entity_name: template.entity_name,
          entity_description: template.entity_description,
          smart_code: template.smart_code,
          organization_id: PLATFORM_ORG_ID,
          created_by: SYSTEM_USER_ID,
          updated_by: SYSTEM_USER_ID
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error(`❌ Error creating template ${template.entity_code}:`, createError)
        return false
      }
      
      templateEntityId = newTemplate.id
    }
    
    // Seed dynamic data fields
    const dynamicDataRecords = []
    
    for (const [fieldName, fieldValue] of Object.entries(template.dynamic_fields)) {
      let fieldType: string
      let fieldValueColumn: any = {}
      
      // Determine field type and value column
      if (typeof fieldValue === 'string') {
        fieldType = 'text'
        fieldValueColumn.field_value_text = fieldValue
      } else if (typeof fieldValue === 'number') {
        fieldType = 'number'
        fieldValueColumn.field_value_number = fieldValue
      } else if (typeof fieldValue === 'boolean') {
        fieldType = 'boolean'
        fieldValueColumn.field_value_boolean = fieldValue
      } else {
        fieldType = 'json'
        fieldValueColumn.field_value_json = fieldValue
      }
      
      dynamicDataRecords.push({
        entity_id: templateEntityId,
        field_name: fieldName,
        field_type: fieldType,
        smart_code: `HERA.PLATFORM.UI.TILE.TPL.FIELD.${fieldName.toUpperCase()}.v1`,
        organization_id: PLATFORM_ORG_ID,
        created_by: SYSTEM_USER_ID,
        updated_by: SYSTEM_USER_ID,
        ...fieldValueColumn
      })
    }
    
    // Remove existing dynamic data for this template
    const { error: deleteError } = await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', templateEntityId)
    
    if (deleteError) {
      console.error(`❌ Error removing existing dynamic data for ${template.entity_code}:`, deleteError)
      return false
    }
    
    // Insert new dynamic data
    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicDataRecords)
    
    if (dynamicError) {
      console.error(`❌ Error inserting dynamic data for ${template.entity_code}:`, dynamicError)
      return false
    }
    
    console.log(`   ✅ Template ${template.entity_name} seeded successfully`)
    return true
    
  } catch (error) {
    console.error(`❌ Unexpected error seeding template ${template.entity_code}:`, error)
    return false
  }
}

/**
 * Verify seeded templates
 */
async function verifyTemplates(): Promise<void> {
  console.log('\n🔍 Verifying seeded templates...')
  
  const { data: templates, error } = await supabase
    .from('core_entities')
    .select(`
      id,
      entity_code,
      entity_name,
      smart_code,
      created_at
    `)
    .eq('entity_type', 'APP_TILE_TEMPLATE')
    .eq('organization_id', PLATFORM_ORG_ID)
    .order('entity_code')
  
  if (error) {
    console.error('❌ Error verifying templates:', error)
    return
  }
  
  console.log('\n📋 Seeded Templates Summary:')
  console.log('=' .repeat(80))
  
  for (const template of templates || []) {
    // Get dynamic data count
    const { count } = await supabase
      .from('core_dynamic_data')
      .select('*', { count: 'exact', head: true })
      .eq('entity_id', template.id)
    
    console.log(`✅ ${template.entity_name}`)
    console.log(`   Code: ${template.entity_code}`)
    console.log(`   Smart Code: ${template.smart_code}`)
    console.log(`   Dynamic Fields: ${count || 0}`)
    console.log(`   Created: ${new Date(template.created_at).toLocaleDateString()}`)
    console.log('')
  }
  
  console.log(`📊 Total Templates: ${templates?.length || 0}`)
}

/**
 * Main seeding function
 */
async function main(): Promise<void> {
  console.log('🚀 HERA Universal Tile System - Seed Core Templates')
  console.log('=' .repeat(60))
  console.log(`Platform Org: ${PLATFORM_ORG_ID}`)
  console.log(`Templates to seed: ${TILE_TEMPLATES.length}`)
  console.log('')
  
  // Seed all templates
  let successCount = 0
  let errorCount = 0
  
  for (const template of TILE_TEMPLATES) {
    const success = await seedTileTemplate(template)
    if (success) {
      successCount++
    } else {
      errorCount++
    }
  }
  
  console.log('\n📊 Seeding Results:')
  console.log('=' .repeat(40))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📦 Total: ${TILE_TEMPLATES.length}`)
  
  // Verify results
  if (successCount > 0) {
    await verifyTemplates()
  }
  
  // Exit with appropriate code
  if (errorCount > 0) {
    console.error('\n❌ Some templates failed to seed. Check logs above.')
    process.exit(1)
  } else {
    console.log('\n🎉 All tile templates seeded successfully!')
    process.exit(0)
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Run the seeding script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
}

export { seedTileTemplate, TILE_TEMPLATES, PLATFORM_ORG_ID, SYSTEM_USER_ID }