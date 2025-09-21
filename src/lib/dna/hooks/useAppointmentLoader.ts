import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// HERA DNA Hook for Appointment Loading
// Smart Code: HERA.DNA.HOOK.APPOINTMENT.LOADER.V1
export interface AppointmentDetails {
  id: string
  code: string
  smart_code: string
  organization_id: string
  customer?: {
    id: string
    name: string
    code: string
    phone?: string
    email?: string
  }
  staff?: Array<{
    id: string
    name: string
  }>
  resources?: Array<{
    id: string
    slug: string
  }>
  deposits?: Array<{
    id: string
    amount: number
    currency: string
  }>
  packages?: Array<{
    id: string
    name: string
    remaining_uses: number
  }>
  planned_services: Array<{
    appointment_line_id: string
    entity_id: string
    name: string
    duration_min: number
    price: number
    assigned_staff: Array<{
      staff_id: string
      pct: number
    }>
  }>
  status: string
  start_time: string
  end_time: string
}

export interface POSCart {
  id: string
  code: string
  smart_code: string
  organization_id: string
  appointment_id?: string
  relationships: Record<string, any>
  lines: Array<{
    line_id: string
    entity_ref: string
    name: string
    code: string
    smart_code: string
    qty: number
    unit_price: number
    line_total: number
    staff_split: Array<{ staff_id: string; pct: number }>
    dynamic: {
      appointment_line_id?: string
      duration_min: number
      source: string
    }
  }>
  pricing_summary: {
    subtotal: number
    discounts: number
    tax: number
    tip: number
    total: number
  }
  metadata: {
    customer_id?: string
    stylist_id?: string
    chair_id?: string
    created_at: string
    updated_at: string
  }
}

export interface UseAppointmentLoaderOptions {
  organizationId: string
  onCartCreated?: (cart: POSCart) => void
  onError?: (error: Error) => void
}

export function useAppointmentLoader({
  organizationId,
  onCartCreated,
  onError
}: UseAppointmentLoaderOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch appointment details
  const {
    data: appointment,
    isLoading: isLoadingAppointment,
    error: appointmentError
  } = useQuery({
    queryKey: ['appointment', appointmentId, organizationId],
    queryFn: async () => {
      if (!appointmentId) return null

      const response = await fetch(
        `/api/v1/salon/appointments/${appointmentId}?` +
          `organization_id=${organizationId}&` +
          `expand=planned_services,customer,staff,deposits,packages`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch appointment')
      }

      const data = await response.json()
      return data.appointment as AppointmentDetails
    },
    enabled: !!appointmentId && !!organizationId,
    retry: 1
  })

  // Create cart from appointment
  const createCartMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await fetch('/api/v1/salon/pos/carts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `cart-${appointmentId}-${Date.now()}`
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          organization_id: organizationId,
          smart_code: 'HERA.SALON.POS.CART.ACTIVE.V1'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create cart')
      }

      const data = await response.json()
      return data.cart as POSCart
    },
    onSuccess: cart => {
      // Invalidate appointment query to refresh status
      queryClient.invalidateQueries({
        queryKey: ['appointment', appointmentId, organizationId]
      })

      // Call success callback
      if (onCartCreated) {
        onCartCreated(cart)
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create cart:', error)
      if (onError) {
        onError(error)
      }
    }
  })

  // Load appointment by ID or code
  const loadAppointment = useCallback((idOrCode: string) => {
    setAppointmentId(idOrCode)
  }, [])

  // Create cart from loaded appointment
  const createCart = useCallback(async () => {
    if (!appointment) {
      throw new Error('No appointment loaded')
    }

    setIsLoading(true)
    try {
      const cart = await createCartMutation.mutateAsync(appointment.id)
      return cart
    } finally {
      setIsLoading(false)
    }
  }, [appointment, createCartMutation])

  // Reset state
  const reset = useCallback(() => {
    setAppointmentId(null)
    queryClient.removeQueries({
      queryKey: ['appointment', appointmentId, organizationId]
    })
  }, [appointmentId, organizationId, queryClient])

  return {
    // State
    appointment,
    isLoading: isLoading || isLoadingAppointment || createCartMutation.isPending,
    error: appointmentError || createCartMutation.error,

    // Actions
    loadAppointment,
    createCart,
    reset,

    // Cart mutation state
    cart: createCartMutation.data,
    isCreatingCart: createCartMutation.isPending
  }
}
