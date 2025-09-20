'use client'

import React, { useState } from 'react'
import { PredictiveAnalytics } from './PredictiveAnalytics'
import { AIInsightsFeed } from './AIInsightsFeed'
import { RiskAlerts } from './RiskAlerts'
import { OpportunityFeed } from './OpportunityFeed'
import { MarketIntelligence } from './MarketIntelligence'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Target, Shield, Lightbulb, BarChart3 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAIInsights } from '@/lib/pwm/api'

interface AIIntelligenceCenterProps {
  organizationId: string
}

export function AIIntelligenceCenter({ organizationId }: AIIntelligenceCenterProps) {
  const [activeTab, setActiveTab] = useState('predictions')

  // Fetch AI insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights-full', organizationId],
    queryFn: () => getAIInsights(organizationId),
    refetchInterval: 60000 // Refresh every minute
  })

  const handleInsightAction = (insight: any, actionId: string) => {
    console.log('AI action triggered:', insight, actionId)
    // TODO: Implement AI action handling
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Brain className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Intelligence Center</h2>
            <p className="text-muted-foreground mt-1">
              Advanced analytics and predictive insights powered by AI
            </p>
          </div>
        </div>
      </div>

      {/* AI Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl bg-muted/50 p-1">
          <TabsTrigger
            value="predictions"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Predictions</span>
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger
            value="risks"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Risks</span>
          </TabsTrigger>
          <TabsTrigger
            value="opportunities"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Opportunities</span>
          </TabsTrigger>
          <TabsTrigger
            value="market"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Market</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="predictions" className="space-y-6">
          <PredictiveAnalytics organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AIInsightsFeed
            insights={insights || []}
            onActionClick={handleInsightAction}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <RiskAlerts
            organizationId={organizationId}
            insights={insights?.filter(i => i.type === 'risk') || []}
          />
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <OpportunityFeed
            organizationId={organizationId}
            insights={insights?.filter(i => i.type === 'opportunity') || []}
          />
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <MarketIntelligence organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      {/* AI Confidence Indicator */}
      <div className="fixed bottom-6 left-6 p-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-3 w-3 bg-purple-400 rounded-full animate-pulse" />
            <div className="absolute inset-0 h-3 w-3 bg-purple-400 rounded-full animate-ping" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">AI Active</p>
            <p className="text-xs text-muted-foreground">
              Processing {insights?.length || 0} insights
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
