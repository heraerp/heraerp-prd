'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ShoppingCart,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Package,
  CreditCard,
  Users,
  Search,
  Download,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface O2CMetrics {
  orders: {
    total: number
    pending: number
    approved: number
    shipped: number
    delivered: number
    total_value: number
  }
  invoices: {
    total: number
    pending: number
    paid: number
    overdue: number
    total_value: number
    paid_value: number
  }
  payments: {
    total: number
    today: number
    total_value: number
    average_days_to_pay: number
  }
  customers: {
    total: number
    with_outstanding: number
    credit_blocked: number
    average_credit_score: number
  }
  analytics: {
    dso: number // Days Sales Outstanding
    collection_rate: number
    revenue_mtd: number
    revenue_ytd: number
  }
}

export function O2CDashboard() {
  const { currentOrganization, isAuthenticated, contextLoading } = useHERAAuth()
  const [metrics, setMetrics] = useState<O2CMetrics | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [revenueChart, setRevenueChart] = useState<any[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Three-layer authorization check
  if (!isAuthenticated) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please log in to access the O2C dashboard.</AlertDescription>
      </Alert>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading organization context...</p>
        </div>
      </div>
    )
  }

  const organizationId = currentOrganization?.id
  if (!organizationId) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No organization context found. Please select an organization.
        </AlertDescription>
      </Alert>
    )
  }

  useEffect(() => {
    if (organizationId) {
      fetchO2CData()
      // Refresh every 30 seconds
      const interval = setInterval(fetchO2CData, 30000)
      return () => clearInterval(interval)
    }
  }, [organizationId])

  const fetchO2CData = async () => {
    setRefreshing(true)
    try {
      // Fetch metrics
      const metricsResponse = await fetch(`/api/v1/o2c?type=metrics&days=30`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (metricsResponse.ok) {
        const data = await metricsResponse.json()
        setMetrics(calculateMetrics(data.data))
        setRecentTransactions(data.data.slice(0, 10))
        setRevenueChart(generateRevenueChart(data.data))
        setOverdueInvoices(filterOverdueInvoices(data.data))
      }
    } catch (error) {
      console.error('Failed to fetch O2C data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const calculateMetrics = (transactions: any[]): O2CMetrics => {
    const orders = transactions.filter(t => t.transaction_type === 'sales_order')
    const invoices = transactions.filter(t => t.transaction_type === 'customer_invoice')
    const payments = transactions.filter(t => t.transaction_type === 'customer_payment')

    const today = new Date().toDateString()
    const todayPayments = payments.filter(
      p => new Date(p.transaction_date).toDateString() === today
    )

    return {
      orders: {
        total: orders.length,
        pending: orders.filter(o => (o.metadata as any)?.status === 'pending').length,
        approved: orders.filter(o => (o.metadata as any)?.status === 'approved').length,
        shipped: orders.filter(o => (o.metadata as any)?.fulfillment_status === 'shipped').length,
        delivered: orders.filter(o => (o.metadata as any)?.fulfillment_status === 'delivered')
          .length,
        total_value: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      },
      invoices: {
        total: invoices.length,
        pending: invoices.filter(i => (i.metadata as any)?.status === 'pending').length,
        paid: invoices.filter(i => (i.metadata as any)?.status === 'paid').length,
        overdue: invoices.filter(
          i =>
            (i.metadata as any)?.status === 'pending' &&
            new Date((i.metadata as any)?.due_date) < new Date()
        ).length,
        total_value: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
        paid_value: invoices
          .filter(i => (i.metadata as any)?.status === 'paid')
          .reduce((sum, i) => sum + (i.total_amount || 0), 0)
      },
      payments: {
        total: payments.length,
        today: todayPayments.length,
        total_value: payments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
        average_days_to_pay: 25 // Would calculate from actual data
      },
      customers: {
        total: new Set(transactions.map(t => t.from_entity_id)).size,
        with_outstanding: invoices
          .filter(i => (i.metadata as any)?.status === 'pending')
          .map(i => i.from_entity_id)
          .filter((v, i, a) => a.indexOf(v) === i).length,
        credit_blocked: 0, // Would get from customer entities
        average_credit_score: 650 // Would calculate from actual data
      },
      analytics: {
        dso: 32, // Would calculate actual DSO
        collection_rate:
          invoices.length > 0
            ? (invoices.filter(i => (i.metadata as any)?.status === 'paid').length /
                invoices.length) *
              100
            : 0,
        revenue_mtd: invoices
          .filter(i => new Date(i.transaction_date).getMonth() === new Date().getMonth())
          .reduce((sum, i) => sum + (i.total_amount || 0), 0),
        revenue_ytd: invoices
          .filter(i => new Date(i.transaction_date).getFullYear() === new Date().getFullYear())
          .reduce((sum, i) => sum + (i.total_amount || 0), 0)
      }
    }
  }

  const generateRevenueChart = (transactions: any[]) => {
    const invoices = transactions.filter(t => t.transaction_type === 'customer_invoice')
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    return last30Days.map(date => {
      const dayInvoices = invoices.filter(i => i.transaction_date.split('T')[0] === date)
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
      }
    })
  }

  const filterOverdueInvoices = (transactions: any[]) => {
    return transactions
      .filter(
        t =>
          t.transaction_type === 'customer_invoice' &&
          (t.metadata as any)?.status === 'pending' &&
          new Date((t.metadata as any)?.due_date) < new Date()
      )
      .sort(
        (a, b) =>
          new Date((a.metadata as any)?.due_date).getTime() -
          new Date((b.metadata as any)?.due_date).getTime()
      )
      .slice(0, 5)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      paid: { variant: 'default', icon: CheckCircle },
      shipped: { variant: 'default', icon: Package },
      delivered: { variant: 'default', icon: CheckCircle },
      overdue: { variant: 'destructive', icon: XCircle },
      on_hold: { variant: 'destructive', icon: AlertCircle }
    }

    const config = statusConfig[status] || { variant: 'secondary', icon: Clock }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order-to-Cash Dashboard</h1>
          <p className="text-muted-foreground">Real-time revenue cycle management and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchO2CData()} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.orders.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics?.orders.total_value || 0)} total value
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge variant="secondary">{metrics?.orders.pending || 0} pending</Badge>
              <Badge variant="default">{metrics?.orders.approved || 0} approved</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.invoices.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics?.invoices.total_value - metrics?.invoices.paid_value || 0)}{' '}
              outstanding
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge variant="destructive">{metrics?.invoices.overdue || 0} overdue</Badge>
              <Badge variant="default">{metrics?.invoices.paid || 0} paid</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.payments.today || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics?.payments.total_value || 0)} total collected
            </p>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics?.payments.average_days_to_pay || 0} day avg collection
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue MTD</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.analytics.revenue_mtd || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.analytics.collection_rate.toFixed(1)}% collection rate
            </p>
            <div className="mt-2 text-xs flex items-center gap-2">
              <Activity className="h-3 w-3" />
              DSO: {metrics?.analytics.dso || 0} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend (30 Days)</CardTitle>
                <CardDescription>Daily revenue from invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={value => formatCurrency(Number(value))} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Current order pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pending', value: metrics?.orders.pending || 0, color: '#94a3b8' },
                        {
                          name: 'Approved',
                          value: metrics?.orders.approved || 0,
                          color: '#3b82f6'
                        },
                        { name: 'Shipped', value: metrics?.orders.shipped || 0, color: '#10b981' },
                        {
                          name: 'Delivered',
                          value: metrics?.orders.delivered || 0,
                          color: '#22c55e'
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map(index => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#94a3b8', '#3b82f6', '#10b981', '#22c55e'][index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Invoices Alert */}
          {overdueInvoices.length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Overdue Invoices Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueInvoices.map(invoice => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-background dark:bg-background"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{invoice.transaction_code}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer?.entity_name}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {Math.floor(
                            (Date.now() - new Date((invoice.metadata as any)?.due_date).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days overdue
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(invoice.total_amount)}</p>
                        <Button size="sm" variant="outline">
                          Send Reminder
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest order-to-cash activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted dark:bg-muted">
                        {transaction.transaction_type === 'sales_order' && (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        {transaction.transaction_type === 'customer_invoice' && (
                          <FileText className="h-4 w-4" />
                        )}
                        {transaction.transaction_type === 'customer_payment' && (
                          <DollarSign className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.transaction_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.customer?.entity_name} •{' '}
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(transaction.total_amount)}</p>
                      {getStatusBadge((transaction.metadata as any)?.status || 'pending')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Orders</CardTitle>
              <CardDescription>Manage customer orders and fulfillment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button>Create Order</Button>
              </div>

              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Order #</th>
                      <th className="p-3 text-left font-medium">Customer</th>
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Amount</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions
                      .filter(t => t.transaction_type === 'sales_order')
                      .filter(
                        t =>
                          t.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.customer?.entity_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(order => (
                        <tr key={order.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{order.transaction_code}</td>
                          <td className="p-3">{order.customer?.entity_name}</td>
                          <td className="p-3">
                            {new Date(order.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-bold">{formatCurrency(order.total_amount)}</td>
                          <td className="p-3">{getStatusBadge((order.metadata as any)?.status)}</td>
                          <td className="p-3">
                            <Button size="sm" variant="ghost">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Invoices</CardTitle>
              <CardDescription>Track invoice status and collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">Run Dunning</Button>
                <Button>Create Invoice</Button>
              </div>

              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Invoice #</th>
                      <th className="p-3 text-left font-medium">Customer</th>
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Due Date</th>
                      <th className="p-3 text-left font-medium">Amount</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions
                      .filter(t => t.transaction_type === 'customer_invoice')
                      .filter(
                        t =>
                          t.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.customer?.entity_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(invoice => (
                        <tr key={invoice.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{invoice.transaction_code}</td>
                          <td className="p-3">{invoice.customer?.entity_name}</td>
                          <td className="p-3">
                            {new Date(invoice.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {new Date((invoice.metadata as any)?.due_date).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-bold">{formatCurrency(invoice.total_amount)}</td>
                          <td className="p-3">
                            {new Date((invoice.metadata as any)?.due_date) < new Date() &&
                            (invoice.metadata as any)?.status === 'pending'
                              ? getStatusBadge('overdue')
                              : getStatusBadge((invoice.metadata as any)?.status)}
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="ghost">
                              Send
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Payments</CardTitle>
              <CardDescription>Record and track payment receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button>Record Payment</Button>
              </div>

              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Payment #</th>
                      <th className="p-3 text-left font-medium">Customer</th>
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Method</th>
                      <th className="p-3 text-left font-medium">Amount</th>
                      <th className="p-3 text-left font-medium">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions
                      .filter(t => t.transaction_type === 'customer_payment')
                      .filter(
                        t =>
                          t.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.customer?.entity_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(payment => (
                        <tr key={payment.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{payment.transaction_code}</td>
                          <td className="p-3">{payment.customer?.entity_name}</td>
                          <td className="p-3">
                            {new Date(payment.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {(payment.metadata as any)?.payment_method}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold">{formatCurrency(payment.total_amount)}</td>
                          <td className="p-3">
                            {(payment.metadata as any)?.unapplied_amount > 0 ? (
                              <Badge variant="secondary">
                                {formatCurrency(
                                  payment.total_amount - payment.metadata.unapplied_amount
                                )}{' '}
                                applied
                              </Badge>
                            ) : (
                              <Badge variant="default">Fully applied</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Insights Card */}
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-600 mt-2" />
                    <div>
                      <p className="font-medium">Collection Optimization</p>
                      <p className="text-sm text-muted-foreground">
                        Focus on 5 high-value overdue accounts could recover $
                        {formatCurrency(150000)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-600 mt-2" />
                    <div>
                      <p className="font-medium">Credit Risk Alert</p>
                      <p className="text-sm text-muted-foreground">
                        3 customers showing payment pattern anomalies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-purple-600 mt-2" />
                    <div>
                      <p className="font-medium">Cash Flow Forecast</p>
                      <p className="text-sm text-muted-foreground">
                        Expected ${formatCurrency(450000)} in collections next 30 days
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Days Sales Outstanding (DSO)</span>
                      <span className="text-sm font-bold">{metrics?.analytics.dso} days</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((32 / 60) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Collection Rate</span>
                      <span className="text-sm font-bold">
                        {metrics?.analytics.collection_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${metrics?.analytics.collection_rate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Average Credit Score</span>
                      <span className="text-sm font-bold">
                        {metrics?.customers.average_credit_score}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${(metrics?.customers.average_credit_score / 850) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed revenue breakdown and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">MTD Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics?.analytics.revenue_mtd || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">YTD Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics?.analytics.revenue_ytd || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      metrics?.orders.total > 0
                        ? metrics.orders.total_value / metrics.orders.total
                        : 0
                    )}
                  </p>
                </div>
              </div>

              <Button className="w-full" variant="outline">
                Generate Detailed Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
