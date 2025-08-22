/**
 * Inventory Dashboard
 * Comprehensive inventory management overview
 */

'use client'

import React, { useState, useEffect } from 'react'
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
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useToast } from '@/components/ui/use-toast'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

export default function InventoryDashboard() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingOrders: 0,
    monthlyUsage: 0,
    reorderValue: 0,
    expiringItems: 0
  })
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchInventoryData()
    }
  }, [organizationId, contextLoading])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      
      // Fetch all products
      const productsResponse = await fetch(`/api/v1/salon/products?organization_id=${organizationId}`)
      const productsData = await productsResponse.json()
      const products = productsData.products || []
      
      // Calculate statistics
      let totalValue = 0
      let lowStock = 0
      let outOfStock = 0
      const lowStockItems: any[] = []
      
      products.forEach((product: any) => {
        // For now, we'll simulate stock levels since we haven't implemented stock movements yet
        const currentStock = Math.floor(Math.random() * 50) // This will be replaced with actual stock calculation
        const minStock = product.min_stock || 10
        const costPrice = product.cost_price || 0
        
        totalValue += currentStock * costPrice
        
        if (currentStock === 0) {
          outOfStock++
          lowStock++
        } else if (currentStock < minStock) {
          lowStock++
        }
        
        // Add to low stock items if below minimum
        if (currentStock < minStock && lowStockItems.length < 4) {
          lowStockItems.push({
            id: product.id,
            name: product.entity_name,
            sku: product.sku || product.entity_code,
            current: currentStock,
            min: minStock,
            retail_price: product.retail_price || 0
          })
        }
      })
      
      setStats({
        totalProducts: products.length,
        totalValue,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        pendingOrders: 0, // Will be implemented with purchase orders
        monthlyUsage: totalValue * 0.2, // Estimate 20% monthly usage
        reorderValue: lowStock * 500, // Estimate reorder value
        expiringItems: 0 // Will be implemented with expiry tracking
      })
      
      setLowStockProducts(lowStockItems)
      
      // For recent movements, we'll need to implement stock_movement transactions
      // For now, show empty state
      setRecentMovements([])
      
      // Calculate top products (by value for now)
      const sortedProducts = [...products]
        .sort((a, b) => (b.retail_price || 0) - (a.retail_price || 0))
        .slice(0, 5)
        .map((product, index) => ({
          name: product.entity_name,
          usage: 100 - (index * 15), // Simulated usage percentage
          value: product.retail_price || 0
        }))
      
      setTopProducts(sortedProducts)
      
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    )
  }

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
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No low stock items</p>
                  <p className="text-sm mt-1">All products are well stocked</p>
                </div>
              ) : (
                lowStockProducts.map((product) => (
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
                ))
              )}
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
            {recentMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent movements</p>
                <p className="text-sm mt-1">Stock movements will appear here</p>
              </div>
            ) : (
              recentMovements.map((movement) => (
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
              ))
            )}
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