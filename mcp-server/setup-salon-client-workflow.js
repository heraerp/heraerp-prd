#!/usr/bin/env node
/**
 * Setup Salon Client Lifecycle Workflow
 * Creates workflow for tracking clients from lead to VIP status
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

// Client Lifecycle Workflow Definition
const CLIENT_WORKFLOW = {
  name: 'Client Lifecycle Workflow',
  code: 'CLIENT-LIFECYCLE',
  stages: [
    { code: 'LEAD', name: 'Lead', order: 1, isInitial: true, color: '#6B7280', icon: 'user-plus' },
    { code: 'NEW', name: 'New Client', order: 2, color: '#3B82F6', icon: 'user' },
    { code: 'ACTIVE', name: 'Active', order: 3, color: '#10B981', icon: 'user-check' },
    { code: 'VIP', name: 'VIP', order: 4, color: '#F59E0B', icon: 'star' },
    { code: 'INACTIVE', name: 'Inactive', order: 5, color: '#EF4444', icon: 'user-x' },
    { code: 'REACTIVATED', name: 'Reactivated', order: 6, color: '#8B5CF6', icon: 'refresh' }
  ],
  transitions: [
    { from: 'LEAD', to: 'NEW' },
    { from: 'NEW', to: 'ACTIVE' },
    { from: 'ACTIVE', to: 'VIP', requiresApproval: true, requiresMetric: 'total_spend > 1000' },
    { from: 'ACTIVE', to: 'INACTIVE', automatic: true, condition: 'no_visit_6_months' },
    { from: 'VIP', to: 'INACTIVE', automatic: true, condition: 'no_visit_6_months' },
    { from: 'INACTIVE', to: 'REACTIVATED' },
    { from: 'REACTIVATED', to: 'ACTIVE' },
    { from: 'NEW', to: 'INACTIVE', condition: 'no_booking_30_days' }
  ]
}

async function setupClientWorkflow(orgId) {
  console.log('\n👥 Setting up Client Lifecycle Workflow...\n')
  
  try {
    // Check if workflow already exists
    const { data: existingWorkflow } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_template')
      .eq('entity_code', CLIENT_WORKFLOW.code)
      .single()
    
    if (existingWorkflow) {
      console.log('  ✓ Client workflow template already exists')
      return existingWorkflow.id
    }
    
    // Create workflow template
    const { data: workflow, error: workflowError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'workflow_template',
        entity_name: CLIENT_WORKFLOW.name,
        entity_code: CLIENT_WORKFLOW.code,
        smart_code: `HERA.SALON.WORKFLOW.CLIENT.v1`,
        status: 'active',
        metadata: {
          transitions: CLIENT_WORKFLOW.transitions,
          auto_assign: true,
          entity_types: ['customer'],
          business_rules: {
            vip_threshold: 1000,
            inactive_days: 180,
            new_client_grace_period: 30
          }
        }
      })
      .select()
      .single()
    
    if (workflowError) throw workflowError
    console.log(`  ✅ Created client workflow template`)
    
    // Create status entities
    const statusMap = {}
    
    for (const stage of CLIENT_WORKFLOW.stages) {
      const { data: status, error: statusError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'workflow_status',
          entity_name: stage.name,
          entity_code: `STATUS-CLIENT-${stage.code}`,
          smart_code: `HERA.SALON.STATUS.CLIENT.${stage.code}.v1`,
          status: 'active',
          metadata: {
            color: stage.color,
            icon: stage.icon,
            order: stage.order,
            is_initial: stage.isInitial || false,
            is_final: stage.isFinal || false,
            description: getStatusDescription(stage.code)
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
    
    // Create transitions
    for (const transition of CLIENT_WORKFLOW.transitions) {
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
          smart_code: 'HERA.WORKFLOW.TRANSITION.CLIENT.v1',
          relationship_data: {
            requires_approval: transition.requiresApproval || false,
            automatic: transition.automatic || false,
            condition: transition.condition,
            requires_metric: transition.requiresMetric
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
    console.error('  ❌ Error setting up client workflow:', error.message)
    throw error
  }
}

function getStatusDescription(code) {
  const descriptions = {
    LEAD: 'Potential client who has shown interest but not booked yet',
    NEW: 'Client who has completed their first appointment',
    ACTIVE: 'Regular client with consistent bookings',
    VIP: 'High-value client with special privileges',
    INACTIVE: 'Client who has not visited in 6+ months',
    REACTIVATED: 'Previously inactive client who has returned'
  }
  return descriptions[code] || ''
}

async function createSampleClients(orgId) {
  console.log('\n📋 Creating sample clients with workflow...\n')
  
  const sampleClients = [
    { name: 'Emma Johnson', email: 'emma@example.com', phone: '555-0101', status: 'NEW' },
    { name: 'Sophia Williams', email: 'sophia@example.com', phone: '555-0102', status: 'ACTIVE' },
    { name: 'Isabella Brown', email: 'isabella@example.com', phone: '555-0103', status: 'VIP' },
    { name: 'Olivia Davis', email: 'olivia@example.com', phone: '555-0104', status: 'LEAD' }
  ]
  
  for (const clientData of sampleClients) {
    try {
      // Create client entity
      const { data: client } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'customer',
          entity_name: clientData.name,
          entity_code: `CLIENT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: 'HERA.SALON.CLIENT.v1',
          status: 'active'
        })
        .select()
        .single()
      
      if (!client) continue
      
      // Add contact information
      const fields = [
        { field_name: 'email', field_value_text: clientData.email },
        { field_name: 'phone', field_value_text: clientData.phone },
        { field_name: 'preferred_contact', field_value_text: 'email' },
        { field_name: 'birthday', field_value_text: '1990-05-15' }
      ]
      
      for (const field of fields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: orgId,
            entity_id: client.id,
            field_name: field.field_name,
            field_type: 'text',
            field_value_text: field.field_value_text,
            smart_code: `HERA.SALON.CLIENT.${field.field_name.toUpperCase()}.v1`
          })
      }
      
      // Assign workflow status
      const { data: statusEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `STATUS-CLIENT-${clientData.status}`)
        .single()
      
      if (statusEntity) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: orgId,
            from_entity_id: client.id,
            to_entity_id: statusEntity.id,
            relationship_type: 'has_workflow_status',
            smart_code: 'HERA.WORKFLOW.CLIENT.STATUS.v1',
            relationship_data: {
              workflow_template_id: 'CLIENT-LIFECYCLE',
              assigned_at: new Date().toISOString(),
              is_active: true,
              assigned_by: 'system'
            }
          })
        
        console.log(`  ✅ Created ${clientData.name} with ${clientData.status} status`)
      }
    } catch (error) {
      console.error(`  ❌ Failed to create ${clientData.name}:`, error.message)
    }
  }
}

async function main() {
  console.log('🏪 Salon Client Workflow Setup\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    // Setup workflow
    await setupClientWorkflow(orgId)
    
    // Create sample clients
    await createSampleClients(orgId)
    
    console.log('\n✅ Client workflow setup complete!')
    console.log('\n🚀 Next steps:')
    console.log('  1. View clients in the salon app')
    console.log('  2. Workflow statuses are automatically assigned')
    console.log('  3. Track client journey from lead to VIP')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
main()