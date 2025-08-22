import React from 'react'
import { format } from 'date-fns'

interface ReceiptProps {
  transaction: any
  items: any[]
  subtotal: number
  vatAmount: number
  totalAmount: number
  discountAmount: number
  paymentSplits: any[]
  customer?: any
  organization: any
  currencySymbol?: string
}

export const POSReceipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ 
    transaction, 
    items, 
    subtotal, 
    vatAmount, 
    totalAmount, 
    discountAmount,
    paymentSplits, 
    customer, 
    organization,
    currencySymbol = 'AED'
  }, ref) => {

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toFixed(2)}`
  }

  return (
    <div ref={ref} className="w-[300px] p-4 bg-white font-mono text-xs">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">{organization.name}</h1>
        <p>{organization.address}</p>
        <p>Tel: {organization.phone}</p>
        <p>{organization.taxNumber}</p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Transaction Info */}
      <div className="mb-3">
        <p>Receipt No: {transaction.transactionCode}</p>
        <p>Date: {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}</p>
        {customer && <p>Customer: {customer.name}</p>}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Items */}
      <div className="mb-3">
        {items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span className="flex-1">{item.name}</span>
              <span>{formatCurrency(item.price)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>  Qty: {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
            {item.discount > 0 && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>  Discount: {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}</span>
                <span>-{formatCurrency(item.discountAmount)}</span>
              </div>
            )}
            {item.type === 'service' && item.staff && (
              <div className="text-xs text-gray-600">
                  Staff: {item.staff}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Totals */}
      <div className="mb-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>VAT (5%):</span>
          <span>{formatCurrency(vatAmount)}</span>
        </div>
        <div className="border-t border-black mt-1 pt-1">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Payment */}
      <div className="mb-3">
        <p className="font-bold mb-1">Payment Details:</p>
        {paymentSplits.map((payment, index) => (
          <div key={index} className="flex justify-between">
            <span>{payment.method.replace(/_/g, ' ').toUpperCase()}:</span>
            <span>{formatCurrency(payment.amount)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Footer */}
      <div className="text-center text-xs">
        <p className="mb-2">Thank you for your visit!</p>
        <p>*All prices include VAT*</p>
        <p className="mt-2">{new Date().toLocaleString()}</p>
      </div>

      {/* Barcode placeholder */}
      <div className="mt-4 text-center">
        <div className="inline-block bg-black h-12 w-32" />
        <p className="text-xs mt-1">{transaction.transactionCode}</p>
      </div>
    </div>
  )
})

POSReceipt.displayName = 'POSReceipt'

// Print receipt function
export const printReceipt = (receiptData: ReceiptProps) => {
  const printWindow = window.open('', '_blank', 'width=300,height=600')
  
  if (!printWindow) return

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <style>
        body { 
          margin: 0; 
          padding: 20px; 
          font-family: monospace; 
          font-size: 12px;
        }
        .receipt { width: 300px; }
        .center { text-align: center; }
        .border-dashed { 
          border-top: 1px dashed #000; 
          margin: 8px 0; 
        }
        .flex { 
          display: flex; 
          justify-content: space-between; 
        }
        .bold { font-weight: bold; }
        .small { font-size: 10px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt">
        <!-- Receipt content would be generated here -->
      </div>
    </body>
    </html>
  `

  printWindow.document.write(receiptHTML)
  printWindow.document.close()
}