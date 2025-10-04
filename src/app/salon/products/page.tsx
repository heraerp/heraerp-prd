'use client'

import React, { useState } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useSalonContext } from '../SalonProvider'
import { useHeraProducts } from '@/hooks/useHeraProductsV3'
import { useHeraCategories } from '@/hooks/useHeraCategories'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { ProductList } from '@/components/salon/products/ProductList'
import { ProductModal } from '@/components/salon/products/ProductModal'
import { DeleteProductDialog } from '@/components/salon/products/DeleteProductDialog'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { Product } from '@/types/salon-product'
import { PageHeader, PageHeaderSearch, PageHeaderButton } from '@/components/universal/PageHeader'
import {
  Plus,
  Grid3X3,
  List,
  Package,
  Search,
  Download,
  Building2,
  Filter,
  X,
  MapPin
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

function SalonProductsPageContent() {
  const { organizationId } = useSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('name_asc')

  // Branch filter hook
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(organizationId, 'salon-products-list')

  // Fetch products using new Universal API v2
  const {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    archiveProduct
  } = useHeraProducts({
    filters: {
      branch_id: branchId || undefined,  // Filter by selected branch
      category_id: categoryFilter || undefined,
      status: includeArchived ? undefined : 'active'
    }
  })

  // Fetch categories for filtering using Universal API v2
  const { categories: categoryList } = useHeraCategories({
    organizationId,
    includeArchived: false
  })
  const categories = categoryList.filter(cat => cat && cat.entity_name).map(cat => cat.entity_name)

  // Filter products
  const filteredProducts = products.filter(product => {
    // Skip invalid products
    if (!product || !product.entity_name) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !product.entity_name.toLowerCase().includes(query) &&
        !product.entity_code?.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    // Category filter
    if (categoryFilter && product.category !== categoryFilter) {
      return false
    }

    // Branch filter
    if (branchId && product.metadata?.branch_id !== branchId) {
      return false
    }

    return true
  })

  // CRUD handlers
  const handleSave = async (data: any) => {
    const loadingId = showLoading(
      editingProduct ? 'Updating product...' : 'Creating product...',
      'Please wait while we save your changes'
    )

    try {
      const productData = {
        name: data.name,
        code: data.code,
        price: data.price || 0,
        cost: data.cost || 0,
        qty_on_hand: data.qty_on_hand || 0,
        min_stock: data.min_stock || 10,
        barcode: data.barcode,
        size: data.size,
        unit: data.unit,
        sku_code: data.sku,
        commission_rate: data.commission_rate || 0.5,
        active: data.status === 'active',
        category_id: data.category,
        branch_id: branchId || undefined  // Associate with selected branch
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
        removeToast(loadingId)
        showSuccess('Product updated successfully', `${data.name} has been updated`)
      } else {
        await createProduct(productData)
        removeToast(loadingId)
        showSuccess('Product created successfully', `${data.name} has been added`)
      }
      setModalOpen(false)
      setEditingProduct(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError(
        editingProduct ? 'Failed to update product' : 'Failed to create product',
        error.message || 'Please try again or contact support'
      )
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    const loadingId = showLoading('Deleting product...', 'This action cannot be undone')

    try {
      await deleteProduct(productToDelete.id)
      removeToast(loadingId)
      showSuccess('Product deleted', `${productToDelete.entity_name} has been permanently removed`)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete product', error.message || 'Please try again')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchive = async (product: Product) => {
    const loadingId = showLoading(
      `${product.status === 'archived' ? 'Restoring' : 'Archiving'} product...`,
      'Please wait'
    )

    try {
      await archiveProduct(product.id, product.status !== 'archived')
      removeToast(loadingId)
      showSuccess(
        product.status === 'archived' ? 'Product restored' : 'Product archived',
        `${product.entity_name} has been ${product.status === 'archived' ? 'restored' : 'archived'}`
      )
    } catch (error: any) {
      removeToast(loadingId)
      showError(
        `Failed to ${product.status === 'archived' ? 'restore' : 'archive'} product`,
        error.message || 'Please try again'
      )
    }
  }

  const handleRestore = handleArchive

  const handleExport = () => {
    // TODO: Implement export functionality
    showSuccess('Export started', 'Your products will be exported shortly')
  }

  // Calculate stats
  const activeCount = products.filter(p => p.status === 'active').length
  const totalValue = products.reduce(
    (sum, product) => sum + (product.price || 0) * product.qty_on_hand,
    0
  )
  const lowStockCount = products.filter(p => p.qty_on_hand < 10).length

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-full flex flex-col">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(212, 175, 55, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(15, 111, 92, 0.1), transparent 50%)'
          }}
        />

        {/* Main Content */}
        <div
          className="relative flex-1 overflow-auto"
          style={{
            backgroundColor: COLORS.charcoal,
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <PageHeader
            title="Products"
            breadcrumbs={[
              { label: 'HERA' },
              { label: 'SALON OS' },
              { label: 'Products', isActive: true }
            ]}
            actions={
              <>
                <PageHeaderSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search products..."
                />
                <PageHeaderButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingProduct(null)
                    setModalOpen(true)
                  }}
                >
                  New Product
                </PageHeaderButton>
                <PageHeaderButton variant="secondary" icon={Download} onClick={handleExport} />
              </>
            }
          />

          {/* Error Banner */}
          {error && (
            <div
              className="mx-6 mt-4 text-sm px-3 py-2 rounded-lg border flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: 'rgba(255, 0, 0, 0.3)',
                color: COLORS.lightText
              }}
            >
              <Package className="h-4 w-4" style={{ color: '#FF6B6B' }} />
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="mx-6 mt-6 grid grid-cols-4 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Total Products
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.champagne }}>
                {products.length}
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Active Products
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.emerald }}>
                {activeCount}
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Inventory Value
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.gold }}>
                AED {totalValue.toLocaleString()}
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Low Stock
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.rose }}>
                {lowStockCount}
              </p>
            </div>
          </div>

          {/* Filters and View Options */}
          <div className="mx-6 mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs
                value={includeArchived ? 'all' : 'active'}
                onValueChange={v => setIncludeArchived(v === 'all')}
              >
                <TabsList style={{ backgroundColor: COLORS.charcoalLight }}>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="all">All Products</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'text-foreground' : 'text-muted-foreground'}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>

              {categoryFilter && (
                <Badge variant="secondary" className="gap-1 bg-muted/50">
                  {categoryFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter('')} />
                </Badge>
              )}

              {branchId && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 bg-muted/50 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setBranchId('')}
                >
                  <Building2 className="h-3 w-3" />
                  <MapPin className="h-3 w-3" />
                  {branches.find(b => b.id === branchId)?.entity_name || 'Branch'}
                  <X
                    className="h-3 w-3"
                    onClick={e => {
                      e.stopPropagation()
                      setBranchId('')
                    }}
                  />
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-background/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="updated_desc">Updated (Newest)</SelectItem>
                  <SelectItem value="updated_asc">Updated (Oldest)</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                style={{ color: viewMode === 'grid' ? COLORS.gold : COLORS.lightText }}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                style={{ color: viewMode === 'list' ? COLORS.gold : COLORS.lightText }}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mx-6 mt-4 pt-4 border-t border-border flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 bg-background/30 border-border">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={branchId || '__ALL__'}
                onValueChange={value => setBranchId(value === '__ALL__' ? '' : value)}
              >
                <SelectTrigger className="w-48 bg-background/30 border-border">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All locations</SelectItem>
                  {branchesLoading ? (
                    <SelectItem value="__LOADING__" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.entity_name || 'Unnamed Branch'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Content Area */}
          <div className="mx-6 mt-6 mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package
                    className="w-12 h-12 mx-auto mb-3 animate-pulse"
                    style={{ color: COLORS.gold }}
                  />
                  <p style={{ color: COLORS.lightText }}>Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package
                    className="w-12 h-12 mx-auto mb-3 opacity-30"
                    style={{ color: COLORS.gold }}
                  />
                  <p className="text-lg mb-1" style={{ color: COLORS.champagne }}>
                    {searchQuery || categoryFilter ? 'No products found' : 'No products yet'}
                  </p>
                  <p className="text-sm opacity-60 mb-4" style={{ color: COLORS.lightText }}>
                    {searchQuery || categoryFilter
                      ? 'Try adjusting your search or filters'
                      : 'Create your first product to start managing inventory'}
                  </p>
                  {!searchQuery && !categoryFilter && (
                    <button
                      onClick={() => setModalOpen(true)}
                      className="px-4 py-2 rounded-lg font-medium transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                        color: COLORS.black
                      }}
                    >
                      Create Product
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ProductList
                products={filteredProducts}
                loading={isLoading}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRestore={handleRestore}
              />
            )}
          </div>

          {/* Modals */}
          <ProductModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingProduct(null)
            }}
            product={editingProduct}
            onSave={handleSave}
          />

          <DeleteProductDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false)
              setProductToDelete(null)
            }}
            onConfirm={handleConfirmDelete}
            product={productToDelete}
            loading={isDeleting}
          />
        </div>
      </div>
    </div>
  )
}

export default function SalonProductsPage() {
  const { organizationId } = useSalonContext()

  // Wait for organizationId to be available
  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <StatusToastProvider>
      <SalonProductsPageContent />
    </StatusToastProvider>
  )
}
