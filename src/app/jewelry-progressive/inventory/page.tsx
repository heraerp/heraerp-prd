'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Search, 
  Plus, 
  Filter,
  Download,
  Upload,
  Gem,
  Crown,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Edit,
  Trash2,
  ArrowLeft,
  Info,
  Eye,
  X,
  Loader2,
  ShoppingBag,
  Brain,
  Bot,
  Sparkles,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UniversalAIInventoryDashboard } from '@/components/inventory/UniversalAIInventoryDashboard'

interface InventoryItem {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  metalType?: string
  metalWeight?: number
  primaryStone?: string
  primaryStoneWeight?: number
  primaryStoneQuality?: string
  costPrice?: number
  retailPrice?: number
  profitMargin?: number
  stockLevel?: number
  reorderLevel?: number
  location?: string
  supplier?: string
  tags?: string[]
  turnoverRate?: number
  isUserCreated?: boolean
}

export default function ProgressiveInventoryPage() {
  const { workspace, isAnonymous } = useAuth()
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('sku')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAIView, setShowAIView] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    category: 'Rings',
    metalType: '14K Yellow Gold',
    location: 'Main Store',
    retailPrice: 0,
    costPrice: 0,
    stockLevel: 1,
    reorderLevel: 1,
    supplier: '',
    tags: []
  })
  
  // Load inventory from localStorage with professional sample data
  useEffect(() => {
    const loadInventory = async () => {
      setIsLoading(true)
      
      if (workspace) {
        const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`)
        if (storedData) {
          try {
            const data = JSON.parse(storedData)
            const products = data.products || []
            
            // Enhance with jewelry-specific fields if missing
            const enhancedProducts = products.map(product => ({
              ...product,
              metalType: product.metalType || '14K Yellow Gold',
              metalWeight: product.metalWeight || 0,
              primaryStone: product.primaryStone || '',
              primaryStoneWeight: product.primaryStoneWeight || 0,
              primaryStoneQuality: product.primaryStoneQuality || '',
              costPrice: product.costPrice || product.price * 0.6,
              retailPrice: product.retailPrice || product.price,
              profitMargin: product.profitMargin || 40,
              reorderLevel: product.reorderLevel || 1,
              location: product.location || 'Main Store',
              supplier: product.supplier || 'Premium Supplier',
              tags: product.tags || ['sample'],
              turnoverRate: product.turnoverRate || 2.5
            }))
            
            setInventory(enhancedProducts)
          } catch (e) {
            console.error('Failed to load inventory:', e)
          }
        }
      }
      
      setIsLoading(false)
    }
    
    loadInventory()
  }, [workspace])
  
  // Save inventory to localStorage
  const saveInventory = (items: InventoryItem[]) => {
    if (workspace) {
      const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}'
      const data = JSON.parse(storedData)
      data.products = items
      localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(data))
      setInventory(items)
    }
  }
  
  // Add new item with professional jewelry structure
  const handleAddItem = () => {
    if (!newItem.name || !newItem.sku || !newItem.price) {
      alert('Please fill in required fields: SKU, Name, and Retail Price')
      return
    }
    
    setIsSaving(true)
    
    const item: InventoryItem = {
      id: `item_${Date.now()}`,
      name: newItem.name,
      sku: newItem.sku,
      price: parseFloat(newItem.price),
      stock: parseInt(newItem.stock) || 0,
      category: newItem.category,
      metalType: newItem.metalType,
      metalWeight: 0,
      primaryStone: '',
      primaryStoneWeight: 0,
      primaryStoneQuality: '',
      costPrice: newItem.costPrice || parseFloat(newItem.price) * 0.6,
      retailPrice: parseFloat(newItem.price),
      profitMargin: ((parseFloat(newItem.price) - (newItem.costPrice || parseFloat(newItem.price) * 0.6)) / parseFloat(newItem.price)) * 100,
      stockLevel: parseInt(newItem.stock) || 1,
      reorderLevel: newItem.reorderLevel || 1,
      location: newItem.location || 'Main Store',
      supplier: newItem.supplier || 'Premium Supplier',
      tags: [...(newItem.tags || []), 'user-created'],
      turnoverRate: 2.5,
      isUserCreated: true
    }
    
    const updatedInventory = [...inventory, item]
    saveInventory(updatedInventory)
    
    // Reset form
    setNewItem({ 
      name: '', 
      sku: '', 
      price: '', 
      stock: '', 
      category: 'Rings',
      metalType: '14K Yellow Gold',
      location: 'Main Store',
      retailPrice: 0,
      costPrice: 0,
      stockLevel: 1,
      reorderLevel: 1,
      supplier: '',
      tags: []
    })
    setShowAddModal(false)
    setIsSaving(false)
  }
  
  // Delete item
  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedInventory = inventory.filter(item => item.id !== id)
      saveInventory(updatedInventory)
    }
  }
  
  // Filter and sort inventory (professional jewelry filtering)
  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.primaryStone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metalType?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sku': return a.sku.localeCompare(b.sku)
        case 'name': return a.name.localeCompare(b.name)
        case 'value': return ((b.retailPrice || b.price) * (b.stockLevel || b.stock)) - ((a.retailPrice || a.price) * (a.stockLevel || a.stock))
        case 'stock': return (b.stockLevel || b.stock) - (a.stockLevel || a.stock)
        default: return 0
      }
    })
  
  // Calculate professional inventory metrics
  const totalValue = inventory.reduce((sum, item) => sum + ((item.retailPrice || item.price) * (item.stockLevel || item.stock)), 0)
  const totalItems = inventory.reduce((sum, item) => sum + (item.stockLevel || item.stock), 0)
  const lowStockCount = inventory.filter(item => (item.stockLevel || item.stock) <= (item.reorderLevel || 1)).length
  const avgTurnover = inventory.length > 0 ? inventory.reduce((sum, item) => sum + (item.turnoverRate || 0), 0) / inventory.length : 0
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      
      <div className="ml-16">
        {/* Header - Professional jewelry styling */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/jewelry-progressive')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Jewelry Inventory</h1>
                  <p className="text-xs text-gray-500">
                    {isAnonymous ? 'Progressive workspace - locally saved' : 'Real-time inventory tracking'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* API Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-700">Progressive Workspace</span>
              </div>
              
              <Button 
                variant={showAIView ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAIView(!showAIView)}
                className={showAIView ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : ""}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI View
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8 text-white animate-pulse" />
              </div>
              <p className="text-gray-600">Loading jewelry inventory...</p>
              <p className="text-sm text-gray-500 mt-2">Setting up your workspace</p>
            </div>
          </div>
        ) : showAIView ? (
          <UniversalAIInventoryDashboard organizationId={organization?.organization_id || 'demo'} />
        ) : (
          <>
        {/* Info Box for Progressive Users */}
        {isAnonymous && (
          <Card className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-start space-x-3">
              <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">You're using real jewelry inventory management!</p>
                <p>Add, edit, or delete items - everything is saved in your organization?. 
                   The sample jewelry below can be removed once you add your own pieces.</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* Professional Jewelry Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Turnover Rate</p>
                <p className="text-2xl font-bold text-gray-900">{avgTurnover.toFixed(1)}x</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* Professional Search and Filters */}
        <Card className="p-4 mb-6 bg-white/90 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by SKU, name, stone type, or metal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="all">All Categories</option>
                <option value="Rings">Rings</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Bracelets">Bracelets</option>
                <option value="Earrings">Earrings</option>
                <option value="Watches">Watches</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm"
              >
                <option value="sku">Sort by SKU</option>
                <option value="name">Sort by Name</option>
                <option value="value">Sort by Value</option>
                <option value="stock">Sort by Stock</option>
              </select>

              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Professional Jewelry Inventory Display */}
        {viewMode === 'list' ? (
          <Card className="overflow-hidden bg-white/90 backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU / Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category / Metal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stone Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pricing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.sku}</p>
                          <p className="text-sm text-gray-600">{item.name}</p>
                          <div className="flex gap-1 mt-1">
                            {(item.tags || ['sample']).map(tag => (
                              <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.category}</p>
                          <p className="text-sm text-gray-600">{item.metalType || '14K Gold'}</p>
                          <p className="text-xs text-gray-500">{item.metalWeight || 5.2}g</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          {item.primaryStone ? (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                {item.primaryStone}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.primaryStoneWeight}ct {item.primaryStoneQuality}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No stone</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            (item.stockLevel || item.stock) <= (item.reorderLevel || 1) ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.stockLevel || item.stock}
                          </span>
                          {(item.stockLevel || item.stock) <= (item.reorderLevel || 1) && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Reorder: {item.reorderLevel || 1}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${(item.retailPrice || item.price).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            Cost: ${(item.costPrice || item.price * 0.6).toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600">
                            Margin: {item.profitMargin || 40}%
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{item.location || 'Main Store'}</p>
                          <p className="text-xs text-gray-500">{item.supplier || 'Premium Supplier'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No jewelry items found</p>
                  <Button 
                    onClick={() => setShowAddModal(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    Add Your First Jewelry Item
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow bg-white/90 backdrop-blur">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${(item.retailPrice || item.price).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      {item.profitMargin || 40}% margin
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Metal:</span>
                    <span className="font-medium">{item.metalType || '14K Gold'}</span>
                  </div>
                  {item.primaryStone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stone:</span>
                      <span className="font-medium">
                        {item.primaryStone} {item.primaryStoneWeight}ct
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-medium ${
                      (item.stockLevel || item.stock) <= (item.reorderLevel || 1) ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.stockLevel || item.stock} units
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {(item.tags || ['sample']).map(tag => (
                    <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Professional Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Jewelry Item</h2>
                  <p className="text-gray-600">Create a new item in your progressive workspace</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={newItem.sku}
                        onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                        placeholder="e.g., RING-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        placeholder="e.g., Diamond Solitaire Ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={newItem.category}
                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Rings">Rings</option>
                        <option value="Necklaces">Necklaces</option>
                        <option value="Earrings">Earrings</option>
                        <option value="Bracelets">Bracelets</option>
                        <option value="Pendants">Pendants</option>
                        <option value="Watches">Watches</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Metal & Pricing */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Metal & Pricing</h3>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Metal Type</label>
                      <select
                        value={newItem.metalType}
                        onChange={(e) => setNewItem({...newItem, metalType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="14K Yellow Gold">14K Yellow Gold</option>
                        <option value="18K Yellow Gold">18K Yellow Gold</option>
                        <option value="14K White Gold">14K White Gold</option>
                        <option value="18K White Gold">18K White Gold</option>
                        <option value="14K Rose Gold">14K Rose Gold</option>
                        <option value="Sterling Silver">Sterling Silver</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Price <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.price}
                          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Stock Level</label>
                        <Input
                          type="number"
                          value={newItem.stock}
                          onChange={(e) => setNewItem({...newItem, stock: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <select
                        value={newItem.location}
                        onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Main Store">Main Store</option>
                        <option value="Display Case">Display Case</option>
                        <option value="Jewelry Safe">Jewelry Safe</option>
                        <option value="VIP Vault">VIP Vault</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  onClick={handleAddItem}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Item
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Professional Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                  <p className="text-gray-600">{selectedItem.sku}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Product Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Gem className="w-5 h-5 text-purple-600" />
                      Product Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedItem.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Metal:</span>
                        <span className="font-medium">{selectedItem.metalType || '14K Gold'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Metal Weight:</span>
                        <span className="font-medium">{selectedItem.metalWeight || 5.2}g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory & Pricing */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      Pricing Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Retail Price:</span>
                        <span className="font-medium text-lg">${(selectedItem.retailPrice || selectedItem.price).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost Price:</span>
                        <span className="font-medium">${(selectedItem.costPrice || selectedItem.price * 0.6).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="font-medium text-green-600">{selectedItem.profitMargin || 40}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      Inventory Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className={`font-medium ${
                          (selectedItem.stockLevel || selectedItem.stock) <= (selectedItem.reorderLevel || 1) ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {selectedItem.stockLevel || selectedItem.stock} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{selectedItem.location || 'Main Store'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium">{selectedItem.supplier || 'Premium Supplier'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Item
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <ShoppingBag className="w-4 w-4 mr-2" />
                  Quick Sale
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Bulk Import Jewelry Items</h2>
                  <p className="text-gray-600">Import multiple items from CSV file</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload CSV File
                </h3>
                <p className="text-gray-600 mb-4">
                  Import your jewelry inventory from a CSV file
                </p>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}