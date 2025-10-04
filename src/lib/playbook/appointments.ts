// ============================================================================
// HERA • Playbook Appointments Extended API
// ============================================================================

import { KanbanCard, KanbanStatus } from '@/schemas/kanban'
import { appointmentApi } from '@/lib/salon/appointment-api'
import { heraCode } from '@/lib/smart-codes'

// Dynamic data implementation
export const upsertDynamicData = async (params: {
  entity_id: string
  field_name: string
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_json?: any
  smart_code: string
  metadata?: any
}) => {
  try {
    // First try to update existing dynamic data
    const updateResponse = await fetch('/api/v1/universal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'core_dynamic_data',
        where: {
          entity_id: params.entity_id,
          field_name: params.field_name
        },
        data: {
          field_value_text: params.field_value_text,
          field_value_number: params.field_value_number,
          field_value_boolean: params.field_value_boolean,
          field_value_json: params.field_value_json,
          smart_code: params.smart_code,
          metadata: params.metadata
        }
      })
    })

    if (updateResponse.ok) {
      return true
    }

    // If update fails, try to create new record
    const createResponse = await fetch('/api/v1/universal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'core_dynamic_data',
        data: {
          entity_id: params.entity_id,
          field_name: params.field_name,
          field_value_text: params.field_value_text,
          field_value_number: params.field_value_number,
          field_value_boolean: params.field_value_boolean,
          field_value_json: params.field_value_json,
          smart_code: params.smart_code,
          metadata: params.metadata
        }
      })
    })

    return createResponse.ok
  } catch (error) {
    console.error('Error upserting dynamic data:', error)
    return false
  }
}

export interface AppointmentData {
  id: string
  organization_id: string
  branch_id: string
  customer_id: string
  customer_name: string
  service_id: string
  service_name: string
  staff_id?: string
  staff_name?: string
  start: string // ISO
  end: string // ISO
  status: KanbanStatus
  notes?: string
  metadata?: any
}

