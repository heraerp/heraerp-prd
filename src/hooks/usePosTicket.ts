'use client'

import { useState, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'

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
  appointment_id?: string
}

interface Totals {
  subtotal: number
  discountAmount: number
  tipAmount: number
  taxAmount: number
  total: number
}

export function usePosTicket(organizationId: string) {
  const [ticket, setTicket] = useState<PosTicket>({
    lineItems: [],
    discounts: [],
    tips: [],
  })

  // Add line item to ticket
  const addLineItem = useCallback((item: {
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
  }, [])

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
  }, [])

  // Remove line item
  const removeLineItem = useCallback((id: string) => {
    setTicket(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }))
  }, [])

  // Add discount
  const addDiscount = useCallback((discount: Omit<Discount, 'id'>) => {
    const newDiscount: Discount = {
      id: uuidv4(),
      ...discount
    }

    setTicket(prev => ({
      ...prev,
      discounts: [...prev.discounts, newDiscount]
    }))
  }, [])

  // Remove discount
  const removeDiscount = useCallback((id: string) => {
    setTicket(prev => ({
      ...prev,
      discounts: prev.discounts.filter(discount => discount.id !== id)
    }))
  }, [])

  // Add tip
  const addTip = useCallback((tip: Omit<Tip, 'id'>) => {
    const newTip: Tip = {
      id: uuidv4(),
      ...tip
    }

    setTicket(prev => ({
      ...prev,
      tips: [...prev.tips, newTip]
    }))
  }, [])

  // Remove tip
  const removeTip = useCallback((id: string) => {
    setTicket(prev => ({
      ...prev,
      tips: prev.tips.filter(tip => tip.id !== id)
    }))
  }, [])

  // Update ticket metadata
  const updateTicketInfo = useCallback((updates: {
    customer_id?: string
    customer_name?: string
    appointment_id?: string
    notes?: string
  }) => {
    setTicket(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  // Clear entire ticket
  const clearTicket = useCallback(() => {
    setTicket({
      lineItems: [],
      discounts: [],
      tips: [],
    })
  }, [])

  // Calculate totals
  const calculateTotals = useCallback((): Totals => {
    // Subtotal from line items
    const subtotal = ticket.lineItems.reduce((sum, item) => sum + item.line_amount, 0)

    // Calculate discount amount
    let discountAmount = 0
    ticket.discounts.forEach(discount => {
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
    const tipAmount = ticket.tips.reduce((sum, tip) => sum + tip.amount, 0)

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
  const quickAddItem = useCallback((entityId: string, entityName: string, price: number) => {
    addLineItem({
      entity_id: entityId,
      entity_type: 'service', // Default to service
      entity_name: entityName,
      quantity: 1,
      unit_price: price
    })
  }, [addLineItem])

  // Bulk add items (e.g., from appointment)
  const addItemsFromAppointment = useCallback((appointmentData: {
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
  }, [addLineItem, updateTicketInfo, clearTicket])

  // Add customer to ticket (from search)
  const addCustomerToTicket = useCallback((customerData: {
    customer_id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
  }) => {
    updateTicketInfo({
      customer_id: customerData.customer_id,
      customer_name: customerData.customer_name
    })
  }, [updateTicketInfo])

  // Validate ticket before payment
  const validateTicket = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (ticket.lineItems.length === 0) {
      errors.push('No items in ticket')
    }

    // Check for services without stylists
    const servicesWithoutStylist = ticket.lineItems.filter(
      item => item.entity_type === 'service' && !item.stylist_id
    )
    if (servicesWithoutStylist.length > 0) {
      errors.push('All services must have an assigned stylist')
    }

    // Check for invalid amounts
    const invalidItems = ticket.lineItems.filter(
      item => item.quantity <= 0 || item.unit_price < 0
    )
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

  // Memoized values for performance
  const memoizedTotals = useMemo(() => calculateTotals(), [calculateTotals])
  const memoizedSummary = useMemo(() => getTicketSummary(), [getTicketSummary])
  const memoizedValidation = useMemo(() => validateTicket(), [validateTicket])

  return {
    // State
    ticket,
    
    // Actions
    addLineItem,
    updateLineItem,
    removeLineItem,
    addDiscount,
    removeDiscount,
    addTip,
    removeTip,
    updateTicketInfo,
    clearTicket,
    
    // Convenience methods
    quickAddItem,
    addItemsFromAppointment,
    addCustomerToTicket,
    
    // Computed values
    calculateTotals: () => memoizedTotals,
    getTicketSummary: () => memoizedSummary,
    validateTicket: () => memoizedValidation,
    
    // State checks
    isEmpty: ticket.lineItems.length === 0,
    hasItems: ticket.lineItems.length > 0,
    isValid: memoizedValidation.isValid
  }
}