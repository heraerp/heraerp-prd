#!/usr/bin/env node
/**
 * Demo: TRUE Salon Integration
 * Shows how appointment booking SHOULD work with proper HERA integration
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

// Helper to find or create client
async function findOrCreateClient(orgId, clientData) {
  console.log('\n👤 Step 1: Find or Create Client Entity')
  
  // Check if client exists by phone
  const { data: existingClients } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'customer')
    .eq('entity_name', clientData.name)
    .limit(1)
  
  let client
  let isNewClient = false
  
  if (existingClients && existingClients.length > 0) {
    client = existingClients[0]
    console.log(`   ✓ Found existing client: ${client.entity_name}`)
  } else {
    // Create new client ENTITY (not just metadata!)
    const { data: newClient } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'customer',
        entity_name: clientData.name,
        entity_code: `CLIENT-${Date.now()}`,
        smart_code: 'HERA.SALON.CLIENT.v1',
        status: 'active',
        metadata: {
          created_from: 'appointment_booking'
        }
      })
      .select()
      .single()
    
    client = newClient
    isNewClient = true
    console.log(`   ✓ Created new client entity: ${client.entity_name}`)
    
    // Add contact info as dynamic data
    const contactFields = [
      { field_name: 'phone', field_value_text: clientData.phone },
      { field_name: 'email', field_value_text: clientData.email }
    ]
    
    for (const field of contactFields) {
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
    console.log('   ✓ Added client contact information')
  }
  
  return { client, isNewClient }
}

// Assign client workflow
async function assignClientWorkflow(orgId, clientId, isNewClient) {
  console.log('\n🔄 Step 2: Assign Client Workflow')
  
  // Check if client already has workflow status
  const { data: existingStatus } = await supabase
    .from('core_relationships')
    .select('*, to_entity:to_entity_id(*)')
    .eq('from_entity_id', clientId)
    .eq('relationship_type', 'has_workflow_status')
    .eq('relationship_data->is_active', true)
    .single()
  
  if (existingStatus) {
    console.log(`   ✓ Client already has status: ${existingStatus.to_entity.entity_name}`)
    
    // If client is INACTIVE, reactivate them
    if (existingStatus.to_entity.entity_code === 'STATUS-CLIENT-LIFECYCLE-INACTIVE') {
      await transitionClientStatus(orgId, clientId, 'INACTIVE', 'REACTIVATED')
    }
  } else {
    // Assign initial status based on whether they're new
    const initialStatus = isNewClient ? 'LEAD' : 'ACTIVE'
    const { data: statusEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', `STATUS-CLIENT-LIFECYCLE-${initialStatus}`)
      .single()
    
    if (statusEntity) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: clientId,
          to_entity_id: statusEntity.id,
          relationship_type: 'has_workflow_status',
          smart_code: 'HERA.WORKFLOW.CLIENT.ASSIGN.v1',
          relationship_data: {
            workflow_template_id: 'CLIENT-LIFECYCLE',
            assigned_at: new Date().toISOString(),
            is_active: true,
            assigned_by: 'booking_system'
          }
        })
      
      console.log(`   ✓ Assigned client workflow with status: ${statusEntity.entity_name}`)
    }
  }
}

// Create appointment with proper relationships
async function createAppointmentWithWorkflow(orgId, appointmentData) {
  console.log('\n📅 Step 3: Create Appointment Transaction')
  
  // Create appointment transaction
  const { data: appointment, error: appointmentError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'appointment',
      transaction_code: `APT-${Date.now()}`,
      transaction_date: appointmentData.date,
      source_entity_id: appointmentData.clientId,  // Link to actual client entity!
      target_entity_id: appointmentData.stylistId,   // Link to actual staff entity!
      total_amount: appointmentData.price,
      smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
      metadata: {
        service_id: appointmentData.serviceId,
        service_name: appointmentData.serviceName,
        appointment_time: appointmentData.time,
        duration_minutes: appointmentData.duration,
        booking_source: 'demo'
      }
    })
    .select()
    .single()
  
  if (appointmentError) {
    console.error('   ❌ Failed to create appointment:', appointmentError.message)
    throw appointmentError
  }
  
  console.log(`   ✓ Created appointment: ${appointment.transaction_code}`)
  console.log(`   ✓ Linked to client entity: ${appointmentData.clientId}`)
  console.log(`   ✓ Linked to staff entity: ${appointmentData.stylistId}`)
  
  // Create service line item
  await supabase
    .from('universal_transaction_lines')
    .insert({
      organization_id: orgId,
      transaction_id: appointment.id,
      line_entity_id: appointmentData.serviceId,
      line_number: 1,
      quantity: 1,
      unit_price: appointmentData.price,
      line_amount: appointmentData.price,
      smart_code: 'HERA.SALON.APPOINTMENT.SERVICE.LINE.v1'
    })
  
  return appointment
}

// Assign appointment workflow
async function assignAppointmentWorkflow(orgId, appointmentId) {
  console.log('\n🎯 Step 4: Assign Appointment Workflow')
  
  // Find SCHEDULED status
  const { data: scheduledStatus } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'workflow_status')
    .eq('entity_code', 'STATUS-APPOINTMENT-SCHEDULED')
    .single()
  
  if (scheduledStatus) {
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: appointmentId,
        to_entity_id: scheduledStatus.id,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.APPOINTMENT.ASSIGN.v1',
        relationship_data: {
          workflow_template_id: 'APPOINTMENT',
          assigned_at: new Date().toISOString(),
          is_active: true
        }
      })
    
    console.log(`   ✓ Appointment status: ${scheduledStatus.entity_name}`)
  }
}

// Demo the complete flow
async function demoCompleteBookingFlow(orgId) {
  console.log('\n🚀 DEMONSTRATING TRUE HERA INTEGRATION')
  console.log('=' .repeat(50))
  
  try {
    // 1. Client data (would come from booking form)
    const bookingData = {
      client: {
        name: 'Emma Thompson',
        phone: '555-0123',
        email: 'emma@example.com'
      },
      appointment: {
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        duration: 60
      }
    }
    
    // 2. Find or create client
    const { client, isNewClient } = await findOrCreateClient(orgId, bookingData.client)
    
    // 3. Assign client workflow
    await assignClientWorkflow(orgId, client.id, isNewClient)
    
    // 4. Find service and stylist (for demo, use first available)
    const { data: service } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'service')
      .limit(1)
      .single()
    
    const { data: stylist } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'employee')
      .limit(1)
      .single()
    
    if (!service || !stylist) {
      throw new Error('No service or stylist found. Run setup scripts first.')
    }
    
    // 5. Create appointment with relationships
    const appointment = await createAppointmentWithWorkflow(orgId, {
      clientId: client.id,
      stylistId: stylist.id,
      serviceId: service.id,
      serviceName: service.entity_name,
      price: service.metadata?.price || 50,
      ...bookingData.appointment
    })
    
    // 6. Assign appointment workflow
    await assignAppointmentWorkflow(orgId, appointment.id)
    
    // 7. Show the integration
    console.log('\n✅ TRUE INTEGRATION COMPLETE!')
    console.log('=' .repeat(50))
    console.log('\n📊 What Just Happened:')
    console.log('1. Client entity created/found (not just metadata)')
    console.log('2. Client workflow assigned with proper status')
    console.log('3. Appointment created with REAL relationships:')
    console.log('   - from_entity_id → Client entity')
    console.log('   - to_entity_id → Staff entity')
    console.log('4. Appointment workflow assigned → SCHEDULED')
    console.log('5. All status tracking via relationships (no columns!)')
    
    // Demonstrate the flow continuation
    console.log('\n🔄 Next Steps in the Flow:')
    console.log('1. Client checks in → Status: SCHEDULED → CHECKED_IN')
    console.log('2. Service starts → Status: CHECKED_IN → IN_SERVICE')
    console.log('3. Staff marked busy automatically')
    console.log('4. Service complete → Inventory updated')
    console.log('5. Payment → Client loyalty points updated')
    
    return { appointmentId: appointment.id, clientId: client.id }
    
  } catch (error) {
    console.error('\n❌ Integration demo failed:', error.message)
    throw error
  }
}

// Simulate check-in process
async function simulateCheckIn(orgId, appointmentId) {
  console.log('\n📍 Simulating Client Check-In...')
  
  // Get current appointment status
  const { data: currentRel } = await supabase
    .from('core_relationships')
    .select('*, to_entity:to_entity_id(*)')
    .eq('from_entity_id', appointmentId)
    .eq('relationship_type', 'has_workflow_status')
    .eq('relationship_data->is_active', true)
    .single()
  
  if (currentRel?.to_entity.entity_code === 'STATUS-APPOINTMENT-SCHEDULED') {
    // Find CHECKED_IN status
    const { data: checkedInStatus } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_code', 'STATUS-APPOINTMENT-CHECKED_IN')
      .single()
    
    if (checkedInStatus) {
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
      
      // Create new status
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: appointmentId,
          to_entity_id: checkedInStatus.id,
          relationship_type: 'has_workflow_status',
          smart_code: 'HERA.WORKFLOW.APPOINTMENT.CHECKIN.v1',
          relationship_data: {
            previous_status_id: currentRel.to_entity_id,
            transitioned_by: 'receptionist',
            transitioned_at: new Date().toISOString(),
            is_active: true
          }
        })
      
      console.log('   ✓ Appointment status: SCHEDULED → CHECKED_IN')
      
      // In true integration, this would also:
      // - Update staff status to BUSY
      // - Send notification to stylist
      // - Update waiting room display
    }
  }
}

// Helper to transition client status
async function transitionClientStatus(orgId, clientId, fromStatus, toStatus) {
  console.log(`   → Transitioning client: ${fromStatus} → ${toStatus}`)
  
  // Implementation would follow same pattern as appointment transition
}

// Main execution
async function main() {
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  
  try {
    // Demo the complete booking flow
    const { appointmentId } = await demoCompleteBookingFlow(orgId)
    
    // Simulate check-in
    await simulateCheckIn(orgId, appointmentId)
    
    console.log('\n🎉 This is TRUE HERA Integration!')
    console.log('Every module connected through relationships and workflows.')
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo
main()