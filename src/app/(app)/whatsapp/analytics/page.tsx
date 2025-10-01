// ================================================================================
// WHATSAPP ANALYTICS PAGE - MESSAGE ANALYTICS & INSIGHTS
// Smart Code: HERA.UI.WHATSAPP.ANALYTICS.V1
// Production-ready analytics dashboard with insights and performance tracking
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Send,
  Target,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { AnalyticsCards } from '@/components/whatsapp/AnalyticsCards'

export default function WhatsAppAnalyticsPage() {
  const { currentOrganization } = useOrganization()
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '90d'>('30d')

  const { messages, isMessagesLoading, messagesError, templates, config, refetch } = useWhatsappApi(
    currentOrganization?.id || ''
  )

  // Calculate analytics data
  const analyticsData = React.useMemo(() => {
    const now = new Date()
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    const recentMessages = messages.filter(msg => new Date(msg.created_at!) >= cutoffDate)

    // Status distribution
    const statusCounts = {
      queued: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      total: recentMessages.length
    }

    recentMessages.forEach(message => {
      const status = message.status
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++
      }
    })

    // Template performance
    const templateStats = new Map()
    recentMessages.forEach(message => {
      if (!message.template_name) return

      if (!templateStats.has(message.template_name)) {
        templateStats.set(message.template_name, {
          name: message.template_name,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          total: 0
        })
      }

      const stats = templateStats.get(message.template_name)
      stats.total++

      if (message.status === 'sent') stats.sent++
      if (message.status === 'delivered') stats.delivered++
      if (message.status === 'read') stats.read++
      if (message.status === 'failed') stats.failed++
    })

    // Daily message volume
    const dailyVolume = new Map()
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      dailyVolume.set(dateKey, 0)
    }

    recentMessages.forEach(message => {
      const dateKey = message.created_at?.split('T')[0]
      if (dateKey && dailyVolume.has(dateKey)) {
        dailyVolume.set(dateKey, dailyVolume.get(dateKey) + 1)
      }
    })

    // Performance metrics
    const deliveryRate =
      statusCounts.total > 0
        ? ((statusCounts.delivered + statusCounts.read) / statusCounts.total) * 100
        : 0

    const readRate =
      statusCounts.delivered > 0 ? (statusCounts.read / statusCounts.delivered) * 100 : 0

    const failureRate =
      statusCounts.total > 0 ? (statusCounts.failed / statusCounts.total) * 100 : 0

    return {
      statusCounts,
      templateStats: Array.from(templateStats.values()).sort((a, b) => b.total - a.total),
      dailyVolume: Array.from(dailyVolume.entries()).reverse(),
      metrics: {
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        readRate: Math.round(readRate * 10) / 10,
        failureRate: Math.round(failureRate * 10) / 10,
        avgDaily: Math.round((statusCounts.total / daysBack) * 10) / 10
      }
    }
  }, [messages, timeRange])

  const handleExportAnalytics = () => {
    // TODO: Implement analytics export
    console.log('Export analytics data:', analyticsData)
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to view WhatsApp analytics.
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
            <BarChart3 className="h-7 w-7 text-green-600" />
            WhatsApp Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Message performance and insights for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">
              {currentOrganization.name}
            </Badge>
            <Badge variant="outline">{analyticsData.statusCounts.total} messages</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <Select
            value={timeRange}
            onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch.messages()} disabled={isMessagesLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isMessagesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={handleExportAnalytics}
            disabled={analyticsData.statusCounts.total === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* WhatsApp Not Configured Warning */}
      {!config?.enabled && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WhatsApp integration is not enabled.
            <Button variant="link" className="px-2 h-auto font-normal underline">
              Configure WhatsApp settings
            </Button>
            to view analytics.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isMessagesLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-green-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">Loading analytics data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {messagesError && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load analytics data: {messagesError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Content */}
      {!isMessagesLoading && !messagesError && (
        <>
          {/* Key Metrics Cards */}
          <AnalyticsCards data={analyticsData} timeRange={timeRange} />

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Message Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.statusCounts.queued}
                  </div>
                  <div className="text-sm text-gray-600">Queued</div>
                  <div className="w-full bg-purple-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width:
                          analyticsData.statusCounts.total > 0
                            ? `${(analyticsData.statusCounts.queued / analyticsData.statusCounts.total) * 100}%`
                            : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-violet-600">
                    {analyticsData.statusCounts.sent}
                  </div>
                  <div className="text-sm text-gray-600">Sent</div>
                  <div className="w-full bg-violet-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full"
                      style={{
                        width:
                          analyticsData.statusCounts.total > 0
                            ? `${(analyticsData.statusCounts.sent / analyticsData.statusCounts.total) * 100}%`
                            : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.statusCounts.delivered}
                  </div>
                  <div className="text-sm text-gray-600">Delivered</div>
                  <div className="w-full bg-green-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width:
                          analyticsData.statusCounts.total > 0
                            ? `${(analyticsData.statusCounts.delivered / analyticsData.statusCounts.total) * 100}%`
                            : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.statusCounts.read}
                  </div>
                  <div className="text-sm text-gray-600">Read</div>
                  <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width:
                          analyticsData.statusCounts.total > 0
                            ? `${(analyticsData.statusCounts.read / analyticsData.statusCounts.total) * 100}%`
                            : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analyticsData.statusCounts.failed}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                  <div className="w-full bg-red-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width:
                          analyticsData.statusCounts.total > 0
                            ? `${(analyticsData.statusCounts.failed / analyticsData.statusCounts.total) * 100}%`
                            : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Performance */}
          {analyticsData.templateStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Template Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.templateStats.slice(0, 5).map(template => {
                    const deliveryRate =
                      template.total > 0
                        ? ((template.delivered + template.read) / template.total) * 100
                        : 0
                    const readRate =
                      template.delivered > 0 ? (template.read / template.delivered) * 100 : 0

                    return (
                      <div key={template.name} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{template.name}</div>
                          <Badge variant="outline">{template.total} messages</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Delivery Rate</div>
                            <div className="font-semibold flex items-center gap-1">
                              {Math.round(deliveryRate)}%
                              {deliveryRate >= 90 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : deliveryRate < 70 ? (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              ) : null}
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-600">Read Rate</div>
                            <div className="font-semibold">{Math.round(readRate)}%</div>
                          </div>

                          <div>
                            <div className="text-gray-600">Failed</div>
                            <div className="font-semibold text-red-600">{template.failed}</div>
                          </div>

                          <div>
                            <div className="text-gray-600">Success Score</div>
                            <div className="font-semibold">
                              {template.total > 0
                                ? Math.round(
                                    ((template.read + template.delivered) / template.total) * 100
                                  )
                                : 0}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Message Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.dailyVolume.length > 0 ? (
                <div className="space-y-2">
                  {analyticsData.dailyVolume.slice(-7).map(([date, count]) => {
                    const maxCount = Math.max(
                      ...analyticsData.dailyVolume.map(([, c]) => c as number)
                    )
                    const width = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0

                    return (
                      <div key={date} className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 w-24">
                          {new Date(date).toLocaleDateString('en-AE', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                          <div
                            className="bg-green-500 h-6 rounded-full transition-all duration-300"
                            style={{ width: `${width}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700">
                            {count} messages
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No message data available for the selected time range.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Dynamic insights based on data */}
                {analyticsData.metrics.deliveryRate > 95 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        Excellent Delivery Performance
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Your {analyticsData.metrics.deliveryRate}% delivery rate is outstanding.
                        Keep using the same message patterns.
                      </div>
                    </div>
                  </div>
                )}

                {analyticsData.metrics.failureRate > 10 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-800 dark:text-red-200">
                        High Failure Rate Detected
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {analyticsData.metrics.failureRate}% of messages are failing. Check your
                        templates and phone number formats.
                      </div>
                    </div>
                  </div>
                )}

                {analyticsData.metrics.readRate < 30 &&
                  analyticsData.statusCounts.delivered > 5 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800 dark:text-yellow-200">
                          Low Read Rate
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                          Only {analyticsData.metrics.readRate}% of delivered messages are being
                          read. Consider improving message content.
                        </div>
                      </div>
                    </div>
                  )}

                {analyticsData.statusCounts.total === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        Ready to Start Messaging
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        No messages sent in the last{' '}
                        {timeRange === '7d'
                          ? '7 days'
                          : timeRange === '30d'
                            ? '30 days'
                            : '90 days'}
                        . Create templates and start engaging with your customers.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
