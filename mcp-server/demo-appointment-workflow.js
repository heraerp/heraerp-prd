#!/usr/bin/env node
/**
 * Demo: Appointment with Workflow Integration
 * Shows how workflows automatically track appointment lifecycle
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

async function findWorkflowTemplate(orgId, code) {
  const { data, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'workflow_template')
    .eq('entity_code', code)
    .single()
  
  if (error) {
    console.error('Failed to find workflow template:', error)
    return null
  }
  
  return data
}

async function getInitialStatus(workflowId, orgId) {
  // Get stages linked to workflow
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('to_entity_id, metadata')
    .eq('organization_id', orgId)
    .eq('from_entity_id', workflowId)
    .eq('relationship_type', 'has_stage')
    .eq('relationship_data->is_initial', true)
    .single()
  
  if (!relationships) return null
  
  // Get the status entity
  const { data: status } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', relationships.to_entity_id)
    .single()
  
  return status
}

async function createAppointmentWithWorkflow(orgId) {
  console.log('\n📅 Creating appointment with automatic workflow assignment...\n')
  
  try {
    // Find customer and service
    const { data: customer } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'customer')
      .limit(1)
      .single()
    
    const { data: service } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', orgId)
      .eq('entity_type', 'service')
      .limit(1)
      .single()
    
    if (!customer || !service) {
      console.error('❌ No customer or service found. Run setup-salon-workflow.js first.')
      return
    }
    
    // Find appointment workflow template
    const workflowTemplate = await findWorkflowTemplate(orgId, 'APPOINTMENT')
    
    if (!workflowTemplate) {
      console.error('❌ Appointment workflow not found. Run setup-universal-workflow.js first.')
      return
    }
    
    console.log('✅ Found workflow template:', workflowTemplate.entity_name)
    
    // Get initial status
    const initialStatus = await getInitialStatus(workflowTemplate.id, orgId)
    
    if (!initialStatus) {
      console.error('❌ No initial status found for workflow')
      return
    }
    
    console.log('✅ Initial status:', initialStatus.entity_name)
    
    // Create appointment transaction
    const appointmentDate = new Date()
    appointmentDate.setHours(appointmentDate.getHours() + 24)
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: orgId,
        transaction_type: 'appointment',
        transaction_date: appointmentDate.toISOString(),
        transaction_code: `APT-${Date.now()}`,
        from_entity_id: customer.id,
        smart_code: 'HERA.SALON.APPOINTMENT.v1',
        total_amount: 150.00,
        status: 'active',
        metadata: {
          service_id: service.id,
          service_name: service.entity_name,
          duration_minutes: 60,
          stylist: 'Maria',
          notes: 'Regular customer, prefers organic products'
        }
      })
      .select()
      .single()
    
    if (appointmentError) throw appointmentError
    
    console.log(`\n✅ Created appointment: ${appointment.transaction_code}`)
    console.log(`   Customer: ${customer.entity_name}`)
    console.log(`   Service: ${service.entity_name}`)
    console.log(`   Date: ${appointmentDate.toLocaleString()}`)
    
    // Assign workflow status
    const { error: relationshipError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: appointment.id,
        to_entity_id: initialStatus.id,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.ASSIGN.INITIAL.v1',
        relationship_data: {
          workflow_template_id: workflowTemplate.id,
          started_at: new Date().toISOString(),
          is_active: true,
          assigned_by: 'system',
          assigned_reason: 'Automatic assignment on creation'
        }
      })
    
    if (relationshipError) throw relationshipError
    
    console.log(`\n✅ Workflow assigned automatically!`)
    console.log(`   Status: ${initialStatus.entity_name}`)
    console.log(`   Color: ${initialStatus.metadata?.color}`)
    
    return appointment
  } catch (error) {
    console.error('❌ Failed to create appointment with workflow:', error.message)
    throw error
  }
}

async function simulateWorkflowProgress(orgId, appointmentId) {
  console.log('\n🔄 Simulating appointment workflow progression...\n')
  
  try {
    // Get current status
    const { data: currentRel } = await supabase
      .from('core_relationships')
      .select('*, to_entity:to_entity_id(*)')
      .eq('from_entity_id', appointmentId)
      .eq('relationship_type', 'has_workflow_status')
      .eq('relationship_data->is_active', true)
      .single()
    
    if (!currentRel) {
      console.error('No current status found')
      return
    }
    
    const currentStatus = currentRel.to_entity
    console.log(`Current status: ${currentStatus.entity_name}`)
    
    // Get available transitions
    const { data: transitions } = await supabase
      .from('core_relationships')
      .select('*, to_entity:to_entity_id(*)')
      .eq('from_entity_id', currentStatus.id)
      .eq('relationship_type', 'can_transition_to')
    
    if (!transitions || transitions.length === 0) {
      console.log('No available transitions from current status')
      return
    }
    
    console.log('\nAvailable transitions:')
    transitions.forEach(t => {
      console.log(`  → ${t.to_entity.entity_name}`)
    })
    
    // Transition to next status (first available)
    const nextStatus = transitions[0].to_entity
    
    // End current status
    await supabase
      .from('core_relationships')
      .update({
        relationship_data: {
          ...currentRel.relationship_data,
          is_active: false,
          ended_at: new Date().toISOString()
        }
      })
      .eq('id', currentRel.id)
    
    // Create new status relationship
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: appointmentId,
        to_entity_id: nextStatus.id,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.TRANSITION.v1',
        relationship_data: {
          previous_status_id: currentStatus.id,
          transitioned_by: 'demo_user',
          reason: 'Customer confirmed appointment',
          transitioned_at: new Date().toISOString(),
          is_active: true,
          workflow_template_id: currentRel.relationship_data.workflow_template_id
        }
      })
    
    console.log(`\n✅ Transitioned to: ${nextStatus.entity_name}`)
    
  } catch (error) {
    console.error('❌ Failed to progress workflow:', error.message)
  }
}

async function showWorkflowHistory(appointmentId) {
  console.log('\n📋 Appointment Workflow History:\n')
  
  try {
    const { data: history } = await supabase
      .from('core_relationships')
      .select('*, to_entity:to_entity_id(*)')
      .eq('from_entity_id', appointmentId)
      .eq('relationship_type', 'has_workflow_status')
      .order('created_at', { ascending: false })
    
    if (!history || history.length === 0) {
      console.log('No workflow history found')
      return
    }
    
    history.forEach((item, index) => {
      const status = item.to_entity
      const isActive = item.relationship_data?.is_active || false
      
      console.log(`${index + 1}. ${status.entity_name} ${isActive ? '(CURRENT)' : ''}`)
      console.log(`   Assigned: ${new Date(item.created_at).toLocaleString()}`)
      if (item.relationship_data?.transitioned_by) {
        console.log(`   By: ${item.relationship_data.transitioned_by}`)
      }
      if (item.relationship_data?.reason) {
        console.log(`   Reason: ${item.relationship_data.reason}`)
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Failed to get workflow history:', error.message)
  }
}

async function main() {
  console.log('🚀 Universal Workflow Integration Demo\n')
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}`)
  
  try {
    // Create appointment with automatic workflow
    const appointment = await createAppointmentWithWorkflow(orgId)
    
    if (!appointment) return
    
    // Simulate workflow progression
    await simulateWorkflowProgress(orgId, appointment.id)
    
    // Show complete history
    await showWorkflowHistory(appointment.id)
    
    console.log('\n✅ Demo complete! Workflow integration working perfectly.')
    console.log('\n💡 Next steps:')
    console.log('  1. View appointment in the UI to see workflow status')
    console.log('  2. Use UniversalWorkflowTracker component for status changes')
    console.log('  3. Workflows automatically track all status transitions')
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo
main()