/**
 * HERA Playbook AI Service
 *
 * Provides AI-powered analysis, insights, and predictions
 * for playbook execution using the AI-native fields in
 * HERA's 6 sacred tables.
 */

import { universalApi } from '@/lib/universal-api'
import { EventEmitter } from 'events'

// Types
export interface AIAnalysis {
  confidence: number
  insights: string
  model: string
  version: string
  processingTime: number
  tokenUsage?: {
    prompt: number
    completion: number
    total: number
  }
  recommendations?: AIRecommendation[]
  anomalies?: AIAnomaly[]
  predictions?: AIPrediction[]
}

export interface AIRecommendation {
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  action: string
  reason: string
  confidence: number
}

export interface AIAnomaly {
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  description: string
  detected_at: string
  confidence: number
  metrics?: Record<string, any>
}

export interface AIPrediction {
  metric: string
  value: any
  confidence: number
  horizon: string
  basis: string
}

export interface RunSummary {
  runId: string
  status: string
  overallConfidence: number
  progressPercentage: number
  estimatedCompletion?: Date
  summary: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: AIRecommendation[]
  aiMetadata: {
    analysis_timestamp: string
    model_used: string
    confidence_in_analysis: number
  }
}

export interface ProactiveNudge {
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  target: {
    type: string
    id: string
    name: string
  }
  message: string
  action: string
  link?: string
  ai_reasoning: string
  confidence: number
}

export interface RiskAssessment {
  stepId: string
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  risks: Risk[]
  recommendations: string[]
  ai_analysis: {
    timestamp: string
    model: string
    confidence: number
  }
}

export interface Risk {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  mitigation: string
  [key: string]: any
}

/**
 * AI Provider interface
 */
export interface AIProvider {
  analyze(request: any): Promise<AIAnalysis>
  generateInsights(prompt: string): Promise<any>
}

/**
 * Main AI Service for Playbooks
 */
export class PlaybookAIService {
  private providers: Map<string, AIProvider>
  private eventBus: EventEmitter
  private organizationId: string

  constructor(organizationId: string, eventBus?: EventEmitter) {
    this.organizationId = organizationId
    this.eventBus = eventBus || new EventEmitter()
    this.providers = new Map()

    // Initialize with mock provider
    this.providers.set('mock', new MockAIProvider())
  }

