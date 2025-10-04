/**
 * HERA POS Checkout Payload Builder
 * Smart Code: HERA.LIB.SALON.POS.CHECKOUT.BUILDER.V1
 *
 * Maps POS cart → universal_transactions + universal_transaction_lines
 * Uses HERA smart codes and relationships for Sacred Six tables
 *
 * Transaction Structure:
 * - Header: universal_transactions (HERA.SALON.POS.SALE.V1)
 * - Lines: universal_transaction_lines (SERVICE.LINE.V1 | PRODUCT.LINE.V1)
 *
 * Relationships:
 * - AT_BRANCH: Branch isolation
 * - BILLED_TO: Customer link
 * - PERFORMED_BY: Service stylist
 * - ASSISTED_BY: Product attribution
 * - FOR_ENTITY: Service entity
 * - ITEM: Product entity
 */

import type { PosLine } from '@/hooks/usePosCart'

export interface CheckoutOptions {
  branchId?: string
  customerId?: string
  customerName?: string
  appointmentId?: string
  subtotal: number
  discountAmount?: number
  discountType?: 'fixed' | 'percentage'
  tipAmount?: number
  total: number
  paymentMethod?: string
  notes?: string
}

export interface TransactionPayload {
  transaction: {
    smart_code: string
    transaction_type: string
    transaction_date: string
    total_amount: number
    currency_code: string
    metadata: {
      subtotal: number
      discount_amount?: number
      discount_type?: string
      tip_amount?: number
      payment_method?: string
      notes?: string
    }
    relationships: Array<{
      type: string
      to_entity_id: string
    }>
  }
  lines: Array<{
    line_type_code: string
    line_number: number
    entity_id?: string
    quantity: number
    unit_price: number
    line_amount: number
    currency_code: string
    metadata?: {
      staff_id?: string
      staff_name?: string
      duration?: number
      kind: 'SERVICE' | 'PRODUCT'
    }
    relationships: Array<{
      type: string
      to_entity_id: string
    }>
  }>
}

/**
 * Build checkout payload from POS cart
 * Maps cart state to universal transaction structure
 */
export function buildCheckoutPayload(
  lines: PosLine[],
  options: CheckoutOptions
): TransactionPayload {
  const {
    branchId,
    customerId,
    customerName,
    appointmentId,
    subtotal,
    discountAmount = 0,
    discountType = 'fixed',
    tipAmount = 0,
    total,
    paymentMethod = 'cash',
    notes
  } = options

  // Build transaction header
  const transaction = {
    smart_code: 'HERA.SALON.POS.SALE.V1',
    transaction_type: 'SALE',
    transaction_date: new Date().toISOString(),
    total_amount: total,
    currency_code: 'AED',
    metadata: {
      subtotal,
      discount_amount: discountAmount,
      discount_type: discountType,
      tip_amount: tipAmount,
      payment_method: paymentMethod,
      notes: notes || undefined,
      customer_name: customerName
    },
    relationships: [
      // Branch relationship
      ...(branchId
        ? [
            {
              type: 'AT_BRANCH',
              to_entity_id: branchId
            }
          ]
        : []),
      // Customer relationship
      ...(customerId
        ? [
            {
              type: 'BILLED_TO',
              to_entity_id: customerId
            }
          ]
        : []),
      // Appointment relationship
      ...(appointmentId
        ? [
            {
              type: 'FROM_APPOINTMENT',
              to_entity_id: appointmentId
            }
          ]
        : [])
    ]
  }

  // Build transaction lines
  const transactionLines = lines.map((line, index) => {
    const lineAmount = line.qty * line.price

    if (line.kind === 'SERVICE') {
      // Service line
      return {
        line_type_code: 'HERA.SALON.SERVICE.LINE.V1',
        line_number: index + 1,
        entity_id: line.entityId,
        quantity: line.qty,
        unit_price: line.price,
        line_amount: lineAmount,
        currency_code: 'AED',
        metadata: {
          staff_id: line.staffId,
          staff_name: line.staffName,
          duration: line.duration,
          kind: 'SERVICE' as const,
          service_name: line.name,
          service_code: line.code
        },
        relationships: [
          // Staff who performed the service
          {
            type: 'PERFORMED_BY',
            to_entity_id: line.staffId
          },
          // Service entity
          {
            type: 'FOR_ENTITY',
            to_entity_id: line.entityId
          },
          // Branch (if provided)
          ...(branchId
            ? [
                {
                  type: 'AT_BRANCH',
                  to_entity_id: branchId
                }
              ]
            : [])
        ]
      }
    } else {
      // Product line
      return {
        line_type_code: 'HERA.SALON.PRODUCT.LINE.V1',
        line_number: index + 1,
        entity_id: line.entityId,
        quantity: line.qty,
        unit_price: line.price,
        line_amount: lineAmount,
        currency_code: 'AED',
        metadata: {
          staff_id: line.staffId,
          staff_name: line.staffName,
          kind: 'PRODUCT' as const,
          product_name: line.name,
          product_code: line.code
        },
        relationships: [
          // Product entity
          {
            type: 'ITEM',
            to_entity_id: line.entityId
          },
          // Staff who assisted (optional for products)
          ...(line.staffId
            ? [
                {
                  type: 'ASSISTED_BY',
                  to_entity_id: line.staffId
                }
              ]
            : []),
          // Branch (if provided)
          ...(branchId
            ? [
                {
                  type: 'AT_BRANCH',
                  to_entity_id: branchId
                }
              ]
            : [])
        ]
      }
    }
  })

  return {
    transaction,
    lines: transactionLines
  }
}

/**
 * Validate checkout payload before submission
 * Ensures all required fields are present
 */
export function validateCheckoutPayload(payload: TransactionPayload): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate transaction
  if (!payload.transaction.smart_code) {
    errors.push('Transaction smart code is required')
  }
  if (!payload.transaction.transaction_type) {
    errors.push('Transaction type is required')
  }
  if (payload.transaction.total_amount <= 0) {
    errors.push('Transaction total must be greater than 0')
  }

  // Validate lines
  if (payload.lines.length === 0) {
    errors.push('At least one line item is required')
  }

  payload.lines.forEach((line, index) => {
    if (!line.line_type_code) {
      errors.push(`Line ${index + 1}: Line type code is required`)
    }
    if (!line.entity_id) {
      errors.push(`Line ${index + 1}: Entity ID is required`)
    }
    if (line.quantity <= 0) {
      errors.push(`Line ${index + 1}: Quantity must be greater than 0`)
    }
    if (line.unit_price < 0) {
      errors.push(`Line ${index + 1}: Unit price cannot be negative`)
    }

    // Service-specific validation
    if (line.metadata?.kind === 'SERVICE' && !line.metadata?.staff_id) {
      errors.push(`Line ${index + 1}: Service requires a staff member`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
