'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useToast } from '@/components/ui/use-toast'
import { useSalonSettings } from '@/contexts/salon-settings-context'
import { 
  ChevronLeft,
  CreditCard,
  DollarSign,
  RefreshCw,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Banknote,
  Smartphone,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Loader2,
  FileText,
  Ban,
  RotateCcw,
  PlusCircle,
  MinusCircle,
  Calculator,
  Users,
  Coins
} from 'lucide-react'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface PaymentTransaction {
  id: string
  transaction_code: string
  transaction_date: string
  transaction_type: string
  total_amount: number
  metadata: {
    customer_name?: string
    service_name?: string
    payment_method?: string
    payment_status?: string
    refund_reason?: string
    refund_amount?: number
    cancellation_reason?: string
    tips_amount?: number
    split_payment?: boolean
    split_details?: Array<{
      method: string
      amount: number
    }>
    staff_name?: string
    notes?: string
  }
  status?: string
  created_at: string
}

interface PaymentAnalytics {
  totalRevenue: number
  totalRefunds: number
  totalCancellations: number
  totalTips: number
  netRevenue: number
  transactionCount: number
  refundCount: number
  cancellationCount: number
  averageTransaction: number
  refundRate: number
  cancellationRate: number
  growthRate: number
}

interface PaymentMethodSummary {
  method: string
  count: number
  amount: number
  percentage: number
}

interface DailyReconciliation {
  date: string
  cashReceived: number
  cardReceived: number
  digitalReceived: number
  totalReceived: number
  refundsIssued: number
  tipsCollected: number
  netCash: number
  transactionCount: number
}

