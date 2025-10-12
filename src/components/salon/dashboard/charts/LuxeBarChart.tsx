/**
 * Luxe Bar Chart Component
 * Enterprise-grade bar chart with luxe salon theme
 */

'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface LuxeBarChartProps {
  data: any[]
  xKey: string
  yKey: string
  color?: string
  height?: number
  formatYAxis?: (value: any) => string
  formatTooltip?: (value: any) => string
  showGrid?: boolean
  barSize?: number
  gradient?: boolean
}

export function LuxeBarChart({
  data,
  xKey,
  yKey,
  color = LUXE_COLORS.gold,
  height = 300,
  formatYAxis,
  formatTooltip,
  showGrid = true,
  barSize = 40,
  gradient = true
}: LuxeBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-xl p-4 shadow-2xl border backdrop-blur-xl"
          style={{
            backgroundColor: `${LUXE_COLORS.charcoalLight}F5`,
            border: `1px solid ${color}40`,
            boxShadow: `0 10px 30px ${LUXE_COLORS.black}80, 0 0 20px ${color}20`
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: LUXE_COLORS.bronze }}>
            {label}
          </p>
          <p className="text-lg font-bold" style={{ color: LUXE_COLORS.champagne }}>
            {formatTooltip ? formatTooltip(payload[0].value) : payload[0].value}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        {gradient && (
          <defs>
            <linearGradient id={`bar-gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          </defs>
        )}
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={`${LUXE_COLORS.bronze}20`}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xKey}
          stroke={LUXE_COLORS.bronze}
          tick={{ fill: LUXE_COLORS.bronze, fontSize: 12 }}
          axisLine={{ stroke: `${LUXE_COLORS.bronze}30` }}
        />
        <YAxis
          stroke={LUXE_COLORS.bronze}
          tick={{ fill: LUXE_COLORS.bronze, fontSize: 12 }}
          axisLine={{ stroke: `${LUXE_COLORS.bronze}30` }}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: `${LUXE_COLORS.gold}10` }} />
        <Bar
          dataKey={yKey}
          fill={gradient ? `url(#bar-gradient-${yKey})` : color}
          radius={[8, 8, 0, 0]}
          maxBarSize={barSize}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              style={{ filter: `drop-shadow(0 4px 8px ${color}30)` }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
