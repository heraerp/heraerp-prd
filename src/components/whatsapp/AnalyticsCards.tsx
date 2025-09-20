// ================================================================================
// ANALYTICS CARDS - WHATSAPP KEY METRICS
// Smart Code: HERA.UI.WHATSAPP.ANALYTICS_CARDS.v1
// Production-ready analytics cards with performance metrics
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Users,
  Send,
  Target,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface AnalyticsData {
  statusCounts: {
    queued: number
    sent: number
    delivered: number
    read: number
    failed: number
    total: number
  }
  templateStats: Array<{
    name: string
    sent: number
    delivered: number
    read: number
    failed: number
    total: number
  }>
  dailyVolume: Array<[string, number]>
  metrics: {
    deliveryRate: number
    readRate: number
    failureRate: number
    avgDaily: number
  }
}

interface AnalyticsCardsProps {
  data: AnalyticsData
  timeRange: '7d' | '30d' | '90d'
}

export function AnalyticsCards({ data, timeRange }: AnalyticsCardsProps) {
  const { statusCounts, templateStats, metrics } = data

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d':
        return 'Last 7 Days'
      case '30d':
        return 'Last 30 Days'
      case '90d':
        return 'Last 90 Days'
      default:
        return 'Period'
    }
  }

  const getPerformanceBadge = (rate: number, thresholds: { good: number; warning: number }) => {
    if (rate >= thresholds.good) {
      return (
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
          Excellent
        </Badge>
      )
    } else if (rate >= thresholds.warning) {
      return (
        <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
          Good
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
          Needs Attention
        </Badge>
      )
    }
  }

  const getTrendIcon = (value: number, isGoodHigh: boolean = true) => {
    if (value === 0) return null

    const threshold = isGoodHigh ? 80 : 20
    if ((isGoodHigh && value >= threshold) || (!isGoodHigh && value <= threshold)) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <MessageCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statusCounts.total.toLocaleString()}</div>
          <p className="text-xs text-gray-600 mt-1">{getTimeRangeLabel()}</p>
          <div className="mt-2">
            <div className="text-xs text-gray-500">Daily average: {metrics.avgDaily} messages</div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
          <div className="flex items-center gap-1">
            {getTrendIcon(metrics.deliveryRate, true)}
            <CheckCircle className="h-4 w-4 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.deliveryRate}%</div>
          <p className="text-xs text-gray-600 mt-1">
            {statusCounts.delivered + statusCounts.read} of {statusCounts.total} delivered
          </p>
          <div className="mt-2">
            {getPerformanceBadge(metrics.deliveryRate, { good: 90, warning: 70 })}
          </div>
        </CardContent>
      </Card>

      {/* Read Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
          <div className="flex items-center gap-1">
            {getTrendIcon(metrics.readRate, true)}
            <Target className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.readRate}%</div>
          <p className="text-xs text-gray-600 mt-1">
            {statusCounts.read} of {statusCounts.delivered} read
          </p>
          <div className="mt-2">
            {getPerformanceBadge(metrics.readRate, { good: 60, warning: 30 })}
          </div>
        </CardContent>
      </Card>

      {/* Failure Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
          <div className="flex items-center gap-1">
            {getTrendIcon(metrics.failureRate, false)}
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.failureRate}%</div>
          <p className="text-xs text-gray-600 mt-1">{statusCounts.failed} failed messages</p>
          <div className="mt-2">
            {metrics.failureRate <= 5 ? (
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                Good
              </Badge>
            ) : metrics.failureRate <= 15 ? (
              <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                Warning
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                High
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Templates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
          <Send className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{templateStats.length}</div>
          <p className="text-xs text-gray-600 mt-1">
            Templates used {getTimeRangeLabel().toLowerCase()}
          </p>
          {templateStats.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                Top: {templateStats[0]?.name} ({templateStats[0]?.total} msgs)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Status Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
          <Clock className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600">✓ Success</span>
              <span className="font-medium">{statusCounts.delivered + statusCounts.read}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-purple-600">⏳ Queued</span>
              <span className="font-medium">{statusCounts.queued}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-violet-600">→ Sent</span>
              <span className="font-medium">{statusCounts.sent}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-600">✗ Failed</span>
              <span className="font-medium">{statusCounts.failed}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statusCounts.total > 0
              ? Math.round(
                  metrics.deliveryRate * 0.6 +
                    metrics.readRate * 0.3 +
                    (100 - metrics.failureRate) * 0.1
                )
              : 0}
            %
          </div>
          <p className="text-xs text-gray-600 mt-1">Overall messaging effectiveness</p>
          <div className="mt-2">
            {statusCounts.total === 0 ? (
              <Badge variant="outline" className="text-gray-700 border-gray-300 bg-gray-50">
                No Data
              </Badge>
            ) : (
              getPerformanceBadge(
                Math.round(
                  metrics.deliveryRate * 0.6 +
                    metrics.readRate * 0.3 +
                    (100 - metrics.failureRate) * 0.1
                ),
                { good: 80, warning: 60 }
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          <Users className="h-4 w-4 text-cyan-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {statusCounts.total > 0 ? (
              <>
                <div className="flex justify-between">
                  <span>Messages per day</span>
                  <span className="font-medium">{metrics.avgDaily}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success rate</span>
                  <span className="font-medium">
                    {Math.round(
                      ((statusCounts.delivered + statusCounts.read) / statusCounts.total) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customer reach</span>
                  <span className="font-medium">
                    {new Set(data.templateStats.map(t => t.name)).size} templates
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center py-4">
                Start sending messages to see engagement metrics
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
