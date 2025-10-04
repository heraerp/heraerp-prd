/**
 * Salon Appointments v2 Helper
 *
 * Uses the new API v2 universal endpoints to emit appointment events.
 * Focused helper for UI flows (book/create for now).
 */

type BookArgs = {
  organizationId: string
  customerId: string
  staffId: string
  serviceId: string
  startISO: string
  endISO: string
  notes?: string
  price?: number
  currencyCode?: string
  metadata?: Record<string, any>
}

export async function bookAppointmentV2(args: BookArgs): Promise<{
  transaction_id: string
}> {
  const {
    organizationId,
    customerId,
    staffId,
    serviceId,
    startISO,
    endISO,
    notes,
    price = 0,
    currencyCode = 'AED',
    metadata
  } = args

  const payload = {
    organization_id: organizationId,
    smart_code: 'HERA.SALON.APPT.BOOK.CREATE.V1',
    transaction_type: 'appointment',
    transaction_date: new Date().toISOString(),
    // Keep source/target aligned with existing salon logic (customer -> staff)
    source_entity_id: customerId,
    target_entity_id: staffId,
    business_context: {
      start_time: startISO,
      end_time: endISO,
      status: 'booked',
      stylist_id: staffId,
      service_ids: [serviceId],
      price,
      currency_code: currencyCode,
      notes: notes || '',
      ...(metadata || {})
    },
    lines: [
      {
        line_type: 'service',
        smart_code: 'HERA.SALON.SERVICE.HAIRCUT.LADIES.V1',
        entity_id: serviceId,
        quantity: 1,
        unit_amount: price
      }
    ]
  }

  const res = await fetch('/api/v1/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      transaction_type: 'appointment',
      transaction_date: new Date().toISOString(),
      source_entity_id: customerId,
      target_entity_id: staffId,
      total_amount: price,
      currency_code: currencyCode,
      notes: notes || '',
      metadata: {
        start_time: startISO,
        end_time: endISO,
        status: 'booked',
        stylist_id: staffId,
        customer_id: customerId,
        service_ids: [serviceId],
        branch_id: metadata?.branch_id,
        ...metadata
      },
      smart_code: 'HERA.SALON.APPT.BOOK.CREATE.V1'
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      (data && (data.error || data.message)) ||
        `Failed to create appointment (status ${res.status})`
    )
  }

  // After creating the transaction, store additional fields as dynamic data
  const transactionId = data.id || data.transaction_id
  
  if (transactionId) {
    // Create dynamic data for appointment fields
    const dynamicFields = [
      { field_name: 'start_time', field_value: startISO, field_type: 'text' },
      { field_name: 'end_time', field_value: endISO, field_type: 'text' },
      { field_name: 'status', field_value: 'booked', field_type: 'text' },
      { field_name: 'stylist_id', field_value: staffId, field_type: 'text' },
      { field_name: 'customer_id', field_value: customerId, field_type: 'text' },
      { field_name: 'service_ids', field_value: JSON.stringify([serviceId]), field_type: 'text' },
      { field_name: 'branch_id', field_value: metadata?.branch_id || '', field_type: 'text' }
    ]
    
    // Create dynamic data entries
    await Promise.all(
      dynamicFields.map(field =>
        fetch('/api/v1/dynamic-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organizationId,
            entity_id: transactionId,
            ...field,
            smart_code: 'HERA.SALON.APPT.DYNAMIC.FIELD.V1'
          })
        })
      )
    )
  }
  
  return { transaction_id: transactionId }
}

type UpdateArgs = {
  organizationId: string
  appointmentId: string
  startISO?: string
  endISO?: string
  status?: 'booked' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
}

export async function updateAppointmentV2(args: UpdateArgs): Promise<void> {
  const { organizationId, appointmentId, startISO, endISO, status, notes } = args

  const payload = {
    organization_id: organizationId,
    smart_code: 'HERA.SALON.APPT.BOOK.UPDATE.V1',
    transaction_type: 'appointment',
    transaction_date: new Date().toISOString(),
    business_context: {
      appointment_id: appointmentId,
      ...(startISO ? { start_time: startISO } : {}),
      ...(endISO ? { end_time: endISO } : {}),
      ...(status ? { status } : {}),
      ...(notes ? { notes } : {})
    },
    lines: [] as any[]
  }

  const res = await fetch('/api/v2/universal/txn-emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data && (data.error || data.message)) || 'Failed to update appointment')
  }
}

export async function cancelAppointmentV2(args: {
  organizationId: string
  appointmentId: string
  reason?: string
}): Promise<void> {
  const { organizationId, appointmentId, reason } = args

  const payload = {
    organization_id: organizationId,
    smart_code: 'HERA.SALON.APPT.BOOK.CANCEL.V1',
    transaction_type: 'appointment',
    transaction_date: new Date().toISOString(),
    business_context: {
      appointment_id: appointmentId,
      status: 'cancelled',
      ...(reason ? { notes: reason } : {})
    },
    lines: [] as any[]
  }

  const res = await fetch('/api/v2/universal/txn-emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data && (data.error || data.message)) || 'Failed to cancel appointment')
  }
}

export async function noShowAppointmentV2(args: {
  organizationId: string
  appointmentId: string
  notes?: string
}): Promise<void> {
  const { organizationId, appointmentId, notes } = args

  const payload = {
    organization_id: organizationId,
    smart_code: 'HERA.SALON.APPT.BOOK.NOSHOW.V1',
    transaction_type: 'appointment',
    transaction_date: new Date().toISOString(),
    business_context: {
      appointment_id: appointmentId,
      status: 'no_show',
      ...(notes ? { notes } : {})
    },
    lines: [] as any[]
  }

  const res = await fetch('/api/v2/universal/txn-emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data && (data.error || data.message)) || 'Failed to mark no-show')
  }
}

export async function checkInAppointmentV2(args: {
  organizationId: string
  appointmentId: string
}): Promise<void> {
  const { organizationId, appointmentId } = args
  await updateAppointmentV2({
    organizationId,
    appointmentId,
    status: 'checked_in'
  })
}
