import { heraCode } from '@/lib/smart-codes'
import { pb, extractList, getDD, withBranch, pbLog } from './client'

export async function listAppointments(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  start_date: string
  end_date: string
  status?: string
  stylist_id?: string
  customer_id?: string
  service_ids?: string[]
  sort?: string
  limit?: number
  offset?: number
}) {
  try {
    const query = withBranch(
      {
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        organization_id: params.organization_id,
        transaction_date_gte: params.start_date,
        transaction_date_lte: params.end_date,
        sort: params.sort || 'transaction_date:asc',
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
        ...(params.status ? { status: params.status } : { status: 'posted' }),
        ...(params.stylist_id ? { 'metadata.stylist_id': params.stylist_id } : {}),
        ...(params.customer_id ? { from_entity_id: params.customer_id } : {}),
        ...(params.service_ids?.length
          ? { 'metadata.service_ids': params.service_ids.join(',') }
          : {})
      },
      params.branch_id
    )

    pbLog('listAppointments request:', query)

    const json = await pb('/universal_transactions', { query })
    const result = extractList(json)

    pbLog('listAppointments success:', {
      count: result.items.length,
      total: result.total
    })

    return { ok: true, data: result } as const
  } catch (error) {
    pbLog('listAppointments error:', error)
    return {
      ok: false,
      data: { items: [], total: 0 },
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function getAppointment(id: string) {
  try {
    pbLog('getAppointment request:', { id })

    const json = await pb(`/universal_transactions/${id}`)

    pbLog('getAppointment success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('getAppointment error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function createAppointment(payload: {
  organization_id: string
  branch_id?: string
  customer_id: string
  customer_name: string
  service_ids: string[]
  service_names: string[]
  stylist_id: string
  stylist_name: string
  appointment_date: string
  start_time: string
  end_time: string
  duration_mins: number
  notes?: string
  total_amount: number
}) {
  try {
    const body = {
      organization_id: payload.organization_id,
      smart_code: heraCode('HERA.SALON.APPOINTMENT.BOOKING.V1'),
      transaction_type: 'appointment',
      transaction_date: payload.appointment_date,
      from_entity_id: payload.customer_id,
      to_entity_id: payload.stylist_id,
      total_amount: payload.total_amount,
      status: 'posted',
      metadata: {
        customer_name: payload.customer_name,
        service_ids: payload.service_ids,
        service_names: payload.service_names,
        stylist_id: payload.stylist_id,
        stylist_name: payload.stylist_name,
        start_time: payload.start_time,
        end_time: payload.end_time,
        duration_mins: payload.duration_mins,
        notes: payload.notes,
        branch_id: payload.branch_id
      }
    }

    pbLog('createAppointment request:', body)

    const json = await pb('/universal_transactions', {
      method: 'POST',
      body
    })

    pbLog('createAppointment success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('createAppointment error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function updateAppointment(
  id: string,
  patch: Partial<{
    appointment_date: string
    start_time: string
    end_time: string
    stylist_id: string
    stylist_name: string
    service_ids: string[]
    service_names: string[]
    notes: string
    status: string
  }>
) {
  try {
    // Build update payload
    const updates: any = {}

    if (patch.appointment_date) {
      updates.transaction_date = patch.appointment_date
    }

    if (patch.stylist_id) {
      updates.to_entity_id = patch.stylist_id
    }

    if (patch.status) {
      updates.status = patch.status
    }

    // Update metadata fields
    const metadataUpdates: any = {}
    if (patch.start_time) metadataUpdates.start_time = patch.start_time
    if (patch.end_time) metadataUpdates.end_time = patch.end_time
    if (patch.stylist_id) metadataUpdates.stylist_id = patch.stylist_id
    if (patch.stylist_name) metadataUpdates.stylist_name = patch.stylist_name
    if (patch.service_ids) metadataUpdates.service_ids = patch.service_ids
    if (patch.service_names) metadataUpdates.service_names = patch.service_names
    if (patch.notes !== undefined) metadataUpdates.notes = patch.notes

    if (Object.keys(metadataUpdates).length > 0) {
      updates.metadata = metadataUpdates
    }

    pbLog('updateAppointment request:', { id, updates })

    const json = await pb(`/universal_transactions/${id}`, {
      method: 'PATCH',
      body: updates
    })

    pbLog('updateAppointment success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('updateAppointment error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function cancelAppointment(id: string, reason?: string) {
  return updateAppointment(id, {
    status: 'cancelled',
    notes: reason
  })
}

export async function getAppointmentSlots(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  stylist_id?: string
  date: string
  service_duration: number
}) {
  // This would typically query availability data
  // For now, return a simple slot calculation
  const slots = []
  const startHour = 9
  const endHour = 18
  const slotDuration = params.service_duration

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      if (hour * 60 + minute + slotDuration <= endHour * 60) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          available: true // Would check against existing appointments
        })
      }
    }
  }

  return { ok: true, data: slots } as const
}

/**
 * Get stylist schedule for a date range
 */
export async function getStylistSchedule(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  stylist_id: string
  start_date: string
  end_date: string
}) {
  return listAppointments({
    organization_id: params.organization_id,
    branch_id: params.branch_id,
    start_date: params.start_date,
    end_date: params.end_date,
    stylist_id: params.stylist_id,
    status: 'posted'
  })
}
