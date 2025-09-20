'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Package, Factory, TruckIcon, BarChart, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { SalesOrderForm } from './transactions/SalesOrderForm'
import { PurchaseOrderForm } from './transactions/PurchaseOrderForm'

interface TransactionMetric {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ComponentType<any>
}

const metrics: TransactionMetric[] = [
  {
    title: 'Sales Orders',
    value: '127',
    change: '+12%',
    changeType: 'positive',
    icon: ShoppingCart
  },
  {
    title: 'Purchase Orders',
    value: '43',
    change: '+8%',
    changeType: 'positive',
    icon: Package
  },
  {
    title: 'Production Orders',
    value: '21',
    change: '-3%',
    changeType: 'negative',
    icon: Factory
  },
  {
    title: 'Deliveries',
    value: '89',
    change: '+15%',
    changeType: 'positive',
    icon: TruckIcon
  }
]

export function TransactionsDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const handleSalesOrderSubmit = (data: any) => {
    console.log('Sales order submitted:', data)
    // Handle sales order creation
  }

  const handlePurchaseOrderSubmit = (data: any) => {
    console.log('Purchase order submitted:', data)
    // Handle purchase order creation
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Manage sales, purchase, and production orders</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className={`text-sm ${
                      metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change} from last month
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Orders</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <p className="font-medium">SO-001</p>
                      <p className="text-sm text-muted-foreground">Customer ABC Ltd</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">AED 12,500</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Confirmed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <p className="font-medium">PO-023</p>
                      <p className="text-sm text-muted-foreground">Supplier XYZ</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">AED 8,750</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Monthly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Transaction trends chart would go here</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Sales Order</CardTitle>
              <CardDescription>
                Create a new sales order for customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesOrderForm onSubmit={handleSalesOrderSubmit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Purchase Order</CardTitle>
              <CardDescription>
                Create a new purchase order for suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PurchaseOrderForm onSubmit={handlePurchaseOrderSubmit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Orders</CardTitle>
              <CardDescription>
                Manage production scheduling and orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Production order interface would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}