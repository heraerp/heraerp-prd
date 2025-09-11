'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { universalApi } from '@/lib/universal-api'
import { extractData, ensureDefaultEntities, formatCurrency } from '@/lib/universal-helpers'
import { useEntities } from '@/hooks/useUniversalData'
import { StatCardGrid, StatCardData } from '@/components/universal/StatCardGrid'
import { 
  Package,
  Truck,
  AlertTriangle,
  TrendingDown,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  Loader2,
  Check,
  X,
  ShoppingCart,
  Warehouse
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface InventoryManagementProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

interface InventoryItem {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    category?: string
    unit?: string
    current_stock?: number
    min_stock?: number
    max_stock?: number
    reorder_point?: number
    unit_cost?: number
    location?: string
    last_counted?: string
    supplier_id?: string
  }
}

interface StockMovement {
  id: string
  transaction_type: string
  transaction_date: string
  total_amount: number
  metadata?: {
    movement_type?: string
    reason?: string
    location?: string
    reference?: string
  }
  items?: Array<{
    item_name?: string
    quantity?: number
    unit_cost?: number
  }>
}

export function InventoryManagement({ 
  organizationId, 
  smartCodes,
  isDemoMode = false 
}: InventoryManagementProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    pendingOrders: 0
  })
  
  // Form states
  const [newItem, setNewItem] = useState({
    entity_name: '',
    entity_code: '',
    category: 'produce',
    unit: 'kg',
    current_stock: 0,
    min_stock: 0,
    reorder_point: 0,
    unit_cost: 0
  })
  
  const [adjustment, setAdjustment] = useState({
    item_id: '',
    adjustment_type: 'add',
    quantity: 0,
    reason: '',
    unit_cost: 0
  })
  
  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
      loadData()
    }
  }, [organizationId, isDemoMode])
  
  const loadData = async () => {
    try {
      setLoading(true)
      
      // Ensure default suppliers exist
      const defaultSuppliers = await ensureDefaultEntities(
        'supplier',
        [
          { 
            entity_name: 'Fresh Produce Co', 
            entity_code: 'SUP-001',
            metadata: { category: 'produce', payment_terms: 'NET30' }
          },
          { 
            entity_name: 'Meat & Seafood Distributors', 
            entity_code: 'SUP-002',
            metadata: { category: 'proteins', payment_terms: 'NET15' }
          },
          { 
            entity_name: 'Dry Goods Wholesale', 
            entity_code: 'SUP-003',
            metadata: { category: 'dry_goods', payment_terms: 'NET30' }
          },
          { 
            entity_name: 'Beverage Suppliers Inc', 
            entity_code: 'SUP-004',
            metadata: { category: 'beverages', payment_terms: 'NET45' }
          }
        ],
        smartCodes.SUPPLIER,
        organizationId
      )
      
      setSuppliers(defaultSuppliers)
      
      // Load inventory items
      const entitiesResponse = await universalApi.getEntities()
      const entities = extractData(entitiesResponse)
      const items = entities.filter(e => e.entity_type === 'inventory_item')
      
      // Create default items if none exist
      if (items.length === 0) {
        await createDefaultInventoryItems()
        const newEntitiesResponse = await universalApi.getEntities()
        const newEntities = extractData(newEntitiesResponse)
        setInventoryItems(newEntities.filter(e => e.entity_type === 'inventory_item'))
      } else {
        setInventoryItems(items)
      }
      
      // Load recent movements (inventory transactions)
      const transactionsResponse = await universalApi.getTransactions()
      const transactions = extractData(transactionsResponse)
      const movements = transactions
        .filter(t => 
          ['goods_receipt', 'inventory_adjustment', 'inventory_count', 'inventory_transfer']
            .includes(t.transaction_type)
        )
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
        .slice(0, 20)
      
      setRecentMovements(movements)
      
      // Calculate stats
      calculateStats(items, movements)
      
    } catch (err) {
      console.error('Error loading inventory data:', err)
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }
  
  const createDefaultInventoryItems = async () => {
    const defaultItems = [
      { name: 'Tomatoes', code: 'INV-001', category: 'produce', unit: 'kg', stock: 50, min: 20, cost: 3.50 },
      { name: 'Mozzarella Cheese', code: 'INV-002', category: 'dairy', unit: 'kg', stock: 30, min: 15, cost: 12.00 },
      { name: 'Pizza Flour', code: 'INV-003', category: 'dry_goods', unit: 'kg', stock: 100, min: 50, cost: 2.00 },
      { name: 'Olive Oil', code: 'INV-004', category: 'oils', unit: 'liters', stock: 20, min: 10, cost: 15.00 },
      { name: 'Ground Beef', code: 'INV-005', category: 'proteins', unit: 'kg', stock: 40, min: 20, cost: 18.00 },
      { name: 'Pasta', code: 'INV-006', category: 'dry_goods', unit: 'kg', stock: 60, min: 30, cost: 4.00 },
      { name: 'Red Wine', code: 'INV-007', category: 'beverages', unit: 'bottles', stock: 48, min: 24, cost: 25.00 },
      { name: 'Basil', code: 'INV-008', category: 'produce', unit: 'bunches', stock: 15, min: 10, cost: 2.50 }
    ]
    
    for (const item of defaultItems) {
      await universalApi.createEntity({
        entity_type: 'inventory_item',
        entity_name: item.name,
        entity_code: item.code,
        smart_code: smartCodes.INVENTORY_ITEM,
        metadata: {
          category: item.category,
          unit: item.unit,
          current_stock: item.stock,
          min_stock: item.min,
          reorder_point: item.min * 1.2,
          unit_cost: item.cost,
          location: 'Main Kitchen',
          last_counted: new Date().toISOString()
        }
      })
    }
  }
  
  const calculateStats = (items: InventoryItem[], movements: StockMovement[]) => {
    const totalItems = items.length
    const lowStockItems = items.filter(item => {
      const current = (item.metadata as any)?.current_stock || 0
      const min = (item.metadata as any)?.min_stock || 0
      return current <= min
    }).length
    
    const totalValue = items.reduce((sum, item) => {
      const stock = (item.metadata as any)?.current_stock || 0
      const cost = (item.metadata as any)?.unit_cost || 0
      return sum + (stock * cost)
    }, 0)
    
    const pendingOrders = movements.filter(m => 
      m.transaction_type === 'purchase_order' && 
      (m.metadata as any)?.status === 'pending'
    ).length
    
    setStats({ totalItems, lowStockItems, totalValue, pendingOrders })
  }
  
  const handleCreateItem = async () => {
    try {
      const response = await universalApi.createEntity({
        entity_type: 'inventory_item',
        entity_name: newItem.entity_name,
        entity_code: newItem.entity_code || `INV-${Date.now()}`,
        smart_code: smartCodes.INVENTORY_ITEM,
        metadata: {
          category: newItem.category,
          unit: newItem.unit,
          current_stock: newItem.current_stock,
          min_stock: newItem.min_stock,
          reorder_point: newItem.reorder_point,
          unit_cost: newItem.unit_cost,
          location: 'Main Kitchen',
          last_counted: new Date().toISOString()
        }
      })
      
      if (response.success) {
        setShowAddItem(false)
        setNewItem({
          entity_name: '',
          entity_code: '',
          category: 'produce',
          unit: 'kg',
          current_stock: 0,
          min_stock: 0,
          reorder_point: 0,
          unit_cost: 0
        })
        await loadData()
      }
    } catch (err) {
      console.error('Error creating item:', err)
      setError('Failed to create inventory item')
    }
  }
  
  const handleAdjustment = async () => {
    try {
      const item = inventoryItems.find(i => i.id === adjustment.item_id)
      if (!item) return
      
      const currentStock = (item.metadata as any)?.current_stock || 0
      const adjustmentQty = adjustment.adjustment_type === 'add' 
        ? adjustment.quantity 
        : -adjustment.quantity
      const newStock = currentStock + adjustmentQty
      
      // Create adjustment transaction
      const txResponse = await universalApi.createTransaction({
        transaction_type: 'inventory_adjustment',
        transaction_code: `ADJ-${Date.now()}`,
        smart_code: smartCodes.INVENTORY_ADJUSTMENT,
        total_amount: Math.abs(adjustmentQty * adjustment.unit_cost),
        metadata: {
          movement_type: adjustment.adjustment_type,
          reason: adjustment.reason,
          item_id: item.id,
          item_name: item.entity_name,
          quantity: adjustmentQty,
          previous_stock: currentStock,
          new_stock: newStock
        }
      })
      
      // Update item stock
      if (txResponse.success) {
        await universalApi.update('core_entities', item.id, {
          metadata: {
            ...item.metadata,
            current_stock: newStock,
            last_updated: new Date().toISOString()
          }
        })
        
        setShowAdjustment(false)
        setAdjustment({
          item_id: '',
          adjustment_type: 'add',
          quantity: 0,
          reason: '',
          unit_cost: 0
        })
        await loadData()
      }
    } catch (err) {
      console.error('Error adjusting inventory:', err)
      setError('Failed to adjust inventory')
    }
  }
  
  const getStockStatus = (item: InventoryItem) => {
    const current = (item.metadata as any)?.current_stock || 0
    const min = (item.metadata as any)?.min_stock || 0
    const reorder = (item.metadata as any)?.reorder_point || 0
    
    if (current === 0) return { color: 'destructive', text: 'Out of Stock' }
    if (current <= min) return { color: 'destructive', text: 'Low Stock' }
    if (current <= reorder) return { color: 'warning', text: 'Reorder Soon' }
    return { color: 'success', text: 'In Stock' }
  }
  
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.entity_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || (item.metadata as any)?.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  // Stats for the grid
  const statCards: StatCardData[] = [
    {
      key: 'total',
      title: 'Total Items',
      value: stats.totalItems,
      subtitle: 'In inventory',
      icon: Package,
      format: 'number'
    },
    {
      key: 'low',
      title: 'Low Stock',
      value: stats.lowStockItems,
      subtitle: 'Need reorder',
      icon: AlertTriangle,
      format: 'number',
      variant: stats.lowStockItems > 0 ? 'warning' : 'default'
    },
    {
      key: 'value',
      title: 'Total Value',
      value: stats.totalValue,
      subtitle: 'Current stock',
      icon: BarChart3,
      format: 'currency'
    },
    {
      key: 'orders',
      title: 'Pending Orders',
      value: stats.pendingOrders,
      subtitle: 'Awaiting delivery',
      icon: Truck,
      format: 'number'
    }
  ]
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-primary" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground">Track stock levels, suppliers, and movements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddItem(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
          <Button onClick={() => loadData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <StatCardGrid stats={statCards} columns={{ default: 1, sm: 2, md: 4 }} />
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Stock Overview</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="proteins">Proteins</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="dry_goods">Dry Goods</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="oils">Oils & Condiments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Min Stock</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item)
                    const currentStock = (item.metadata as any)?.current_stock || 0
                    const unitCost = (item.metadata as any)?.unit_cost || 0
                    const totalValue = currentStock * unitCost
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.entity_code}</TableCell>
                        <TableCell className="font-medium">{item.entity_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(item.metadata as any)?.category || 'uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {currentStock} {(item.metadata as any)?.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {(item.metadata as any)?.min_stock || 0} {(item.metadata as any)?.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(unitCost)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(totalValue)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.color as any}>
                            {status.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item)
                              setAdjustment({
                                ...adjustment,
                                item_id: item.id,
                                unit_cost: (item.metadata as any)?.unit_cost || 0
                              })
                              setShowAdjustment(true)
                            }}
                          >
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMovements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent movements
                  </p>
                ) : (
                  recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {movement.transaction_type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(new Date(movement.transaction_date), 'MMM d, yyyy h:mm a')}
                        </p>
                        {(movement.metadata as any)?.reason && (
                          <p className="text-sm mt-1">Reason: {movement.metadata.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {(movement.metadata as any)?.movement_type === 'add' ? '+' : '-'}
                          {(movement.metadata as any)?.quantity} units
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Value: {formatCurrency(movement.total_amount)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono text-sm">{supplier.entity_code}</TableCell>
                      <TableCell className="font-medium">{supplier.entity_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(supplier.metadata as any)?.category || 'general'}
                        </Badge>
                      </TableCell>
                      <TableCell>{(supplier.metadata as any)?.payment_terms || 'N/A'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Create PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryItems
                    .filter(item => getStockStatus(item).color === 'destructive')
                    .map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <span className="font-medium">{item.entity_name}</span>
                        <div className="text-right">
                          <p className="text-sm">
                            {(item.metadata as any)?.current_stock || 0} / {(item.metadata as any)?.min_stock || 0} {(item.metadata as any)?.unit}
                          </p>
                          <Badge variant="destructive" className="text-xs">
                            {(((item.metadata as any)?.current_stock || 0) / ((item.metadata as any)?.min_stock || 1) * 100).toFixed(0)}% of min
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Value Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventoryItems
                    .sort((a, b) => {
                      const aValue = ((a.metadata as any)?.current_stock || 0) * ((a.metadata as any)?.unit_cost || 0)
                      const bValue = ((b.metadata as any)?.current_stock || 0) * ((b.metadata as any)?.unit_cost || 0)
                      return bValue - aValue
                    })
                    .slice(0, 5)
                    .map(item => {
                      const value = ((item.metadata as any)?.current_stock || 0) * ((item.metadata as any)?.unit_cost || 0)
                      return (
                        <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                          <span className="font-medium">{item.entity_name}</span>
                          <span className="font-bold">{formatCurrency(value)}</span>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={newItem.entity_name}
                onChange={(e) => setNewItem({ ...newItem, entity_name: e.target.value })}
                placeholder="e.g., Tomatoes"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Item Code</Label>
                <Input
                  id="code"
                  value={newItem.entity_code}
                  onChange={(e) => setNewItem({ ...newItem, entity_code: e.target.value })}
                  placeholder="e.g., INV-001"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="proteins">Proteins</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="dry_goods">Dry Goods</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="oils">Oils & Condiments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={newItem.unit}
                  onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="ml">Milliliters</SelectItem>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="bottles">Bottles</SelectItem>
                    <SelectItem value="bunches">Bunches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost">Unit Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock">Current Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newItem.current_stock}
                  onChange={(e) => setNewItem({ ...newItem, current_stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="min">Min Stock</Label>
                <Input
                  id="min"
                  type="number"
                  value={newItem.min_stock}
                  onChange={(e) => setNewItem({ ...newItem, min_stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="reorder">Reorder Point</Label>
                <Input
                  id="reorder"
                  type="number"
                  value={newItem.reorder_point}
                  onChange={(e) => setNewItem({ ...newItem, reorder_point: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddItem(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem}>
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Adjustment Dialog */}
      <Dialog open={showAdjustment} onOpenChange={setShowAdjustment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedItem.entity_name}</p>
                <p className="text-sm text-muted-foreground">
                  Current Stock: {(selectedItem.metadata as any)?.current_stock || 0} {(selectedItem.metadata as any)?.unit}
                </p>
              </div>
              <div>
                <Label>Adjustment Type</Label>
                <Select
                  value={adjustment.adjustment_type}
                  onValueChange={(value) => setAdjustment({ ...adjustment, adjustment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="remove">Remove Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                  placeholder="e.g., Physical count correction, Damaged goods"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdjustment(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdjustment}>
                  Apply Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}