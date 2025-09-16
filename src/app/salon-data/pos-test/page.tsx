'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * POS Test Page - Quick Payment Test
 * Smart Code: HERA.RETAIL.POS.TEST.v1
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { CreditCard, DollarSign, CheckCircle, Banknote } from 'lucide-react'

export default function POSTestPage() {
  const [amount, setAmount] = useState('100')
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash')
  const [paymentComplete, setPaymentComplete] = useState(false)

  const processPayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setPaymentComplete(true)
    }, 1000)
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-lg">Amount Paid: AED {amount}</p>
              <p className="text-muted-foreground">
                Payment Type: {paymentType === 'cash' ? 'Cash' : 'Card'}
              </p>
              <Button
                onClick={() => {
                  setPaymentComplete(false)
                  setAmount('100')
                }}
                className="w-full"
              >
                Process Another Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-100 dark:text-foreground">
          POS Payment Test
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Enter Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">AED</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-12 text-2xl"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['50', '100', '200'].map(preset => (
                    <Button
                      key={preset}
                      variant="outline"
                      onClick={() => setAmount(preset)}
                      className="hover:bg-purple-50"
                    >
                      AED {preset}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Type */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={paymentType === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentType('cash')}
                  className={paymentType === 'cash' ? 'bg-green-600 hover:bg-green-700' : ''}
                  size="lg"
                >
                  <Banknote className="w-5 h-5 mr-2" />
                  Cash
                </Button>
                <Button
                  variant={paymentType === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentType('card')}
                  className={paymentType === 'card' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Payment */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Total Amount</p>
                <p className="text-4xl font-bold text-gray-100 dark:text-foreground">
                  AED {amount || '0'}
                </p>
              </div>
              <Button
                onClick={processPayment}
                className="w-full bg-purple-600 hover:bg-purple-700 text-foreground"
                size="lg"
                disabled={!amount || amount === '0'}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Process Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
