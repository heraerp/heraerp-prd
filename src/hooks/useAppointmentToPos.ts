// ================================================================================
// APPOINTMENT TO POS INTEGRATION HOOK
// Smart Code: HERA.HOOK.APPOINTMENT.POS.v1
// Converts completed appointments to POS checkout flow
// ================================================================================

'use client'

import { useState, useCallback } from 'react'
import { useUniversalApi } from './useUniversalApi'
import { usePosCheckout, PosCartItem } from './usePosCheckout'

interface AppointmentService {
  service_entity_id: string
  service_name: string
  duration: number
  price: number
  staff_id: string
  staff_name: string
}

interface AppointmentToPos {
  appointment_id: string
  customer_id: string
  customer_name: string
  services: AppointmentService[]
  additional_products?: PosCartItem[]
  status: 'scheduled' | 'in_progress' | 'service_complete' | 'invoiced'
  appointment_date: string
}

interface UseAppointmentToPosReturn {
  isLoading: boolean
  error: string | null
  loadAppointment: (appointmentId: string) => Promise<AppointmentToPos>
  markServiceComplete: (appointmentId: string) => Promise<void>
  convertToPos: (appointment: AppointmentToPos, additionalItems?: PosCartItem[]) => PosCartItem[]
  processAppointmentCheckout: (appointment: AppointmentToPos, payments: any[]) => Promise<any>
  clearError: () => void
}

export function useAppointmentToPos(): UseAppointmentToPosReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { execute } = useUniversalApi()
  const { processCheckout } = usePosCheckout()

  const loadAppointment = useCallback(async (appointmentId: string): Promise<AppointmentToPos> => {
    setIsLoading(true)
    setError(null)

    try {
      // Get appointment transaction
      const appointmentResult = await execute({
        table: 'universal_transactions',
        method: 'GET',
        filters: {
          transaction_type: 'appointment',
          id: appointmentId
        }
      })

      if (!appointmentResult.data || appointmentResult.data.length === 0) {
        throw new Error('Appointment not found')
      }

      const appointment = appointmentResult.data[0]

      // Get appointment lines (services)
      const linesResult = await execute({
        table: 'universal_transaction_lines',
        method: 'GET',
        filters: {
          transaction_id: appointmentId
        }
      })

      // Get customer entity
      const customerResult = await execute({
        table: 'core_entities',
        method: 'GET',
        filters: {
          id: appointment.source_entity_id,
          entity_type: 'customer'
        }
      })

      const customer = customerResult.data?.[0]

      // Build appointment data
      const services: AppointmentService[] = linesResult.data?.map((line: any) => ({
        service_entity_id: line.entity_id,
        service_name: line.description,
        duration: line.metadata?.duration || 60,
        price: line.line_amount,
        staff_id: line.metadata?.staff_id || '',
        staff_name: line.metadata?.staff_name || 'Staff Member'
      })) || []

      const appointmentData: AppointmentToPos = {
        appointment_id: appointmentId,
        customer_id: appointment.source_entity_id,
        customer_name: customer?.entity_name || 'Walk-in Customer',
        services,
        status: appointment.metadata?.status || 'scheduled',
        appointment_date: appointment.transaction_date
      }

      console.log('Loaded appointment:', appointmentData)
      return appointmentData

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load appointment'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [execute])

  const markServiceComplete = useCallback(async (appointmentId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Update appointment status to service_complete
      await execute({
        table: 'universal_transactions',
        method: 'PUT',
        data: {
          id: appointmentId,
          metadata: {
            status: 'service_complete',
            completed_at: new Date().toISOString()
          }
        }
      })

      console.log('Appointment marked as service complete:', appointmentId)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark service complete'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [execute])

  const convertToPos = useCallback((
    appointment: AppointmentToPos, 
    additionalItems: PosCartItem[] = []
  ): PosCartItem[] => {
    // Convert appointment services to POS cart items
    const serviceItems: PosCartItem[] = appointment.services.map((service, index) => ({
      id: `service-${index}`,
      entity_id: service.service_entity_id,
      name: service.service_name,
      type: 'service',
      quantity: 1,
      unit_price: service.price,
      staff_id: service.staff_id
    }))

    // Combine services with any additional products
    const allItems = [...serviceItems, ...additionalItems]

    console.log('Converted appointment to POS items:', allItems)
    return allItems

  }, [])

  const processAppointmentCheckout = useCallback(async (
    appointment: AppointmentToPos,
    payments: any[],
    additionalItems: PosCartItem[] = []
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      // Convert appointment to POS items
      const posItems = convertToPos(appointment, additionalItems)

      // Process checkout
      const checkoutResult = await processCheckout({
        customer_id: appointment.customer_id,
        appointment_id: appointment.appointment_id,
        items: posItems,
        payments,
        notes: `Appointment checkout - ${appointment.appointment_date}`
      })

      // Mark appointment as invoiced
      await execute({
        table: 'universal_transactions',
        method: 'PUT',
        data: {
          id: appointment.appointment_id,
          metadata: {
            status: 'invoiced',
            invoiced_at: new Date().toISOString(),
            invoice_transaction_id: checkoutResult.transaction_id
          }
        }
      })

      console.log('Appointment checkout completed:', checkoutResult)
      return checkoutResult

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process appointment checkout'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [convertToPos, processCheckout, execute])

  const clearError = () => {
    setError(null)
  }

  return {
    isLoading,
    error,
    loadAppointment,
    markServiceComplete,
    convertToPos,
    processAppointmentCheckout,
    clearError
  }
}

// Utility for appointment status flow
export const AppointmentStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress', 
  SERVICE_COMPLETE: 'service_complete',
  INVOICED: 'invoiced'
} as const

export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus]