'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Star,
  Package,
  UserCheck,
  Clock,
  Scissors,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: {
    value: number
    isUp: boolean
  }
  color?: string
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'from-pink-500 to-purple-600'
}: MetricCardProps) {
  const iconGradient = color.includes('green')
    ? 'linear-gradient(135deg, #0F6F5C 0%, #0A4D3C 100%)'
    : color.includes('blue')
      ? 'linear-gradient(135deg, #5A2A40 0%, #3D1B2B 100%)'
      : color.includes('orange')
        ? 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)'
        : 'linear-gradient(135deg, #8C7853 0%, #6B5A3F 100%)'

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        backgroundColor: '#232323',
        border: '1px solid rgba(212, 175, 55, 0.15)'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, rgba(212, 175, 55, 0.03) 0%, transparent 50%)`
        }}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium" style={{ color: '#8C7853' }}>
          {title}
        </CardTitle>
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{
            background: iconGradient,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Icon className="h-4 w-4" style={{ color: '#0B0B0B' }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: '#F5E6C8' }}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: '#8C7853', opacity: 0.8 }}>
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isUp ? (
              <ArrowUpRight className="h-3 w-3" style={{ color: '#0F6F5C' }} />
            ) : (
              <ArrowDownRight className="h-3 w-3" style={{ color: '#FF6B6B' }} />
            )}
            <span
              className="text-xs font-medium"
              style={{
                color: trend.isUp ? '#0F6F5C' : '#FF6B6B'
              }}
            >
              {trend.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OwnerDashboard() {
  // Mock data for demonstration
  const todayRevenue = 'AED 12,450'
  const monthRevenue = 'AED 385,200'
  const activeCustomers = '1,245'
  const todayAppointments = 28
  const staffPresent = '8/10'
  const inventoryValue = 'AED 45,300'

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div
        className="rounded-xl p-6"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
          boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
        }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0B0B0B' }}>
          Welcome back, Sarah!
        </h1>
        <p style={{ color: '#0B0B0B', opacity: 0.8 }}>Here's how Hair Talkz is performing today</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Revenue"
          value={todayRevenue}
          subtitle="12 transactions"
          icon={DollarSign}
          trend={{ value: 15, isUp: true }}
          color="from-green-500 to-emerald-600"
        />
        <MetricCard
          title="Active Customers"
          value={activeCustomers}
          subtitle="45 new this month"
          icon={Users}
          trend={{ value: 8, isUp: true }}
          color="from-blue-500 to-cyan-600"
        />
        <MetricCard
          title="Today's Appointments"
          value={todayAppointments}
          subtitle="3 walk-ins"
          icon={Calendar}
          color="from-purple-500 to-pink-600"
        />
        <MetricCard
          title="Staff Present"
          value={staffPresent}
          subtitle="2 on leave"
          icon={UserCheck}
          color="from-orange-500 to-red-600"
        />
      </div>

      {/* Business Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: '#D4AF37' }} />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#8C7853' }}>
                  Revenue Target
                </span>
                <span className="text-sm font-medium" style={{ color: '#F5E6C8' }}>
                  85% achieved
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#0F0F0F' }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                    width: '85%'
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div
                className="text-center p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}
              >
                <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
                  AED 385.2K
                </p>
                <p className="text-xs" style={{ color: '#8C7853' }}>
                  Current Month
                </p>
              </div>
              <div
                className="text-center p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(90, 42, 64, 0.1)',
                  border: '1px solid rgba(90, 42, 64, 0.2)'
                }}
              >
                <p className="text-2xl font-bold" style={{ color: '#5A2A40' }}>
                  AED 453K
                </p>
                <p className="text-xs" style={{ color: '#8C7853' }}>
                  Target
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" style={{ color: '#D4AF37' }} />
              Top Services Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { service: 'Hair Color & Highlights', count: 8, revenue: 'AED 4,200' },
                { service: 'Hair Cut & Style', count: 12, revenue: 'AED 3,600' },
                { service: 'Keratin Treatment', count: 3, revenue: 'AED 2,400' },
                { service: 'Manicure & Pedicure', count: 5, revenue: 'AED 1,250' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: '#0F0F0F',
                    border: '1px solid rgba(212, 175, 55, 0.1)'
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#F5E6C8' }}>
                      {item.service}
                    </p>
                    <p className="text-xs" style={{ color: '#8C7853' }}>
                      {item.count} bookings
                    </p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                    {item.revenue}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" style={{ color: '#D4AF37' }} />
              <span style={{ color: '#F5E6C8' }}>Low Inventory Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: '#E0E0E0' }}>
              5 products below reorder level
            </p>
            <button
              className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#D4AF37' }}
            >
              View Inventory →
            </button>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'rgba(90, 42, 64, 0.1)',
            border: '1px solid rgba(90, 42, 64, 0.3)'
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" style={{ color: '#5A2A40' }} />
              <span style={{ color: '#F5E6C8' }}>Customer Reviews</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: '#E0E0E0' }}>
              4.8★ average this week (12 reviews)
            </p>
            <button
              className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#5A2A40' }}
            >
              Read Reviews →
            </button>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'rgba(15, 111, 92, 0.1)',
            border: '1px solid rgba(15, 111, 92, 0.3)'
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" style={{ color: '#0F6F5C' }} />
              <span style={{ color: '#F5E6C8' }}>Growth Opportunity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: '#E0E0E0' }}>
              Wednesday slots 40% unutilized
            </p>
            <button
              className="mt-2 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: '#0F6F5C' }}
            >
              Launch Campaign →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
