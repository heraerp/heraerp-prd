// ================================================================================
// HERA POS PAYMENT PAGE
// Smart Code: HERA.PAGE.POS.PAYMENT.V1
// Payment processing page with method selection
// ================================================================================

'use client'

import React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PaymentMethodSelector } from '@/components/pos/PaymentMethodSelector'
import { useSession } from '@/lib/auth/session'
import { PosApi } from '@/lib/api/pos'
import { useInvoice, usePayment, usePosNavigation } from '@/lib/hooks/usePos'

const posApi = new PosApi()

function PaymentProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get('invoice')
  const { user } = useSession()
  const navigation = usePosNavigation()

  // Load invoice
  const { data: invoice, isLoading } = useInvoice(invoiceId || '', posApi)

  // Payment mutation
  const payment = usePayment(posApi)

  if (!invoiceId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No invoice specified</p>
          <Button onClick={() => navigation.goToSale()}>Back to POS</Button>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Invoice not found</p>
          <Button onClick={() => navigation.goToSale()}>Back to POS</Button>
        </Card>
      </div>
    )
  }

  const handlePayment = (paymentData: any) => {
    payment.mutate({
      invoiceId: invoice.header.id,
      payment: paymentData
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Process Payment</h1>
          <div className="flex items-center gap-2 mt-2">
            <Code className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500 font-mono">
              HERA.SALON.POS.PAYMENT.PROCESS.V1
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigation.goToSale()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to POS
        </Button>
      </div>

      {/* Invoice Summary */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Invoice Summary</h3>
            <p className="text-gray-600">{invoice.header.invoice_number}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigation.goToInvoice(invoice.header.id)}
          >
            <FileText className="mr-2 h-4 w-4" />
            View Invoice
          </Button>
        </div>

        <div className="space-y-2">
          {invoice.header.customer && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer</span>
              <span className="font-medium">{invoice.header.customer.name}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Services</span>
            <span>AED {invoice.totals.subtotal_services.toFixed(2)}</span>
          </div>
          {invoice.totals.subtotal_items > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Products</span>
              <span>AED {invoice.totals.subtotal_items.toFixed(2)}</span>
            </div>
          )}
          {invoice.totals.discount_total > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-AED {invoice.totals.discount_total.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">VAT (5%)</span>
            <span>AED {invoice.totals.tax_total.toFixed(2)}</span>
          </div>
          {invoice.totals.tip_total > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Tip</span>
              <span>+AED {invoice.totals.tip_total.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount</span>
              <span className="text-primary">AED {invoice.totals.grand_total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Method Selection */}
      <PaymentMethodSelector
        amount={invoice.totals.grand_total}
        onPayment={handlePayment}
        isProcessing={payment.isPending}
      />

      {/* Smart Code Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Transaction ID: {invoice.header.txn_id}</p>
      </div>
    </div>
  )
}

export default function PaymentProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentProcessingContent />
    </Suspense>
  )
}
