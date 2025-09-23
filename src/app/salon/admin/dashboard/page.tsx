'use client'

import React, { useState } from 'react'
import { useSalonContext } from '../../SalonProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  Users,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Server,
  HardDrive,
  Cpu,
  Wifi,
  Lock,
  Key,
  FileText,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Package,
  Globe,
  Bell
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import Link from 'next/link'

export default function AdminDashboard() {
  const { organizationId, role, user, isLoading, isAuthenticated } = useSalonContext()
  const [activeTab, setActiveTab] = useState('overview')

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Mock system data
  const systemStats = {
    totalUsers: 24,
    activeUsers: 18,
    totalOrganizations: 3,
    systemUptime: '99.9%',
    lastBackup: '2 hours ago',
    dbSize: '2.3 GB',
    apiCalls: '12,543',
    errorRate: '0.02%'
  }

  const systemHealth = {
    database: { status: 'healthy', latency: '12ms', connections: 45 },
    api: { status: 'healthy', uptime: '99.9%', avgResponse: '125ms' },
    storage: { status: 'healthy', used: '2.3GB', total: '10GB', percent: 23 },
    memory: { status: 'healthy', used: '3.2GB', total: '8GB', percent: 40 }
  }

  const recentActivities = [
    {
      id: 1,
      type: 'user_login',
      user: 'receptionist@hairtalkz.ae',
      time: '5 mins ago',
      status: 'success'
    },
    { id: 2, type: 'backup', user: 'System', time: '2 hours ago', status: 'success' },
    {
      id: 3,
      type: 'user_created',
      user: 'admin@hairtalkz.ae',
      time: '3 hours ago',
      status: 'success'
    },
    {
      id: 4,
      type: 'permission_change',
      user: 'owner@hairtalkz.ae',
      time: '5 hours ago',
      status: 'warning'
    },
    {
      id: 5,
      type: 'api_key_generated',
      user: 'admin@hairtalkz.ae',
      time: '1 day ago',
      status: 'success'
    }
  ]

  const securityAlerts = [
    { id: 1, level: 'info', message: 'Scheduled security scan completed', time: '1 hour ago' },
    {
      id: 2,
      level: 'warning',
      message: '3 failed login attempts from IP 192.168.1.100',
      time: '3 hours ago'
    },
    { id: 3, level: 'success', message: 'SSL certificate renewed successfully', time: '2 days ago' }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light mb-2" style={{ color: LUXE_COLORS.gold }}>
                System Administration
              </h1>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                Welcome back, {user?.user_metadata?.full_name || 'Administrator'} • System Overview
                & Management
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" style={{ borderColor: LUXE_COLORS.bronze }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}
              >
                <Download className="h-4 w-4 mr-2" />
                System Report
              </Button>
            </div>
          </div>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Total Users
                  </p>
                  <p className="text-3xl font-light mt-1" style={{ color: LUXE_COLORS.gold }}>
                    {systemStats.totalUsers}
                  </p>
                  <p className="text-xs mt-2" style={{ color: LUXE_COLORS.emerald }}>
                    {systemStats.activeUsers} active now
                  </p>
                </div>
                <Users className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.gold }} />
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    System Uptime
                  </p>
                  <p className="text-3xl font-light mt-1" style={{ color: LUXE_COLORS.emerald }}>
                    {systemStats.systemUptime}
                  </p>
                  <p
                    className="text-xs mt-2 flex items-center gap-1"
                    style={{ color: LUXE_COLORS.emerald }}
                  >
                    <CheckCircle className="h-3 w-3" />
                    All systems operational
                  </p>
                </div>
                <Activity className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.emerald }} />
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    API Requests
                  </p>
                  <p className="text-3xl font-light mt-1" style={{ color: LUXE_COLORS.champagne }}>
                    {systemStats.apiCalls}
                  </p>
                  <p className="text-xs mt-2" style={{ color: LUXE_COLORS.bronze }}>
                    Today • {systemStats.errorRate} errors
                  </p>
                </div>
                <Zap className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.champagne }} />
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Last Backup
                  </p>
                  <p className="text-2xl font-light mt-1" style={{ color: LUXE_COLORS.plum }}>
                    {systemStats.lastBackup}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    style={{
                      borderColor: LUXE_COLORS.plum,
                      color: LUXE_COLORS.plum,
                      height: '24px',
                      fontSize: '11px'
                    }}
                  >
                    Backup Now
                  </Button>
                </div>
                <Package className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.plum }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/salon/settings#users" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.gold}20`,
                    border: `1px solid ${LUXE_COLORS.gold}40`
                  }}
                >
                  <Users className="h-6 w-6" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  User Management
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Add, edit, remove users
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/salon/settings#security" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.emerald}20`,
                    border: `1px solid ${LUXE_COLORS.emerald}40`
                  }}
                >
                  <Shield className="h-6 w-6" style={{ color: LUXE_COLORS.emerald }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  Security Settings
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Passwords & permissions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/salon/backup" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.plum}20`,
                    border: `1px solid ${LUXE_COLORS.plum}40`
                  }}
                >
                  <Database className="h-6 w-6" style={{ color: LUXE_COLORS.plum }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  Database Backup
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Backup & restore data
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/salon/settings#integrations" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.ruby}20`,
                    border: `1px solid ${LUXE_COLORS.ruby}40`
                  }}
                >
                  <Key className="h-6 w-6" style={{ color: LUXE_COLORS.ruby }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  API Management
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Keys & integrations
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: LUXE_COLORS.gold }}>System Health</CardTitle>
              <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                Real-time system monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Database Status */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                    <span style={{ color: LUXE_COLORS.champagne }}>Database</span>
                  </div>
                  <span
                    className="text-sm flex items-center gap-2"
                    style={{ color: LUXE_COLORS.emerald }}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Healthy • {systemHealth.database.latency}
                  </span>
                </div>
                <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  {systemHealth.database.connections} active connections
                </div>
              </div>

              {/* API Status */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                    <span style={{ color: LUXE_COLORS.champagne }}>API Server</span>
                  </div>
                  <span
                    className="text-sm flex items-center gap-2"
                    style={{ color: LUXE_COLORS.emerald }}
                  >
                    <CheckCircle className="h-3 w-3" />
                    {systemHealth.api.uptime} uptime
                  </span>
                </div>
                <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  Avg response: {systemHealth.api.avgResponse}
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                    <span style={{ color: LUXE_COLORS.champagne }}>Storage</span>
                  </div>
                  <span className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                    {systemHealth.storage.used} / {systemHealth.storage.total}
                  </span>
                </div>
                <Progress
                  value={systemHealth.storage.percent}
                  className="h-2"
                  style={{ backgroundColor: LUXE_COLORS.charcoal }}
                />
              </div>

              {/* Memory */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" style={{ color: LUXE_COLORS.bronze }} />
                    <span style={{ color: LUXE_COLORS.champagne }}>Memory</span>
                  </div>
                  <span className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                    {systemHealth.memory.used} / {systemHealth.memory.total}
                  </span>
                </div>
                <Progress
                  value={systemHealth.memory.percent}
                  className="h-2"
                  style={{ backgroundColor: LUXE_COLORS.charcoal }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security & Activity */}
          <div className="space-y-6">
            {/* Security Alerts */}
            <Card
              className="border-0"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={{ color: LUXE_COLORS.gold }}>Security Alerts</CardTitle>
                    <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                      Recent security events
                    </CardDescription>
                  </div>
                  <Link href="/salon/logs">
                    <Button variant="outline" size="sm" style={{ borderColor: LUXE_COLORS.bronze }}>
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {securityAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: LUXE_COLORS.charcoal }}
                  >
                    {alert.level === 'success' && (
                      <CheckCircle
                        className="h-4 w-4 mt-0.5"
                        style={{ color: LUXE_COLORS.emerald }}
                      />
                    )}
                    {alert.level === 'warning' && (
                      <AlertTriangle
                        className="h-4 w-4 mt-0.5"
                        style={{ color: LUXE_COLORS.orange }}
                      />
                    )}
                    {alert.level === 'info' && (
                      <Bell className="h-4 w-4 mt-0.5" style={{ color: LUXE_COLORS.plum }} />
                    )}
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                        {alert.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                        {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card
              className="border-0"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={{ color: LUXE_COLORS.gold }}>Recent Activity</CardTitle>
                    <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                      System activity log
                    </CardDescription>
                  </div>
                  <Link href="/salon/logs">
                    <Button variant="outline" size="sm" style={{ borderColor: LUXE_COLORS.bronze }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Logs
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: LUXE_COLORS.charcoal }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            activity.status === 'success'
                              ? LUXE_COLORS.emerald
                              : activity.status === 'warning'
                                ? LUXE_COLORS.orange
                                : LUXE_COLORS.ruby
                        }}
                      />
                      <div>
                        <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                          {activity.type.replace(/_/g, ' ').charAt(0).toUpperCase() +
                            activity.type.replace(/_/g, ' ').slice(1)}
                        </p>
                        <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
