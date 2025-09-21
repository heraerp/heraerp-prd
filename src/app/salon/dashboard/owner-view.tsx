'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'from-pink-500 to-purple-600' }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${color}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isUp ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(
              "text-xs font-medium",
              trend.isUp ? "text-green-500" : "text-red-500"
            )}>
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Sarah!</h1>
        <p className="text-purple-100">Here's how Hair Talkz is performing today</p>
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
              <BarChart3 className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Target</span>
                <span className="text-sm font-medium">85% achieved</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">AED 385.2K</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Current Month</p>
              </div>
              <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">AED 453K</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Target</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
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
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.service}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.count} bookings</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.revenue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Low Inventory Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              5 products below reorder level
            </p>
            <button className="mt-2 text-sm text-orange-600 dark:text-orange-400 font-medium hover:underline">
              View Inventory →
            </button>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              4.8★ average this week (12 reviews)
            </p>
            <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Read Reviews →
            </button>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              Growth Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Wednesday slots 40% unutilized
            </p>
            <button className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium hover:underline">
              Launch Campaign →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}