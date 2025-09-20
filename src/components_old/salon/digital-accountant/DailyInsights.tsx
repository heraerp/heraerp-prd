'use client'
/**
 * Daily Insights Component
 * Smart Code: HERA.SALON.DIGITAL.ACCOUNTANT.INSIGHTS.V1
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Users,
  Sparkles,
  Award,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Insight {
  id: string
  type: 'success' | 'warning' | 'info' | 'tip'
  title: string
  description: string
  metric?: {
    value: number
    target?: number
    unit?: string
    trend?: 'up' | 'down' | 'stable'
  }
  action?: {
    label: string
    onClick: () => void
  }
}

interface DailyInsightsProps {
  insights?: Insight[]
  dailyTarget?: number
  currentRevenue?: number
  yesterdayRevenue?: number
}

// Mock insights for demo
const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'success',
    title: 'Great Start!',
    description: "You've already reached 65% of your daily target by 2 PM",
    metric: {
      value: 65,
      target: 100,
      unit: '%',
      trend: 'up'
    }
  },
  {
    id: '2',
    type: 'info',
    title: 'Popular Service Today',
    description: 'Hair coloring is trending - 8 clients so far',
    metric: {
      value: 8,
      trend: 'up'
    }
  },
  {
    id: '3',
    type: 'warning',
    title: 'Inventory Alert',
    description: 'Hair color stock running low - only 3 tubes left',
    action: {
      label: 'Order Now',
      onClick: () => console.log('Order supplies')
    }
  },
  {
    id: '4',
    type: 'tip',
    title: 'Commission Due',
    description: "Don't forget to process staff commissions today",
    metric: {
      value: 2400,
      unit: 'AED'
    },
    action: {
      label: 'Process Now',
      onClick: () => console.log('Process commission')
    }
  }
]

export function DailyInsights({
  insights = mockInsights,
  dailyTarget = 6000,
  currentRevenue = 3850,
  yesterdayRevenue = 3200
}: DailyInsightsProps) {
  const progressPercentage = (currentRevenue / dailyTarget) * 100
  const revenueChange = ((currentRevenue - yesterdayRevenue) / yesterdayRevenue) * 100

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case 'info':
        return <Info className="w-5 h-5 text-primary" />
      case 'tip':
        return <Sparkles className="w-5 h-5 text-purple-600" />
    }
  }

  const getInsightBgColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'tip':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Daily Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Daily Progress
            </span>
            <Badge variant="secondary" className="gap-1">
              <DollarSign className="w-3 h-3" />
              Target: {dailyTarget.toLocaleString()} AED
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">AED {currentRevenue.toLocaleString()}</span>
                <span
                  className={cn(
                    'text-sm font-medium flex items-center gap-1',
                    revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {revenueChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(revenueChange).toFixed(1)}% vs yesterday
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                {progressPercentage.toFixed(0)}% of daily target achieved
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Clients</p>
                <p className="text-lg font-semibold">12</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Avg Ticket</p>
                <p className="text-lg font-semibold">321</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Services</p>
                <p className="text-lg font-semibold">18</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map(insight => (
          <Alert key={insight.id} className={cn('border', getInsightBgColor(insight.type))}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  {insight.title}
                  {insight.metric && insight.metric.trend && (
                    <span
                      className={cn(
                        'text-xs',
                        insight.metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {insight.metric.trend === 'up' ? '↑' : '↓'}
                    </span>
                  )}
                </h4>
                <AlertDescription className="text-sm">{insight.description}</AlertDescription>
                {insight.metric && (
                  <div className="flex items-center gap-2 mt-2">
                    {insight.metric.target && (
                      <Progress
                        value={(insight.metric.value / insight.metric.target) * 100}
                        className="w-20 h-2"
                      />
                    )}
                    <span className="text-lg font-semibold">
                      {insight.metric.value}
                      {insight.metric.unit && ` ${insight.metric.unit}`}
                    </span>
                  </div>
                )}
                {insight.action && (
                  <button
                    onClick={insight.action.onClick}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 mt-2"
                  >
                    {insight.action.label} →
                  </button>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>

      {/* Achievement Badge */}
      {progressPercentage >= 100 && (
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8" />
                <div>
                  <p className="font-semibold">Target Achieved! 🎉</p>
                  <p className="text-sm opacity-90">Great job today!</p>
                </div>
              </div>
              <Zap className="w-12 h-12 opacity-20" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
