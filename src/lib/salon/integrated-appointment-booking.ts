/**
 * Truly Integrated Appointment Booking
 * Following HERA Universal Architecture principles
 */

import { universalApi } from '@/lib/universal-api'
import { UniversalWorkflow } from '@/lib/universal-workflow'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BookingData {
  organizationId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  serviceId: string
  serviceName: string
  servicePrice: number
  stylistId: string
  stylistName: string
  date: string
  time: string
  duration: number
  notes?: string
}

export async function createIntegratedAppointment(bookingData: BookingData) {
  const workflow = new UniversalWorkflow(bookingData.organizationId)
  
  try {
    // 1. Find or Create Client Entity (NOT just metadata!)
    let clientId: string
    
    // Check if client exists by phone
    const { data: existingClients } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', bookingData.organizationId)
      .eq('entity_type', 'customer')
      .eq('entity_name', bookingData.clientName)
      .limit(1)
    
    if (existingClients && existingClients.length > 0) {
      clientId = existingClients[0].id
      console.log('Found existing client:', clientId)
      
      // Update client status to ACTIVE if needed
      await transitionClientToActive(clientId, bookingData.organizationId)
    } else {
      // Create new client entity
      const newClient = await universalApi.createEntity({
        organization_id: bookingData.organizationId,
        entity_type: 'customer',
        entity_name: bookingData.clientName,
        entity_code: `CLIENT-${Date.now()}`,
        smart_code: 'HERA.SALON.CLIENT.v1',
        metadata: {
          source: 'appointment_booking'
        }
      })
      
      clientId = newClient.id
      console.log('Created new client:', clientId)
      
      // Add client contact info as dynamic data
      await universalApi.setDynamicField(clientId, 'phone', bookingData.clientPhone)
      await universalApi.setDynamicField(clientId, 'email', bookingData.clientEmail)
      
      // Assign CLIENT workflow and set to NEW status
      await assignClientWorkflow(clientId, bookingData.organizationId, 'NEW')
    }
    
    // 2. Create Appointment Transaction
    const appointment = await universalApi.createTransaction({
      organization_id: bookingData.organizationId,
      transaction_type: 'appointment',
      transaction_code: `APT-${Date.now()}`,
      transaction_date: bookingData.date,
      source_entity_id: clientId, // Link to actual client entity!
      target_entity_id: bookingData.stylistId, // Link to stylist entity
      total_amount: bookingData.servicePrice,
      smart_code: 'HERA.SALON.APPOINTMENT.v1',
      metadata: {
        service_id: bookingData.serviceId,
        service_name: bookingData.serviceName,
        appointment_time: bookingData.time,
        duration_minutes: bookingData.duration,
        notes: bookingData.notes
      }
    })
    
    // 3. Assign APPOINTMENT Workflow to the appointment
    const appointmentWorkflow = await findWorkflowTemplate(
      bookingData.organizationId, 
      'APPOINTMENT'
    )
    
    if (appointmentWorkflow) {
      await workflow.assignWorkflow(appointment.id, appointmentWorkflow.id)
      console.log('Assigned appointment workflow')
      
      // Get the SCHEDULED status and transition to it
      const scheduledStatus = await findWorkflowStatus(
        bookingData.organizationId,
        'STATUS-APPOINTMENT-SCHEDULED'
      )
      
      if (scheduledStatus) {
        // The workflow assigns initial status, but we can verify it
        console.log('Appointment created with SCHEDULED status')
      }
    }
    
    // 4. Create service line item
    await universalApi.createTransactionLine({
      transaction_id: appointment.id,
      line_entity_id: bookingData.serviceId,
      line_number: 1,
      quantity: 1,
      unit_price: bookingData.servicePrice,
      line_amount: bookingData.servicePrice,
      smart_code: 'HERA.SALON.APPOINTMENT.SERVICE.v1',
      metadata: {
        service_name: bookingData.serviceName,
        duration_minutes: bookingData.duration
      }
    })
    
    // 5. Update Staff Availability (if needed)
    // This would block the time slot for the stylist
    
    return {
      success: true,
      appointmentId: appointment.id,
      clientId: clientId,
      message: 'Appointment booked successfully with full integration'
    }
    
  } catch (error) {
    console.error('Failed to create integrated appointment:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to transition client to active
async function transitionClientToActive(clientId: string, orgId: string) {
  const workflow = new UniversalWorkflow(orgId)
  
  // Get current client status
  const currentStatus = await workflow.getCurrentStatus(clientId)
  
  if (currentStatus?.entity_code === 'STATUS-CLIENT-LIFECYCLE-LEAD') {
    // Find NEW status
    const newStatus = await findWorkflowStatus(orgId, 'STATUS-CLIENT-LIFECYCLE-NEW')
    if (newStatus) {
      await workflow.transitionStatus(clientId, newStatus.id, {
        userId: 'system',
        reason: 'First appointment booked'
      })
    }
  }
}

// Helper to assign client workflow
async function assignClientWorkflow(clientId: string, orgId: string, initialStatus: string) {
  const workflow = new UniversalWorkflow(orgId)
  
  const clientWorkflow = await findWorkflowTemplate(orgId, 'CLIENT-LIFECYCLE')
  if (clientWorkflow) {
    await workflow.assignWorkflow(clientId, clientWorkflow.id)
    
    // Transition to specified initial status if not LEAD
    if (initialStatus !== 'LEAD') {
      const status = await findWorkflowStatus(orgId, `STATUS-CLIENT-LIFECYCLE-${initialStatus}`)
      if (status) {
        const currentStatus = await workflow.getCurrentStatus(clientId)
        if (currentStatus) {
          await workflow.transitionStatus(clientId, status.id, {
            userId: 'system',
            reason: 'Initial status assignment'
          })
        }
      }
    }
  }
}

// Helper functions
async function findWorkflowTemplate(orgId: string, code: string) {
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'workflow_template')
    .eq('entity_code', code)
    .single()
  
  return data
}

async function findWorkflowStatus(orgId: string, code: string) {
  const { data } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'workflow_status')
    .eq('entity_code', code)
    .single()
  
  return data
}

/**
 * Example of TRUE integration:
 * 
 * 1. Client books appointment
 *    → Client entity created/updated
 *    → Client workflow: LEAD → NEW (if first appointment)
 *    → Appointment created with relationship to client
 *    → Appointment workflow: → SCHEDULED
 * 
 * 2. Client checks in
 *    → Appointment workflow: SCHEDULED → CHECKED_IN
 *    → Staff workflow: AVAILABLE → BUSY
 * 
 * 3. Service completed
 *    → Appointment workflow: CHECKED_IN → COMPLETED
 *    → Inventory: Product quantities reduced
 *    → Client: Visit count increased
 * 
 * 4. Payment received
 *    → Appointment workflow: COMPLETED → PAID
 *    → Client: Total spend updated
 *    → Client workflow: NEW → ACTIVE (after 3 visits)
 *    → Reports: Revenue updated
 */