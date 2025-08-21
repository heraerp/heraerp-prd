'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { EnterpriseRetailSolutionSidebar } from '@/components/enterprise-retail-progressive/EnterpriseRetailSolutionSidebar'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Tag, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Eye,
  Edit3,
  BarChart3,
  Palette,
  Shirt,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Grid3X3,
  List
} from 'lucide-react'

// Sample merchandising data - Enterprise retail focused
const sampleMerchandisingData = {
  products: [
    {
      id: 1,
      name: 'Premium Denim Jacket',
      sku: 'CLO-DJ-001',
      article_number: 'ART001',
      season: 'FW2025',
      collection: 'Urban Collection',
      color_code: 'INDIGO',
      size: 'M',
      cost_price: 45.00,
      retail_price: 89.99,
      margin_percent: 50.0,
      category: 'Outerwear',
      status: 'active',
      stock_level: 25,
      vendor: 'Premium Denim Co',
      lifecycle_stage: 'core',
      performance_rating: 4.5
    },
    {
      id: 2,
      name: 'Classic White Sneakers',
      sku: 'SHO-SNE-002',
      article_number: 'ART002',
      season: 'SS2025',
      collection: 'Essential Collection',
      color_code: 'WHITE',
      size: '42',
      cost_price: 25.00,
      retail_price: 79.99,
      margin_percent: 68.8,
      category: 'Footwear',
      status: 'active',
      stock_level: 42,
      vendor: 'SportStyle Inc',
      lifecycle_stage: 'growth',
      performance_rating: 4.8
    },
    {
      id: 3,
      name: 'Silk Blend Scarf',
      sku: 'ACC-SCA-003',
      article_number: 'ART003',
      season: 'FW2025',
      collection: 'Luxury Collection',
      color_code: 'NAVY',
      size: 'OS',
      cost_price: 15.00,
      retail_price: 49.99,
      margin_percent: 70.0,
      category: 'Accessories',
      status: 'limited',
      stock_level: 8,
      vendor: 'Silk Luxury Ltd',
      lifecycle_stage: 'mature',
      performance_rating: 4.2
    }
  ],
  categories: [
    { name: 'Outerwear', count: 45, performance: '+12%' },
    { name: 'Footwear', count: 38, performance: '+8%' },
    { name: 'Accessories', count: 67, performance: '+15%' },
    { name: 'Denim', count: 23, performance: '+5%' }
  ],
  seasons: [
    { name: 'FW2025', status: 'active', items: 89, launch_date: '2024-09-01' },
    { name: 'SS2025', status: 'planning', items: 156, launch_date: '2025-03-01' }
  ]
}

