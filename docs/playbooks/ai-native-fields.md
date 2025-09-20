# AI-Native Fields in HERA Playbooks

This document describes how AI-native fields are embedded throughout the HERA Playbook system to provide intelligent insights, anomaly detection, and proactive guidance.

## 1. AI Fields in the Sacred Six Tables

### 1.1 Universal AI Field Structure

Every table in HERA includes AI-native fields:

```typescript
interface AIFields {
  ai_confidence?: number;      // 0-1 confidence score
  ai_insights?: string;        // Natural language insights
  metadata: {
    ai_analysis?: {
      timestamp: string;
      model_used: string;
      version: string;
      processing_time_ms: number;
      token_usage?: {
        prompt: number;
        completion: number;
        total: number;
      };
    };
    ai_recommendations?: Array<{
      type: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      action: string;
      reason: string;
      confidence: number;
    }>;
    ai_anomalies?: Array<{
      type: string;
      severity: 'info' | 'warning' | 'error' | 'critical';
      description: string;
      detected_at: string;
      confidence: number;
    }>;
    ai_predictions?: Array<{
      metric: string;
      value: any;
      confidence: number;
      horizon: string;
      basis: string;
    }>;
  };
}
```

### 1.2 Table-Specific AI Usage

#### core_entities (Playbooks & Steps)
```typescript
// Playbook Definition
{
  entity_type: 'playbook_definition',
  ai_confidence: 0.92,  // Confidence in playbook design quality
  ai_insights: 'Well-structured playbook with clear steps. Consider adding error recovery for step 3.',
  metadata: {
    ai_analysis: {
      complexity_score: 7.2,
      estimated_success_rate: 0.85,
      optimization_suggestions: [
        'Parallelize steps 2 and 3 for 30% faster execution',
        'Add validation step after customer data collection'
      ],
      risk_factors: [
        'Step 3 has single point of failure',
        'No timeout defined for external API calls'
      ]
    }
  }
}

// Step Definition
{
  entity_type: 'playbook_step_definition',
  ai_confidence: 0.88,
  ai_insights: 'This step typically takes 5-7 minutes. Consider breaking into sub-steps for better progress tracking.',
  metadata: {
    ai_predictions: {
      expected_duration_seconds: 360,
      failure_probability: 0.12,
      retry_likelihood: 0.08
    }
  }
}
```

#### universal_transactions (Runs)
```typescript
{
  transaction_type: 'playbook_run',
  ai_confidence: 0.75,  // Current confidence in successful completion
  ai_insights: 'Run proceeding slower than average. Step 3 showing signs of potential timeout.',
  metadata: {
    ai_anomalies: [
      {
        type: 'performance_degradation',
        severity: 'warning',
        description: 'Current run 40% slower than historical average',
        detected_at: '2024-01-15T10:30:00Z',
        confidence: 0.82
      }
    ],
    ai_recommendations: [
      {
        type: 'escalation',
        priority: 'medium',
        action: 'Notify supervisor about potential delay',
        reason: 'Step 3 execution time exceeding P90 threshold',
        confidence: 0.78
      }
    ],
    ai_predictions: {
      completion_time: '2024-01-15T11:45:00Z',
      success_probability: 0.73,
      cost_estimate: 32.50
    }
  }
}
```

#### universal_transaction_lines (Step Executions)
```typescript
{
  line_entity_id: 'step_definition_id',
  ai_confidence: 0.65,  // Low confidence indicates risk
  ai_insights: 'Unusual input pattern detected. Manual review recommended.',
  metadata: {
    ai_analysis: {
      input_anomaly_score: 0.82,
      output_quality_score: 0.71,
      performance_percentile: 15  // Bottom 15% performance
    },
    ai_anomalies: [
      {
        type: 'input_mismatch',
        severity: 'warning',
        description: 'Email format differs from 95% of previous executions',
        detected_at: '2024-01-15T10:25:00Z',
        confidence: 0.89
      }
    ]
  }
}
```

#### core_relationships (Workflow Connections)
```typescript
{
  relationship_type: 'step_depends_on',
  ai_confidence: 0.94,
  ai_insights: 'Strong correlation between these steps. Failure in first step predicts 78% failure rate in dependent step.',
  metadata: {
    ai_analysis: {
      correlation_strength: 0.78,
      optimal_gap_seconds: 30,
      parallel_execution_safe: false
    }
  }
}
```

