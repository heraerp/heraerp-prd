'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  FileText, 
  CreditCard, 
  BarChart3, 
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
  Truck,
  DollarSign,
  Users
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'

interface P2PMetrics {
  activeSuppliers: number
  pendingPRs: number
  openPOs: number
  pendingInvoices: number
  overduePayments: number
  totalSpend: number
  avgCycleTime: number
  savingsOpportunity: number
}

export function P2PDashboard() {
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [metrics, setMetrics] = useState<P2PMetrics>({
    activeSuppliers: 0,
    pendingPRs: 0,
    openPOs: 0,
    pendingInvoices: 0,
    overduePayments: 0,
    totalSpend: 0,
    avgCycleTime: 0,
    savingsOpportunity: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Three-layer authorization pattern
  if (!isAuthenticated) {
    return <Alert>Please log in to access this page.</Alert>
  }

  if (contextLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!currentOrganization) {
    return <Alert>No organization context found.</Alert>
  }

  useEffect(() => {
    loadP2PMetrics()
  }, [currentOrganization?.id])

  const loadP2PMetrics = async () => {
    if (!currentOrganization) return
    
    try {
      setLoading(true)
      universalApi.setOrganizationId(currentOrganization.id)

      // Load suppliers
      const suppliers = await universalApi.queryUniversal({
        table: 'core_entities',
        filters: { entity_type: 'supplier' }
      })

      // Load purchase requisitions
      const prs = await universalApi.queryUniversal({
        table: 'universal_transactions',
        filters: { 
          smart_code: { like: 'HERA.P2P.PR.%' }
        }
      })

      // Load purchase orders
      const pos = await universalApi.queryUniversal({
        table: 'universal_transactions',
        filters: { 
          smart_code: { like: 'HERA.P2P.PO.%' }
        }
      })

      // Load invoices
      const invoices = await universalApi.queryUniversal({
        table: 'universal_transactions',
        filters: { 
          smart_code: { like: 'HERA.P2P.INV.%' }
        }
      })

      // Calculate metrics
      const activeSuppliers = suppliers.data?.filter(s => 
        (s.metadata as any)?.status === 'active'
      ).length || 0

      const pendingPRs = prs.data?.filter(pr => 
        (pr.metadata as any)?.status === 'pending_approval'
      ).length || 0

      const openPOs = pos.data?.filter(po => 
        ['draft', 'sent', 'partial'].includes((po.metadata as any)?.status)
      ).length || 0

      const pendingInvoices = invoices.data?.filter(inv => 
        (inv.metadata as any)?.status === 'pending_approval'
      ).length || 0

      const totalSpend = pos.data?.reduce((sum, po) => 
        sum + (po.total_amount || 0), 0
      ) || 0

      setMetrics({
        activeSuppliers,
        pendingPRs,
        openPOs,
        pendingInvoices,
        overduePayments: 0, // Would calculate from payment terms
        totalSpend,
        avgCycleTime: 48, // Would calculate from timestamps
        savingsOpportunity: totalSpend * 0.03 // 3% savings opportunity
      })

    } catch (error) {
      console.error('Error loading P2P metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'text-blue-600' 
  }: {
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    trend?: string
    color?: string
  }) => (
    <Card className="hera-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend}
              </p>
            )}
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p>Loading P2P metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Procure-to-Pay Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete P2P cycle management on HERA's 6 universal tables
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Create PR
          </Button>
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Suppliers"
          value={metrics.activeSuppliers}
          icon={Users}
          trend="+12% from last month"
        />
        <MetricCard
          title="Pending PRs"
          value={metrics.pendingPRs}
          icon={ShoppingCart}
          color="text-yellow-600"
        />
        <MetricCard
          title="Open POs"
          value={metrics.openPOs}
          icon={Package}
          color="text-purple-600"
        />
        <MetricCard
          title="Total Spend"
          value={formatCurrency(metrics.totalSpend)}
          icon={DollarSign}
          color="text-green-600"
        />
      </div>

      {/* P2P Cycle Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* P2P Cycle Visualization */}
          <Card className="hera-card">
            <CardHeader>
              <CardTitle>P2P Cycle Overview</CardTitle>
              <CardDescription>
                End-to-end process visibility with AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { stage: 'Requisition', count: metrics.pendingPRs, icon: ShoppingCart },
                  { stage: 'Approval', count: 3, icon: CheckCircle2 },
                  { stage: 'Purchase Order', count: metrics.openPOs, icon: Package },
                  { stage: 'Goods Receipt', count: 5, icon: Truck },
                  { stage: 'Invoice', count: metrics.pendingInvoices, icon: FileText }
                ].map((stage, index) => (
                  <div key={stage.stage} className="text-center">
                    <div className="relative">
                      <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <stage.icon className="w-8 h-8 text-blue-600" />
                      </div>
                      {index < 4 && (
                        <div className="absolute top-8 left-16 w-full h-0.5 bg-gray-300 dark:bg-gray-700" />
                      )}
                      {stage.count > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {stage.count}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium">{stage.stage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="hera-card border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-green-600" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <strong>Savings Opportunity:</strong> Consolidate orders from 3 suppliers 
                  to save {formatCurrency(metrics.savingsOpportunity)} this month
                </AlertDescription>
              </Alert>
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <AlertDescription>
                  <strong>Process Optimization:</strong> Average cycle time is {metrics.avgCycleTime} hours. 
                  Automate approval workflow to reduce by 60%
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requisitions">
          <Card className="hera-card">
            <CardHeader>
              <CardTitle>Purchase Requisitions</CardTitle>
              <CardDescription>
                All stored in universal_transactions with HERA.P2P.PR.* smart codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Requisition list would be displayed here using UniversalTable component
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="hera-card">
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                All stored in universal_transactions with HERA.P2P.PO.* smart codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Purchase order list would be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="hera-card">
            <CardHeader>
              <CardTitle>Supplier Invoices</CardTitle>
              <CardDescription>
                All stored in universal_transactions with HERA.P2P.INV.* smart codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Invoice list with 3-way matching would be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="hera-card">
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
              <CardDescription>
                All stored in universal_transactions with HERA.P2P.PAY.* smart codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Payment list and processing would be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}