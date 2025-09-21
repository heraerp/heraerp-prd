// ================================================================================
// HERA POS API CLIENT
// Smart Code: HERA.API.POS.v1
// Point of Sale API with mock implementation
// ================================================================================

import { z } from 'zod'
import {
  CartLine,
  CartState,
  ServicePrice,
  ProductPrice,
  Totals,
  Payment,
  Invoice,
  UniversalTxn,
  CheckoutResponse,
  PaymentResponse,
  calculateTotals,
  calculateCommission
} from '@/lib/schemas/pos'

// Mock price list data
const MOCK_SERVICES: ServicePrice[] = [
  {
    service_code: 'SRV-001',
    service_name: 'Hair Cut & Style',
    price: 150,
    duration_min: 60,
    category: 'Hair Services'
  },
  {
    service_code: 'SRV-002',
    service_name: 'Hair Color',
    price: 350,
    duration_min: 90,
    category: 'Hair Services'
  },
  {
    service_code: 'SRV-003',
    service_name: 'Highlights',
    price: 450,
    duration_min: 120,
    category: 'Hair Services'
  },
  {
    service_code: 'SRV-004',
    service_name: 'Keratin Treatment',
    price: 800,
    duration_min: 180,
    category: 'Hair Services'
  },
  {
    service_code: 'SRV-005',
    service_name: 'Blow Dry',
    price: 80,
    duration_min: 45,
    category: 'Hair Services'
  },
  {
    service_code: 'SRV-006',
    service_name: 'Beard Trim',
    price: 50,
    duration_min: 30,
    category: 'Grooming'
  },
  {
    service_code: 'SRV-007',
    service_name: 'Facial Treatment',
    price: 200,
    duration_min: 60,
    category: 'Spa'
  },
  {
    service_code: 'SRV-008',
    service_name: 'Manicure',
    price: 120,
    duration_min: 45,
    category: 'Nails'
  },
  {
    service_code: 'SRV-009',
    service_name: 'Pedicure',
    price: 150,
    duration_min: 60,
    category: 'Nails'
  },
  {
    service_code: 'SRV-010',
    service_name: 'Gel Polish',
    price: 180,
    duration_min: 60,
    category: 'Nails'
  }
]

const MOCK_PRODUCTS: ProductPrice[] = [
  {
    product_sku: 'PRD-001',
    product_name: 'Shampoo - Keratin Care',
    price: 120,
    on_hand: 45,
    category: 'Hair Care'
  },
  {
    product_sku: 'PRD-002',
    product_name: 'Conditioner - Keratin Care',
    price: 120,
    on_hand: 38,
    category: 'Hair Care'
  },
  {
    product_sku: 'PRD-003',
    product_name: 'Hair Serum',
    price: 85,
    on_hand: 23,
    category: 'Hair Care'
  },
  {
    product_sku: 'PRD-004',
    product_name: 'Hair Mask',
    price: 150,
    on_hand: 15,
    category: 'Hair Care'
  },
  {
    product_sku: 'PRD-005',
    product_name: 'Styling Gel',
    price: 65,
    on_hand: 52,
    category: 'Styling'
  },
  {
    product_sku: 'PRD-006',
    product_name: 'Hair Spray',
    price: 75,
    on_hand: 31,
    category: 'Styling'
  },
  {
    product_sku: 'PRD-007',
    product_name: 'Beard Oil',
    price: 95,
    on_hand: 18,
    category: 'Grooming'
  },
  {
    product_sku: 'PRD-008',
    product_name: 'Face Wash',
    price: 85,
    on_hand: 27,
    category: 'Skin Care'
  },
  {
    product_sku: 'PRD-009',
    product_name: 'Moisturizer',
    price: 110,
    on_hand: 20,
    category: 'Skin Care'
  },
  {
    product_sku: 'PRD-010',
    product_name: 'Nail Polish Set',
    price: 150,
    on_hand: 12,
    category: 'Nails'
  }
]

// Mock invoices storage
let mockInvoices: Map<string, Invoice> = new Map()
let invoiceCounter = 1

export class PosApi {
  private baseUrl: string
  private useMock: boolean

  constructor(baseUrl = '', useMock = true) {
    this.baseUrl = baseUrl
    this.useMock = useMock
  }

  // Get price list (services and products)
  async priceList(): Promise<{ services: ServicePrice[]; products: ProductPrice[] }> {
    if (this.useMock) {
      await this.simulateDelay()
      return { services: MOCK_SERVICES, products: MOCK_PRODUCTS }
    }

    const response = await fetch(`${this.baseUrl}/pos/price-list`)
    if (!response.ok) throw new Error('Failed to fetch price list')
    return response.json()
  }

