#!/usr/bin/env node
/**
 * Setup Universal Workflow System
 * Creates standard workflow templates that can be used across all HERA applications
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Standard workflow templates
const WORKFLOW_TEMPLATES = {
  SALES_ORDER: {
    name: 'Sales Order Workflow',
    code: 'SALES-ORDER',
    stages: [
      { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true, color: '#6B7280', icon: 'file' },
      { code: 'SUBMITTED', name: 'Submitted', order: 2, color: '#3B82F6', icon: 'send' },
      { code: 'APPROVED', name: 'Approved', order: 3, color: '#10B981', icon: 'check-circle' },
      { code: 'PROCESSING', name: 'Processing', order: 4, color: '#F59E0B', icon: 'clock' },
      { code: 'SHIPPED', name: 'Shipped', order: 5, color: '#8B5CF6', icon: 'truck' },
      { code: 'DELIVERED', name: 'Delivered', order: 6, isFinal: true, color: '#10B981', icon: 'package-check' },
      { code: 'CANCELLED', name: 'Cancelled', order: 7, isFinal: true, color: '#EF4444', icon: 'x-circle' }
    ],
    transitions: [
      { from: 'DRAFT', to: 'SUBMITTED' },
      { from: 'SUBMITTED', to: 'APPROVED', requiresApproval: true },
      { from: 'SUBMITTED', to: 'CANCELLED' },
      { from: 'APPROVED', to: 'PROCESSING', automatic: true },
      { from: 'PROCESSING', to: 'SHIPPED' },
      { from: 'SHIPPED', to: 'DELIVERED' },
      { from: 'APPROVED', to: 'CANCELLED' },
      { from: 'PROCESSING', to: 'CANCELLED' }
    ]
  },
  
  APPOINTMENT: {
    name: 'Appointment Workflow',
    code: 'APPOINTMENT',
    stages: [
      { code: 'SCHEDULED', name: 'Scheduled', order: 1, isInitial: true, color: '#6B7280', icon: 'calendar' },
      { code: 'CONFIRMED', name: 'Confirmed', order: 2, color: '#3B82F6', icon: 'check' },
      { code: 'REMINDED', name: 'Reminded', order: 3, color: '#8B5CF6', icon: 'bell' },
      { code: 'CHECKED_IN', name: 'Checked In', order: 4, color: '#06B6D4', icon: 'user-check' },
      { code: 'IN_SERVICE', name: 'In Service', order: 5, color: '#F59E0B', icon: 'clock' },
      { code: 'COMPLETED', name: 'Completed', order: 6, color: '#10B981', icon: 'check-circle' },
      { code: 'PAID', name: 'Paid', order: 7, isFinal: true, color: '#10B981', icon: 'credit-card' },
      { code: 'CANCELLED', name: 'Cancelled', order: 8, isFinal: true, color: '#EF4444', icon: 'x-circle' },
      { code: 'NO_SHOW', name: 'No Show', order: 9, isFinal: true, color: '#EF4444', icon: 'user-x' }
    ],
    transitions: [
      { from: 'SCHEDULED', to: 'CONFIRMED' },
      { from: 'SCHEDULED', to: 'CANCELLED' },
      { from: 'CONFIRMED', to: 'REMINDED', automatic: true },
      { from: 'CONFIRMED', to: 'CANCELLED' },
      { from: 'REMINDED', to: 'CHECKED_IN' },
      { from: 'REMINDED', to: 'NO_SHOW' },
      { from: 'CHECKED_IN', to: 'IN_SERVICE' },
      { from: 'IN_SERVICE', to: 'COMPLETED' },
      { from: 'COMPLETED', to: 'PAID' }
    ]
  },
  
  INVOICE: {
    name: 'Invoice Workflow',
    code: 'INVOICE',
    stages: [
      { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true, color: '#6B7280', icon: 'file-text' },
      { code: 'SENT', name: 'Sent', order: 2, color: '#3B82F6', icon: 'send' },
      { code: 'VIEWED', name: 'Viewed', order: 3, color: '#8B5CF6', icon: 'eye' },
      { code: 'PARTIALLY_PAID', name: 'Partially Paid', order: 4, color: '#F59E0B', icon: 'credit-card' },
      { code: 'PAID', name: 'Paid', order: 5, isFinal: true, color: '#10B981', icon: 'check-circle' },
      { code: 'OVERDUE', name: 'Overdue', order: 6, color: '#EF4444', icon: 'alert-circle' },
      { code: 'VOID', name: 'Void', order: 7, isFinal: true, color: '#6B7280', icon: 'x-circle' }
    ],
    transitions: [
      { from: 'DRAFT', to: 'SENT' },
      { from: 'SENT', to: 'VIEWED', automatic: true },
      { from: 'VIEWED', to: 'PARTIALLY_PAID' },
      { from: 'VIEWED', to: 'PAID' },
      { from: 'PARTIALLY_PAID', to: 'PAID' },
      { from: 'SENT', to: 'OVERDUE', automatic: true },
      { from: 'VIEWED', to: 'OVERDUE', automatic: true },
      { from: 'DRAFT', to: 'VOID' },
      { from: 'SENT', to: 'VOID' }
    ]
  },
  
  PURCHASE_ORDER: {
    name: 'Purchase Order Workflow',
    code: 'PURCHASE-ORDER',
    stages: [
      { code: 'DRAFT', name: 'Draft', order: 1, isInitial: true, color: '#6B7280', icon: 'file' },
      { code: 'SUBMITTED', name: 'Submitted', order: 2, color: '#3B82F6', icon: 'send' },
      { code: 'APPROVED', name: 'Approved', order: 3, color: '#10B981', icon: 'check-circle' },
      { code: 'ORDERED', name: 'Ordered', order: 4, color: '#8B5CF6', icon: 'shopping-cart' },
      { code: 'RECEIVED', name: 'Received', order: 5, color: '#F59E0B', icon: 'package' },
      { code: 'COMPLETED', name: 'Completed', order: 6, isFinal: true, color: '#10B981', icon: 'check-circle' },
      { code: 'CANCELLED', name: 'Cancelled', order: 7, isFinal: true, color: '#EF4444', icon: 'x-circle' }
    ],
    transitions: [
      { from: 'DRAFT', to: 'SUBMITTED' },
      { from: 'SUBMITTED', to: 'APPROVED', requiresApproval: true },
      { from: 'SUBMITTED', to: 'CANCELLED' },
      { from: 'APPROVED', to: 'ORDERED' },
      { from: 'ORDERED', to: 'RECEIVED' },
      { from: 'RECEIVED', to: 'COMPLETED' },
      { from: 'ORDERED', to: 'CANCELLED' }
    ]
  }
}

async function setupWorkflowTemplate(orgId, template) {
  console.log(`\n📋 Setting up ${template.name}...`)
  
  try {
    // Check if workflow template already exists
    const { data: existingWorkflow } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_template')
      .eq('entity_code', template.code)
      .single()
    
    if (existingWorkflow) {
      console.log('  ✓ Workflow template already exists')
      return existingWorkflow.id
    }
    
    // Create workflow template entity
    const { data: workflow, error: workflowError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'workflow_template',
        entity_name: template.name,
        entity_code: template.code,
        smart_code: `HERA.WORKFLOW.TEMPLATE.${template.code}.v1`,
        status: 'active',
        metadata: {
          transitions: template.transitions,
          auto_assign: true
        }
      })
      .select()
      .single()
    
    if (workflowError) throw workflowError
    console.log(`  ✅ Created workflow template: ${workflow.id}`)
    
    // Create status entities
    const statusMap = {}
    
    for (const stage of template.stages) {
      // Check if status already exists
      const { data: existingStatus } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `STATUS-${template.code}-${stage.code}`)
        .single()
      
      if (existingStatus) {
        statusMap[stage.code] = existingStatus.id
        console.log(`  ✓ Status ${stage.name} already exists`)
        continue
      }
      
      // Create status entity
      const { data: status, error: statusError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'workflow_status',
          entity_name: stage.name,
          entity_code: `STATUS-${template.code}-${stage.code}`,
          smart_code: `HERA.WORKFLOW.STATUS.${stage.code}.v1`,
          status: 'active',
          metadata: {
            color: stage.color,
            icon: stage.icon,
            order: stage.order,
            is_initial: stage.isInitial || false,
            is_final: stage.isFinal || false
          }
        })
        .select()
        .single()
      
      if (statusError) throw statusError
      statusMap[stage.code] = status.id
      console.log(`  ✅ Created status: ${stage.name}`)
      
      // Link status to workflow
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: workflow.id,
          to_entity_id: status.id,
          relationship_type: 'has_stage',
          smart_code: 'HERA.WORKFLOW.STAGE.LINK.v1',
          relationship_data: {
            order: stage.order,
            is_initial: stage.isInitial,
            is_final: stage.isFinal
          }
        })
    }
    
    // Create transition relationships
    for (const transition of template.transitions) {
      const fromId = statusMap[transition.from]
      const toId = statusMap[transition.to]
      
      if (!fromId || !toId) continue
      
      const { error: transitionError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: fromId,
          to_entity_id: toId,
          relationship_type: 'can_transition_to',
          smart_code: 'HERA.WORKFLOW.TRANSITION.ALLOWED.v1',
          relationship_data: {
            requires_approval: transition.requiresApproval || false,
            automatic: transition.automatic || false,
            requires_action: transition.requiresAction,
            requires_confirmation: transition.requiresConfirmation || false
          }
        })
      
      if (transitionError) {
        console.error(`  ⚠️ Failed to create transition ${transition.from} → ${transition.to}:`, transitionError.message)
      } else {
        console.log(`  ✅ Created transition: ${transition.from} → ${transition.to}`)
      }
    }
    
    return workflow.id
  } catch (error) {
    console.error(`  ❌ Error setting up workflow:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🔄 Setting up Universal Workflow System...\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    // Setup each workflow template
    for (const [key, template] of Object.entries(WORKFLOW_TEMPLATES)) {
      await setupWorkflowTemplate(orgId, template)
    }
    
    console.log('\n✅ Universal Workflow System setup complete!')
    console.log('\n📊 Summary:')
    console.log(`  - ${Object.keys(WORKFLOW_TEMPLATES).length} workflow templates created`)
    console.log(`  - Ready for use across all HERA applications`)
    console.log('\n🚀 Usage:')
    console.log('  1. Import UniversalWorkflow from @/lib/universal-workflow')
    console.log('  2. Add UniversalWorkflowTracker component to your transactions')
    console.log('  3. Workflows will automatically track status changes')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
main()