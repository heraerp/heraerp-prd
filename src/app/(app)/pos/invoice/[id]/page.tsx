// ================================================================================
// HERA POS INVOICE PAGE
// Smart Code: HERA.PAGE.POS.INVOICE.v1
// Invoice display page with print support
// ================================================================================

'use client'

import { useParams } from 'next/navigation'
import { Code } from 'lucide-react'
import { InvoiceDisplay } from '@/components/pos/InvoiceDisplay'
import { useSession } from '@/lib/auth/session'
import { PosApi } from '@/lib/api/pos'
import { useInvoice, usePosNavigation } from '@/lib/hooks/usePos'

const posApi = new PosApi()

export default function InvoiceGenerationPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const { user } = useSession()
  const navigation = usePosNavigation()

  // Load invoice
  const { data: invoice, isLoading, error } = useInvoice(invoiceId, posApi)

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

  if (error || !invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist.</p>
          <Button onClick={() => navigation.goToSale()}>Back to POS</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header with Smart Code */}
      <div className="flex items-center gap-2 mb-6">
        <Code className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500 font-mono">HERA.SALON.POS.INVOICE.DISPLAY.V1</span>
      </div>

      {/* Invoice Display */}
      <InvoiceDisplay
        invoice={invoice}
        onGoHome={() => navigation.goToSale()}
        onGoToAppointment={() => {
          if (invoice.header.appointment_id) {
            navigation.goToAppointment(invoice.header.appointment_id)
          }
        }}
      />
    </div>
  )
}

// Add missing import
import { Button } from '@/components/ui/button'
