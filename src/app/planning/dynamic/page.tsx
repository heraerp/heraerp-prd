'use client'

/**
 * HERA Finance DNA v3.3: Dynamic Planning & Forecasting Demo Page
 * 
 * Interactive demo showcasing dynamic planning, rolling forecasts,
 * AI-driven variance analysis, and living financial plans.
 * 
 * Smart Code: HERA.PLAN.DEMO.PAGE.V3
 */

import React from 'react'
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
  TrendingUp, 
  Target, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  DollarSign,
  Zap,
  Brain,
  Loader2,
  Play,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Settings,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Equal
} from 'lucide-react'
import { 
  useGeneratePlan,
  useRefreshPlan,
  useAnalyzePlanVariance,
  useApprovePlan,
  usePlanActualFacts,
  useVarianceAnalysis,
  usePlanningDashboard,
  getCurrentPeriod,
  formatCurrency,
  formatVariancePct,
  getVarianceColor,
  getPlanStatusColor,
  type PlanType,
  type ApprovalAction,
  type PlanStatus,
  type VarianceCategory,
  PLANNING_DEFAULTS
} from '@/lib/planning/planning-client-v3'

// Demo organization for planning testing
const DEMO_ORG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

function DynamicPlanningContent() {
  const searchParams = useSearchParams()
  
  // State management
  const [activeTab, setActiveTab] = useState('generate')
  const [planType, setPlanType] = useState<PlanType>('FORECAST')
  const [horizonMonths, setHorizonMonths] = useState(12)
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod())
  const [dryRun, setDryRun] = useState(true)
  const [includeAIAdjustments, setIncludeAIAdjustments] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [varianceThreshold, setVarianceThreshold] = useState(5.0)
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>('APPROVE')
  const [approvalComments, setApprovalComments] = useState('')
  
  // React Query hooks
  const generateMutation = useGeneratePlan(DEMO_ORG_ID)
  const refreshMutation = useRefreshPlan(DEMO_ORG_ID)
  const varianceMutation = useAnalyzePlanVariance(DEMO_ORG_ID)
  const approvalMutation = useApprovePlan(DEMO_ORG_ID)
  
  const { data: dashboard, isLoading: dashboardLoading } = usePlanningDashboard(DEMO_ORG_ID, selectedPeriod)
  const { data: planFacts, isLoading: factsLoading } = usePlanActualFacts(DEMO_ORG_ID, { 
    period: selectedPeriod,
    limit: 20 
  })
  const { data: varianceData, isLoading: varianceLoading } = useVarianceAnalysis(DEMO_ORG_ID, { 
    period: selectedPeriod,
    limit: 10 
  })

  // URL parameter handling
  useEffect(() => {
    const urlPeriod = searchParams.get('period')
    const urlPlanType = searchParams.get('plan_type') as PlanType
    const urlTab = searchParams.get('tab')
    
    if (urlPeriod) setSelectedPeriod(urlPeriod)
    if (urlPlanType && PLANNING_DEFAULTS.PLAN_TYPES.includes(urlPlanType)) setPlanType(urlPlanType)
    if (urlTab) setActiveTab(urlTab)
  }, [searchParams])

  // Handle plan generation
  const handleGeneratePlan = async () => {
    try {
      await generateMutation.mutateAsync({
        plan_type: planType,
        horizon_months: horizonMonths,
        plan_metadata: {
          description: `${planType} plan generated for demo`,
          created_via: 'DEMO_UI'
        },
        dry_run: dryRun
      })
      setActiveTab('results')
    } catch (error) {
      console.error('Plan generation failed:', error)
    }
  }

  // Handle plan refresh
  const handleRefreshPlan = async () => {
    if (!selectedPlanId) return
    
    try {
      await refreshMutation.mutateAsync({
        plan_id: selectedPlanId,
        refresh_horizon_months: horizonMonths,
        include_ai_adjustments: includeAIAdjustments,
        dry_run: dryRun
      })
      setActiveTab('results')
    } catch (error) {
      console.error('Plan refresh failed:', error)
    }
  }

  // Handle variance analysis
  const handleAnalyzeVariance = async () => {
    if (!selectedPlanId) return
    
    try {
      await varianceMutation.mutateAsync({
        plan_id: selectedPlanId,
        actual_period: selectedPeriod,
        variance_threshold_pct: varianceThreshold,
        include_ai_explanation: true
      })
      setActiveTab('variance')
    } catch (error) {
      console.error('Variance analysis failed:', error)
    }
  }

  // Handle plan approval
  const handleApprovePlan = async () => {
    if (!selectedPlanId) return
    
    try {
      await approvalMutation.mutateAsync({
        plan_id: selectedPlanId,
        approval_action: approvalAction,
        approval_comments: approvalComments || undefined
      })
      setActiveTab('results')
    } catch (error) {
      console.error('Plan approval failed:', error)
    }
  }

  // Get variance icon
  const getVarianceIcon = (category: VarianceCategory) => {
    switch (category) {
      case 'FAVORABLE': return <ArrowUpRight className="w-4 h-4 text-green-500" />
      case 'UNFAVORABLE': return <ArrowDownRight className="w-4 h-4 text-red-500" />
      case 'ON_TRACK': return <Equal className="w-4 h-4 text-blue-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  // Get plan type icon
  const getPlanTypeIcon = (type: PlanType) => {
    switch (type) {
      case 'BUDGET': return <Target className="w-4 h-4" />
      case 'FORECAST': return <TrendingUp className="w-4 h-4" />
      case 'ROLLING_FORECAST': return <RefreshCw className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const isGenerating = generateMutation.isPending || refreshMutation.isPending || 
                      varianceMutation.isPending || approvalMutation.isPending

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            Dynamic Planning & Forecasting v3.3
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-driven rolling forecasts with living financial plans - Transform static budgets into continuous intelligence
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Demo Mode • Org: {DEMO_ORG_ID.slice(0, 8)}...
        </Badge>
      </div>

      {/* Dashboard Summary */}
      {dashboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Planning Dashboard - {selectedPeriod}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{dashboard.total_plans}</div>
                <div className="text-sm text-muted-foreground">Total Plans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {formatCurrency(dashboard.total_plan_amount)}
                </div>
                <div className="text-sm text-muted-foreground">Plan Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {formatVariancePct(dashboard.total_variance_pct)}
                </div>
                <div className="text-sm text-muted-foreground">Total Variance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{dashboard.significant_variances}</div>
                <div className="text-sm text-muted-foreground">Significant Variances</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="refresh" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </TabsTrigger>
          <TabsTrigger value="variance" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Variance
          </TabsTrigger>
          <TabsTrigger value="approve" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approve
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Generate Plan Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Generate Dynamic Plan
              </CardTitle>
              <CardDescription>
                Create AI-driven budgets and forecasts with rolling horizon planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Type */}
                <div className="space-y-2">
                  <Label htmlFor="plan-type">Plan Type</Label>
                  <Select value={planType} onValueChange={(v) => setPlanType(v as PlanType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUDGET">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Budget (Annual)
                        </div>
                      </SelectItem>
                      <SelectItem value="FORECAST">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Forecast (Predictive)
                        </div>
                      </SelectItem>
                      <SelectItem value="ROLLING_FORECAST">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Rolling Forecast
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Horizon Months */}
                <div className="space-y-2">
                  <Label htmlFor="horizon">Planning Horizon (Months)</Label>
                  <Input
                    id="horizon"
                    type="number"
                    min="1"
                    max="24"
                    value={horizonMonths}
                    onChange={(e) => setHorizonMonths(parseInt(e.target.value))}
                  />
                </div>

                {/* Period */}
                <div className="space-y-2">
                  <Label htmlFor="period">Start Period</Label>
                  <Input
                    id="period"
                    type="text"
                    placeholder="YYYY-MM"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 pt-4 border-t">
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

              {/* Generate Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {dryRun ? 'Preview plan generation without persistence' : 'Generate and persist plan with audit trail'}
                </div>
                <Button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="min-w-32"
                >
                  {generateMutation.isPending ? (
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

        {/* Refresh Plan Tab */}
        <TabsContent value="refresh" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Refresh Rolling Forecast
              </CardTitle>
              <CardDescription>
                Update existing plans with latest actuals and AI-driven trend adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plan ID */}
                <div className="space-y-2">
                  <Label htmlFor="plan-id">Plan ID</Label>
                  <Input
                    id="plan-id"
                    placeholder="Enter plan entity ID"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="font-mono"
                  />
                </div>

                {/* Horizon */}
                <div className="space-y-2">
                  <Label htmlFor="refresh-horizon">Refresh Horizon (Months)</Label>
                  <Input
                    id="refresh-horizon"
                    type="number"
                    min="1"
                    max="24"
                    value={horizonMonths}
                    onChange={(e) => setHorizonMonths(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ai-adjustments"
                    checked={includeAIAdjustments}
                    onCheckedChange={setIncludeAIAdjustments}
                  />
                  <Label htmlFor="ai-adjustments" className="cursor-pointer">
                    Include AI Trend Adjustments
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="refresh-dry-run"
                    checked={dryRun}
                    onCheckedChange={setDryRun}
                  />
                  <Label htmlFor="refresh-dry-run" className="cursor-pointer">
                    Preview Mode (Dry Run)
                  </Label>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Refresh forecast with latest performance trends and AI insights
                </div>
                <Button
                  onClick={handleRefreshPlan}
                  disabled={isGenerating || !selectedPlanId}
                  className="min-w-32"
                >
                  {refreshMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variance Analysis Tab */}
        <TabsContent value="variance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Plan vs Actual Variance Analysis
              </CardTitle>
              <CardDescription>
                AI-powered variance analysis with explanations and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan ID */}
                <div className="space-y-2">
                  <Label htmlFor="variance-plan-id">Plan ID</Label>
                  <Input
                    id="variance-plan-id"
                    placeholder="Enter plan entity ID"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="font-mono"
                  />
                </div>

                {/* Period */}
                <div className="space-y-2">
                  <Label htmlFor="variance-period">Actual Period</Label>
                  <Input
                    id="variance-period"
                    placeholder="YYYY-MM"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="font-mono"
                  />
                </div>

                {/* Threshold */}
                <div className="space-y-2">
                  <Label htmlFor="variance-threshold">Variance Threshold (%)</Label>
                  <Input
                    id="variance-threshold"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={varianceThreshold}
                    onChange={(e) => setVarianceThreshold(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Compare planned vs actual performance with AI-driven explanations
                </div>
                <Button
                  onClick={handleAnalyzeVariance}
                  disabled={isGenerating || !selectedPlanId}
                  className="min-w-32"
                >
                  {varianceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyze Variance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Variance Results */}
          {varianceData && varianceData.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Variance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {varianceData.data.slice(0, 3).map((variance: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">
                            {variance.metadata?.actual_period} Analysis
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Plan ID: {variance.metadata?.plan_id?.slice(0, 8)}...
                          </p>
                        </div>
                        <Badge variant="outline">
                          {variance.metadata?.variance_summary?.analysis_quality || 'MEDIUM'}
                        </Badge>
                      </div>
                      
                      {variance.metadata?.variance_summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold">
                              {formatCurrency(variance.metadata.variance_summary.total_variance_amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Variance</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {formatVariancePct(variance.metadata.variance_summary.total_variance_pct)}
                            </div>
                            <div className="text-xs text-muted-foreground">Variance %</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {variance.metadata.variance_summary.significant_variances}
                            </div>
                            <div className="text-xs text-muted-foreground">Significant</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {variance.metadata.variance_summary.plan_lines_analyzed}
                            </div>
                            <div className="text-xs text-muted-foreground">Lines Analyzed</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Approval Tab */}
        <TabsContent value="approve" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Plan Approval Workflow
              </CardTitle>
              <CardDescription>
                Multi-level approval process with policy compliance validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plan ID */}
                <div className="space-y-2">
                  <Label htmlFor="approval-plan-id">Plan ID</Label>
                  <Input
                    id="approval-plan-id"
                    placeholder="Enter plan entity ID"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="font-mono"
                  />
                </div>

                {/* Approval Action */}
                <div className="space-y-2">
                  <Label htmlFor="approval-action">Approval Action</Label>
                  <Select value={approvalAction} onValueChange={(v) => setApprovalAction(v as ApprovalAction)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVE">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                          Approve
                        </div>
                      </SelectItem>
                      <SelectItem value="REJECT">
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="w-4 h-4 text-red-500" />
                          Reject
                        </div>
                      </SelectItem>
                      <SelectItem value="REQUEST_CHANGES">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-orange-500" />
                          Request Changes
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="approval-comments">Approval Comments</Label>
                <Textarea
                  id="approval-comments"
                  placeholder="Add approval comments or feedback..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Approve Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Submit approval decision with policy compliance validation
                </div>
                <Button
                  onClick={handleApprovePlan}
                  disabled={isGenerating || !selectedPlanId}
                  variant={approvalAction === 'APPROVE' ? 'default' : 
                          approvalAction === 'REJECT' ? 'destructive' : 'secondary'}
                  className="min-w-32"
                >
                  {approvalMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {approvalAction === 'APPROVE' && <ThumbsUp className="w-4 h-4 mr-2" />}
                      {approvalAction === 'REJECT' && <ThumbsDown className="w-4 h-4 mr-2" />}
                      {approvalAction === 'REQUEST_CHANGES' && <MessageSquare className="w-4 h-4 mr-2" />}
                      {approvalAction === 'APPROVE' ? 'Approve Plan' :
                       approvalAction === 'REJECT' ? 'Reject Plan' : 'Request Changes'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {/* Generation Results */}
          {generateMutation.isSuccess && generateMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Plan Generation Complete
                </CardTitle>
                <CardDescription>
                  {generateMutation.data.plan_type} plan generated successfully with AI-driven insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {generateMutation.data.plan_lines_generated}
                    </div>
                    <div className="text-sm text-muted-foreground">Plan Lines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {generateMutation.data.processing_time_ms}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Processing Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {generateMutation.data.ai_insights_used}
                    </div>
                    <div className="text-sm text-muted-foreground">AI Insights</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {(generateMutation.data.forecast_accuracy_mape * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Forecast Accuracy</div>
                  </div>
                </div>
                
                {generateMutation.data.approval_required && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This plan requires approval due to significant variance thresholds. Plan ID: {generateMutation.data.plan_entity_id}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Plan vs Actual Facts */}
          {planFacts && planFacts.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Plan vs Actual Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planFacts.data.slice(0, 5).map((fact, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{fact.gl_account_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {fact.period} • {fact.profit_center_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getVarianceIcon(fact.variance_category)}
                          <Badge className={getPlanStatusColor(fact.plan_status)}>
                            {fact.plan_status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(fact.plan_amount)}</div>
                          <div className="text-xs text-muted-foreground">Plan</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(fact.actual_amount)}</div>
                          <div className="text-xs text-muted-foreground">Actual</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${getVarianceColor(fact.variance_category)}`}>
                            {formatVariancePct(fact.variance_pct)}
                          </div>
                          <div className="text-xs text-muted-foreground">Variance</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function DynamicPlanningDemoPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-500" />
              Dynamic Planning & Forecasting v3.3
            </h1>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    }>
      <DynamicPlanningContent />
    </Suspense>
  )
}