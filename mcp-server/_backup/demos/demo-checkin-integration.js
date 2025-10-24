#!/usr/bin/env node
/**
 * Demo: Check-In Integration
 * Shows the complete check-in flow with workflow transitions
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

async function demoCheckInFlow(orgId) {
  console.log('🚀 DEMONSTRATING CHECK-IN INTEGRATION')
  console.log('=' .repeat(50))
  
  try {
    // 1. First, get an appointment with SCHEDULED status
    const { data: scheduledAppointments } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        client:source_entity_id(id, entity_name),
        stylist:target_entity_id(id, entity_name),
        status_relationships:core_relationships!from_entity_id(
          id,
          to_entity:to_entity_id(id, entity_name, entity_code),
          relationship_data
        )
      `)
      .eq('organization_id', orgId)
      .eq('transaction_type', 'appointment')
      .eq('status_relationships.relationship_type', 'has_workflow_status')
      .eq('status_relationships.relationship_data->is_active', 'true')
      .limit(1)
    
    if (!scheduledAppointments || scheduledAppointments.length === 0) {
      console.log('❌ No scheduled appointments found. Create one first.')
      return
    }
    
    const appointment = scheduledAppointments[0]
    const currentStatus = appointment.status_relationships?.[0]?.to_entity
    
    console.log('\n📅 Found Appointment:')
    console.log(`   ID: ${appointment.transaction_code}`)
    console.log(`   Client: ${appointment.client?.entity_name || 'Unknown'}`)
    console.log(`   Stylist: ${appointment.stylist?.entity_name || 'Unknown'}`)
    console.log(`   Current Status: ${currentStatus?.entity_name}`)
    
    if (currentStatus?.entity_code !== 'STATUS-APPOINTMENT-SCHEDULED') {
      console.log(`\n⚠️  Appointment is not in SCHEDULED status. Current: ${currentStatus?.entity_code}`)
      return
    }
    
    // 2. Simulate Check-In Process
    console.log('\n✅ Processing Check-In...')
    
    // Find CHECKED_IN status
    const { data: checkedInStatus } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-APPOINTMENT-CHECKED_IN')
      .single()
    
    if (!checkedInStatus) {
      console.log('❌ CHECKED_IN status not found in workflow')
      return
    }
    
    // 3. Transition appointment status
    console.log('\n📝 Updating Appointment Status...')
    
    // End current status
    await supabase
      .from('core_relationships')
      .update({
        relationship_data: {
          ...appointment.status_relationships[0].relationship_data,
          is_active: false,
          ended_at: new Date().toISOString()
        }
      })
      .eq('id', appointment.status_relationships[0].id)
    
    // Create new status
    const { data: newRelationship } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: appointment.id,
        to_entity_id: checkedInStatus.id,
        relationship_type: 'has_workflow_status',
        smart_code: 'HERA.WORKFLOW.APPOINTMENT.CHECKIN.v1',
        relationship_data: {
          previous_status_id: currentStatus.id,
          transitioned_by: 'reception_demo',
          transitioned_at: new Date().toISOString(),
          checked_in_at: new Date().toISOString(),
          is_active: true
        }
      })
      .select()
      .single()
    
    console.log('   ✓ Appointment status: SCHEDULED → CHECKED_IN')
    
    // 4. Update Staff Status to BUSY
    if (appointment.target_entity_id) {
      console.log('\n👤 Updating Staff Status...')
      
      // Check current staff status
      const { data: staffStatus } = await supabase
        .from('core_relationships')
        .select(`
          id,
          to_entity:to_entity_id(id, entity_code),
          relationship_data
        `)
        .eq('from_entity_id', appointment.target_entity_id)
        .eq('relationship_type', 'has_workflow_status')
        .eq('relationship_data->is_active', true)
        .single()
      
      // Find BUSY status
      const { data: busyStatus } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', 'STATUS-STAFF-BUSY')
        .single()
      
      if (busyStatus) {
        if (staffStatus) {
          // Update existing status
          await supabase
            .from('core_relationships')
            .update({
              relationship_data: {
                ...staffStatus.relationship_data,
                is_active: false,
                ended_at: new Date().toISOString()
              }
            })
            .eq('id', staffStatus.id)
        }
        
        // Create new BUSY status
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: orgId,
            from_entity_id: appointment.target_entity_id,
            to_entity_id: busyStatus.id,
            relationship_type: 'has_workflow_status',
            smart_code: 'HERA.WORKFLOW.STAFF.BUSY.v1',
            relationship_data: {
              trigger: 'appointment_checkin',
              appointment_id: appointment.id,
              is_active: true,
              assigned_at: new Date().toISOString()
            }
          })
        
        console.log('   ✓ Staff status: AVAILABLE → BUSY')
      }
    }
    
    // 5. Create check-in event for audit
    console.log('\n📋 Creating Audit Event...')
    
    const { data: checkInEvent } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'event',
        entity_name: 'Client Check-In',
        entity_code: `EVENT-CHECKIN-${Date.now()}`,
        smart_code: 'HERA.SALON.EVENT.CHECKIN.v1',
        metadata: {
          event_type: 'check_in',
          appointment_id: appointment.id,
          client_id: appointment.source_entity_id,
          stylist_id: appointment.target_entity_id,
          checked_in_at: new Date().toISOString(),
          checked_in_by: 'reception_demo'
        }
      })
      .select()
      .single()
    
    console.log('   ✓ Check-in event created for audit trail')
    
    // 6. Show integrated results
    console.log('\n✨ CHECK-IN INTEGRATION COMPLETE!')
    console.log('=' .repeat(50))
    console.log('\n📊 What Just Happened:')
    console.log('1. Appointment transitioned: SCHEDULED → CHECKED_IN')
    console.log('2. Staff marked as BUSY (unavailable for walk-ins)')
    console.log('3. Check-in timestamp recorded')
    console.log('4. Audit event created for compliance')
    console.log('5. All updates via relationships (no status columns!)')
    
    console.log('\n🔄 Next Steps in Workflow:')
    console.log('1. Start Service → Status: CHECKED_IN → IN_SERVICE')
    console.log('2. Complete Service → Status: IN_SERVICE → COMPLETED')
    console.log('3. Process Payment → Status: COMPLETED → PAID')
    console.log('4. Each transition triggers business logic')
    
    // 7. Show waiting room view
    console.log('\n👀 Waiting Room View:')
    
    const { data: waitingClients } = await supabase
      .from('universal_transactions')
      .select(`
        transaction_code,
        client:source_entity_id(entity_name),
        metadata,
        status_relationships:core_relationships!from_entity_id(
          to_entity:to_entity_id(entity_code),
          relationship_data
        )
      `)
      .eq('organization_id', orgId)
      .eq('transaction_type', 'appointment')
      .eq('transaction_date', new Date().toISOString().split('T')[0])
      .eq('status_relationships.relationship_type', 'has_workflow_status')
      .eq('status_relationships.relationship_data->is_active', true)
    
    const checkedIn = waitingClients?.filter(apt => 
      apt.status_relationships?.[0]?.to_entity?.entity_code === 'STATUS-APPOINTMENT-CHECKED_IN'
    ) || []
    
    console.log(`\nClients currently waiting: ${checkedIn.length}`)
    checkedIn.forEach((apt, index) => {
      const checkedInAt = apt.status_relationships[0].relationship_data.checked_in_at
      const waitTime = Math.floor((new Date() - new Date(checkedInAt)) / 1000 / 60)
      console.log(`${index + 1}. ${apt.client?.entity_name} - Waiting ${waitTime} minutes`)
    })
    
  } catch (error) {
    console.error('\n❌ Check-in demo failed:', error)
  }
}

// Main execution
async function main() {
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}\n`)
  
  await demoCheckInFlow(orgId)
}

main()