#### core_dynamic_data (Extended Properties)
```typescript
{
  field_name: 'approval_threshold',
  field_value_number: 5000,
  ai_confidence: 0.83,
  ai_insights: 'This threshold is 2x higher than industry average. Consider review.',
  metadata: {
    ai_recommendations: [
      {
        type: 'optimization',
        priority: 'low',
        action: 'Adjust threshold to $2,500 based on historical approval patterns',
        reason: '87% of requests fall below $2,500',
        confidence: 0.81
      }
    ]
  }
}
```

## 2. AI Analysis Patterns

### 2.1 Run Progress Summarization

```typescript
export class AIRunAnalyzer {
  async summarizeRunProgress(runId: string): Promise<RunSummary> {
    // Get run and all steps
    const run = await universalApi.getTransaction(runId);
    const steps = await universalApi.queryTransactionLines({
      transaction_id: runId
    });
    
    // Aggregate AI metrics
    const stepConfidences = steps.data?.map(s => s.ai_confidence || 1) || [];
    const overallConfidence = this.calculateWeightedConfidence(stepConfidences);
    
    // Identify issues
    const lowConfidenceSteps = steps.data?.filter(
      s => (s.ai_confidence || 1) < 0.7
    ) || [];
    
    const anomalies = this.aggregateAnomalies(steps.data || []);
    const blockers = this.identifyBlockers(steps.data || []);
    
    // Generate summary
    const summary = await this.generateAISummary({
      run,
      steps: steps.data || [],
      overallConfidence,
      issues: [...lowConfidenceSteps, ...anomalies, ...blockers]
    });
    
    return {
      runId,
      status: run.status,
      overallConfidence,
      progressPercentage: this.calculateProgress(steps.data || []),
      estimatedCompletion: this.predictCompletion(run, steps.data || []),
      summary: summary.text,
      riskLevel: this.assessRiskLevel(overallConfidence, anomalies),
      recommendations: summary.recommendations,
      aiMetadata: {
        analysis_timestamp: new Date().toISOString(),
        model_used: 'gpt-4',
        confidence_in_analysis: summary.confidence
      }
    };
  }
  
  private calculateWeightedConfidence(confidences: number[]): number {
    if (confidences.length === 0) return 1;
    
    // Weight recent steps more heavily
    const weights = confidences.map((_, i) => Math.pow(0.9, confidences.length - i - 1));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    
    return confidences.reduce((sum, conf, i) => sum + conf * weights[i], 0) / weightSum;
  }
  
  private assessRiskLevel(
    confidence: number, 
    anomalies: any[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
    const errorAnomalies = anomalies.filter(a => a.severity === 'error').length;
    
    if (criticalAnomalies > 0 || confidence < 0.5) return 'critical';
    if (errorAnomalies > 0 || confidence < 0.7) return 'high';
    if (confidence < 0.85) return 'medium';
    return 'low';
  }
}
```

### 2.2 Anomaly Detection

```typescript
export class AIAnomalyDetector {
  async detectAnomalies(
    entityType: 'run' | 'step',
    entityId: string
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    if (entityType === 'run') {
      anomalies.push(...await this.detectRunAnomalies(entityId));
    } else {
      anomalies.push(...await this.detectStepAnomalies(entityId));
    }
    
    // Update entity with detected anomalies
    await this.updateEntityAnomalies(entityType, entityId, anomalies);
    
    return anomalies;
  }
  
  private async detectRunAnomalies(runId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    const run = await universalApi.getTransaction(runId);
    
    // Get historical runs of same playbook
    const historicalRuns = await this.getHistoricalRuns(
      run.reference_entity_id,
      run.organization_id
    );
    
    // Performance anomalies
    const avgDuration = this.calculateAverageDuration(historicalRuns);
    const currentDuration = Date.now() - new Date(run.created_at).getTime();
    
    if (currentDuration > avgDuration * 1.5) {
      anomalies.push({
        type: 'performance_anomaly',
        severity: 'warning',
        description: `Run is ${Math.round((currentDuration / avgDuration - 1) * 100)}% slower than average`,
        detected_at: new Date().toISOString(),
        confidence: 0.85,
        metrics: {
          current_duration: currentDuration,
          average_duration: avgDuration,
          percentile: this.calculatePercentile(currentDuration, historicalRuns)
        }
      });
    }
    
    // Pattern anomalies
    const inputPattern = this.extractInputPattern(run.metadata?.inputs);
    const isAnomalousInput = await this.detectInputAnomalies(
      inputPattern,
      historicalRuns
    );
    
    if (isAnomalousInput) {
      anomalies.push({
        type: 'input_pattern_anomaly',
        severity: 'warning',
        description: 'Input pattern significantly differs from historical norms',
        detected_at: new Date().toISOString(),
        confidence: 0.78,
        details: isAnomalousInput
      });
    }
    
    // Cost anomalies
    const projectedCost = await this.projectRunCost(run);
    const avgCost = this.calculateAverageCost(historicalRuns);
    
    if (projectedCost > avgCost * 2) {
      anomalies.push({
        type: 'cost_anomaly',
        severity: 'error',
        description: `Projected cost ${projectedCost} is 2x higher than average ${avgCost}`,
        detected_at: new Date().toISOString(),
        confidence: 0.82
      });
    }
    
    return anomalies;
  }
}
```

