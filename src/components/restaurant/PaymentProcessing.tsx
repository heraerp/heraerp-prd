'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Badge } from '@/src/components/ui/badge'
import { universalApi } from '@/src/lib/universal-api'
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Banknote,
  Receipt,
  TrendingUp,
  Clock,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Calculator,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/src/lib/date-utils'

interface PaymentProcessingProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

interface PaymentMethod {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    type: 'cash' | 'card' | 'digital'
    fees?: number
    enabled?: boolean
  }
}

interface Transaction {
  id: string
  transaction_type: string
  total_amount: number
  transaction_date: string
  transaction_code: string
  metadata?: {
    payment_method?: string
    tip_amount?: number
    status?: string
    table_number?: string
  }
}

export function PaymentProcessing({
  organizationId,
  smartCodes,
  isDemoMode = false
}: PaymentProcessingProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('process')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [recentPayments, setRecentPayments] = useState<Transaction[]>([])
  const [todayStats, setTodayStats] = useState({
    total: 0,
    cash: 0,
    card: 0,
    digital: 0,
    tips: 0,
    refunds: 0
  })

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
      loadData()
    }
  }, [organizationId, isDemoMode])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load all entities
      const entitiesResponse = await universalApi.getEntities()
      const entities = Array.isArray(entitiesResponse)
        ? entitiesResponse
        : entitiesResponse.data || []

      // Filter for payment methods
      const methods = entities.filter(e => e.entity_type === 'payment_method')

      // If no payment methods exist, create defaults
      if (methods.length === 0) {
        await createDefaultPaymentMethods()
        const newEntitiesResponse = await universalApi.getEntities()
        const newEntities = Array.isArray(newEntitiesResponse)
          ? newEntitiesResponse
          : newEntitiesResponse.data || []
        const newMethods = newEntities.filter(e => e.entity_type === 'payment_method')
        setPaymentMethods(newMethods)
      } else {
        setPaymentMethods(methods)
      }

      // Load all transactions
      const today = new Date().toISOString().split('T')[0]
      const transactionsResponse = await universalApi.getTransactions()
      const transactions = Array.isArray(transactionsResponse)
        ? transactionsResponse
        : transactionsResponse.data || []

      // Filter for today's payments
      const payments = transactions.filter(
        t =>
          t.transaction_type === 'payment' &&
          t.transaction_date &&
          t.transaction_date.startsWith(today)
      )

      setRecentPayments(payments.slice(0, 10)) // Last 10 payments

      // Calculate today's stats
      calculateTodayStats(payments)
    } catch (err) {
      console.error('Error loading payment data:', err)
      setError('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultPaymentMethods = async () => {
    const defaultMethods = [
      {
        entity_name: 'Cash',
        entity_code: 'PAY-CASH',
        entity_type: 'payment_method',
        smart_code: smartCodes.PAYMENT_METHOD,
        metadata: { type: 'cash', fees: 0, enabled: true }
      },
      {
        entity_name: 'Credit Card',
        entity_code: 'PAY-CARD',
        entity_type: 'payment_method',
        smart_code: smartCodes.PAYMENT_METHOD,
        metadata: { type: 'card', fees: 2.5, enabled: true }
      },
      {
        entity_name: 'Digital Wallet',
        entity_code: 'PAY-DIGITAL',
        entity_type: 'payment_method',
        smart_code: smartCodes.PAYMENT_METHOD,
        metadata: { type: 'digital', fees: 1.5, enabled: true }
      }
    ]

    for (const method of defaultMethods) {
      await universalApi.createEntity(method)
    }
  }

  const calculateTodayStats = (payments: Transaction[]) => {
    let stats = {
      total: 0,
      cash: 0,
      card: 0,
      digital: 0,
      tips: 0,
      refunds: 0
    }

    payments.forEach(payment => {
      const amount = payment.total_amount || 0
      const method = (payment.metadata as any)?.payment_method || 'cash'
      const tip = (payment.metadata as any)?.tip_amount || 0

      if (payment.transaction_type === 'refund') {
        stats.refunds += amount
      } else {
        stats.total += amount
        stats.tips += tip

        if (method === 'cash') stats.cash += amount
        else if (method === 'card') stats.card += amount
        else if (method === 'digital') stats.digital += amount
      }
    })

    setTodayStats(stats)
  }

  const processPayment = async () => {
    if (!paymentAmount || !selectedMethod) {
      setError('Please enter amount and select payment method')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const amount = parseFloat(paymentAmount)
      const tip = parseFloat(tipAmount) || 0
      const total = amount + tip

      // Create payment transaction
      const paymentResponse = await universalApi.createTransaction({
        transaction_type: 'payment',
        transaction_code: `PAY-${Date.now()}`,
        smart_code: smartCodes.PAYMENT_RECEIVED,
        total_amount: total,
        metadata: {
          payment_method: selectedMethod,
          tip_amount: tip,
          status: 'completed',
          processed_at: new Date().toISOString()
        }
      })

      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error('Failed to create payment transaction')
      }

      const payment = paymentResponse.data

      // Create transaction lines
      if (amount > 0) {
        await universalApi.createTransactionLine({
          transaction_id: payment.id,
          line_number: 1,
          line_amount: amount,
          smart_code: smartCodes.LINE_PAYMENT,
          metadata: {
            description: 'Payment received'
          }
        })
      }

      if (tip > 0) {
        await universalApi.createTransactionLine({
          transaction_id: payment.id,
          line_number: 2,
          line_amount: tip,
          smart_code: smartCodes.LINE_TIP,
          metadata: {
            description: 'Tip added'
          }
        })
      }

      // Reset form
      setPaymentAmount('')
      setTipAmount('')
      setSelectedMethod('')

      // Reload data
      await loadData()
    } catch (err) {
      console.error('Error processing payment:', err)
      setError('Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  const processRefund = async (transactionId: string, amount: number) => {
    try {
      await universalApi.createTransaction({
        transaction_type: 'refund',
        transaction_code: `REF-${Date.now()}`,
        smart_code: smartCodes.REFUND,
        total_amount: amount,
        metadata: {
          original_transaction: transactionId,
          status: 'completed',
          processed_at: new Date().toISOString()
        }
      })

      await loadData()
    } catch (err) {
      console.error('Error processing refund:', err)
      setError('Failed to process refund')
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'digital':
        return <Smartphone className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            Payment Processing
          </h1>
          <p className="text-muted-foreground">Process payments, refunds, and view settlements</p>
        </div>
        <Button onClick={() => loadData()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${todayStats.total.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${todayStats.cash.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${todayStats.card.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Digital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${todayStats.digital.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${todayStats.tips.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refunds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">${todayStats.refunds.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="process">Process Payment</TabsTrigger>
          <TabsTrigger value="recent">Recent Payments</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <Card>
            <CardHeader>
              <CardTitle>Process New Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tip">Tip Amount (Optional)</Label>
                  <Input
                    id="tip"
                    type="number"
                    placeholder="0.00"
                    value={tipAmount}
                    onChange={e => setTipAmount(e.target.value)}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-3">
                  {paymentMethods.map(method => (
                    <Button
                      key={method.id}
                      variant={selectedMethod === method.entity_code ? 'default' : 'outline'}
                      onClick={() => setSelectedMethod(method.entity_code)}
                      className="flex items-center gap-2"
                    >
                      {getMethodIcon((method.metadata as any)?.type || 'cash')}
                      {method.entity_name}
                    </Button>
                  ))}
                </div>
              </div>

              {(paymentAmount || tipAmount) && (
                <div className="bg-muted dark:bg-muted p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${parseFloat(paymentAmount || '0').toFixed(2)}</span>
                    </div>
                    {tipAmount && (
                      <div className="flex justify-between">
                        <span>Tip:</span>
                        <span>${parseFloat(tipAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>
                        $
                        {(parseFloat(paymentAmount || '0') + parseFloat(tipAmount || '0')).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={processPayment}
                disabled={processing || !paymentAmount || !selectedMethod}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Process Payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payments processed today
                </p>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map(payment => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted dark:hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        {getMethodIcon((payment.metadata as any)?.payment_method || 'cash')}
                        <div>
                          <p className="font-medium">{payment.transaction_code}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(new Date(payment.transaction_date), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${payment.total_amount.toFixed(2)}</p>
                        {(payment.metadata as any)?.tip_amount &&
                          payment.metadata.tip_amount > 0 && (
                            <p className="text-sm text-green-600">
                              +${payment.metadata.tip_amount.toFixed(2)} tip
                            </p>
                          )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => processRefund(payment.id, payment.total_amount)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getMethodIcon((method.metadata as any)?.type || 'cash')}
                      <div>
                        <p className="font-medium">{method.entity_name}</p>
                        <p className="text-sm text-muted-foreground">Code: {method.entity_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {(method.metadata as any)?.fees !== undefined && method.metadata.fees > 0 && (
                        <Badge variant="outline">{method.metadata.fees}% fee</Badge>
                      )}
                      <Badge variant={(method.metadata as any)?.enabled ? 'default' : 'secondary'}>
                        {(method.metadata as any)?.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
