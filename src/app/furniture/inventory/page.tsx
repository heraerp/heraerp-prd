'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Package,
  TreePine,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Truck,
  MapPin,
  Calendar,
  Thermometer,
  Droplets,
  Star,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  BarChart3,
  Target,
  Clock,
  Zap,
  Award,
  Building2,
  Phone,
  Mail,
  Globe
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  category: 'raw_material' | 'finished_goods' | 'work_in_progress' | 'consumables'
  woodType?: string
  quality: 'Premium' | 'Standard' | 'Export Grade' | 'AAA Grade'
  currentStock: number
  unit: string
  reorderLevel: number
  maxLevel: number
  location: string
  supplier: string
  costPerUnit: number
  totalValue: number
  lastUpdated: string
  expiryDate?: string
  moistureContent?: number
  gradeScore?: number
  isExportQuality: boolean
  seasons?: string[]
  notes: string[]
}

interface StockMovement {
  id: string
  itemId: string
  type: 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: number
  date: string
  reference: string
  location: string
  reason: string
  performedBy: string
}

interface Supplier {
  id: string
  name: string
  type: 'wood_supplier' | 'craftsman' | 'hardware' | 'transport'
  location: string
  rating: number
  speciality: string[]
  contact: string
  email: string
  creditDays: number
  isPreferred: boolean
}

