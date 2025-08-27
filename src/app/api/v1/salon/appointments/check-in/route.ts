import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UniversalWorkflow } from '@/lib/universal-workflow'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, organizationId, userId } = body
    
    if (!appointmentId || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Appointment ID and Organization ID required' 
      }, { status: 400 })
    }

    console.log('Processing check-in for appointment:', appointmentId)
    
    // 1. Get appointment details with current status
    const { data: appointment, error: appointmentError } = await supabase
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
      .eq('id', appointmentId)
      .eq('status_relationships.relationship_type', 'has_workflow_status')
      .eq('status_relationships.relationship_data->is_active', 'true')
      .single()
    
    if (appointmentError || !appointment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Appointment not found' 
      }, { status: 404 })
    }
    
    // 2. Verify current status is SCHEDULED
    const currentStatus = appointment.status_relationships?.[0]?.to_entity
    if (currentStatus?.entity_code !== 'STATUS-APPOINTMENT-SCHEDULED') {
      return NextResponse.json({ 
        success: false, 
        error: `Cannot check in from status: ${currentStatus?.entity_name || 'Unknown'}` 
      }, { status: 400 })
    }
    
    const workflow = new UniversalWorkflow(organizationId)
    
    // 3. Find CHECKED_IN status
    const { data: checkedInStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-APPOINTMENT-CHECKED_IN')
      .single()
    
    if (!checkedInStatus) {
      return NextResponse.json({ 
        success: false, 
        error: 'Check-in status not found in workflow' 
      }, { status: 500 })
    }
    
    // 4. Transition appointment to CHECKED_IN
    await workflow.transitionStatus(appointmentId, checkedInStatus.id, {
      userId: userId || 'system',
      reason: 'Client arrived for appointment',
      metadata: {
        checked_in_at: new Date().toISOString(),
        checked_in_by: userId || 'reception'
      }
    })
    
    console.log('Appointment checked in successfully')
    
    // 5. Update staff status to BUSY
    if (appointment.target_entity_id) {
      await updateStaffStatus(organizationId, appointment.target_entity_id, 'BUSY', userId)
    }
    
    // 6. Update appointment metadata
    await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...appointment.metadata,
          checked_in_at: new Date().toISOString(),
          checked_in_by: userId || 'reception',
          status: 'checked_in'
        }
      })
      .eq('id', appointmentId)
    
    // 7. Create check-in event for audit trail
    await createCheckInEvent(organizationId, appointmentId, appointment.source_entity_id, userId)
    
    // 8. Get updated appointment for response
    const { data: updatedAppointment } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        client:source_entity_id(id, entity_name),
        stylist:target_entity_id(id, entity_name),
        status_relationships:core_relationships!from_entity_id(
          to_entity:to_entity_id(entity_name, entity_code)
        )
      `)
      .eq('id', appointmentId)
      .eq('status_relationships.relationship_type', 'has_workflow_status')
      .eq('status_relationships.relationship_data->is_active', 'true')
      .single()
    
    const newStatus = updatedAppointment?.status_relationships?.[0]?.to_entity
    
    return NextResponse.json({ 
      success: true,
      appointment: {
        id: appointmentId,
        clientName: updatedAppointment?.client?.entity_name,
        stylistName: updatedAppointment?.stylist?.entity_name,
        status: newStatus?.entity_name || 'Checked In',
        statusCode: newStatus?.entity_code || 'STATUS-APPOINTMENT-CHECKED_IN',
        checkedInAt: new Date().toISOString()
      },
      message: 'Client checked in successfully'
    })
    
  } catch (error) {
    console.error('Error in check-in:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to update staff status
async function updateStaffStatus(
  organizationId: string, 
  staffId: string, 
  newStatusCode: string,
  userId?: string
) {
  try {
    const workflow = new UniversalWorkflow(organizationId)
    
    // Find the target status
    const statusMap: Record<string, string> = {
      'AVAILABLE': 'STATUS-STAFF-AVAILABLE',
      'BUSY': 'STATUS-STAFF-BUSY',
      'BREAK': 'STATUS-STAFF-BREAK',
      'OFF_DUTY': 'STATUS-STAFF-OFF_DUTY'
    }
    
    const targetStatusCode = statusMap[newStatusCode]
    
    const { data: targetStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', targetStatusCode)
      .single()
    
    if (targetStatus) {
      // Check if staff already has a workflow status
      const currentStatus = await workflow.getCurrentStatus(staffId)
      
      if (currentStatus) {
        // Transition to new status
        await workflow.transitionStatus(staffId, targetStatus.id, {
          userId: userId || 'system',
          reason: 'Appointment check-in',
          metadata: {
            trigger: 'appointment_checkin',
            updated_at: new Date().toISOString()
          }
        })
      } else {
        // Assign initial status
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: organizationId,
            from_entity_id: staffId,
            to_entity_id: targetStatus.id,
            relationship_type: 'has_workflow_status',
            smart_code: 'HERA.WORKFLOW.STAFF.STATUS.v1',
            relationship_data: {
              is_active: true,
              assigned_at: new Date().toISOString(),
              assigned_by: userId || 'system'
            }
          })
      }
      
      console.log(`Staff ${staffId} status updated to ${newStatusCode}`)
    }
  } catch (error) {
    console.error('Failed to update staff status:', error)
    // Don't fail the whole check-in if staff status update fails
  }
}

// Helper function to create check-in event
async function createCheckInEvent(
  organizationId: string,
  appointmentId: string,
  clientId: string | null,
  userId?: string
) {
  try {
    // Create an event entity for audit trail
    await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'event',
        entity_name: 'Client Check-In',
        entity_code: `EVENT-CHECKIN-${Date.now()}`,
        smart_code: 'HERA.SALON.EVENT.CHECKIN.v1',
        metadata: {
          event_type: 'check_in',
          appointment_id: appointmentId,
          client_id: clientId,
          checked_in_by: userId || 'reception',
          timestamp: new Date().toISOString()
        }
      })
    
    console.log('Check-in event created for audit trail')
  } catch (error) {
    console.error('Failed to create check-in event:', error)
    // Don't fail the check-in if event creation fails
  }
}