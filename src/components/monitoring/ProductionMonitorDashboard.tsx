/**
 * HERA Production Monitor Dashboard
 * Admin interface for viewing and managing production errors
 * Smart Code: HERA.MONITORING.DASHBOARD.v1
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  Bug, 
  Activity, 
  Download, 
  Trash2, 
  RefreshCw, 
  Mail,
  Settings,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { productionMonitor } from '@/lib/monitoring/production-monitor'
import { reportGenerator } from '@/lib/monitoring/report-generator'
import { emailReporter } from '@/lib/monitoring/email-reporter'
import type { ProductionError } from '@/lib/monitoring/production-monitor'

interface DashboardStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  lastHour: number
  affectedUsers: number
  errorTypes: Record<string, number>
}

interface SystemStatus {
  monitoring: {
    enabled: boolean
    initialized: boolean
    errorCount: number
  }
  logging: {
    enabled: boolean
    logCount: number
    stats: Record<string, number>
  }
  system: {
    environment: string
    timestamp: string
    uptime: string
  }
}

export const ProductionMonitorDashboard: React.FC = () => {
  const [errors, setErrors] = useState<ProductionError[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Load data on component mount
  useEffect(() => {
    loadData()
    loadSystemStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData()
      loadSystemStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadData = () => {
    try {
      const allErrors = productionMonitor.getBufferedErrors()
      setErrors(allErrors)
      
      // Calculate stats
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000
      
      const stats: DashboardStats = {
        total: allErrors.length,
        critical: allErrors.filter(e => e.error.severity === 'critical').length,
        high: allErrors.filter(e => e.error.severity === 'high').length,
        medium: allErrors.filter(e => e.error.severity === 'medium').length,
        low: allErrors.filter(e => e.error.severity === 'low').length,
        lastHour: allErrors.filter(e => new Date(e.timestamp).getTime() > oneHourAgo).length,
        affectedUsers: new Set(allErrors.map(e => e.user.session_id)).size,
        errorTypes: allErrors.reduce((acc, e) => {
          acc[e.error.type] = (acc[e.error.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
      
      setStats(stats)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load monitoring data')
      setIsLoading(false)
    }
  }

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/status')
      const data = await response.json()
      
      if (data.success) {
        setSystemStatus(data.status)
      }
    } catch (error) {
      console.error('Failed to load system status:', error)
    }
  }

  const handleGenerateReport = async (format: 'comprehensive' | 'summary' | 'technical') => {
    setIsGeneratingReport(true)
    
    try {
      const filteredErrors = getFilteredErrors()
      
      if (filteredErrors.length === 0) {
        toast.error('No errors match the current filters')
        return
      }

      const report = await reportGenerator.generateReport(filteredErrors, {
        includeUserContext: true,
        includePerformanceMetrics: format === 'comprehensive' || format === 'technical',
        includeLogs: format === 'comprehensive' || format === 'technical',
        includeNetworkRequests: format === 'comprehensive',
        format,
        maxLogEntries: format === 'comprehensive' ? 50 : 10
      })

      // Download report
      const blob = new Blob([report], { 
        type: format === 'technical' ? 'application/json' : 'text/html'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hera-${format}-report-${new Date().toISOString().split('T')[0]}.${format === 'technical' ? 'json' : 'html'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`${format} report downloaded successfully`)
      
    } catch (error) {
      console.error('Report generation failed:', error)
      toast.error('Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleClearErrors = async () => {
    if (!confirm('Are you sure you want to clear all error data? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/monitoring/report', { method: 'DELETE' })
      const data = await response.json()
      
      if (data.success) {
        loadData()
        toast.success('Error buffer cleared successfully')
      } else {
        toast.error('Failed to clear error buffer')
      }
    } catch (error) {
      console.error('Clear errors failed:', error)
      toast.error('Failed to clear error buffer')
    }
  }

  const handleSendDailySummary = async () => {
    try {
      await emailReporter.sendDailySummary(errors, 'admin-org-id') // Replace with actual org ID
      toast.success('Daily summary email sent successfully')
    } catch (error) {
      console.error('Send summary failed:', error)
      toast.error('Failed to send daily summary')
    }
  }

  const getFilteredErrors = () => {
    let filtered = [...errors]

    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(e => e.error.severity === selectedSeverity)
    }

    // Filter by time range
    const now = Date.now()
    let timeThreshold = 0
    
    switch (selectedTimeRange) {
      case '1h':
        timeThreshold = now - 60 * 60 * 1000
        break
      case '6h':
        timeThreshold = now - 6 * 60 * 60 * 1000
        break
      case '24h':
        timeThreshold = now - 24 * 60 * 60 * 1000
        break
      case '7d':
        timeThreshold = now - 7 * 24 * 60 * 60 * 1000
        break
    }

    if (timeThreshold > 0) {
      filtered = filtered.filter(e => new Date(e.timestamp).getTime() > timeThreshold)
    }

    return filtered
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="text-red-500" size={20} />
      case 'high':
        return <AlertTriangle className="text-orange-500" size={20} />
      case 'medium':
        return <AlertCircle className="text-yellow-500" size={20} />
      case 'low':
        return <CheckCircle className="text-green-500" size={20} />
      default:
        return <AlertCircle className="text-gray-500" size={20} />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin mr-2" size={24} />
        <span>Loading monitoring dashboard...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="mr-3 text-blue-600" size={32} />
            Production Monitor Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage production errors in real-time
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          
          <button
            onClick={handleSendDailySummary}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Mail size={16} className="mr-2" />
            Send Summary
          </button>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monitoring Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus.monitoring.enabled ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Activity className={`${systemStatus.monitoring.enabled ? 'text-green-500' : 'text-red-500'}`} size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Environment</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {systemStatus.system.environment}
                </p>
              </div>
              <Settings className="text-gray-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus.system.uptime}
                </p>
              </div>
              <Clock className="text-gray-500" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Bug className="text-gray-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
              </div>
              <AlertTriangle className="text-orange-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Hour</p>
                <p className="text-2xl font-bold text-blue-600">{stats.lastHour}</p>
              </div>
              <TrendingUp className="text-blue-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Affected Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.affectedUsers}</p>
              </div>
              <Users className="text-purple-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Types</p>
                <p className="text-2xl font-bold text-indigo-600">{Object.keys(stats.errorTypes).length}</p>
              </div>
              <Activity className="text-indigo-500" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleGenerateReport('summary')}
              disabled={isGeneratingReport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download size={16} className="mr-2" />
              Summary Report
            </button>

            <button
              onClick={() => handleGenerateReport('comprehensive')}
              disabled={isGeneratingReport}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Download size={16} className="mr-2" />
              Full Report
            </button>

            <button
              onClick={handleClearErrors}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={16} className="mr-2" />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Errors</h2>
          <p className="text-gray-600 text-sm">
            Showing {getFilteredErrors().length} of {errors.length} total errors
          </p>
        </div>

        <div className="divide-y">
          {getFilteredErrors().length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No errors found</p>
              <p>Great! No errors match your current filters.</p>
            </div>
          ) : (
            getFilteredErrors().slice(0, 50).map((error) => (
              <div key={error.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      {getSeverityIcon(error.error.severity)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(error.error.severity)}`}>
                        {error.error.severity}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {error.error.type}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {error.error.message}
                    </h3>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{new Date(error.timestamp).toLocaleString()}</span>
                      <span>User: {error.user.role}</span>
                      <span>Org: {error.user.organization_id.substring(0, 8)}...</span>
                      <span className="truncate max-w-xs">URL: {error.context.url}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const report = JSON.stringify(error, null, 2)
                        const blob = new Blob([report], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `error-${error.id}.json`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductionMonitorDashboard