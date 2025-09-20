// ================================================================================
// HERA POS PAYMENT METHOD SELECTOR
// Smart Code: HERA.UI.POS.PAYMENT_METHOD.v1
// Payment method selection with validation
// ================================================================================

'use client'

import { useState } from 'react'
import { CreditCard, Banknote, Loader2 } from 'lucide-react'
import { Payment } from '@/lib/schemas/pos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PaymentMethodSelectorProps {
  amount: number
  onPayment: (payment: Payment) => void
  isProcessing?: boolean
}

export function PaymentMethodSelector({ amount, onPayment, isProcessing }: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<'cash' | 'card'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [cardReference, setCardReference] = useState('')
  const [cardLastFour, setCardLastFour] = useState('')

  const calculateChange = () => {
    const received = parseFloat(cashReceived)
    if (isNaN(received)) return 0
    return Math.max(0, received - amount)
  }

  const handleSubmit = () => {
    if (method === 'cash') {
      const received = parseFloat(cashReceived)
      if (isNaN(received) || received < amount) return

      onPayment({
        method: 'cash',
        amount: amount,
        reference: `CASH-${Date.now()}`,
      })
    } else {
      onPayment({
        method: 'card',
        amount: amount,
        reference: cardReference || `CARD-${Date.now()}`,
        card_last_four: cardLastFour,
      })
    }
  }

  const isValidPayment = () => {
    if (method === 'cash') {
      const received = parseFloat(cashReceived)
      return !isNaN(received) && received >= amount
    }
    return true // Card payment always valid in mock
  }

  const quickCashAmounts = [50, 100, 200, 500, 1000]

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={cn(
            "p-6 cursor-pointer transition-all border-2",
            method === 'cash' 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 hover:border-gray-300"
          )}
          onClick={() => setMethod('cash')}
        >
          <div className="flex flex-col items-center gap-3">
            <Banknote className="h-8 w-8 text-green-600" />
            <span className="font-medium">Cash Payment</span>
          </div>
        </Card>

        <Card
          className={cn(
            "p-6 cursor-pointer transition-all border-2",
            method === 'card' 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 hover:border-gray-300"
          )}
          onClick={() => setMethod('card')}
        >
          <div className="flex flex-col items-center gap-3">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <span className="font-medium">Card Payment</span>
          </div>
        </Card>
      </div>

      {/* Payment Details */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium">Amount Due</span>
            <span className="font-bold text-primary">AED {amount.toFixed(2)}</span>
          </div>

          {method === 'cash' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="cash-received">Cash Received</Label>
                <Input
                  id="cash-received"
                  type="number"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="text-lg"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {quickCashAmounts.map(value => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived(value.toString())}
                  >
                    {value}
                  </Button>
                ))}
              </div>

              {cashReceived && parseFloat(cashReceived) >= amount && (
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-700">Change</span>
                  <span className="font-bold text-green-700 text-lg">
                    AED {calculateChange().toFixed(2)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="card-ref">Reference Number (optional)</Label>
                <Input
                  id="card-ref"
                  placeholder="Transaction reference"
                  value={cardReference}
                  onChange={(e) => setCardReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-last">Last 4 Digits (optional)</Label>
                <Input
                  id="card-last"
                  placeholder="1234"
                  value={cardLastFour}
                  onChange={(e) => setCardLastFour(e.target.value.slice(0, 4))}
                  maxLength={4}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Card payment will be processed. In production, this would integrate with your payment processor.
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={!isValidPayment() || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>Process Payment - AED {amount.toFixed(2)}</>
        )}
      </Button>
    </div>
  )
}