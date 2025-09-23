'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useDailySalesReport } from '@/lib/api/financial-reports'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Clock,
  Download,
  Printer,
  RefreshCw,
  AlertCircle,
  Package,
  Scissors
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Default organization ID for salon - Hair Talkz Park Regis
const DEFAULT_SALON_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

const formatCurrency = (amount: number, currency: string = 'AED'): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function DailySalesReportPage() {
  const { currentOrganization, contextLoading } = useHERAAuth()
  const organizationId = currentOrganization?.id || DEFAULT_SALON_ORG_ID

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Fetch real sales data
  const { data, isLoading, error, refetch } = useDailySalesReport(organizationId, selectedDate)

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // In a real implementation, this would generate a CSV or PDF
    console.log('Exporting report...')
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground">
              Daily Sales Report
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Real-time sales data and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="bg-background dark:bg-muted"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handlePrint} className="bg-background dark:bg-muted">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <Card className="bg-background dark:bg-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-auto"
                max={new Date().toISOString().split('T')[0]}
              />
              <span className="text-muted-foreground">
                {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error loading sales data: {error.message}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sales Summary Cards */}
        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-background dark:bg-muted">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(data.summary.totalSales)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data.summary.totalTransactions} transactions
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-muted">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Service Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(data.summary.serviceRevenue)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data.summary.serviceRevenue > 0
                          ? `${((data.summary.serviceRevenue / data.summary.totalSales) * 100).toFixed(1)}% of total`
                          : '0% of total'}
                      </p>
                    </div>
                    <Scissors className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-muted">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Product Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(data.summary.productRevenue)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data.summary.productRevenue > 0
                          ? `${((data.summary.productRevenue / data.summary.totalSales) * 100).toFixed(1)}% of total`
                          : '0% of total'}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background dark:bg-muted">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Ticket</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(data.summary.averageTicket)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales by Hour Chart */}
            <Card className="bg-background dark:bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Sales by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 13 }, (_, i) => i + 9).map(hour => {
                    const hourKey = `${hour}:00`
                    const sales = data.summary.salesByHour.get(hourKey) || 0
                    const maxSales = Math.max(...Array.from(data.summary.salesByHour.values()))
                    const percentage = maxSales > 0 ? (sales / maxSales) * 100 : 0

                    return (
                      <div key={hour} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-16">{hourKey}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {formatCurrency(sales)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sales by Stylist */}
            <Card className="bg-background dark:bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Sales by Stylist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(data.summary.salesByStylist.values())
                    .sort((a, b) => b.revenue - a.revenue)
                    .map(stylist => (
                      <div
                        key={stylist.name}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{stylist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stylist.count} appointments
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(stylist.revenue)}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg: {formatCurrency(stylist.revenue / stylist.count)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card className="bg-background dark:bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                  Transaction Details
                </CardTitle>
                <CardDescription>
                  All sales transactions for {format(new Date(selectedDate), 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Time</th>
                        <th className="text-left py-3 px-4">Customer</th>
                        <th className="text-left py-3 px-4">Stylist</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-right py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.map(txn => (
                        <tr key={txn.id} className="border-b">
                          <td className="py-3 px-4">
                            {format(new Date(txn.transaction_date), 'h:mm a')}
                          </td>
                          <td className="py-3 px-4">
                            {txn.source_entity?.entity_name || 'Walk-in'}
                          </td>
                          <td className="py-3 px-4">{txn.target_entity?.entity_name || '-'}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{txn.transaction_type}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatCurrency(txn.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
