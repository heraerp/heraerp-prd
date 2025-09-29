/**
 * AI Insights Components for HERA Playbooks
 *
 * React components for displaying AI analysis, confidence scores,
 * anomalies, and recommendations in the playbook UI.
 */

import React from 'react'
import {
  Brain,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Info,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { createPlaybookAIService } from '@/lib/playbooks/ai-service'
import type {
  RunSummary,
  AIAnomaly,
  AIRecommendation,
  ProactiveNudge,
  RiskAssessment
} from '@/lib/playbooks/ai-service'

/**
 * AI Confidence Indicator
 */
export function AIConfidenceIndicator({
  confidence,
  threshold = 0.7,
  showLabel = true,
  size = 'default'
}: {
  confidence: number
  threshold?: number
  showLabel?: boolean
  size?: 'small' | 'default' | 'large'
}) {
  const percentage = Math.round(confidence * 100)

  const getColor = () => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= threshold) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBackgroundColor = () => {
    if (confidence >= 0.9) return 'bg-green-50'
    if (confidence >= threshold) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const getIcon = () => {
    const iconSize = size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
    if (confidence >= 0.9) return <CheckCircle className={iconSize} />
    if (confidence >= threshold) return <AlertCircle className={iconSize} />
    return <XCircle className={iconSize} />
  }

  const textSize = size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'

  return (
    <div
      className={cn('inline-flex items-center gap-2 px-2 py-1 rounded-md', getBackgroundColor())}
    >
      <span className={getColor()}>{getIcon()}</span>
      {showLabel && (
        <>
          <span className={cn('font-medium', textSize, getColor())}>{percentage}%</span>
          <span className={cn('text-gray-600', textSize)}>confidence</span>
          {confidence < threshold && (
            <span className={cn('text-gray-500', textSize)}>(below {threshold * 100}%)</span>
          )}
        </>
      )}
    </div>
  )
}

/**
 * AI Anomaly Card
 */
export function AIAnomalyCard({ anomaly }: { anomaly: AIAnomaly }) {
  const getSeverityColor = () => {
    switch (anomaly.severity) {
      case 'critical':
        return 'border-red-500 bg-red-50'
      case 'error':
        return 'border-orange-500 bg-orange-50'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  const getSeverityIcon = () => {
    switch (anomaly.severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className={cn('p-4 rounded-lg border-l-4', getSeverityColor())}>
      <div className="flex items-start gap-3">
        {getSeverityIcon()}
        <div className="flex-1">
          <h4 className="font-medium text-sm">
            {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h4>
          <p className="text-sm ink mt-1">{anomaly.description}</p>
          {anomaly.metrics && (
            <div className="mt-2 text-xs ink-muted">
              {Object.entries(anomaly.metrics).map(([key, value]) => (
                <span key={key} className="mr-3">
                  {key}: <span className="font-medium">{JSON.stringify(value)}</span>
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs ink-muted">
            <span>Detected: {new Date(anomaly.detected_at).toLocaleString()}</span>
            <AIConfidenceIndicator confidence={anomaly.confidence} size="small" showLabel={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * AI Recommendation Card
 */
export function AIRecommendationCard({ recommendation }: { recommendation: AIRecommendation }) {
  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Alert>
      <Zap className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {recommendation.action}
        <Badge variant={getPriorityColor()}>{recommendation.priority}</Badge>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{recommendation.reason}</p>
        <div className="mt-2 flex items-center gap-2">
          <AIConfidenceIndicator confidence={recommendation.confidence} size="small" />
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Run Progress Summary
 */
export function RunProgressSummary({ runId }: { runId: string }) {
  const {
    data: summary,
    isLoading,
    error
  } = useQuery({
    queryKey: ['ai-run-summary', runId],
    queryFn: async () => {
      const aiService = createPlaybookAIService('current-org-id')
      return aiService.summarizeRunProgress(runId)
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load AI analysis</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analysis
          </span>
          <Badge
            variant={
              summary.riskLevel === 'critical'
                ? 'destructive'
                : summary.riskLevel === 'high'
                  ? 'default'
                  : summary.riskLevel === 'medium'
                    ? 'secondary'
                    : 'outline'
            }
          >
            {summary.riskLevel} risk
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm ink-muted">{summary.progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={summary.progressPercentage} className="h-2" />
        </div>

        {/* AI Confidence */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AI Confidence</span>
          <AIConfidenceIndicator confidence={summary.overallConfidence} />
        </div>

        {/* Summary */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">{summary.summary}</p>
        </div>

        {/* Estimated Completion */}
        {summary.estimatedCompletion && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estimated Completion</span>
            <span className="text-sm ink-muted">
              {new Date(summary.estimatedCompletion).toLocaleString()}
            </span>
          </div>
        )}

        {/* Recommendations */}
        {summary.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Recommendations</h4>
            <div className="space-y-2">
              {summary.recommendations.map((rec, i) => (
                <AIRecommendationCard key={i} recommendation={rec} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * AI Insights Panel
 */
export function AIInsightsPanel({
  entityType,
  entityId
}: {
  entityType: 'playbook' | 'run' | 'step'
  entityId: string
}) {
  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        <TabsTrigger value="predictions">Predictions</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="mt-4">
        {entityType === 'run' && <RunProgressSummary runId={entityId} />}
      </TabsContent>

      <TabsContent value="anomalies" className="mt-4">
        <AnomaliesTab entityType={entityType} entityId={entityId} />
      </TabsContent>

      <TabsContent value="predictions" className="mt-4">
        <PredictionsTab entityType={entityType} entityId={entityId} />
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <HistoryTab entityType={entityType} entityId={entityId} />
      </TabsContent>
    </Tabs>
  )
}

/**
 * Proactive Nudge Display
 */
export function ProactiveNudgeList() {
  const { data: nudges, isLoading } = useQuery({
    queryKey: ['proactive-nudges'],
    queryFn: async () => {
      const aiService = createPlaybookAIService('current-org-id')
      return aiService.generateProactiveNudges()
    },
    refetchInterval: 60000 // Refresh every minute
  })

  if (isLoading || !nudges || nudges.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {nudges.slice(0, 5).map((nudge, i) => (
        <Alert key={i} className="cursor-pointer hover:shadow-md transition-shadow">
          <Activity className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {nudge.message}
            <Badge
              variant={
                nudge.priority === 'critical'
                  ? 'destructive'
                  : nudge.priority === 'high'
                    ? 'default'
                    : nudge.priority === 'medium'
                      ? 'secondary'
                      : 'outline'
              }
            >
              {nudge.priority}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            <p className="text-sm ink-muted mt-1">{nudge.ai_reasoning}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button size="sm" variant="default">
                {nudge.action}
              </Button>
              <AIConfidenceIndicator confidence={nudge.confidence} size="small" />
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

/**
 * Step Risk Assessment
 */
export function StepRiskAssessment({ stepId }: { stepId: string }) {
  const { data: assessment } = useQuery({
    queryKey: ['step-risk-assessment', stepId],
    queryFn: async () => {
      const aiService = createPlaybookAIService('current-org-id')
      return aiService.analyzeStepRisks(stepId)
    }
  })

  if (!assessment) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assessment.risks.map((risk, i) => (
            <div key={i} className="p-3 bg-red-50 rounded-lg">
              <h5 className="font-medium text-sm text-red-900">{risk.description}</h5>
              <p className="text-xs text-red-700 mt-1">Impact: {risk.impact}</p>
              <p className="text-xs text-red-700">Mitigation: {risk.mitigation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Tab Components (simplified implementations)
function AnomaliesTab({ entityType, entityId }: any) {
  return (
    <div>
      Anomalies analysis for {entityType} {entityId}
    </div>
  )
}

function PredictionsTab({ entityType, entityId }: any) {
  return (
    <div>
      AI predictions for {entityType} {entityId}
    </div>
  )
}

function HistoryTab({ entityType, entityId }: any) {
  return (
    <div>
      AI analysis history for {entityType} {entityId}
    </div>
  )
}