  /**
   * Register an AI provider
   */
  registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider)
  }

  /**
   * Summarize run progress with AI analysis
   */
  async summarizeRunProgress(runId: string): Promise<RunSummary> {
    const startTime = Date.now()

    try {
      // Get run and steps
      const run = await universalApi.getTransaction(runId)
      const steps = await universalApi.queryTransactionLines({
        transaction_id: runId,
        organization_id: this.organizationId
      })

      // Calculate metrics
      const stepData = steps.data || []
      const completedSteps = stepData.filter(s => s.metadata?.status === 'completed')
      const failedSteps = stepData.filter(s => s.metadata?.status === 'failed')
      const progressPercentage = (completedSteps.length / stepData.length) * 100

      // Aggregate confidence scores
      const confidenceScores = stepData.map(s => s.ai_confidence || 1)
      const overallConfidence = this.calculateWeightedConfidence(confidenceScores)

      // Detect anomalies and risks
      const anomalies = await this.detectRunAnomalies(run, stepData)
      const riskLevel = this.assessRiskLevel(overallConfidence, anomalies)

      // Generate AI summary
      const aiSummary = await this.generateRunSummary(run, stepData, {
        progressPercentage,
        completedSteps: completedSteps.length,
        failedSteps: failedSteps.length,
        anomalies,
        overallConfidence
      })

      // Estimate completion
      const estimatedCompletion = this.estimateCompletion(run, stepData)

      // Generate recommendations
      const recommendations = await this.generateRunRecommendations(run, stepData, anomalies)

      return {
        runId,
        status: run.status,
        overallConfidence,
        progressPercentage,
        estimatedCompletion,
        summary: aiSummary,
        riskLevel,
        recommendations,
        aiMetadata: {
          analysis_timestamp: new Date().toISOString(),
          model_used: 'playbook-analyzer-v1',
          confidence_in_analysis: 0.88
        }
      }
    } catch (error) {
      console.error('Error summarizing run progress:', error)
      throw error
    }
  }

  /**
   * Detect anomalies in a run
   */
  async detectRunAnomalies(run: any, steps: any[]): Promise<AIAnomaly[]> {
    const anomalies: AIAnomaly[] = []

    // Performance anomalies
    const avgStepDuration = await this.getAverageStepDuration(run.reference_entity_id)

    const slowSteps = steps.filter(step => {
      const duration = this.getStepDuration(step)
      return duration > avgStepDuration * 1.5
    })

    if (slowSteps.length > 0) {
      anomalies.push({
        type: 'performance_degradation',
        severity: 'warning',
        description: `${slowSteps.length} steps running slower than average`,
        detected_at: new Date().toISOString(),
        confidence: 0.82,
        metrics: {
          affected_steps: slowSteps.map(s => s.metadata?.sequence),
          average_duration: avgStepDuration,
          max_duration: Math.max(...slowSteps.map(s => this.getStepDuration(s)))
        }
      })
    }

    // Failure pattern anomalies
    const failureRate = steps.filter(s => s.metadata?.status === 'failed').length / steps.length
    if (failureRate > 0.2) {
      anomalies.push({
        type: 'high_failure_rate',
        severity: 'error',
        description: `Failure rate of ${(failureRate * 100).toFixed(1)}% exceeds threshold`,
        detected_at: new Date().toISOString(),
        confidence: 0.91,
        metrics: {
          failure_rate: failureRate,
          failed_steps: steps
            .filter(s => s.metadata?.status === 'failed')
            .map(s => s.metadata?.sequence)
        }
      })
    }

    // Low confidence anomalies
    const lowConfidenceSteps = steps.filter(s => (s.ai_confidence || 1) < 0.7)
    if (lowConfidenceSteps.length > 0) {
      anomalies.push({
        type: 'low_confidence',
        severity: 'warning',
        description: `${lowConfidenceSteps.length} steps have low AI confidence`,
        detected_at: new Date().toISOString(),
        confidence: 0.88,
        metrics: {
          affected_steps: lowConfidenceSteps.map(s => ({
            sequence: s.metadata?.sequence,
            confidence: s.ai_confidence
          }))
        }
      })
    }

    // Input pattern anomalies
    const inputAnomalies = await this.detectInputAnomalies(run, steps)
    anomalies.push(...inputAnomalies)

    return anomalies
  }

  /**
   * Analyze risks for a specific step
   */
  async analyzeStepRisks(stepId: string): Promise<RiskAssessment> {
    const step = await universalApi.getTransactionLine(stepId)
    const risks: Risk[] = []

    // Low confidence risk
    if ((step.ai_confidence || 1) < 0.7) {
      risks.push({
        type: 'low_confidence',
        severity: 'high',
        description: `AI confidence ${((step.ai_confidence || 0) * 100).toFixed(0)}% is below threshold`,
        impact: 'High likelihood of incorrect output or failure',
        mitigation: 'Request manual review before proceeding',
        confidence_score: step.ai_confidence || 0
      })
    }

    // SLA risk
    const slaRisk = await this.assessSLARisk(step)
    if (slaRisk) risks.push(slaRisk)

    // Historical failure risk
    const failureRisk = await this.assessHistoricalFailureRisk(step)
    if (failureRisk) risks.push(failureRisk)

    // Resource availability risk
    const resourceRisk = await this.assessResourceRisk(step)
    if (resourceRisk) risks.push(resourceRisk)

    // Calculate overall risk
    const overallRiskLevel = this.calculateOverallRiskLevel(risks)

    // Generate recommendations
    const recommendations = this.generateRiskMitigations(risks)

    return {
      stepId,
      overallRiskLevel,
      risks,
      recommendations,
      ai_analysis: {
        timestamp: new Date().toISOString(),
        model: 'risk-analyzer-v1',
        confidence: 0.85
      }
    }
  }

  /**
   * Generate proactive nudges
   */
  async generateProactiveNudges(): Promise<ProactiveNudge[]> {
    const nudges: ProactiveNudge[] = []

    // Get active runs
    const activeRuns = await universalApi.queryTransactions({
      filters: {
        transaction_type: 'playbook_run',
        status: ['in_progress', 'blocked'],
        organization_id: this.organizationId
      }
    })

    // Analyze each run
    for (const run of activeRuns.data || []) {
      // Check for stalled runs
      const stalledNudge = this.checkStalledRun(run)
      if (stalledNudge) nudges.push(stalledNudge)

      // Check for low confidence steps
      const lowConfidenceNudges = await this.checkLowConfidenceSteps(run.id)
      nudges.push(...lowConfidenceNudges)

      // Check for optimization opportunities
      const optimizationNudges = await this.findOptimizations(run)
      nudges.push(...optimizationNudges)
    }

    // Check underutilized playbooks
    const underutilizedNudges = await this.checkUnderutilizedPlaybooks()
    nudges.push(...underutilizedNudges)

    // Prioritize nudges
    return this.prioritizeNudges(nudges)
  }

  /**
   * Enrich entity with AI analysis
   */
  async enrichEntity(entityType: string, entityId: string, context?: any): Promise<void> {
    const provider = this.providers.get('mock') || new MockAIProvider()
    const entity = await this.getEntity(entityType, entityId)

    // Analyze entity
    const analysis = await provider.analyze({
      entityType,
      entity,
      context,
      historicalData: await this.getHistoricalData(entityType, entity)
    })

    // Update entity with AI fields
    await this.updateEntityAI(entityType, entityId, {
      ai_confidence: analysis.confidence,
      ai_insights: analysis.insights,
      metadata: {
        ai_analysis: {
          timestamp: new Date().toISOString(),
          model_used: analysis.model,
          version: analysis.version,
          processing_time_ms: analysis.processingTime,
          token_usage: analysis.tokenUsage
        },
        ai_recommendations: analysis.recommendations,
        ai_anomalies: analysis.anomalies,
        ai_predictions: analysis.predictions
      }
    })

    // Emit event
    this.eventBus.emit('entity:ai-enriched', {
      entityType,
      entityId,
      confidence: analysis.confidence
    })
  }

  // Private helper methods

  private calculateWeightedConfidence(confidences: number[]): number {
    if (confidences.length === 0) return 1

    // Weight recent steps more heavily (exponential decay)
    const weights = confidences.map((_, i) => Math.pow(0.9, confidences.length - i - 1))
    const weightSum = weights.reduce((a, b) => a + b, 0)

    return confidences.reduce((sum, conf, i) => sum + conf * weights[i], 0) / weightSum
  }

  private assessRiskLevel(
    confidence: number,
    anomalies: AIAnomaly[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length
    const errorCount = anomalies.filter(a => a.severity === 'error').length

    if (criticalCount > 0 || confidence < 0.5) return 'critical'
    if (errorCount > 0 || confidence < 0.7) return 'high'
    if (anomalies.length > 2 || confidence < 0.85) return 'medium'
    return 'low'
  }

  private async generateRunSummary(run: any, steps: any[], metrics: any): Promise<string> {
    const provider = this.providers.get('mock') || new MockAIProvider()

    const prompt = `
      Summarize the following playbook run:
      - Status: ${run.status}
      - Progress: ${metrics.progressPercentage.toFixed(1)}%
      - Completed: ${metrics.completedSteps}/${steps.length} steps
      - Failed: ${metrics.failedSteps} steps
      - Anomalies: ${metrics.anomalies.length} detected
      - Overall Confidence: ${(metrics.overallConfidence * 100).toFixed(1)}%
      
      Provide a brief 1-2 sentence summary.
    `

    const response = await provider.generateInsights(prompt)
    return response.summary || 'Run analysis in progress.'
  }

  private estimateCompletion(run: any, steps: any[]): Date | undefined {
    const inProgressSteps = steps.filter(s => ['pending', 'running'].includes(s.metadata?.status))

    if (inProgressSteps.length === 0) return undefined

    // Calculate average step duration
    const completedSteps = steps.filter(s => s.metadata?.status === 'completed')
    if (completedSteps.length === 0) return undefined

    const avgDuration =
      completedSteps.reduce((sum, step) => {
        return sum + this.getStepDuration(step)
      }, 0) / completedSteps.length

    // Estimate remaining time
    const estimatedRemainingMs = inProgressSteps.length * avgDuration
    return new Date(Date.now() + estimatedRemainingMs)
  }

  private getStepDuration(step: any): number {
    if (!step.metadata?.started_at) return 0
    const endTime = step.metadata?.completed_at || new Date().toISOString()
    return new Date(endTime).getTime() - new Date(step.metadata.started_at).getTime()
  }

  private async getAverageStepDuration(playbookId: string): Promise<number> {
    // Mock implementation - would query historical data
    return 5 * 60 * 1000 // 5 minutes
  }

  private checkStalledRun(run: any): ProactiveNudge | null {
    const lastActivity = new Date(run.metadata?.last_activity_at || run.created_at)
    const stalledMinutes = (Date.now() - lastActivity.getTime()) / 1000 / 60

    if (stalledMinutes > 30) {
      return {
        type: 'stalled_run',
        priority: 'high',
        target: {
          type: 'run',
          id: run.id,
          name: run.transaction_code
        },
        message: `Run ${run.transaction_code} inactive for ${Math.round(stalledMinutes)} minutes`,
        action: 'Review and unblock',
        link: `/playbook-runs/${run.id}`,
        ai_reasoning: 'Extended inactivity indicates possible blocking issue',
        confidence: 0.89
      }
    }

    return null
  }

  private prioritizeNudges(nudges: ProactiveNudge[]): ProactiveNudge[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

    return nudges.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.confidence - a.confidence
    })
  }

  private async getEntity(entityType: string, entityId: string): Promise<any> {
    if (entityType === 'run') {
      return universalApi.getTransaction(entityId)
    } else if (entityType === 'step') {
      return universalApi.getTransactionLine(entityId)
    } else {
      return universalApi.getEntity(entityId)
    }
  }

  private async updateEntityAI(entityType: string, entityId: string, aiFields: any): Promise<void> {
    if (entityType === 'run') {
      await universalApi.updateTransaction(entityId, aiFields)
    } else if (entityType === 'step') {
      await universalApi.updateTransactionLine(entityId, aiFields)
    } else {
      await universalApi.updateEntity(entityId, aiFields)
    }
  }

  private async generateRunRecommendations(
    run: any,
    steps: any[],
    anomalies: AIAnomaly[]
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []

    // Performance recommendations
    if (anomalies.some(a => a.type === 'performance_degradation')) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        action: 'Review slow-running steps for optimization opportunities',
        reason: 'Multiple steps running slower than historical average',
        confidence: 0.78
      })
    }

    // Failure recommendations
    if (anomalies.some(a => a.type === 'high_failure_rate')) {
      recommendations.push({
        type: 'intervention',
        priority: 'high',
        action: 'Manual review required for failing steps',
        reason: 'Failure rate exceeds acceptable threshold',
        confidence: 0.91
      })
    }

    // Low confidence recommendations
    if (anomalies.some(a => a.type === 'low_confidence')) {
      recommendations.push({
        type: 'review',
        priority: 'medium',
        action: 'Verify outputs of low-confidence steps',
        reason: 'AI confidence below threshold indicates potential issues',
        confidence: 0.85
      })
    }

    return recommendations
  }

  private async detectInputAnomalies(run: any, steps: any[]): Promise<AIAnomaly[]> {
    // Mock implementation - would analyze input patterns
    return []
  }

  private async getHistoricalData(entityType: string, entity: any): Promise<any> {
    // Mock implementation - would fetch historical data
    return {
      average_duration: 300000,
      success_rate: 0.87,
      common_failures: []
    }
  }

  private async checkLowConfidenceSteps(runId: string): Promise<ProactiveNudge[]> {
    const steps = await universalApi.queryTransactionLines({
      transaction_id: runId
    })

    return (steps.data || [])
      .filter(step => (step.ai_confidence || 1) < 0.7)
      .map(step => ({
        type: 'low_confidence_step',
        priority: 'medium' as const,
        target: {
          type: 'step',
          id: step.id,
          name: step.metadata?.step_name || 'Unknown Step'
        },
        message: `Step has low AI confidence (${((step.ai_confidence || 0) * 100).toFixed(0)}%)`,
        action: 'Review step outputs',
        link: `/playbook-runs/${runId}/steps/${step.metadata?.sequence}`,
        ai_reasoning: step.ai_insights || 'Low confidence indicates potential issues',
        confidence: step.ai_confidence || 0
      }))
  }

  private async findOptimizations(run: any): Promise<ProactiveNudge[]> {
    // Mock implementation - would analyze for optimization opportunities
    return []
  }

  private async checkUnderutilizedPlaybooks(): Promise<ProactiveNudge[]> {
    // Mock implementation - would check playbook usage
    return []
  }

  private calculateOverallRiskLevel(risks: Risk[]): 'low' | 'medium' | 'high' | 'critical' {
    if (risks.some(r => r.severity === 'critical')) return 'critical'
    if (risks.some(r => r.severity === 'high')) return 'high'
    if (risks.length > 2 || risks.some(r => r.severity === 'medium')) return 'medium'
    return 'low'
  }

  private generateRiskMitigations(risks: Risk[]): string[] {
    return risks.map(risk => risk.mitigation)
  }

  private async assessSLARisk(step: any): Promise<Risk | null> {
    // Mock implementation
    return null
  }

  private async assessHistoricalFailureRisk(step: any): Promise<Risk | null> {
    // Mock implementation
    return null
  }

  private async assessResourceRisk(step: any): Promise<Risk | null> {
    // Mock implementation
    return null
  }
}

