/**
 * Inventory Dashboard
 * Comprehensive inventory management overview
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  BarChart3,
  ShoppingCart,
  Truck,
  DollarSign,
  ArrowRight,
  ScanLine,
  FileText,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { CurrencyDisplay } from '@/components/ui/currency-input'

export default function InventoryDashboard() {
  // Mock data - in production, this would come from API
  const stats = {
    totalProducts: 156,
    totalValue: 45280.50,
    lowStockItems: 12,
    outOfStockItems: 3,
    pendingOrders: 5,
    monthlyUsage: 8920.00,
    reorderValue: 12500.00,
    expiringItems: 4
  }

  const lowStockProducts = [
    { id: 1, name: 'Professional Hair Color #6N', sku: 'HC-6N', current: 2, min: 10, retail_price: 45.00 },
    { id: 2, name: 'Argan Oil Treatment 100ml', sku: 'ARG-100', current: 5, min: 15, retail_price: 28.00 },
    { id: 3, name: 'Nail Polish - Ruby Red', sku: 'NP-RR', current: 1, min: 5, retail_price: 12.00 },
    { id: 4, name: 'Disposable Gloves (Box)', sku: 'DG-100', current: 3, min: 10, retail_price: 15.00 }
  ]

  const recentMovements = [
    { id: 1, type: 'in', product: 'Shampoo Professional 1L', quantity: 24, date: '2024-01-15', reason: 'Purchase Order #PO-2024-015' },
    { id: 2, type: 'out', product: 'Hair Spray Strong Hold', quantity: 3, date: '2024-01-15', reason: 'Used in services' },
    { id: 3, type: 'out', product: 'Nail Polish - Pink Pearl', quantity: 1, date: '2024-01-14', reason: 'Retail sale' },
    { id: 4, type: 'adjust', product: 'Cotton Pads (Pack)', quantity: -2, date: '2024-01-14', reason: 'Inventory count adjustment' }
  ]

  const topProducts = [
    { name: 'Keratin Treatment Kit', usage: 85, value: 2400 },
    { name: 'Professional Hair Color', usage: 78, value: 1890 },
    { name: 'Nail Polish Collection', usage: 65, value: 980 },
    { name: 'Hair Styling Cream', usage: 60, value: 720 },
    { name: 'Face Cleansing Oil', usage: 45, value: 540 }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor stock levels, track product movement, and manage suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ScanLine className="w-4 h-4 mr-2" />
            Scan Product
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button size="sm">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across 10 categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay value={stats.totalValue} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alert</CardTitle>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.outOfStockItems} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
              <Truck className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CurrencyDisplay value={stats.reorderValue} /> total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Products that need reordering</CardDescription>
              </div>
              <Link href="/salon/products">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {product.current}/{product.min}
                      </Badge>
                    </div>
                    <Progress 
                      value={(product.current / product.min) * 100} 
                      className="h-1.5 mt-2"
                    />
                  </div>
                  <Button size="sm" variant="outline" className="ml-4">
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>By usage this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{product.name}</span>
                    <span className="text-muted-foreground">
                      <CurrencyDisplay value={product.value} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={product.usage} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {product.usage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Latest inventory transactions</CardDescription>
            </div>
            <Link href="/salon/stock-movements">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    movement.type === 'in' ? 'bg-green-100 text-green-600' :
                    movement.type === 'out' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {movement.type === 'in' ? <TrendingUp className="w-4 h-4" /> :
                     movement.type === 'out' ? <TrendingDown className="w-4 h-4" /> :
                     <BarChart3 className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{movement.product}</p>
                    <p className="text-sm text-muted-foreground">{movement.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    movement.type === 'in' ? 'text-green-600' :
                    movement.type === 'out' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {movement.type === 'in' ? '+' : ''}{movement.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">{movement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/salon/products">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Products</p>
              <p className="text-sm text-muted-foreground">Manage inventory</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/salon/stock-locations">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Locations</p>
              <p className="text-sm text-muted-foreground">Storage areas</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/salon/suppliers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Truck className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Suppliers</p>
              <p className="text-sm text-muted-foreground">Vendor management</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/salon/brands">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Brands</p>
              <p className="text-sm text-muted-foreground">Product brands</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}