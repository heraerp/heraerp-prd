'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import { Button } from '@/components/ui/button'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { cn } from '@/lib/utils'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface AnalyticsSectionProps {
  organizationId: string
}

export function AnalyticsSection({ organizationId }: AnalyticsSectionProps) {
  // Date range state
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30), // Last 30 days
    to: new Date()
  })

  // Analytics data state
  const [dailySales, setDailySales] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [totals, setTotals] = useState({
    grossSales: 0,
    totalDiscounts: 0,
    totalTax: 0,
    netSales: 0,
    transactionCount: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data
  useEffect(() => {
    if (!organizationId || !dateRange.from || !dateRange.to) return

    const fetchAnalytics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Add organization ID to cookies for API access
        document.cookie = `hera-organization-id=${organizationId}; path=/`

        // Fetch daily sales
        const salesRes = await fetch(
          `/api/playbook/analytics/daily-sales?` +
            new URLSearchParams({
              orgId: organizationId,
              startDate: format(dateRange.from, 'yyyy-MM-dd'),
              endDate: format(dateRange.to, 'yyyy-MM-dd')
            })
        )

        if (!salesRes.ok) throw new Error('Failed to fetch sales data')
        const salesData = await salesRes.json()
        const dailySalesItems = salesData.items || salesData.daily_sales || []
        setDailySales(dailySalesItems)

        // Calculate totals
        const totals = dailySalesItems.reduce(
          (acc: any, day: any) => ({
            grossSales: acc.grossSales + (day.gross_sales || 0),
            totalDiscounts: acc.totalDiscounts + (day.total_discounts || 0),
            totalTax: acc.totalTax + (day.total_tax || 0),
            netSales: acc.netSales + (day.net_sales || 0),
            transactionCount: acc.transactionCount + (day.transaction_count || 0)
          }),
          { grossSales: 0, totalDiscounts: 0, totalTax: 0, netSales: 0, transactionCount: 0 }
        )
        setTotals(totals)

        // Fetch top items
        const topRes = await fetch(
          `/api/playbook/analytics/top-items?` +
            new URLSearchParams({
              orgId: organizationId,
              startDate: format(dateRange.from, 'yyyy-MM-dd'),
              endDate: format(dateRange.to, 'yyyy-MM-dd'),
              limit: '5'
            })
        )

        if (!topRes.ok) throw new Error('Failed to fetch top items')
        const topData = await topRes.json()
        setTopItems(topData.items || topData.top_items || [])
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [organizationId, dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
          Sales Analytics
        </h2>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={(range: any) => setDateRange(range)}
          className="w-auto"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="border-0"
          style={{
            backgroundColor: `${COLORS.charcoalLight}CC`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.gold}15`
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
              Total Sales
            </CardTitle>
            <DollarSign className="h-4 w-4" style={{ color: COLORS.gold }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
              {isLoading ? '...' : formatCurrency(totals.grossSales)}
            </div>
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              {totals.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-0"
          style={{
            backgroundColor: `${COLORS.charcoalLight}CC`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.gold}15`
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
              Discounts
            </CardTitle>
            <TrendingDown className="h-4 w-4" style={{ color: COLORS.rose }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: COLORS.rose }}>
              {isLoading ? '...' : formatCurrency(totals.totalDiscounts)}
            </div>
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              Applied to sales
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-0"
          style={{
            backgroundColor: `${COLORS.charcoalLight}CC`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.gold}15`
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
              Tax Collected
            </CardTitle>
            <Calendar className="h-4 w-4" style={{ color: COLORS.bronze }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
              {isLoading ? '...' : formatCurrency(totals.totalTax)}
            </div>
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              VAT 5%
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-0"
          style={{
            backgroundColor: `${COLORS.charcoalLight}CC`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.gold}15`
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
              Net Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4" style={{ color: COLORS.emerald }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: COLORS.emerald }}>
              {isLoading ? '...' : formatCurrency(totals.netSales)}
            </div>
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              After discounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card
          className="border-0"
          style={{
            backgroundColor: `${COLORS.charcoalLight}CC`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.gold}15`
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: COLORS.gold }} />
              <span style={{ color: COLORS.champagne }}>Daily Sales Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8" style={{ color: COLORS.bronze }}>
                  Loading...
                </div>
              ) : dailySales.length === 0 ? (
                <div className="text-center py-8" style={{ color: COLORS.bronze }}>
                  No sales data for this period
                </div>
              ) : (
                dailySales.map(day => (
                  <div
                    key={day.sale_date}
                    className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: `${COLORS.bronze}33` }}
                  >
                    <span className="text-sm" style={{ color: COLORS.lightText }}>
                      {format(new Date(day.sale_date), 'MMM dd, yyyy')}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm" style={{ color: COLORS.bronze }}>
                        {day.transaction_count} sales
                      </span>
                      <span className="font-medium" style={{ color: COLORS.champagne }}>
                        {formatCurrency(day.net_sales)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products/Services */}
        <Card
          className="border-0"
          style={{
            backgroundColor: `${COLORS.charcoalLight}CC`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.gold}15`
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" style={{ color: COLORS.gold }} />
              <span style={{ color: COLORS.champagne }}>Top Products & Services</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8" style={{ color: COLORS.bronze }}>
                  Loading...
                </div>
              ) : topItems.length === 0 ? (
                <div className="text-center py-8" style={{ color: COLORS.bronze }}>
                  No sales data for this period
                </div>
              ) : (
                topItems.map((item, idx) => (
                  <div
                    key={item.item_id}
                    className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: `${COLORS.bronze}33` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold" style={{ color: COLORS.gold }}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-medium" style={{ color: COLORS.champagne }}>
                          {item.item_name}
                        </div>
                        <div className="text-xs" style={{ color: COLORS.bronze }}>
                          {item.entity_type === 'salon_service' ? 'Service' : 'Product'} • Sold{' '}
                          {item.times_sold} times
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium" style={{ color: COLORS.champagne }}>
                        {formatCurrency(item.total_revenue)}
                      </div>
                      <div className="text-xs" style={{ color: COLORS.bronze }}>
                        {formatCurrency(item.average_price)} avg
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
