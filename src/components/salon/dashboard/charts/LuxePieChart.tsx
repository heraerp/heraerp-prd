/**
 * Luxe Pie/Donut Chart Component
 * Enterprise-grade pie chart with luxe salon theme
 */

'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface LuxePieChartProps {
  data: Array<{ name: string; value: number; color?: string }>
  height?: number
  innerRadius?: number
  outerRadius?: number
  colors?: string[]
  showLegend?: boolean
  formatValue?: (value: any) => string
}

export function LuxePieChart({
  data,
  height = 300,
  innerRadius = 0,
  outerRadius = 100,
  colors = [
    LUXE_COLORS.gold,
    LUXE_COLORS.emerald,
    LUXE_COLORS.sapphire,
    LUXE_COLORS.orange,
    LUXE_COLORS.plum,
    LUXE_COLORS.ruby
  ],
  showLegend = true,
  formatValue
}: LuxePieChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          className="rounded-xl p-4 shadow-2xl border backdrop-blur-xl"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F5`,
            border: `1px solid ${data.color || data.fill}40`,
            boxShadow: `0 10px 30px ${LUXE_COLORS.black}80, 0 0 20px ${data.color || data.fill}20`
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.bronze }}>
            {data.name}
          </p>
          <p className="text-lg font-bold" style={{ color: LUXE_COLORS.champagne }}>
            {formatValue ? formatValue(data.value) : data.value}
          </p>
          <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
            {data.percentage ? `${data.percentage}%` : ''}
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: entry.color,
                boxShadow: `0 0 8px ${entry.color}60`
              }}
            />
            <span className="text-xs font-medium" style={{ color: LUXE_COLORS.lightText }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithPercentages}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {dataWithPercentages.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
              stroke={LUXE_COLORS.charcoalLight}
              strokeWidth={2}
              style={{
                filter: `drop-shadow(0 0 8px ${entry.color || colors[index % colors.length]}40)`
              }}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
    </ResponsiveContainer>
  )
}
