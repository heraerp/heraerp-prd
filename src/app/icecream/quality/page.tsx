'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FlaskConical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
  Shield,
  Beaker,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Kochi Ice Cream Org ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

interface QualityCheck {
  id: string
  transaction_code: string
  transaction_date: string
  reference_number: string
  metadata: any
  transaction_status: string
}

interface TestResult {
  test_name: string
  value: number
  limit: number
  unit: string
  status: 'pass' | 'fail' | 'warning'
}

export default function QualityControlPage() {
  const [loading, setLoading] = useState(true)
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([])
  const [pendingBatches, setPendingBatches] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')

  useEffect(() => {
    fetchQualityData()
  }, [])

  async function fetchQualityData() {
    try {
      // Fetch quality checks
      const { data: qcData } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('transaction_type', 'quality_check')
        .order('created_at', { ascending: false })

      // Fetch production batches
      const { data: batchData } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('transaction_type', 'production_batch')
        .eq('transaction_status', 'completed')
        .order('created_at', { ascending: false })

      // Find batches without QC
      const qcBatchCodes = new Set(qcData?.map(qc => qc.reference_number) || [])
      const pending = batchData?.filter(batch => !qcBatchCodes.has(batch.transaction_code)) || []

      setQualityChecks(qcData || [])
      setPendingBatches(pending)
    } catch (error) {
      console.error('Error fetching quality data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const passedChecks = qualityChecks.filter(qc => qc.metadata?.overall_status === 'PASS').length
  const failedChecks = qualityChecks.filter(qc => qc.metadata?.overall_status === 'FAIL').length
  const passRate = qualityChecks.length > 0 ? (passedChecks / qualityChecks.length * 100) : 100

  function getTestResults(qc: QualityCheck): TestResult[] {
    const results: TestResult[] = []
    
    // Microbiological tests
    if (qc.metadata?.microbiological_tests) {
      Object.entries(qc.metadata.microbiological_tests).forEach(([key, value]: [string, any]) => {
        results.push({
          test_name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value.value,
          limit: value.limit,
          unit: value.unit,
          status: value.status
        })
      })
    }

    // Physical tests
    if (qc.metadata?.physical_tests) {
      Object.entries(qc.metadata.physical_tests).forEach(([key, value]: [string, any]) => {
        results.push({
          test_name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value.value,
          limit: value.limit || value.range?.max || 0,
          unit: value.unit,
          status: value.status
        })
      })
    }

    return results
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Quality Control
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            FSSAI compliance testing and quality assurance
          </p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</p>
                <p className="text-2xl font-bold mt-1">{passRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Tests</p>
                <p className="text-2xl font-bold mt-1">{pendingBatches.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tests Passed</p>
                <p className="text-2xl font-bold mt-1">{passedChecks}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">FSSAI Compliance</p>
                <p className="text-2xl font-bold mt-1">100%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "px-4 py-2 rounded-md font-medium text-sm transition-all",
            activeTab === 'pending'
              ? "bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          Pending Tests ({pendingBatches.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            "px-4 py-2 rounded-md font-medium text-sm transition-all",
            activeTab === 'completed'
              ? "bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          Completed ({qualityChecks.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' ? (
        <div className="space-y-4">
          {loading ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-12 text-center">
                <div className="animate-pulse">Loading quality data...</div>
              </CardContent>
            </Card>
          ) : pendingBatches.length === 0 ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">All batches have been tested!</p>
              </CardContent>
            </Card>
          ) : (
            pendingBatches.map((batch) => (
              <Card 
                key={batch.id}
                className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-yellow-200/50 dark:border-yellow-800/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{batch.transaction_code}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {batch.metadata?.product_name || 'Product'} - {batch.metadata?.actual_output || 0} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                        <p className="font-medium">{new Date(batch.transaction_date).toLocaleDateString()}</p>
                      </div>
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                        <FlaskConical className="w-4 h-4 mr-2" />
                        Start Testing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-12 text-center">
                <div className="animate-pulse">Loading quality data...</div>
              </CardContent>
            </Card>
          ) : qualityChecks.length === 0 ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-green-200/50 dark:border-green-800/50">
              <CardContent className="p-12 text-center">
                <Beaker className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No quality tests completed yet</p>
              </CardContent>
            </Card>
          ) : (
            qualityChecks.map((qc) => {
              const testResults = getTestResults(qc)
              const isPassed = qc.metadata?.overall_status === 'PASS'
              
              return (
                <Card 
                  key={qc.id}
                  className={cn(
                    "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80",
                    isPassed 
                      ? "border-green-200/50 dark:border-green-800/50"
                      : "border-red-200/50 dark:border-red-800/50"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          isPassed 
                            ? "bg-gradient-to-br from-green-400 to-emerald-400"
                            : "bg-gradient-to-br from-red-400 to-pink-400"
                        )}>
                          {isPassed ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : (
                            <XCircle className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{qc.transaction_code}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Batch: {qc.reference_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={cn(
                          "text-white",
                          isPassed ? "bg-green-500" : "bg-red-500"
                        )}>
                          {isPassed ? 'PASSED' : 'FAILED'}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Tested on</p>
                          <p className="font-medium">{new Date(qc.transaction_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Test Results */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Test Results</h4>
                      {testResults.map((test, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {test.status === 'pass' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : test.status === 'warning' ? (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-sm font-medium">{test.test_name}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm">
                              {test.value} {test.unit}
                            </span>
                            <span className="text-sm text-gray-500">
                              (Limit: {test.limit} {test.unit})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sensory Evaluation */}
                    {qc.metadata?.sensory_evaluation && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">Sensory Evaluation</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(qc.metadata.sensory_evaluation).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress value={value.score * 10} className="h-2 flex-1" />
                                <span className="text-sm font-medium">{value.score}/10</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}