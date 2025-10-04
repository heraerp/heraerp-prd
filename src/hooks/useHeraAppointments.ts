/**
 * HERA Appointments Hook
 *
 * Thin wrapper over useUniversalEntity for appointment management
 * Provides appointment-specific helpers and RPC integration
 */

import { useUniversalEntity } from './useUniversalEntity'
import { APPOINTMENT_PRESET } from './entityPresets'
import type { DynamicFieldDef } from './useUniversalEntity'

export interface Appointment {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: string
  entity_description?: string
  metadata?: any
  // Flattened dynamic fields
  customer_id?: string
  customer_name?: string
  stylist_id?: string
  stylist_name?: string
  service_ids?: string[]
  start_time?: string
  end_time?: string
  duration_minutes?: number
  price?: number
  currency_code?: string
  notes?: string
  branch_id?: string
  created_at: string
  updated_at: string
}

export interface AppointmentFormValues {
  customer_id: string
  customer_name?: string
  stylist_id?: string
  stylist_name?: string
  service_ids?: string[]
  start_time: string
  end_time?: string
  duration_minutes?: number
  price?: number
  currency_code?: string
  notes?: string
  branch_id?: string
  status?: string
}

export interface UseHeraAppointmentsOptions {
  organizationId?: string
  includeArchived?: boolean
  userRole?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
    branch_id?: string
    date_from?: string
    date_to?: string
  }
}

