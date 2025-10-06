// ============================================================================
// HERA • Playbook Appointments Extended API
// ============================================================================

import { KanbanCard, KanbanStatus } from '@/schemas/kanban'
import { appointmentApi } from '@/lib/salon/appointment-api'
import { heraCode } from '@/lib/smart-codes'
import { searchAppointments, AppointmentDTO } from '@/lib/playbook/entities'
// Use v2 helpers that emit transactions via /api/v2
import { updateAppointmentV2 } from '@/lib/salon/appointments-v2-helper'

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
    // Use API v2 via playbook search so we don't hit the v1 426
    const filters = {
      organization_id,
      date_from: dateFrom ? dateFrom.toISOString() : undefined,
      date_to: dateTo ? dateTo.toISOString() : undefined,
      branch_id,
      page: 1,
      page_size: 1000
    }

    const result = await searchAppointments(filters)
    const rows: AppointmentDTO[] = result.rows || []

    if (!rows.length) {
      console.log('No appointments found for range; returning empty kanban list')
      return []
    }

    // Fetch dynamic fields for names if available (guarded)
    const dynById = new Map<string, Record<string, any>>()
    try {
      // Use dynamic import to avoid ReferenceError if tree-shaken or not bundled yet
      const { universalApi: ua } = await import('@/lib/universal-api')
      ua.setOrganizationId(organization_id)
      const ids = rows.map(r => r.id)
      const dynResp = await ua.read('core_dynamic_data', { entity_id: ids }, organization_id)
      if (dynResp.success && Array.isArray(dynResp.data)) {
        for (const r of dynResp.data) {
          const id = r?.entity_id
          if (!id) continue
          const bucket = dynById.get(id) || {}
          const name = r.field_name
          let value: any = null
          if (r.field_value_json !== null && r.field_value_json !== undefined) {
            try {
              value =
                typeof r.field_value_json === 'string'
                  ? JSON.parse(r.field_value_json)
                  : r.field_value_json
            } catch {
              value = r.field_value_json
            }
          } else if (r.field_value_date !== null && r.field_value_date !== undefined) {
            value = r.field_value_date
          } else if (r.field_value_number !== null && r.field_value_number !== undefined) {
            value = Number(r.field_value_number)
          } else if (
            r.field_value_boolean !== null &&
            r.field_value_boolean !== undefined
          ) {
            value = !!r.field_value_boolean
          } else if (r.field_value_text !== null && r.field_value_text !== undefined) {
            value = r.field_value_text
          }
          bucket[name] = value
          dynById.set(id, bucket)
        }
      }
    } catch (e) {
      console.warn('Skipping dynamic enrichment (universalApi unavailable):', e)
    }

    const toKanbanStatus = (s?: string): KanbanStatus => {
      switch ((s || 'booked').toLowerCase()) {
        case 'draft':
          return 'DRAFT'
        case 'booked':
          return 'BOOKED'
        case 'checked_in':
        case 'checkedin':
          return 'CHECKED_IN'
        case 'in_service':
        case 'in_progress':
          return 'IN_SERVICE'
        case 'to_pay':
          return 'TO_PAY'
        case 'completed':
        case 'done':
        case 'finished':
          return 'DONE'
        case 'cancelled':
        case 'canceled':
        case 'no_show':
          return 'CANCELLED'
        default:
          return 'BOOKED'
      }
    }

    const cards: KanbanCard[] = rows.map(r => {
      const dyn = dynById.get(r.id) || {}
      const startISO = r.start_time
      const endISO = r.end_time
      const startDate = new Date(startISO)
      const hh = startDate.getUTCHours().toString().padStart(2, '0')
      const mm = startDate.getUTCMinutes().toString().padStart(2, '0')
      const rank = `h${hh}m${mm}`

      const card: KanbanCard = {
        id: r.id,
        organization_id,
        branch_id: r.branch_id || '',
        date: startISO.split('T')[0],
        status: toKanbanStatus(r.status as any),
        rank,
        start: startISO,
        end: endISO,
        customer_name: (dyn.customer_name as string) || (dyn.client_name as string) || r.entity_name || 'Walk-in Customer',
        service_name: (dyn.service_name as string) || 'Hair Service',
        stylist_name: (dyn.stylist_name as string) || undefined,
        flags: {
          vip: !!dyn.vip,
          new: !!dyn.is_new,
          late: new Date() > startDate
        },
        metadata: {
          transaction_id: r.id,
          customer_id: r.customer_id,
          stylist_id: r.stylist_id,
          service_ids: r.service_ids,
          notes: r.notes || dyn.notes || '',
          price: r.price || dyn.price || 0,
          currency: r.currency_code || 'AED'
        }
      }
      return card
    })

    console.log(`✅ Transformed ${cards.length} appointments to kanban cards (v2)`)
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

    // Map Kanban status to appointment-v2 status strings
    const map: Record<KanbanStatus, string> = {
      DRAFT: 'draft',
      BOOKED: 'booked',
      CHECKED_IN: 'checked_in',
      IN_SERVICE: 'in_service',
      TO_PAY: 'to_pay',
      DONE: 'completed',
      CANCELLED: 'cancelled'
    }

    const target = map[params.to_status] || 'booked'

    // Use API v2 universal txn-emit helper
    await updateAppointmentV2({
      organizationId: params.organization_id,
      appointmentId: params.appointment_id,
      status: target as any,
      notes: params.reason
    })

    console.log(`✅ Successfully updated appointment status to ${params.to_status} (v2)`) 

    // (Optional) We can emit an audit record via txn-emit if needed.

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
    // 1) Update appointment status to BOOKED via v2
    await updateAppointmentV2({
      organizationId: params.organization_id,
      appointmentId: params.appointment_id,
      status: 'booked'
    })

    // 2) Set header status to posted (v2)
    // Skipped direct header status patch to avoid client-side RLS issues.

    // 3) Update dynamic data: appointment_status=BOOKED via playbook endpoint
    try {
      await fetch('/api/v2/universal/dynamic-data-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: params.organization_id,
          entity_id: params.appointment_id,
          field_name: 'appointment_status',
          field_type: 'text',
          field_value_text: 'BOOKED',
          smart_code: heraCode('HERA.SALON.APPOINTMENT.STATUS.V1'),
          metadata: { updated_by: params.confirmed_by, updated_at: new Date().toISOString() }
        })
      })
    } catch (e) {
      console.warn('Dynamic status upsert failed (non-blocking):', e)
    }

    // 4) Send WhatsApp confirmation notification
    try {
      console.log('📱 Sending WhatsApp confirmation for appointment:', params.appointment_id)

      // Get appointment details for WhatsApp notification
      // Optional: fetch appointment details from v2 transactions if needed
      // Skipped to avoid extra calls; WhatsApp send is non-blocking and can be integrated later.
      const appointmentResponse = { ok: false } as any
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
    // Use API v2 dynamic-data-upsert; store rank payload as JSON
    const res = await fetch('/api/v2/universal/dynamic-data-upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: params.organization_id,
        entity_id: params.appointment_id,
        field_name: 'kanban_rank',
        field_type: 'json',
        field_value_json: {
          rank: params.rank,
          column: params.column,
          branch_id: params.branch_id,
          date: params.date
        },
        smart_code: heraCode('HERA.UI.KANBAN.RANK.V1')
      })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Rank upsert failed: ${text}`)
    }
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
