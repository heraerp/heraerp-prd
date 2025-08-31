'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useDemoOrg } from '@/components/providers/DemoOrgProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Factory, 
  Plus,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Beaker,
  TrendingUp,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ProductionBatch {
  id: string
  transaction_code: string
  transaction_date: string
  total_amount: number
  transaction_status: string
  metadata: any
  universal_transaction_lines: any[]
}

interface Recipe {
  id: string
  entity_name: string
  entity_code: string
  metadata: any
}

export default function ProductionPage() {
  const { organizationId, loading: orgLoading } = useDemoOrg()
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<ProductionBatch[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'completed'>('active')
  const [todaysProduction, setTodaysProduction] = useState(0)
  const [efficiencyRate, setEfficiencyRate] = useState(0)

  useEffect(() => {
    if (organizationId && !orgLoading) {
      fetchProductionData()
    }
  }, [organizationId, orgLoading])

  async function fetchProductionData() {
    if (!organizationId) return
    
    try {
      // Fetch production batches
      const { data: productionData } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          universal_transaction_lines (*)
        `)
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'production_batch')
        .order('created_at', { ascending: false })

      // Fetch recipes
      const { data: recipeData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'recipe')

      setBatches(productionData || [])
      setRecipes(recipeData || [])
      
      // Calculate today's production and efficiency
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let totalLitersToday = 0
      let totalEfficiency = 0
      let efficiencyCount = 0
      
      productionData?.forEach(batch => {
        const batchDate = new Date(batch.transaction_date)
        batchDate.setHours(0, 0, 0, 0)
        
        // Check if batch is from today
        if (batchDate.getTime() === today.getTime()) {
          if (batch.metadata?.actual_output_liters) {
            totalLitersToday += parseFloat(batch.metadata.actual_output_liters)
          }
        }
        
        // Calculate efficiency for all recent batches
        if (batch.metadata?.yield_variance_percent !== undefined) {
          totalEfficiency += (100 + parseFloat(batch.metadata.yield_variance_percent))
          efficiencyCount++
        }
      })
      
      setTodaysProduction(totalLitersToday)
      setEfficiencyRate(efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0)
    } catch (error) {
      console.error('Error fetching production data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeBatches = batches.filter(b => b.transaction_status === 'in_progress')
  const scheduledBatches = batches.filter(b => b.transaction_status === 'scheduled')
  const completedBatches = batches.filter(b => b.transaction_status === 'completed')

  const currentBatches = 
    activeTab === 'active' ? activeBatches :
    activeTab === 'scheduled' ? scheduledBatches :
    completedBatches

  function getStatusBadge(status: string) {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-500 text-white">In Progress</Badge>
      case 'scheduled':
        return <Badge className="bg-yellow-500 text-white">Scheduled</Badge>
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getBatchProgress(batch: ProductionBatch): number {
    if (!batch.metadata?.production_progress) return 0
    return parseInt(batch.metadata.production_progress) || 0
  }

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Production Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage ice cream production batches
          </p>
        </div>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Batch
        </Button>
      </div>

      {/* Production Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Production</p>
                <p className="text-2xl font-bold mt-1">
                  {todaysProduction > 0 ? `${todaysProduction.toLocaleString()} L` : '0 L'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Factory className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Batches</p>
                <p className="text-2xl font-bold mt-1">{activeBatches.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Efficiency Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {efficiencyRate > 0 ? `${efficiencyRate.toFixed(2)}%` : '0%'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Recipes</p>
                <p className="text-2xl font-bold mt-1">{recipes.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Beaker className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {(['active', 'scheduled', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-md font-medium text-sm transition-all",
              activeTab === tab
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-2 text-xs">
              ({tab === 'active' ? activeBatches.length : 
                tab === 'scheduled' ? scheduledBatches.length : 
                completedBatches.length})
            </span>
          </button>
        ))}
      </div>

      {/* Batch List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
            <CardContent className="p-12 text-center">
              <div className="animate-pulse">Loading production data...</div>
            </CardContent>
          </Card>
        ) : currentBatches.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {activeTab} batches found</p>
            </CardContent>
          </Card>
        ) : (
          currentBatches.map((batch) => (
            <Card 
              key={batch.id}
              className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                      <Factory className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{batch.transaction_code}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {batch.metadata?.product_name || 'Vanilla Ice Cream 500ml'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(batch.transaction_status)}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Output</p>
                      <p className="font-semibold">{batch.metadata?.actual_output || '284'} units</p>
                    </div>
                  </div>
                </div>

                {batch.transaction_status === 'in_progress' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Production Progress</span>
                      <span className="font-medium">{getBatchProgress(batch)}%</span>
                    </div>
                    <Progress value={getBatchProgress(batch)} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Start Time</p>
                    <p className="text-sm font-medium mt-1">
                      {new Date(batch.transaction_date).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Material Cost</p>
                    <p className="text-sm font-medium mt-1">
                      ₹{batch.metadata?.material_cost || batch.total_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Efficiency</p>
                    <p className="text-sm font-medium mt-1">
                      {batch.metadata?.yield_variance_percent !== undefined ? 
                        `${(100 + parseFloat(batch.metadata.yield_variance_percent)).toFixed(2)}%` : 
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">QC Status</p>
                    <div className="mt-1">
                      {batch.metadata?.qc_status === 'passed' ? (
                        <Badge className="bg-green-500 text-white text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Passed
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500 text-white text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {batch.transaction_status === 'in_progress' && (
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <PauseCircle className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                    <Button variant="outline" size="sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Report Issue
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}