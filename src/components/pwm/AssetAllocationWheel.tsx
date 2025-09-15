'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts'
import { AssetAllocation } from '@/lib/pwm/types'
import { cn } from '@/lib/utils'

interface AssetAllocationWheelProps {
  allocations: AssetAllocation[]
  totalValue: number
  currency: string
  onCategoryClick?: (category: string) => void
}

const COLORS = {
  'Public Equities': '#10b981',
  'Real Estate': '#3b82f6',
  Cryptocurrency: '#8b5cf6',
  Commodities: '#f59e0b',
  'Private Equity': '#ef4444',
  'Hedge Funds': '#ec4899',
  'Cash & Equivalents': '#6b7280',
  'Managed Portfolios': '#14b8a6',
  Trusts: '#84cc16',
  Foundations: '#06b6d4',
  'General Assets': '#64748b',
  Other: '#94a3b8'
}

export function AssetAllocationWheel({
  allocations,
  totalValue,
  currency,
  onCategoryClick
}: AssetAllocationWheelProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value
    } = props
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff" className="text-2xl font-bold">
          {formatCurrency(value)}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#e2e8f0"
          className="text-sm font-medium"
        >
          {payload.category}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#94a3b8"
          className="text-xs"
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      </g>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl">
          <p className="font-semibold text-white mb-2">{data.category}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-slate-400">Value:</span>
              <span className="ml-2 font-medium text-white">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Allocation:</span>
              <span className="ml-2 font-medium text-white">{data.percentage.toFixed(1)}%</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">24h Change:</span>
              <span
                className={cn(
                  'ml-2 font-medium',
                  data.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {data.change24h >= 0 ? '+' : ''}
                {data.change24h.toFixed(2)}%
              </span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Risk Score:</span>
              <span className="ml-2 font-medium text-white">{data.riskScore}/10</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const handlePieLeave = () => {
    setActiveIndex(null)
  }

  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Portfolio Allocation</h3>
        <p className="text-sm text-slate-400">
          Interactive breakdown of your {formatCurrency(totalValue)} portfolio
        </p>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeShape={activeIndex !== null ? renderActiveShape : undefined}
              data={allocations}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={handlePieEnter}
              onMouseLeave={handlePieLeave}
              onClick={data => onCategoryClick?.(data.category)}
            >
              {allocations.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.category as keyof typeof COLORS] || COLORS.Other}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {allocations.map(allocation => (
          <button
            key={allocation.category}
            onClick={() => onCategoryClick?.(allocation.category)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-left"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: COLORS[allocation.category as keyof typeof COLORS] || COLORS.Other
              }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-300 truncate">{allocation.category}</p>
              <p className="text-xs text-slate-500">
                {allocation.percentage.toFixed(1)}% • {formatCurrency(allocation.value)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
