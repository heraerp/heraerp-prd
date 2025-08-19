// TODO: Update this page to use production data from useTransaction
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUITransaction)
// 2. Update create handlers to use: await createTransaction(formData)
// 3. Update delete handlers to use: await deleteTransaction(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

'use client'

import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { useTransaction } from '@/hooks/useTransaction'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { 
  CreditCard, 
  Search, 
  Plus, 
  DollarSign,
  Calendar,
  Save,
  TestTube,
  ArrowLeft,
  TrendingUp,
  Receipt,
  Banknote,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialPayments = [
  {
    id: 1,
    transactionId: 'PAY-001',
    clientName: 'Sarah Johnson',
    serviceName: 'Haircut & Style',
    amount: 85.00,
    tip: 15.00,
    total: 100.00,
    paymentMethod: 'credit_card',
    cardType: 'Visa',
    lastFour: '4242',
    status: 'completed',
    date: '2025-01-09',
    time: '14:30',
    stylist: 'Emma Thompson',
    notes: 'Regular customer payment'
  },
  {
    id: 2,
    transactionId: 'PAY-002',
    clientName: 'Mike Chen',
    serviceName: 'Beard Trim',
    amount: 35.00,
    tip: 7.00,
    total: 42.00,
    paymentMethod: 'cash',
    cardType: null,
    lastFour: null,
    status: 'completed',
    date: '2025-01-09',
    time: '11:45',
    stylist: 'David Rodriguez',
    notes: 'Cash payment with tip'
  },
  {
    id: 3,
    transactionId: 'PAY-003',
    clientName: 'Lisa Wang',
    serviceName: 'Hair Color',
    amount: 150.00,
    tip: 30.00,
    total: 180.00,
    paymentMethod: 'digital_wallet',
    cardType: 'Apple Pay',
    lastFour: null,
    status: 'completed',
    date: '2025-01-08',
    time: '16:15',
    stylist: 'Emma Thompson',
    notes: 'Digital wallet payment'
  },
  {
    id: 4,
    transactionId: 'PAY-004',
    clientName: 'James Wilson',
    serviceName: 'Full Service',
    amount: 120.00,
    tip: 24.00,
    total: 144.00,
    paymentMethod: 'credit_card',
    cardType: 'MasterCard',
    lastFour: '8888',
    status: 'pending',
    date: '2025-01-09',
    time: '18:00',
    stylist: 'Alex Chen',
    notes: 'Payment processing'
  }
]

interface Payment {
  id: number
  transactionId: string
  clientName: string
  serviceName: string
  amount: number
  tip: number
  total: number
  paymentMethod: 'credit_card' | 'cash' | 'digital_wallet' | 'debit_card'
  cardType: string | null
  lastFour: string | null
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  date: string
  time: string
  stylist: string
  notes: string
}

export default function PaymentsProgressive() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    createTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useTransaction(organizationId)

  const [testMode, setTestMode] = useState(true)
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  // Filter payments based on search and filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesPaymentMethod = paymentMethodFilter === 'all' || payment.paymentMethod === paymentMethodFilter
    const matchesDate = dateFilter === 'all' || payment.date === dateFilter
    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Payment data saved:', payments)
  }

  const handleStatusChange = (id: number, status: Payment['status']) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    setHasChanges(true)
  }

  const handleRefund = (id: number) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'refunded' } : p))
    setHasChanges(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'digital_wallet':
        return <Smartphone className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayPayments = payments.filter(p => p.date === today && p.status === 'completed')
    const completedPayments = payments.filter(p => p.status === 'completed')
    
    return {
      todayRevenue: todayPayments.reduce((sum, p) => sum + p.total, 0),
      todayCount: todayPayments.length,
      totalRevenue: completedPayments.reduce((sum, p) => sum + p.total, 0),
      totalTips: completedPayments.reduce((sum, p) => sum + p.tip, 0),
      avgTransaction: completedPayments.length > 0 
        ? completedPayments.reduce((sum, p) => sum + p.total, 0) / completedPayments.length 
        : 0,
      pendingCount: payments.filter(p => p.status === 'pending').length
    }
  }

  const paymentStats = getPaymentStats()


  if (!isAuthenticated) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert>


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Please log in to access payments management.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  if (contextLoading) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">


        <div className="text-center">


          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />


          <p className="text-gray-600">Loading your profile...</p>


        </div>


      </div>


    )


  }



  if (!organizationId) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert variant="destructive">


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Organization not found. Please contact support.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonProductionSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon-progressive">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Payment Management
                  </h1>
                  <p className="text-sm text-gray-600">Track transactions, tips, and revenue</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {testMode && hasChanges && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}

                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}

                <Badge variant="secondary" className="flex items-center gap-1">
                  <TestTube className="h-3 w-3" />
                  Test Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Payment Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">${stats.todayRevenue}</p>
                  <p className="text-xs text-gray-600">Today's Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Receipt className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{stats.todayCount}</p>
                  <p className="text-xs text-gray-600">Today's Transactions</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">${stats.totalRevenue}</p>
                  <p className="text-xs text-gray-600">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-yellow-600">${stats.totalTips}</p>
                  <p className="text-xs text-gray-600">Total Tips</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-600">${stats.avgTransaction.toFixed(0)}</p>
                  <p className="text-xs text-gray-600">Avg Transaction</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold text-red-600">{stats.pendingCount}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by client, transaction ID, or service..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">All Status</SelectItem>
                <SelectItem value="completed" className="hera-select-item">Completed</SelectItem>
                <SelectItem value="pending" className="hera-select-item">Pending</SelectItem>
                <SelectItem value="failed" className="hera-select-item">Failed</SelectItem>
                <SelectItem value="refunded" className="hera-select-item">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">All Methods</SelectItem>
                <SelectItem value="credit_card" className="hera-select-item">Credit Card</SelectItem>
                <SelectItem value="cash" className="hera-select-item">Cash</SelectItem>
                <SelectItem value="digital_wallet" className="hera-select-item">Digital Wallet</SelectItem>
                <SelectItem value="debit_card" className="hera-select-item">Debit Card</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment List */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-pink-500" />
                    Payments ({filteredPayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredPayments.map((payment) => (
                      <div 
                        key={payment.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPayment?.id === payment.id 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </div>
                            <div>
                              <p className="font-medium">{payment.clientName}</p>
                              <p className="text-sm text-gray-600">{payment.serviceName}</p>
                              <p className="text-xs text-gray-500">
                                {payment.transactionId} • {payment.date} {payment.time}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status.toUpperCase()}
                            </Badge>
                            <div className="text-right">
                              <p className="font-bold text-green-600">${payment.total.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                Tip: ${payment.tip.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Details */}
            <div>
              {selectedPayment ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-pink-500" />
                        Payment Details
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedPayment.status}
                          onValueChange={(status) => handleStatusChange(selectedPayment.id, status as Payment['status'])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="hera-select-content">
                            <SelectItem value="completed" className="hera-select-item">Completed</SelectItem>
                            <SelectItem value="pending" className="hera-select-item">Pending</SelectItem>
                            <SelectItem value="failed" className="hera-select-item">Failed</SelectItem>
                            <SelectItem value="refunded" className="hera-select-item">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center pb-4 border-b">
                      <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                      </div>
                      <h3 className="font-semibold text-lg">{selectedPayment.transactionId}</h3>
                      <Badge className={getStatusColor(selectedPayment.status)} className="mt-2">
                        {selectedPayment.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Client</Label>
                        <p className="text-sm">{selectedPayment.clientName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Service</Label>
                        <p className="text-sm">{selectedPayment.serviceName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Stylist</Label>
                        <p className="text-sm">{selectedPayment.stylist}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date & Time</Label>
                        <p className="text-sm">{selectedPayment.date} at {selectedPayment.time}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <div className="flex items-center gap-2 text-sm">
                          {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                          <span className="capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</span>
                          {selectedPayment.cardType && (
                            <span className="text-gray-500">
                              • {selectedPayment.cardType} ****{selectedPayment.lastFour}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Service Amount:</span>
                        <span>${selectedPayment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tip:</span>
                        <span>${selectedPayment.tip.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">${selectedPayment.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedPayment.notes && (
                      <div>
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm text-gray-600 mt-1">{selectedPayment.notes}</p>
                      </div>
                    )}

                    {selectedPayment.status === 'completed' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRefund(selectedPayment.id)}
                        >
                          Process Refund
                        </Button>
                        <Button variant="outline">
                          <Receipt className="h-4 w-4 mr-2" />
                          Print Receipt
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Select a payment to view details</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>• Process refunds</p>
                      <p>• Print receipts</p>
                      <p>• Update payment status</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Progressive Features Notice */}
          {testMode && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Test Mode Active</p>
                    <p className="text-sm text-blue-700">
                      View and manage payment transactions freely. Process refunds, update statuses, and track revenue. 
                      All changes are saved locally in test mode. Click "Save Progress" to persist your payment data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}