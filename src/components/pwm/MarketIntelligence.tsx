'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scrollarea'
import {
  BarChart3,
  Globe,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketIntelligenceProps {
  organizationId: string
}

interface MarketEvent {
  id: string
  type: 'economic' | 'earnings' | 'geopolitical' | 'regulatory'
  title: string
  impact: 'high' | 'medium' | 'low'
  sentiment: 'positive' | 'negative' | 'neutral'
  time: string
  description: string
  affectedSectors: string[]
}

export function MarketIntelligence({ organizationId }: MarketIntelligenceProps) {
  // Mock market data
  const marketIndices = [
    { name: 'S&P 500', value: 4783.45, change: 1.23, changePercent: 0.026 },
    { name: 'NASDAQ', value: 14972.23, change: -45.67, changePercent: -0.003 },
    { name: 'DOW', value: 37863.45, change: 234.56, changePercent: 0.062 },
    { name: 'FTSE 100', value: 7682.34, change: 12.45, changePercent: 0.016 },
    { name: 'DAX', value: 16751.23, change: -89.12, changePercent: -0.053 },
    { name: 'Nikkei', value: 33445.67, change: 456.78, changePercent: 0.138 }
  ]

  const marketEvents: MarketEvent[] = [
    {
      id: '1',
      type: 'economic',
      title: 'Fed Minutes Released',
      impact: 'high',
      sentiment: 'positive',
      time: '2 hours ago',
      description: 'Federal Reserve signals potential rate cuts in Q2 2024',
      affectedSectors: ['Finance', 'Real Estate', 'Technology']
    },
    {
      id: '2',
      type: 'earnings',
      title: 'Tech Giants Beat Earnings',
      impact: 'medium',
      sentiment: 'positive',
      time: '4 hours ago',
      description: 'Major tech companies exceed Q4 earnings expectations',
      affectedSectors: ['Technology', 'Consumer']
    },
    {
      id: '3',
      type: 'geopolitical',
      title: 'EU-China Trade Agreement',
      impact: 'high',
      sentiment: 'positive',
      time: '6 hours ago',
      description: 'New trade deal opens markets and reduces tariffs',
      affectedSectors: ['Manufacturing', 'Energy', 'Consumer']
    },
    {
      id: '4',
      type: 'regulatory',
      title: 'Crypto Regulation Update',
      impact: 'medium',
      sentiment: 'negative',
      time: '1 day ago',
      description: 'SEC announces stricter cryptocurrency trading rules',
      affectedSectors: ['Cryptocurrency', 'Finance']
    }
  ]

  const aiSynthesis = {
    marketSentiment: 'Cautiously Optimistic',
    keyThemes: [
      'Rate cut expectations driving equity rally',
      'Tech sector showing resilience',
      'Geopolitical tensions easing',
      'Inflation concerns moderating'
    ],
    recommendation: 'Maintain current allocation with slight tilt toward growth equities',
    confidence: 0.82
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'economic':
        return <BarChart3 className="h-4 w-4" />
      case 'earnings':
        return <TrendingUp className="h-4 w-4" />
      case 'geopolitical':
        return <Globe className="h-4 w-4" />
      case 'regulatory':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Newspaper className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <BarChart3 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Global Market Overview</h3>
            <p className="text-sm text-muted-foreground">Real-time market intelligence</p>
          </div>
        </div>

        {/* Market Indices */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {marketIndices.map(index => (
            <div key={index.name} className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">{index.name}</p>
              <p className="text-lg font-bold text-foreground mb-1">
                {index.value.toLocaleString()}
              </p>
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  index.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {index.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {index.change >= 0 ? '+' : ''}
                  {index.change} ({index.changePercent >= 0 ? '+' : ''}
                  {(index.changePercent * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Market Synthesis */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              AI Market Synthesis
            </h4>
            <Badge
              variant="outline"
              className="bg-purple-500/20 text-purple-300 border-purple-500/30"
            >
              {(aiSynthesis.confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Market Sentiment</p>
              <p className="text-lg font-semibold text-foreground">{aiSynthesis.marketSentiment}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Key Themes</p>
              <div className="space-y-1">
                {aiSynthesis.keyThemes.map((theme, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span className="text-slate-300">{theme}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border/50">
              <p className="text-sm font-medium text-emerald-400">
                💡 {aiSynthesis.recommendation}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Market Events Feed */}
      <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
        <h3 className="text-lg font-semibold text-foreground mb-4">Market Events & Impact</h3>

        <ScrollArea className="h-96">
          <div className="space-y-4">
            {marketEvents.map(event => (
              <div key={event.id} className="p-4 rounded-xl border bg-muted/30 border-border/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        event.sentiment === 'positive'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : event.sentiment === 'negative'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-500/20 text-muted-foreground'
                      )}
                    >
                      {getTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('ml-3', getImpactColor(event.impact))}>
                    {event.impact} impact
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {event.affectedSectors.map(sector => (
                      <Badge
                        key={sector}
                        variant="outline"
                        className="text-xs bg-slate-700/50 text-slate-300 border-input"
                      >
                        {sector}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
