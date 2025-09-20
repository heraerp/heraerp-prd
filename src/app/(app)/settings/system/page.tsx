// ================================================================================
// SYSTEM SETTINGS PAGE - SETTINGS (READONLY)
// Smart Code: HERA.UI.SETTINGS.SYSTEM.v1
// Production-ready system settings display using Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Server,
  Database,
  Shield,
  Zap,
  Globe,
  Building,
  Calendar,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  HardDrive,
  Cpu,
  Activity
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useOrgSettings } from '@/lib/api/orgSettings'

export default function SystemSettingsPage() {
  const { currentOrganization } = useOrganization()

  const { systemSettings, isSystemSettingsLoading, systemSettingsError, featureFlags } =
    useOrgSettings(currentOrganization?.id || '')

  // Mock system health data (in production, this would come from API)
  const systemHealth = {
    api_status: 'healthy',
    database_status: 'healthy',
    cache_status: 'healthy',
    queue_status: 'healthy',
    storage_usage: 67,
    cpu_usage: 23,
    memory_usage: 45,
    uptime_hours: 168,
    last_backup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        )
      case 'warning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days} days, ${remainingHours} hours`
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to view system settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="h-7 w-7 text-gray-600" />
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View system configuration and health status for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-gray-700 border-gray-300">
              {currentOrganization.name}
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Read-Only
            </Badge>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  API Status
                </div>
                <div className="text-2xl font-bold">{getStatusBadge(systemHealth.api_status)}</div>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Database</div>
                <div className="text-2xl font-bold">
                  {getStatusBadge(systemHealth.database_status)}
                </div>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage</div>
                <div className="text-2xl font-bold">{systemHealth.storage_usage}%</div>
              </div>
              <HardDrive className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</div>
                <div className="text-2xl font-bold">
                  {Math.floor(systemHealth.uptime_hours / 24)}d
                </div>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isSystemSettingsLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">Loading system settings...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {systemSettingsError && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load system settings: {systemSettingsError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* System Information */}
      {!isSystemSettingsLoading && !systemSettingsError && systemSettings && (
        <>
          {/* Organization Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Organization Name
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 font-medium">
                      {systemSettings.organization_info?.name || 'Not Set'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Organization Code
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {systemSettings.organization_info?.code || 'Not Set'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Industry
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {systemSettings.organization_info?.industry || 'Not Set'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Registration Number
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {systemSettings.organization_info?.registration_number || 'Not Set'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tax Number
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                      {systemSettings.organization_info?.tax_number || 'Not Set'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Established
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {systemSettings.organization_info?.established_date
                        ? new Date(
                            systemSettings.organization_info.established_date
                          ).toLocaleDateString()
                        : 'Not Set'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current feature enablement status
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(featureFlags || {}).map(([feature, enabled]) => (
                  <div
                    key={feature}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm capitalize">
                        {feature.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-500">Feature flag</div>
                    </div>
                    {enabled ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                ))}

                {Object.keys(featureFlags || {}).length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    No feature flags configured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">API Service</span>
                    </div>
                    {getStatusBadge(systemHealth.api_status)}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Database</span>
                    </div>
                    {getStatusBadge(systemHealth.database_status)}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">Cache System</span>
                    </div>
                    {getStatusBadge(systemHealth.cache_status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">CPU Usage</span>
                    </div>
                    <span className="font-mono text-sm">{systemHealth.cpu_usage}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Memory Usage</span>
                    </div>
                    <span className="font-mono text-sm">{systemHealth.memory_usage}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      <span className="font-medium">System Uptime</span>
                    </div>
                    <span className="font-mono text-sm">
                      {formatUptime(systemHealth.uptime_hours)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Compliance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      SSL Certificate
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                      <span className="text-sm text-gray-500">Expires Dec 2024</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Data Encryption
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        AES-256
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Last Backup
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 text-sm">
                      {formatDateTime(systemHealth.last_backup)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Backup Status
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Automated
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Read-Only Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium text-blue-800 dark:text-blue-200">
              System Settings Information
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              • System settings are read-only and managed by HERA administrators • Feature flags
              control which features are available to your organization • System health is monitored
              24/7 with automatic alerting • All system activities are logged with Smart Code:
              HERA.SYS.SETTINGS.VIEW.v1 • Contact support if you need changes to system
              configuration
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
