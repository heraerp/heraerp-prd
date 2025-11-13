'use client'

/**
 * POS LIVE REGRESSION TESTING DASHBOARD
 * 
 * Real-time testing interface for salon staff to identify bottlenecks and UX issues
 * Tests actual POS checkout flow with performance monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  PlayCircle,
  StopCircle,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  Users,
  CreditCard,
  Package,
  Zap,
  Target,
  RefreshCw,
  Download,
  Bug
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePosCheckout } from '@/hooks/usePosCheckout'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'

// Test scenarios with varying complexity
const TEST_SCENARIOS = [
  {
    id: 'simple_sale',
    name: 'Simple Cash Sale',
    complexity: 'LOW',
    expectedTime: 3000,
    description: 'Single service, cash payment',
    items: [
      { id: 'custom-haircut', entity_id: 'custom-haircut', name: 'Basic Haircut', type: 'service', quantity: 1, unit_price: 150 }
    ],
    payments: [{ method: 'cash', amount: 158 }]
  },
  {
    id: 'medium_sale',
    name: 'Multi-Service + Products',
    complexity: 'MEDIUM', 
    expectedTime: 5000,
    description: '3 services, 2 products, card payment',
    items: [
      { id: 'custom-color', entity_id: 'custom-color', name: 'Hair Color', type: 'service', quantity: 1, unit_price: 450 },
      { id: 'custom-cut', entity_id: 'custom-cut', name: 'Cut & Style', type: 'service', quantity: 1, unit_price: 200 },
      { id: 'custom-treatment', entity_id: 'custom-treatment', name: 'Treatment', type: 'service', quantity: 1, unit_price: 180 },
      { id: 'custom-shampoo', entity_id: 'custom-shampoo', name: 'Shampoo', type: 'product', quantity: 2, unit_price: 85 },
      { id: 'custom-conditioner', entity_id: 'custom-conditioner', name: 'Conditioner', type: 'product', quantity: 1, unit_price: 75 }
    ],
    payments: [{ method: 'card', amount: 1100 }],
    tip_total: 50
  },
  {
    id: 'complex_sale',
    name: 'Large Group Booking',
    complexity: 'HIGH',
    expectedTime: 8000,
    description: '5+ services, multiple payments, tips',
    items: [
      { id: 'custom-bridal', entity_id: 'custom-bridal', name: 'Bridal Styling', type: 'service', quantity: 1, unit_price: 800 },
      { id: 'custom-makeup', entity_id: 'custom-makeup', name: 'Makeup', type: 'service', quantity: 1, unit_price: 300 },
      { id: 'custom-mani', entity_id: 'custom-mani', name: 'Manicure', type: 'service', quantity: 3, unit_price: 120 },
      { id: 'custom-extensions', entity_id: 'custom-extensions', name: 'Hair Extensions', type: 'service', quantity: 1, unit_price: 600 },
      { id: 'custom-premium', entity_id: 'custom-premium', name: 'Premium Products', type: 'product', quantity: 4, unit_price: 150 }
    ],
    payments: [
      { method: 'card', amount: 1500 },
      { method: 'cash', amount: 920 }
    ],
    tip_total: 120,
    discount_total: 100
  },
  {
    id: 'stress_test',
    name: 'Stress Test (15 Items)',
    complexity: 'EXTREME',
    expectedTime: 12000,
    description: 'Maximum items to test database performance',
    items: Array.from({ length: 15 }, (_, i) => ({
      id: `custom-item-${i}`,
      entity_id: `custom-item-${i}`,
      name: `${i % 3 === 0 ? 'Product' : 'Service'} ${i + 1}`,
      type: i % 3 === 0 ? 'product' : 'service',
      quantity: 1,
      unit_price: 50 + (i * 25)
    })),
    payments: [{ method: 'card', amount: 2000 }],
    tip_total: 200
  }
]

interface TestResult {
  id: string
  scenario: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: string
  transactionId?: string
  stages: {
    checkout_start?: number
    checkout_complete?: number
    gl_posting?: number
  }
}

export default function POSTestingPage() {
  const { user, organization } = useHERAAuth()
  const { processCheckout, isProcessing } = usePosCheckout()
  
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [progress, setProgress] = useState(0)
  const [autoRun, setAutoRun] = useState(false)
  
  const resultsRef = useRef<TestResult[]>([])
  const runningRef = useRef(false)

  // Update refs when state changes
  useEffect(() => {
    resultsRef.current = testResults
    runningRef.current = isRunning
  }, [testResults, isRunning])

  const runSingleTest = useCallback(async (scenario: typeof TEST_SCENARIOS[0]) => {
    if (!organization?.id || !user?.id) {
      throw new Error('Organization or user not available')
    }

    const testId = `test_${Date.now()}`
    const result: TestResult = {
      id: testId,
      scenario: scenario.name,
      startTime: performance.now(),
      success: false,
      stages: {}
    }

    try {
      console.log(`🧪 Starting test: ${scenario.name}`)
      
      // Calculate totals for the scenario
      const subtotal = scenario.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
      const discount_total = scenario.discount_total || 0
      const tax_rate = 0.05
      const tax_amount = (subtotal - discount_total) * tax_rate
      const tip_total = scenario.tip_total || 0
      const total_amount = subtotal - discount_total + tax_amount + tip_total

      // Ensure payment amounts cover total
      const payment_total = scenario.payments.reduce((sum, p) => sum + p.amount, 0)
      if (payment_total < total_amount - 0.01) {
        // Auto-adjust first payment to cover total
        scenario.payments[0].amount = total_amount
      }

      result.stages.checkout_start = performance.now()

      // Run the actual POS checkout
      const checkoutResult = await processCheckout({
        customer_id: undefined, // Anonymous customer for testing
        items: scenario.items.map(item => ({
          id: item.id,
          entity_id: item.entity_id,
          name: item.name,
          type: item.type as 'service' | 'product',
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payments: scenario.payments as any,
        tax_rate,
        discount_total,
        tip_total,
        notes: `Test run: ${scenario.name} - ${new Date().toISOString()}`
      })

      result.stages.checkout_complete = performance.now()
      result.endTime = performance.now()
      result.duration = result.endTime - result.startTime
      result.success = true
      result.transactionId = checkoutResult.transaction_id

      console.log(`✅ Test completed: ${scenario.name} in ${result.duration.toFixed(0)}ms`)

    } catch (error) {
      result.endTime = performance.now()
      result.duration = result.endTime - result.startTime
      result.error = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ Test failed: ${scenario.name}`, error)
    }

    return result
  }, [processCheckout, organization?.id, user?.id])

  const runTestSuite = useCallback(async () => {
    if (!organization?.id || !user?.id) {
      alert('Please ensure you are logged in and have organization context')
      return
    }

    setIsRunning(true)
    setProgress(0)
    setTestResults([])
    
    const results: TestResult[] = []
    const totalTests = TEST_SCENARIOS.length

    try {
      for (let i = 0; i < TEST_SCENARIOS.length; i++) {
        if (!runningRef.current) break // Check if stopped

        const scenario = TEST_SCENARIOS[i]
        setCurrentTest(scenario.name)
        setProgress((i / totalTests) * 100)

        const result = await runSingleTest(scenario)
        results.push(result)
        setTestResults([...results])

        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      setProgress(100)
      console.log('🏁 Test suite completed')

    } catch (error) {
      console.error('💥 Test suite error:', error)
    } finally {
      setIsRunning(false)
      setCurrentTest(null)
    }
  }, [runSingleTest, organization?.id, user?.id])

  const runContinuousTest = useCallback(async () => {
    if (!autoRun) return

    while (runningRef.current && autoRun) {
      const randomScenario = TEST_SCENARIOS[Math.floor(Math.random() * TEST_SCENARIOS.length)]
      
      try {
        const result = await runSingleTest(randomScenario)
        setTestResults(prev => [...prev.slice(-19), result]) // Keep last 20 results
      } catch (error) {
        console.error('Continuous test error:', error)
      }

      // Wait before next test
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }, [autoRun, runSingleTest])

  useEffect(() => {
    if (autoRun && !isRunning) {
      setIsRunning(true)
      runContinuousTest()
    } else if (!autoRun && isRunning) {
      setIsRunning(false)
    }
  }, [autoRun, isRunning, runContinuousTest])

  const stopTests = () => {
    setIsRunning(false)
    setAutoRun(false)
    setCurrentTest(null)
  }

  // Calculate statistics
  const stats = {
    total: testResults.length,
    successful: testResults.filter(r => r.success).length,
    failed: testResults.filter(r => !r.success).length,
    avgDuration: testResults.filter(r => r.success && r.duration).length > 0
      ? testResults.filter(r => r.success && r.duration).reduce((sum, r) => sum + r.duration!, 0) / testResults.filter(r => r.success && r.duration).length
      : 0,
    slowTests: testResults.filter(r => r.success && r.duration && r.duration > 10000).length
  }

  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      organization_id: organization?.id,
      user_id: user?.id,
      statistics: stats,
      results: testResults
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pos-test-results-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!user || !organization) {
    return (
      <SalonLuxePage title="POS Testing" description="Loading authentication...">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gold" />
            <p className="text-champagne">Loading authentication context...</p>
          </div>
        </div>
      </SalonLuxePage>
    )
  }

  return (
    <SalonLuxePage
      title="POS Performance Testing"
      description="Live regression testing and performance monitoring"
      maxWidth="full"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-charcoal rounded-xl p-6">
          <div>
            <h1 className="text-2xl font-bold text-champagne mb-2">POS Performance Testing</h1>
            <p className="text-bronze">Real-time performance monitoring and bottleneck detection</p>
          </div>
          
          <div className="flex gap-3">
            {!isRunning ? (
              <>
                <Button
                  onClick={runTestSuite}
                  className="bg-gold text-black hover:bg-gold/90 font-semibold"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Run Test Suite
                </Button>
                <Button
                  onClick={() => setAutoRun(!autoRun)}
                  variant={autoRun ? "destructive" : "outline"}
                  className="border-gold text-gold hover:bg-gold/10"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {autoRun ? 'Stop Continuous' : 'Start Continuous'}
                </Button>
              </>
            ) : (
              <Button onClick={stopTests} variant="destructive">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Testing
              </Button>
            )}
            
            {testResults.length > 0 && (
              <Button onClick={downloadResults} variant="outline" className="border-gold text-gold hover:bg-gold/10">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {isRunning && (
          <Alert className="bg-gold/20 border-gold">
            <Activity className="w-4 h-4" />
            <AlertDescription>
              {autoRun ? 'Running continuous tests...' : `Running test suite: ${currentTest || 'Initializing'}`}
              {!autoRun && <Progress value={progress} className="w-full mt-2" />}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-charcoal border-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gold" />
                <div>
                  <p className="text-xs text-bronze">Total Tests</p>
                  <p className="text-lg font-bold text-champagne">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-bronze">Success Rate</p>
                  <p className="text-lg font-bold text-champagne">
                    {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                <div>
                  <p className="text-xs text-bronze">Avg Duration</p>
                  <p className="text-lg font-bold text-champagne">
                    {stats.avgDuration > 0 ? `${Math.round(stats.avgDuration)}ms` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs text-bronze">Failed</p>
                  <p className="text-lg font-bold text-champagne">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-xs text-bronze">Slow ({'>'}10s)</p>
                  <p className="text-lg font-bold text-champagne">{stats.slowTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-charcoal">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              Overview
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              Results
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart Placeholder */}
              <Card className="bg-charcoal border-gold/30">
                <CardHeader>
                  <CardTitle className="text-champagne flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gold" />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-bronze">
                    {testResults.length > 0 ? (
                      <div className="w-full space-y-2">
                        {testResults.slice(-10).map((result, i) => (
                          <div key={result.id} className="flex items-center gap-2">
                            <div className="w-20 text-xs">{result.scenario.slice(0, 10)}...</div>
                            <div className="flex-1 bg-charcoalLight rounded">
                              <div 
                                className={`h-4 rounded ${result.success ? 'bg-emerald-400' : 'bg-red-400'}`}
                                style={{ 
                                  width: `${Math.min((result.duration || 0) / 15000 * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <div className="w-16 text-xs text-right">
                              {result.duration ? `${Math.round(result.duration)}ms` : 'Failed'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      'Run tests to see performance trends'
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="bg-charcoal border-gold/30">
                <CardHeader>
                  <CardTitle className="text-champagne flex items-center gap-2">
                    <Zap className="w-5 h-5 text-gold" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-bronze">Response Time</span>
                    <Badge variant={stats.avgDuration < 5000 ? "default" : stats.avgDuration < 10000 ? "secondary" : "destructive"}>
                      {stats.avgDuration < 5000 ? 'Good' : stats.avgDuration < 10000 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-bronze">Reliability</span>
                    <Badge variant={stats.total > 0 && (stats.successful / stats.total) > 0.95 ? "default" : "secondary"}>
                      {stats.total > 0 && (stats.successful / stats.total) > 0.95 ? 'Excellent' : 'Needs Attention'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-bronze">Peak Performance</span>
                    <Badge variant={stats.slowTests === 0 ? "default" : "secondary"}>
                      {stats.slowTests === 0 ? 'Optimal' : `${stats.slowTests} slow operations`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEST_SCENARIOS.map((scenario) => (
                <Card key={scenario.id} className="bg-charcoal border-gold/30">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-champagne text-lg">{scenario.name}</CardTitle>
                        <p className="text-bronze text-sm mt-1">{scenario.description}</p>
                      </div>
                      <Badge 
                        variant={scenario.complexity === 'LOW' ? 'default' : scenario.complexity === 'MEDIUM' ? 'secondary' : 'destructive'}
                        className="ml-2"
                      >
                        {scenario.complexity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-bronze">Items:</span>
                        <span className="text-champagne">{scenario.items.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bronze">Payments:</span>
                        <span className="text-champagne">{scenario.payments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bronze">Expected Time:</span>
                        <span className="text-champagne">{scenario.expectedTime / 1000}s</span>
                      </div>
                      {scenario.tip_total && (
                        <div className="flex justify-between">
                          <span className="text-bronze">Includes Tips:</span>
                          <span className="text-champagne">Yes</span>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full mt-4 bg-gold/20 text-gold hover:bg-gold/30"
                      onClick={() => runSingleTest(scenario)}
                      disabled={isRunning}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Test This Scenario
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results">
            <Card className="bg-charcoal border-gold/30">
              <CardHeader>
                <CardTitle className="text-champagne">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {testResults.slice().reverse().map((result) => (
                      <div key={result.id} className="border border-gold/20 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-champagne font-medium">{result.scenario}</h4>
                            <p className="text-bronze text-sm">
                              {new Date(result.startTime + performance.timeOrigin).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-champagne font-mono text-sm">
                              {result.duration ? `${Math.round(result.duration)}ms` : 'Failed'}
                            </span>
                          </div>
                        </div>
                        {result.error && (
                          <p className="text-red-400 text-xs mt-2 font-mono">{result.error}</p>
                        )}
                        {result.transactionId && (
                          <p className="text-bronze text-xs mt-1">
                            Transaction: {result.transactionId.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-bronze">
                    <Bug className="w-8 h-8 mx-auto mb-2" />
                    <p>No test results yet. Run some tests to see performance data.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-6">
              {/* Bottlenecks Analysis */}
              <Card className="bg-charcoal border-gold/30">
                <CardHeader>
                  <CardTitle className="text-champagne">Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-champagne font-medium mb-2">Performance Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-bronze">Fastest Transaction:</span>
                            <span className="text-champagne ml-2">
                              {Math.min(...testResults.filter(r => r.success && r.duration).map(r => r.duration!))}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-bronze">Slowest Transaction:</span>
                            <span className="text-champagne ml-2">
                              {Math.max(...testResults.filter(r => r.success && r.duration).map(r => r.duration!))}ms
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-champagne font-medium mb-2">Recommendations</h4>
                        <div className="space-y-2 text-sm">
                          {stats.avgDuration > 10000 && (
                            <div className="flex items-center gap-2 text-orange-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>Average transaction time exceeds 10 seconds - consider optimization</span>
                            </div>
                          )}
                          {stats.failed > stats.successful * 0.1 && (
                            <div className="flex items-center gap-2 text-red-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>High failure rate detected - check error patterns</span>
                            </div>
                          )}
                          {stats.slowTests > 0 && (
                            <div className="flex items-center gap-2 text-yellow-400">
                              <Clock className="w-4 h-4" />
                              <span>{stats.slowTests} transactions took longer than 10 seconds</span>
                            </div>
                          )}
                          {stats.avgDuration <= 5000 && stats.failed === 0 && (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle className="w-4 h-4" />
                              <span>Performance is excellent! All tests passing under 5 seconds.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-bronze">Run tests to see performance analysis and recommendations.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SalonLuxePage>
  )
}