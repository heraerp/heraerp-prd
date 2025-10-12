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
  service_prices?: number[]
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
        console.log('[useAppointmentLookup] 🔍 Looking for appointment:', {
          appointmentId,
          organizationId
        })

        // 🎯 CRITICAL FIX: Appointments are TRANSACTIONS, not entities!
        // Load appointment transaction from universal_transactions table
        const appointmentResponse = await universalApi.read({
          table: 'universal_transactions',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'transaction_type', operator: 'eq', value: 'APPOINTMENT' },
            { field: 'id', operator: 'eq', value: appointmentId }
          ]
        })

        console.log('[useAppointmentLookup] 📋 First lookup result:', {
          found: appointmentResponse?.data?.length || 0,
          data: appointmentResponse?.data?.[0] || null
        })

        if (!appointmentResponse?.data || appointmentResponse.data.length === 0) {
          // Try by entity_code if direct ID lookup failed
          console.log('[useAppointmentLookup] 🔄 Trying entity_code lookup...')
          const codeResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'entity_type', operator: 'eq', value: 'appointment' },
              { field: 'entity_code', operator: 'eq', value: appointmentId }
            ]
          })

          console.log('[useAppointmentLookup] 📋 Code lookup result:', {
            found: codeResponse?.data?.length || 0,
            data: codeResponse?.data?.[0] || null
          })

          if (!codeResponse?.data || codeResponse.data.length === 0) {
            // Last resort: try to find ANY appointment with this ID regardless of entity_type
            console.log('[useAppointmentLookup] 🔄 Final attempt: checking any entity with this ID...')
            const anyEntityResponse = await universalApi.read({
              table: 'core_entities',
              filters: [
                { field: 'organization_id', operator: 'eq', value: organizationId },
                { field: 'id', operator: 'eq', value: appointmentId }
              ]
            })

            console.log('[useAppointmentLookup] 📋 Any entity result:', {
              found: anyEntityResponse?.data?.length || 0,
              entity_type: anyEntityResponse?.data?.[0]?.entity_type || 'none',
              data: anyEntityResponse?.data?.[0] || null
            })

            if (!anyEntityResponse?.data || anyEntityResponse.data.length === 0) {
              console.error('[useAppointmentLookup] ❌ Appointment not found in database')
              setError('Appointment not found')
              return null
            } else {
              // Found it but with different entity_type
              console.log('[useAppointmentLookup] ⚠️ Found entity but entity_type is:', anyEntityResponse.data[0].entity_type)
              appointmentResponse.data = anyEntityResponse.data
            }
          } else {
            appointmentResponse.data = codeResponse.data
          }
        }

        const appointment = appointmentResponse.data[0]

        console.log('[useAppointmentLookup] 🔍 Appointment transaction structure:', {
          id: appointment.id,
          transaction_type: appointment.transaction_type,
          transaction_code: appointment.transaction_code,
          smart_code: appointment.smart_code,
          source_entity_id: appointment.source_entity_id,
          target_entity_id: appointment.target_entity_id,
          total_amount: appointment.total_amount,
          transaction_status: appointment.transaction_status,
          status: appointment.status,
          metadata: appointment.metadata
        })

        // 🎯 ENTERPRISE: Parse transaction metadata for appointment details
        const metadata = appointment.metadata || {}
        const customerId = appointment.source_entity_id // Customer who booked
        const stylistId = appointment.target_entity_id // Stylist assigned
        const appointmentStatus = appointment.transaction_status || appointment.status || 'scheduled'
        const totalPrice = appointment.total_amount || 0

        // Load customer information
        let customerName = ''
        if (customerId) {
          console.log('[useAppointmentLookup] 📞 Loading customer:', customerId)
          const customerResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'id', operator: 'eq', value: customerId }
            ]
          })

          if (customerResponse?.data && customerResponse.data.length > 0) {
            customerName = customerResponse.data[0].entity_name
            console.log('[useAppointmentLookup] ✅ Customer loaded:', customerName)
          } else {
            console.log('[useAppointmentLookup] ⚠️ Customer not found:', customerId)
          }
        }

        // Load stylist information
        let stylistName = ''
        if (stylistId) {
          console.log('[useAppointmentLookup] 💇 Loading stylist:', stylistId)
          const stylistResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'id', operator: 'eq', value: stylistId }
            ]
          })

          if (stylistResponse?.data && stylistResponse.data.length > 0) {
            stylistName = stylistResponse.data[0].entity_name
            console.log('[useAppointmentLookup] ✅ Stylist loaded:', stylistName)
          } else {
            console.log('[useAppointmentLookup] ⚠️ Stylist not found:', stylistId)
          }
        }

        // Load chair information if chair_id is in metadata
        let chairName = ''
        if (metadata.chair_id) {
          console.log('[useAppointmentLookup] 🪑 Loading chair:', metadata.chair_id)
          const chairResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'id', operator: 'eq', value: metadata.chair_id }
            ]
          })

          if (chairResponse?.data && chairResponse.data.length > 0) {
            chairName = chairResponse.data[0].entity_name
            console.log('[useAppointmentLookup] ✅ Chair loaded:', chairName)
          }
        }

        // Parse service IDs and load service information
        let serviceIds: string[] = []
        let serviceNames: string[] = []
        let servicePrices: number[] = []

        if (metadata.service_ids) {
          console.log('[useAppointmentLookup] 🎨 Loading services:', metadata.service_ids)

          // Handle service_ids - could be array or string
          if (Array.isArray(metadata.service_ids)) {
            serviceIds = metadata.service_ids
          } else if (typeof metadata.service_ids === 'string') {
            try {
              serviceIds = JSON.parse(metadata.service_ids)
            } catch {
              // If not JSON, treat as comma-separated
              serviceIds = metadata.service_ids.split(',').map((id: string) => id.trim())
            }
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
              console.log('[useAppointmentLookup] ✅ Services loaded:', serviceNames)

              // Load prices from dynamic data
              const serviceDynamicResponse = await universalApi.read({
                table: 'core_dynamic_data',
                filters: [
                  { field: 'organization_id', operator: 'eq', value: organizationId },
                  { field: 'entity_id', operator: 'in', value: serviceIds },
                  { field: 'field_name', operator: 'in', value: ['price', 'base_price'] }
                ]
              })

              if (serviceDynamicResponse?.data) {
                // Create a map of service ID to price
                const priceMap = new Map()
                serviceDynamicResponse.data.forEach(field => {
                  if (!priceMap.has(field.entity_id)) {
                    priceMap.set(field.entity_id, field.field_value_number || 0)
                  }
                })

                // Build prices array in same order as serviceIds
                servicePrices = serviceIds.map(id => priceMap.get(id) || 0)
                console.log('[useAppointmentLookup] 💰 Service prices loaded:', servicePrices)
              }
            }
          }
        }

        // 🎯 ENTERPRISE: Build appointment data from transaction
        const appointmentData: AppointmentData = {
          id: appointment.id,
          entity_name: appointment.transaction_code || `Appointment ${appointment.id.substring(0, 8)}`, // Use transaction_code as name
          entity_code: appointment.transaction_code,
          smart_code: appointment.smart_code,
          start_time: metadata.start_time || appointment.transaction_date,
          end_time: metadata.end_time,
          status: appointmentStatus,
          customer_id: customerId,
          customer_name: customerName,
          stylist_id: stylistId,
          stylist_name: stylistName,
          chair_id: metadata.chair_id,
          chair_name: chairName,
          service_ids: serviceIds,
          service_names: serviceNames,
          service_prices: servicePrices,
          notes: metadata.notes,
          price: totalPrice,
          currency_code: metadata.currency_code || 'AED'
        }

        console.log('[useAppointmentLookup] ✅ Loaded appointment:', {
          id: appointmentData.id,
          customer: appointmentData.customer_name,
          services: appointmentData.service_names,
          prices: appointmentData.service_prices
        })

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
