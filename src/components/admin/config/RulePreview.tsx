'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Code2,
  Database,
  Zap,
  AlertCircle,
  Info,
  TrendingUp,
  Activity,
  FileText,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfigRule {
  id?: string
  name: string
  category: string
  type: 'validation' | 'transformation' | 'business_logic' | 'integration'
  scope: 'global' | 'organization' | 'entity_type' | 'specific'
  status: 'active' | 'inactive' | 'draft' | 'deprecated'
  priority: number
  description: string
  smart_code: string
  conditions: Array<{
    field: string
    operator: string
    value: string
    logic?: 'AND' | 'OR'
  }>
  actions: Array<{
    type: string
    target: string
    value: string
    parameters?: Record<string, any>
  }>
  configuration: {
    timeout_ms?: number
    retry_count?: number
    failure_action?: 'stop' | 'continue' | 'rollback'
    notification_enabled?: boolean
    logging_level?: 'none' | 'basic' | 'detailed'
  }
}

interface TestResult {
  success: boolean
  message: string
  executionTime: number
  conditionsEvaluated: Array<{
    condition: string
    result: boolean
    value: any
  }>
  actionsExecuted: Array<{
    action: string
    result: boolean
    output: any
  }>
  logs: Array<{
    level: 'info' | 'warning' | 'error'
    message: string
    timestamp: string
  }>
}

interface RulePreviewProps {
  rule: ConfigRule
  className?: string
  onClose?: () => void
}

