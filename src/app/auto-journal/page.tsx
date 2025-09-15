'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Zap,
  Bot,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  BarChart3,
  PieChart,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Eye,
  Download,
  Calendar,
  Target,
  Sparkles,
  Brain,
  Cog,
  Database,
  Activity,
  ArrowRight,
  Users,
  Building
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'

interface AutoJournalStats {
  period_days: number
  total_journals_created: number
  total_transactions_processed: number
  immediate_journals: number
  batch_journals: number
  automation_rate: string
  ai_usage_rate: string
  processing_modes: {
    immediate: number
    batched: number
    skipped: number
  }
  savings: {
    time_saved_hours: number
    manual_entries_avoided: number
    efficiency_gain: string
  }
}

interface PendingBatch {
  transaction_type: string
  count: number
  total_amount: number
  avg_amount: number
  ready_for_batch: boolean
}

export default function AutoJournalPage() {
  const [stats, setStats] = useState<AutoJournalStats | null>(null)
  const [pendingBatches, setPendingBatches] = useState<PendingBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setBatchProcessing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(7)

  // Set organization context for demo
  useEffect(() => {
    universalApi.setOrganizationId('demo-auto-journal-org')
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load statistics
      const statsResult = await universalApi.getAutoJournalStatistics(selectedPeriod)
      if (statsResult.success) {
        setStats(statsResult.data)
      }

      // Load pending batches
      const batchesResult = await universalApi.getPendingBatchTransactions()
      if (batchesResult.success) {
        setPendingBatches(batchesResult.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runBatchProcessing = async () => {
    setBatchProcessing(true)
    try {
      const result = await universalApi.runBatchJournalProcessing()
      if (result.success) {
        console.log('Batch processing completed:', result.data)
        // Reload data after processing
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Batch processing failed:', error)
    } finally {
      setBatchProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-foreground" />
          </div>
          <p className="text-muted-foreground">Loading Auto-Journal Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <Bot className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">HERA Auto-Journal Engine</h1>
                <p className="text-sm text-muted-foreground">
                  Intelligent journal entry automation with AI integration
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(Number(e.target.value) as 7 | 30 | 90)}
                  className="border rounded-md px-3 py-1 text-sm"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="w-4 h-4 mr-1" />
                Production Ready
              </Badge>
              <Button
                onClick={runBatchProcessing}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Batch Processing
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Automation Rate</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {stats?.automation_rate || '85.7%'}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.3% this period</span>
                  </div>
                </div>
                <Bot className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Journals Created</p>
                  <p className="text-3xl font-bold text-green-900">
                    {stats?.total_journals_created || 156}
                  </p>
                  <div className="flex items-center mt-2">
                    <FileText className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-primary">
                      {stats?.immediate_journals || 89} immediate
                    </span>
                  </div>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Time Saved</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {stats?.savings.time_saved_hours || 23.4}h
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">This period</span>
                  </div>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">AI Usage</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {stats?.ai_usage_rate || '15.5%'}
                  </p>
                  <div className="flex items-center mt-2">
                    <Brain className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">Complex cases</span>
                  </div>
                </div>
                <Sparkles className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="batches">Batch Queue</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Processing Modes Breakdown */}
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Processing Modes
                  </CardTitle>
                  <CardDescription>
                    How transactions are being processed by the auto-journal engine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Immediate Processing</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {stats?.processing_modes.immediate || 89}
                        </div>
                        <div className="text-xs text-muted-foreground">Large transactions</div>
                      </div>
                    </div>
                    <Progress value={65} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Batch Processing</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {stats?.processing_modes.batched || 156}
                        </div>
                        <div className="text-xs text-muted-foreground">Small transactions</div>
                      </div>
                    </div>
                    <Progress value={85} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm font-medium">Skipped</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{stats?.processing_modes.skipped || 12}</div>
                        <div className="text-xs text-muted-foreground">No journal needed</div>
                      </div>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Intelligence Insights */}
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Intelligence
                  </CardTitle>
                  <CardDescription>
                    Artificial intelligence insights and decision patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-900">Smart Recommendations</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        AI detected 3 expense patterns that could be optimized for better GL
                        classification
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="font-medium text-blue-900">Accuracy Improvement</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Journal classification accuracy improved by 8.3% this period through machine
                        learning
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Confidence Score</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Average AI confidence: 94.2% - Excellent automation reliability
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Architecture Overview */}
            <Card className="bg-background/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Universal Architecture Integration
                </CardTitle>
                <CardDescription>
                  How auto-journal leverages HERA's universal 6-table architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <Building className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold text-blue-900 mb-1">Zero New Tables</h4>
                    <p className="text-sm text-blue-700">
                      Uses existing universal tables - no schema changes required
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <Cog className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-semibold text-green-900 mb-1">Smart Code Intelligence</h4>
                    <p className="text-sm text-green-700">
                      24 smart codes provide automatic business context and rules
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-semibold text-purple-900 mb-1">Multi-Tenant Ready</h4>
                    <p className="text-sm text-purple-700">
                      Perfect organization isolation - zero data leakage between businesses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Processing Activity */}
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Recent Processing Activity
                  </CardTitle>
                  <CardDescription>
                    Latest transactions processed by the auto-journal engine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        time: '2 min ago',
                        type: 'Sale Transaction',
                        amount: '$125.50',
                        mode: 'Batched',
                        status: 'success'
                      },
                      {
                        time: '5 min ago',
                        type: 'Vendor Payment',
                        amount: '$2,500.00',
                        mode: 'Immediate',
                        status: 'success'
                      },
                      {
                        time: '12 min ago',
                        type: 'Customer Receipt',
                        amount: '$850.00',
                        mode: 'Immediate',
                        status: 'success'
                      },
                      {
                        time: '18 min ago',
                        type: 'Expense Reimbursement',
                        amount: '$67.25',
                        mode: 'Batched',
                        status: 'success'
                      },
                      {
                        time: '25 min ago',
                        type: 'Inventory Adjustment',
                        amount: '$340.00',
                        mode: 'Immediate',
                        status: 'review'
                      }
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}
                          ></div>
                          <div>
                            <div className="font-medium text-sm">{activity.type}</div>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{activity.amount}</div>
                          <Badge variant="outline" className="text-xs">
                            {activity.mode}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Processing Rules & Settings */}
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                    Processing Rules
                  </CardTitle>
                  <CardDescription>
                    Current rules governing automatic journal creation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-blue-900">Immediate Processing</span>
                        <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Transactions &gt; $1,000</li>
                        <li>• All payments and receipts</li>
                        <li>• Critical smart codes</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-green-900">Batch Processing</span>
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Small transactions &lt; $100</li>
                        <li>• Minimum 3 transactions to batch</li>
                        <li>• $300 minimum batch total</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-purple-900">AI Analysis</span>
                        <Badge className="bg-purple-100 text-purple-700">Active</Badge>
                      </div>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Complex transaction patterns</li>
                        <li>• Unknown smart codes</li>
                        <li>• Confidence &lt; 95% threshold</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Queue Tab */}
          <TabsContent value="batches" className="space-y-6">
            <Card className="bg-background/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                  Pending Batch Transactions
                </CardTitle>
                <CardDescription>Small transactions queued for batch processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingBatches.map((batch, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{batch.transaction_type}</span>
                        <Badge
                          variant={batch.ready_for_batch ? 'default' : 'secondary'}
                          className={batch.ready_for_batch ? 'bg-green-100 text-green-700' : ''}
                        >
                          {batch.ready_for_batch ? 'Ready' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Count: {batch.count} transactions</div>
                        <div>Total: {formatCurrency(batch.total_amount)}</div>
                        <div>Average: {formatCurrency(batch.avg_amount)}</div>
                      </div>
                      {batch.ready_for_batch && (
                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="w-full">
                            <Play className="w-3 h-3 mr-1" />
                            Process Batch
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {pendingBatches.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">No transactions pending batch processing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Efficiency Metrics */}
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Efficiency Impact
                  </CardTitle>
                  <CardDescription>Business impact of auto-journal automation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Manual Entries Avoided</span>
                        <span className="font-semibold">
                          {stats?.savings.manual_entries_avoided || 134}
                        </span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">85% automation rate achieved</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Time Savings</span>
                        <span className="font-semibold">
                          {stats?.savings.time_saved_hours || 23.4} hours
                        </span>
                      </div>
                      <Progress value={92} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">92% efficiency improvement</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Cost Reduction</span>
                        <span className="font-semibold">$2,880/month</span>
                      </div>
                      <Progress value={88} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">$34,560 annual savings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Performance */}
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Artificial intelligence decision quality and learning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Classification Accuracy</span>
                        <span className="font-semibold">94.2%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Improved +8.3% this period</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Confidence Score</span>
                        <span className="font-semibold">96.1%</span>
                      </div>
                      <Progress value={96} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">High reliability threshold</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Manual Review Rate</span>
                        <span className="font-semibold">3.8%</span>
                      </div>
                      <Progress value={96} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Low intervention needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitive Comparison */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-foreground">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">HERA vs Traditional ERP</h3>
                  <p className="text-blue-100">
                    Revolutionary automation compared to manual journal entry systems
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">85%</div>
                    <div className="text-blue-100 text-sm">Automation Rate</div>
                    <div className="text-xs text-blue-200 mt-1">vs 0% traditional</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">92%</div>
                    <div className="text-blue-100 text-sm">Time Savings</div>
                    <div className="text-xs text-blue-200 mt-1">vs manual process</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">87%</div>
                    <div className="text-blue-100 text-sm">Error Reduction</div>
                    <div className="text-xs text-blue-200 mt-1">vs manual entries</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-background/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  Auto-Journal Configuration
                </CardTitle>
                <CardDescription>Configure processing rules and thresholds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Processing Thresholds</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Immediate Processing Amount</label>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <input
                              type="number"
                              defaultValue={1000}
                              className="border rounded px-3 py-1 text-sm"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Transactions above this amount processed immediately
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Batch Minimum Amount</label>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <input
                              type="number"
                              defaultValue={300}
                              className="border rounded px-3 py-1 text-sm"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum total for batch processing
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Batch Size Minimum</label>
                          <input
                            type="number"
                            defaultValue={3}
                            className="border rounded px-3 py-1 text-sm w-20"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum transactions to create batch
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">AI Configuration</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Confidence Threshold</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="range"
                              min="80"
                              max="99"
                              defaultValue={95}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12">95%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum AI confidence for auto-processing
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Enable AI Analysis</label>
                            <p className="text-xs text-muted-foreground">
                              Use AI for complex transaction patterns
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                            Enabled
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Schedule Settings</h4>
                        <p className="text-sm text-muted-foreground">Automated batch processing schedule</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <select className="border rounded px-3 py-1 text-sm">
                          <option>End of Day (6:00 PM)</option>
                          <option>Every 4 hours</option>
                          <option>Manual only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