export default function InventoryManagement() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Kerala wood types inventory
  const sampleInventory: InventoryItem[] = [
    {
      id: '1',
      name: 'Premium Teak Wood',
      category: 'raw_material',
      woodType: 'Teak',
      quality: 'Export Grade',
      currentStock: 2500,
      unit: 'kg',
      reorderLevel: 500,
      maxLevel: 5000,
      location: 'Thrissur Warehouse - Section A',
      supplier: 'Kerala Forest Development Corporation',
      costPerUnit: 85,
      totalValue: 212500,
      lastUpdated: '2024-01-15',
      moistureContent: 12,
      gradeScore: 95,
      isExportQuality: true,
      seasons: ['Winter', 'Summer'],
      notes: ['Sustainably sourced', 'FSC certified', 'Air dried 2 years']
    },
    {
      id: '2',
      name: 'Malabar Rosewood',
      category: 'raw_material',
      woodType: 'Rosewood',
      quality: 'AAA Grade',
      currentStock: 1800,
      unit: 'kg',
      reorderLevel: 300,
      maxLevel: 3000,
      location: 'Kozhikode Storage - Hall B',
      supplier: 'Wayanad Wood Traders',
      costPerUnit: 120,
      totalValue: 216000,
      lastUpdated: '2024-01-14',
      moistureContent: 10,
      gradeScore: 98,
      isExportQuality: true,
      seasons: ['All Seasons'],
      notes: ['Heritage wood', 'Traditional carving grade', 'Premium finish']
    },
    {
      id: '3',
      name: 'Jackfruit Wood Planks',
      category: 'raw_material',
      woodType: 'Jackfruit',
      quality: 'Premium',
      currentStock: 3200,
      unit: 'kg',
      reorderLevel: 800,
      maxLevel: 6000,
      location: 'Kochi Depot - Yard C',
      supplier: 'Local Timber Merchants',
      costPerUnit: 45,
      totalValue: 144000,
      lastUpdated: '2024-01-16',
      moistureContent: 15,
      gradeScore: 88,
      isExportQuality: false,
      seasons: ['Monsoon Safe'],
      notes: ['Water resistant', 'Good for outdoor furniture', 'Local sourcing']
    },
    {
      id: '4',
      name: 'Executive Dining Set',
      category: 'finished_goods',
      quality: 'Export Grade',
      currentStock: 12,
      unit: 'sets',
      reorderLevel: 5,
      maxLevel: 25,
      location: 'Finished Goods - Display Area',
      supplier: 'Internal Production',
      costPerUnit: 75000,
      totalValue: 900000,
      lastUpdated: '2024-01-13',
      isExportQuality: true,
      notes: ['Teak construction', 'Hand carved details', 'Hotel standard']
    },
    {
      id: '5',
      name: 'Traditional Kerala Chairs',
      category: 'work_in_progress',
      quality: 'Premium',
      currentStock: 45,
      unit: 'pieces',
      reorderLevel: 10,
      maxLevel: 80,
      location: 'Production Floor - Station 2',
      supplier: 'Craftsman Assembly',
      costPerUnit: 8500,
      totalValue: 382500,
      lastUpdated: '2024-01-15',
      isExportQuality: true,
      notes: ['80% complete', 'Awaiting final polish', 'Export order']
    },
    {
      id: '6',
      name: 'Wood Polish & Finish',
      category: 'consumables',
      quality: 'Premium',
      currentStock: 150,
      unit: 'liters',
      reorderLevel: 30,
      maxLevel: 300,
      location: 'Chemical Storage - Secure Area',
      supplier: 'Asian Paints Wood Care',
      costPerUnit: 450,
      totalValue: 67500,
      lastUpdated: '2024-01-12',
      expiryDate: '2025-06-30',
      notes: ['Eco-friendly', 'Water based', 'Export approved']
    }
  ]

  const sampleMovements: StockMovement[] = [
    {
      id: '1',
      itemId: '1',
      type: 'in',
      quantity: 500,
      date: '2024-01-15',
      reference: 'PO-2024-001',
      location: 'Thrissur Warehouse',
      reason: 'New procurement from KFDC',
      performedBy: 'Rajesh Kumar'
    },
    {
      id: '2',
      itemId: '1',
      type: 'out',
      quantity: 200,
      date: '2024-01-14',
      reference: 'WO-2024-001',
      location: 'Production Floor',
      reason: 'Hotel dining set production',
      performedBy: 'Suresh Menon'
    },
    {
      id: '3',
      itemId: '2',
      type: 'in',
      quantity: 300,
      date: '2024-01-13',
      reference: 'PO-2024-002',
      location: 'Kozhikode Storage',
      reason: 'Export order preparation',
      performedBy: 'Anitha Pillai'
    }
  ]

  const sampleSuppliers: Supplier[] = [
    {
      id: '1',
      name: 'Kerala Forest Development Corporation',
      type: 'wood_supplier',
      location: 'Thrissur, Kerala',
      rating: 98,
      speciality: ['Teak', 'Mahogany', 'Sustainable Sourcing'],
      contact: '+91 487 2421234',
      email: 'procurement@kfdc.kerala.gov.in',
      creditDays: 30,
      isPreferred: true
    },
    {
      id: '2',
      name: 'Wayanad Wood Traders',
      type: 'wood_supplier',
      location: 'Wayanad, Kerala',
      rating: 95,
      speciality: ['Rosewood', 'Heritage Woods', 'Premium Quality'],
      contact: '+91 94474 12345',
      email: 'sales@wayanawood.com',
      creditDays: 15,
      isPreferred: true
    },
    {
      id: '3',
      name: 'Raman Master Craftworks',
      type: 'craftsman',
      location: 'Kozhikode, Kerala',
      rating: 96,
      speciality: ['Traditional Carving', 'Custom Work', 'Heritage Restoration'],
      contact: '+91 98765 67890',
      email: 'raman@craftworks.in',
      creditDays: 7,
      isPreferred: true
    }
  ]

  useEffect(() => {
    setInventoryItems(sampleInventory)
    setStockMovements(sampleMovements)
    setSuppliers(sampleSuppliers)
  }, [])

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.woodType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.reorderLevel) return 'critical'
    if (item.currentStock <= item.reorderLevel * 1.5) return 'low'
    if (item.currentStock >= item.maxLevel * 0.9) return 'overstock'
    return 'good'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-500/10 text-red-600 border-red-500/20',
      'low': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'good': 'bg-green-500/10 text-green-600 border-green-500/20',
      'overstock': 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    }
    return colors[status] || colors.good
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ElementType> = {
      'critical': AlertTriangle,
      'low': Clock,
      'good': CheckCircle,
      'overstock': TrendingUp
    }
    return icons[status] || CheckCircle
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ElementType> = {
      'raw_material': TreePine,
      'finished_goods': Package,
      'work_in_progress': Target,
      'consumables': Droplets
    }
    return icons[category] || Package
  }

  const getTotalInventoryValue = () => {
    return inventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  }

  const getCriticalItems = () => {
    return inventoryItems.filter(item => getStockStatus(item) === 'critical').length
  }

  const getLowStockItems = () => {
    return inventoryItems.filter(item => getStockStatus(item) === 'low').length
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Package className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Inventory Management</h1>
                  <p className="text-lg text-gray-300">Kerala Wood Types & Materials Tracking</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <TreePine className="h-3 w-3 mr-1" />
                  Kerala Woods
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>

          {/* Inventory Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Inventory Value</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(getTotalInventoryValue() / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Across all categories</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Critical Stock Items</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getCriticalItems()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Immediate action required</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Low Stock Items</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getLowStockItems()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Reorder soon</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <TreePine className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Wood Types</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">4</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Kerala premium woods</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="jewelry-glass-card p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    placeholder="Search by item name, wood type, or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 jewelry-glass-input"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                >
                  All
                </Button>
                <Button
                  variant={filterCategory === 'raw_material' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('raw_material')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <TreePine className="h-4 w-4" />
                  Raw Materials
                </Button>
                <Button
                  variant={filterCategory === 'finished_goods' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('finished_goods')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Package className="h-4 w-4" />
                  Finished
                </Button>
                <Button
                  variant={filterCategory === 'work_in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('work_in_progress')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Target className="h-4 w-4" />
                  WIP
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="inventory" className="jewelry-glass-btn jewelry-text-luxury">Inventory Items</TabsTrigger>
              <TabsTrigger value="movements" className="jewelry-glass-btn jewelry-text-luxury">Stock Movements</TabsTrigger>
              <TabsTrigger value="suppliers" className="jewelry-glass-btn jewelry-text-luxury">Suppliers</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn jewelry-text-luxury">Analytics</TabsTrigger>
            </TabsList>

            {/* Inventory Items */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="space-y-4">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item)
                  const StatusIcon = getStatusIcon(status)
                  const CategoryIcon = getCategoryIcon(item.category)
                  
                  return (
                    <div key={item.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            <CategoryIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{item.name}</h3>
                              <Badge className={getStatusColor(status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                              {item.isExportQuality && (
                                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Export Quality
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium">Category:</span> {item.category.replace('_', ' ').charAt(0).toUpperCase() + item.category.replace('_', ' ').slice(1)}
                              </div>
                              {item.woodType && (
                                <div>
                                  <span className="font-medium">Wood Type:</span> {item.woodType}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Quality:</span> {item.quality}
                              </div>
                              <div>
                                <span className="font-medium">Location:</span> {item.location}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium">Current Stock:</span> {item.currentStock.toLocaleString()} {item.unit}
                              </div>
                              <div>
                                <span className="font-medium">Reorder Level:</span> {item.reorderLevel.toLocaleString()} {item.unit}
                              </div>
                              <div>
                                <span className="font-medium">Cost per {item.unit}:</span> ₹{item.costPerUnit.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Total Value:</span> ₹{item.totalValue.toLocaleString()}
                              </div>
                            </div>

                            {/* Special attributes for wood */}
                            {item.woodType && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300 mb-4">
                                {item.moistureContent && (
                                  <div className="flex items-center gap-1">
                                    <Droplets className="h-3 w-3" />
                                    <span className="font-medium">Moisture:</span> {item.moistureContent}%
                                  </div>
                                )}
                                {item.gradeScore && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    <span className="font-medium">Grade Score:</span> {item.gradeScore}/100
                                  </div>
                                )}
                                {item.seasons && (
                                  <div>
                                    <span className="font-medium">Seasons:</span> {item.seasons.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Stock level progress */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Stock Level</span>
                                <span className="text-sm font-medium jewelry-text-luxury">
                                  {Math.round((item.currentStock / item.maxLevel) * 100)}% of capacity
                                </span>
                              </div>
                              <Progress value={(item.currentStock / item.maxLevel) * 100} className="h-2" />
                              <div className="flex justify-between text-xs text-gray-300">
                                <span>Reorder: {item.reorderLevel}</span>
                                <span>Current: {item.currentStock}</span>
                                <span>Max: {item.maxLevel}</span>
                              </div>
                            </div>

                            {item.notes.length > 0 && (
                              <div>
                                <p className="text-sm font-medium jewelry-text-luxury mb-2">Notes:</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.notes.map((note, index) => (
                                    <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                      {note}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          {status === 'critical' || status === 'low' ? (
                            <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 text-amber-600">
                              <Truck className="h-3 w-3" />
                              Reorder
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Stock Movements */}
            <TabsContent value="movements" className="space-y-4">
              <div className="space-y-4">
                {stockMovements.map((movement) => {
                  const relatedItem = inventoryItems.find(item => item.id === movement.itemId)
                  return (
                    <div key={movement.id} className="jewelry-glass-card p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            movement.type === 'in' ? 'bg-green-500' : 
                            movement.type === 'out' ? 'bg-red-500' : 
                            movement.type === 'transfer' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}>
                            {movement.type === 'in' ? <TrendingUp className="h-5 w-5 text-white" /> :
                             movement.type === 'out' ? <TrendingDown className="h-5 w-5 text-white" /> :
                             movement.type === 'transfer' ? <Truck className="h-5 w-5 text-white" /> :
                             <Edit className="h-5 w-5 text-white" />}
                          </div>
                          <div>
                            <h4 className="font-semibold jewelry-text-luxury">{relatedItem?.name || 'Unknown Item'}</h4>
                            <p className="text-sm text-gray-300">{movement.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            movement.type === 'in' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {movement.type === 'in' ? '+' : '-'}{movement.quantity.toLocaleString()} {relatedItem?.unit}
                          </div>
                          <div className="text-sm text-gray-300">{movement.date}</div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                        <div>
                          <span className="font-medium">Reference:</span> {movement.reference}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {movement.location}
                        </div>
                        <div>
                          <span className="font-medium">Performed by:</span> {movement.performedBy}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Suppliers */}
            <TabsContent value="suppliers" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{supplier.name}</h3>
                          <p className="text-sm text-gray-300">{supplier.type.replace('_', ' ').charAt(0).toUpperCase() + supplier.type.replace('_', ' ').slice(1)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="font-medium jewelry-text-luxury">{supplier.rating}/100</span>
                        </div>
                        {supplier.isPreferred && (
                          <Badge className="bg-gold-500/10 text-gold-600 border-gold-500/20">
                            <Award className="h-3 w-3 mr-1" />
                            Preferred
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{supplier.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{supplier.contact}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{supplier.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{supplier.creditDays} days credit</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium jewelry-text-luxury mb-2">Specialities:</p>
                      <div className="flex flex-wrap gap-2">
                        {supplier.speciality.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory Turnover */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Inventory Turnover Analysis</h3>
                  <div className="space-y-4">
                    {[
                      { item: 'Teak Wood', turnover: 8.2, status: 'excellent', change: '+12%' },
                      { item: 'Rosewood', turnover: 6.5, status: 'good', change: '+8%' },
                      { item: 'Jackfruit Wood', turnover: 4.3, status: 'average', change: '+5%' },
                      { item: 'Finished Goods', turnover: 12.1, status: 'excellent', change: '+18%' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="font-medium jewelry-text-luxury">{item.item}</div>
                          <div className="text-sm text-gray-300">Turnover ratio</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold jewelry-text-luxury">{item.turnover}x</div>
                          <div className={`text-sm ${item.change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
                            {item.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kerala Wood Market Insights */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Kerala Wood Market Insights</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Sustainable Sourcing Advantage
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Kerala's FSC certified wood commands 25% premium in export markets.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Seasonal Price Variation
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Teak prices peak during monsoon due to harvesting restrictions. Stock accordingly.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <BarChart3 className="h-4 w-4" />
                        Export Quality Premium
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Export grade wood (12% moisture) sells for 40% more than domestic grade.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">₹2.1Cr</div>
                  <div className="text-sm text-gray-300">Total Inventory Value</div>
                  <div className="text-xs text-gray-300 mt-1">+15% from last quarter</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">18 days</div>
                  <div className="text-sm text-gray-300">Average Inventory Days</div>
                  <div className="text-xs text-gray-300 mt-1">Optimal: 15-20 days</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">95%</div>
                  <div className="text-sm text-gray-300">Order Fulfillment Rate</div>
                  <div className="text-xs text-gray-300 mt-1">Target: &gt;90%</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">₹45L</div>
                  <div className="text-sm text-gray-300">Wood Waste Savings</div>
                  <div className="text-xs text-gray-300 mt-1">Through efficient planning</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}