'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap
} from 'recharts'
import {
  Calculator,
  TrendingUp,
  Package,
  Factory,
  DollarSign,
  Activity,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'

interface CostingDashboardProps {
  organizationId: string
}

// Demo data
const costBreakdown = [
  { name: 'Material', value: 45000, percentage: 45, color: '#0088FE' },
  { name: 'Labor', value: 25000, percentage: 25, color: '#00C49F' },
  { name: 'Machine', value: 15000, percentage: 15, color: '#FFBB28' },
  { name: 'Overhead', value: 15000, percentage: 15, color: '#FF8042' }
]

const marginWaterfall = [
  { name: 'Revenue', value: 150000, type: 'positive' },
  { name: 'Material Cost', value: -45000, type: 'negative' },
  { name: 'Labor Cost', value: -25000, type: 'negative' },
  { name: 'CM1', value: 80000, type: 'margin' },
  { name: 'Variable OH', value: -15000, type: 'negative' },
  { name: 'CM2', value: 65000, type: 'margin' },
  { name: 'Fixed OH', value: -15000, type: 'negative' },
  { name: 'CM3', value: 50000, type: 'margin' }
]

const recentEstimates = [
  {
    id: '1',
    product: 'Premium Widget A',
    plant: 'PLANT-01',
    variant: 'STDZ',
    totalCost: 125.5,
    unitCost: 125.5,
    status: 'calculated',
    date: '2024-01-15'
  },
  {
    id: '2',
    product: 'Standard Widget B',
    plant: 'PLANT-01',
    variant: 'STDZ',
    totalCost: 87.25,
    unitCost: 87.25,
    status: 'released',
    date: '2024-01-14'
  },
  {
    id: '3',
    product: 'Economy Widget C',
    plant: 'PLANT-02',
    variant: 'PLND',
    totalCost: 62.0,
    unitCost: 62.0,
    status: 'processing',
    date: '2024-01-13'
  }
]

const allocationRuns = [
  {
    id: '1',
    type: 'Assessment',
    sender: 'IT Services',
    receivers: 5,
    amount: 50000,
    driver: 'Headcount',
    status: 'completed',
    period: '2024-01'
  },
  {
    id: '2',
    type: 'Distribution',
    sender: 'Facilities',
    receivers: 8,
    amount: 75000,
    driver: 'Square Feet',
    status: 'completed',
    period: '2024-01'
  }
]

export function CostingDashboard({ organizationId }: CostingDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      calculated: { variant: 'default', icon: CheckCircle2 },
      released: { variant: 'success', icon: CheckCircle2 },
      processing: { variant: 'secondary', icon: Clock },
      error: { variant: 'destructive', icon: AlertCircle }
    }

    const config = variants[status] || variants.processing
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HERA Costing & Profitability</h1>
          <p className="text-muted-foreground">
            Revolutionary enterprise costing on 6 universal tables
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Calculator className="h-4 w-4 mr-2" />
          Zero Schema Changes
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Cost Estimates</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Material Cost %</p>
                <p className="text-2xl font-bold">45%</p>
              </div>
              <Layers className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg CM3 Margin</p>
                <p className="text-2xl font-bold text-green-600">33.3%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allocations MTD</p>
                <p className="text-2xl font-bold">{formatCurrency(125000)}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="estimates">Cost Estimates</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Component Breakdown</CardTitle>
                <CardDescription>Average distribution across all products</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Margin Waterfall */}
            <Card>
              <CardHeader>
                <CardTitle>Contribution Margin Analysis</CardTitle>
                <CardDescription>Revenue to CM3 waterfall</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={marginWaterfall}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                    <Bar
                      dataKey="value"
                      fill={(entry: any) => {
                        if (entry.type === 'positive') return '#00C49F'
                        if (entry.type === 'negative') return '#FF8042'
                        return '#0088FE'
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Current Activity Rates</CardTitle>
              <CardDescription>Rates by plant and activity type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Plant 01 - Labor</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(45)}/hr</p>
                  <p className="text-sm text-muted-foreground">Standard rate</p>
                </div>

                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Plant 01 - Machine</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(120)}/hr</p>
                  <p className="text-sm text-muted-foreground">Standard rate</p>
                </div>

                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Plant 02 - Labor</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(40)}/hr</p>
                  <p className="text-sm text-muted-foreground">Standard rate</p>
                </div>

                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Plant 02 - Machine</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(100)}/hr</p>
                  <p className="text-sm text-muted-foreground">Standard rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cost Estimates</CardTitle>
                  <CardDescription>Recent standard cost calculations</CardDescription>
                </div>
                <Button>
                  <Calculator className="h-4 w-4 mr-2" />
                  New Estimate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Plant</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEstimates.map(estimate => (
                      <TableRow key={estimate.id}>
                        <TableCell className="font-medium">{estimate.product}</TableCell>
                        <TableCell>{estimate.plant}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{estimate.variant}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(estimate.totalCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(estimate.unitCost)}
                        </TableCell>
                        <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                        <TableCell>{estimate.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Allocation Runs</CardTitle>
                  <CardDescription>Cost center allocations and distributions</CardDescription>
                </div>
                <Button>
                  <Activity className="h-4 w-4 mr-2" />
                  New Allocation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Receivers</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocationRuns.map(allocation => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <Badge variant="outline">{allocation.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{allocation.sender}</TableCell>
                        <TableCell>{allocation.receivers} cost centers</TableCell>
                        <TableCell>{allocation.driver}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(allocation.amount)}
                        </TableCell>
                        <TableCell>{allocation.period}</TableCell>
                        <TableCell>{getStatusBadge(allocation.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Dimensional Profitability</CardTitle>
              <CardDescription>Margin analysis by product, customer, and region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Profitability Heatmap */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Product Profitability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <p className="font-medium">Premium Widget A</p>
                      <p className="text-2xl font-bold text-green-600">42%</p>
                      <p className="text-sm text-muted-foreground">CM3 Margin</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                      <p className="font-medium">Standard Widget B</p>
                      <p className="text-2xl font-bold text-yellow-600">28%</p>
                      <p className="text-sm text-muted-foreground">CM3 Margin</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                      <p className="font-medium">Economy Widget C</p>
                      <p className="text-2xl font-bold text-red-600">15%</p>
                      <p className="text-sm text-muted-foreground">CM3 Margin</p>
                    </div>
                  </div>
                </div>

                {/* Price-Volume-Mix Bridge */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Price-Volume-Mix Analysis</h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-4 border rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-muted-foreground">Price Impact</p>
                      <p className="text-xl font-bold text-green-600">+{formatCurrency(25000)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Volume Impact</p>
                      <p className="text-xl font-bold text-primary">+{formatCurrency(15000)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Activity className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-sm text-muted-foreground">Mix Impact</p>
                      <p className="text-xl font-bold text-purple-600">+{formatCurrency(8000)}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-muted-foreground">Total Change</p>
                      <p className="text-xl font-bold text-green-600">+{formatCurrency(48000)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
