'use client'

// Skip SSG for this page - uses useSearchParams
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * HERA Finance DNA v3.4: Cross-Org Consolidation Demo Page
 * 
 * Interactive demo showcasing IFRS 10 compliant multi-entity consolidation
 * with elimination, translation, aggregation, and reconciliation operations.
 * 
 * Smart Code: HERA.CONSOL.DEMO.PAGE.V3
 */

import { useState, useEffect, Suspense } from 'react'
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
  Building2,
  Globe,
  Calculator,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Loader2,
  Play,
  Eye,
  RefreshCw,
  GitMerge,
  Zap,
  Shield,
  DollarSign,
  Percent,
  Clock,
  Info
} from 'lucide-react'
import { 
  usePrepareConsolidation,
  useEliminateIntercompany,
  useTranslateForeignCurrency,
  useAggregateConsolidation,
  useReconcileConsolidation,
  useCompleteConsolidation,
  useConsolidatedFacts,
  useSegmentNotes,
  useFxTranslationDifferences,
  formatCurrency,
  formatPercentage,
  getVarianceColor,
  getConsolidationStatusColor,
  getCurrentPeriod,
  CONSOLIDATION_DEFAULTS,
  type ConsolidationMethod,
  type TranslationMethod,
  type ConsolidationRunRequest
} from '@/lib/consolidation/consolidation-client-v3'

// Demo organization for consolidation testing
const DEMO_ORG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const DEMO_GROUP_ID = 'group-multinational-corp-demo'

