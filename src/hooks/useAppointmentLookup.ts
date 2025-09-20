'use client'

import { useState, useCallback } from 'react'
import { universalApi } from '@/lib/universal-api-v2'

interface AppointmentData {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  start_time?: string
  end_time?: string
  status?: string
  customer_id?: string
  customer_name?: string
  stylist_id?: string
  stylist_name?: string
  chair_id?: string
  chair_name?: string
  service_ids?: string[]
  service_names?: string[]
  notes?: string
  price?: number
  currency_code?: string
}

interface AppointmentService {
  id: string
  name: string
  price: number
  duration?: number
  category?: string
}

export function useAppointmentLookup(organizationId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAppointment, setLastAppointment] = useState<AppointmentData | null>(null)

  const loadAppointment = useCallback(
    async (appointmentId: string): Promise<AppointmentData | null> => {
      if (!organizationId || !appointmentId) return null

      setLoading(true)
      setError(null)

      try {
        // Load appointment entity
        const appointmentResponse = await universalApi.read({
          table: 'core_entities',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_type', operator: 'eq', value: 'appointment' },
            { field: 'id', operator: 'eq', value: appointmentId }
          ]
        })

        if (!appointmentResponse?.data || appointmentResponse.data.length === 0) {
          // Try by entity_code if direct ID lookup failed
          const codeResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'entity_type', operator: 'eq', value: 'appointment' },
              { field: 'entity_code', operator: 'eq', value: appointmentId }
            ]
          })

          if (!codeResponse?.data || codeResponse.data.length === 0) {
            setError('Appointment not found')
            return null
          }

          appointmentResponse.data = codeResponse.data
        }

        const appointment = appointmentResponse.data[0]

        // Load dynamic data for appointment
        const dynamicResponse = await universalApi.read({
          table: 'core_dynamic_data',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_id', operator: 'eq', value: appointment.id }
          ]
        })

        // Parse dynamic data
        const dynamicData = dynamicResponse?.data || []
        const dynamicFields: any = {}
        dynamicData.forEach(field => {
          dynamicFields[field.field_name] =
            field.field_value_text ||
            field.field_value_number ||
            field.field_value_date ||
            field.field_value_boolean
        })

        // Load customer information if customer_id is available
        let customerName = ''
        if (dynamicFields.customer_id) {
          const customerResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'id', operator: 'eq', value: dynamicFields.customer_id }
            ]
          })

          if (customerResponse?.data && customerResponse.data.length > 0) {
            customerName = customerResponse.data[0].entity_name
          }
        }

        // Load stylist information if stylist_id is available
        let stylistName = ''
        if (dynamicFields.stylist_id) {
          const stylistResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'id', operator: 'eq', value: dynamicFields.stylist_id }
            ]
          })

          if (stylistResponse?.data && stylistResponse.data.length > 0) {
            stylistName = stylistResponse.data[0].entity_name
          }
        }

        // Load chair information if chair_id is available
        let chairName = ''
        if (dynamicFields.chair_id) {
          const chairResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'id', operator: 'eq', value: dynamicFields.chair_id }
            ]
          })

          if (chairResponse?.data && chairResponse.data.length > 0) {
            chairName = chairResponse.data[0].entity_name
          }
        }

        // Parse service IDs and load service information
        let serviceIds: string[] = []
        let serviceNames: string[] = []

        if (dynamicFields.service_ids) {
          try {
            serviceIds = JSON.parse(dynamicFields.service_ids)
          } catch {
            // If not JSON, treat as comma-separated
            serviceIds = dynamicFields.service_ids.split(',').map((id: string) => id.trim())
          }

          if (serviceIds.length > 0) {
            const servicesResponse = await universalApi.read({
              table: 'core_entities',
              filters: [
                { field: 'organization_id', operator: 'eq', value: organizationId },
                { field: 'entity_type', operator: 'eq', value: 'service' },
                { field: 'id', operator: 'in', value: serviceIds }
              ]
            })

            if (servicesResponse?.data) {
              serviceNames = servicesResponse.data.map(service => service.entity_name)
            }
          }
        }

        const appointmentData: AppointmentData = {
          id: appointment.id,
          entity_name: appointment.entity_name,
          entity_code: appointment.entity_code,
          smart_code: appointment.smart_code,
          start_time: dynamicFields.start_time,
          end_time: dynamicFields.end_time,
          status: dynamicFields.status || 'scheduled',
          customer_id: dynamicFields.customer_id,
          customer_name: customerName,
          stylist_id: dynamicFields.stylist_id,
          stylist_name: stylistName,
          chair_id: dynamicFields.chair_id,
          chair_name: chairName,
          service_ids: serviceIds,
          service_names: serviceNames,
          notes: dynamicFields.notes,
          price: dynamicFields.price || dynamicFields.total_price,
          currency_code: dynamicFields.currency_code || 'USD'
        }

        setLastAppointment(appointmentData)
        return appointmentData
      } catch (err) {
        console.error('Error loading appointment:', err)
        setError(err instanceof Error ? err.message : 'Failed to load appointment')
        return null
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  const loadAppointmentServices = useCallback(
    async (serviceIds: string[]): Promise<AppointmentService[]> => {
      if (!organizationId || serviceIds.length === 0) return []

      try {
        // Load service entities
        const servicesResponse = await universalApi.read({
          table: 'core_entities',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_type', operator: 'eq', value: 'service' },
            { field: 'id', operator: 'in', value: serviceIds }
          ]
        })

        if (!servicesResponse?.data) return []

        // Load dynamic data for pricing
        const dynamicResponse = await universalApi.read({
          table: 'core_dynamic_data',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_id', operator: 'in', value: serviceIds }
          ]
        })

        const dynamicData = dynamicResponse?.data || []

        // Merge service data with pricing
        const services: AppointmentService[] = servicesResponse.data.map(service => {
          const serviceDynamic = dynamicData.filter(d => d.entity_id === service.id)
          const dynamicFields: any = {}

          serviceDynamic.forEach(field => {
            dynamicFields[field.field_name] =
              field.field_value_text ||
              field.field_value_number ||
              field.field_value_date ||
              field.field_value_boolean
          })

          return {
            id: service.id,
            name: service.entity_name,
            price: dynamicFields.price || dynamicFields.base_price || 0,
            duration: dynamicFields.duration_minutes || 60,
            category: dynamicFields.category || 'General'
          }
        })

        return services
      } catch (err) {
        console.error('Error loading appointment services:', err)
        return []
      }
    },
    [organizationId]
  )

  const searchAppointments = useCallback(
    async (
      options: {
        date_from?: string
        date_to?: string
        status?: string
        stylist_id?: string
        customer_id?: string
        q?: string
        page?: number
        page_size?: number
      } = {}
    ): Promise<AppointmentData[]> => {
      if (!organizationId) return []

      setLoading(true)
      setError(null)

      try {
        const filters = [
          { field: 'organization_id', operator: 'eq', value: organizationId },
          { field: 'entity_type', operator: 'eq', value: 'appointment' }
        ]

        // Add search filters
        if (options.q) {
          filters.push({
            field: 'entity_name',
            operator: 'ilike',
            value: `%${options.q}%`
          })
        }

        const appointmentsResponse = await universalApi.read({
          table: 'core_entities',
          filters
        })

        if (!appointmentsResponse?.data) return []

        // For now, return simplified appointment data
        // In a full implementation, you'd load full dynamic data for each appointment
        const appointments: AppointmentData[] = appointmentsResponse.data
          .slice(0, options.page_size || 20)
          .map(appt => ({
            id: appt.id,
            entity_name: appt.entity_name,
            entity_code: appt.entity_code,
            smart_code: appt.smart_code,
            status: 'scheduled' // Default status
          }))

        return appointments
      } catch (err) {
        console.error('Error searching appointments:', err)
        setError(err instanceof Error ? err.message : 'Failed to search appointments')
        return []
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    lastAppointment,
    loadAppointment,
    loadAppointmentServices,
    searchAppointments,
    clearError
  }
}
