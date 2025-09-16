'use client'

import React from 'react'
import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Lightbulb, TrendingUp, Zap, DollarSign, Clock, ChevronRight } from 'lucide-react'
import { AIInsight } from '@/src/lib/pwm/types'
import { cn } from '@/src/lib/utils'

interface OpportunityFeedProps {
  organizationId: string
  insights: AIInsight[]
}

export function OpportunityFeed({ organizationId, insights }: OpportunityFeedProps) {
  // Additional mock opportunities
  const additionalOpportunities = [
    {
      id: 'opp-1',
      type: 'opportunity' as const,
      title: 'Emerging Market Entry Point',
      description: 'Asian markets showing strong recovery signals with potential 25% upside',
      impact: 3500000,
      confidence: 0.78,
      priority: 'high' as const,
      created_at: new Date().toISOString(),
      timeframe: '3-6 months',
      category: 'Geographic Expansion'
    },
    {
      id: 'opp-2',
      type: 'opportunity' as const,
      title: 'Private Equity Co-Investment',
      description: 'Exclusive access to Series C round of AI unicorn with 3x potential',
      impact: 5000000,
      confidence: 0.82,
      priority: 'high' as const,
      created_at: new Date().toISOString(),
      timeframe: '2 weeks',
      category: 'Private Markets'
    },
    {
      id: 'opp-3',
      type: 'opportunity' as const,
      title: 'Tax Optimization Strategy',
      description: 'Restructure holdings to save $1.2M annually in tax obligations',
      impact: 1200000,
      confidence: 0.95,
      priority: 'medium' as const,
      created_at: new Date().toISOString(),
      timeframe: 'End of quarter',
      category: 'Tax Strategy'
    }
  ]

  const allOpportunities = [...insights, ...additionalOpportunities]

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Geographic Expansion': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Private Markets': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Tax Strategy': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'Market Timing': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      default: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
    return colors[category] || colors.default
  }

  const formatImpact = (impact: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(Math.abs(impact))
  }

  return (
    <div className="space-y-6">
      {/* Opportunity Summary */}
      <Card className="p-6 bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Lightbulb className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Active Opportunities</h3>
              <p className="text-sm text-emerald-400">
                {allOpportunities.length} opportunities • +$
                {allOpportunities.reduce((sum, o) => sum + o.impact, 0) / 1000000}M potential
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Apply AI Strategy
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              ${allOpportunities.reduce((sum, o) => sum + o.impact, 0) / 1000000}M
            </p>
            <p className="text-xs text-muted-foreground">Total Potential</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <TrendingUp className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {(
                (allOpportunities.reduce((sum, o) => sum + o.confidence, 0) /
                  allOpportunities.length) *
                100
              ).toFixed(0)}
              %
            </p>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {allOpportunities.filter(o => o.priority === 'high').length}
            </p>
            <p className="text-xs text-muted-foreground">Time Sensitive</p>
          </div>
        </div>
      </Card>

      {/* Opportunity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allOpportunities.map(opportunity => (
          <Card
            key={opportunity.id}
            className="p-5 bg-background/50 backdrop-blur-sm border-slate-800 hover:border-border transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {(opportunity as any).category && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getCategoryColor((opportunity as any).category))}
                    >
                      {(opportunity as any).category}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      opportunity.priority === 'high'
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : opportunity.priority === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    )}
                  >
                    {opportunity.priority} priority
                  </Badge>
                </div>
                <h4 className="font-semibold text-foreground text-lg mb-1">{opportunity.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{opportunity.description}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500">Potential Impact</p>
                <p className="text-lg font-bold text-emerald-400">
                  +{formatImpact(opportunity.impact)}
                </p>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div>
                <p className="text-xs text-slate-500">AI Confidence</p>
                <p className="text-lg font-bold text-foreground">
                  {(opportunity.confidence * 100).toFixed(0)}%
                </p>
              </div>
              {(opportunity as any).timeframe && (
                <>
                  <div className="h-8 w-px bg-slate-700" />
                  <div>
                    <p className="text-xs text-slate-500">Timeframe</p>
                    <p className="text-sm font-medium text-foreground">
                      {(opportunity as any).timeframe}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                className="flex-1 bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400"
                variant="outline"
              >
                Explore Opportunity
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Analysis Note */}
      <Card className="p-4 bg-muted/30 border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-300">
              AI continuously scans 50,000+ data points to identify opportunities
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Last scan: 2 minutes ago • Next scan: in 58 minutes
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
