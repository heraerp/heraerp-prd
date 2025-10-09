'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraProducts } from '@/hooks/useHeraProducts'
import { useHeraProductCategories } from '@/hooks/useHeraProductCategories'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { ProductList } from '@/components/salon/products/ProductList'
import { ProductModal } from '@/components/salon/products/ProductModal'
import { ProductCategoryModal } from '@/components/salon/products/ProductCategoryModal'
import { DeleteProductDialog } from '@/components/salon/products/DeleteProductDialog'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { Product } from '@/types/salon-product'
import { ProductCategory, ProductCategoryFormValues } from '@/types/salon-product-category'
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
  MapPin,
  Tag,
  FolderPlus,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Archive
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

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
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const searchParams = useSearchParams()
  const highlightedProductId = searchParams.get('productId')
  const productRefs = useRef<Record<string, HTMLDivElement | null>>({})

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

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)

  // Branch filter hook
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(undefined, 'salon-products-list', organizationId)

  // Fetch products using new Universal API v2
  const {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    restoreProduct
  } = useHeraProducts({
    includeArchived,
    searchQuery: '',
    categoryFilter: '',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: true,
      branch_id: branchId || 'all' // Pass branch filter to hook
    }
  })

  // Fetch product categories using Universal API v2
  const {
    categories: productCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    isCreating: isCreatingCategory,
    isUpdating: isUpdatingCategory
  } = useHeraProductCategories({
    organizationId,
    includeArchived: false
  })

  // Memoized categories for performance
  const categories = useMemo(
    () => productCategories.filter(cat => cat && cat.entity_name).map(cat => cat.entity_name),
    [productCategories]
  )

  // Filter products - memoized for performance
  const filteredProducts = useMemo(
    () =>
      products.filter(product => {
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

        // Branch filter is now handled by useHeraProducts hook via relationships
        // No need for manual client-side filtering

        return true
      }),
    [products, searchQuery, categoryFilter]
  )

  // Scroll to highlighted product from deep link
  useEffect(() => {
    if (highlightedProductId && filteredProducts.length > 0) {
      const productExists = filteredProducts.some(p => p.id === highlightedProductId)
      if (productExists) {
        setTimeout(() => {
          const element = document.getElementById(`product-${highlightedProductId}`)
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }, 300)
      }
    }
  }, [highlightedProductId, filteredProducts])

  // CRUD handlers - memoized for performance
  const handleSave = useCallback(
    async (data: any) => {
      const loadingId = showLoading(
        editingProduct ? 'Updating product...' : 'Creating product...',
        'Please wait while we save your changes'
      )

      try {
        if (editingProduct) {
          await updateProduct(editingProduct.id, data)
          removeToast(loadingId)
          showSuccess('Product updated successfully', `${data.name} has been updated`)
        } else {
          await createProduct(data)
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
    },
    [editingProduct, updateProduct, createProduct, showLoading, removeToast, showSuccess, showError]
  )

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    const loadingId = showLoading('Deleting product...', 'This action cannot be undone')

    try {
      // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
      // Try hard delete first, but if product is referenced, archive instead
      const result = await deleteProduct(productToDelete.id)

      removeToast(loadingId)

      if (result.archived) {
        // Product was archived instead of deleted (referenced in transactions)
        showSuccess(
          'Product archived',
          result.message || `${productToDelete.entity_name} has been archived`
        )
      } else {
        // Product was successfully deleted
        showSuccess(
          'Product deleted',
          `${productToDelete.entity_name} has been permanently removed`
        )
      }

      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete product', error.message || 'Please try again')
    } finally {
      setIsDeleting(false)
    }
  }, [productToDelete, deleteProduct, showLoading, removeToast, showSuccess, showError])

  const handleArchive = useCallback(
    async (product: Product) => {
      const loadingId = showLoading('Archiving product...', 'Please wait')

      try {
        await archiveProduct(product.id)
        removeToast(loadingId)
        showSuccess('Product archived', `${product.entity_name} has been archived`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to archive product', error.message || 'Please try again')
      }
    },
    [archiveProduct, showLoading, removeToast, showSuccess, showError]
  )

  const handleRestore = useCallback(
    async (product: Product) => {
      const loadingId = showLoading('Restoring product...', 'Please wait')

      try {
        await restoreProduct(product.id)
        removeToast(loadingId)
        showSuccess('Product restored', `${product.entity_name} has been restored`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to restore product', error.message || 'Please try again')
      }
    },
    [restoreProduct, showLoading, removeToast, showSuccess, showError]
  )

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
    showSuccess('Export started', 'Your products will be exported shortly')
  }, [showSuccess])

  // Category CRUD handlers
  const handleSaveCategory = async (data: ProductCategoryFormValues) => {
    const loadingId = showLoading(
      editingCategory ? 'Updating category...' : 'Creating category...',
      'Please wait'
    )

    try {
      if (editingCategory) {
        await updateCategory(editingCategory, data)
        removeToast(loadingId)
        showSuccess('Category updated successfully', `${data.name} has been updated`)
      } else {
        await createCategory(data)
        removeToast(loadingId)
        showSuccess('Category created successfully', `${data.name} has been added`)
      }
      setCategoryModalOpen(false)
      setEditingCategory(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError(
        editingCategory ? 'Failed to update category' : 'Failed to create category',
        error.message || 'Please try again or contact support'
      )
    }
  }

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setIsDeletingCategory(true)
    const loadingId = showLoading('Deleting category...', 'This action cannot be undone')

    try {
      await deleteCategory(categoryToDelete.id)
      removeToast(loadingId)
      showSuccess('Category deleted', `${categoryToDelete.entity_name} has been removed`)
      setCategoryDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete category', error.message || 'Please try again')
    } finally {
      setIsDeletingCategory(false)
    }
  }

  // Calculate stats
  const activeCount = products.filter(p => p.status === 'active').length
  const archivedCount = products.filter(p => p.status === 'archived').length
  const totalValue = products.reduce(
    (sum, product) => sum + (product.price_cost || 0) * (product.stock_quantity || 0),
    0
  )
  const lowStockCount = products.filter(
    p => (p.stock_quantity || 0) < (p.reorder_level || 10)
  ).length

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: COLORS.black }}>
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
                  variant="secondary"
                  icon={FolderPlus}
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryModalOpen(true)
                  }}
                >
                  New Category
                </PageHeaderButton>
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

          {/* Highlight Banner - Coming from Inventory */}
          {highlightedProductId && (
            <div className="mx-6 mt-4">
              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: COLORS.gold + '40',
                  backgroundColor: COLORS.gold + '10'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" style={{ color: COLORS.gold }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                      Showing product from inventory
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.delete('productId')
                      window.history.pushState({}, '', url.toString())
                      window.location.reload()
                    }}
                    style={{ color: COLORS.lightText }}
                    className="hover:opacity-70"
                  >
                    Clear filter
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Top Control Bar - Branch Filter & View Controls */}
          <div className="mx-6 mt-6">
            <div
              className="p-4 rounded-xl flex items-center justify-between"
              style={{
                backgroundColor: COLORS.charcoalLight + 'ee',
                border: `1px solid ${COLORS.bronze}30`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {/* Left: Branch Filter */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" style={{ color: COLORS.gold }} />
                  <span className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                    Location:
                  </span>
                </div>
                <Select
                  value={branchId || '__ALL__'}
                  onValueChange={value => setBranchId(value === '__ALL__' ? undefined : value)}
                >
                  <SelectTrigger
                    className="w-52 border"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      borderColor: COLORS.bronze + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: COLORS.gold }} />
                      <SelectValue placeholder="All Locations" />
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    className="salon-luxe-select"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      borderColor: COLORS.bronze + '40'
                    }}
                  >
                    <SelectItem
                      value="__ALL__"
                      className="salon-luxe-select-item"
                      style={{ color: COLORS.champagne }}
                    >
                      All Locations
                    </SelectItem>
                    {branchesLoading ? (
                      <div
                        className="px-2 py-3 text-center text-sm"
                        style={{ color: COLORS.bronze }}
                      >
                        Loading...
                      </div>
                    ) : branches.length === 0 ? (
                      <div
                        className="px-2 py-3 text-center text-sm"
                        style={{ color: COLORS.bronze }}
                      >
                        No branches
                      </div>
                    ) : (
                      branches.map(branch => (
                        <SelectItem
                          key={branch.id}
                          value={branch.id}
                          className="salon-luxe-select-item"
                          style={{ color: COLORS.champagne }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" style={{ color: COLORS.gold }} />
                            <div className="flex flex-col">
                              <span className="font-medium">{branch.name}</span>
                              {branch.code && (
                                <span className="text-xs opacity-60">{branch.code}</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Active Branch Badge */}
                {branchId && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      borderColor: COLORS.gold + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <Building2 className="h-3 w-3" style={{ color: COLORS.gold }} />
                    <span>{branches.find(b => b.id === branchId)?.name || 'Branch'}</span>
                    <X
                      className="h-3 w-3 cursor-pointer hover:opacity-70 transition-opacity"
                      onClick={() => setBranchId(undefined)}
                      style={{ color: COLORS.gold }}
                    />
                  </div>
                )}
              </div>

              {/* Right: View Mode & Sort */}
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger
                    className="w-44 border"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      borderColor: COLORS.bronze + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="salon-luxe-select"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      borderColor: COLORS.bronze + '40'
                    }}
                  >
                    <SelectItem value="name_asc" className="salon-luxe-select-item">
                      Name (A-Z)
                    </SelectItem>
                    <SelectItem value="name_desc" className="salon-luxe-select-item">
                      Name (Z-A)
                    </SelectItem>
                    <SelectItem value="updated_desc" className="salon-luxe-select-item">
                      Updated (Newest)
                    </SelectItem>
                    <SelectItem value="updated_asc" className="salon-luxe-select-item">
                      Updated (Oldest)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Include Archived Toggle */}
                <button
                  onClick={() => setIncludeArchived(!includeArchived)}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    includeArchived
                      ? 'bg-gold/20 border-gold/40'
                      : 'hover:bg-white/10 border-bronze/30'
                  } border`}
                  style={{
                    color: includeArchived ? COLORS.gold : COLORS.lightText,
                    borderColor: includeArchived ? COLORS.gold + '40' : COLORS.bronze + '30'
                  }}
                  title={includeArchived ? 'Hide archived products' : 'Show archived products'}
                >
                  <Archive className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {includeArchived ? 'Hide Archived' : 'Show Archived'}
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                    style={{ color: viewMode === 'grid' ? COLORS.gold : COLORS.lightText }}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                    style={{ color: viewMode === 'list' ? COLORS.gold : COLORS.lightText }}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          {productCategories.length > 0 && (
            <div className="mx-6 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: COLORS.gold }} />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    Categories ({productCategories.length})
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {productCategories.map(category => (
                  <div
                    key={category.id}
                    className="group relative px-3 py-1.5 rounded-lg border transition-all"
                    style={{
                      backgroundColor: category.color + '15',
                      borderColor: category.color + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        <Tag className="w-3 h-3" style={{ color: category.color }} />
                        <span className="text-xs font-medium">{category.entity_name}</span>
                        {category.product_count > 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: category.color + '30',
                              color: COLORS.champagne
                            }}
                          >
                            {category.product_count}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setCategoryToDelete(category)
                          setCategoryDeleteDialogOpen(true)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-400"
                        title="Delete category"
                      >
                        <X className="w-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards - Enterprise Grade Aesthetic */}
          <div className="mx-6 mt-4 grid grid-cols-4 gap-3">
            {/* Total Products */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.bronze}15 0%, ${COLORS.charcoal}f5 40%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.bronze}60`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(140, 120, 83, 0.2)'
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.bronze}25 0%, transparent 50%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.bronze}30 0%, ${COLORS.bronze}15 100%)`,
                      border: `1px solid ${COLORS.bronze}60`,
                      boxShadow: `0 4px 16px ${COLORS.bronze}20`
                    }}
                  >
                    <Package className="h-4 w-4" style={{ color: COLORS.bronze }} />
                  </div>
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze, letterSpacing: '0.1em' }}
                >
                  Total Products
                </p>
                <p
                  className="text-2xl font-bold mb-0.5 tracking-tight"
                  style={{ color: COLORS.champagne }}
                >
                  {products.length}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: COLORS.bronze + '80' }}
                  />
                  <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                    Across all categories
                  </p>
                </div>
              </div>
            </div>

            {/* Active Products */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}12 0%, ${COLORS.charcoal}f5 40%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.gold}50`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212, 175, 55, 0.15)'
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, transparent 50%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold}25 0%, ${COLORS.gold}12 100%)`,
                      border: `1px solid ${COLORS.gold}60`,
                      boxShadow: `0 4px 16px ${COLORS.gold}20`
                    }}
                  >
                    <TrendingUp className="h-4 w-4" style={{ color: COLORS.gold }} />
                  </div>
                  <div
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}18 100%)`,
                      color: COLORS.gold,
                      border: `1px solid ${COLORS.gold}50`
                    }}
                  >
                    {((activeCount / products.length) * 100).toFixed(0)}%
                  </div>
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze, letterSpacing: '0.1em' }}
                >
                  Active Products
                </p>
                <p
                  className="text-2xl font-bold mb-0.5 tracking-tight"
                  style={{ color: COLORS.champagne }}
                >
                  {activeCount}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: COLORS.gold + '80' }}
                  />
                  <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                    Ready for sale
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Value - Premium Gold Gradient */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 25%, ${COLORS.charcoal}f5 60%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.gold}80`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212, 175, 55, 0.25), 0 0 30px ${COLORS.gold}15`
              }}
            >
              {/* Animated shimmer effect on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}15 50%, transparent 70%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold}40 0%, ${COLORS.gold}20 100%)`,
                      border: `1.5px solid ${COLORS.gold}80`,
                      boxShadow: `0 6px 20px ${COLORS.gold}30, inset 0 1px 0 ${COLORS.gold}50`
                    }}
                  >
                    <DollarSign className="h-4 w-4" style={{ color: COLORS.gold }} />
                  </div>
                  <TrendingUp
                    className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity"
                    style={{ color: COLORS.gold }}
                  />
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze, letterSpacing: '0.1em' }}
                >
                  Inventory Value
                </p>
                <p
                  className="text-2xl font-bold mb-0.5 tracking-tight"
                  style={{ color: COLORS.gold }}
                >
                  AED {totalValue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                  <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                    Total stock value
                  </p>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div
              className="group relative p-4 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${COLORS.rose}12 0%, ${COLORS.charcoal}f5 40%, ${COLORS.charcoal}f0 100%)`,
                border: `1.5px solid ${COLORS.rose}55`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(239, 68, 68, 0.12)'
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.rose}18 0%, transparent 50%)`
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.rose}25 0%, ${COLORS.rose}12 100%)`,
                      border: `1px solid ${COLORS.rose}50`,
                      boxShadow: `0 4px 16px ${COLORS.rose}18`
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" style={{ color: COLORS.rose }} />
                  </div>
                  {lowStockCount > 0 && (
                    <div
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold animate-pulse"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.rose}35 0%, ${COLORS.rose}22 100%)`,
                        color: COLORS.rose,
                        border: `1px solid ${COLORS.rose}60`
                      }}
                    >
                      Alert
                    </div>
                  )}
                </div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 opacity-70"
                  style={{ color: COLORS.bronze, letterSpacing: '0.1em' }}
                >
                  Low Stock Alert
                </p>
                <p
                  className="text-2xl font-bold mb-0.5 tracking-tight"
                  style={{ color: COLORS.rose }}
                >
                  {lowStockCount}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div
                    className="w-1 h-1 rounded-full animate-pulse"
                    style={{ backgroundColor: COLORS.rose + '90' }}
                  />
                  <p className="text-[10px] opacity-60" style={{ color: COLORS.lightText }}>
                    {lowStockCount > 0 ? 'Requires attention' : 'All products stocked'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mx-6 mt-4 flex items-center gap-3">
            {/* Archived Products Info Badge */}
            {includeArchived && archivedCount > 0 && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium"
                style={{
                  backgroundColor: COLORS.bronze + '15',
                  borderColor: COLORS.bronze + '40',
                  color: COLORS.champagne
                }}
              >
                <Archive className="h-4 w-4" style={{ color: COLORS.bronze }} />
                <span>
                  Showing {archivedCount} archived product{archivedCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: showFilters ? COLORS.gold + '20' : COLORS.charcoalLight,
                borderColor: showFilters ? COLORS.gold + '60' : COLORS.bronze + '40',
                color: showFilters ? COLORS.gold : COLORS.champagne
              }}
            >
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </div>
            </button>

            {categoryFilter && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: COLORS.gold + '20',
                  borderColor: COLORS.gold + '60',
                  color: COLORS.gold
                }}
              >
                <Tag className="h-3 w-3" style={{ color: COLORS.gold }} />
                <span>{categoryFilter}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setCategoryFilter('')}
                  style={{ color: COLORS.gold }}
                />
              </div>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div
              className="mx-6 mt-4 pt-4 border-t flex items-center gap-4"
              style={{
                borderColor: COLORS.bronze + '20'
              }}
            >
              {/* Category Filter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" style={{ color: COLORS.gold }} />
                  <span className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                    Category:
                  </span>
                </div>
                <Select
                  value={categoryFilter || '__ALL__'}
                  onValueChange={value => setCategoryFilter(value === '__ALL__' ? '' : value)}
                >
                  <SelectTrigger
                    className="w-48 border"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      borderColor: COLORS.bronze + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent
                    className="salon-luxe-select"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      borderColor: COLORS.bronze + '40'
                    }}
                  >
                    <SelectItem
                      value="__ALL__"
                      className="salon-luxe-select-item"
                      style={{ color: COLORS.champagne }}
                    >
                      All categories
                    </SelectItem>
                    {categories.map(cat => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="salon-luxe-select-item"
                        style={{ color: COLORS.champagne }}
                      >
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                organizationId={organizationId}
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

          <ProductCategoryModal
            open={categoryModalOpen}
            onClose={() => {
              setCategoryModalOpen(false)
              setEditingCategory(null)
            }}
            category={editingCategory}
            onSave={handleSaveCategory}
          />

          {/* Delete Category Dialog */}
          <AlertDialog open={categoryDeleteDialogOpen} onOpenChange={setCategoryDeleteDialogOpen}>
            <AlertDialogContent
              className="max-w-md"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}40`,
                boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
              }}
            >
              <AlertDialogHeader>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: '#FF6B6B20',
                      border: '1px solid #FF6B6B40'
                    }}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <AlertDialogTitle
                    className="text-lg font-semibold"
                    style={{ color: COLORS.champagne }}
                  >
                    Delete Category
                  </AlertDialogTitle>
                </div>
              </AlertDialogHeader>

              <div className="space-y-3" style={{ color: COLORS.lightText }}>
                <p className="text-sm">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold" style={{ color: COLORS.champagne }}>
                    "{categoryToDelete?.entity_name}"
                  </span>
                  ?
                </p>
                <p className="text-sm opacity-70">
                  This action cannot be undone. The category will be permanently removed.
                </p>
              </div>

              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel
                  className="border-border hover:bg-muted/50"
                  style={{ color: COLORS.lightText }}
                  disabled={isDeletingCategory}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCategory}
                  disabled={isDeletingCategory}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeletingCategory ? 'Deleting...' : 'Delete Category'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

export default function SalonProductsPage() {
  const { organizationId } = useSecuredSalonContext()

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
