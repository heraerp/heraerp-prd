/**
 * Production-grade POS transaction validation schemas
 */

import { z } from 'zod'

// Currency codes supported
const SUPPORTED_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR'] as const

// Payment methods
const PAYMENT_METHODS = [
  'cash',
  'card',
  'apple_pay',
  'google_pay',
  'bank_transfer',
  'gift_card'
] as const

// Item validation schema
const POSItemSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
  name: z.string().min(1, 'Item name is required').max(255),
  type: z.enum(['service', 'product'], {
    errorMap: () => ({ message: 'Item type must be either service or product' })
  }),
  price: z
    .number()
    .positive('Price must be positive')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(9999, 'Quantity cannot exceed 9999'),
  staff: z.string().optional(),
  duration: z.number().int().positive().optional(),
  discount: z.number().min(0).max(100).default(0),
  discountType: z.enum(['percentage', 'amount']).default('percentage'),
  discountAmount: z.number().min(0).default(0),
  vatAmount: z.number().min(0).default(0),
  sku: z.string().optional(),
  category: z.string().optional(),
  commission_rate: z.number().min(0).max(100).optional()
})

// Payment split validation schema
const PaymentSplitSchema = z.object({
  method: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: 'Invalid payment method' })
  }),
  amount: z
    .number()
    .positive('Payment amount must be positive')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  reference: z.string().max(255).optional()
})

// Main POS transaction schema
export const POSTransactionSchema = z
  .object({
    organizationId: z.string().uuid('Invalid organization ID'),
    customerId: z.string().uuid().nullable().optional(),
    items: z
      .array(POSItemSchema)
      .min(1, 'At least one item is required')
      .max(100, 'Cannot process more than 100 items'),
    paymentSplits: z
      .array(PaymentSplitSchema)
      .min(1, 'At least one payment method is required')
      .max(10, 'Cannot split payment more than 10 ways'),
    subtotal: z.number().positive('Subtotal must be positive').multipleOf(0.01),
    vatAmount: z.number().min(0, 'VAT amount cannot be negative').multipleOf(0.01),
    totalAmount: z.number().positive('Total amount must be positive').multipleOf(0.01),
    discountAmount: z
      .number()
      .min(0, 'Discount amount cannot be negative')
      .multipleOf(0.01)
      .default(0),
    currencyCode: z.enum(SUPPORTED_CURRENCIES).default('AED'),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .refine(
    data => {
      // Validate subtotal matches sum of items
      const calculatedSubtotal = data.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity
        const discount =
          item.discountType === 'percentage'
            ? itemTotal * (item.discount / 100)
            : item.discountAmount
        return sum + (itemTotal - discount)
      }, 0)

      return Math.abs(calculatedSubtotal - data.subtotal) < 0.01
    },
    { message: 'Subtotal does not match sum of items' }
  )
  .refine(
    data => {
      // Validate total amount
      const expectedTotal = data.subtotal + data.vatAmount - data.discountAmount
      return Math.abs(expectedTotal - data.totalAmount) < 0.01
    },
    { message: 'Total amount calculation is incorrect' }
  )
  .refine(
    data => {
      // Validate payment splits sum to total
      const paymentSum = data.paymentSplits.reduce((sum, split) => sum + split.amount, 0)
      return Math.abs(paymentSum - data.totalAmount) < 0.01
    },
    { message: 'Payment amounts do not match total' }
  )

// Type exports
export type POSTransaction = z.infer<typeof POSTransactionSchema>
export type POSItem = z.infer<typeof POSItemSchema>
export type PaymentSplit = z.infer<typeof PaymentSplitSchema>

// Validation helper
export function validatePOSTransaction(data: unknown): {
  success: boolean
  data?: POSTransaction
  errors?: z.ZodError
} {
  try {
    const validated = POSTransactionSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}
