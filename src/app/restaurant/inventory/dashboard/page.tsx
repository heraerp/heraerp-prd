'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  MetricCard,
  AnimatedCounter,
  StatusIndicator,
  FloatingNotification,
  GlowButton
} from '@/components/restaurant/JobsStyleMicroInteractions'
import { 
  Package, TrendingDown, DollarSign, AlertTriangle, Plus, Search,
  TrendingUp, Truck, ShoppingCart, BarChart3, Settings,
  RefreshCw, Clock, Zap, Target, Award, Shield,
  Apple, Carrot, Milk, Beef, Fish, Wheat
} from 'lucide-react'

/**
 * 📦 HERA Universal Inventory Management System
 * Revolutionary Restaurant Inventory using HERA's 6-Table Architecture
 * 
 * Steve Jobs: "Innovation distinguishes between a leader and a follower"
 * Built on Universal 6-Table Foundation
 */

export default function InventoryDashboardPage() {
  const [inventoryItems, setInventoryItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isClient, setIsClient] = useState(false)

  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Inventory Analytics Stats
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 156,
    lowStockItems: 12,
    totalValue: 24580,
    monthlyUsage: 8950,
    wastePercentage: 2.3,
    supplierCount: 18
  })

  // Inventory categories with icons
  const inventoryCategories = [
    { id: 'produce', name: 'Fresh Produce', icon: Apple, count: 42, color: 'from-green-500 to-emerald-600' },
    { id: 'vegetables', name: 'Vegetables', icon: Carrot, count: 38, color: 'from-orange-500 to-amber-600' },
    { id: 'dairy', name: 'Dairy & Eggs', icon: Milk, count: 24, color: 'from-blue-500 to-cyan-600' },
    { id: 'meat', name: 'Meat & Poultry', icon: Beef, count: 18, color: 'from-red-500 to-pink-600' },
    { id: 'seafood', name: 'Seafood', icon: Fish, count: 12, color: 'from-blue-500 to-indigo-600' },
    { id: 'grains', name: 'Grains & Dry', icon: Wheat, count: 22, color: 'from-yellow-500 to-orange-600' }
  ]

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
    loadInventoryData()
  }, [])

  // Load inventory data from HERA universal API
  const loadInventoryData = async () => {
    setLoading(true)
    try {
      // Fetch inventory items using universal entities API
      const response = await fetch(`/api/v1/inventory/entities?organization_id=${organizationId}&entity_type=inventory_item&include_dynamic_data=true`)
      const result = await response.json()
      
      if (result.success) {
        setInventoryItems(result.data || [])
        
        // Update stats based on real data
        const lowStock = result.data.filter(item => {
          const quantity = item.dynamic_fields?.quantity?.value || 0
          const reorderPoint = item.dynamic_fields?.reorder_point?.value || 10
          return quantity <= reorderPoint
        }).length
        
        const totalValue = result.data.reduce((sum, item) => {
          const quantity = item.dynamic_fields?.quantity?.value || 0
          const costPerUnit = item.dynamic_fields?.cost_per_unit?.value || 0
          return sum + (quantity * costPerUnit)
        }, 0)
        
        setInventoryStats(prev => ({
          ...prev,
          totalItems: result.data.length,
          lowStockItems: lowStock,
          totalValue: Math.round(totalValue)
        }))
      }
      
      // Load suppliers
      const suppliersResponse = await fetch(`/api/v1/inventory/entities?organization_id=${organizationId}&entity_type=supplier`)
      const suppliersResult = await suppliersResponse.json()
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data || [])
        setInventoryStats(prev => ({ ...prev, supplierCount: suppliersResult.data.length }))
      }
      
    } catch (error) {
      console.error('Error loading inventory data:', error)
      setNotificationMessage('Failed to load inventory data')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  // Filter inventory items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      item.dynamic_fields?.category?.value === selectedCategory ||
      item.ai_classification === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Navigate to inventory form
  const addInventoryItem = () => {
    window.location.href = '/restaurant/inventory/form'
  }

  if (loading && !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div className="animate-spin w-full h-full border-4 border-orange-200 border-t-orange-500 rounded-full" />
          </div>
          <p className="text-gray-600">Loading inventory system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                📦 Track Your Inventory
              </h1>
              <p className="text-gray-600 mt-2">
                Know what you have, when to reorder, stop wasting money
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <StatusIndicator 
                  status="success" 
                  text="Mario's Restaurant" 
                  showText={true} 
                />
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  Live Updates
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <GlowButton
                onClick={addInventoryItem}
                glowColor="rgba(34, 197, 94, 0.4)"
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Inventory Item
              </GlowButton>
            </div>
          </div>
        </div>

        {/* Inventory Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Total Items"
            value={inventoryStats.totalItems}
            change={8.5}
            trend="up"
            icon={<Package className="w-5 h-5 text-white" />}
            color="from-green-500 to-emerald-600"
          />
          
          <MetricCard
            title="Low Stock Alert"
            value={inventoryStats.lowStockItems}
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            color="from-red-500 to-orange-600"
          />
          
          <MetricCard
            title="Total Value"
            value={`$${inventoryStats.totalValue.toLocaleString()}`}
            change={12.3}
            trend="up"
            icon={<DollarSign className="w-5 h-5 text-white" />}
            color="from-blue-500 to-indigo-600"
          />
          
          <MetricCard
            title="Monthly Usage"
            value={`$${inventoryStats.monthlyUsage.toLocaleString()}`}
            change={-4.2}
            trend="down"
            icon={<TrendingDown className="w-5 h-5 text-white" />}
            color="from-purple-500 to-violet-600"
          />
          
          <MetricCard
            title="Waste %"
            value={`${inventoryStats.wastePercentage}%`}
            change={-0.5}
            trend="down"
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="from-yellow-500 to-amber-600"
          />
          
          <MetricCard
            title="Suppliers"
            value={inventoryStats.supplierCount}
            icon={<Truck className="w-5 h-5 text-white" />}
            color="from-cyan-500 to-blue-600"
          />
        </div>

        {/* Inventory Categories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {inventoryCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <Card 
                    key={category.id} 
                    className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                      selectedCategory === category.id ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{category.count} items</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventory Items ({filteredItems.length})
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Items
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Inventory Items Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start building your inventory by adding your first item'
                  }
                </p>
                <GlowButton
                  onClick={addInventoryItem}
                  glowColor="rgba(34, 197, 94, 0.4)"
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Inventory Item
                </GlowButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const quantity = item.dynamic_fields?.quantity?.value || 0
                  const reorderPoint = item.dynamic_fields?.reorder_point?.value || 10
                  const costPerUnit = item.dynamic_fields?.cost_per_unit?.value || 0
                  const category = item.dynamic_fields?.category?.value || item.ai_classification
                  const unit = item.dynamic_fields?.unit?.value || 'unit'
                  const isLowStock = quantity <= reorderPoint
                  
                  return (
                    <Card key={item.id} className={`hover:shadow-lg transition-all hover:scale-105 ${
                      isLowStock ? 'border-red-300' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{item.entity_name}</h3>
                          {isLowStock && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{quantity} {unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cost/Unit:</span>
                            <span className="font-medium">${costPerUnit.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Value:</span>
                            <span className="font-medium">${(quantity * costPerUnit).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant="outline" className="text-xs">
                            {category || 'Uncategorized'}
                          </Badge>
                          <Badge className={`text-xs ${
                            item.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        {item.smart_code && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-blue-600 font-mono">{item.smart_code}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why This Matters */}
        <Card className="mt-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-6 h-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold">🎯 Why Your Inventory Matters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <strong className="text-green-600">Always Know What You Have:</strong><br/>
                See your stock levels instantly. No more running out of ingredients during dinner rush.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <strong className="text-blue-600">Never Run Out Again:</strong><br/>
                Get alerts before you run low. Automatic suggestions for when and how much to order.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-violet-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <strong className="text-purple-600">Save Money Every Day:</strong><br/>
                Track waste, optimize portions, and cut food costs. Your profit margins will thank you.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <strong className="text-orange-600">Stop Throwing Money Away:</strong><br/>
                Track expiry dates, reduce waste, and turn inventory management into profit.
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Floating Notification */}
        <FloatingNotification
          show={showNotification}
          message={notificationMessage}
          type="success"
          duration={3000}
          onClose={() => setShowNotification(false)}
        />
      </div>
    </div>
  )
}