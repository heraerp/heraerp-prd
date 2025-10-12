'use client'

/**
 * HERA Finance DNA v3: AI Insights Engine Demo Page
 * 
 * Interactive demo page for AI insights generation with period input,
 * insight display, and complete audit trail visualization.
 * Revolutionary self-optimizing ERP intelligence demonstration.
 * 
 * Smart Code: HERA.AI.INSIGHT.DEMO.PAGE.V3
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Bot, 
  Sparkles, 
  Clock, 
  Database,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Play,
  Eye,
  Download,
  BarChart3,
  LineChart
} from 'lucide-react'
import { 
  useGenerateInsights,
  usePreviewInsights,
  useAIInsights,
  useRecentInsights,
  useInsightsSummary,
  type AIInsightType,
  type AIIntelligenceLevel,
  getCurrentPeriod,
  getConfidenceLevel
} from '@/lib/ai/ai-insights-client'

// Demo organization for insights testing
const DEMO_ORG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // Would be from auth context in real app

export default function AIInsightsDemoPage() {
  const searchParams = useSearchParams()
  
  // State management
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [selectedInsightTypes, setSelectedInsightTypes] = useState<AIInsightType[]>(['DESCRIPTIVE'])
  const [intelligenceLevel, setIntelligenceLevel] = useState<AIIntelligenceLevel>(1)
  const [dryRun, setDryRun] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)
  const [activeTab, setActiveTab] = useState('generate')
  
  // React Query hooks
  const generateMutation = useGenerateInsights(DEMO_ORG_ID)
  const previewMutation = usePreviewInsights(DEMO_ORG_ID)
  const { data: recentInsights, isLoading: recentLoading } = useRecentInsights(DEMO_ORG_ID, 10)
  const { data: currentInsights, isLoading: currentLoading } = useAIInsights(DEMO_ORG_ID, { 
    period, 
    limit: 20 
  })
  const { data: summary, isLoading: summaryLoading } = useInsightsSummary(DEMO_ORG_ID, period)

  // URL parameter handling
  useEffect(() => {
    const urlPeriod = searchParams.get('period')
    const urlTypes = searchParams.get('types')
    const urlLevel = searchParams.get('level')
    
    if (urlPeriod) setPeriod(urlPeriod)
    if (urlTypes) {
      const types = urlTypes.split(',') as AIInsightType[]
      setSelectedInsightTypes(types)
    }
    if (urlLevel) {
      const level = parseInt(urlLevel) as AIIntelligenceLevel
      if (level >= 1 && level <= 4) setIntelligenceLevel(level)
    }
  }, [searchParams])

  // Handle insight generation
  const handleGenerate = async () => {
    try {
      if (dryRun) {
        await previewMutation.mutateAsync({
          period,
          insight_types: selectedInsightTypes,
          intelligence_level: intelligenceLevel
        })
      } else {
        await generateMutation.mutateAsync({
          period,
          insight_types: selectedInsightTypes,
          intelligence_level: intelligenceLevel,
          confidence_threshold: confidenceThreshold,
          dry_run: false
        })
      }
      
      // Switch to results tab after generation
      setActiveTab('results')
    } catch (error) {
      console.error('Insight generation failed:', error)
    }
  }

  // Get insight type icon
  const getInsightIcon = (type: AIInsightType) => {
    switch (type) {
      case 'DESCRIPTIVE': return <BarChart3 className="w-4 h-4" />
      case 'PREDICTIVE': return <TrendingUp className="w-4 h-4" />
      case 'PRESCRIPTIVE': return <Target className="w-4 h-4" />
      case 'AUTONOMOUS': return <Bot className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  // Get confidence color
  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'bg-emerald-500'
    if (score >= 0.8) return 'bg-blue-500'
    if (score >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Format processing time
  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const isGenerating = generateMutation.isPending || previewMutation.isPending
  const generationResult = dryRun ? previewMutation.data : generateMutation.data

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-500" />
            AI Insights Engine v3
          </h1>
          <p className="text-muted-foreground mt-2">
            Revolutionary self-optimizing ERP intelligence layer - Transform reactive to predictive
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Demo Mode • Org: {DEMO_ORG_ID.slice(0, 8)}...
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            All Insights
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Insight Generation Configuration
              </CardTitle>
              <CardDescription>
                Configure AI parameters to generate business intelligence insights from your profitability data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Period Input */}
                <div className="space-y-2">
                  <Label htmlFor="period">Target Period</Label>
                  <Input
                    id="period"
                    type="text"
                    placeholder="YYYY-MM"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Format: YYYY-MM (e.g., 2024-12)
                  </p>
                </div>

                {/* Intelligence Level */}
                <div className="space-y-2">
                  <Label htmlFor="level">Intelligence Level</Label>
                  <Select value={String(intelligenceLevel)} onValueChange={(v) => setIntelligenceLevel(parseInt(v) as AIIntelligenceLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Descriptive Only</SelectItem>
                      <SelectItem value="2">Level 2 - Descriptive + Predictive</SelectItem>
                      <SelectItem value="3">Level 3 - + Prescriptive</SelectItem>
                      <SelectItem value="4">Level 4 - + Autonomous</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Higher levels unlock more advanced AI capabilities
                  </p>
                </div>
              </div>

              {/* Insight Types */}
              <div className="space-y-3">
                <Label>Insight Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    { type: 'DESCRIPTIVE', label: 'Descriptive', icon: BarChart3, minLevel: 1 },
                    { type: 'PREDICTIVE', label: 'Predictive', icon: TrendingUp, minLevel: 2 },
                    { type: 'PRESCRIPTIVE', label: 'Prescriptive', icon: Target, minLevel: 3 },
                    { type: 'AUTONOMOUS', label: 'Autonomous', icon: Bot, minLevel: 4 }
                  ] as const).map(({ type, label, icon: Icon, minLevel }) => {
                    const isDisabled = intelligenceLevel < minLevel
                    const isSelected = selectedInsightTypes.includes(type)
                    
                    return (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedInsightTypes([...selectedInsightTypes, type])
                            } else {
                              setSelectedInsightTypes(selectedInsightTypes.filter(t => t !== type))
                            }
                          }}
                        />
                        <Label 
                          htmlFor={type} 
                          className={`flex items-center gap-2 cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                          {isDisabled && (
                            <Badge variant="outline" className="text-xs">
                              L{minLevel}+
                            </Badge>
                          )}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Advanced Options</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="confidence">Confidence Threshold</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="confidence"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        ({(confidenceThreshold * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dry-run"
                      checked={dryRun}
                      onCheckedChange={setDryRun}
                    />
                    <Label htmlFor="dry-run" className="cursor-pointer">
                      Preview Mode (Dry Run)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {dryRun ? 'Preview insights without persistence' : 'Generate and persist insights to audit trail'}
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedInsightTypes.length === 0}
                  className="min-w-32"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      {dryRun ? <Eye className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {dryRun ? 'Preview' : 'Generate'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {generationResult ? (
            <>
              {/* Generation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Generation Complete
                  </CardTitle>
                  <CardDescription>
                    AI insights generated for period {period} with {selectedInsightTypes.join(', ')} intelligence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {generationResult.insights_generated || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Insights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {formatProcessingTime(generationResult.processing_time_ms || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Processing Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">
                        {generationResult.data_foundation?.fact_count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Data Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">
                        L{intelligenceLevel}
                      </div>
                      <div className="text-sm text-muted-foreground">Intelligence Level</div>
                    </div>
                  </div>
                  
                  {generationResult.intelligence_layers && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-3">Intelligence Layers</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(generationResult.intelligence_layers).map(([type, count]) => (
                          <div key={type} className="flex items-center gap-2">
                            {getInsightIcon(type.toUpperCase() as AIInsightType)}
                            <span className="text-sm capitalize">{type}:</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview Insights (Dry Run) */}
              {dryRun && generationResult.preview_insights && (
                <div className="space-y-4">
                  {Object.entries(generationResult.preview_insights).map(([type, insights]) => (
                    insights && insights.length > 0 && (
                      <Card key={type}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 capitalize">
                            {getInsightIcon(type.toUpperCase() as AIInsightType)}
                            {type} Insights Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {insights.map((insight: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium">{insight.insight_title}</h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(insight.confidence_score)}`} />
                                    <Badge variant="outline" className="text-xs">
                                      {(insight.confidence_score * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {insight.insight_description}
                                </p>
                                {insight.data_points && (
                                  <div className="text-xs font-mono bg-muted p-2 rounded">
                                    {JSON.stringify(insight.data_points, null, 2)}
                                  </div>
                                )}
                                {insight.recommendations && insight.recommendations.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium">Recommendations:</h5>
                                    {insight.recommendations.map((rec: any, recIndex: number) => (
                                      <div key={recIndex} className="text-sm pl-4 border-l-2 border-blue-200">
                                        <div className="font-medium">{rec.action}</div>
                                        <div className="text-muted-foreground">{rec.description}</div>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            Impact: {rec.impact_aed ? `AED ${rec.impact_aed.toLocaleString()}` : 'N/A'}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            Priority: {rec.priority}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground font-mono">
                                  Smart Code: {insight.smart_code}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              )}

              {/* Success Message (Non-Dry Run) */}
              {!dryRun && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insights successfully generated and persisted to universal transactions with run ID: {generationResult.run_id}
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    No generation results yet. Use the Generate tab to create AI insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                All Insights for {period}
              </CardTitle>
              <CardDescription>
                Complete audit trail of AI-generated insights stored in universal transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading insights...</span>
                </div>
              ) : currentInsights?.data && currentInsights.data.length > 0 ? (
                <div className="space-y-4">
                  {currentInsights.data.map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.insight_type)}
                          <h4 className="font-medium">{insight.insight_title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.insight_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(insight.confidence_score)}`} />
                          <Badge variant="outline" className="text-xs">
                            {(insight.confidence_score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.insight_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Generated: {new Date(insight.generated_at).toLocaleString()}</span>
                        <span>Run: {insight.transaction_id?.slice(0, 8)}...</span>
                        <span>Smart Code: {insight.smart_code}</span>
                      </div>
                    </div>
                  ))}
                  
                  {currentInsights.has_more && (
                    <div className="text-center pt-4">
                      <Button variant="outline">Load More Insights</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No insights found for period {period}. Generate some insights to see them here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Insights Analytics Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading analytics...</span>
                </div>
              ) : summary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{summary.total_insights}</div>
                    <div className="text-sm text-muted-foreground">Total Insights</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(summary.avg_confidence * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{summary.high_confidence_count}</div>
                    <div className="text-sm text-muted-foreground">High Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {summary.last_generated_at ? new Date(summary.last_generated_at).toLocaleDateString() : 'Never'}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Generated</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analytics data available for this period.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Insights Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading recent activity...</span>
                </div>
              ) : recentInsights && recentInsights.length > 0 ? (
                <div className="space-y-3">
                  {recentInsights.slice(0, 5).map((insight) => (
                    <div key={insight.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        {getInsightIcon(insight.insight_type)}
                        <div>
                          <div className="font-medium text-sm">{insight.insight_title}</div>
                          <div className="text-xs text-muted-foreground">{insight.insight_category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getConfidenceColor(insight.confidence_score)}`} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(insight.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent insights activity found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}