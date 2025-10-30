'use client'

/**
 * usePosTicket - POS Ticket Management with Universal Hooks Integration
 *
 * ✅ Upgraded to use useUniversalEntityV1 and useUniversalTransactionV1
 * ✅ Backward compatible - existing code works unchanged
 * ✅ Optional persistent carts via entity storage
 * ✅ Optional transaction creation via checkout()
 * ✅ Enterprise security: actor stamping + organization isolation
 */

import { useState, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'

interface LineItem {
  id: string
  entity_id: string
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number
  stylist_id?: string
  stylist_name?: string
  appointment_id?: string
  notes?: string
  discount_percent?: number
  discount_amount?: number
}

interface Discount {
  id: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  applied_to: 'subtotal' | 'item'
  item_id?: string
}

interface Tip {
  id: string
  amount: number
  method: 'cash' | 'card'
  stylist_id?: string
  stylist_name?: string
}

interface PosTicket {
  lineItems: LineItem[]
  discounts: Discount[]
  tips: Tip[]
  notes?: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  appointment_id?: string
  branch_id?: string
  branch_name?: string
  cart_entity_id?: string // ✅ NEW: For persisted carts
  transaction_date?: string // ✅ NEW: Custom transaction date for old bills (ISO string)
}

interface Totals {
  subtotal: number
  discountAmount: number
  tipAmount: number
  taxAmount: number
  total: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

interface UsePosTicketConfig {
  organizationId: string
  enablePersistence?: boolean  // Enable cart persistence to entities
  autoSave?: boolean          // Auto-save on changes (requires enablePersistence)
}

export function usePosTicket(config: UsePosTicketConfig | string) {
  // ✅ BACKWARD COMPATIBILITY: Support old string organizationId or new config object
  const normalizedConfig: UsePosTicketConfig = typeof config === 'string'
    ? { organizationId: config, enablePersistence: false, autoSave: false }
    : { enablePersistence: false, autoSave: false, ...config }

  const { organizationId, enablePersistence, autoSave } = normalizedConfig

  // ============================================================================
  // STATE - In-memory ticket state (always used)
  // ============================================================================

  const [ticket, setTicket] = useState<PosTicket>({
    lineItems: [],
    discounts: [],
    tips: []
  })

  // ============================================================================
  // UNIVERSAL HOOKS - Optional for persistence and transactions
  // ============================================================================

  // ✅ Cart Entity Management (optional - only used if enablePersistence)
  const cartHook = useUniversalEntityV1({
    entity_type: 'POS_CART',
    organizationId,
    filters: {
      status: 'active',
      include_dynamic: true,
      include_relationships: false
    },
    dynamicFields: [
      { name: 'line_items', type: 'json', smart_code: 'HERA.SALON.POS.CART.DYN.LINE_ITEMS.v1' },
      { name: 'discounts', type: 'json', smart_code: 'HERA.SALON.POS.CART.DYN.DISCOUNTS.v1' },
      { name: 'tips', type: 'json', smart_code: 'HERA.SALON.POS.CART.DYN.TIPS.v1' },
      { name: 'customer_id', type: 'text', smart_code: 'HERA.SALON.POS.CART.DYN.CUSTOMER_ID.v1' },
      { name: 'customer_name', type: 'text', smart_code: 'HERA.SALON.POS.CART.DYN.CUSTOMER_NAME.v1' },
      { name: 'branch_id', type: 'text', smart_code: 'HERA.SALON.POS.CART.DYN.BRANCH_ID.v1' }
    ]
  })

  // ✅ Transaction Management - For creating sales
  const transactionHook = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'SALE',
      include_lines: true
    }
  })

  // ============================================================================
  // CART PERSISTENCE HELPERS (only used if enablePersistence)
  // ============================================================================

  const saveCart = useCallback(async () => {
    if (!enablePersistence) return

    const cartData = {
      entity_type: 'POS_CART',
      entity_name: ticket.customer_name
        ? `Cart for ${ticket.customer_name}`
        : `Cart ${new Date().toLocaleString()}`,
      smart_code: 'HERA.SALON.POS.ENTITY.CART.v1',
      status: 'active',
      dynamic_fields: {
        line_items: { value: ticket.lineItems, type: 'json' as const, smart_code: 'HERA.SALON.POS.CART.DYN.LINE_ITEMS.v1' },
        discounts: { value: ticket.discounts, type: 'json' as const, smart_code: 'HERA.SALON.POS.CART.DYN.DISCOUNTS.v1' },
        tips: { value: ticket.tips, type: 'json' as const, smart_code: 'HERA.SALON.POS.CART.DYN.TIPS.v1' },
        customer_id: { value: ticket.customer_id || '', type: 'text' as const, smart_code: 'HERA.SALON.POS.CART.DYN.CUSTOMER_ID.v1' },
        customer_name: { value: ticket.customer_name || '', type: 'text' as const, smart_code: 'HERA.SALON.POS.CART.DYN.CUSTOMER_NAME.v1' },
        branch_id: { value: ticket.branch_id || '', type: 'text' as const, smart_code: 'HERA.SALON.POS.CART.DYN.BRANCH_ID.v1' }
      }
    }

    if ((ticket as any).cart_entity_id) {
      await cartHook.update({
        entity_id: (ticket as any).cart_entity_id,
        entity_name: cartData.entity_name,
        dynamic_patch: {
          line_items: ticket.lineItems,
          discounts: ticket.discounts,
          tips: ticket.tips,
          customer_id: ticket.customer_id || '',
          customer_name: ticket.customer_name || '',
          branch_id: ticket.branch_id || ''
        }
      })
    } else {
      const created = await cartHook.create(cartData)
      setTicket(prev => ({ ...prev, cart_entity_id: created.id } as any))
    }
  }, [enablePersistence, ticket, cartHook])

  // Add line item to ticket
  const addLineItem = useCallback(
    (item: {
      entity_id: string
      entity_type: 'service' | 'product'
      entity_name: string
      quantity: number
      unit_price: number
      stylist_id?: string
      stylist_name?: string
      appointment_id?: string
    }) => {
      const newItem: LineItem = {
        id: uuidv4(),
        ...item,
        line_amount: item.quantity * item.unit_price
      }

      setTicket(prev => ({
        ...prev,
        lineItems: [...prev.lineItems, newItem]
      }))

      // Auto-save if enabled
      if (autoSave && enablePersistence) {
        setTimeout(() => saveCart(), 100) // Debounce
      }
    },
    [autoSave, enablePersistence, saveCart]
  )

  // Update line item
  const updateLineItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setTicket(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates }
          // Recalculate line amount if quantity or price changed
          if ('quantity' in updates || 'unit_price' in updates) {
            updatedItem.line_amount = updatedItem.quantity * updatedItem.unit_price
          }
          return updatedItem
        }
        return item
      })
    }))

    // Auto-save if enabled
    if (autoSave && enablePersistence) {
      setTimeout(() => saveCart(), 100)
    }
  }, [autoSave, enablePersistence, saveCart])

  // Remove line item
  const removeLineItem = useCallback((id: string) => {
    setTicket(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }))
  }, [])

  // Add discount (with deduplication for cart-level discounts)
  const addDiscount = useCallback((discount: Omit<Discount, 'id'>) => {
    setTicket(prev => {
      // Remove existing cart-level discounts of the same type if adding a new cart-level discount
      let existingDiscounts = prev.discounts
      if (discount.applied_to === 'subtotal') {
        existingDiscounts = prev.discounts.filter(d => d.applied_to !== 'subtotal')
      }

      const newDiscount: Discount = {
        id: uuidv4(),
        ...discount
      }

      return {
        ...prev,
        discounts: [...existingDiscounts, newDiscount]
      }
    })
  }, [])

  // Remove discount
  const removeDiscount = useCallback((id: string) => {
    setTicket(prev => ({
      ...prev,
      discounts: prev.discounts.filter(discount => discount.id !== id)
    }))
  }, [])

  // Add tip (with deduplication - replace existing general tips)
  const addTip = useCallback((tip: Omit<Tip, 'id'>) => {
    setTicket(prev => {
      // Remove existing general tips (tips without specific stylist) if adding a new general tip
      let existingTips = prev.tips
      if (!tip.stylist_id) {
        existingTips = prev.tips.filter(t => t.stylist_id) // Keep only stylist-specific tips
      }

      const newTip: Tip = {
        id: uuidv4(),
        ...tip
      }

      return {
        ...prev,
        tips: [...existingTips, newTip]
      }
    })
  }, [])

  // Remove tip
  const removeTip = useCallback((id: string) => {
    setTicket(prev => ({
      ...prev,
      tips: prev.tips.filter(tip => tip.id !== id)
    }))
  }, [])

  // Update ticket metadata
  const updateTicketInfo = useCallback(
    (updates: {
      customer_id?: string
      customer_name?: string
      customer_email?: string
      customer_phone?: string
      appointment_id?: string
      branch_id?: string
      branch_name?: string
      notes?: string
    }) => {
      setTicket(prev => ({
        ...prev,
        ...updates
      }))
    },
    []
  )

  // Clear entire ticket
  const clearTicket = useCallback(async () => {
    // If persisted cart, delete entity
    if (enablePersistence && ticket.cart_entity_id) {
      try {
        await cartHook.delete({ entity_id: ticket.cart_entity_id })
      } catch (error) {
        console.error('[usePosTicket] Failed to delete cart entity:', error)
      }
    }

    setTicket({
      lineItems: [],
      discounts: [],
      tips: []
    })
  }, [enablePersistence, ticket.cart_entity_id, cartHook])

  // Calculate totals
  const calculateTotals = useCallback((): Totals => {
    // Subtotal from line items
    const subtotal =
      ticket?.lineItems?.reduce((sum, item) => sum + (item?.line_amount || 0), 0) || 0

    // Calculate discount amount
    let discountAmount = 0
    ticket?.discounts?.forEach(discount => {
      if (discount.applied_to === 'subtotal') {
        if (discount.type === 'percentage') {
          discountAmount += (subtotal * discount.value) / 100
        } else {
          discountAmount += discount.value
        }
      }
      // Item-specific discounts would be handled here
    })

    // Tip amount
    const tipAmount = ticket?.tips?.reduce((sum, tip) => sum + (tip?.amount || 0), 0) || 0

    // Calculate tax (assuming 5% tax rate - in production this would be configurable)
    const taxableAmount = subtotal - discountAmount
    const taxRate = 0.05 // 5%
    const taxAmount = taxableAmount * taxRate

    // Total
    const total = subtotal - discountAmount + tipAmount + taxAmount

    return {
      subtotal,
      discountAmount,
      tipAmount,
      taxAmount,
      total: Math.max(0, total) // Ensure total is never negative
    }
  }, [ticket])

  // Optimistic update for quick actions
  const quickAddItem = useCallback(
    (entityId: string, entityName: string, price: number) => {
      addLineItem({
        entity_id: entityId,
        entity_type: 'service', // Default to service
        entity_name: entityName,
        quantity: 1,
        unit_price: price
      })
    },
    [addLineItem]
  )

  // Bulk add items (e.g., from appointment)
  const addItemsFromAppointment = useCallback(
    (appointmentData: {
      appointment_id: string
      customer_id: string
      customer_name: string
      services: Array<{
        id: string
        name: string
        price: number
        stylist_id?: string
        stylist_name?: string
      }>
    }) => {
      // Clear existing ticket first
      clearTicket()

      // Update ticket info
      updateTicketInfo({
        appointment_id: appointmentData.appointment_id,
        customer_id: appointmentData.customer_id,
        customer_name: appointmentData.customer_name
      })

      // Add all services
      appointmentData.services.forEach(service => {
        addLineItem({
          entity_id: service.id,
          entity_type: 'service',
          entity_name: service.name,
          quantity: 1,
          unit_price: service.price,
          stylist_id: service.stylist_id,
          stylist_name: service.stylist_name,
          appointment_id: appointmentData.appointment_id
        })
      })
    },
    [addLineItem, updateTicketInfo, clearTicket]
  )

  // Add customer to ticket (from search)
  const addCustomerToTicket = useCallback(
    (customerData: {
      customer_id: string
      customer_name: string
      customer_email?: string
      customer_phone?: string
    }) => {
      updateTicketInfo({
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name
      })
    },
    [updateTicketInfo]
  )

  // Validate ticket before payment
  const validateTicket = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!ticket?.lineItems || ticket.lineItems.length === 0) {
      errors.push('No items in ticket')
    }

    // Check for services without stylists
    const servicesWithoutStylist =
      ticket?.lineItems?.filter(item => item.entity_type === 'service' && !item.stylist_id) || []
    if (servicesWithoutStylist.length > 0) {
      errors.push('All services must have an assigned stylist')
    }

    // Check for invalid amounts
    const invalidItems =
      ticket?.lineItems?.filter(item => item.quantity <= 0 || item.unit_price < 0) || []
    if (invalidItems.length > 0) {
      errors.push('Invalid quantity or price on some items')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [ticket])

  // Get ticket summary for display
  const getTicketSummary = useCallback(() => {
    const itemCount = ticket.lineItems.length
    const serviceCount = ticket.lineItems.filter(item => item.entity_type === 'service').length
    const productCount = ticket.lineItems.filter(item => item.entity_type === 'product').length
    const totals = calculateTotals()

    return {
      itemCount,
      serviceCount,
      productCount,
      hasDiscounts: ticket.discounts.length > 0,
      hasTips: ticket.tips.length > 0,
      hasCustomer: !!ticket.customer_name,
      hasAppointment: !!ticket.appointment_id,
      totals
    }
  }, [ticket, calculateTotals])

  // ============================================================================
  // CHECKOUT - Create Transaction (NEW)
  // ============================================================================

  /**
   * ✅ NEW: Convert ticket to transaction and create sale
   * This creates a proper HERA transaction with all lines, discounts, and tips
   */
  const checkout = useCallback(
    async (paymentData: {
      payment_method: string
      payment_amount: number
      branch_id?: string
    }) => {
      const validation = validateTicket()
      if (!validation.isValid) {
        throw new Error(`Ticket validation failed: ${validation.errors.join(', ')}`)
      }

      const totals = calculateTotals()

      // Build transaction lines from ticket
      const lines = ticket.lineItems.map((item, index) => ({
        line_number: index + 1,
        line_type: item.entity_type,
        entity_id: item.entity_id,
        description: item.entity_name,
        quantity: item.quantity,
        unit_amount: item.unit_price,
        line_amount: item.line_amount,
        smart_code: item.entity_type === 'service'
          ? 'HERA.SALON.POS.SALE.LINE.SERVICE.v1'
          : 'HERA.SALON.POS.SALE.LINE.PRODUCT.v1',
        line_data: {
          stylist_id: item.stylist_id,
          stylist_name: item.stylist_name,
          appointment_id: item.appointment_id
        }
      }))

      // Add discount lines
      ticket.discounts.forEach((discount) => {
        lines.push({
          line_number: lines.length + 1,
          line_type: 'discount',
          description: discount.description,
          quantity: 1,
          unit_amount: -discount.value,
          line_amount: -discount.value,
          smart_code: 'HERA.SALON.POS.SALE.LINE.DISCOUNT.v1',
          line_data: {
            discount_type: discount.type,
            applied_to: discount.applied_to,
            discount_id: discount.id
          } as Record<string, any>
        })
      })

      // Add tip lines
      ticket.tips.forEach((tip) => {
        lines.push({
          line_number: lines.length + 1,
          line_type: 'tip',
          description: `Tip for ${tip.stylist_name || 'staff'}`,
          quantity: 1,
          unit_amount: tip.amount,
          line_amount: tip.amount,
          smart_code: 'HERA.SALON.POS.SALE.LINE.TIP.v1',
          line_data: {
            stylist_id: tip.stylist_id,
            stylist_name: tip.stylist_name,
            method: tip.method,
            tip_id: tip.id
          } as Record<string, any>
        })
      })

      // Create transaction
      const transaction = await transactionHook.create({
        transaction_type: 'SALE',
        transaction_code: `SALE-${Date.now()}`,
        smart_code: 'HERA.SALON.POS.TXN.SALE.v1',
        transaction_date: new Date().toISOString(),
        source_entity_id: ticket.customer_id || null,
        target_entity_id: paymentData.branch_id || ticket.branch_id || null,
        total_amount: totals.total,
        transaction_status: 'completed',
        metadata: {
          payment_method: paymentData.payment_method,
          payment_amount: paymentData.payment_amount,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          tip_amount: totals.tipAmount,
          tax_amount: totals.taxAmount,
          appointment_id: ticket.appointment_id
        },
        lines
      })

      // Clear ticket after successful checkout
      clearTicket()

      return transaction
    },
    [ticket, validateTicket, calculateTotals, transactionHook, clearTicket]
  )

  // Memoized values for performance - FIXED: Use ticket as dependency instead of functions
  const memoizedTotals = useMemo(() => calculateTotals(), [ticket])
  const memoizedSummary = useMemo(() => getTicketSummary(), [ticket])
  const memoizedValidation = useMemo(() => validateTicket(), [ticket])

  return {
    // State
    ticket,

    // Actions (unchanged - backward compatible)
    addLineItem,
    updateLineItem,
    removeLineItem,
    addDiscount,
    removeDiscount,
    addTip,
    removeTip,
    updateTicketInfo,
    clearTicket,

    // Convenience methods (unchanged - backward compatible)
    quickAddItem,
    addItemsFromAppointment,
    addCustomerToTicket,

    // Computed values (unchanged - backward compatible)
    calculateTotals: () => memoizedTotals,
    getTicketSummary: () => memoizedSummary,
    validateTicket: () => memoizedValidation,

    // State checks (unchanged - backward compatible)
    isEmpty: ticket.lineItems.length === 0,
    hasItems: ticket.lineItems.length > 0,
    isValid: memoizedValidation.isValid,

    // ✅ NEW: Cart persistence features
    saveCart,
    savedCarts: enablePersistence ? cartHook.entities : [],
    isLoadingCarts: enablePersistence ? cartHook.isLoading : false,

    // ✅ NEW: Checkout with transaction creation
    checkout,
    isCheckingOut: transactionHook.isCreating,

    // ✅ NEW: Transaction history access
    transactions: transactionHook.transactions,
    isLoadingTransactions: transactionHook.isLoading
  }
}
