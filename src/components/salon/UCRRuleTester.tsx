'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { useUCRMCP } from '@/src/lib/hooks/use-ucr-mcp'
import { useToast } from '@/src/components/ui/use-toast'
import {
  TestTube,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  DollarSign,
  Clock,
  Calendar,
  Sparkles,
  RotateCcw,
  FileJson,
  ChevronRight,
  Info,
  Zap,
  TrendingUp
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Separator } from '@/src/components/ui/separator'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/src/components/ui/accordion'

interface TestScenario {
  id: string
  name: string
  description: string
  context: any
  inputs?: any
  expected: any
}

interface UCRRuleTesterProps {
  ruleId?: string
  rule?: any
  onClose?: () => void
}

export function UCRRuleTester({ ruleId, rule, onClose }: UCRRuleTesterProps) {
  const { getRule, simulateRule } = useUCRMCP()
  const { toast } = useToast()
  const [currentRule, setCurrentRule] = useState<any>(rule)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('scenarios')
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const [customContext, setCustomContext] = useState<any>({})
  const [testResults, setTestResults] = useState<any>(null)
  const [running, setRunning] = useState(false)

  // Pre-built test scenarios for different rule types
  const cancellationScenarios: TestScenario[] = [
    {
      id: 'on_time_regular',
      name: 'On-Time Arrival (Regular Customer)',
      description: 'Customer arrives within grace period',
      context: {
        customer_tier: 'REGULAR',
        appointment_time: '14:00',
        arrival_time: '14:05',
        service_price: 150
      },
      expected: {
        no_show: false,
        fee_charged: 0,
        status: 'on_time'
      }
    },
    {
      id: 'late_regular',
      name: 'Late Arrival (Regular Customer)',
      description: 'Customer arrives after grace period',
      context: {
        customer_tier: 'REGULAR',
        appointment_time: '14:00',
        arrival_time: '14:30',
        service_price: 150
      },
      expected: {
        no_show: true,
        fee_charged: 150,
        status: 'no_show'
      }
    },
    {
      id: 'late_vip',
      name: 'Late Arrival (VIP Customer)',
      description: 'VIP customer arrives after grace period',
      context: {
        customer_tier: 'VIP',
        appointment_time: '14:00',
        arrival_time: '14:30',
        service_price: 150
      },
      expected: {
        no_show: true,
        fee_charged: 37.5,
        status: 'no_show_vip'
      }
    },
    {
      id: 'early_cancel_regular',
      name: 'Early Cancellation (Regular)',
      description: 'Cancelled with sufficient notice',
      context: {
        customer_tier: 'REGULAR',
        appointment_time: '14:00',
        cancel_time: '10:00',
        service_price: 150
      },
      expected: {
        fee_charged: 0,
        status: 'cancelled_free'
      }
    },
    {
      id: 'late_cancel_regular',
      name: 'Late Cancellation (Regular)',
      description: 'Cancelled without sufficient notice',
      context: {
        customer_tier: 'REGULAR',
        appointment_time: '14:00',
        cancel_time: '12:30',
        service_price: 150
      },
      expected: {
        fee_charged: 75,
        status: 'cancelled_fee'
      }
    },
    {
      id: 'late_cancel_vip',
      name: 'Late Cancellation (VIP)',
      description: 'VIP cancelled without sufficient notice',
      context: {
        customer_tier: 'VIP',
        appointment_time: '14:00',
        cancel_time: '12:30',
        service_price: 150
      },
      expected: {
        fee_charged: 0,
        status: 'cancelled_vip_waived'
      }
    }
  ]

  const pricingScenarios: TestScenario[] = [
    {
      id: 'standard_discount',
      name: 'Standard Discount Request',
      description: 'Regular customer requests 15% discount',
      context: {
        customer_tier: 'REGULAR',
        staff_role: 'STYLIST',
        original_price: 200
      },
      inputs: {
        requested_discount_pct: 15
      },
      expected: {
        allowed: true,
        final_discount_pct: 15,
        final_price: 170,
        approval_required: false
      }
    },
    {
      id: 'high_discount_regular',
      name: 'High Discount Request (Regular)',
      description: 'Regular customer requests 40% discount',
      context: {
        customer_tier: 'REGULAR',
        staff_role: 'STYLIST',
        original_price: 200
      },
      inputs: {
        requested_discount_pct: 40
      },
      expected: {
        allowed: false,
        max_allowed_discount: 30,
        approval_required: true,
        rejection_reason: 'Exceeds maximum discount'
      }
    },
    {
      id: 'vip_discount',
      name: 'VIP Discount Request',
      description: 'VIP customer requests 35% discount',
      context: {
        customer_tier: 'VIP',
        staff_role: 'STYLIST',
        original_price: 200
      },
      inputs: {
        requested_discount_pct: 35
      },
      expected: {
        allowed: true,
        final_discount_pct: 35,
        final_price: 130,
        approval_required: false
      }
    },
    {
      id: 'manager_override',
      name: 'Manager Override',
      description: 'Manager approves 45% discount',
      context: {
        customer_tier: 'REGULAR',
        staff_role: 'MANAGER',
        original_price: 200
      },
      inputs: {
        requested_discount_pct: 45
      },
      expected: {
        allowed: true,
        final_discount_pct: 45,
        final_price: 110,
        approval_required: false,
        manager_override: true
      }
    }
  ]

  useEffect(() => {
    if (ruleId && !rule) {
      loadRule()
    }
  }, [ruleId])

  const loadRule = async () => {
    setLoading(true)
    try {
      const ruleData = await getRule(ruleId)
      setCurrentRule(ruleData)
    } catch (err) {
      console.error('Failed to load rule:', err)
      toast({
        title: 'Failed to load rule',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getScenarios = () => {
    if (!currentRule) return []

    if (currentRule.smart_code.includes('CANCEL')) {
      return cancellationScenarios
    } else if (
      currentRule.smart_code.includes('DISCOUNT') ||
      currentRule.smart_code.includes('PRICING')
    ) {
      return pricingScenarios
    }

    return []
  }

  const runScenario = async (scenario: TestScenario) => {
    setRunning(true)
    setSelectedScenario(scenario.id)

    try {
      const result = await simulateRule([scenario], currentRule.id)

      setTestResults(result)

      if (result.passed === 1) {
        toast({
          title: 'Test Passed!',
          description: `${scenario.name} completed successfully`
        })
      } else {
        toast({
          title: 'Test Failed',
          description: 'The scenario did not produce expected results',
          variant: 'destructive'
        })
      }
    } catch (err: any) {
      toast({
        title: 'Test Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setRunning(false)
    }
  }

  const runAllScenarios = async () => {
    setRunning(true)
    const scenarios = getScenarios()

    try {
      const result = await simulateRule(
        scenarios.map(s => ({
          scenario_id: s.id,
          context: { ...s.context, ...s.inputs },
          expected: s.expected
        })),
        currentRule.id
      )

      setTestResults(result)

      const passRate = (result.passed / scenarios.length) * 100

      toast({
        title: `Test Suite Complete`,
        description: `${result.passed}/${scenarios.length} tests passed (${passRate.toFixed(0)}%)`
      })
    } catch (err: any) {
      toast({
        title: 'Test Suite Error',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setRunning(false)
    }
  }

  const renderScenarioCard = (scenario: TestScenario) => {
    const result = testResults?.results?.find((r: any) => r.scenario_id === scenario.id)
    const hasRun = !!result
    const passed = result?.passed

    return (
      <Card
        key={scenario.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          selectedScenario === scenario.id ? 'ring-2 ring-purple-500' : ''
        }`}
        onClick={() => setSelectedScenario(scenario.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{scenario.name}</h4>
                {hasRun &&
                  (passed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ))}
              </div>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                {scenario.description}
              </p>

              {/* Context Preview */}
              <div className="space-y-1 text-xs">
                {Object.entries(scenario.context)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {key.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-muted-foreground dark:text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              size="sm"
              variant={hasRun ? (passed ? 'outline' : 'destructive') : 'default'}
              onClick={e => {
                e.stopPropagation()
                runScenario(scenario)
              }}
              disabled={running}
            >
              <Play className="w-4 h-4 mr-1" />
              {hasRun ? 'Rerun' : 'Run'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTestDetails = () => {
    if (!selectedScenario || !testResults) return null

    const scenario = getScenarios().find(s => s.id === selectedScenario)
    const result = testResults.results?.find((r: any) => r.scenario_id === selectedScenario)

    if (!scenario || !result) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{scenario.name}</span>
            {result.passed ? (
              <Badge className="bg-green-100 text-green-800">Passed</Badge>
            ) : (
              <Badge variant="destructive">Failed</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Test Context</h4>
            <div className="bg-muted dark:bg-muted rounded-lg p-3">
              <pre className="text-xs">{JSON.stringify(scenario.context, null, 2)}</pre>
            </div>
          </div>

          {scenario.inputs && (
            <div>
              <h4 className="font-medium mb-2">Input Values</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <pre className="text-xs">{JSON.stringify(scenario.inputs, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">
                Expected Result
              </h4>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <pre className="text-xs">{JSON.stringify(result.expected, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 text-primary dark:text-blue-400">Actual Result</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <pre className="text-xs">{JSON.stringify(result.actual, null, 2)}</pre>
              </div>
            </div>
          </div>

          {result.diff && Object.keys(result.diff).length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">Differences</h4>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <pre className="text-xs">{JSON.stringify(result.diff, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderCustomTest = () => {
    return (
      <div className="space-y-6">
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Create custom test scenarios to validate edge cases or specific business situations.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Customer Tier</Label>
            <Select
              value={customContext.customer_tier || ''}
              onValueChange={value => setCustomContext({ ...customContext, customer_tier: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
                <SelectItem value="REGULAR">Regular</SelectItem>
                <SelectItem value="NEW">New Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentRule?.smart_code.includes('CANCEL') && (
            <>
              <div>
                <Label>Appointment Time</Label>
                <Input
                  type="time"
                  value={customContext.appointment_time || ''}
                  onChange={e =>
                    setCustomContext({ ...customContext, appointment_time: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Arrival/Cancel Time</Label>
                <Input
                  type="time"
                  value={customContext.arrival_time || customContext.cancel_time || ''}
                  onChange={e =>
                    setCustomContext({
                      ...customContext,
                      arrival_time: e.target.value,
                      cancel_time: e.target.value
                    })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Service Price (AED)</Label>
                <Input
                  type="number"
                  value={customContext.service_price || ''}
                  onChange={e =>
                    setCustomContext({
                      ...customContext,
                      service_price: parseFloat(e.target.value) || 0
                    })
                  }
                  className="mt-2"
                />
              </div>
            </>
          )}

          {currentRule?.smart_code.includes('DISCOUNT') && (
            <>
              <div>
                <Label>Staff Role</Label>
                <Select
                  value={customContext.staff_role || ''}
                  onValueChange={value => setCustomContext({ ...customContext, staff_role: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STYLIST">Stylist</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Original Price (AED)</Label>
                <Input
                  type="number"
                  value={customContext.original_price || ''}
                  onChange={e =>
                    setCustomContext({
                      ...customContext,
                      original_price: parseFloat(e.target.value) || 0
                    })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Requested Discount (%)</Label>
                <Input
                  type="number"
                  value={customContext.requested_discount_pct || ''}
                  onChange={e =>
                    setCustomContext({
                      ...customContext,
                      requested_discount_pct: parseInt(e.target.value) || 0
                    })
                  }
                  className="mt-2"
                  min={0}
                  max={100}
                />
              </div>
            </>
          )}
        </div>

        <div>
          <h4 className="font-medium mb-2">Custom Context (JSON)</h4>
          <textarea
            className="w-full p-3 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border font-mono text-sm"
            rows={6}
            value={JSON.stringify(customContext, null, 2)}
            onChange={e => {
              try {
                setCustomContext(JSON.parse(e.target.value))
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>

        <Button
          onClick={async () => {
            const customScenario: TestScenario = {
              id: 'custom_test',
              name: 'Custom Test',
              description: 'User-defined test scenario',
              context: customContext,
              expected: {} // User doesn't define expected for custom tests
            }
            await runScenario(customScenario)
          }}
          disabled={running || Object.keys(customContext).length === 0}
          className="w-full"
        >
          <TestTube className="w-4 h-4 mr-2" />
          Run Custom Test
        </Button>
      </div>
    )
  }

  const renderSummary = () => {
    if (!testResults) return null

    const passRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{passRate.toFixed(0)}%</p>
              </div>
              <TrendingUp
                className={`w-8 h-8 ${passRate >= 80 ? 'text-green-500' : 'text-red-500'}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{testResults.passed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{testResults.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold">{testResults.coverage?.toFixed(0) || 0}%</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <TestTube className="w-12 h-12 animate-pulse mx-auto text-purple-600 mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground">Loading rule...</p>
        </div>
      </div>
    )
  }

  if (!currentRule) {
    return (
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>No rule selected for testing</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                <TestTube className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <CardTitle>Test Rule: {currentRule.title}</CardTitle>
                <CardDescription>
                  Validate your rule with real-world scenarios before deployment
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTestResults(null)
                  setSelectedScenario('')
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={runAllScenarios}
                disabled={running}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-foreground"
              >
                <Play className="w-4 h-4 mr-2" />
                Run All Tests
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Test Summary */}
      {testResults && renderSummary()}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenarios">
            <Sparkles className="w-4 h-4 mr-2" />
            Test Scenarios
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Zap className="w-4 h-4 mr-2" />
            Custom Test
          </TabsTrigger>
          <TabsTrigger value="results">
            <FileJson className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="scenarios" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scenarios List */}
              <div className="space-y-4">
                <h3 className="font-medium">Available Test Scenarios</h3>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {getScenarios().map(scenario => renderScenarioCard(scenario))}
                  </div>
                </ScrollArea>
              </div>

              {/* Test Details */}
              <div>
                <h3 className="font-medium mb-4">Test Details</h3>
                {selectedScenario ? (
                  renderTestDetails()
                ) : (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      Select a test scenario to see details and results
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom">{renderCustomTest()}</TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Complete Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="bg-muted dark:bg-muted rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      No test results yet. Run some tests to see results here.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
