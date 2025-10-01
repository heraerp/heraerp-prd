// ================================================================================
// HERA POS INVOICE DISPLAY
// Smart Code: HERA.UI.POS.INVOICE.V1
// Invoice display with print support
// ================================================================================

'use client'

import { useRef } from 'react'
import { Printer, Download, Mail, Home, Calendar } from 'lucide-react'
import { Invoice } from '@/lib/schemas/pos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface InvoiceDisplayProps {
  invoice: Invoice
  onGoHome?: () => void
  onGoToAppointment?: () => void
}

export function InvoiceDisplay({ invoice, onGoHome, onGoToAppointment }: InvoiceDisplayProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'posted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Invoice</h1>
        <div className="flex gap-2">
          {onGoToAppointment && invoice.header.appointment_id && (
            <Button variant="outline" onClick={onGoToAppointment}>
              <Calendar className="mr-2 h-4 w-4" />
              View Appointment
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          {onGoHome && (
            <Button onClick={onGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Back to POS
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <Card ref={printRef} className="p-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-primary">Hair Talkz</h2>
              <p className="ink-muted mt-1">Premium Salon & Spa</p>
              <p className="text-sm ink-muted mt-2">
                123 Business Bay, Dubai, UAE
                <br />
                Tel: +971 4 123 4567
                <br />
                TRN: 100123456789012
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-bold">{invoice.header.invoice_number}</h3>
              <Badge className={cn('mt-2', getStatusColor(invoice.header.status))}>
                {invoice.header.status.toUpperCase()}
              </Badge>
              <p className="text-sm ink-muted mt-2">{formatDate(invoice.header.created_at)}</p>
            </div>
          </div>

          {/* Customer Info */}
          {invoice.header.customer && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-sm ink-muted mb-2">Bill To:</h4>
              <p className="font-medium">{invoice.header.customer.name}</p>
              <p className="text-sm ink-muted">Customer Code: {invoice.header.customer.code}</p>
              {invoice.header.appointment_id && (
                <p className="text-sm ink-muted">
                  Appointment: {invoice.header.appointment_id}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <h4 className="font-semibold">Invoice Details</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map(line => (
                  <tr key={line.line_id} className="border-b">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{line.description}</p>
                        <p className="text-xs ink-muted">{line.smart_code}</p>
                      </div>
                    </td>
                    <td className="text-center py-3">{line.qty !== undefined ? line.qty : '-'}</td>
                    <td className="text-right py-3">
                      {line.unit_price !== undefined ? formatCurrency(line.unit_price) : '-'}
                    </td>
                    <td className="text-right py-3 font-medium">
                      {line.line_type === 'discount' ? (
                        <span className="text-green-600">
                          -{formatCurrency(Math.abs(line.amount))}
                        </span>
                      ) : line.line_type === 'tip' ? (
                        <span className="text-blue-600">+{formatCurrency(line.amount)}</span>
                      ) : (
                        formatCurrency(line.amount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="ink-muted">Services Subtotal</span>
              <span>{formatCurrency(invoice.totals.subtotal_services)}</span>
            </div>
            {invoice.totals.subtotal_items > 0 && (
              <div className="flex justify-between text-sm">
                <span className="ink-muted">Products Subtotal</span>
                <span>{formatCurrency(invoice.totals.subtotal_items)}</span>
              </div>
            )}
            {invoice.totals.discount_total > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.totals.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="ink-muted">Taxable Amount</span>
              <span>{formatCurrency(invoice.totals.taxable_subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="ink-muted">
                VAT ({(invoice.totals.tax_rate * 100).toFixed(0)}%)
              </span>
              <span>{formatCurrency(invoice.totals.tax_total)}</span>
            </div>
            {invoice.totals.tip_total > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Gratuity</span>
                <span>+{formatCurrency(invoice.totals.tip_total)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total Amount</span>
              <span className="text-primary">{formatCurrency(invoice.totals.grand_total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          {invoice.payment && (
            <>
              <Separator />
              <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">Payment Information</h4>
                <div className="flex justify-between text-sm">
                  <span className="ink-muted">Payment Method</span>
                  <span className="font-medium capitalize">{invoice.payment.method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="ink-muted">Amount Paid</span>
                  <span className="font-medium">{formatCurrency(invoice.payment.amount)}</span>
                </div>
                {invoice.payment.reference && (
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">Reference</span>
                    <span className="font-mono text-xs">{invoice.payment.reference}</span>
                  </div>
                )}
                {invoice.payment.card_last_four && (
                  <div className="flex justify-between text-sm">
                    <span className="ink-muted">Card</span>
                    <span className="font-mono">****{invoice.payment.card_last_four}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-sm ink-muted pt-6">
            <p>Thank you for your business!</p>
            <p className="mt-2">
              Transaction ID: {invoice.header.txn_id}
              <br />
              Smart Code: {invoice.header.smart_code}
            </p>
          </div>
        </div>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${printRef.current ? '#' + printRef.current.id : ''}, ${printRef.current
            ? '#' + printRef.current.id
            : ''} * {
            visibility: visible;
          }
          ${printRef.current ? '#' + printRef.current.id : ''} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
