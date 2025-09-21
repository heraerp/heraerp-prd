import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// HERA DNA Hook for POS Cart Management
// Smart Code: HERA.DNA.HOOK.POS.CART.V1

export interface CartLine {
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
}

export interface POSCart {
  id: string
  code: string
  smart_code: string
  organization_id: string
  appointment_id?: string
  status: string
  relationships: Record<string, any>
  lines: CartLine[]
  pricing_summary: {
    subtotal: number
    discounts: number
    tax: number
    tip: number
    total: number
  }
  metadata: Record<string, any>
}

export interface UsePOSCartOptions {
  cartId?: string
  organizationId: string
  onUpdate?: (cart: POSCart) => void
  onError?: (error: Error) => void
}

export interface AddLineRequest {
  service_id: string
  quantity: number
  unit_price: number
  staff_id?: string
  metadata?: Record<string, any>
}

export interface UpdateLineRequest {
  line_id: string
  quantity?: number
  unit_price?: number
  staff_split?: Array<{ staff_id: string; pct: number }>
}

export function usePOSCart({ cartId, organizationId, onUpdate, onError }: UsePOSCartOptions) {
  const [activeCartId, setActiveCartId] = useState(cartId)
  const queryClient = useQueryClient()

  // Fetch cart details
  const {
    data: cart,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['pos-cart', activeCartId, organizationId],
    queryFn: async () => {
      if (!activeCartId) return null

      const response = await fetch(
        `/api/v1/salon/pos/carts/${activeCartId}?organization_id=${organizationId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()
      return data.cart as POSCart
    },
    enabled: !!activeCartId && !!organizationId,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1
  })

  // Add line to cart
  const addLineMutation = useMutation({
    mutationFn: async (request: AddLineRequest) => {
      if (!activeCartId) throw new Error('No active cart')

      const response = await fetch(`/api/v1/salon/pos/carts/${activeCartId}/lines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...request,
          organization_id: organizationId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add line')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pos-cart', activeCartId, organizationId]
      })
      refetch()
    },
    onError: (error: Error) => {
      console.error('Failed to add line:', error)
      if (onError) onError(error)
    }
  })

  // Update cart line
  const updateLineMutation = useMutation({
    mutationFn: async (request: UpdateLineRequest) => {
      if (!activeCartId) throw new Error('No active cart')

      const response = await fetch(
        `/api/v1/salon/pos/carts/${activeCartId}/lines/${request.line_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...request,
            organization_id: organizationId
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update line')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pos-cart', activeCartId, organizationId]
      })
      refetch()
    },
    onError: (error: Error) => {
      console.error('Failed to update line:', error)
      if (onError) onError(error)
    }
  })

  // Remove line from cart
  const removeLineMutation = useMutation({
    mutationFn: async (lineId: string) => {
      if (!activeCartId) throw new Error('No active cart')

      const response = await fetch(
        `/api/v1/salon/pos/carts/${activeCartId}/lines/${lineId}?organization_id=${organizationId}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove line')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pos-cart', activeCartId, organizationId]
      })
      refetch()
    },
    onError: (error: Error) => {
      console.error('Failed to remove line:', error)
      if (onError) onError(error)
    }
  })

  // Apply discount to cart
  const applyDiscountMutation = useMutation({
    mutationFn: async ({ type, value }: { type: 'percent' | 'amount'; value: number }) => {
      if (!activeCartId) throw new Error('No active cart')

      const response = await fetch(`/api/v1/salon/pos/carts/${activeCartId}/discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          value,
          organization_id: organizationId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply discount')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pos-cart', activeCartId, organizationId]
      })
      refetch()
    },
    onError: (error: Error) => {
      console.error('Failed to apply discount:', error)
      if (onError) onError(error)
    }
  })

  // Load cart by ID
  const loadCart = useCallback((cartId: string) => {
    setActiveCartId(cartId)
  }, [])

  // Calculate cart totals
  const calculateTotals = useCallback(() => {
    if (!cart) return null

    const subtotal = cart.lines.reduce((sum, line) => sum + line.line_total, 0)
    const discount = cart.pricing_summary.discounts || 0
    const discountedSubtotal = subtotal - discount
    const tax = discountedSubtotal * 0.2 // 20% VAT
    const tip = cart.pricing_summary.tip || 0
    const total = discountedSubtotal + tax + tip

    return {
      subtotal,
      discount,
      discountedSubtotal,
      tax,
      tip,
      total
    }
  }, [cart])

  // Check if cart has appointment
  const isAppointmentCart = useCallback(() => {
    return !!cart?.appointment_id
  }, [cart])

  // Get appointment lines
  const getAppointmentLines = useCallback(() => {
    if (!cart) return []
    return cart.lines.filter(line => line.dynamic.source === 'APPOINTMENT')
  }, [cart])

  return {
    // State
    cart,
    isLoading,
    error,
    totals: calculateTotals(),
    isAppointmentCart: isAppointmentCart(),
    appointmentLines: getAppointmentLines(),

    // Actions
    loadCart,
    addLine: addLineMutation.mutateAsync,
    updateLine: updateLineMutation.mutateAsync,
    removeLine: removeLineMutation.mutateAsync,
    applyDiscount: applyDiscountMutation.mutateAsync,
    refetch,

    // Mutation states
    isAddingLine: addLineMutation.isPending,
    isUpdatingLine: updateLineMutation.isPending,
    isRemovingLine: removeLineMutation.isPending,
    isApplyingDiscount: applyDiscountMutation.isPending
  }
}
