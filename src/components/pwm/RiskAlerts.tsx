'use client'

import React from 'react'
import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { Shield, AlertTriangle, TrendingDown, ChevronRight } from 'lucide-react'
import { AIInsight } from '@/src/lib/pwm/types'
import { cn } from '@/src/lib/utils'

interface RiskAlertsProps {
  organizationId: string
  insights: AIInsight[]
}

export function RiskAlerts({ organizationId, insights }: RiskAlertsProps) {
  // Mock risk metrics
  const riskMetrics = {
    overallScore: 7.2,
    volatility: 15.3,
    correlation: 0.65,
    maxDrawdown: -12.5,
    varAt95: -2500000,
    stressTestResult: -8.2
  }

  const getRiskLevel = (score: number) => {
    if (score <= 3)
      return { level: 'Low', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
    if (score <= 6)
      return { level: 'Moderate', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' }
    if (score <= 8)
      return { level: 'High', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' }
    return { level: 'Critical', color: 'text-red-400 bg-red-400/10 border-red-400/20' }
  }

  const riskLevel = getRiskLevel(riskMetrics.overallScore)

  return (
    <div className="space-y-6">
      {/* Risk Overview Card */}
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Portfolio Risk Analysis</h3>
              <p className="text-sm text-muted-foreground">Real-time risk monitoring</p>
            </div>
          </div>
          <Badge variant="outline" className={cn(riskLevel.color)}>
            {riskLevel.level} Risk
          </Badge>
        </div>

        {/* Risk Score Gauge */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Risk Score</span>
            <span className="text-3xl font-bold text-foreground">{riskMetrics.overallScore}/10</span>
          </div>
          <Progress value={riskMetrics.overallScore * 10} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Low</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>

        {/* Key Risk Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Volatility</p>
            <p className="text-lg font-semibold text-foreground">{riskMetrics.volatility}%</p>
            <p className="text-xs text-slate-500 mt-1">Annual</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Correlation</p>
            <p className="text-lg font-semibold text-foreground">{riskMetrics.correlation}</p>
            <p className="text-xs text-slate-500 mt-1">To market</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
            <p className="text-lg font-semibold text-red-400">{riskMetrics.maxDrawdown}%</p>
            <p className="text-xs text-slate-500 mt-1">Last 12 months</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">VaR (95%)</p>
            <p className="text-lg font-semibold text-orange-400">
              ${Math.abs(riskMetrics.varAt95 / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-slate-500 mt-1">1-day</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Stress Test</p>
            <p className="text-lg font-semibold text-yellow-400">{riskMetrics.stressTestResult}%</p>
            <p className="text-xs text-slate-500 mt-1">Market crash</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Diversification</p>
            <p className="text-lg font-semibold text-emerald-400">Good</p>
            <p className="text-xs text-slate-500 mt-1">15 sectors</p>
          </div>
        </div>
      </Card>

      {/* Active Risk Alerts */}
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Risk Alerts</h3>

        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active risk alerts</p>
              <p className="text-sm mt-1">Your portfolio is well-protected</p>
            </div>
          ) : (
            insights.map(insight => (
              <div
                key={insight.id}
                className="p-4 rounded-xl border bg-muted/30 border-border/50"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Impact:
                          <span className="ml-1 font-medium text-red-400">
                            -${Math.abs(insight.impact / 1000000).toFixed(1)}M
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Confidence:
                          <span className="ml-1 font-medium text-foreground">
                            {(insight.confidence * 100).toFixed(0)}%
                          </span>
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
                      >
                        Mitigate Risk
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Risk Mitigation Recommendations */}
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recommended Actions</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="p-1.5 rounded bg-blue-500/20">
              <TrendingDown className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Reduce Tech Exposure</p>
              <p className="text-xs text-muted-foreground">Decrease allocation by 5% to balance risk</p>
            </div>
            <Button size="sm" variant="ghost" className="text-blue-400">
              Review
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="p-1.5 rounded bg-emerald-500/20">
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Add Hedge Position</p>
              <p className="text-xs text-muted-foreground">Consider gold or bonds for protection</p>
            </div>
            <Button size="sm" variant="ghost" className="text-emerald-400">
              Explore
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
