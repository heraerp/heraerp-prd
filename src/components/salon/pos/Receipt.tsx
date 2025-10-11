'use client'

import { useRef } from 'react'
import {
  Printer,
  Download,
  Mail,
  X,
  Receipt as ReceiptIcon,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/luxe-dialog'
import { format } from 'date-fns'

interface ReceiptProps {
  open: boolean
  onClose: () => void
  saleData: {
    transaction_id: string
    transaction_code: string
    timestamp: string
    customer_name?: string
    appointment_id?: string
    organization_name?: string
    branch_name: string
    branch_address?: string
    branch_phone?: string
    lineItems: Array<{
      id: string
      entity_name: string
      entity_type: 'service' | 'product'
      quantity: number
      unit_price: number
      line_amount: number
      stylist_name?: string
      notes?: string
    }>
    discounts: Array<{
      id: string
      type: 'percentage' | 'fixed'
      value: number
      description: string
    }>
    tips: Array<{
      id: string
      amount: number
      method: 'cash' | 'card'
      stylist_name?: string
    }>
    payments: Array<{
      id: string
      type: 'cash' | 'card' | 'voucher'
      amount: number
      reference?: string
      cardType?: string
    }>
    totals: {
      subtotal: number
      discountAmount: number
      tipAmount: number
      taxAmount: number
      total: number
    }
    changeAmount: number
    commission_lines?: Array<{
      stylist_id: string
      stylist_name: string
      service_amount: number
      commission_rate: number
      commission_amount: number
    }>
  } | null
}

export function Receipt({ open, onClose, saleData }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  if (!saleData) return null

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const receiptContent = receiptRef.current?.innerHTML || ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${saleData.transaction_code}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.4;
              font-size: 12px;
            }
            .receipt { 
              max-width: 300px; 
              margin: 0 auto; 
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
            .small { font-size: 10px; }
            .stylist-info { background-color: #f8f9fa; padding: 2px 4px; border-radius: 2px; margin: 1px 0; }
            .tip-info { color: #0066cc; }
            .discount-info { color: #00aa00; }
            .commission-info { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 4px; margin: 2px 0; }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
              .stylist-info { background-color: #f0f0f0 !important; }
              .commission-info { background-color: #f8f8f8 !important; border: 1px solid #ddd !important; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${receiptContent}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
  }

  const handleDownload = () => {
    // Generate a more detailed text version for download
    const receiptText = generateReceiptText()
    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt_${saleData.transaction_code}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateReceiptText = () => {
    const lines = []
    lines.push('='.repeat(40))
    if (saleData.organization_name) {
      lines.push(`${saleData.organization_name.toUpperCase()}`)
    }
    lines.push(`${saleData.branch_name.toUpperCase()}`)
    if (saleData.branch_address) {
      lines.push(saleData.branch_address)
    }
    if (saleData.branch_phone) {
      lines.push(saleData.branch_phone)
    }
    lines.push('='.repeat(40))
    lines.push(`Receipt #: ${saleData.transaction_code}`)
    lines.push(`Date: ${formatDateTime(saleData.timestamp)}`)
    if (saleData.customer_name) lines.push(`Customer: ${saleData.customer_name}`)
    lines.push('-'.repeat(40))
    lines.push('ITEMS:')

    saleData.lineItems.forEach(item => {
      lines.push(`${item.entity_name}`)
      if (item.stylist_name) lines.push(`  Stylist: ${item.stylist_name}`)
      if (item.notes) lines.push(`  Note: ${item.notes}`)
      lines.push(
        `  ${item.quantity} x $${item.unit_price.toFixed(2)} = $${item.line_amount.toFixed(2)}`
      )
      lines.push('')
    })

    if (saleData.discounts.length > 0) {
      lines.push('DISCOUNTS:')
      saleData.discounts.forEach(discount => {
        lines.push(
          `${discount.description}: -${discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}`
        )
      })
      lines.push('')
    }

    if (saleData.tips.length > 0) {
      lines.push('TIPS:')
      saleData.tips.forEach(tip => {
        lines.push(
          `${tip.stylist_name ? `Tip for ${tip.stylist_name}` : 'General Tip'} (${tip.method}): +$${tip.amount.toFixed(2)}`
        )
      })
      lines.push('')
    }

    lines.push('-'.repeat(40))
    lines.push(`Subtotal: $${saleData.totals.subtotal.toFixed(2)}`)
    if (saleData.totals.discountAmount > 0)
      lines.push(`Discounts: -$${saleData.totals.discountAmount.toFixed(2)}`)
    if (saleData.totals.tipAmount > 0) lines.push(`Tips: +$${saleData.totals.tipAmount.toFixed(2)}`)
    if (saleData.totals.taxAmount > 0) lines.push(`Tax: $${saleData.totals.taxAmount.toFixed(2)}`)
    lines.push(`TOTAL: $${saleData.totals.total.toFixed(2)}`)
    lines.push('')

    lines.push('PAYMENT:')
    saleData.payments.forEach(payment => {
      lines.push(`${getPaymentMethodDisplay(payment)}: $${payment.amount.toFixed(2)}`)
    })
    if (saleData.changeAmount > 0) lines.push(`CHANGE: $${saleData.changeAmount.toFixed(2)}`)

    lines.push('='.repeat(40))
    lines.push('Thank you for your business!')
    lines.push(`Transaction ID: ${saleData.transaction_id}`)

    return lines.join('\n')
  }

  const handleEmail = () => {
    // In a real implementation, you'd send the receipt via email
    console.log('Email receipt')
  }

  const formatDateTime = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM dd, yyyy • h:mm a')
  }

  const getPaymentMethodDisplay = (payment: any) => {
    switch (payment.type) {
      case 'cash':
        return 'Cash'
      case 'card':
        return `${payment.cardType?.charAt(0)?.toUpperCase()}${payment.cardType?.slice(1)} ${payment.reference ? `•••${payment.reference}` : ''}`
      case 'voucher':
        return `Voucher ${payment.reference || ''}`
      default:
        return payment.type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto ink dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 ink dark:text-white">
            <ReceiptIcon className="w-5 h-5 ink dark:text-slate-300" />
            Transaction Receipt
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <div ref={receiptRef} className="space-y-4 font-mono text-sm">
          {/* Header */}
          <div className="text-center space-y-2">
            {saleData.organization_name && (
              <h1 className="text-xl font-bold">{saleData.organization_name}</h1>
            )}
            <h2 className={saleData.organization_name ? "text-lg font-semibold" : "text-xl font-bold"}>
              {saleData.branch_name}
            </h2>
            {(saleData.branch_address || saleData.branch_phone) && (
              <div className="text-sm text-muted-foreground">
                {saleData.branch_address && (
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {saleData.branch_address}
                  </div>
                )}
                {saleData.branch_phone && (
                  <div className="flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" />
                    {saleData.branch_phone}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Transaction Info */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{saleData.transaction_code}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{formatDateTime(saleData.timestamp)}</span>
            </div>
            {saleData.customer_name && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{saleData.customer_name}</span>
              </div>
            )}
            {saleData.appointment_id && (
              <div className="flex justify-between">
                <span>Appointment:</span>
                <span>#{saleData.appointment_id.slice(-6)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm">ITEMS</h3>
            {saleData.lineItems.map((item, index) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.entity_name}</div>
                    {item.stylist_name && (
                      <div className="text-xs text-muted-foreground stylist-info">
                        👤 Stylist: {item.stylist_name}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-muted-foreground italic">
                        📝 Note: {item.notes}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={item.entity_type === 'service' ? 'default' : 'secondary'}
                    className="text-xs ml-2"
                  >
                    {item.entity_type}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    {item.quantity} × ${item.unit_price.toFixed(2)}
                  </span>
                  <span className="font-bold">${item.line_amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Discounts */}
          {saleData.discounts.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-bold text-sm">DISCOUNTS</h3>
                {saleData.discounts.map(discount => (
                  <div
                    key={discount.id}
                    className="flex justify-between text-sm text-green-600 discount-info"
                  >
                    <span>🏷️ {discount.description}</span>
                    <span>
                      -
                      {discount.type === 'percentage'
                        ? `${discount.value}%`
                        : `$${discount.value.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Tips */}
          {saleData.tips.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-bold text-sm">TIPS</h3>
                {saleData.tips.map(tip => (
                  <div key={tip.id} className="flex justify-between text-sm text-blue-600 tip-info">
                    <span>
                      💰 {tip.stylist_name ? `Tip for ${tip.stylist_name}` : 'General Tip'} (
                      {tip.method})
                    </span>
                    <span>+${tip.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${saleData.totals.subtotal.toFixed(2)}</span>
            </div>

            {saleData.totals.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Total Discounts:</span>
                <span>-${saleData.totals.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {saleData.totals.tipAmount > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Total Tips:</span>
                <span>+${saleData.totals.tipAmount.toFixed(2)}</span>
              </div>
            )}

            {saleData.totals.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${saleData.totals.taxAmount.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL:</span>
              <span>${saleData.totals.total.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm">PAYMENT</h3>
            {saleData.payments.map(payment => (
              <div key={payment.id} className="flex justify-between text-sm">
                <span>{getPaymentMethodDisplay(payment)}</span>
                <span>${payment.amount.toFixed(2)}</span>
              </div>
            ))}

            {saleData.changeAmount > 0 && (
              <div className="flex justify-between font-bold text-sm">
                <span>CHANGE DUE:</span>
                <span>${saleData.changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Stylist Summary */}
          {(() => {
            const stylistSummary = saleData.lineItems
              .filter(item => item.stylist_name && item.entity_type === 'service')
              .reduce(
                (acc, item) => {
                  const stylist = acc.find(s => s.name === item.stylist_name)
                  if (stylist) {
                    stylist.services.push(item.entity_name)
                    stylist.total += item.line_amount
                  } else {
                    acc.push({
                      name: item.stylist_name!,
                      services: [item.entity_name],
                      total: item.line_amount
                    })
                  }
                  return acc
                },
                [] as Array<{ name: string; services: string[]; total: number }>
              )

            return (
              stylistSummary.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">STYLIST SUMMARY</h3>
                    {stylistSummary.map((stylist, index) => (
                      <div key={index} className="space-y-1 text-xs commission-info">
                        <div className="flex justify-between font-medium">
                          <span>👤 {stylist.name}</span>
                          <span>${stylist.total.toFixed(2)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Services: {stylist.services.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )
          })()}

          {/* Stylist Commission Summary */}
          {saleData.commission_lines && saleData.commission_lines.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-bold text-sm">STYLIST COMMISSIONS</h3>
                {saleData.commission_lines.map(commission => (
                  <div key={commission.stylist_id} className="space-y-1 text-xs commission-info">
                    <div className="flex justify-between font-medium">
                      <span>💰 {commission.stylist_name}</span>
                      <span>${commission.commission_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Services: ${commission.service_amount.toFixed(2)}</span>
                      <span>Rate: {(commission.commission_rate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Footer */}
          <div className="text-center text-xs ink-muted dark:text-slate-300 space-y-1">
            <div>Thank you for your business!</div>
            <div>Please visit us again soon.</div>
            <div className="mt-3">Transaction ID: {saleData.transaction_id}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleEmail} className="flex-1">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button onClick={onClose} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