function ConsolidationDemoClient() {
  const searchParams = useSearchParams()
  
  // State management
  const [activeTab, setActiveTab] = useState('prepare')
  const [groupId, setGroupId] = useState(DEMO_GROUP_ID)
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [baseCurrency, setBaseCurrency] = useState(CONSOLIDATION_DEFAULTS.BASE_CURRENCY)
  const [consolidationMethod, setConsolidationMethod] = useState(CONSOLIDATION_DEFAULTS.CONSOLIDATION_METHOD)
  const [translationMethod, setTranslationMethod] = useState(CONSOLIDATION_DEFAULTS.TRANSLATION_METHOD)
  const [dryRun, setDryRun] = useState(true)
  const [toleranceAmount, setToleranceAmount] = useState(CONSOLIDATION_DEFAULTS.TOLERANCE_AMOUNT)
  const [autoAdjust, setAutoAdjust] = useState(CONSOLIDATION_DEFAULTS.AUTO_ADJUST)
  const [completionProgress, setCompletionProgress] = useState(0)
  
  // React Query hooks
  const prepareMutation = usePrepareConsolidation(DEMO_ORG_ID)
  const eliminateMutation = useEliminateIntercompany(DEMO_ORG_ID)
  const translateMutation = useTranslateForeignCurrency(DEMO_ORG_ID)
  const aggregateMutation = useAggregateConsolidation(DEMO_ORG_ID)
  const reconcileMutation = useReconcileConsolidation(DEMO_ORG_ID)
  const completeMutation = useCompleteConsolidation(DEMO_ORG_ID)
  
  const { data: consolidatedFacts, isLoading: factsLoading } = useConsolidatedFacts(
    DEMO_ORG_ID, groupId, period, { limit: 10 }
  )
  const { data: segmentNotes, isLoading: segmentsLoading } = useSegmentNotes(
    DEMO_ORG_ID, groupId, period, { reportableOnly: true, limit: 5 }
  )
  const { data: fxDifferences, isLoading: fxLoading } = useFxTranslationDifferences(
    DEMO_ORG_ID, groupId, period, { materialityLevel: 'HIGH', limit: 5 }
  )

  // URL parameter handling
  useEffect(() => {
    const urlGroupId = searchParams.get('group_id')
    const urlPeriod = searchParams.get('period')
    const urlTab = searchParams.get('tab')
    
    if (urlGroupId) setGroupId(urlGroupId)
    if (urlPeriod) setPeriod(urlPeriod)
    if (urlTab) setActiveTab(urlTab)
  }, [searchParams])

  // Base request object
  const baseRequest: ConsolidationRunRequest = {
    group_id: groupId,
    period,
    base_currency: baseCurrency,
    dry_run: dryRun
  }

  // Handle individual consolidation steps
  const handlePrepareConsolidation = async () => {
    try {
      await prepareMutation.mutateAsync(baseRequest)
      setActiveTab('results')
    } catch (error) {
      console.error('Consolidation preparation failed:', error)
    }
  }

  const handleEliminateIntercompany = async () => {
    try {
      await eliminateMutation.mutateAsync(baseRequest)
      setActiveTab('results')
    } catch (error) {
      console.error('Intercompany elimination failed:', error)
    }
  }

  const handleTranslateForeignCurrency = async () => {
    try {
      await translateMutation.mutateAsync({
        ...baseRequest,
        translation_method: translationMethod
      })
      setActiveTab('results')
    } catch (error) {
      console.error('FX translation failed:', error)
    }
  }

  const handleAggregateConsolidation = async () => {
    try {
      await aggregateMutation.mutateAsync({
        ...baseRequest,
        consolidation_level: consolidationMethod
      })
      setActiveTab('results')
    } catch (error) {
      console.error('Consolidation aggregation failed:', error)
    }
  }

  const handleReconcileConsolidation = async () => {
    try {
      await reconcileMutation.mutateAsync({
        ...baseRequest,
        tolerance_amount: toleranceAmount,
        auto_adjust: autoAdjust
      })
      setActiveTab('results')
    } catch (error) {
      console.error('Consolidation reconciliation failed:', error)
    }
  }

  const handleCompleteConsolidation = async () => {
    try {
      setCompletionProgress(0)
      
      // Simulate progress updates
      const progressTimer = setInterval(() => {
        setCompletionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer)
            return 90
          }
          return prev + 18 // 5 steps = 18% each
        })
      }, 1000)

      await completeMutation.mutateAsync(baseRequest)
      
      clearInterval(progressTimer)
      setCompletionProgress(100)
      setActiveTab('results')
    } catch (error) {
      console.error('Complete consolidation failed:', error)
      setCompletionProgress(0)
    }
  }

  // Get variance icon
  const getVarianceIcon = (direction: string) => {
    switch (direction) {
      case 'FAVORABLE': return <ArrowUpRight className="w-4 h-4 text-green-500" />
      case 'UNFAVORABLE': return <ArrowDownRight className="w-4 h-4 text-red-500" />
      case 'NEUTRAL': return <Equal className="w-4 h-4 text-blue-500" />
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />
    }
  }

  const isProcessing = prepareMutation.isPending || eliminateMutation.isPending || 
                     translateMutation.isPending || aggregateMutation.isPending ||
                     reconcileMutation.isPending || completeMutation.isPending

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            Cross-Org Consolidation v3.4
          </h1>
          <p className="text-muted-foreground mt-2">
            IFRS 10 compliant multi-entity consolidation with elimination, translation, and reconciliation
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Demo Mode • Group: {groupId.slice(0, 20)}...
        </Badge>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Consolidation Configuration
          </CardTitle>
          <CardDescription>
            Configure group, period, currencies, and consolidation parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group-id">Group ID</Label>
              <Input
                id="group-id"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="Enter group entity ID"
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                type="text"
                placeholder="YYYY-MM"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-currency">Base Currency</Label>
              <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tolerance">Tolerance Amount</Label>
              <Input
                id="tolerance"
                type="number"
                min="0"
                step="0.01"
                value={toleranceAmount}
                onChange={(e) => setToleranceAmount(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 mt-4 pt-4 border-t">
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-adjust"
                checked={autoAdjust}
                onCheckedChange={setAutoAdjust}
              />
              <Label htmlFor="auto-adjust" className="cursor-pointer">
                Auto-adjust Variances
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="prepare" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Prepare
          </TabsTrigger>
          <TabsTrigger value="eliminate" className="flex items-center gap-2">
            <GitMerge className="w-4 h-4" />
            Eliminate
          </TabsTrigger>
          <TabsTrigger value="translate" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Translate
          </TabsTrigger>
          <TabsTrigger value="aggregate" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Aggregate
          </TabsTrigger>
          <TabsTrigger value="reconcile" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Reconcile
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Complete Consolidation Action */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Complete Consolidation Run</h3>
                <p className="text-sm text-muted-foreground">
                  Execute all 5 consolidation steps in sequence: Prepare → Eliminate → Translate → Aggregate → Reconcile
                </p>
              </div>
              <Button
                onClick={handleCompleteConsolidation}
                disabled={isProcessing || !groupId || !period}
                size="lg"
                className="min-w-40"
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Complete Consolidation
                  </>
                )}
              </Button>
            </div>
            
            {completeMutation.isPending && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Consolidation Progress</span>
                  <span>{completionProgress}%</span>
                </div>
                <Progress value={completionProgress} className="mt-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prepare Tab */}
        <TabsContent value="prepare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Consolidation Preparation
              </CardTitle>
              <CardDescription>
                Validate group structure, FX rates, elimination pairs, and consolidation policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Validation Mode</Label>
                  <Badge variant="outline">Strict Validation</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Policy Compliance</Label>
                  <Badge variant="outline">IFRS 10</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Group Validation</Label>
                  <Badge variant="outline">Complete</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Validate consolidation structure and prepare member entity cache
                </div>
                <Button
                  onClick={handlePrepareConsolidation}
                  disabled={isProcessing || !groupId || !period}
                  className="min-w-32"
                >
                  {prepareMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Prepare
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eliminate Tab */}
        <TabsContent value="eliminate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitMerge className="w-5 h-5" />
                Intercompany Elimination
              </CardTitle>
              <CardDescription>
                Eliminate intercompany transactions and balances with balanced entries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Elimination Types</Label>
                  <Badge variant="outline">Revenue/COGS</Badge>
                  <Badge variant="outline" className="ml-2">AR/AP</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Balance Validation</Label>
                  <Badge variant="outline">Automatic</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Audit Trail</Label>
                  <Badge variant="outline">Complete</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Create balanced elimination entries for intercompany transactions
                </div>
                <Button
                  onClick={handleEliminateIntercompany}
                  disabled={isProcessing || !groupId || !period}
                  className="min-w-32"
                >
                  {eliminateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Eliminating...
                    </>
                  ) : (
                    <>
                      <GitMerge className="w-4 h-4 mr-2" />
                      Eliminate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Translate Tab */}
        <TabsContent value="translate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Foreign Currency Translation
              </CardTitle>
              <CardDescription>
                IFRS 21 compliant FX translation with cumulative translation adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="translation-method">Translation Method</Label>
                  <Select value={translationMethod} onValueChange={(v) => setTranslationMethod(v as TranslationMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CURRENT_RATE">Current Rate Method</SelectItem>
                      <SelectItem value="TEMPORAL">Temporal Method</SelectItem>
                      <SelectItem value="NET_INVESTMENT">Net Investment Method</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>IFRS 21 Compliance</Label>
                  <Badge variant="outline">Validated</Badge>
                </div>
                <div className="space-y-2">
                  <Label>CTA to OCI</Label>
                  <Badge variant="outline">Automatic</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Translate foreign currency amounts with cumulative translation adjustment
                </div>
                <Button
                  onClick={handleTranslateForeignCurrency}
                  disabled={isProcessing || !groupId || !period}
                  className="min-w-32"
                >
                  {translateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Translate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aggregate Tab */}
        <TabsContent value="aggregate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Financial Aggregation
              </CardTitle>
              <CardDescription>
                Combine member entity data with eliminations and translations for consolidated view
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consolidation-method">Consolidation Method</Label>
                  <Select value={consolidationMethod} onValueChange={(v) => setConsolidationMethod(v as ConsolidationMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL">Full Consolidation</SelectItem>
                      <SelectItem value="PROPORTIONATE">Proportionate</SelectItem>
                      <SelectItem value="EQUITY">Equity Method</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>NCI Calculation</Label>
                  <Badge variant="outline">Automatic</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Ownership Weighting</Label>
                  <Badge variant="outline">Dynamic</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Aggregate member entity financials with consolidation adjustments
                </div>
                <Button
                  onClick={handleAggregateConsolidation}
                  disabled={isProcessing || !groupId || !period}
                  className="min-w-32"
                >
                  {aggregateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Aggregating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Aggregate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconcile Tab */}
        <TabsContent value="reconcile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Consolidation Reconciliation
              </CardTitle>
              <CardDescription>
                Validate consolidation entries and ensure mathematical accuracy with IFRS 10 compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tolerance: {formatCurrency(toleranceAmount)}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={toleranceAmount}
                    onChange={(e) => setToleranceAmount(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance Sheet Check</Label>
                  <Badge variant="outline">Assets = Liab + Equity</Badge>
                </div>
                <div className="space-y-2">
                  <Label>IFRS 10 Compliance</Label>
                  <Badge variant="outline">Validated</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Reconcile all consolidation entries and validate mathematical accuracy
                </div>
                <Button
                  onClick={handleReconcileConsolidation}
                  disabled={isProcessing || !groupId || !period}
                  className="min-w-32"
                >
                  {reconcileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reconciling...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Reconcile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {/* Completion Results */}
          {completeMutation.isSuccess && completeMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Complete Consolidation Results
                </CardTitle>
                <CardDescription>
                  All 5 consolidation steps completed successfully with IFRS 10 compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {completeMutation.data.prepare.preparation_summary.member_count}
                    </div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {completeMutation.data.eliminate.elimination_summary.elimination_entries_created}
                    </div>
                    <div className="text-sm text-muted-foreground">Eliminations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {completeMutation.data.translate.members_translated}
                    </div>
                    <div className="text-sm text-muted-foreground">Translated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {formatCurrency(completeMutation.data.aggregate.total_consolidated_amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">Consolidated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-500">
                      {completeMutation.data.totalProcessingTimeMs}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Total Time</div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">
                      Consolidation completed successfully with IFRS 10 compliance
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consolidated Facts */}
          {consolidatedFacts && consolidatedFacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Consolidated Financial Facts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consolidatedFacts.slice(0, 5).map((fact, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{fact.gl_account_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {fact.member_name} • {fact.gl_account_code} • {fact.account_category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getConsolidationStatusColor(fact.consolidation_completeness as any)}>
                            {fact.consolidation_completeness}
                          </Badge>
                          <Badge variant="outline">
                            {fact.consolidation_method}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(fact.consolidated_balance_amount)}</div>
                          <div className="text-xs text-muted-foreground">Consolidated</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(fact.elimination_adjustment_amount)}</div>
                          <div className="text-xs text-muted-foreground">Eliminations</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(fact.translation_adjustment_amount)}</div>
                          <div className="text-xs text-muted-foreground">FX Translation</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Segment Notes */}
          {segmentNotes && segmentNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  IFRS 8 Segment Reporting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segmentNotes.map((segment, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{segment.operating_segment}</h4>
                          <p className="text-sm text-muted-foreground">
                            {segment.geographic_segment} • {segment.business_unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {segment.is_reportable_segment && (
                            <Badge variant="default">Reportable</Badge>
                          )}
                          <Badge variant="outline">
                            {formatPercentage(segment.revenue_materiality_pct)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(segment.segment_revenue)}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(segment.segment_operating_result)}</div>
                          <div className="text-xs text-muted-foreground">Operating Result</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(segment.segment_assets)}</div>
                          <div className="text-xs text-muted-foreground">Assets</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FX Translation Differences */}
          {fxDifferences && fxDifferences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  FX Translation Differences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fxDifferences.map((fx, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{fx.member_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {fx.currency_pair} • {fx.translation_method} • {fx.country_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getVarianceIcon(fx.translation_impact_direction)}
                          <Badge variant="outline">
                            {fx.translation_materiality}
                          </Badge>
                          <Badge variant="outline">
                            {fx.fx_risk_profile.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{fx.avg_fx_rate?.toFixed(4)}</div>
                          <div className="text-xs text-muted-foreground">Avg Rate</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{fx.closing_fx_rate?.toFixed(4)}</div>
                          <div className="text-xs text-muted-foreground">Closing Rate</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(fx.total_translation_difference)}</div>
                          <div className="text-xs text-muted-foreground">Translation Diff</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{formatCurrency(fx.cumulative_cta_total)}</div>
                          <div className="text-xs text-muted-foreground">Cumulative CTA</div>
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

export default function ConsolidationDemoPage() {
  return (
    <Suspense fallback={null}>
      <ConsolidationDemoClient />
    </Suspense>
  )
}