export function RulePreview({ rule, className, onClose }: RulePreviewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [testData, setTestData] = useState('{}')
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testHistory, setTestHistory] = useState<TestResult[]>([])

  // Early return if rule is not provided
  if (!rule) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No rule selected for preview</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Sample test data based on rule type
  const getSampleTestData = () => {
    const samples = {
      validation: {
        entity_type: 'customer',
        entity_data: {
          credit_limit: 50000,
          outstanding_balance: 35000,
          payment_terms: 'NET30'
        }
      },
      transformation: {
        entity_type: 'product',
        entity_data: {
          base_price: 100.0,
          markup_percentage: 0.25,
          discount_applicable: true
        }
      },
      business_logic: {
        entity_type: 'transaction',
        entity_data: {
          transaction_type: 'sale',
          amount: 15000,
          customer_id: 'cust_123'
        }
      },
      integration: {
        entity_type: 'journal_entry',
        entity_data: {
          debit_account: '1100',
          credit_account: '4100',
          amount: 1250.0
        }
      }
    }

    return JSON.stringify(samples[rule?.type] || samples.validation, null, 2)
  }

  useEffect(() => {
    if (rule?.type) {
      setTestData(getSampleTestData())
    }
  }, [rule?.type])

  const runTest = async () => {
    setIsTestRunning(true)
    setTestResult(null)

    try {
      // Parse test data
      const data = JSON.parse(testData)

      // Simulate rule execution
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mock test result
      const mockResult: TestResult = {
        success: Math.random() > 0.3, // 70% success rate
        message: Math.random() > 0.3 ? 'Rule executed successfully' : 'Rule validation failed',
        executionTime: Math.floor(Math.random() * 500) + 50,
        conditionsEvaluated: (rule.conditions || []).map((condition, index) => ({
          condition: `${condition.field} ${condition.operator} ${condition.value}`,
          result: Math.random() > 0.2,
          value: data.entity_data?.[condition.field.split('.').pop() || ''] || 'N/A'
        })),
        actionsExecuted: (rule.actions || []).map((action, index) => ({
          action: `${action.type}: ${action.target}`,
          result: Math.random() > 0.1,
          output: `Action completed: ${action.value}`
        })),
        logs: [
          {
            level: 'info',
            message: 'Rule execution started',
            timestamp: new Date().toISOString()
          },
          {
            level: 'info',
            message: `Processing ${rule.conditions.length} conditions`,
            timestamp: new Date().toISOString()
          },
          {
            level: Math.random() > 0.7 ? 'warning' : 'info',
            message: `Executing ${rule.actions.length} actions`,
            timestamp: new Date().toISOString()
          }
        ]
      }

      setTestResult(mockResult)
      setTestHistory(prev => [mockResult, ...prev.slice(0, 4)]) // Keep last 5 results
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Invalid test data format',
        executionTime: 0,
        conditionsEvaluated: [],
        actionsExecuted: [],
        logs: [
          {
            level: 'error',
            message: 'Failed to parse test data JSON',
            timestamp: new Date().toISOString()
          }
        ]
      })
    } finally {
      setIsTestRunning(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-amber-600 dark:text-amber-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl !text-gray-900 dark:!text-gray-100 flex items-center gap-3">
                <Eye className="w-6 h-6" />
                Rule Preview & Testing
              </CardTitle>
              <CardDescription className="!text-gray-600 dark:!text-gray-300">
                Preview rule configuration and test execution with sample data
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close Preview
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Rule Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-xl border-blue-200/30 dark:border-blue-700/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold !text-gray-900 dark:!text-gray-100">
                {rule.name}
              </h2>
              <p className="!text-gray-600 dark:!text-gray-300">{rule.description}</p>
              <div className="flex items-center gap-4">
                <Badge
                  className={cn(
                    rule.type === 'validation' &&
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                    rule.type === 'transformation' &&
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                    rule.type === 'business_logic' &&
                      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
                    rule.type === 'integration' &&
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                  )}
                >
                  {rule.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {rule.scope}
                </Badge>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono !text-gray-800 dark:!text-gray-200">
                  {rule.smart_code}
                </code>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold !text-blue-600 dark:!text-blue-400">
                #{rule.priority}
              </div>
              <div className="text-sm !text-gray-500 dark:!text-gray-500">Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
          >
            <FileText className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="test"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
          >
            <Play className="w-4 h-4 mr-2" />
            Test Rule
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
          >
            <Activity className="w-4 h-4 mr-2" />
            Execution Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conditions */}
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                  <Database className="w-5 h-5" />
                  Conditions ({rule.conditions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rule.conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-white/30 dark:border-gray-600/30"
                  >
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="!text-blue-600 dark:!text-blue-400">{condition.field}</span>
                      <span className="!text-gray-500 dark:!text-gray-500">
                        {condition.operator}
                      </span>
                      <span className="!text-green-600 dark:!text-green-400">
                        {condition.value}
                      </span>
                    </div>
                    {index < rule.conditions.length - 1 && (
                      <div className="text-xs !text-gray-500 dark:!text-gray-500 mt-1">
                        {condition.logic || 'AND'}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                  <Zap className="w-5 h-5" />
                  Actions ({rule.actions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rule.actions.map((action, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-white/30 dark:border-gray-600/30"
                  >
                    <div className="font-medium !text-gray-900 dark:!text-gray-100 capitalize">
                      {action.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm !text-gray-600 dark:!text-gray-400 mt-1">
                      Target:{' '}
                      <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                        {action.target}
                      </code>
                    </div>
                    <div className="text-sm !text-gray-600 dark:!text-gray-400">
                      Value: <span className="font-mono">{action.value}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Configuration */}
          <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                <Settings className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg">
                  <div className="text-lg font-semibold !text-gray-900 dark:!text-gray-100">
                    {rule.configuration.timeout_ms || 5000}ms
                  </div>
                  <div className="text-sm !text-gray-500 dark:!text-gray-500">Timeout</div>
                </div>
                <div className="text-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg">
                  <div className="text-lg font-semibold !text-gray-900 dark:!text-gray-100">
                    {rule.configuration.retry_count || 3}
                  </div>
                  <div className="text-sm !text-gray-500 dark:!text-gray-500">Retries</div>
                </div>
                <div className="text-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg">
                  <div className="text-sm font-semibold !text-gray-900 dark:!text-gray-100 capitalize">
                    {rule.configuration.failure_action || 'stop'}
                  </div>
                  <div className="text-sm !text-gray-500 dark:!text-gray-500">On Failure</div>
                </div>
                <div className="text-center p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg">
                  <div className="text-sm font-semibold !text-gray-900 dark:!text-gray-100 capitalize">
                    {rule.configuration.logging_level || 'basic'}
                  </div>
                  <div className="text-sm !text-gray-500 dark:!text-gray-500">Logging</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Input */}
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                  <Code2 className="w-5 h-5" />
                  Test Data
                </CardTitle>
                <CardDescription className="!text-gray-600 dark:!text-gray-300">
                  Provide sample data to test rule execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium !text-gray-900 dark:!text-gray-100">
                    Sample Data (JSON)
                  </Label>
                  <Textarea
                    value={testData}
                    onChange={e => setTestData(e.target.value)}
                    placeholder="Enter test data as JSON"
                    className="min-h-[200px] font-mono text-sm bg-white/70 dark:bg-gray-800/70 border-white/30 dark:border-gray-600/30"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={runTest}
                    disabled={isTestRunning}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    {isTestRunning ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Running Test...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Test
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setTestData(getSampleTestData())}
                    className="bg-white/70 dark:bg-gray-800/70"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Status */}
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                  <Activity className="w-5 h-5" />
                  Test Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isTestRunning && (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-4 animate-spin border-4 border-blue-600 border-t-transparent rounded-full"></div>
                      <p className="!text-gray-600 dark:!text-gray-400">Running rule test...</p>
                    </div>
                  </div>
                )}

                {!isTestRunning && !testResult && (
                  <div className="text-center p-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="!text-gray-500 dark:!text-gray-500">
                      Click "Run Test" to execute the rule with your test data
                    </p>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-4">
                    <Alert
                      className={cn(
                        testResult.success
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      )}
                    >
                      {getStatusIcon(testResult.success)}
                      <AlertDescription
                        className={cn(
                          testResult.success
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-red-800 dark:text-red-300'
                        )}
                      >
                        <div className="font-semibold">{testResult.message}</div>
                        <div className="text-sm mt-1">
                          Execution time: {testResult.executionTime}ms
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Conditions Evaluated
                        </div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-200">
                          {testResult.conditionsEvaluated.filter(c => c.result).length} /{' '}
                          {testResult.conditionsEvaluated.length}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-sm font-medium text-purple-800 dark:text-purple-300">
                          Actions Executed
                        </div>
                        <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
                          {testResult.actionsExecuted.filter(a => a.result).length} /{' '}
                          {testResult.actionsExecuted.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {testResult && (
            <>
              {/* Conditions Results */}
              <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                    <Database className="w-5 h-5" />
                    Conditions Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResult.conditionsEvaluated.map((condition, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg border',
                          condition.result
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(condition.result)}
                            <code className="font-mono text-sm !text-gray-800 dark:!text-gray-200">
                              {condition.condition}
                            </code>
                          </div>
                          <div className="text-sm !text-gray-600 dark:!text-gray-400">
                            Value: <strong>{String(condition.value)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions Results */}
              <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                    <Zap className="w-5 h-5" />
                    Actions Execution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResult.actionsExecuted.map((action, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg border',
                          action.result
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(action.result)}
                            <span className="font-medium !text-gray-900 dark:!text-gray-100">
                              {action.action}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm !text-gray-600 dark:!text-gray-400 mt-2">
                          {action.output}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Test History */}
          {testHistory.length > 0 && (
            <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                  <TrendingUp className="w-5 h-5" />
                  Recent Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testHistory.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg border border-white/30 dark:border-gray-600/30"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.success)}
                        <div>
                          <div className="font-medium !text-gray-900 dark:!text-gray-100">
                            Test {index + 1}
                          </div>
                          <div className="text-sm !text-gray-500 dark:!text-gray-500">
                            {result.executionTime}ms
                          </div>
                        </div>
                      </div>
                      <div className="text-sm !text-gray-600 dark:!text-gray-400">
                        {result.conditionsEvaluated.filter(c => c.result).length}/
                        {result.conditionsEvaluated.length} conditions passed
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!testResult && (
            <div className="text-center p-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="!text-gray-500 dark:!text-gray-500">
                Run a test to see detailed results
              </p>
            </div>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                <Activity className="w-5 h-5" />
                Execution Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResult?.logs ? (
                <div className="space-y-2">
                  {testResult.logs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'text-xs px-2 py-1 rounded font-mono uppercase font-semibold',
                            log.level === 'error' &&
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            log.level === 'warning' &&
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                            log.level === 'info' &&
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          )}
                        >
                          {log.level}
                        </div>
                        <div className="flex-1">
                          <div className="!text-gray-900 dark:!text-gray-100">{log.message}</div>
                          <div className="text-xs !text-gray-500 dark:!text-gray-500 mt-1 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="!text-gray-500 dark:!text-gray-500">
                    Execution logs will appear here after running a test
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
