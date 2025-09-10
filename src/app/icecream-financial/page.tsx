'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { 
  IceCream,
  BookOpen,
  Receipt,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Snowflake,
  Thermometer
} from 'lucide-react'
// Temporarily comment out problematic imports for build fix
// import { GLModule } from '@/lib/dna/modules/financial/gl-module-dna'
// import { APModule } from '@/lib/dna/modules/financial/ap-module-dna'
// import { ARModule } from '@/lib/dna/modules/financial/ar-module-dna'
// import { FAModule } from '@/lib/dna/modules/financial/fa-module-dna'
// import { supabaseClient } from '@/lib/supabase-client'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function IceCreamFinancialPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const isDarkMode = true // Always use dark mode to match the rest of the app
  const [activeModule, setActiveModule] = useState<'overview' | 'gl' | 'ap' | 'ar' | 'fa'>('overview')
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState({
    revenueMTD: 0,
    revenueGrowth: 0,
    coldChainCost: 0,
    coldChainPercent: 0,
    apOutstanding: 0,
    apOverdue: 0,
    arOutstanding: 0,
    dso: 0,
    temperatureVarianceCost: 0,
    temperatureIncidents: 0,
    batchProfitability: 0,
    seasonalGrowth: 0,
    recentTransactions: [] as any[]
  })
  
  // Ice cream organization ID
  const organizationId = currentOrganization?.id || '1471e87b-b27e-42ef-8192-343cc5e0d656'

  useEffect(() => {
    fetchFinancialData()
  }, [organizationId])

  async function fetchFinancialData() {
    if (!organizationId) return

    try {
      // Get current month dates
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      // Fetch all transactions using API client
      const allTransactions = await apiClient.getTransactions(organizationId, undefined, 200)

      // Filter transactions by date and type (client-side filtering for now)
      const currentMonthTxns = allTransactions.filter(t => {
        const txnDate = new Date(t.transaction_date)
        return ['pos_sale', 'invoice'].includes(t.transaction_type) &&
               txnDate >= startOfMonth && txnDate <= now
      })

      const lastMonthTxns = allTransactions.filter(t => {
        const txnDate = new Date(t.transaction_date)
        return ['pos_sale', 'invoice'].includes(t.transaction_type) &&
               txnDate >= startOfLastMonth && txnDate <= endOfLastMonth
      })

      // Calculate revenues
      const currentRevenue = currentMonthTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const lastRevenue = lastMonthTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

      // Filter cold chain costs (client-side filtering)
      const coldChainTxns = allTransactions.filter(t => {
        const txnDate = new Date(t.transaction_date)
        return ['expense', 'utility'].includes(t.transaction_type) &&
               txnDate >= startOfMonth &&
               (t.smart_code?.includes('COLD') || 
                t.smart_code?.includes('FREEZER') || 
                t.smart_code?.includes('ENERGY'))
      })

      const coldChainTotal = coldChainTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const coldChainPercent = currentRevenue > 0 ? (coldChainTotal / currentRevenue) * 100 : 0

      // Filter AP and AR from existing transactions
      const apTxns = allTransactions.filter(t => 
        t.transaction_type === 'purchase_invoice' && t.transaction_status === 'pending'
      )

      const apOutstanding = apTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const apOverdue = apTxns.filter(t => {
        const dueDate = new Date(t.metadata?.due_date || t.created_at)
        return dueDate < now
      }).length

      const arTxns = allTransactions.filter(t => 
        t.transaction_type === 'invoice' && t.transaction_status === 'pending'
      )

      const arOutstanding = arTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      
      // Calculate DSO (Days Sales Outstanding)
      const avgDailySales = currentRevenue / now.getDate()
      const dso = avgDailySales > 0 ? Math.round(arOutstanding / avgDailySales) : 0

      // Use fallback data for temperature variance and batch metrics
      const temperatureVarianceCost = 2500 // Sample temperature variance cost
      const temperatureIncidents = 3 // Sample incident count
      const batchProfitability = 23.5 // Sample batch profitability
      const seasonalGrowth = 45 // Sample seasonal growth
      
      // Use recent transactions from existing data
      const recentTxns = allTransactions.slice(0, 5).map(txn => ({
        ...txn,
        source_entity: { entity_name: txn.transaction_code || 'Unknown' }
      }))

      setFinancialData({
        revenueMTD: currentRevenue,
        revenueGrowth,
        coldChainCost: coldChainTotal,
        coldChainPercent,
        apOutstanding,
        apOverdue,
        arOutstanding,
        dso,
        temperatureVarianceCost,
        temperatureIncidents,
        batchProfitability,
        seasonalGrowth,
        recentTransactions: recentTxns
      })

    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen dark flex items-center justify-center" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark" style={{ backgroundColor: '#0f0f0f' }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                <IceCream className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Ice Cream Financial Management
                </h1>
                <p className="text-sm text-gray-400">
                  Complete financial suite for ice cream manufacturing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Snowflake className="h-3 w-3" />
                Cold Chain Enabled
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                Batch Tracking
              </Badge>
            </div>
          </div>
        </div>

        {/* Module Navigation */}
        <Tabs value={activeModule} onValueChange={(v) => setActiveModule(v as any)}>
          <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-6 bg-gray-800">
            <TabsTrigger value="overview" className="gap-1">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gl" className="gap-1">
              <BookOpen className="h-4 w-4" />
              General Ledger
            </TabsTrigger>
            <TabsTrigger value="ap" className="gap-1">
              <Receipt className="h-4 w-4" />
              Payables
            </TabsTrigger>
            <TabsTrigger value="ar" className="gap-1">
              <Users className="h-4 w-4" />
              Receivables
            </TabsTrigger>
            <TabsTrigger value="fa" className="gap-1">
              <FileText className="h-4 w-4" />
              Fixed Assets
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Financial KPIs */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400">Revenue MTD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ₹{financialData.revenueMTD.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-green-600">
                    {financialData.revenueGrowth > 0 ? '+' : ''}{financialData.revenueGrowth.toFixed(1)}% vs last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400">Cold Chain Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ₹{financialData.coldChainCost.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-red-600">
                    {financialData.coldChainPercent.toFixed(1)}% of revenue
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400">AP Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ₹{financialData.apOutstanding.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-gray-600">
                    {financialData.apOverdue} overdue invoices
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-400">AR Outstanding</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ₹{financialData.arOutstanding.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-gray-600">
                    DSO: {financialData.dso} days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ice Cream Specific Metrics */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-100">
                Ice Cream Specific Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                        <Thermometer className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100">Temperature Variance Cost</h3>
                        <p className="text-2xl font-bold text-white">
                          ₹{financialData.temperatureVarianceCost.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-400">
                          {financialData.temperatureIncidents} incidents this month
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-400 flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100">Batch Profitability</h3>
                        <p className="text-2xl font-bold text-white">
                          {financialData.batchProfitability.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-400">Average margin</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100">Seasonal Revenue</h3>
                        <p className="text-2xl font-bold text-white">
                          {financialData.seasonalGrowth > 0 ? '+' : ''}{financialData.seasonalGrowth.toFixed(0)}%
                        </p>
                        <p className="text-sm text-gray-400">
                          {financialData.seasonalGrowth > 30 ? 'Summer peak active' : 'Year over year'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-100">
                Recent Financial Activities
              </h2>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {financialData.recentTransactions.length > 0 ? (
                      financialData.recentTransactions.map((txn) => (
                        <div key={txn.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-100">
                              {txn.transaction_type.charAt(0).toUpperCase() + txn.transaction_type.slice(1).replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-400">
                              {txn.source_entity?.entity_name || txn.transaction_code} - {txn.metadata?.description || ''}
                            </p>
                          </div>
                          <Badge 
                            variant={txn.transaction_type.includes('expense') || txn.transaction_type.includes('wastage') ? 'destructive' : 
                                    txn.transaction_type.includes('sale') || txn.transaction_type.includes('invoice') ? 'default' : 
                                    'outline'}
                            className={txn.transaction_type.includes('sale') || txn.transaction_type.includes('invoice') ? 
                                      'bg-green-900/30 text-green-400 border-green-800' : ''}
                          >
                            ₹{txn.total_amount?.toLocaleString('en-IN') || 0}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400">
                        No recent transactions
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* GL Module Tab */}
          <TabsContent value="gl">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">General Ledger Module</h3>
                  <p className="text-gray-400">Complete GL functionality for ice cream manufacturing</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>• Auto-journal posting with smart codes</p>
                    <p>• Cold chain expense tracking</p>
                    <p>• Batch-level cost allocation</p>
                    <p>• Temperature variance journals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AP Module Tab */}
          <TabsContent value="ap">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Accounts Payable Module</h3>
                  <p className="text-gray-400">Vendor payment management for ice cream operations</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>• Dairy supplier tracking</p>
                    <p>• Cold chain vendor management</p>
                    <p>• Quality certificate tracking</p>
                    <p>• Seasonal pricing agreements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AR Module Tab */}
          <TabsContent value="ar">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Accounts Receivable Module</h3>
                  <p className="text-gray-400">Customer billing for ice cream distribution</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>• Multi-channel billing</p>
                    <p>• Freezer deposit tracking</p>
                    <p>• Seasonal credit terms</p>
                    <p>• Return goods handling</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FA Module Tab */}
          <TabsContent value="fa">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Fixed Assets Module</h3>
                  <p className="text-gray-400">Cold chain equipment and asset management</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>• Freezer asset tracking</p>
                    <p>• Refrigerated vehicle management</p>
                    <p>• Temperature monitoring equipment</p>
                    <p>• Energy efficiency tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}