export default function PaymentsPage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()
  const { settings } = useSalonSettings()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('transactions')
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([])
  const [dailyReconciliation, setDailyReconciliation] = useState<DailyReconciliation | null>(null)
  
  // Filters
  const [dateRange, setDateRange] = useState('today')
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('all')

  // Dialogs
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchPaymentData()
    }
  }, [organizationId, contextLoading, dateRange, filterType, selectedMethod])

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1))
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'last_7_days':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'last_30_days':
        startDate = new Date(now.setDate(now.getDate() - 30))
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0))
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  }

  const fetchPaymentData = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
      let url = `/api/v1/salon/payments?organization_id=${organizationId}&start_date=${start}&end_date=${end}`
      
      if (filterType !== 'all') {
        url += `&type=${filterType}`
      }
      if (selectedMethod !== 'all') {
        url += `&payment_method=${selectedMethod}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setTransactions(data.transactions || [])
        setAnalytics(data.analytics || null)
        setPaymentMethods(data.paymentMethods || [])
        setDailyReconciliation(data.dailyReconciliation || null)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedTransaction || !refundAmount || !refundReason) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/v1/salon/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          transactionType: 'refund',
          originalTransactionId: selectedTransaction.id,
          amount: parseFloat(refundAmount),
          paymentMethod: selectedTransaction.metadata.payment_method,
          reason: refundReason,
          notes,
          customerName: selectedTransaction.metadata.customer_name,
          serviceName: selectedTransaction.metadata.service_name,
          staffName: selectedTransaction.metadata.staff_name
        })
      })

      if (!response.ok) throw new Error('Failed to process refund')

      toast({
        title: 'Success',
        description: 'Refund processed successfully'
      })

      setShowRefundDialog(false)
      setSelectedTransaction(null)
      setRefundAmount('')
      setRefundReason('')
      setNotes('')
      fetchPaymentData()
    } catch (error) {
      console.error('Error processing refund:', error)
      toast({
        title: 'Error',
        description: 'Failed to process refund',
        variant: 'destructive'
      })
    }
  }

  const handleCancel = async () => {
    if (!selectedTransaction || !cancelReason) {
      toast({
        title: 'Error',
        description: 'Please provide a cancellation reason',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/v1/salon/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          action: 'cancel',
          reason: cancelReason,
          notes
        })
      })

      if (!response.ok) throw new Error('Failed to cancel transaction')

      toast({
        title: 'Success',
        description: 'Transaction cancelled successfully'
      })

      setShowCancelDialog(false)
      setSelectedTransaction(null)
      setCancelReason('')
      setNotes('')
      fetchPaymentData()
    } catch (error) {
      console.error('Error cancelling transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel transaction',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return `${settings?.payment_settings.currency || 'AED'} ${amount.toFixed(2)}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-4 h-4" />
      case 'digital_wallet':
        return <Smartphone className="w-4 h-4" />
      default:
        return <Wallet className="w-4 h-4" />
    }
  }

  const getStatusBadge = (transaction: PaymentTransaction) => {
    const status = transaction.metadata.payment_status || transaction.status || 'completed'
    
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-700">Refunded</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        txn.transaction_code.toLowerCase().includes(search) ||
        txn.metadata.customer_name?.toLowerCase().includes(search) ||
        txn.metadata.service_name?.toLowerCase().includes(search) ||
        txn.metadata.staff_name?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Payment Management
                </h1>
                <p className="text-gray-600 text-lg">
                  Track transactions, process refunds, and manage payments
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics.totalRevenue)}
                      </p>
                      <p className={`text-sm ${analytics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analytics.growthRate >= 0 ? <ArrowUpRight className="inline w-4 h-4" /> : <ArrowDownRight className="inline w-4 h-4" />}
                        {Math.abs(analytics.growthRate).toFixed(1)}%
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Refunds</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics.totalRefunds)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {analytics.refundCount} transactions
                      </p>
                    </div>
                    <RefreshCw className="w-8 h-8 text-blue-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cancellations</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics.totalCancellations)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {analytics.cancellationRate.toFixed(1)}% rate
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tips Collected</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics.totalTips)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {((analytics.totalTips / analytics.totalRevenue) * 100).toFixed(1)}% of revenue
                      </p>
                    </div>
                    <Coins className="w-8 h-8 text-purple-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analytics.netRevenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Avg: {formatCurrency(analytics.averageTransaction)}
                      </p>
                    </div>
                    <Calculator className="w-8 h-8 text-emerald-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="refunds">Refunds</TabsTrigger>
              <TabsTrigger value="cancellations">Cancellations</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
              <TabsTrigger value="reconciliation">Cash Reconciliation</TabsTrigger>
            </TabsList>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Transaction History</CardTitle>
                      <CardDescription>All payment transactions for the selected period</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search transactions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="payments">Payments Only</SelectItem>
                          <SelectItem value="refunds">Refunds Only</SelectItem>
                          <SelectItem value="cancellations">Cancellations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <p className="font-medium">{transaction.transaction_code}</p>
                                {getStatusBadge(transaction)}
                                {transaction.metadata.split_payment && (
                                  <Badge variant="outline">Split Payment</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <p className="font-medium text-gray-700">Customer</p>
                                  <p>{transaction.metadata.customer_name || 'Walk-in'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Service</p>
                                  <p>{transaction.metadata.service_name || 'General'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Staff</p>
                                  <p>{transaction.metadata.staff_name || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700">Date</p>
                                  <p>{formatDate(transaction.transaction_date)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  {getPaymentMethodIcon(transaction.metadata.payment_method || 'cash')}
                                  <span className="text-sm capitalize">
                                    {transaction.metadata.payment_method?.replace('_', ' ') || 'Cash'}
                                  </span>
                                </div>
                                {transaction.metadata.tips_amount > 0 && (
                                  <span className="text-sm text-gray-600">
                                    Tips: {formatCurrency(transaction.metadata.tips_amount)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold">
                                {transaction.transaction_type === 'refund' ? '-' : ''}
                                {formatCurrency(transaction.total_amount)}
                              </p>
                              {transaction.metadata.payment_status !== 'refunded' && 
                               transaction.metadata.payment_status !== 'cancelled' &&
                               transaction.transaction_type !== 'refund' && (
                                <div className="mt-2 space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTransaction(transaction)
                                      setRefundAmount(transaction.total_amount.toString())
                                      setShowRefundDialog(true)
                                    }}
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Refund
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTransaction(transaction)
                                      setShowCancelDialog(true)
                                    }}
                                  >
                                    <Ban className="w-3 h-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No transactions found for the selected criteria</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Refunds Tab */}
            <TabsContent value="refunds" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Refund History</CardTitle>
                  <CardDescription>All refunds processed for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.filter(t => t.transaction_type === 'refund').length > 0 ? (
                    <div className="space-y-2">
                      {transactions
                        .filter(t => t.transaction_type === 'refund')
                        .map((refund) => (
                          <div key={refund.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="font-medium">{refund.transaction_code}</p>
                                  <Badge className="bg-blue-100 text-blue-700">Refund</Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Customer</p>
                                    <p className="font-medium">{refund.metadata.customer_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Reason</p>
                                    <p className="font-medium">{refund.metadata.refund_reason || 'No reason provided'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Date</p>
                                    <p className="font-medium">{formatDate(refund.transaction_date)}</p>
                                  </div>
                                </div>
                                {refund.metadata.notes && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    Notes: {refund.metadata.notes}
                                  </p>
                                )}
                              </div>
                              <p className="text-lg font-bold text-blue-600">
                                -{formatCurrency(refund.total_amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No refunds processed in the selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cancellations Tab */}
            <TabsContent value="cancellations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cancelled Transactions</CardTitle>
                  <CardDescription>All cancelled transactions for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.filter(t => t.metadata.payment_status === 'cancelled').length > 0 ? (
                    <div className="space-y-2">
                      {transactions
                        .filter(t => t.metadata.payment_status === 'cancelled')
                        .map((cancelled) => (
                          <div key={cancelled.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="font-medium">{cancelled.transaction_code}</p>
                                  <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Customer</p>
                                    <p className="font-medium">{cancelled.metadata.customer_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Reason</p>
                                    <p className="font-medium">{cancelled.metadata.cancellation_reason || 'No reason provided'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Cancelled Date</p>
                                    <p className="font-medium">
                                      {cancelled.metadata.cancellation_date 
                                        ? formatDate(cancelled.metadata.cancellation_date)
                                        : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-lg font-bold text-gray-500 line-through">
                                {formatCurrency(cancelled.total_amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No cancelled transactions in the selected period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Methods Tab */}
            <TabsContent value="methods" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Summary</CardTitle>
                  <CardDescription>Breakdown of payments by method</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length > 0 ? (
                    <div className="space-y-6">
                      {paymentMethods.map((method) => (
                        <div key={method.method} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getPaymentMethodIcon(method.method)}
                              <div>
                                <p className="font-medium capitalize">
                                  {method.method.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {method.count} transactions
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(method.amount)}</p>
                              <p className="text-sm text-gray-600">{method.percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                          <Progress value={method.percentage} className="h-2" />
                        </div>
                      ))}

                      <div className="mt-6 pt-6 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-600 mb-1">Most Used Method</p>
                              <p className="font-bold capitalize">
                                {paymentMethods[0]?.method.replace('_', ' ') || 'N/A'}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-gray-600 mb-1">Digital Payments</p>
                              <p className="font-bold">
                                {paymentMethods
                                  .filter(m => ['credit_card', 'debit_card', 'digital_wallet'].includes(m.method))
                                  .reduce((sum, m) => sum + m.percentage, 0)
                                  .toFixed(1)}%
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No payment data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cash Reconciliation Tab */}
            <TabsContent value="reconciliation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Cash Reconciliation</CardTitle>
                  <CardDescription>Cash drawer summary for {dailyReconciliation?.date || 'today'}</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyReconciliation ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Cash Received</p>
                                <p className="text-xl font-bold">{formatCurrency(dailyReconciliation.cashReceived)}</p>
                              </div>
                              <Banknote className="w-6 h-6 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Card Payments</p>
                                <p className="text-xl font-bold">{formatCurrency(dailyReconciliation.cardReceived)}</p>
                              </div>
                              <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Digital Wallet</p>
                                <p className="text-xl font-bold">{formatCurrency(dailyReconciliation.digitalReceived)}</p>
                              </div>
                              <Smartphone className="w-6 h-6 text-purple-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="border rounded-lg p-6 bg-gray-50">
                        <h4 className="font-medium mb-4">Reconciliation Summary</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Received</span>
                            <span className="font-medium">{formatCurrency(dailyReconciliation.totalReceived)}</span>
                          </div>
                          <div className="flex justify-between items-center text-red-600">
                            <span>Refunds Issued</span>
                            <span className="font-medium">-{formatCurrency(dailyReconciliation.refundsIssued)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Tips Collected</span>
                            <span className="font-medium">{formatCurrency(dailyReconciliation.tipsCollected)}</span>
                          </div>
                          <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-medium">Net Cash to Deposit</span>
                            <span className="text-xl font-bold text-green-600">
                              {formatCurrency(dailyReconciliation.netCash)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Total of {dailyReconciliation.transactionCount} transactions processed today.
                          Please count physical cash and ensure it matches the net cash amount.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No transactions for reconciliation today</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Refund Dialog */}
          <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Refund</DialogTitle>
                <DialogDescription>
                  Refund for transaction {selectedTransaction?.transaction_code}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Original Amount</Label>
                  <p className="text-lg font-medium">
                    {formatCurrency(selectedTransaction?.total_amount || 0)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="refundAmount">Refund Amount</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="refundReason">Reason for Refund</Label>
                  <Select value={refundReason} onValueChange={setRefundReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_issue">Service Issue</SelectItem>
                      <SelectItem value="customer_request">Customer Request</SelectItem>
                      <SelectItem value="pricing_error">Pricing Error</SelectItem>
                      <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional information..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRefund}>
                  Process Refund
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Dialog */}
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Transaction</DialogTitle>
                <DialogDescription>
                  Cancel transaction {selectedTransaction?.transaction_code}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Transaction Amount</p>
                  <p className="text-lg font-medium">
                    {formatCurrency(selectedTransaction?.total_amount || 0)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="cancelReason">Reason for Cancellation</Label>
                  <Select value={cancelReason} onValueChange={setCancelReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_no_show">Customer No-Show</SelectItem>
                      <SelectItem value="staff_unavailable">Staff Unavailable</SelectItem>
                      <SelectItem value="system_error">System Error</SelectItem>
                      <SelectItem value="duplicate_booking">Duplicate Booking</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cancelNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="cancelNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional information..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                  Keep Transaction
                </Button>
                <Button onClick={handleCancel} variant="destructive">
                  Cancel Transaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}