export function useHeraAppointments(options?: UseHeraAppointmentsOptions) {
  const {
    entities: appointments,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'appointment',
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100,
      // Only filter by 'active' status when not including archived
      ...(options?.includeArchived ? {} : { status: 'booked,checked_in,completed' }),
      ...options?.filters
    },
    dynamicFields: APPOINTMENT_PRESET.dynamicFields as DynamicFieldDef[]
  })

  // Helper to create appointment with proper smart codes
  const createAppointment = async (data: AppointmentFormValues) => {
    // Build entity_name from customer and time
    const startDate = new Date(data.start_time)
    const entity_name = `${data.customer_name || 'Customer'} - ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

    // Build dynamic_fields payload
    const dynamic_fields: Record<string, any> = {}

    if (data.customer_id) {
      dynamic_fields.customer_id = {
        value: data.customer_id,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_ID.V1'
      }
    }

    if (data.customer_name) {
      dynamic_fields.customer_name = {
        value: data.customer_name,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_NAME.V1'
      }
    }

    if (data.stylist_id) {
      dynamic_fields.stylist_id = {
        value: data.stylist_id,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_ID.V1'
      }
    }

    if (data.stylist_name) {
      dynamic_fields.stylist_name = {
        value: data.stylist_name,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_NAME.V1'
      }
    }

    if (data.service_ids && data.service_ids.length > 0) {
      dynamic_fields.service_ids = {
        value: data.service_ids,
        type: 'json',
        smart_code: 'HERA.SALON.APPT.FIELD.SERVICE_IDS.V1'
      }
    }

    if (data.start_time) {
      dynamic_fields.start_time = {
        value: data.start_time,
        type: 'datetime',
        smart_code: 'HERA.SALON.APPT.FIELD.START_TIME.V1'
      }
    }

    if (data.end_time) {
      dynamic_fields.end_time = {
        value: data.end_time,
        type: 'datetime',
        smart_code: 'HERA.SALON.APPT.FIELD.END_TIME.V1'
      }
    }

    if (data.duration_minutes !== undefined) {
      dynamic_fields.duration_minutes = {
        value: data.duration_minutes,
        type: 'number',
        smart_code: 'HERA.SALON.APPT.FIELD.DURATION.V1'
      }
    }

    if (data.price !== undefined) {
      dynamic_fields.price = {
        value: data.price,
        type: 'number',
        smart_code: 'HERA.SALON.APPT.FIELD.PRICE.V1'
      }
    }

    if (data.currency_code) {
      dynamic_fields.currency_code = {
        value: data.currency_code,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.CURRENCY.V1'
      }
    }

    if (data.notes) {
      dynamic_fields.notes = {
        value: data.notes,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.NOTES.V1'
      }
    }

    if (data.branch_id) {
      dynamic_fields.branch_id = {
        value: data.branch_id,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.BRANCH_ID.V1'
      }
    }

    const result = await baseCreate({
      entity_name,
      entity_code: `APPT-${Date.now()}`,
      smart_code: 'HERA.SALON.APPT.ENT.V1',
      status: data.status || 'booked',
      entity_description: data.notes,
      dynamic_fields
    })

    await refetch()
    return result
  }

  // Helper to update appointment
  const updateAppointment = async (id: string, data: Partial<AppointmentFormValues>) => {
    // Find the appointment to get current data
    const appointment = (appointments as Appointment[])?.find(a => a.id === id)
    if (!appointment) throw new Error('Appointment not found')

    // Build dynamic_fields payload (only include changed fields)
    const dynamic_fields: Record<string, any> = {}

    if (data.customer_id !== undefined) {
      dynamic_fields.customer_id = {
        value: data.customer_id,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_ID.V1'
      }
    }

    if (data.customer_name !== undefined) {
      dynamic_fields.customer_name = {
        value: data.customer_name,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.CUSTOMER_NAME.V1'
      }
    }

    if (data.stylist_id !== undefined) {
      dynamic_fields.stylist_id = {
        value: data.stylist_id,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_ID.V1'
      }
    }

    if (data.stylist_name !== undefined) {
      dynamic_fields.stylist_name = {
        value: data.stylist_name,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.STYLIST_NAME.V1'
      }
    }

    if (data.service_ids !== undefined) {
      dynamic_fields.service_ids = {
        value: data.service_ids,
        type: 'json',
        smart_code: 'HERA.SALON.APPT.FIELD.SERVICE_IDS.V1'
      }
    }

    if (data.start_time !== undefined) {
      dynamic_fields.start_time = {
        value: data.start_time,
        type: 'datetime',
        smart_code: 'HERA.SALON.APPT.FIELD.START_TIME.V1'
      }
    }

    if (data.end_time !== undefined) {
      dynamic_fields.end_time = {
        value: data.end_time,
        type: 'datetime',
        smart_code: 'HERA.SALON.APPT.FIELD.END_TIME.V1'
      }
    }

    if (data.duration_minutes !== undefined) {
      dynamic_fields.duration_minutes = {
        value: data.duration_minutes,
        type: 'number',
        smart_code: 'HERA.SALON.APPT.FIELD.DURATION.V1'
      }
    }

    if (data.price !== undefined) {
      dynamic_fields.price = {
        value: data.price,
        type: 'number',
        smart_code: 'HERA.SALON.APPT.FIELD.PRICE.V1'
      }
    }

    if (data.currency_code !== undefined) {
      dynamic_fields.currency_code = {
        value: data.currency_code,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.CURRENCY.V1'
      }
    }

    if (data.notes !== undefined) {
      dynamic_fields.notes = {
        value: data.notes,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.NOTES.V1'
      }
    }

    if (data.branch_id !== undefined) {
      dynamic_fields.branch_id = {
        value: data.branch_id,
        type: 'text',
        smart_code: 'HERA.SALON.APPT.FIELD.BRANCH_ID.V1'
      }
    }

    // Update entity name if time changed
    let entity_name = appointment.entity_name
    if (data.start_time || data.customer_name) {
      const startDate = new Date(data.start_time || appointment.start_time || new Date())
      entity_name = `${data.customer_name || appointment.customer_name || 'Customer'} - ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }

    const result = await baseUpdate({
      entity_id: id,
      entity_name,
      status: data.status,
      entity_description: data.notes,
      dynamic_fields: Object.keys(dynamic_fields).length > 0 ? dynamic_fields : undefined
    })

    await refetch()
    return result
  }

  // Helper to archive appointment
  const archiveAppointment = async (id: string) => {
    const result = await baseArchive({ entity_id: id })
    await refetch()
    return result
  }

  // Helper to delete appointment (hard delete)
  const deleteAppointment = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      return await archiveAppointment(id)
    }
    const result = await baseDelete({ entity_id: id, hard_delete: true })
    await refetch()
    return result
  }

  // Helper to restore archived appointment
  const restoreAppointment = async (id: string) => {
    const appointment = (appointments as Appointment[])?.find(a => a.id === id)
    if (!appointment) throw new Error('Appointment not found')

    const result = await baseUpdate({
      entity_id: id,
      entity_name: appointment.entity_name,
      status: 'booked'
    })

    await refetch()
    return result
  }

  return {
    appointments: appointments as Appointment[],
    isLoading,
    error,
    refetch,
    createAppointment,
    updateAppointment,
    archiveAppointment,
    deleteAppointment,
    restoreAppointment,
    isCreating,
    isUpdating,
    isDeleting
  }
}
