/**
 * Retail POS Product Management
 * Integrated with Universal Dynamic Masterdata System
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { UniversalEntityListShell } from '@/components/universal/UniversalEntityListShell'
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Tag, 
  Barcode,
  DollarSign,
  Archive,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload
} from 'lucide-react'

// Product filter panel component
const ProductFilterPanel = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    inStock: true,
    status: 'active'
  })

  const categories = [
    'All Categories',
    'Beverages', 
    'Snacks',
    'Electronics',
    'Clothing',
    'Health & Beauty',
    'Home & Garden'
  ]

  const priceRanges = [
    'All Prices',
    '$0 - $10',
    '$10 - $50', 
    '$50 - $100',
    '$100 - $500',
    '$500+'
  ]

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-champagne mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-gold" />
          Filters
        </h3>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Category</label>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          {categories.map((category) => (
            <option key={category} value={category === 'All Categories' ? '' : category.toLowerCase()}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Price Range</label>
        <select
          value={filters.priceRange}
          onChange={(e) => handleFilterChange('priceRange', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          {priceRanges.map((range) => (
            <option key={range} value={range === 'All Prices' ? '' : range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Filter */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => handleFilterChange('inStock', e.target.checked)}
            className="w-4 h-4 bg-charcoal border border-gold/20 rounded text-gold focus:ring-gold/20"
          />
          <span className="text-champagne">In Stock Only</span>
        </label>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-champagne mb-2">Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full min-h-[44px] bg-charcoal/50 border border-gold/20 rounded-xl px-3 text-champagne focus:border-gold/50 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
          <option value="all">All Status</option>
        </select>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gold/20">
        <h4 className="text-sm font-medium text-champagne mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button className="w-full min-h-[44px] bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center gap-2 px-3 text-blue-300 hover:bg-blue-500/30 active:scale-95 transition-all">
            <Upload className="w-4 h-4" />
            Import Products
          </button>
          <button className="w-full min-h-[44px] bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2 px-3 text-green-300 hover:bg-green-500/30 active:scale-95 transition-all">
            <Download className="w-4 h-4" />
            Export Products
          </button>
        </div>
      </div>
    </div>
  )
}

