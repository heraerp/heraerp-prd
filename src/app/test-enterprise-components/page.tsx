'use client'

/**
 * HERA DNA Enterprise Components Test Page
 * Demonstrates the most modern enterprise-grade DNA components
 */

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  Package,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react'

// Import enterprise components
import { EnterpriseCard, CardHeader, CardTitle } from '@/lib/dna/components/enterprise/EnterpriseCard'
import { EnterpriseStatsCard, StatsGrid, type MetricData } from '@/lib/dna/components/enterprise/EnterpriseStatsCard'
import {
  DashboardSection,
  KPICard,
  ActivityItem,
  ChartPlaceholder,
  MetricTile,
  ProgressIndicator,
  DashboardEmptyState
} from '@/lib/dna/components/enterprise/EnterpriseDashboard'

export default function EnterpriseComponentsTest() {
  // Simulate real-time data
  const [liveRevenue, setLiveRevenue] = React.useState(48250)
  const [customerCount, setCustomerCount] = React.useState(1284)
  
  // Simulate live updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLiveRevenue(prev => prev + Math.floor(Math.random() * 100 - 25))
      setCustomerCount(prev => prev + Math.floor(Math.random() * 3))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Sample metrics for stats cards
  const salesMetric: MetricData = {
    current: liveRevenue,
    previous: 42150,
    format: 'currency',
    precision: 0
  }

  const customersMetric: MetricData = {
    current: customerCount,
    previous: 1142,
    format: 'compact'
  }

  const conversionMetric: MetricData = {
    current: 3.42,
    previous: 3.15,
    format: 'percentage',
    precision: 2
  }

  const ordersMetric: MetricData = {
    current: 428,
    previous: 395,
    unit: ' orders',
    format: 'number'
  }

  // Sample sparkline data
  const sparklineData = [45, 52, 38, 65, 48, 72, 58, 76, 82, 90, 87, 95]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-2 mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            HERA DNA Enterprise Components
          </h1>
          <p className="text-lg text-muted-foreground">
            Most modern, enterprise-grade UI components with advanced features
          </p>
        </motion.div>

        {/* Enterprise Stats Cards Section */}
        <DashboardSection
          title="Real-Time Analytics Dashboard"
          subtitle="Live data updates every 3 seconds"
          icon={<Activity className="w-5 h-5" />}
        >
          <StatsGrid columns={4}>
            <EnterpriseStatsCard
              title="Revenue"
              metric={salesMetric}
              icon={DollarSign}
              variant="success"
              trend={{ value: 14.5, period: 'vs last month' }}
              sparkline={sparklineData}
              comparison={{
                label: "Target",
                value: "$50,000",
                type: "neutral"
              }}
              badge={{ text: "LIVE", variant: "success" }}
              live
              glassIntensity="strong"
              glow
              animateOnMount
            />

            <EnterpriseStatsCard
              title="Customers"
              metric={customersMetric}
              icon={Users}
              variant="info"
              trend={{ value: 12.4 }}
              sparkline={sparklineData.map(v => v * 0.8)}
              tooltip="Active customers in the last 30 days"
              expandable
              description="Total registered customers who made at least one purchase in the last month"
              glassIntensity="medium"
              shimmer
            />

            <EnterpriseStatsCard
              title="Conversion Rate"
              metric={conversionMetric}
              icon={TrendingUp}
              variant="warning"
              comparison={{
                label: "Industry Avg",
                value: "2.8%",
                type: "positive"
              }}
              selectable
              glassIntensity="medium"
            />

            <EnterpriseStatsCard
              title="Orders"
              metric={ordersMetric}
              icon={ShoppingCart}
              variant="default"
              trend={{ value: 8.3 }}
              error="Data may be delayed by 5 minutes"
              glassIntensity="subtle"
            />
          </StatsGrid>
        </DashboardSection>

        {/* Advanced Card Features */}
        <DashboardSection
          title="Enterprise Card Variants"
          subtitle="Showcasing different animation presets and effects"
          icon={<Zap className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnterpriseCard
              glassIntensity="ultra"
              variant="premium"
              animationPreset="float"
              glow
              shimmer
              gradient
            >
              <CardHeader
                icon={<BarChart3 className="w-6 h-6" />}
                actions={
                  <button className="text-xs px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                    View Details
                  </button>
                }
              >
                <CardTitle size="lg">Premium Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Advanced insights with AI-powered predictions
                </p>
              </CardHeader>
              <ChartPlaceholder type="area" height="200px" />
            </EnterpriseCard>

            <EnterpriseCard
              glassIntensity="strong"
              variant="success"
              animationPreset="scale"
              elevation="floating"
              noise
              lazy
            >
              <CardHeader icon={<CheckCircle className="w-6 h-6" />}>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <ProgressIndicator
                  label="CPU Usage"
                  value={68}
                  max={100}
                  variant="success"
                  size="lg"
                  animate
                />
                <ProgressIndicator
                  label="Memory"
                  value={42}
                  max={100}
                  variant="warning"
                  size="lg"
                  animate
                />
                <ProgressIndicator
                  label="Storage"
                  value={85}
                  max={100}
                  variant="danger"
                  size="lg"
                  animate
                />
              </div>
            </EnterpriseCard>

            <EnterpriseCard
              glassIntensity="medium"
              variant="primary"
              animationPreset="slide"
              interactive
              loading={false}
            >
              <CardHeader
                icon={<Activity className="w-6 h-6" />}
                separator={false}
              >
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <div className="space-y-2 -mx-4">
                <ActivityItem
                  icon={<Package className="w-4 h-4" />}
                  title="New order received"
                  description="Order #1234 from John Doe"
                  timestamp="2 min ago"
                  variant="success"
                  onClick={() => console.log('Order clicked')}
                />
                <ActivityItem
                  icon={<Users className="w-4 h-4" />}
                  title="New customer signup"
                  description="jane.smith@example.com"
                  timestamp="5 min ago"
                  variant="default"
                />
                <ActivityItem
                  icon={<AlertCircle className="w-4 h-4" />}
                  title="Low inventory alert"
                  description="Product SKU-789 below threshold"
                  timestamp="15 min ago"
                  variant="warning"
                />
                <ActivityItem
                  icon={<XCircle className="w-4 h-4" />}
                  title="Payment failed"
                  description="Transaction declined for order #1233"
                  timestamp="1 hour ago"
                  variant="danger"
                />
              </div>
            </EnterpriseCard>
          </div>
        </DashboardSection>

        {/* KPI Cards */}
        <DashboardSection
          title="Key Performance Indicators"
          subtitle="Compact KPI cards with mini visualizations"
          icon={<TrendingUp className="w-5 h-5" />}
          collapsible
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Daily Revenue"
              value="$12,450"
              change={{ value: 23.5, trend: 'up' }}
              icon={<DollarSign className="w-5 h-5" />}
              variant="success"
              glassIntensity="strong"
              size="lg"
              chart={
                <svg viewBox="0 0 100 40" className="w-full h-full">
                  <polyline
                    points="0,35 20,30 40,20 60,25 80,10 100,15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              }
            />
            
            <KPICard
              title="Active Users"
              value="3,842"
              change={{ value: 8.2, trend: 'up' }}
              icon={<Users className="w-5 h-5" />}
              variant="primary"
              glassIntensity="medium"
              size="lg"
            />
            
            <KPICard
              title="Avg Order Value"
              value="$156"
              change={{ value: 2.4, trend: 'down' }}
              icon={<ShoppingCart className="w-5 h-5" />}
              variant="warning"
              glassIntensity="medium"
              size="lg"
            />
            
            <KPICard
              title="Response Time"
              value="142ms"
              change={{ value: 0, trend: 'neutral' }}
              icon={<Clock className="w-5 h-5" />}
              variant="default"
              glassIntensity="subtle"
              size="lg"
            />
          </div>
        </DashboardSection>

        {/* Metric Tiles */}
        <DashboardSection
          title="Business Metrics Grid"
          subtitle="Interactive metric tiles with hover effects"
          icon={<BarChart3 className="w-5 h-5" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricTile
              label="Total Sales"
              value={1842}
              trend={14.2}
              icon={<DollarSign className="w-4 h-4" />}
              format={v => `$${v.toLocaleString()}`}
              color="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
            />
            <MetricTile
              label="New Customers"
              value={142}
              trend={8.7}
              icon={<Users className="w-4 h-4" />}
              color="from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
            />
            <MetricTile
              label="Bounce Rate"
              value={32.4}
              trend={-5.2}
              format={v => `${v}%`}
              color="from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
            />
            <MetricTile
              label="Uptime"
              value={99.98}
              trend={0.02}
              format={v => `${v}%`}
              color="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            />
          </div>
        </DashboardSection>

        {/* Empty State Example */}
        <DashboardSection
          title="Empty Dashboard State"
          subtitle="Professional empty state with call-to-action"
          icon={<Activity className="w-5 h-5" />}
        >
          <DashboardEmptyState
            icon={<BarChart3 className="w-6 h-6" />}
            title="No data available yet"
            description="Start by connecting your data sources to see real-time analytics and insights"
            action={{
              label: "Connect Data Source",
              onClick: () => console.log('Connect clicked')
            }}
          />
        </DashboardSection>
      </div>
    </div>
  )
}