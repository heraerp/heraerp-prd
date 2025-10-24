'use client'

import React from 'react'
import { useHera } from '@/lib/hooks/hera'
import { 
  BarChart3, TrendingUp, DollarSign, Users, Package, 
  Calendar, ArrowUpRight, ArrowDownRight, Target,
  ShoppingCart, Clock, Star, Activity
} from 'lucide-react'

export default function RetailAnalyticsPage() {
  const { client, auth } = useHera()
  const [timeframe, setTimeframe] = React.useState('today')
  
  // Mock analytics data - in production this would come from the API
  const analytics = {
    revenue: {
      current: 45750,
      previous: 42300,
      change: 8.16,
      trend: 'up'
    },
    orders: {
      current: 147,
      previous: 132,
      change: 11.36,
      trend: 'up'
    },
    customers: {
      current: 89,
      previous: 95,
      change: -6.32,
      trend: 'down'
    },
    avgOrderValue: {
      current: 311.22,
      previous: 320.45,
      change: -2.88,
      trend: 'down'
    }
  }

  const topProducts = [
    { name: 'iPhone 15 Pro', sales: 23, revenue: 25000, category: 'Electronics' },
    { name: 'Samsung Galaxy S24', sales: 18, revenue: 18500, category: 'Electronics' },
    { name: 'MacBook Air M2', sales: 8, revenue: 12000, category: 'Computers' },
    { name: 'AirPods Pro', sales: 45, revenue: 11250, category: 'Accessories' },
    { name: 'iPad Pro', sales: 12, revenue: 9600, category: 'Tablets' }
  ]

  const salesTrend = [
    { period: '00:00', sales: 0 },
    { period: '04:00', sales: 2400 },
    { period: '08:00', sales: 8900 },
    { period: '12:00', sales: 15600 },
    { period: '16:00', sales: 32400 },
    { period: '20:00', sales: 41200 },
    { period: '24:00', sales: 45750 }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="modern-card modern-primary">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-[#1E88E5]/30 to-[#1565C0]/20">
              <BarChart3 className="w-7 h-7 text-[#1565C0]" />
            </div>
            <div>
              <h1 className="modern-heading text-2xl text-[#1E1E20]">Analytics Dashboard</h1>
              <p className="modern-subheading">Business insights and performance metrics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              className="modern-input"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Revenue', 
            value: analytics.revenue.current, 
            change: analytics.revenue.change,
            trend: analytics.revenue.trend,
            icon: DollarSign,
            format: 'currency'
          },
          { 
            label: 'Total Orders', 
            value: analytics.orders.current, 
            change: analytics.orders.change,
            trend: analytics.orders.trend,
            icon: ShoppingCart,
            format: 'number'
          },
          { 
            label: 'Active Customers', 
            value: analytics.customers.current, 
            change: analytics.customers.change,
            trend: analytics.customers.trend,
            icon: Users,
            format: 'number'
          },
          { 
            label: 'Avg Order Value', 
            value: analytics.avgOrderValue.current, 
            change: analytics.avgOrderValue.change,
            trend: analytics.avgOrderValue.trend,
            icon: Target,
            format: 'currency'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon
          const isPositive = metric.trend === 'up'
          const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
          
          return (
            <div key={metric.label} className="modern-card hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1E88E5]/20 to-[#1565C0]/10">
                  <IconComponent className="w-6 h-6 text-[#1565C0]" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? 'text-[#81C784]' : 'text-[#E53935]'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  {Math.abs(metric.change).toFixed(1)}%
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="modern-caption text-[#4B5563]">{metric.label}</div>
                <div className="modern-heading text-2xl text-[#1E1E20]">
                  {metric.format === 'currency' ? '₹' : ''}
                  {typeof metric.value === 'number' ? metric.value.toLocaleString('en-IN', {
                    minimumFractionDigits: metric.format === 'currency' ? 2 : 0
                  }) : metric.value}
                </div>
                <div className="modern-caption text-[#4B5563]">
                  vs previous {timeframe === 'today' ? 'day' : timeframe}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 modern-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="modern-heading text-xl text-[#1E1E20] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1E88E5]" />
              Sales Trend
            </h2>
            <div className="modern-caption text-[#4B5563]">
              {timeframe === 'today' ? 'Hourly' : 'Daily'} breakdown
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="modern-surface p-4 rounded-xl">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {salesTrend.map((point, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="bg-gradient-to-t from-[#1E88E5] to-[#42A5F5] rounded-t mx-auto mb-2 transition-all duration-300 hover:from-[#1565C0] hover:to-[#1E88E5]"
                      style={{ 
                        height: `${(point.sales / Math.max(...salesTrend.map(p => p.sales))) * 120}px`,
                        width: '100%'
                      }}
                    />
                    <div className="modern-caption text-[#4B5563] text-xs">{point.period}</div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <div className="modern-heading text-2xl text-[#1E88E5] mb-1">
                  ₹{analytics.revenue.current.toLocaleString('en-IN')}
                </div>
                <div className="modern-caption text-[#4B5563]">Total Revenue Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="modern-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="modern-heading text-xl text-[#1E1E20] flex items-center gap-2">
              <Star className="w-5 h-5 text-[#1E88E5]" />
              Top Products
            </h2>
          </div>
          
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="modern-surface p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E88E5] to-[#1565C0] flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="modern-body text-[#1E1E20] font-medium text-sm">
                        {product.name}
                      </div>
                      <div className="modern-caption text-[#4B5563] text-xs">
                        {product.category}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="modern-caption text-[#4B5563]">
                    {product.sales} sales
                  </div>
                  <div className="modern-heading text-sm text-[#1E88E5]">
                    ₹{product.revenue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="modern-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#81C784]/10">
              <Activity className="w-5 h-5 text-[#81C784]" />
            </div>
            <div>
              <div className="modern-caption text-[#4B5563]">Conversion Rate</div>
              <div className="modern-heading text-xl text-[#1E1E20]">3.2%</div>
            </div>
          </div>
          <div className="modern-caption text-[#4B5563]">
            89 customers from 2,781 visitors
          </div>
        </div>

        <div className="modern-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#FFB74D]/10">
              <Clock className="w-5 h-5 text-[#FFB74D]" />
            </div>
            <div>
              <div className="modern-caption text-[#4B5563]">Avg Session</div>
              <div className="modern-heading text-xl text-[#1E1E20]">4m 32s</div>
            </div>
          </div>
          <div className="modern-caption text-[#4B5563]">
            Time spent per customer visit
          </div>
        </div>

        <div className="modern-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#1E88E5]/10">
              <Package className="w-5 h-5 text-[#1E88E5]" />
            </div>
            <div>
              <div className="modern-caption text-[#4B5563]">Items per Order</div>
              <div className="modern-heading text-xl text-[#1E1E20]">2.7</div>
            </div>
          </div>
          <div className="modern-caption text-[#4B5563]">
            Average items in each transaction
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="modern-card modern-surface text-center">
        <div className="modern-caption text-[#4B5563]">
          Data refreshed at {new Date().toLocaleTimeString()} • Next update in 5 minutes
        </div>
      </div>
    </div>
  )
}