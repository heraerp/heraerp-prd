'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Search, 
  Plus, 
  Filter,
  Download,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Gem,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Edit,
  Eye,
  Archive
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  costPrice: number
  stockQuantity: number
  minStockLevel: number
  goldWeight: number
  purity: string
  status: 'active' | 'inactive' | 'discontinued'
  lastUpdated: string
  supplier: string
}

export default function Jewelry1InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Sample products for demo
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Diamond Solitaire Ring 18K',
      sku: 'DSR-18K-001',
      category: 'rings',
      price: 45000,
      costPrice: 32000,
      stockQuantity: 5,
      minStockLevel: 3,
      goldWeight: 3.5,
      purity: '18K',
      status: 'active',
      lastUpdated: '2024-01-15',
      supplier: 'Rajesh Jewels'
    },
    {
      id: '2',
      name: 'Gold Chain Necklace 22K',
      sku: 'GCN-22K-002',
      category: 'necklaces',
      price: 28000,
      costPrice: 22000,
      stockQuantity: 2,
      minStockLevel: 5,
      goldWeight: 12.5,
      purity: '22K',
      status: 'active',
      lastUpdated: '2024-01-14',
      supplier: 'Mumbai Gold House'
    },
    {
      id: '3',
      name: 'Pearl Drop Earrings',
      sku: 'PDE-18K-003',
      category: 'earrings',
      price: 8500,
      costPrice: 6000,
      stockQuantity: 12,
      minStockLevel: 8,
      goldWeight: 2.1,
      purity: '18K',
      status: 'active',
      lastUpdated: '2024-01-13',
      supplier: 'South Sea Pearls'
    },
    {
      id: '4',
      name: 'Ruby Tennis Bracelet',
      sku: 'RTB-18K-004',
      category: 'bracelets',
      price: 35000,
      costPrice: 25000,
      stockQuantity: 0,
      minStockLevel: 2,
      goldWeight: 8.3,
      purity: '18K',
      status: 'active',
      lastUpdated: '2024-01-10',
      supplier: 'Precious Stones Ltd'
    },
    {
      id: '5',
      name: 'Emerald Pendant Set',
      sku: 'EPS-18K-005',
      category: 'pendants',
      price: 22000,
      costPrice: 16000,
      stockQuantity: 7,
      minStockLevel: 4,
      goldWeight: 4.2,
      purity: '18K',
      status: 'active',
      lastUpdated: '2024-01-12',
      supplier: 'Colombian Emeralds'
    },
    {
      id: '6',
      name: 'Vintage Silver Chain',
      sku: 'VSC-925-006',
      category: 'chains',
      price: 3500,
      costPrice: 2200,
      stockQuantity: 15,
      minStockLevel: 10,
      goldWeight: 0,
      purity: 'Sterling 925',
      status: 'discontinued',
      lastUpdated: '2023-12-20',
      supplier: 'Silver Craft Co'
    }
  ]

  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Calculate summary statistics
  const totalProducts = sampleProducts.length
  const activeProducts = sampleProducts.filter(p => p.status === 'active').length
  const lowStockProducts = sampleProducts.filter(p => p.stockQuantity <= p.minStockLevel && p.status === 'active').length
  const outOfStockProducts = sampleProducts.filter(p => p.stockQuantity === 0 && p.status === 'active').length
  const totalInventoryValue = sampleProducts.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0)

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) return { status: 'out-of-stock', color: 'bg-red-100 text-red-800 border-red-200', label: 'Out of Stock' }
    if (product.stockQuantity <= product.minStockLevel) return { status: 'low-stock', color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Low Stock' }
    return { status: 'in-stock', color: 'bg-green-100 text-green-800 border-green-200', label: 'In Stock' }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'discontinued': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SAP Fiori Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Inventory Management</h1>
                <p className="text-sm text-slate-500">Track products, stock levels, and inventory value</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                {filteredProducts.length} products
              </Badge>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Products</p>
                  <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Products</p>
                  <p className="text-2xl font-bold text-green-700">{activeProducts}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-700">{lowStockProducts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-700">{outOfStockProducts}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Inventory Value</p>
                  <p className="text-xl font-bold text-purple-700">₹{(totalInventoryValue / 100000).toFixed(1)}L</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search products by name, SKU, or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="rings">Rings</option>
                  <option value="necklaces">Necklaces</option>
                  <option value="earrings">Earrings</option>
                  <option value="bracelets">Bracelets</option>
                  <option value="pendants">Pendants</option>
                  <option value="chains">Chains</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Product Inventory</span>
              <div className="text-sm font-normal text-slate-500">
                Showing {filteredProducts.length} of {sampleProducts.length} products
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search criteria</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  const margin = ((product.price - product.costPrice) / product.price * 100).toFixed(1)
                  
                  return (
                    <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-slate-900">{product.name}</h3>
                            <Badge variant="outline" className="text-slate-600 border-slate-200">
                              {product.sku}
                            </Badge>
                            <Badge variant="outline" className={stockStatus.color}>
                              {stockStatus.label}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(product.status)}>
                              {product.status.toUpperCase()}
                            </Badge>
                            {product.category === 'rings' && (
                              <Gem className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm text-slate-600 mb-3">
                            <div>
                              <div className="text-xs text-slate-500">Category</div>
                              <div className="font-medium capitalize">{product.category}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Stock Qty</div>
                              <div className="font-medium">{product.stockQuantity} units</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Min Level</div>
                              <div className="font-medium">{product.minStockLevel} units</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Weight/Purity</div>
                              <div className="font-medium">{product.goldWeight}g {product.purity}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Supplier</div>
                              <div className="font-medium">{product.supplier}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Updated</div>
                              <div className="font-medium">{new Date(product.lastUpdated).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                            <div>
                              <div className="text-xs text-slate-500">Selling Price</div>
                              <div className="font-bold text-green-700">₹{product.price.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Cost Price</div>
                              <div className="font-medium text-slate-700">₹{product.costPrice.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Margin</div>
                              <div className="font-medium text-blue-700">{margin}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Stock Value</div>
                              <div className="font-bold text-purple-700">₹{(product.price * product.stockQuantity).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="w-4 h-4 mr-2" />
                              Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}