// Product list/grid component
const ProductListContent = ({ view, searchTerm, filters }: { view: string, searchTerm: string, filters: any }) => {
  // Sample product data - in real implementation, this would come from API
  const [products, setProducts] = useState([
    {
      id: '1',
      name: 'Premium Coffee Beans',
      sku: 'COF001',
      category: 'beverages',
      price: 24.99,
      cost: 12.50,
      stock: 150,
      barcode: '1234567890123',
      status: 'active',
      image: null
    },
    {
      id: '2', 
      name: 'Organic Tea Selection',
      sku: 'TEA001',
      category: 'beverages',
      price: 18.99,
      cost: 8.50,
      stock: 75,
      barcode: '2345678901234',
      status: 'active',
      image: null
    },
    {
      id: '3',
      name: 'Artisan Chocolate Bar',
      sku: 'CHO001',
      category: 'snacks',
      price: 8.99,
      cost: 4.25,
      stock: 0,
      barcode: '3456789012345',
      status: 'active',
      image: null
    },
    {
      id: '4',
      name: 'Bluetooth Headphones',
      sku: 'ELE001', 
      category: 'electronics',
      price: 79.99,
      cost: 45.00,
      stock: 25,
      barcode: '4567890123456',
      status: 'active',
      image: null
    }
  ])

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm)
    
    const matchesCategory = !filters.category || product.category === filters.category
    const matchesStock = !filters.inStock || product.stock > 0
    const matchesStatus = filters.status === 'all' || product.status === filters.status

    return matchesSearch && matchesCategory && matchesStock && matchesStatus
  })

  const handleProductAction = (action: string, productId: string) => {
    console.log(`${action} product:`, productId)
    // In real implementation, these would call the Universal Masterdata APIs
  }

  if (view === 'mobile' || view === 'list') {
    return (
      <div className="space-y-3">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-gradient-to-r from-charcoal/90 to-black/95 backdrop-blur-lg border border-gold/20 rounded-xl p-4 hover:border-gold/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Product Image/Icon */}
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-gold" />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-champagne truncate">{product.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-bronze">
                    <span>SKU: {product.sku}</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {product.price}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      product.stock > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => handleProductAction('view', product.id)}
                  className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-300 hover:bg-blue-500/30 active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleProductAction('edit', product.id)}
                  className="w-10 h-10 bg-gold/20 border border-gold/30 rounded-lg flex items-center justify-center text-gold hover:bg-gold/30 active:scale-95 transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleProductAction('delete', product.id)}
                  className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center text-red-300 hover:bg-red-500/30 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredProducts.map((product) => (
        <div key={product.id} className="bg-gradient-to-br from-charcoal/90 to-black/95 backdrop-blur-lg border border-gold/20 rounded-xl p-4 hover:border-gold/40 transition-all group">
          {/* Product Image */}
          <div className="aspect-square bg-gold/10 rounded-lg mb-4 flex items-center justify-center">
            <Package className="w-12 h-12 text-gold" />
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <h3 className="font-medium text-champagne line-clamp-2 group-hover:text-gold transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-2 text-sm text-bronze">
              <Tag className="w-3 h-3" />
              <span>{product.sku}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-bronze">
              <Barcode className="w-3 h-3" />
              <span className="font-mono">{product.barcode}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gold">${product.price}</span>
              <span className={`px-2 py-1 rounded-lg text-xs ${
                product.stock > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {product.stock > 0 ? `${product.stock}` : 'Out'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleProductAction('view', product.id)}
              className="flex-1 min-h-[36px] bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 active:scale-95 transition-all flex items-center justify-center"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleProductAction('edit', product.id)}
              className="flex-1 min-h-[36px] bg-gold/20 border border-gold/30 rounded-lg text-gold hover:bg-gold/30 active:scale-95 transition-all flex items-center justify-center"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function POSProductsPage() {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'mobile'>('grid')
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(false)

  // Authentication guards
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Authentication Required</h1>
          <p className="text-bronze">Please log in to access product management</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Organization Required</h1>
          <p className="text-bronze">Please select an organization to continue</p>
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Retail', href: '/apps/retail' },
    { label: 'POS', href: '/apps/retail/pos/main' },
    { label: 'Products', href: '/apps/retail/pos/products' }
  ]

  const handleCreateNew = () => {
    // In real implementation, this would open the Universal Entity wizard
    router.push('/apps/retail/pos/products/new')
  }

  const handleExport = () => {
    console.log('Exporting products...')
    // In real implementation, this would use the Universal Masterdata export functionality
  }

  const handleBatchDelete = () => {
    console.log('Batch deleting products...')
    // In real implementation, this would use the Universal Masterdata batch operations
  }

  return (
    <UniversalEntityListShell
      title="Product Management"
      description="Manage your retail product catalog with integrated POS functionality"
      breadcrumbs={breadcrumbs}
      module="Retail"
      entityType="PRODUCT"
      
      // Panel Content
      filterPanelContent={<ProductFilterPanel onFilterChange={setFilters} />}
      listContentComponent={
        <ProductListContent 
          view={selectedView} 
          searchTerm={searchTerm} 
          filters={filters}
        />
      }
      
      // Configuration
      enableSearch={true}
      enableFilters={true}
      enableExport={true}
      enableBatchOperations={true}
      showViewToggle={true}
      showCreateButton={true}
      
      // State & Callbacks
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedView={selectedView}
      onViewChange={setSelectedView}
      totalCount={4} // In real implementation, this would come from API
      selectedCount={0}
      onCreateNew={handleCreateNew}
      onExport={handleExport}
      onBatchDelete={handleBatchDelete}
      loading={loading}
      lastUpdated={new Date()}
    />
  )
}