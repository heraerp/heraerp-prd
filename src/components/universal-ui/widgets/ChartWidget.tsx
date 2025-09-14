'use client'

import React, { useEffect, useState } from 'react'
import { Widget } from '@/lib/universal-ui/view-meta-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { universalApi } from '@/lib/universal-api'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter } from 'recharts'

interface ChartWidgetProps {
  widget: Widget
  entityId?: string
  organizationId: string
  onAction?: (action: any) => void
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export function ChartWidget({ widget, entityId, organizationId }: ChartWidgetProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [entityId, organizationId])

  const loadChartData = async () => {
    try {
      setLoading(true)
      
      const config = widget.config
      const source = widget.data_source
      
      if (config.chart_type === 'pie' && config.series) {
        // For pie charts, use series configuration
        const pieData = config.series.map((series, index) => ({
          name: series.name,
          value: Math.random() * 1000 + 100, // Sample data
          color: series.color || COLORS[index % COLORS.length]
        }))
        setData(pieData)
      } else if (source) {
        // Load data based on data source
        const result = await loadDataFromSource(source)
        setData(result)
      } else {
        // Generate sample data
        setData(generateSampleData(config.chart_type))
      }
    } catch (error) {
      console.error('Failed to load chart data:', error)
      setData(generateSampleData(widget.config.chart_type))
    } finally {
      setLoading(false)
    }
  }

  const loadDataFromSource = async (source: any) => {
    let tableName = 'core_entities'
    
    switch (source.type) {
      case 'transactions':
        tableName = 'universal_transactions'
        break
      case 'relationships':
        tableName = 'core_relationships'
        break
    }
    
    const result = await universalApi.query(tableName, {
      organization_id: organizationId,
      ...buildFilters(source.filters)
    })
    
    if (result.data) {
      // Transform data for charts
      return transformDataForChart(result.data, widget.config)
    }
    
    return []
  }

  const buildFilters = (filters: any[] = []) => {
    const filterObj: any = {}
    filters.forEach(filter => {
      filterObj[filter.field] = filter.value
    })
    return filterObj
  }

  const transformDataForChart = (rawData: any[], config: any) => {
    // Group and aggregate data based on chart configuration
    if (config.x_axis && config.y_axis) {
      // Simple transformation for line/bar charts
      return rawData.map(row => ({
        [config.x_axis]: row[config.x_axis],
        [config.y_axis]: Number(row[config.y_axis]) || 0
      }))
    }
    
    return rawData
  }

  const generateSampleData = (chartType?: string) => {
    switch (chartType) {
      case 'pie':
        return [
          { name: 'Material Cost', value: 1500, color: '#3B82F6' },
          { name: 'Labor Cost', value: 800, color: '#10B981' },
          { name: 'Overhead', value: 156, color: '#F59E0B' }
        ]
      
      case 'line':
      case 'area':
        return Array.from({ length: 12 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          'Average Cost': Math.floor(Math.random() * 1000 + 1000),
          'Material Cost': Math.floor(Math.random() * 600 + 600)
        }))
      
      case 'bar':
        return Array.from({ length: 5 }, (_, i) => ({
          category: ['Chairs', 'Tables', 'Desks', 'Cabinets', 'Sofas'][i],
          count: Math.floor(Math.random() * 50 + 10)
        }))
      
      case 'scatter':
        return Array.from({ length: 30 }, () => ({
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100)
        }))
      
      default:
        return []
    }
  }

  const renderChart = () => {
    const config = widget.config
    
    switch (config.chart_type) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )
      
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.x_axis || 'month'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.series?.map((series, index) => (
              <Line
                key={series.name}
                type="monotone"
                dataKey={series.data_field || series.name}
                stroke={series.color || COLORS[index % COLORS.length]}
                name={series.name}
              />
            ))}
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.x_axis || 'category'} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={config.y_axis || 'count'} fill={COLORS[0]} />
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.x_axis || 'month'} />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.series?.map((series, index) => (
              <Area
                key={series.name}
                type="monotone"
                dataKey={series.data_field || series.name}
                stroke={series.color || COLORS[index % COLORS.length]}
                fill={series.color || COLORS[index % COLORS.length]}
                fillOpacity={0.6}
                name={series.name}
              />
            ))}
          </AreaChart>
        )
      
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid />
            <XAxis dataKey="x" name="X" />
            <YAxis dataKey="y" name="Y" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill={COLORS[0]} />
          </ScatterChart>
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}