export default function MerchandisingPage() {
  const { user, workspace } = useAuth()
  const [products, setProducts] = useState(sampleMerchandisingData.products)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeason, setSelectedSeason] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    article_number: '',
    season: 'FW2025',
    collection: '',
    color_code: '',
    size: '',
    cost_price: 0,
    retail_price: 0,
    category: 'Outerwear',
    status: 'active',
    stock_level: 0,
    vendor: '',
    lifecycle_stage: 'new',
    performance_rating: 4.0
  })

  useEffect(() => {
    // Load data using HERA Progressive Auth pattern
    const loadData = () => {
      if (organization?.organization_id) {
        const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`)
        const data = storedData ? JSON.parse(storedData) : {}
        // Use sample data if no stored data
        const merchandisingData = data.merchandising_products || sampleMerchandisingData.products
        setProducts(merchandisingData)
      } else {
        setProducts(sampleMerchandisingData.products)
      }
      setLoading(false)
    }
    
    loadData()
  }, [workspace])

  // Save products to localStorage
  const saveProducts = (updatedProducts) => {
    if (organization?.organization_id) {
      const existingData = JSON.parse(localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}')
      existingData.merchandising_products = updatedProducts
      localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(existingData))
    }
    setProducts(updatedProducts)
  }

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-calculate margin when prices change
      margin_percent: field === 'cost_price' || field === 'retail_price' 
        ? Math.round(((prev.retail_price - prev.cost_price) / prev.retail_price) * 100)
        : prev.margin_percent
    }))
  }

  // Add new product
  const handleAddProduct = () => {
    const newProduct = {
      ...formData,
      id: Math.max(...products.map(p => p.id), 0) + 1,
      margin_percent: Math.round(((formData.retail_price - formData.cost_price) / formData.retail_price) * 100)
    }
    
    const updatedProducts = [...products, newProduct]
    saveProducts(updatedProducts)
    
    // Reset form and close modal
    setFormData({
      name: '',
      sku: '',
      article_number: '',
      season: 'FW2025',
      collection: '',
      color_code: '',
      size: '',
      cost_price: 0,
      retail_price: 0,
      category: 'Outerwear',
      status: 'active',
      stock_level: 0,
      vendor: '',
      lifecycle_stage: 'new',
      performance_rating: 4.0
    })
    setShowAddModal(false)
  }

  // Edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setFormData(product)
    setShowEditModal(true)
  }

  // Update product
  const handleUpdateProduct = () => {
    const updatedProducts = products.map(p => 
      p.id === editingProduct.id 
        ? { 
            ...formData, 
            margin_percent: Math.round(((formData.retail_price - formData.cost_price) / formData.retail_price) * 100)
          }
        : p
    )
    
    saveProducts(updatedProducts)
    setShowEditModal(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      sku: '',
      article_number: '',
      season: 'FW2025',
      collection: '',
      color_code: '',
      size: '',
      cost_price: 0,
      retail_price: 0,
      category: 'Outerwear',
      status: 'active',
      stock_level: 0,
      vendor: '',
      lifecycle_stage: 'new',
      performance_rating: 4.0
    })
  }

  // Delete product
  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(p => p.id !== productId)
      saveProducts(updatedProducts)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSeason = selectedSeason === 'all' || product.season === selectedSeason
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSeason && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'limited': return 'bg-yellow-100 text-yellow-800'
      case 'discontinued': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLifecycleIcon = (stage) => {
    switch (stage) {
      case 'new': return <Star className="w-4 h-4 text-blue-500" />
      case 'growth': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'core': return <CheckCircle className="w-4 h-4 text-indigo-500" />
      case 'mature': return <Clock className="w-4 h-4 text-orange-500" />
      case 'decline': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Package className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading merchandising operations...</p>
      </div>
    </div>
  }

  return (
    <UniversalTourProvider industryKey="retail-merchandising" autoStart={true}>
      <div className="min-h-screen bg-white flex">
        <EnterpriseRetailSolutionSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <TourElement tourId="header">
            <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Merchandising</h1>
            <p className="text-sm text-gray-500">{user?.organizationName || 'Enterprise Retail'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </header>
          </TourElement>

        <main className="flex-1 overflow-auto bg-gray-50">
          {/* Stats Overview */}
          <TourElement tourId="product-catalog">
            <div className="p-8 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Margin</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {Math.round(products.reduce((acc, p) => acc + p.margin_percent, 0) / products.length)}%
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Categories</p>
                      <p className="text-3xl font-bold text-gray-900">{sampleMerchandisingData.categories.length}</p>
                    </div>
                    <Tag className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Seasons</p>
                      <p className="text-3xl font-bold text-gray-900">2</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <TourElement tourId="assortment-planning">
              <div className="flex gap-4 mb-6">
                <select 
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {sampleMerchandisingData.categories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                <select 
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  <option value="all">All Seasons</option>
                  {sampleMerchandisingData.seasons.map(season => (
                    <option key={season.name} value={season.name}>{season.name}</option>
                  ))}
                </select>
              </div>
            </TourElement>
          </div>
          </TourElement>

          {/* Products Grid/List */}
          <TourElement tourId="visual-merchandising">
            <div className="px-8 pb-8">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedCategory !== 'all' || selectedSeason !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Get started by adding your first product'
                  }
                </p>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-700"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{product.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getLifecycleIcon(product.lifecycle_stage)}
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Collection</span>
                          <span className="text-sm font-medium">{product.collection}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Season</span>
                          <Badge variant="outline">{product.season}</Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Retail Price</span>
                          <span className="text-lg font-bold text-green-600">
                            ${product.retail_price}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Margin</span>
                          <span className="text-sm font-medium text-green-600">
                            {product.margin_percent}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Stock</span>
                          <span className={`text-sm font-medium ${
                            product.stock_level < 10 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {product.stock_level} units
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Performance</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{product.performance_rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          </TourElement>
          
          <TourElement tourId="performance-analytics">
            <div className="px-8 pb-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Top Performer</p>
                    <p className="font-semibold">Premium Denim Jacket</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Margin</p>
                    <p className="font-semibold">47.8%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Season Progress</p>
                    <p className="font-semibold">78% Complete</p>
                  </div>
                </div>
              </div>
            </div>
          </TourElement>
        </main>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.sku}
                    onChange={(e) => handleFormChange('sku', e.target.value)}
                    placeholder="e.g., CLO-DJ-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Article Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.article_number}
                    onChange={(e) => handleFormChange('article_number', e.target.value)}
                    placeholder="e.g., ART001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collection</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.collection}
                    onChange={(e) => handleFormChange('collection', e.target.value)}
                    placeholder="e.g., Urban Collection"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Season</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.season}
                    onChange={(e) => handleFormChange('season', e.target.value)}
                  >
                    <option value="FW2025">FW2025</option>
                    <option value="SS2025">SS2025</option>
                    <option value="FW2024">FW2024</option>
                    <option value="SS2024">SS2024</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                  >
                    <option value="Outerwear">Outerwear</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Denim">Denim</option>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Code</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.color_code}
                    onChange={(e) => handleFormChange('color_code', e.target.value)}
                    placeholder="e.g., INDIGO, WHITE, NAVY"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.size}
                    onChange={(e) => handleFormChange('size', e.target.value)}
                    placeholder="e.g., M, 42, OS"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.cost_price}
                    onChange={(e) => handleFormChange('cost_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retail Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.retail_price}
                    onChange={(e) => handleFormChange('retail_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Level</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.stock_level}
                    onChange={(e) => handleFormChange('stock_level', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.vendor}
                    onChange={(e) => handleFormChange('vendor', e.target.value)}
                    placeholder="e.g., Premium Denim Co"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="limited">Limited</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lifecycle Stage</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.lifecycle_stage}
                    onChange={(e) => handleFormChange('lifecycle_stage', e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="growth">Growth</option>
                    <option value="core">Core</option>
                    <option value="mature">Mature</option>
                    <option value="decline">Decline</option>
                  </select>
                </div>
              </div>
              
              {formData.cost_price > 0 && formData.retail_price > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Calculated Margin:</strong> {Math.round(((formData.retail_price - formData.cost_price) / formData.retail_price) * 100)}%
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700"
                  onClick={handleAddProduct}
                  disabled={!formData.name || !formData.sku}
                >
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.sku}
                    onChange={(e) => handleFormChange('sku', e.target.value)}
                    placeholder="e.g., CLO-DJ-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Level</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.stock_level}
                    onChange={(e) => handleFormChange('stock_level', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retail Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.retail_price}
                    onChange={(e) => handleFormChange('retail_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="limited">Limited</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lifecycle Stage</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.lifecycle_stage}
                    onChange={(e) => handleFormChange('lifecycle_stage', e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="growth">Growth</option>
                    <option value="core">Core</option>
                    <option value="mature">Mature</option>
                    <option value="decline">Decline</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700"
                  onClick={handleUpdateProduct}
                  disabled={!formData.name || !formData.sku}
                >
                  Update Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </UniversalTourProvider>
  )
}