### 2.3 Risk Surfacing

```typescript
export class AIRiskAnalyzer {
  async analyzeStepRisks(stepId: string): Promise<RiskAssessment> {
    const step = await universalApi.getTransactionLine(stepId);
    const stepDef = await universalApi.getEntity(step.line_entity_id);
    
    const risks: Risk[] = [];
    
    // Low confidence risk
    if ((step.ai_confidence || 1) < 0.7) {
      risks.push({
        type: 'low_confidence',
        severity: 'high',
        description: 'AI confidence below acceptable threshold',
        impact: 'Increased likelihood of failure or incorrect output',
        mitigation: 'Manual review recommended before proceeding',
        confidence_score: step.ai_confidence || 0
      });
    }
    
    // SLA risk
    const slaSeconds = stepDef.metadata?.sla_seconds;
    const elapsedSeconds = this.calculateElapsedSeconds(step);
    
    if (slaSeconds && elapsedSeconds > slaSeconds * 0.8) {
      risks.push({
        type: 'sla_risk',
        severity: 'medium',
        description: 'Approaching SLA deadline',
        impact: 'Step may timeout or breach SLA',
        mitigation: 'Escalate to priority queue or assign additional resources',
        time_remaining: slaSeconds - elapsedSeconds
      });
    }
    
    // Dependency risk
    const dependencies = await this.analyzeDependencyRisks(step);
    risks.push(...dependencies);
    
    // Historical failure risk
    const failureRate = await this.calculateHistoricalFailureRate(
      step.line_entity_id,
      step.metadata?.inputs
    );
    
    if (failureRate > 0.2) {
      risks.push({
        type: 'high_failure_rate',
        severity: 'high',
        description: `Historical failure rate of ${(failureRate * 100).toFixed(1)}%`,
        impact: 'Step likely to fail based on historical data',
        mitigation: 'Review inputs and consider manual intervention',
        historical_failure_rate: failureRate
      });
    }
    
    return {
      stepId,
      overallRiskLevel: this.calculateOverallRisk(risks),
      risks,
      recommendations: this.generateRiskMitigations(risks),
      ai_analysis: {
        timestamp: new Date().toISOString(),
        model: 'risk-analyzer-v1',
        confidence: 0.86
      }
    };
  }
}
```

### 2.4 Proactive Nudges

