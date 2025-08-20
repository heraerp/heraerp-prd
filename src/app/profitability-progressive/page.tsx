'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { useProgressiveFinancialData } from '@/hooks/use-progressive-data'
import { 
  DollarSign, TrendingUp, PieChart, BarChart3, Calculator,
  Building2, Package, Users, FileText, Target, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight, Plus,
  Layers, GitBranch, Zap, Shield, AlertTriangle, BookmarkPlus,
  CheckCircle, Download, Clock
} from 'lucide-react'

export default function ProfitabilityProgressivePage() {
  const { workspace, isAnonymous, startAnonymous, isLoading } = useAuth()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [profitCenters, setProfitCenters] = useState<any[]>([])
  const [costingData, setCostingData] = useState<any>({})
  
  // Progressive data persistence for profitability analysis
  const { 
    data: profitabilityData, 
    saveData, 
    updateData, 
    exportData,
    lastSaved 
  } = useProgressiveFinancialData()
  
  // Track user interactions for progressive experience
  const handleAnalysisRun = (analysisType: string) => {
    // Update progressive data with analysis preferences
    updateData((current) => ({
      ...current,
      lastAnalysisType: analysisType,
      analysisHistory: [
        ...(current?.analysisHistory || []),
        {
          type: analysisType,
          timestamp: new Date().toISOString(),
          results: 'success'
        }
      ],
      profitabilityPreferences: {
        ...current?.profitabilityPreferences,
        preferredAnalysis: analysisType
      }
    }))
  }
  
  // Auto-create workspace on first visit
  useEffect(() => {
    if (!isLoading && !workspace) {
      startAnonymous()
    }
  }, [isLoading, workspace, startAnonymous])
  
  // Load sample data when workspace is ready
  useEffect(() => {
    if (workspace) {
      loadSampleProfitabilityData()
    }
  }, [workspace])
  
  const loadSampleProfitabilityData = () => {
    // Sample profit centers with realistic data
    setProfitCenters([
      {
        id: 'PC001',
        name: 'Manufacturing Division',
        type: 'production',
        revenue: workspace.data_status === 'sample' ? 2450000 : 2450000,
        costs: 1876000,
        profit: 574000,
        margin: 23.4,
        smartCode: 'HERA.PROF.PC.MFG.v1',
        trend: 'up',
        variance: '+5.2%'
      },
      {
        id: 'PC002', 
        name: 'Sales & Distribution',
        type: 'sales',
        revenue: workspace.data_status === 'sample' ? 1850000 : 1850000,
        costs: 1295000,
        profit: 555000,
        margin: 30.0,
        smartCode: 'HERA.PROF.PC.SALES.v1',
        trend: 'up',
        variance: '+8.1%'
      },
      {
        id: 'PC003',
        name: 'Service Department',
        type: 'service',
        revenue: workspace.data_status === 'sample' ? 650000 : 650000,
        costs: 442000,
        profit: 208000,
        margin: 32.0,
        smartCode: 'HERA.PROF.PC.SVC.v1',
        trend: 'up',
        variance: '+2.3%'
      }
    ])
    
    // Sample product costing with BOM integration
    setCostingData({
      products: [
        {
          id: 'PROD001',
          name: 'Premium Widget A',
          bomCode: 'BOM001',
          directMaterial: 45.50,
          directLabor: 22.30,
          overheadAllocation: 18.75,
          totalCost: 86.55,
          sellingPrice: 125.00,
          grossMargin: 30.8,
          smartCode: 'HERA.COST.PROD.WIDGET.v1',
          volumeSold: workspace.data_status === 'sample' ? 5000 : 5000,
          totalRevenue: workspace.data_status === 'sample' ? 625000 : 625000
        },
        {
          id: 'PROD002',
          name: 'Standard Component B',
          bomCode: 'BOM002',
          directMaterial: 28.00,
          directLabor: 15.50,
          overheadAllocation: 12.25,
          totalCost: 55.75,
          sellingPrice: 85.00,
          grossMargin: 34.4,
          smartCode: 'HERA.COST.PROD.COMP.v1',
          volumeSold: workspace.data_status === 'sample' ? 3200 : 3200,
          totalRevenue: workspace.data_status === 'sample' ? 272000 : 272000
        }
      ],
      costPools: [
        {
          name: 'Machine Hours',
          totalCost: 450000,
          driver: 'machine_hours',
          rate: 125.00,
          smartCode: 'HERA.COST.POOL.MH.v1',
          utilization: 87.5
        },
        {
          name: 'Setup Costs',
          totalCost: 180000,
          driver: 'setups',
          rate: 1500.00,
          smartCode: 'HERA.COST.POOL.SETUP.v1',
          utilization: 92.3
        }
      ]
    })
  }
  
  if (isLoading || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <PieChart className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Setting up your profitability workspace...</p>
        </div>
      </div>
    )
  }
  
  // Calculate totals
  const totalRevenue = profitCenters.reduce((sum, pc) => sum + pc.revenue, 0)
  const totalCosts = profitCenters.reduce((sum, pc) => sum + pc.costs, 0)
  const totalProfit = profitCenters.reduce((sum, pc) => sum + pc.profit, 0)
  const overallMargin = (totalProfit / totalRevenue * 100).toFixed(1)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  HERA Profitability & Cost Accounting
                </h1>
                <p className="text-sm text-slate-600">
                  {workspace.type === 'anonymous' ? 'Try it free - no signup required' : workspace.organization_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAnonymous && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Instant Access</span>
                </div>
              )}
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                HERA.PROF.v1 Active
              </Badge>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to Advanced Cost Accounting & Profitability Analysis
          </h2>
          <p className="text-lg text-slate-600 max-w-4xl mx-auto">
            Comprehensive profitability analysis with activity-based costing, BOM integration, and AI-powered insights. 
            Start analyzing costs, profit centers, and product profitability immediately with sample data.
          </p>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${totalRevenue.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+15.3%</span>
                  </div>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Total Costs</p>
                  <p className="text-2xl font-bold text-red-900">
                    ${totalCosts.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-sm text-red-600">+8.2%</span>
                  </div>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <Calculator className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Net Profit</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${totalProfit.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-600">+24.5%</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Profit Margin</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {overallMargin}%
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-purple-600 mr-1" />
                    <span className="text-sm text-purple-600">+3.2pp</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Target className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profit-centers">Profit Centers</TabsTrigger>
            <TabsTrigger value="product-costing">Product Costing</TabsTrigger>
            <TabsTrigger value="cost-allocation">Cost Allocation</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profit Center Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Profit Center Performance
                  </CardTitle>
                  <CardDescription>
                    Real-time profitability by business unit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profitCenters.map((pc) => (
                      <div 
                        key={pc.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleAnalysisRun(`profit_center_${pc.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{pc.name}</h4>
                            <Badge variant="outline" className="text-xs mt-1">
                              {pc.smartCode}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={pc.margin >= 30 ? 'default' : pc.margin >= 20 ? 'secondary' : 'destructive'}
                            >
                              {pc.margin}% margin
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              {pc.variance} vs last month
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Revenue</p>
                            <p className="font-medium">${pc.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Costs</p>
                            <p className="font-medium">${pc.costs.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Profit</p>
                            <p className="font-medium text-green-600">
                              ${pc.profit.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Product Profitability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Profitability Analysis
                  </CardTitle>
                  <CardDescription>
                    BOM-integrated product costing with real-time updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {costingData.products?.map((product: any) => (
                      <div 
                        key={product.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleAnalysisRun(`product_${product.id}`)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                BOM: {product.bomCode}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {product.smartCode}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {product.grossMargin}%
                            </p>
                            <p className="text-xs text-gray-600">Gross Margin</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Units Sold</p>
                            <p className="font-medium">{product.volumeSold.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Revenue</p>
                            <p className="font-medium text-green-600">
                              ${product.totalRevenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Cost Structure Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Activity-Based Cost Structure
                </CardTitle>
                <CardDescription>
                  Real-time cost pool utilization and driver analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {costingData.costPools?.map((pool: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{pool.name}</h4>
                          <Badge variant="outline" className="text-xs mt-1">
                            {pool.smartCode}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${pool.totalCost.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{pool.utilization}% utilized</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Cost Driver</span>
                          <span className="font-medium">{pool.driver}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rate per Unit</span>
                          <span className="font-medium">${pool.rate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Progressive Insights */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  AI-Powered Profitability Insights
                </CardTitle>
                <CardDescription>
                  Smart recommendations based on your {workspace.data_status === 'sample' ? 'sample' : 'real'} data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Margin Optimization Opportunity
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Product B could increase margins by 8.5% through material cost optimization and batch sizing.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-yellow-700"
                        onClick={() => handleAnalysisRun('margin_optimization')}
                      >
                        Analyze Optimization
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        HERA.PROF.AI.OPT.v1
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Cost Pool Efficiency Alert
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Machine Hours pool operating at 87.5% efficiency. Consider capacity optimization.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-700"
                        onClick={() => handleAnalysisRun('cost_pool_efficiency')}
                      >
                        View Efficiency Report
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        HERA.COST.POOL.MH.v1
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tabs with progressive interactions */}
          <TabsContent value="profit-centers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profit Center Management</CardTitle>
                    <CardDescription>
                      Configure and manage profit centers with real-time analysis
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAnalysisRun('create_profit_center')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Profit Center
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Advanced Profit Center Analysis</h3>
                  <p className="text-gray-600 mb-4">
                    Create hierarchical profit centers and analyze performance with variance reporting
                  </p>
                  <Button 
                    onClick={() => handleAnalysisRun('profit_center_wizard')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Start Profit Center Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="product-costing">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>BOM-Integrated Product Costing</CardTitle>
                    <CardDescription>
                      Multi-level BOM explosion with activity-based costing
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAnalysisRun('calculate_product_cost')}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Costs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Advanced Product Costing</h3>
                  <p className="text-gray-600 mb-4">
                    Real-time BOM integration with multi-level explosion and variance analysis
                  </p>
                  <Button 
                    onClick={() => handleAnalysisRun('bom_costing_analysis')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Analyze Product Costs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cost-allocation">
            <Card>
              <CardContent className="p-8 text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Activity-Based Cost Allocation</h3>
                <p className="text-gray-600 mb-4">Configure cost pools and allocation methods</p>
                <Button 
                  onClick={() => handleAnalysisRun('cost_allocation_setup')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Configure Cost Allocation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis">
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Advanced Profitability Analytics</h3>
                <p className="text-gray-600 mb-4">Multi-dimensional profitability analysis and reporting</p>
                <Button 
                  onClick={() => handleAnalysisRun('advanced_analytics')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Run Advanced Analysis
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Progressive Save Prompt */}
        {isAnonymous && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white text-center">
            <h3 className="text-xl font-bold mb-2">Save Your Profitability Analysis</h3>
            <p className="mb-4 text-blue-100">
              Create an account to save cost allocations, profitability reports, and BOM integrations permanently
            </p>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/auth/register')}
            >
              <BookmarkPlus className="w-5 h-5 mr-2" />
              Save My Analysis
            </Button>
          </div>
        )}
        
        {/* Progressive Data Status */}
        {workspace && lastSaved && (
          <div className="mt-6 p-3 bg-gray-100 rounded-lg flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">
                Your profitability analysis is automatically saved locally
              </span>
            </div>
            <div className="flex items-center gap-4">
              {lastSaved && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last saved: {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => exportData()}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}