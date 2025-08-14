'use client'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
import { 
  Package, 
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  ArrowLeft,
  Save,
  TestTube,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Package2,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialInventory = [
  {
    id: 1,
    name: 'Professional Shampoo',
    category: 'Hair Care',
    brand: 'L\'Oreal Professional',
    sku: 'LP-SHAM-001',
    currentStock: 45,
    minStock: 20,
    maxStock: 100,
    unitCost: 12.50,
    sellingPrice: 28.00,
    supplier: 'Beauty Supply Co.',
    location: 'Storage Room A',
    expiryDate: '2026-03-15',
    lastRestocked: '2025-01-01',
    unitsSold: 156,
    isActive: true
  },
  {
    id: 2,
    name: 'Hair Color - Blonde',
    category: 'Color Products',
    brand: 'Schwarzkopf',
    sku: 'SK-COL-BL01',
    currentStock: 8,
    minStock: 15,
    maxStock: 50,
    unitCost: 18.75,
    sellingPrice: 35.00,
    supplier: 'Color Masters Inc.',
    location: 'Color Station',
    expiryDate: '2025-08-20',
    lastRestocked: '2024-12-20',
    unitsSold: 89,
    isActive: true
  },
  {
    id: 3,
    name: 'Styling Mousse',
    category: 'Styling Products',
    brand: 'Redken',
    sku: 'RK-STY-MOU',
    currentStock: 25,
    minStock: 10,
    maxStock: 60,
    unitCost: 8.25,
    sellingPrice: 22.50,
    supplier: 'Beauty Supply Co.',
    location: 'Styling Station',
    expiryDate: '2026-12-01',
    lastRestocked: '2024-12-15',
    unitsSold: 234,
    isActive: true
  },
  {
    id: 4,
    name: 'Disposable Capes',
    category: 'Salon Supplies',
    brand: 'SalonPro',
    sku: 'SP-CAPE-100',
    currentStock: 180,
    minStock: 50,
    maxStock: 300,
    unitCost: 0.75,
    sellingPrice: 0, // Not sold to customers
    supplier: 'Salon Supplies Direct',
    location: 'Supply Cabinet',
    expiryDate: null,
    lastRestocked: '2024-12-10',
    unitsSold: 0,
    isActive: true
  },
  {
    id: 5,
    name: 'Hair Dryer Filters',
    category: 'Equipment Parts',
    brand: 'DysonPro',
    sku: 'DY-FILT-001',
    currentStock: 5,
    minStock: 8,
    maxStock: 25,
    unitCost: 15.00,
    sellingPrice: 0,
    supplier: 'Equipment Masters',
    location: 'Equipment Storage',
    expiryDate: null,
    lastRestocked: '2024-11-30',
    unitsSold: 0,
    isActive: true
  },
  {
    id: 6,
    name: 'Premium Conditioner',
    category: 'Hair Care',
    brand: 'Olaplex',
    sku: 'OL-COND-PRE',
    currentStock: 32,
    minStock: 15,
    maxStock: 80,
    unitCost: 22.00,
    sellingPrice: 45.00,
    supplier: 'Premium Beauty Ltd.',
    location: 'Storage Room A',
    expiryDate: '2026-06-30',
    lastRestocked: '2024-12-28',
    unitsSold: 78,
    isActive: true
  }
]

const categories = [
  'Hair Care',
  'Color Products',
  'Styling Products',
  'Salon Supplies',
  'Equipment Parts',
  'Tools & Accessories'
]

const suppliers = [
  'Beauty Supply Co.',
  'Color Masters Inc.',
  'Salon Supplies Direct',
  'Equipment Masters',
  'Premium Beauty Ltd.'
]

interface InventoryItem {
  id: number
  name: string
  category: string
  brand: string
  sku: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  sellingPrice: number
  supplier: string
  location: string
  expiryDate: string | null
  lastRestocked: string
  unitsSold: number
  isActive: boolean
}

export default function InventoryProgressive() {
  const [testMode, setTestMode] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // New item form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    brand: '',
    sku: '',
    currentStock: 0,
    minStock: 10,
    maxStock: 100,
    unitCost: 0,
    sellingPrice: 0,
    supplier: '',
    location: '',
    expiryDate: ''
  })

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = item.currentStock <= item.minStock
    } else if (stockFilter === 'out') {
      matchesStock = item.currentStock === 0
    } else if (stockFilter === 'overstocked') {
      matchesStock = item.currentStock > item.maxStock
    }
    
    return matchesSearch && matchesCategory && matchesStock && item.isActive
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Inventory data saved:', inventory)
  }

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category) return

    const item: InventoryItem = {
      id: Date.now(),
      ...newItem,
      expiryDate: newItem.expiryDate || null,
      lastRestocked: new Date().toISOString().split('T')[0],
      unitsSold: 0,
      isActive: true
    }

    setInventory(prev => [...prev, item])
    setNewItem({
      name: '',
      category: '',
      brand: '',
      sku: '',
      currentStock: 0,
      minStock: 10,
      maxStock: 100,
      unitCost: 0,
      sellingPrice: 0,
      supplier: '',
      location: '',
      expiryDate: ''
    })
    setShowAddForm(false)
    setHasChanges(true)
  }

  const handleUpdateStock = (id: number, newStock: number) => {
    setInventory(prev => prev.map(item =>
      item.id === id ? { ...item, currentStock: Math.max(0, newStock) } : item
    ))
    setHasChanges(true)
  }

  const handleDeleteItem = (id: number) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, isActive: false } : item
    ))
    setHasChanges(true)
    setSelectedItem(null)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: 'out', color: 'bg-red-100 text-red-800 border-red-200', label: 'Out of Stock' }
    if (item.currentStock <= item.minStock) return { status: 'low', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Low Stock' }
    if (item.currentStock > item.maxStock) return { status: 'over', color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Overstocked' }
    return { status: 'ok', color: 'bg-green-100 text-green-800 border-green-200', label: 'In Stock' }
  }

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.currentStock / item.maxStock) * 100, 100)
  }

  const getInventoryStats = () => {
    const activeItems = inventory.filter(item => item.isActive)
    const lowStock = activeItems.filter(item => item.currentStock <= item.minStock).length
    const outOfStock = activeItems.filter(item => item.currentStock === 0).length
    const totalValue = activeItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0)
    const totalRevenue = activeItems.reduce((sum, item) => sum + (item.unitsSold * item.sellingPrice), 0)
    
    return {
      totalItems: activeItems.length,
      lowStock,
      outOfStock,
      totalValue: Math.round(totalValue),
      totalRevenue: Math.round(totalRevenue)
    }
  }

  const stats = getInventoryStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon-progressive">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Inventory Management
                  </h1>
                  <p className="text-sm text-gray-600">Track products, supplies, and stock levels</p>
                </div>
              </div>
            
            <div className="flex items-center gap-3">
              {testMode && hasChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveProgress}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4" />
                  Save Progress
                </Button>
              )}

              {lastSaved && (
                <div className="text-xs text-gray-500">
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Badge variant="secondary" className="flex items-center gap-1">
                <TestTube className="h-3 w-3" />
                Test Mode
              </Badge>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-6">
        {/* Inventory Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{stats.totalItems}</p>
                <p className="text-xs text-gray-600">Total Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                <p className="text-xs text-gray-600">Low Stock</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                <p className="text-xs text-gray-600">Out of Stock</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">${stats.totalValue}</p>
                <p className="text-xs text-gray-600">Inventory Value</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-purple-600">${stats.totalRevenue}</p>
                <p className="text-xs text-gray-600">Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, SKU, or brand..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Levels</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="overstocked">Overstocked</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-pink-500" />
                  Inventory Items ({filteredInventory.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item)
                    const stockPercentage = getStockPercentage(item)
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${ 
                          selectedItem?.id === item.id 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{item.name}</p>
                                <Badge className={stockStatus.color}>
                                  {stockStatus.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{item.brand} • {item.sku}</p>
                              <p className="text-xs text-gray-500 mb-2">{item.category} • {item.location}</p>
                              
                              {/* Stock Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    stockStatus.status === 'low' || stockStatus.status === 'out' 
                                      ? 'bg-red-500' 
                                      : stockStatus.status === 'over'
                                      ? 'bg-purple-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${stockPercentage}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                <span>Stock: {item.currentStock}</span>
                                <span>Max: {item.maxStock}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium">${(item.currentStock * item.unitCost).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Value</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateStock(item.id, item.currentStock + 1)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                +
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateStock(item.id, item.currentStock - 1)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                -
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Item Details / Add Form */}
          <div>
            {showAddForm ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-pink-500" />
                    Add New Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={newItem.brand}
                        onChange={(e) => setNewItem(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Brand name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={newItem.sku}
                        onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="SKU code"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="currentStock">Stock</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={newItem.currentStock}
                        onChange={(e) => setNewItem(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStock">Min</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={newItem.minStock}
                        onChange={(e) => setNewItem(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxStock">Max</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={newItem.maxStock}
                        onChange={(e) => setNewItem(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="unitCost">Cost ($)</Label>
                      <Input
                        id="unitCost"
                        type="number"
                        step="0.01"
                        value={newItem.unitCost}
                        onChange={(e) => setNewItem(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sellingPrice">Price ($)</Label>
                      <Input
                        id="sellingPrice"
                        type="number"
                        step="0.01"
                        value={newItem.sellingPrice}
                        onChange={(e) => setNewItem(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select
                      value={newItem.supplier}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, supplier: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newItem.location}
                      onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Storage location"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddItem}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                      disabled={!newItem.name || !newItem.category}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedItem ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-pink-500" />
                      Item Details
                    </CardTitle>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteItem(selectedItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center pb-4 border-b">
                    <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                    <p className="text-sm text-gray-600">{selectedItem.brand} • {selectedItem.sku}</p>
                    <Badge className={getStockStatus(selectedItem).color}>
                      {getStockStatus(selectedItem).label}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Package2 className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="font-semibold text-blue-600">{selectedItem.currentStock}</p>
                        <p className="text-xs text-gray-600">Current Stock</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="font-semibold text-green-600">${selectedItem.unitCost}</p>
                        <p className="text-xs text-gray-600">Unit Cost</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span>{selectedItem.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supplier:</span>
                        <span>{selectedItem.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span>{selectedItem.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Restocked:</span>
                        <span>{new Date(selectedItem.lastRestocked).toLocaleDateString()}</span>
                      </div>
                      {selectedItem.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expires:</span>
                          <span>{new Date(selectedItem.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Units Sold:</span>
                        <span>{selectedItem.unitsSold}</span>
                      </div>
                      {selectedItem.sellingPrice > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Selling Price:</span>
                          <span>${selectedItem.sellingPrice}</span>
                        </div>
                      )}
                    </div>

                    {/* Stock Level Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Stock Level</span>
                        <span>{selectedItem.currentStock}/{selectedItem.maxStock}</span>
                      </div>
                      <Progress value={getStockPercentage(selectedItem)} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: {selectedItem.minStock}</span>
                        <span>Max: {selectedItem.maxStock}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Select an item to view details</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Progressive Features Notice */}
        {testMode && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TestTube className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Test Mode Active</p>
                  <p className="text-sm text-blue-700">
                    Add items, track stock levels, and manage inventory freely. Use +/- buttons to adjust stock levels instantly. 
                    All changes are saved locally in test mode. Click "Save Progress" to persist your inventory data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}