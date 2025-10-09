/**
 * HERA POS Cart State Management Hook
 * Smart Code: HERA.HOOKS.SALON.POS.CART.V1
 *
 * POS-scoped cart state management.
 * Services require staffId, products have optional staff attribution.
 *
 * Features:
 * - Type-safe cart lines (SERVICE | PRODUCT)
 * - Staff assignment per line
 * - Quantity management
 * - Total calculation
 * - Discounts and tips
 */

import { useState, useMemo, useCallback } from 'react'

export type PosServiceLine = {
  kind: 'SERVICE'
  entityId: string
  name: string
  code?: string
  qty: number
  price: number
  staffId: string // Required for services
  staffName?: string
  duration?: number
  metadata?: any
}

export type PosProductLine = {
  kind: 'PRODUCT'
  entityId: string
  name: string
  code?: string
  qty: number
  price: number
  staffId?: string // Optional for products (commission attribution)
  staffName?: string
  metadata?: any
}

export type PosLine = PosServiceLine | PosProductLine

export interface PosCartCustomer {
  customer_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
}

export interface PosCartState {
  lineItems: PosLine[]
  customer?: PosCartCustomer
  appointment_id?: string
  discount_amount?: number
  discount_type?: 'fixed' | 'percentage'
  tip_amount?: number
  notes?: string
}

export interface UsePosCartReturn {
  // State
  lines: PosLine[]
  customer?: PosCartCustomer
  appointmentId?: string
  discountAmount: number
  tipAmount: number
  notes: string

  // Totals
  subtotal: number
  discountTotal: number
  total: number

  // Actions - Add
  addService: (service: any, staffId: string, staffName?: string, appointmentId?: string) => void
  addProduct: (product: any, staffId?: string, staffName?: string) => void

  // Actions - Update
  updateQuantity: (index: number, qty: number) => void
  setStaffForLine: (index: number, staffId: string, staffName?: string) => void
  removeLine: (index: number) => void

  // Actions - Customer & Discounts
  setCustomer: (customer: PosCartCustomer | undefined) => void
  setDiscount: (amount: number, type?: 'fixed' | 'percentage') => void
  setTip: (amount: number) => void
  setNotes: (notes: string) => void

  // Actions - Cart
  clearCart: () => void
  isEmpty: boolean
}

export function usePosCart(): UsePosCartReturn {
  const [cartState, setCartState] = useState<PosCartState>({
    lineItems: [],
    discount_amount: 0,
    tip_amount: 0,
    notes: ''
  })

  // Add service to cart (requires staff)
  const addService = useCallback(
    (service: any, staffId: string, staffName?: string, appointmentId?: string) => {
      const newLine: PosServiceLine = {
        kind: 'SERVICE',
        entityId: service.id || service.entity_id,
        name: service.entity_name || service.name,
        code: service.entity_code,
        qty: 1,
        price: service.price || service.dynamic_fields?.price_market?.value || 0,
        staffId,
        staffName,
        duration: service.duration_mins || service.dynamic_fields?.duration_min?.value,
        metadata: service.metadata
      }

      setCartState(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, newLine],
        ...(appointmentId && { appointment_id: appointmentId })
      }))
    },
    []
  )

  // Add product to cart (optional staff)
  const addProduct = useCallback((product: any, staffId?: string, staffName?: string) => {
    const newLine: PosProductLine = {
      kind: 'PRODUCT',
      entityId: product.id || product.entity_id,
      name: product.entity_name || product.name,
      code: product.entity_code,
      qty: 1,
      price: product.price || product.dynamic_fields?.price_market?.value || 0,
      staffId,
      staffName,
      metadata: product.metadata
    }

    setCartState(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newLine]
    }))
  }, [])

  // Update quantity for a line
  const updateQuantity = useCallback((index: number, qty: number) => {
    if (qty <= 0) return

    setCartState(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((line, idx) => (idx === index ? { ...line, qty } : line))
    }))
  }, [])

  // Set staff for a line
  const setStaffForLine = useCallback((index: number, staffId: string, staffName?: string) => {
    setCartState(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((line, idx) =>
        idx === index ? { ...line, staffId, staffName } : line
      )
    }))
  }, [])

  // Remove a line
  const removeLine = useCallback((index: number) => {
    setCartState(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, idx) => idx !== index)
    }))
  }, [])

  // Set customer
  const setCustomer = useCallback((customer: PosCartCustomer | undefined) => {
    setCartState(prev => ({
      ...prev,
      customer
    }))
  }, [])

  // Set discount
  const setDiscount = useCallback((amount: number, type: 'fixed' | 'percentage' = 'fixed') => {
    setCartState(prev => ({
      ...prev,
      discount_amount: amount,
      discount_type: type
    }))
  }, [])

  // Set tip
  const setTip = useCallback((amount: number) => {
    setCartState(prev => ({
      ...prev,
      tip_amount: amount
    }))
  }, [])

  // Set notes
  const setNotes = useCallback((notes: string) => {
    setCartState(prev => ({
      ...prev,
      notes
    }))
  }, [])

  // Clear cart
  const clearCart = useCallback(() => {
    setCartState({
      lineItems: [],
      discount_amount: 0,
      tip_amount: 0,
      notes: ''
    })
  }, [])

  // Calculate totals
  const { subtotal, discountTotal, total } = useMemo(() => {
    const subtotal = cartState.lineItems.reduce((sum, line) => sum + line.qty * line.price, 0)

    let discountTotal = 0
    if (cartState.discount_amount) {
      if (cartState.discount_type === 'percentage') {
        discountTotal = subtotal * (cartState.discount_amount / 100)
      } else {
        discountTotal = cartState.discount_amount
      }
    }

    const total = subtotal - discountTotal + (cartState.tip_amount || 0)

    return { subtotal, discountTotal, total: Math.max(0, total) }
  }, [
    cartState.lineItems,
    cartState.discount_amount,
    cartState.discount_type,
    cartState.tip_amount
  ])

  return {
    // State
    lines: cartState.lineItems,
    customer: cartState.customer,
    appointmentId: cartState.appointment_id,
    discountAmount: cartState.discount_amount || 0,
    tipAmount: cartState.tip_amount || 0,
    notes: cartState.notes || '',

    // Totals
    subtotal,
    discountTotal,
    total,

    // Actions
    addService,
    addProduct,
    updateQuantity,
    setStaffForLine,
    removeLine,
    setCustomer,
    setDiscount,
    setTip,
    setNotes,
    clearCart,

    // Helpers
    isEmpty: cartState.lineItems.length === 0
  }
}
