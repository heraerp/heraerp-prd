// app/examples/create-transaction/page.tsx
'use client'
import React, { Suspense } from 'react'
import { WizardForm } from '@/ui'
import { useRouter, useSearchParams } from 'next/navigation'

function CreateTransactionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Allow smart code to be passed via URL
  const smartCode = searchParams.get('smart_code') || 'HERA.UNIV.TXN.GENERIC.V1'
  const type = searchParams.get('type')

  const commonExamples = [
    {
      title: 'Sales Order',
      smart_code: 'HERA.RETAIL.SALES.TXN.SORDER.V1',
      description: 'Create a new sales order with line items'
    },
    {
      title: 'Purchase Order',
      smart_code: 'HERA.SCM.PUR.TXN.PO.V1',
      description: 'Create a purchase order for vendors'
    },
    {
      title: 'Invoice',
      smart_code: 'HERA.FIN.AR.TXN.INV.V1',
      description: 'Generate a customer invoice'
    },
    {
      title: 'Journal Entry',
      smart_code: 'HERA.FIN.GL.TXN.JE.V1',
      description: 'Create manual journal entries'
    },
    {
      title: 'Appointment Booking',
      smart_code: 'HERA.SALON.APPT.TXN.BOOKING.V1',
      description: 'Book a salon appointment with services'
    },
    {
      title: 'Inventory Receipt',
      smart_code: 'HERA.INV.RCV.TXN.IN.V1',
      description: 'Receive inventory into warehouse'
    }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push('/examples')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back to Examples
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Create Transaction</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">Smart Code:</div>
              <code className="text-sm font-mono">{smartCode}</code>
            </div>
            <WizardForm smartCode={smartCode} transactionType={type || undefined} />
          </div>
        </div>

        {/* Examples Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-3">Quick Examples</h3>
            <div className="space-y-2">
              {commonExamples.map(example => (
                <button
                  key={example.smart_code}
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set('smart_code', example.smart_code)
                    router.push(url.pathname + url.search)
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    smartCode === example.smart_code
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{example.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{example.description}</div>
                  <code className="text-xs text-gray-500 mt-1 block">{example.smart_code}</code>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How it Works</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Form spec loaded via UCR or defaults</li>
              <li>• Multi-step wizard with validation</li>
              <li>• Line items with auto-calculation</li>
              <li>• Posts to universal transaction API</li>
              <li>• Full Finance DNA support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CreateTransactionContent />
    </Suspense>
  )
}
