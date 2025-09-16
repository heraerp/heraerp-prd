'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { getHeraApi } from '@/src/lib/hera-api'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CreditCard,
  Receipt,
  Utensils
} from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down'
  className?: string
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  className
}) => {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === 'up' ? (
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={cn(trend === 'up' ? 'text-emerald-600' : 'text-red-600')}>
              {change > 0 ? '+' : ''}
              {change}%
            </span>
            {changeLabel && <span className="ml-1">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DemoDashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const heraApi = getHeraApi()

      // Load KPIs
      const kpiData = await heraApi.getDashboardData()
      setKpis(kpiData)

      // Load recent transactions
      const transactions = await heraApi.getTransactions(10)
      setRecentTransactions(transactions)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Mario's Italian Restaurant</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Demo Mode
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(kpis?.revenue?.today || 0)}
          change={calculateChange(kpis?.revenue?.today || 0, kpis?.revenue?.yesterday || 0)}
          changeLabel="from yesterday"
          icon={<DollarSign />}
          trend={kpis?.revenue?.today > kpis?.revenue?.yesterday ? 'up' : 'down'}
        />

        <KPICard
          title="Active Customers"
          value={kpis?.customers?.activeToday || 0}
          change={12}
          changeLabel="from last week"
          icon={<Users />}
          trend="up"
        />

        <KPICard
          title="Table Occupancy"
          value={`${Math.round((kpis?.operations?.occupancyRate || 0) * 100)}%`}
          change={8}
          icon={<Utensils />}
          trend="up"
          className="bg-emerald-50 dark:bg-emerald-950"
        />

        <KPICard
          title="Average Order"
          value={formatCurrency(kpis?.operations?.avgOrderValue || 0)}
          change={-3}
          changeLabel="from last month"
          icon={<ShoppingCart />}
          trend="down"
        />
      </div>

      {/* Performance Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue for the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {/* In a real app, this would be a chart component */}
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-2" />
                <p>Revenue Chart</p>
                <p className="text-sm">YTD: {formatCurrency(kpis?.revenue?.thisYear || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Real-time operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Kitchen Efficiency</span>
                <span className="text-sm font-medium">
                  {Math.round((kpis?.operations?.kitchenEfficiency || 0) * 100)}%
                </span>
              </div>
              <Progress value={(kpis?.operations?.kitchenEfficiency || 0) * 100} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Staff Productivity</span>
                <span className="text-sm font-medium">
                  {Math.round((kpis?.staff?.productivityScore || 0) * 100)}%
                </span>
              </div>
              <Progress value={(kpis?.staff?.productivityScore || 0) * 100} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Labor Cost</span>
                <span className="text-sm font-medium">
                  {Math.round((kpis?.staff?.laborCost || 0) * 100)}%
                </span>
              </div>
              <Progress
                value={(kpis?.staff?.laborCost || 0) * 100}
                className="[&>div]:bg-amber-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales and purchase activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full',
                          transaction.transaction_type === 'sale'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950'
                            : 'bg-blue-100 text-primary dark:bg-blue-950'
                        )}
                      >
                        {transaction.transaction_type === 'sale' ? (
                          <Receipt className="h-4 w-4" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{transaction.transaction_code}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.transaction_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(transaction.total_amount)}
                      </p>
                      <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4">
                View All Transactions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Low Stock Alert</p>
                    <p className="text-xs text-muted-foreground">
                      {kpis?.inventory?.lowStockAlerts || 0} items below reorder point
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Expiring Products</p>
                    <p className="text-xs text-muted-foreground">
                      {kpis?.inventory?.expiringAlerts || 0} items expiring soon
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pending Payments</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(kpis?.financial?.accountsReceivable || 0)} outstanding
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Collect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>Current stock levels and value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(kpis?.inventory?.totalValue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Turnover Rate</p>
                    <p className="text-2xl font-bold">{kpis?.inventory?.turnoverRate || 0}x</p>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">Stock Levels by Category</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Food Inventory</span>
                      <span className="text-sm font-medium">$12,500</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Beverage Inventory</span>
                      <span className="text-sm font-medium">$8,200</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Supplies</span>
                      <span className="text-sm font-medium">$3,400</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Manage Inventory
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