```typescript
export class AIProactiveNudgeEngine {
  async generateNudges(
    organizationId: string
  ): Promise<ProactiveNudge[]> {
    const nudges: ProactiveNudge[] = [];
    
    // Get active runs
    const activeRuns = await this.getActiveRuns(organizationId);
    
    for (const run of activeRuns) {
      // Check for stalled runs
      const lastActivity = new Date(run.metadata?.last_activity_at || run.created_at);
      const stalledMinutes = (Date.now() - lastActivity.getTime()) / 1000 / 60;
      
      if (stalledMinutes > 30) {
        nudges.push({
          type: 'stalled_run',
          priority: 'high',
          target: {
            type: 'run',
            id: run.id,
            name: run.transaction_code
          },
          message: `Playbook run ${run.transaction_code} has been inactive for ${Math.round(stalledMinutes)} minutes`,
          action: 'Review and unblock',
          link: `/playbook-runs/${run.id}`,
          ai_reasoning: 'Extended inactivity detected, possible blocking issue',
          confidence: 0.91
        });
      }
      
      // Check for low confidence steps
      const lowConfidenceSteps = await this.getLowConfidenceSteps(run.id);
      
      for (const step of lowConfidenceSteps) {
        nudges.push({
          type: 'low_confidence_step',
          priority: 'medium',
          target: {
            type: 'step',
            id: step.id,
            name: step.metadata?.step_name
          },
          message: `Step "${step.metadata?.step_name}" has low AI confidence (${(step.ai_confidence * 100).toFixed(0)}%)`,
          action: 'Review step outputs',
          link: `/playbook-runs/${run.id}/steps/${step.metadata?.sequence}`,
          ai_reasoning: step.ai_insights || 'Low confidence indicates potential issues',
          confidence: step.ai_confidence
        });
      }
      
      // Check for optimization opportunities
      const optimizations = await this.findOptimizationOpportunities(run);
      nudges.push(...optimizations);
    }
    
    // Check for underutilized playbooks
    const underutilizedPlaybooks = await this.findUnderutilizedPlaybooks(organizationId);
    
    for (const playbook of underutilizedPlaybooks) {
      nudges.push({
        type: 'underutilized_playbook',
        priority: 'low',
        target: {
          type: 'playbook',
          id: playbook.id,
          name: playbook.entity_name
        },
        message: `Playbook "${playbook.entity_name}" hasn't been used in ${playbook.days_since_last_use} days`,
        action: 'Consider archiving or updating',
        link: `/playbooks/${playbook.id}`,
        ai_reasoning: 'Inactive playbooks may be outdated or redundant',
        confidence: 0.75
      });
    }
    
    return this.prioritizeNudges(nudges);
  }
  
  private async findOptimizationOpportunities(
    run: PlaybookRunTransaction
  ): Promise<ProactiveNudge[]> {
    const nudges: ProactiveNudge[] = [];
    const steps = await universalApi.queryTransactionLines({
      transaction_id: run.id
    });
    
    // Parallel execution opportunities
    const sequentialSteps = this.findParallelizableSteps(steps.data || []);
    
    if (sequentialSteps.length > 0) {
      nudges.push({
        type: 'optimization',
        priority: 'low',
        target: {
          type: 'playbook',
          id: run.reference_entity_id,
          name: 'Playbook Configuration'
        },
        message: `Steps ${sequentialSteps.join(', ')} could run in parallel, saving ~${this.estimateTimeSaved(sequentialSteps)} minutes`,
        action: 'Update playbook configuration',
        link: `/playbooks/${run.reference_entity_id}/edit`,
        ai_reasoning: 'No dependencies detected between these steps',
        confidence: 0.88
      });
    }
    
    return nudges;
  }
}
```

## 3. AI Integration Service

```typescript
export class PlaybookAIService {
  private aiProviders: Map<string, AIProvider>;
  
  constructor() {
    this.aiProviders = new Map([
      ['gpt-4', new OpenAIProvider()],
      ['claude-3', new AnthropicProvider()],
      ['gemini-pro', new GoogleAIProvider()]
    ]);
  }
  