/**
 * Mock AI Provider for testing
 */
class MockAIProvider implements AIProvider {
  async analyze(request: any): Promise<AIAnalysis> {
    return {
      confidence: 0.75 + Math.random() * 0.2,
      insights:
        'Analysis indicates normal execution patterns with minor optimization opportunities.',
      model: 'mock-ai-v1',
      version: '1.0.0',
      processingTime: Math.random() * 1000,
      recommendations: [
        {
          type: 'optimization',
          priority: 'low',
          action: 'Consider parallelizing independent steps',
          reason: 'No dependencies detected between steps 2 and 3',
          confidence: 0.82
        }
      ],
      anomalies: [],
      predictions: [
        {
          metric: 'completion_time',
          value: new Date(Date.now() + 3600000).toISOString(),
          confidence: 0.78,
          horizon: '1 hour',
          basis: 'Historical average'
        }
      ]
    }
  }

  async generateInsights(prompt: string): Promise<any> {
    return {
      summary: 'Playbook execution proceeding normally with expected performance.',
      findings: [
        'All critical steps completed successfully',
        'Performance metrics within acceptable range'
      ],
      risks: [],
      recommendations: [],
      actions: ['Continue monitoring', 'No intervention required'],
      confidence: 0.85
    }
  }
}

// Export service factory
export function createPlaybookAIService(
  organizationId: string,
  eventBus?: EventEmitter
): PlaybookAIService {
  return new PlaybookAIService(organizationId, eventBus)
}