  // Create checkout (converts cart to invoice)
  async checkout(cart: CartState, txnId: string): Promise<CheckoutResponse> {
    if (this.useMock) {
      await this.simulateDelay()

      // Generate invoice
      const invoiceId = `INV-${new Date().getFullYear()}-${String(invoiceCounter++).padStart(5, '0')}`
      const orderId = `ORD-${Date.now()}`

      // Build invoice lines
      const lines = cart.lines.map((line, index) => {
        switch (line.kind) {
          case 'service':
            return {
              line_id: `line-${index + 1}`,
              line_type: 'service_line' as const,
              description: line.service_name,
              qty: line.qty,
              unit_price: line.unit_price,
              amount: line.qty * line.unit_price,
              smart_code: 'HERA.SALON.POS.LINE.SERVICE.V1'
            }
          case 'item':
            return {
              line_id: `line-${index + 1}`,
              line_type: 'item_line' as const,
              description: line.product_name,
              qty: line.qty,
              unit_price: line.unit_price,
              amount: line.qty * line.unit_price,
              smart_code: 'HERA.SALON.POS.LINE.PRODUCT.V1'
            }
          case 'discount':
            return {
              line_id: `line-${index + 1}`,
              line_type: 'discount' as const,
              description: `Discount${line.reason ? ` - ${line.reason}` : ''}`,
              amount: -line.amount,
              smart_code: 'HERA.SALON.POS.LINE.DISCOUNT.V1'
            }
          case 'tip':
            return {
              line_id: `line-${index + 1}`,
              line_type: 'tip' as const,
              description: 'Gratuity',
              amount: line.amount,
              smart_code: 'HERA.SALON.POS.LINE.TIP.V1'
            }
        }
      })

      // Add tax line
      if (cart.totals.tax_total > 0) {
        lines.push({
          line_id: `line-${lines.length + 1}`,
          line_type: 'tax' as const,
          description: `VAT ${(cart.totals.tax_rate * 100).toFixed(0)}%`,
          amount: cart.totals.tax_total,
          smart_code: 'HERA.SALON.POS.LINE.TAX.V1'
        })
      }

      const invoice: Invoice = {
        header: {
          id: invoiceId,
          invoice_number: invoiceId,
          txn_id: txnId,
          smart_code: 'HERA.SALON.POS.INVOICE.v1',
          organization_id: 'org-hairtalkz-001',
          customer: cart.customer_id
            ? {
                id: cart.customer_id,
                name: 'Emma Thompson',
                code: 'CUST-001'
              }
            : undefined,
          appointment_id: cart.appointment_id,
          created_at: new Date().toISOString(),
          status: 'draft'
        },
        lines,
        totals: cart.totals
      }

      mockInvoices.set(invoiceId, invoice)

      return { orderId, invoiceId, txnId }
    }

    const response = await fetch(`${this.baseUrl}/pos/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart, txn_id: txnId })
    })
    if (!response.ok) throw new Error('Failed to create checkout')
    return response.json()
  }

  // Process payment
  async pay(invoiceId: string, payment: Payment): Promise<PaymentResponse> {
    if (this.useMock) {
      await this.simulateDelay(800) // Simulate payment processing

      const invoice = mockInvoices.get(invoiceId)
      if (!invoice) throw new Error('Invoice not found')

      // Update invoice
      invoice.payment = payment
      invoice.header.status = 'paid'
      const paymentId = `PAY-${Date.now()}`

      // Simulate payment authorization
      if (payment.method === 'card') {
        // Simulate card processing
        await this.simulateDelay(1200)
      }

      return {
        paymentId,
        invoiceId,
        txnId: invoice.header.txn_id
      }
    }

    const response = await fetch(`${this.baseUrl}/pos/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, payment })
    })
    if (!response.ok) throw new Error('Failed to process payment')
    return response.json()
  }

  // Get invoice
  async invoice(invoiceId: string): Promise<Invoice> {
    if (this.useMock) {
      await this.simulateDelay()
      const invoice = mockInvoices.get(invoiceId)
      if (!invoice) throw new Error('Invoice not found')
      return invoice
    }

    const response = await fetch(`${this.baseUrl}/pos/invoice/${invoiceId}`)
    if (!response.ok) throw new Error('Failed to fetch invoice')
    return response.json()
  }

  // Load appointment into cart
  async loadAppointment(appointmentId: string): Promise<CartState> {
    if (this.useMock) {
      await this.simulateDelay()

      // Mock appointment services based on the appointment
      const lines: CartLine[] = []

      // Add services from appointment
      if (appointmentId === 'appt-001') {
        lines.push({
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut & Style',
          qty: 1,
          unit_price: 150,
          duration_min: 60
        })
        lines.push({
          kind: 'service',
          service_code: 'SRV-002',
          service_name: 'Hair Color',
          qty: 1,
          unit_price: 350,
          duration_min: 90
        })
      } else if (appointmentId === 'appt-002') {
        lines.push({
          kind: 'service',
          service_code: 'SRV-004',
          service_name: 'Keratin Treatment',
          qty: 1,
          unit_price: 800,
          duration_min: 180
        })
      } else {
        // Default service
        lines.push({
          kind: 'service',
          service_code: 'SRV-001',
          service_name: 'Hair Cut & Style',
          qty: 1,
          unit_price: 150,
          duration_min: 60
        })
      }

      return {
        lines,
        totals: calculateTotals(lines),
        appointment_id: appointmentId,
        customer_id: 'cust-001'
      }
    }

    const response = await fetch(`${this.baseUrl}/pos/appointment/${appointmentId}`)
    if (!response.ok) throw new Error('Failed to load appointment')
    return response.json()
  }

  // Simulate network delay
  private simulateDelay(ms = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
