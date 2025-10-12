/**
 * Luxe Line Chart Component
 * Enterprise-grade line chart with luxe salon theme
 */

'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface LuxeLineChartProps {
  data: any[]
  xKey: string
  yKey: string
  color?: string
  gradient?: boolean
  height?: number
  formatYAxis?: (value: any) => string
  formatTooltip?: (value: any) => string
  showGrid?: boolean
  strokeWidth?: number
  dot?: boolean
}

export function LuxeLineChart({
  data,
  xKey,
  yKey,
  color = LUXE_COLORS.gold,
  gradient = true,
  height = 300,
  formatYAxis,
  formatTooltip,
  showGrid = true,
  strokeWidth = 3,
  dot = true
}: LuxeLineChartProps) {
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

  if (gradient) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="50%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: `${color}40`, strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={`url(#gradient-${yKey})`}
            dot={
              dot
                ? {
                    fill: color,
                    stroke: LUXE_COLORS.charcoal,
                    strokeWidth: 2,
                    r: 4
                  }
                : false
            }
            activeDot={{
              r: 6,
              fill: color,
              stroke: LUXE_COLORS.charcoal,
              strokeWidth: 2,
              style: { filter: `drop-shadow(0 0 8px ${color})` }
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
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
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: `${color}40`, strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={strokeWidth}
          dot={
            dot
              ? {
                  fill: color,
                  stroke: LUXE_COLORS.charcoal,
                  strokeWidth: 2,
                  r: 4
                }
              : false
          }
          activeDot={{
            r: 6,
            fill: color,
            stroke: LUXE_COLORS.charcoal,
            strokeWidth: 2,
            style: { filter: `drop-shadow(0 0 8px ${color})` }
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