// Extended API for appointments with DRAFT support and reschedule
export async function listAppointmentsForKanban(params: {
  organization_id: string
  branch_id?: string
  date: string // YYYY-MM-DD
  dateFrom?: Date
  dateTo?: Date
}): Promise<KanbanCard[]> {
  const { organization_id, branch_id, date, dateFrom, dateTo } = params

  try {
    // Build URL with optional date range and branch filter
    let apiUrl = `/api/v1/salon/appointments?organization_id=${organization_id}`
    
    // If we have date range, use it; otherwise fall back to single date
    if (dateFrom && dateTo) {
      // Format dates for API
      const fromStr = dateFrom.toISOString().split('T')[0]
      const toStr = dateTo.toISOString().split('T')[0]
      apiUrl += `&date_from=${fromStr}&date_to=${toStr}`
    } else {
      apiUrl += `&date=${date}`
    }
    
    // Add branch filter if specified
    if (branch_id) {
      apiUrl += `&branch_id=${branch_id}`
    }
    
    console.log('Fetching appointments from:', apiUrl)

    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error(`API error: ${response.status}`)
      const errorText = await response.text()
      console.error('API error response:', errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('API response:', result)

    const { success, appointments } = result

    if (!success || !appointments) {
      console.log('No appointments found for date:', date)
      return []
    }

    const dateDisplay = dateFrom && dateTo 
      ? `${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`
      : date
    console.log(`📅 Found ${appointments.length} appointments for ${dateDisplay}`)

    // Transform appointments to KanbanCard format
    const cards: KanbanCard[] = []

    for (const apt of appointments) {
      // Map appointment status to kanban status
      let status: KanbanStatus = 'BOOKED'
      // Check metadata.status first (from kanban updates), then apt.status
      const aptStatus = apt.metadata?.status || apt.status || 'confirmed'

      // Log only unexpected statuses for debugging
      if (
        ![
          'CONFIRMED',
          'BOOKED',
          'CHECKED_IN',
          'IN_SERVICE',
          'IN_PROGRESS',
          'TO_PAY',
          'REVIEW',
          'COMPLETED',
          'FINISHED',
          'DONE',
          'NO_SHOW',
          'CANCELLED',
          'DRAFT'
        ].includes(aptStatus.toUpperCase())
      ) {
        console.warn(`⚠️ Unknown appointment status: "${aptStatus}" for appointment ${apt.id}`)
      }

      switch (aptStatus.toUpperCase()) {
        case 'CONFIRMED':
        case 'BOOKED':
          status = 'BOOKED'
          break
        case 'CHECKED_IN':
        case 'CHECKEDIN':
          status = 'CHECKED_IN'
          break
        case 'IN_SERVICE':
        case 'SERVING':
        case 'IN_PROGRESS':
          status = 'IN_SERVICE'
          break
        case 'TO_PAY':
          status = 'TO_PAY'
          break
        case 'REVIEW':
          status = 'REVIEW'
          break
        case 'COMPLETED':
        case 'FINISHED':
        case 'DONE':
          status = 'DONE'
          break
        case 'NO_SHOW':
        case 'NOSHOW':
          status = 'NO_SHOW'
          break
        case 'CANCELLED':
        case 'CANCELED':
          status = 'CANCELLED'
          break
        case 'DRAFT':
          status = 'DRAFT'
          break
        default:
          console.warn(`⚠️ Unknown status "${aptStatus}", defaulting to BOOKED`)
          status = 'BOOKED'
      }

      // Parse appointment time
      const timeStr = apt.time || '10:00 AM'
      const cleanTime = timeStr.replace(/\s*(AM|PM)\s*/i, '')
      const timeParts = cleanTime.split(':')
      let hour = parseInt(timeParts[0])
      const minute = timeParts[1] || '00'

      // Convert to 24-hour format if needed
      if (timeStr.toUpperCase().includes('PM') && hour !== 12) {
        hour += 12
      } else if (timeStr.toUpperCase().includes('AM') && hour === 12) {
        hour = 0
      }

      // Generate rank based on appointment time
      const rank = `h${hour.toString().padStart(2, '0')}m${minute.padStart(2, '0')}`

      // Create ISO datetime strings for start and end
      const startDateTime = `${date}T${hour.toString().padStart(2, '0')}:${minute.padStart(2, '0')}:00.000Z`
      const durationMinutes = parseInt(apt.duration?.toString().replace(/\D/g, '') || '60')
      const endTime = new Date(new Date(startDateTime).getTime() + durationMinutes * 60000)
      const endDateTime = endTime.toISOString()

      cards.push({
        id: apt.id,
        organization_id: organization_id,
        branch_id: branch_id,
        date,
        status,
        rank,
        start: startDateTime,
        end: endDateTime,
        customer_name: apt.clientName || 'Walk-in Customer',
        service_name: apt.service || 'Hair Service',
        stylist_name: apt.stylist || 'Any Stylist',
        flags: {
          vip: false, // Can be enhanced later with actual VIP data
          new: false, // Can be enhanced later with actual new customer data
          late: new Date() > new Date(startDateTime)
        },
        metadata: {
          transaction_id: apt.id,
          customer_id: apt.clientId,
          stylist_id: apt.stylistId,
          service_id: apt.serviceId || '',
          notes: apt.notes || '',
          price: apt.price || 0,
          currency: 'AED',
          client_phone: apt.clientPhone || '',
          client_email: apt.clientEmail || ''
        }
      })
    }

    console.log(`✅ Transformed ${cards.length} appointments to kanban cards`)
    return cards.sort((a, b) => a.rank.localeCompare(b.rank))
  } catch (error) {
    console.error('Error fetching appointments for kanban:', error)
    return []
  }
}

export async function postStatusChange(params: {
  organization_id: string
  appointment_id: string
  from_status: KanbanStatus
  to_status: KanbanStatus
  changed_by: string
  reason?: string
}): Promise<boolean> {
  try {
    console.log(
      `📝 Updating appointment ${params.appointment_id} status: ${params.from_status} → ${params.to_status}`
    )

    // Update the main appointment status using the salon appointments API
    const updateResponse = await fetch('/api/v1/salon/appointments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: params.appointment_id,
        status: params.to_status.toLowerCase(), // Convert to lowercase for API consistency
        organizationId: params.organization_id,
        userId: params.changed_by,
        reason: params.reason
      })
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('Failed to update appointment status:', errorText)
      throw new Error('Failed to update appointment status')
    }

    console.log(`✅ Successfully updated appointment status to ${params.to_status}`)

    // Create audit trail transaction
    const auditResponse = await fetch('/api/v1/universal_transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: params.organization_id,
        transaction_type: 'status_change',
        smart_code: heraCode('HERA.SALON.APPOINTMENT.STATUS_CHANGE.v1'),
        reference_entity_id: params.appointment_id,
        when_ts: new Date().toISOString(),
        metadata: {
          from_status: params.from_status,
          to_status: params.to_status,
          changed_by: params.changed_by,
          reason: params.reason
        }
      })
    })

    if (!auditResponse.ok) {
      console.warn('Failed to create audit trail, but status update succeeded')
    }

    return true
  } catch (error) {
    console.error('Error posting status change:', error)
    return false
  }
}

