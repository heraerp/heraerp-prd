// ================================================================================
// HERA POS SCHEMAS
// Smart Code: HERA.SCHEMAS.POS.v1
// Point of Sale data structures with universal transaction mapping
// ================================================================================

import { z } from 'zod'

// Cart line types
export const CartService = z.object({
  kind: z.literal('service'),
  service_code: z.string(),
  service_name: z.string(),
  qty: z.number().positive(),
  unit_price: z.number().nonnegative(),
  duration_min: z.number().int().positive().optional(),
})

export const CartItem = z.object({
  kind: z.literal('item'),
  product_sku: z.string(),
  product_name: z.string(),
  qty: z.number().positive(),
  unit_price: z.number().nonnegative(),
  on_hand: z.number().int().optional(),
})

export const CartDiscount = z.object({
  kind: z.literal('discount'),
  amount: z.number().positive(),
  reason: z.string().optional(),
  percentage: z.number().min(0).max(100).optional(),
})

export const CartTip = z.object({
  kind: z.literal('tip'),
  amount: z.number().nonnegative(),
})

export const CartLine = z.discriminatedUnion('kind', [CartService, CartItem, CartDiscount, CartTip])
export type CartLine = z.infer<typeof CartLine>

// Totals calculation
export const Totals = z.object({
  currency: z.string().default('AED'),
  subtotal_services: z.number(),
  subtotal_items: z.number(),
  discount_total: z.number(),
  taxable_subtotal: z.number(),
  tax_rate: z.number().default(0.05), // 5% UAE VAT
  tax_total: z.number(),
  tip_total: z.number(),
  grand_total: z.number(),
})
export type Totals = z.infer<typeof Totals>

// Payment types
export const Payment = z.object({
  method: z.enum(['cash', 'card']),
  amount: z.number().positive(),
  reference: z.string().optional(),
  card_last_four: z.string().optional(),
})
export type Payment = z.infer<typeof Payment>

// Price list items
export const ServicePrice = z.object({
  service_code: z.string(),
  service_name: z.string(),
  price: z.number().nonnegative(),
  duration_min: z.number().int().positive(),
  category: z.string().optional(),
})
export type ServicePrice = z.infer<typeof ServicePrice>

export const ProductPrice = z.object({
  product_sku: z.string(),
  product_name: z.string(),
  price: z.number().nonnegative(),
  on_hand: z.number().int(),
  category: z.string().optional(),
})
export type ProductPrice = z.infer<typeof ProductPrice>

// Invoice schema
export const InvoiceHeader = z.object({
  id: z.string(),
  invoice_number: z.string(),
  txn_id: z.string(),
  smart_code: z.string(),
  organization_id: z.string(),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  }).optional(),
  appointment_id: z.string().optional(),
  created_at: z.string().datetime(),
  status: z.enum(['draft', 'posted', 'paid', 'cancelled']),
})
export type InvoiceHeader = z.infer<typeof InvoiceHeader>

export const InvoiceLine = z.object({
  line_id: z.string(),
  line_type: z.enum(['service_line', 'item_line', 'discount', 'tip', 'tax']),
  description: z.string(),
  qty: z.number().optional(),
  unit_price: z.number().optional(),
  amount: z.number(),
  smart_code: z.string(),
})
export type InvoiceLine = z.infer<typeof InvoiceLine>

export const Invoice = z.object({
  header: InvoiceHeader,
  lines: z.array(InvoiceLine),
  totals: Totals,
  payment: Payment.optional(),
})
export type Invoice = z.infer<typeof Invoice>

// Universal transaction mapping
export const UniversalTxnHeader = z.object({
  txn_id: z.string(),
  txn_type: z.enum(['pos_order', 'payment', 'invoice']),
  smart_code: z.string(),
  txn_date: z.string().datetime(),
  status: z.enum(['draft', 'posted', 'cancelled']),
  currency: z.string(),
  source_entity_type: z.string().optional(),
  source_entity_ref: z.string().optional(),
})
export type UniversalTxnHeader = z.infer<typeof UniversalTxnHeader>

export const UniversalTxnLine = z.object({
  line_id: z.string(),
  line_type: z.string(),
  smart_code: z.string(),
  service_code: z.string().optional(),
  product_sku: z.string().optional(),
  qty: z.number().optional(),
  unit_price: z.number().optional(),
  amount: z.number().optional(),
  currency: z.string(),
  line_data: z.record(z.any()).optional(),
})
export type UniversalTxnLine = z.infer<typeof UniversalTxnLine>

export const UniversalTxn = z.object({
  organization_id: z.string(),
  txn: UniversalTxnHeader,
  lines: z.array(UniversalTxnLine),
  totals: z.object({
    subtotal: z.number(),
    discount_total: z.number(),
    tax_total: z.number(),
    tip_total: z.number(),
    grand_total: z.number(),
    currency: z.string(),
  }).optional(),
})
export type UniversalTxn = z.infer<typeof UniversalTxn>

// Cart state
export const CartState = z.object({
  lines: z.array(CartLine),
  totals: Totals,
  appointment_id: z.string().optional(),
  customer_id: z.string().optional(),
})
export type CartState = z.infer<typeof CartState>

// Checkout response
export const CheckoutResponse = z.object({
  orderId: z.string(),
  invoiceId: z.string(),
  txnId: z.string(),
})
export type CheckoutResponse = z.infer<typeof CheckoutResponse>

// Payment response
export const PaymentResponse = z.object({
  paymentId: z.string(),
  invoiceId: z.string(),
  txnId: z.string(),
})
export type PaymentResponse = z.infer<typeof PaymentResponse>

// Commission calculation (display only)
export const CommissionInfo = z.object({
  service_subtotal: z.number(),
  commission_rate: z.number().default(0.35), // 35%
  commission_amount: z.number(),
  currency: z.string().default('AED'),
})
export type CommissionInfo = z.infer<typeof CommissionInfo>

// Utility functions
export function calculateTotals(lines: CartLine[]): Totals {
  let subtotal_services = 0
  let subtotal_items = 0
  let discount_total = 0
  let tip_total = 0

  lines.forEach(line => {
    switch (line.kind) {
      case 'service':
        subtotal_services += line.qty * line.unit_price
        break
      case 'item':
        subtotal_items += line.qty * line.unit_price
        break
      case 'discount':
        discount_total += line.amount
        break
      case 'tip':
        tip_total += line.amount
        break
    }
  })

  const taxable_subtotal = Math.max(0, subtotal_services + subtotal_items - discount_total)
  const tax_rate = 0.05 // 5% UAE VAT
  const tax_total = Math.round(taxable_subtotal * tax_rate * 100) / 100
  const grand_total = taxable_subtotal + tax_total + tip_total

  return {
    currency: 'AED',
    subtotal_services,
    subtotal_items,
    discount_total,
    taxable_subtotal,
    tax_rate,
    tax_total,
    tip_total,
    grand_total,
  }
}

export function calculateCommission(totals: Totals): CommissionInfo {
  const service_subtotal = totals.subtotal_services
  const commission_rate = 0.35 // 35%
  const commission_amount = Math.round(service_subtotal * commission_rate * 100) / 100

  return {
    service_subtotal,
    commission_rate,
    commission_amount,
    currency: totals.currency,
  }
}