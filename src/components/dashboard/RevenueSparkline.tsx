'use client'

import React from 'react'
import Link from 'next/link'
import { TrendingUp, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useUniversalReports } from '@/src/lib/hooks/useUniversalReports'

interface RevenueSparklineProps {
  organizationId: string
}

export function RevenueSparkline({ organizationId }: RevenueSparklineProps) {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  
  const { data, isLoading } = useUniversalReports({
    organizationId,
    reportType: 'daily_sales',
    dateRange: {
      start: sevenDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    }
  })

  // Transform data for chart
  const chartData = React.useMemo(() => {
    if (!data?.daily_breakdown) return []
    
    return data.daily_breakdown.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-AE', { weekday: 'short' }),
      revenue: day.gross_sales || 0
    }))
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(value)
  }

  const todayRevenue = chartData[chartData.length - 1]?.revenue || 0
  const yesterdayRevenue = chartData[chartData.length - 2]?.revenue || 0
  const percentChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100)
    : 0

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
          {percentChange !== 0 && (
            <span className={`text-sm font-medium ${percentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#888' }}
              />
              <YAxis 
                hide
                domain={[0, 'dataMax']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">
                          {payload[0].payload.date}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#colorGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#8b5cf6' }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4">
          <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            {formatCurrency(todayRevenue)}
          </p>
          <p className="text-sm text-muted-foreground">Today's Revenue</p>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3">
        <Link href="/reports/sales/daily" className="w-full">
          <Button variant="ghost" className="w-full">
            View Daily Sales
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}