/**
 * ================================================================================
 * HERA CENTRAL: Overview Dashboard
 * Smart Code: HERA.PLATFORM.CENTRAL.UI.OVERVIEW.DASHBOARD.v1
 * ================================================================================
 * 
 * Platform administration dashboard providing:
 * - Real-time platform health monitoring
 * - Organization and application metrics
 * - Recent activity and alerts
 * - Quick actions for common tasks
 * - AI agent usage and performance
 * - Policy compliance status
 * 
 * Enterprise-grade interface with real-time updates
 * ================================================================================
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Package, 
  Shield, 
  Brain, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Database,
  Zap,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw
} from 'lucide-react'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface PlatformMetric {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  color: string
  icon: React.ComponentType<{ className?: string }>
}

interface RecentActivity {
  id: string
  type: 'org_created' | 'app_installed' | 'policy_applied' | 'alert_triggered'
  title: string
  description: string
  timestamp: string
  severity?: 'low' | 'medium' | 'high'
}

interface HealthCheck {
  service: string
  status: 'healthy' | 'warning' | 'critical'
  uptime: string
  response_time: number
  last_check: string
}

// =============================================================================
// MOCK DATA (In production, these would come from APIs)
// =============================================================================

const PLATFORM_METRICS: PlatformMetric[] = [
  {
    label: 'Active Organizations',
    value: 47,
    change: 12,
    trend: 'up',
    color: 'blue',
    icon: Building2
  },
  {
    label: 'Installed Applications',
    value: 156,
    change: 8,
    trend: 'up',
    color: 'purple',
    icon: Package
  },
  {
    label: 'Policy Compliance',
    value: '98.5%',
    change: 1.2,
    trend: 'up',
    color: 'green',
    icon: Shield
  },
  {
    label: 'AI Agent Sessions',
    value: '12.4K',
    change: -5.3,
    trend: 'down',
    color: 'orange',
    icon: Brain
  },
  {
    label: 'Platform Revenue',
    value: '$47.2K',
    change: 15.8,
    trend: 'up',
    color: 'emerald',
    icon: DollarSign
  },
  {
    label: 'Avg Response Time',
    value: '245ms',
    change: -12.5,
    trend: 'up',
    color: 'indigo',
    icon: Zap
  }
]

const RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: '1',
    type: 'org_created',
    title: 'New Organization Created',
    description: 'Matrix IT World - Retail GCC Professional Package',
    timestamp: '2 minutes ago'
  },
  {
    id: '2',
    type: 'policy_applied',
    title: 'Policy Bundle Applied',
    description: 'GDPR Compliance Policy applied to 3 EU organizations',
    timestamp: '15 minutes ago'
  },
  {
    id: '3',
    type: 'app_installed',
    title: 'Application Installed',
    description: 'Salon Pro app installed for Luxe Beauty Salon',
    timestamp: '1 hour ago'
  },
  {
    id: '4',
    type: 'alert_triggered',
    title: 'Performance Alert',
    description: 'High response time detected in EU region',
    timestamp: '2 hours ago',
    severity: 'medium'
  }
]

const HEALTH_CHECKS: HealthCheck[] = [
  {
    service: 'Platform API',
    status: 'healthy',
    uptime: '99.98%',
    response_time: 145,
    last_check: '30 seconds ago'
  },
  {
    service: 'Database Cluster',
    status: 'healthy',
    uptime: '99.95%',
    response_time: 89,
    last_check: '1 minute ago'
  },
  {
    service: 'AI Agent Engine',
    status: 'warning',
    uptime: '98.12%',
    response_time: 320,
    last_check: '2 minutes ago'
  },
  {
    service: 'Policy Engine',
    status: 'healthy',
    uptime: '99.89%',
    response_time: 67,
    last_check: '45 seconds ago'
  }
]

// =============================================================================
// COMPONENT FUNCTIONS
// =============================================================================

function MetricCard({ metric }: { metric: PlatformMetric }) {
  const Icon = metric.icon
  const isPositiveChange = metric.trend === 'up'
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{metric.label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
          {metric.change && (
            <div className={`flex items-center mt-2 text-sm ${
              isPositiveChange ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveChange ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              <span>{Math.abs(metric.change)}%</span>
              <span className="text-slate-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          bg-${metric.color}-100
        `}>
          <Icon className={`w-6 h-6 text-${metric.color}-600`} />
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'org_created': return Building2
      case 'app_installed': return Package
      case 'policy_applied': return Shield
      case 'alert_triggered': return AlertTriangle
      default: return Activity
    }
  }
  
  const Icon = getActivityIcon(activity.type)
  const isAlert = activity.type === 'alert_triggered'
  
  return (
    <div className="flex items-start space-x-3 py-3">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isAlert ? 'bg-red-100' : 'bg-blue-100'}
      `}>
        <Icon className={`w-4 h-4 ${isAlert ? 'text-red-600' : 'text-blue-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
        <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
        <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
      </div>
    </div>
  )
}

function HealthStatus({ check }: { check: HealthCheck }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green'
      case 'warning': return 'yellow'
      case 'critical': return 'red'
      default: return 'gray'
    }
  }
  
  const statusColor = getStatusColor(check.status)
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full bg-${statusColor}-500`}></div>
        <div>
          <p className="text-sm font-medium text-slate-900">{check.service}</p>
          <p className="text-xs text-slate-500">{check.last_check}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-slate-900">{check.uptime}</p>
        <p className="text-xs text-slate-500">{check.response_time}ms</p>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OverviewPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  
  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastRefresh(new Date())
    setRefreshing(false)
  }
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-slate-600 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Organization
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {PLATFORM_METRICS.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">System Health</h3>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            {HEALTH_CHECKS.map((check, index) => (
              <HealthStatus key={index} check={check} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View detailed health report →
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            {RECENT_ACTIVITIES.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View activity log →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <Zap className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Create Organization</p>
                  <p className="text-xs text-blue-700">Set up new tenant with templates</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors duration-200">
              <div className="flex items-center">
                <Package className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Deploy Application</p>
                  <p className="text-xs text-purple-700">Install app from marketplace</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-900">Apply Policy</p>
                  <p className="text-xs text-green-700">Update platform policies</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors duration-200">
              <div className="flex items-center">
                <Brain className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Configure AI Agent</p>
                  <p className="text-xs text-orange-700">Set up automation agents</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Statistics */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Platform Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Users</span>
              <span className="text-sm font-medium text-slate-900">2,847</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Active Sessions</span>
              <span className="text-sm font-medium text-slate-900">423</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Storage Used</span>
              <span className="text-sm font-medium text-slate-900">847.2 GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">API Calls (24h)</span>
              <span className="text-sm font-medium text-slate-900">1.2M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Revenue (MTD)</span>
              <span className="text-sm font-medium text-slate-900">$47,239</span>
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-900">Critical</span>
              </div>
              <p className="text-xs text-red-700 mt-1">0 active critical alerts</p>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-900">Warning</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">2 warnings require attention</p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Information</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">5 informational messages</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Manage all alerts →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}