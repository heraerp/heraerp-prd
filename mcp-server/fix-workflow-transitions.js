#!/usr/bin/env node
/**
 * Fix workflow transitions by creating missing relationships
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

// Workflow transition definitions
const WORKFLOW_TRANSITIONS = {
  'SALES-ORDER': [
    { from: 'DRAFT', to: 'SUBMITTED' },
    { from: 'SUBMITTED', to: 'APPROVED', requiresApproval: true },
    { from: 'SUBMITTED', to: 'CANCELLED' },
    { from: 'APPROVED', to: 'PROCESSING', automatic: true },
    { from: 'PROCESSING', to: 'SHIPPED' },
    { from: 'SHIPPED', to: 'DELIVERED' },
    { from: 'APPROVED', to: 'CANCELLED' },
    { from: 'PROCESSING', to: 'CANCELLED' }
  ],
  'APPOINTMENT': [
    { from: 'SCHEDULED', to: 'CONFIRMED' },
    { from: 'SCHEDULED', to: 'CANCELLED' },
    { from: 'CONFIRMED', to: 'REMINDED', automatic: true },
    { from: 'CONFIRMED', to: 'CANCELLED' },
    { from: 'REMINDED', to: 'CHECKED_IN' },
    { from: 'REMINDED', to: 'NO_SHOW' },
    { from: 'CHECKED_IN', to: 'IN_SERVICE' },
    { from: 'IN_SERVICE', to: 'COMPLETED' },
    { from: 'COMPLETED', to: 'PAID' }
  ],
  'INVOICE': [
    { from: 'DRAFT', to: 'SENT' },
    { from: 'SENT', to: 'VIEWED', automatic: true },
    { from: 'VIEWED', to: 'PARTIALLY_PAID' },
    { from: 'VIEWED', to: 'PAID' },
    { from: 'PARTIALLY_PAID', to: 'PAID' },
    { from: 'SENT', to: 'OVERDUE', automatic: true },
    { from: 'VIEWED', to: 'OVERDUE', automatic: true },
    { from: 'DRAFT', to: 'VOID' },
    { from: 'SENT', to: 'VOID' }
  ],
  'PURCHASE-ORDER': [
    { from: 'DRAFT', to: 'SUBMITTED' },
    { from: 'SUBMITTED', to: 'APPROVED', requiresApproval: true },
    { from: 'SUBMITTED', to: 'CANCELLED' },
    { from: 'APPROVED', to: 'ORDERED' },
    { from: 'ORDERED', to: 'RECEIVED' },
    { from: 'RECEIVED', to: 'COMPLETED' },
    { from: 'ORDERED', to: 'CANCELLED' }
  ]
}

async function fixWorkflowTransitions(orgId) {
  console.log('🔧 Fixing workflow transitions...\n')
  
  for (const [workflowCode, transitions] of Object.entries(WORKFLOW_TRANSITIONS)) {
    console.log(`\n📋 Processing ${workflowCode} transitions...`)
    
    // Get workflow template
    const { data: workflow } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_template')
      .eq('entity_code', workflowCode)
      .single()
    
    if (!workflow) {
      console.log(`  ⚠️ Workflow template ${workflowCode} not found`)
      continue
    }
    
    // Process each transition
    for (const transition of transitions) {
      // Find from status
      const { data: fromStatus } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `STATUS-${workflowCode}-${transition.from}`)
        .single()
      
      // Find to status
      const { data: toStatus } = await supabase
        .from('core_entities')
        .select('id, entity_name')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `STATUS-${workflowCode}-${transition.to}`)
        .single()
      
      if (!fromStatus || !toStatus) {
        console.log(`  ⚠️ Status not found: ${transition.from} → ${transition.to}`)
        continue
      }
      
      // Check if transition already exists
      const { data: existing } = await supabase
        .from('core_relationships')
        .select('id')
        .eq('organization_id', orgId)
        .eq('from_entity_id', fromStatus.id)
        .eq('to_entity_id', toStatus.id)
        .eq('relationship_type', 'can_transition_to')
        .single()
      
      if (existing) {
        console.log(`  ✓ Transition exists: ${fromStatus.entity_name} → ${toStatus.entity_name}`)
        continue
      }
      
      // Create transition
      const { error } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: fromStatus.id,
          to_entity_id: toStatus.id,
          relationship_type: 'can_transition_to',
          smart_code: 'HERA.WORKFLOW.TRANSITION.ALLOWED.v1',
          relationship_data: {
            requires_approval: transition.requiresApproval || false,
            automatic: transition.automatic || false,
            requires_action: transition.requiresAction,
            requires_confirmation: transition.requiresConfirmation || false
          }
        })
      
      if (error) {
        console.error(`  ❌ Failed to create transition: ${error.message}`)
      } else {
        console.log(`  ✅ Created transition: ${fromStatus.entity_name} → ${toStatus.entity_name}`)
      }
    }
  }
}

async function main() {
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    await fixWorkflowTransitions(orgId)
    console.log('\n✅ Workflow transitions fixed!')
  } catch (error) {
    console.error('\n❌ Failed to fix transitions:', error)
    process.exit(1)
  }
}

main()