  /**
   * Enrich entity with AI analysis
   */
  async enrichWithAI(
    entityType: string,
    entityId: string,
    context?: any
  ): Promise<void> {
    const entity = await this.getEntity(entityType, entityId);
    const provider = this.selectProvider(entityType);
    
    const analysis = await provider.analyze({
      entityType,
      entity,
      context,
      historicalData: await this.getHistoricalData(entityType, entity)
    });
    
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
    });
  }
  
  /**
   * Generate real-time insights
   */
  async generateInsights(
    runId: string
  ): Promise<RunInsights> {
    const run = await universalApi.getTransaction(runId);
    const steps = await universalApi.queryTransactionLines({
      transaction_id: runId
    });
    
    // Prepare context for AI
    const context = {
      run_status: run.status,
      started_at: run.created_at,
      step_count: steps.data?.length || 0,
      completed_steps: steps.data?.filter(s => s.metadata?.status === 'completed').length || 0,
      failed_steps: steps.data?.filter(s => s.metadata?.status === 'failed').length || 0,
      current_step: steps.data?.find(s => s.metadata?.status === 'running'),
      anomalies: this.aggregateAnomalies(run, steps.data || []),
      historical_performance: await this.getHistoricalPerformance(run.reference_entity_id)
    };
    
    // Generate insights using AI
    const prompt = this.buildInsightPrompt(context);
    const provider = this.aiProviders.get('gpt-4');
    
    const response = await provider.generateInsights(prompt);
    
    return {
      summary: response.summary,
      key_findings: response.findings,
      risk_assessment: response.risks,
      recommendations: response.recommendations,
      next_best_actions: response.actions,
      confidence: response.confidence,
      generated_at: new Date().toISOString()
    };
  }
}
```

## 4. AI Dashboard Components

### 4.1 AI Confidence Indicator

```typescript
export function AIConfidenceIndicator({ 
  confidence, 
  threshold = 0.7 
}: { 
  confidence: number;
  threshold?: number;
}) {
  const getColor = () => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= threshold) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getIcon = () => {
    if (confidence >= 0.9) return <CheckCircle className="w-5 h-5" />;
    if (confidence >= threshold) return <AlertCircle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className={getColor()}>
        {getIcon()}
      </span>
      <span className="text-sm font-medium">
        {(confidence * 100).toFixed(0)}% confidence
      </span>
      {confidence < threshold && (
        <span className="text-xs text-gray-500">
          (below {threshold * 100}% threshold)
        </span>
      )}
    </div>
  );
}
```

### 4.2 AI Insights Panel

```typescript
export function AIInsightsPanel({ 
  entityId, 
  entityType 
}: { 
  entityId: string;
  entityType: string;
}) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', entityType, entityId],
    queryFn: () => aiService.getInsights(entityType, entityId)
  });
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Assessment */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Overall Assessment
          </h4>
          <p className="text-blue-700">
            {insights.summary}
          </p>
          <AIConfidenceIndicator 
            confidence={insights.confidence} 
          />
        </div>
        
        {/* Key Findings */}
        {insights.findings.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Key Findings</h4>
            <ul className="space-y-2">
              {insights.findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-sm">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <div className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <Alert key={i}>
                  <AlertDescription>
                    {rec.action}
                    {rec.reason && (
                      <span className="text-gray-500 text-sm block mt-1">
                        {rec.reason}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
        
        {/* AI Metadata */}
        <div className="text-xs text-gray-500 border-t pt-2">
          Generated {formatRelativeTime(insights.generated_at)} using {insights.model}
        </div>
      </CardContent>
    </Card>
  );
}
```

## 5. AI Field Usage Examples

### 5.1 Detecting Run Issues

```typescript
// Query runs with low confidence
const problematicRuns = await universalApi.queryTransactions({
  filters: {
    transaction_type: 'playbook_run',
    status: 'in_progress',
    'ai_confidence': { $lt: 0.7 }
  },
  organization_id
});

// Alert on anomalies
for (const run of problematicRuns.data || []) {
  const anomalies = run.metadata?.ai_anomalies || [];
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  
  if (criticalAnomalies.length > 0) {
    await notificationService.send({
      type: 'critical_anomaly',
      target: run.metadata?.created_by,
      message: `Critical anomalies detected in run ${run.transaction_code}`,
      anomalies: criticalAnomalies
    });
  }
}
```

### 5.2 Optimizing Playbook Design

```typescript
// Analyze playbook performance
const playbookAnalysis = await aiService.analyzePlaybook(playbookId);

// Update playbook with AI recommendations
if (playbookAnalysis.recommendations.length > 0) {
  await universalApi.updateEntity(playbookId, {
    ai_confidence: playbookAnalysis.overall_confidence,
    ai_insights: playbookAnalysis.summary,
    metadata: {
      ai_recommendations: playbookAnalysis.recommendations,
      ai_optimization_score: playbookAnalysis.optimization_score,
      ai_suggested_improvements: playbookAnalysis.improvements
    }
  });
}
```

## 6. Benefits of AI-Native Architecture

1. **Proactive Problem Detection**: Issues identified before they impact business
2. **Continuous Optimization**: AI learns from every execution to improve
3. **Intelligent Automation**: Smart decisions without human intervention
4. **Risk Mitigation**: Early warning system for potential failures
5. **Performance Insights**: Deep understanding of execution patterns
6. **Adaptive Workflows**: Playbooks evolve based on AI recommendations
7. **Confidence Tracking**: Know when to trust automation vs human review
8. **Natural Language Insights**: Plain English explanations of complex patterns
9. **Predictive Analytics**: Forecast outcomes before completion
10. **Zero Additional Tables**: All AI features use HERA's 6 sacred tables