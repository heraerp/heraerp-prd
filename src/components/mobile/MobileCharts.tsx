'use client'

import React from 'react'
import { BarChart3, PieChart, TrendingUp, Eye, Download, Settings } from 'lucide-react'

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface MobileChartProps {
  title?: string
  subtitle?: string
  data: ChartDataPoint[]
  type?: 'bar' | 'line' | 'pie' | 'scatter'
  height?: number
  className?: string
  loading?: boolean
  emptyState?: React.ReactNode
  actions?: React.ReactNode
  onDataPointClick?: (dataPoint: ChartDataPoint, index: number) => void
}

export function MobileChart({
  title,
  subtitle,
  data,
  type = 'bar',
  height = 200,
  className = '',
  loading = false,
  emptyState,
  actions,
  onDataPointClick
}: MobileChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))

  const renderBarChart = () => (
    <div className="flex items-end justify-center gap-2 h-full px-4">
      {data.map((point, index) => (
        <div
          key={index}
          className="flex flex-col items-center flex-1 cursor-pointer group"
          onClick={() => onDataPointClick?.(point, index)}
        >
          <div
            className="w-full bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-600"
            style={{
              height: `${(point.value / maxValue) * 80}%`,
              backgroundColor: point.color || '#3b82f6',
              minHeight: '8px'
            }}
          />
          <div className="text-xs text-gray-600 mt-1 text-center truncate w-full">
            {point.label}
          </div>
          <div className="text-xs font-medium text-gray-800">
            {point.value}
          </div>
        </div>
      ))}
    </div>
  )

  const renderLineChart = () => (
    <div className="relative h-full px-4">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[...Array(5)].map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={`${(i * 25)}%`}
            x2="100%"
            y2={`${(i * 25)}%`}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Line path */}
        <path
          d={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - (point.value / maxValue) * 80
            return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`
          }).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Area fill */}
        <path
          d={`${data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - (point.value / maxValue) * 80
            return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`
          }).join(' ')} L 100% 100% L 0% 100% Z`}
          fill="url(#lineGradient)"
        />
        
        {/* Data points */}
        {data.map((point, index) => (
          <circle
            key={index}
            cx={`${(index / (data.length - 1)) * 100}%`}
            cy={`${100 - (point.value / maxValue) * 80}%`}
            r="4"
            fill="#3b82f6"
            className="cursor-pointer hover:r-6 transition-all"
            onClick={() => onDataPointClick?.(point, index)}
          />
        ))}
      </svg>
    </div>
  )

  const renderPieChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0)
    let currentAngle = 0

    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <svg width="120" height="120" className="transform -rotate-90">
            {data.map((point, index) => {
              const percentage = point.value / total
              const angle = percentage * 360
              const startAngle = currentAngle
              currentAngle += angle

              const x1 = 60 + 50 * Math.cos((startAngle * Math.PI) / 180)
              const y1 = 60 + 50 * Math.sin((startAngle * Math.PI) / 180)
              const x2 = 60 + 50 * Math.cos(((startAngle + angle) * Math.PI) / 180)
              const y2 = 60 + 50 * Math.sin(((startAngle + angle) * Math.PI) / 180)

              const largeArc = angle > 180 ? 1 : 0

              return (
                <path
                  key={index}
                  d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={point.color || `hsl(${index * 60}, 70%, 50%)`}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onDataPointClick?.(point, index)}
                />
              )
            })}
          </svg>
          
          {/* Legend */}
          <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 space-y-1">
            {data.slice(0, 4).map((point, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: point.color || `hsl(${index * 60}, 70%, 50%)` }}
                />
                <span className="truncate">{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart()
      case 'pie':
        return renderPieChart()
      default:
        return renderBarChart()
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              {title && <h3 className="font-medium text-gray-900 text-lg">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            
            <div className="flex items-center gap-2">
              {actions}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Content */}
      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            {emptyState || (
              <>
                <BarChart3 className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">No data available</p>
                <p className="text-xs text-gray-500">Check your data source or filters</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ height: `${height}px` }} className="w-full">
            {renderChart()}
          </div>
        )}
      </div>
    </div>
  )
}