'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  ChevronRight,
  Brain,
  Zap,
  Shield
} from 'lucide-react'
import { AIInsight } from '@/lib/pwm/types'
import { cn } from '@/lib/utils'

interface AIInsightsFeedProps {
  insights: AIInsight[]
  onActionClick?: (insight: AIInsight, actionId: string) => void
  isLoading?: boolean
}

export function AIInsightsFeed({
  insights,
  onActionClick,
  isLoading = false
}: AIInsightsFeedProps) {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-5 w-5" />
      case 'risk':
        return <AlertTriangle className="h-5 w-5" />
      case 'recommendation':
        return <Lightbulb className="h-5 w-5" />
      case 'prediction':
        return <Target className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'risk':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'recommendation':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'prediction':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    }
  }

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const formatImpact = (impact: number) => {
    const absImpact = Math.abs(impact)
    const isPositive = impact >= 0
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(absImpact)

    return `${isPositive ? '+' : '-'}${formatted}`
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-muted rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
          <Brain className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Intelligence</h3>
          <p className="text-sm text-muted-foreground">Powered by advanced pattern recognition</p>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map(insight => (
          <div
            key={insight.id}
            className={cn(
              'p-4 rounded-xl border transition-all duration-200 hover:shadow-lg',
              'bg-muted/30 border-border/50 hover:border-input'
            )}
          >
            {/* Insight Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg border', getInsightColor(insight.type))}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn('ml-3', getPriorityColor(insight.priority))}>
                {insight.priority}
              </Badge>
            </div>

            {/* Metrics Row */}
            <div className="flex items-center gap-6 mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Impact:</span>
                  <span
                    className={cn(
                      'ml-1 font-semibold',
                      insight.impact >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {formatImpact(insight.impact)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="ml-1 font-semibold text-foreground">
                    {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
            </div>

            {/* Actions */}
            {insight.actions && insight.actions.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                {insight.actions.map(action => (
                  <Button
                    key={action.id}
                    size="sm"
                    variant="outline"
                    className="bg-muted/50 border-border hover:bg-slate-700/50 hover:border-input"
                    onClick={() => onActionClick?.(insight, action.id)}
                  >
                    {action.description}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <Button
        variant="ghost"
        className="w-full mt-4 text-muted-foreground hover:text-foreground hover:bg-muted/50"
      >
        View All Insights
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </Card>
  )
}
