'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { universalApi } from '@/src/lib/universal-api'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  TrendingUp,
  Clock,
  DollarSign,
  ShoppingCart,
  TableProperties,
  Loader2,
  CreditCard
} from 'lucide-react'

interface RestaurantDashboardProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

export function RestaurantDashboard({
  organizationId,
  smartCodes,
  isDemoMode = false
}: RestaurantDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    avgOrder: 0,
    tables: 0,
    payments: 0,
    tips: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [organizationId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)

      // Get today's date
      const today = new Date().toISOString().split('T')[0]

      // Get all transactions
      const transactionsResponse = await universalApi.getTransactions()
      const transactions = Array.isArray(transactionsResponse)
        ? transactionsResponse
        : transactionsResponse.data || []

      // Filter for today's sales
      const todaySales = transactions.filter(
        t =>
          t.transaction_type === 'sale' &&
          t.transaction_date &&
          t.transaction_date.startsWith(today)
      )

      // Filter for today's payments
      const todayPayments = transactions.filter(
        t =>
          t.transaction_type === 'payment' &&
          t.transaction_date &&
          t.transaction_date.startsWith(today)
      )

      // Get tables
      const tablesResponse = await universalApi.getEntities()
      const entities = Array.isArray(tablesResponse) ? tablesResponse : tablesResponse.data || []
      const tables = entities.filter(e => e.entity_type === 'table')

      // Calculate stats
      const revenue = todaySales.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const orders = todaySales.length
      const avgOrder = orders > 0 ? revenue / orders : 0
      const paymentTotal = todayPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0)
      const tipTotal = todayPayments.reduce(
        (sum, p) => sum + (((p.metadata as any)?.tip_amount as number) || 0),
        0
      )

      setStats({
        revenue,
        orders,
        avgOrder,
        tables: tables.length,
        payments: paymentTotal,
        tips: tipTotal
      })
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.revenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">From database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-xs text-muted-foreground">Active orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.avgOrder.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TableProperties className="h-4 w-4" />
              Total Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.tables}</p>
            <p className="text-xs text-muted-foreground">In system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payments Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.payments.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tips Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.tips.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-muted-foreground mt-6">
        <p>Organization ID: {organizationId}</p>
        <p className="text-sm">Using real database data • Sacred Six Tables</p>
      </div>
    </div>
  )
}
