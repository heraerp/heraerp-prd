'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, TrendingUp, PieChart, BarChart3, Calculator,
  Building2, Package, Users, FileText, Target, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight, Plus,
  Layers, GitBranch, Zap, Shield, AlertTriangle
} from 'lucide-react'

export default function ProfitabilityPage() {
  const { workspace, isAnonymous, startAnonymous, isLoading } = useAuth()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [profitCenters, setProfitCenters] = useState<any[]>([])
  const [costingData, setCostingData] = useState<any>({})
  
  // Auto-create workspace on first visit
  useEffect(() => {
    if (!isLoading && !workspace) {
      startAnonymous()
    }
  }, [isLoading, workspace, startAnonymous])
  
  // Load sample data
  useEffect(() => {
    if (workspace) {
      loadSampleData()
    }
  }, [workspace])
  
  const loadSampleData = () => {
    // Sample profit centers
    setProfitCenters([
      {
        id: 'PC001',
        name: 'Manufacturing Division',
        type: 'production',
        revenue: 2450000,
        costs: 1876000,
        profit: 574000,
        margin: 23.4,
        smartCode: 'HERA.PROF.PC.MFG.v1'
      },
      {
        id: 'PC002', 
        name: 'Sales & Distribution',
        type: 'sales',
        revenue: 1850000,
        costs: 1295000,
        profit: 555000,
        margin: 30.0,
        smartCode: 'HERA.PROF.PC.SALES.v1'
      },
      {
        id: 'PC003',
        name: 'Service Department',
        type: 'service',
        revenue: 650000,
        costs: 442000,
        profit: 208000,
        margin: 32.0,
        smartCode: 'HERA.PROF.PC.SVC.v1'
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
          smartCode: 'HERA.COST.PROD.WIDGET.v1'
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
          smartCode: 'HERA.COST.PROD.COMP.v1'
        }
      ],
      costPools: [
        {
          name: 'Machine Hours',
          totalCost: 450000,
          driver: 'machine_hours',
          rate: 125.00,
          smartCode: 'HERA.COST.POOL.MH.v1'
        },
        {
          name: 'Setup Costs',
          totalCost: 180000,
          driver: 'setups',
          rate: 1500.00,
          smartCode: 'HERA.COST.POOL.SETUP.v1'
        }
      ]
    })
  }
  
  if (isLoading || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 animate-pulse bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <PieChart className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading Profitability & Cost Accounting...</p>
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
                  Profitability & Cost Accounting
                </h1>
                <p className="text-sm text-slate-600">
                  Advanced cost analysis with BOM integration
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                HERA.PROF.v1 Active
              </Badge>
              <Button 
                onClick={() => router.push('/profitability/settings')}
                variant="outline"
              >
                Cost Settings
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* KPI Cards */}
      <div className="container mx-auto px-6 py-8">
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
                      <div key={pc.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{pc.name}</h4>
                            <Badge variant="outline" className="text-xs mt-1">
                              {pc.smartCode}
                            </Badge>
                          </div>
                          <Badge 
                            variant={pc.margin >= 30 ? 'default' : pc.margin >= 20 ? 'secondary' : 'destructive'}
                          >
                            {pc.margin}% margin
                          </Badge>
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
              
              {/* Cost Structure Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Cost Structure Analysis
                  </CardTitle>
                  <CardDescription>
                    Activity-based costing breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Cost Categories */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Direct Materials</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">$1,245,000</p>
                          <p className="text-xs text-gray-600">35% of total</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Direct Labor</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">$890,000</p>
                          <p className="text-xs text-gray-600">25% of total</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">Manufacturing Overhead</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">$678,000</p>
                          <p className="text-xs text-gray-600">19% of total</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">Sales & Admin</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">$750,000</p>
                          <p className="text-xs text-gray-600">21% of total</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cost Drivers */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Top Cost Drivers
                      </h4>
                      <div className="space-y-2 text-sm">
                        {costingData.costPools?.map((pool: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-gray-600">{pool.name}</span>
                            <div className="text-right">
                              <span className="font-medium">${pool.totalCost.toLocaleString()}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ${pool.rate}/{pool.driver}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Profitability Alerts */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Profitability Alerts & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Low Margin Product Alert
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      3 products have margins below 15%. Consider price adjustments or cost reduction.
                    </p>
                    <Button size="sm" variant="outline" className="text-yellow-700">
                      Review Products
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">
                      Cost Reduction Opportunity
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Overhead allocation can be optimized by 12% through activity consolidation.
                    </p>
                    <Button size="sm" variant="outline" className="text-green-700">
                      View Analysis
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Product Costing Tab */}
          <TabsContent value="product-costing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Cost Analysis</CardTitle>
                    <CardDescription>
                      Detailed costing with BOM integration
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Calculate New Product Cost
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costingData.products?.map((product: any) => (
                    <div key={product.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {product.id}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              BOM: {product.bomCode}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {product.smartCode}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {product.grossMargin}%
                          </p>
                          <p className="text-sm text-gray-600">Gross Margin</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Direct Material</p>
                          <p className="font-semibold">${product.directMaterial}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Direct Labor</p>
                          <p className="font-semibold">${product.directLabor}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600">Overhead</p>
                          <p className="font-semibold">${product.overheadAllocation}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-xs text-blue-600">Total Cost</p>
                          <p className="font-bold text-blue-900">${product.totalCost}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-xs text-green-600">Selling Price</p>
                          <p className="font-bold text-green-900">${product.sellingPrice}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          View BOM Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Cost History
                        </Button>
                        <Button size="sm" variant="outline">
                          Variance Analysis
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tabs content placeholder */}
          <TabsContent value="profit-centers">
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Profit Center Management</h3>
                <p className="text-gray-600">Configure and manage profit centers</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cost-allocation">
            <Card>
              <CardContent className="p-8 text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Cost Allocation Rules</h3>
                <p className="text-gray-600">Define activity-based cost allocation</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis">
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Advanced Analysis</h3>
                <p className="text-gray-600">Profitability reports and analytics</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Progressive Save Prompt */}
        {isAnonymous && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white text-center">
            <h3 className="text-xl font-bold mb-2">Save Your Profitability Analysis</h3>
            <p className="mb-4 text-blue-100">
              Create an account to save cost allocations and profitability reports
            </p>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/auth/register')}
            >
              <Shield className="w-5 h-5 mr-2" />
              Save My Analysis
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}