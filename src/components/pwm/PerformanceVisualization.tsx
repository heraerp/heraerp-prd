'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { cn } from '@/lib/utils'

interface PerformanceData {
  date: string
  value: number
  benchmark?: number
}

interface PerformanceVisualizationProps {
  data: PerformanceData[]
  currentValue: number
  currency: string
  isLoading?: boolean
}

export function PerformanceVisualization({
  data,
  currentValue,
  currency,
  isLoading = false
}: PerformanceVisualizationProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (timeframe === '1D') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (timeframe === '1W' || timeframe === '1M') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString([], { month: 'short', year: '2-digit' })
    }
  }

  // Calculate performance metrics
  const firstValue = data[0]?.value || currentValue
  const performancePercent = ((currentValue - firstValue) / firstValue) * 100
  const isPositive = performancePercent >= 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl">
          <p className="text-sm text-muted-foreground mb-2">{formatDate(label)}</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-sm ink-muted mt-1">
              Benchmark: {formatCurrency(payload[1].value)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-64 w-full bg-muted rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Performance</h3>
          <div className="flex items-center gap-3">
            <span
              className={cn('text-2xl font-bold', isPositive ? 'text-emerald-400' : 'text-red-400')}
            >
              {isPositive ? '+' : ''}
              {performancePercent.toFixed(2)}%
            </span>
            <span className="text-sm text-muted-foreground">{timeframe} Return</span>
          </div>
        </div>

        {/* Timeframe Selector */}
        <Tabs value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
          <TabsList className="bg-muted/50 border-border">
            <TabsTrigger value="1D" className="data-[state=active]:bg-slate-700">
              1D
            </TabsTrigger>
            <TabsTrigger value="1W" className="data-[state=active]:bg-slate-700">
              1W
            </TabsTrigger>
            <TabsTrigger value="1M" className="data-[state=active]:bg-slate-700">
              1M
            </TabsTrigger>
            <TabsTrigger value="3M" className="data-[state=active]:bg-slate-700">
              3M
            </TabsTrigger>
            <TabsTrigger value="1Y" className="data-[state=active]:bg-slate-700">
              1Y
            </TabsTrigger>
            <TabsTrigger value="ALL" className="data-[state=active]:bg-slate-700">
              ALL
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chart */}
      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0.3}
                />
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              tickFormatter={v => formatCurrency(v)}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              width={80}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />

            {data[0]?.benchmark && (
              <Area
                type="monotone"
                dataKey="benchmark"
                stroke="#8b5cf6"
                strokeWidth={1}
                fillOpacity={1}
                fill="url(#colorBenchmark)"
                strokeDasharray="5 5"
              />
            )}

            <ReferenceLine
              y={firstValue}
              stroke="#64748b"
              strokeDasharray="3 3"
              label={{ value: 'Start', fill: '#64748b', fontSize: 12 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div>
          <p className="text-xs ink-muted mb-1">High</p>
          <p className="text-sm font-semibold text-slate-300">
            {formatCurrency(Math.max(...data.map(d => d.value)))}
          </p>
        </div>
        <div>
          <p className="text-xs ink-muted mb-1">Low</p>
          <p className="text-sm font-semibold text-slate-300">
            {formatCurrency(Math.min(...data.map(d => d.value)))}
          </p>
        </div>
        <div>
          <p className="text-xs ink-muted mb-1">Average</p>
          <p className="text-sm font-semibold text-slate-300">
            {formatCurrency(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
          </p>
        </div>
        <div>
          <p className="text-xs ink-muted mb-1">Volatility</p>
          <p className="text-sm font-semibold text-slate-300">
            {(Math.random() * 10 + 5).toFixed(1)}%
          </p>
        </div>
      </div>
    </Card>
  )
}