export async function updateAppointment(
  id: string,
  patch: {
    when_ts?: string
    branch_id?: string
    metadata?: {
      start?: string
      end?: string
      staff_id?: string
      service_id?: string
      notes?: string
    }
  }
): Promise<boolean> {
  try {
    const response = await fetch(`/api/v1/universal_transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })

    return response.ok
  } catch (error) {
    console.error('Error updating appointment:', error)
    return false
  }
}

export async function postReschedule(params: {
  organization_id: string
  appointment_id: string
  reason?: string
  from: {
    start: string
    end: string
    branch_id: string
    staff_id?: string
  }
  to: {
    start: string
    end: string
    branch_id: string
    staff_id?: string
  }
}): Promise<boolean> {
  try {
    // Post reschedule audit event
    const response = await fetch('/api/v1/universal_transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: params.organization_id,
        transaction_type: 'reschedule',
        smart_code: heraCode('HERA.SALON.APPOINTMENT.RESCHEDULE.V1'),
        reference_entity_id: params.appointment_id,
        when_ts: new Date().toISOString(),
        metadata: {
          from: params.from,
          to: params.to,
          reason: params.reason
        }
      })
    })

    if (!response.ok) throw new Error('Failed to post reschedule event')

    // Keep status as BOOKED (or current non-terminal status)
    await upsertDynamicData({
      entity_id: params.appointment_id,
      field_name: 'appointment_status',
      field_value_text: 'BOOKED',
      smart_code: heraCode('HERA.SALON.APPOINTMENT.STATUS.V1'),
      metadata: {
        updated_at: new Date().toISOString()
      }
    })

    return true
  } catch (error) {
    console.error('Error posting reschedule:', error)
    return false
  }
}

export async function confirmDraft(params: {
  organization_id: string
  appointment_id: string
  confirmed_by: string
}): Promise<boolean> {
  try {
    // 1) Post status change event
    await postStatusChange({
      organization_id: params.organization_id,
      appointment_id: params.appointment_id,
      from_status: 'DRAFT',
      to_status: 'BOOKED',
      changed_by: params.confirmed_by
    })

    // 2) Patch header status to posted
    const patchResponse = await fetch(`/api/v1/universal_transactions/${params.appointment_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'posted'
      })
    })

    if (!patchResponse.ok) throw new Error('Failed to update header status')

    // 3) Update status DD to BOOKED
    await upsertDynamicData({
      entity_id: params.appointment_id,
      field_name: 'appointment_status',
      field_value_text: 'BOOKED',
      smart_code: heraCode('HERA.SALON.APPOINTMENT.STATUS.V1'),
      metadata: {
        updated_by: params.confirmed_by,
        updated_at: new Date().toISOString()
      }
    })

    // 4) Send WhatsApp confirmation notification
    try {
      console.log('📱 Sending WhatsApp confirmation for appointment:', params.appointment_id)

      // Get appointment details for WhatsApp notification
      const appointmentResponse = await fetch(
        `/api/v1/salon/appointments?organization_id=${params.organization_id}`
      )
      if (appointmentResponse.ok) {
        const appointmentData = await appointmentResponse.json()
        const appointment = appointmentData.appointments?.find(
          (apt: any) => apt.id === params.appointment_id
        )

        if (appointment && appointment.clientPhone) {
          // Send WhatsApp notification using the WhatsApp API
          const whatsappResponse = await fetch('/api/v1/whatsapp/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: appointment.clientPhone,
              templateName: 'appointment_confirmation',
              organizationId: params.organization_id,
              parameters: {
                customer_name: appointment.clientName || 'Valued Customer',
                salon_name: 'Hair Talkz Salon',
                service_name: appointment.service || 'Hair Service',
                appointment_date: appointment.date,
                appointment_time: appointment.time,
                staff_name: appointment.stylist || 'Our Team',
                appointment_id: appointment.id
              }
            })
          })

          if (whatsappResponse.ok) {
            const whatsappResult = await whatsappResponse.json()
            console.log('✅ WhatsApp confirmation sent successfully:', whatsappResult.messageId)

            // Log WhatsApp notification in universal_transactions
            await fetch('/api/v1/universal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                table: 'universal_transactions',
                data: {
                  organization_id: params.organization_id,
                  transaction_type: 'whatsapp_notification',
                  smart_code: heraCode('HERA.SALON.WHATSAPP.APPOINTMENT.CONFIRM.V1'),
                  reference_entity_id: params.appointment_id,
                  transaction_date: new Date().toISOString(),
                  total_amount: 0,
                  metadata: {
                    notification_type: 'appointment_confirmation',
                    appointment_id: params.appointment_id,
                    customer_phone: appointment.clientPhone,
                    message_id: whatsappResult.messageId,
                    template_name: 'appointment_confirmation',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  }
                }
              })
            })
          } else {
            console.warn('⚠️ Failed to send WhatsApp confirmation, but appointment was confirmed')
          }
        } else {
          console.warn('⚠️ No customer phone number found for WhatsApp notification')
        }
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification error (non-blocking):', whatsappError)
      // Don't fail the entire confirmation process if WhatsApp fails
    }

    return true
  } catch (error) {
    console.error('Error confirming draft:', error)
    return false
  }
}

export async function upsertKanbanRank(params: {
  appointment_id: string
  column: KanbanStatus
  rank: string
  branch_id: string
  date: string
  organization_id: string
}): Promise<boolean> {
  try {
    await upsertDynamicData({
      entity_id: params.appointment_id,
      field_name: 'kanban_rank',
      field_value_text: params.rank,
      smart_code: heraCode('HERA.UI.KANBAN.RANK.V1'),
      metadata: {
        column: params.column,
        branch_id: params.branch_id,
        date: params.date
      }
    })
    return true
  } catch (error) {
    console.error('Error upserting kanban rank:', error)
    return false
  }
}

// Helper functions for dynamic data
async function getDynamicData(params: {
  entity_id: string
  field_name: string
  smart_code: string
  metadata?: any
}): Promise<any> {
  // Mock implementation - replace with actual API call
  return null
}
