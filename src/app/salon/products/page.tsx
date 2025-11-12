'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react'
import { useSearchParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraProducts } from '@/hooks/useHeraProducts'
import { useHeraProductCategories } from '@/hooks/useHeraProductCategories'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { Product } from '@/types/salon-product'
import { ProductCategory, ProductCategoryFormValues } from '@/types/salon-product-category'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { SalonPagination } from '@/components/salon/ui/Pagination'
import {
  SalonIconButton,
  SalonIconButtonGroup,
  SalonIconButtonDivider
} from '@/components/salon/shared/SalonIconButton'
import Link from 'next/link'
// ✅ ENTERPRISE IMPORT/EXPORT: Reusable system for all HERA apps
import {
  useHeraImportExport,
  HeraImportModal,
  ImportExportConfig
} from '@/components/shared/enterprise/HeraImportExport'
import {
  Plus,
  Grid3X3,
  List,
  Package,
  Package2,
  Search,
  Download,
  Upload,
  Building2,
  Filter,
  X,
  MapPin,
  Tag,
  FolderPlus,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Archive,
  Sparkles,
  Bell,
  ChevronDown,
  Scan
} from 'lucide-react'
import { ScanToCart } from '@/components/salon/pos/ScanToCart'

// ✅ LAZY LOADING: Split heavy components for better performance
const ProductList = lazy(() => import('@/components/salon/products/ProductList').then(mod => ({ default: mod.ProductList })))
const ProductModal = lazy(() => import('@/components/salon/products/ProductModal').then(mod => ({ default: mod.ProductModal })))
const ProductCategoryModal = lazy(() => import('@/components/salon/products/ProductCategoryModal').then(mod => ({ default: mod.ProductCategoryModal })))
const DeleteProductDialog = lazy(() => import('@/components/salon/products/DeleteProductDialog').then(mod => ({ default: mod.DeleteProductDialog })))
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  // ✅ HERA AUTH: Get user context for debugging
  const { user, isAuthenticated } = useHERAAuth()

  // ✅ HERA PATTERN: Use context for organization AND branches (same as services page)
  const {
    organizationId,
    organization,
    currency,
    selectedBranchId,
    availableBranches,
    setSelectedBranchId,
    isLoadingBranches
  } = useSecuredSalonContext()

  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // 🔍 DEBUG: Log branch loading context
  useEffect(() => {
    console.log('[SalonProducts] 🏢 Branch Context DEBUG:', {
      isLoadingBranches,
      availableBranchesCount: availableBranches?.length || 0,
      availableBranches: availableBranches,
      organizationId,
      organizationName: organization?.entity_name,
      timestamp: new Date().toISOString()
    })

    // Log individual branch structure
    if (availableBranches && availableBranches.length > 0) {
      console.log('[SalonProducts] 📍 First branch structure:', {
        firstBranch: availableBranches[0],
        hasId: !!availableBranches[0]?.id,
        hasName: !!availableBranches[0]?.name,
        hasEntityName: !!(availableBranches[0] as any)?.entity_name,
        allKeys: Object.keys(availableBranches[0])
      })
    }
  }, [isLoadingBranches, availableBranches, organizationId, organization])
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
  const [sortBy, setSortBy] = useState('name_asc')
  // Local branch filter state (separate from global context) - matches services page pattern
  const [localBranchFilter, setLocalBranchFilter] = useState<string | null>(null)

  // 🚀 PAGINATION STATE: Enterprise-grade pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50) // 50 products per page

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)

  // Import/Export state
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Barcode scanner state
  const [showScanner, setShowScanner] = useState(false)

  // Debug: Log scanner state changes
  useEffect(() => {
    console.log('🔍🔍🔍 SCANNER STATE CHANGED:', showScanner)
  }, [showScanner])

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
      branch_id: localBranchFilter || undefined // ✅ Pass local branch filter to hook
    }
  })

  // Fetch product categories using Universal API v2
  const {
    categories: productCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    refetch: refetchCategories, // ✅ Get refetch function for manual refresh
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

  // ✅ ENTERPRISE IMPORT/EXPORT: Declarative configuration replaces 280+ lines of manual code
  // 💰 Dynamic currency support from organization context
  const productImportExportConfig: ImportExportConfig<Product> = useMemo(() => ({
    entityName: 'Product',
    entityNamePlural: 'Products',
    filePrefix: 'HERA_Products',
    templateSheetName: 'Products Data',

    // 💰 MULTI-CURRENCY: Organization-specific currency configuration
    currency: currency || 'AED',
    currencySymbol: currency || 'AED',

    // 🎯 ENTERPRISE CUSTOMIZATION: Page-specific instructions and formatting
    customWarning: '⚠️ IMPORTANT: CREATE CATEGORIES FIRST',
    customInstructions: [
      'Category must match existing category names exactly (case-insensitive)',
      'Selling Price must be greater than Cost Price',
      'Stock quantities cannot be negative',
      'Status: Enter "active", "inactive", or "archived" (defaults to active)'
    ],
    exampleNote: 'Professional salon product example',
    columnWidths: [25, 12, 15, 12, 12, 15, 15, 20, 18, 15, 12, 40, 10], // Custom widths for each field

    fields: [
      {
        headerName: 'Product Name',
        fieldName: 'name',
        type: 'text',
        required: true,
        example: 'L\'Oreal Professional Shampoo 500ml',
        description: 'Product name (required)'
      },
      {
        headerName: 'Product Code',
        fieldName: 'code',
        type: 'text',
        required: false,
        example: 'LOREAL-SHP-500',
        description: 'Optional product code/SKU'
      },
      {
        headerName: 'Category',
        fieldName: 'category',
        type: 'text',
        required: false,
        example: productCategories[0]?.entity_name || 'Hair Care',
        description: 'Category name (must match existing category)'
      },
      {
        headerName: `Cost Price (${currency || 'AED'})`,
        fieldName: 'cost_price',
        type: 'number',
        required: true,
        example: 75,
        description: `Product cost price in ${currency || 'AED'}`
      },
      {
        headerName: `Selling Price (${currency || 'AED'})`,
        fieldName: 'selling_price',
        type: 'number',
        required: true,
        example: 150,
        description: `Product selling price in ${currency || 'AED'}`
      },
      {
        headerName: 'Stock Quantity',
        fieldName: 'stock_level',
        type: 'number',
        required: false,
        example: 25,
        description: 'Current stock quantity'
      },
      {
        headerName: 'Reorder Level',
        fieldName: 'reorder_level',
        type: 'number',
        required: false,
        example: 10,
        description: 'Minimum stock level before reordering'
      },
      {
        headerName: 'Brand',
        fieldName: 'brand',
        type: 'text',
        required: false,
        example: 'L\'Oreal Professional',
        description: 'Product brand name'
      },
      {
        headerName: 'Barcode',
        fieldName: 'barcode',
        type: 'text',
        required: false,
        example: '3474636391813',
        description: 'Product barcode'
      },
      {
        headerName: 'Barcode Primary',
        fieldName: 'barcode_primary',
        type: 'text',
        required: false,
        example: '3474636391813',
        description: 'Primary barcode identifier'
      },
      {
        headerName: 'Barcode Type',
        fieldName: 'barcode_type',
        type: 'text',
        required: false,
        example: 'EAN13',
        description: 'Barcode type (EAN13, UPC, etc.)'
      },
      {
        headerName: 'GTIN',
        fieldName: 'gtin',
        type: 'text',
        required: false,
        example: '03474636391813',
        description: 'Global Trade Item Number'
      },
      {
        headerName: 'SKU',
        fieldName: 'sku',
        type: 'text',
        required: false,
        example: 'LOREAL-PRO-SHP-500',
        description: 'Stock Keeping Unit'
      },
      {
        headerName: 'Size',
        fieldName: 'size',
        type: 'text',
        required: false,
        example: '500ml',
        description: 'Product size/volume'
      },
      {
        headerName: 'Description',
        fieldName: 'description',
        type: 'text',
        required: false,
        example: 'Professional salon shampoo for color-treated hair. Sulfate-free formula with UV protection.',
        description: 'Product description'
      },
      {
        headerName: 'Status',
        fieldName: 'status',
        type: 'enum',
        required: false,
        example: 'active',
        enumValues: ['active', 'inactive', 'archived'],
        description: 'Product status'
      }
    ],

    referenceData: [
      {
        name: 'categories',
        displayName: 'Available Categories',
        items: productCategories.map(c => ({ id: c.id, name: c.entity_name }))
      }
    ],

    onCreate: async (data) => {
      await createProduct(data)
    },

    exportData: products,

    exportMapper: (product) => ({
      'Product Name': product.entity_name || '',
      'Product Code': product.entity_code || '',
      'Category': product.category || '',
      [`Cost Price (${currency || 'AED'})`]: product.price_cost || product.cost_price || 0,
      [`Selling Price (${currency || 'AED'})`]: product.price_market || product.selling_price || 0,
      'Stock Quantity': product.stock_quantity || product.stock_level || 0,
      'Reorder Level': product.reorder_level || 0,
      'Brand': product.brand || '',
      'Barcode': product.barcode || '',
      'Barcode Primary': product.barcode_primary || '',
      'Barcode Type': product.barcode_type || '',
      'GTIN': product.gtin || '',
      'SKU': product.sku || '',
      'Size': product.size || '',
      'Description': product.entity_description || '',
      'Status': product.status || 'active',
      'Created At': new Date(product.created_at).toLocaleString(),
      'Updated At': new Date(product.updated_at).toLocaleString()
    }),

    validateRow: (data, rowIndex) => {
      // Validate selling price is greater than cost price
      if (data.cost_price && data.selling_price && data.selling_price < data.cost_price) {
        return 'Selling price must be greater than cost price'
      }
      // Validate stock levels are non-negative
      if (data.stock_level && data.stock_level < 0) {
        return 'Stock quantity cannot be negative'
      }
      return null
    }
  }), [productCategories, products, currency, createProduct]) // ✅ Dependencies for useMemo

  // ✅ ENTERPRISE HOOK: Replaces 280+ lines of manual import/export code
  const {
    isImporting,
    isExporting,
    importProgress,
    importResults,
    downloadTemplate,
    importFile,
    exportData,
    resetImport
  } = useHeraImportExport(productImportExportConfig)

  // ✅ ENTERPRISE PATTERN: Filter, deduplicate, and sort products - memoized for performance
  const filteredAndSortedProducts = useMemo(
    () => {
      // Step 1: Deduplicate products by ID (prevent React duplicate key warnings)
      const uniqueProductsMap = new Map()
      const duplicateCount = products.length

      products.forEach(product => {
        if (product && product.id) {
          if (uniqueProductsMap.has(product.id)) {
            // Log duplicate detection in development
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Products] 🔄 Duplicate product detected: ${product.entity_name} (${product.id})`)
            }
          } else {
            uniqueProductsMap.set(product.id, product)
          }
        }
      })

      const uniqueProducts = Array.from(uniqueProductsMap.values())

      // Log deduplication stats if duplicates were found
      if (uniqueProducts.length < duplicateCount && process.env.NODE_ENV === 'development') {
        console.warn(`[Products] 🔄 Removed ${duplicateCount - uniqueProducts.length} duplicate(s) from ${duplicateCount} total products`)
      }

      // Step 2: Filter products
      let filtered = uniqueProducts.filter(product => {
        // Skip invalid products
        if (!product || !product.entity_name) {
          return false
        }

        // 🎯 NEW: Tab-based status filtering (exclude 'deleted' from both tabs)
        if (!includeArchived) {
          // Active tab: Show only status='active'
          if (product.status === 'archived' || product.status === 'deleted') {
            return false
          }
        } else {
          // All tab: Show 'active' and 'archived' (exclude 'deleted')
          if (product.status === 'deleted') {
            return false
          }
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
      })

      // Step 3: Sort products - Active products first, then archived
      const sorted = [...filtered].sort((a, b) => {
        // Primary sort: Active products before archived products
        const aIsArchived = a.status === 'archived'
        const bIsArchived = b.status === 'archived'

        if (aIsArchived !== bIsArchived) {
          return aIsArchived ? 1 : -1 // Active products (false) come first
        }

        // Secondary sort: Apply user-selected sorting within each group
        switch (sortBy) {
          case 'name_asc':
            return a.entity_name.localeCompare(b.entity_name)
          case 'name_desc':
            return b.entity_name.localeCompare(a.entity_name)
          case 'price_low':
            const priceA = a.price_market || a.selling_price || 0
            const priceB = b.price_market || b.selling_price || 0
            return priceA - priceB
          case 'price_high':
            const priceLowA = a.price_market || a.selling_price || 0
            const priceLowB = b.price_market || b.selling_price || 0
            return priceLowB - priceLowA
          case 'stock_low':
            const stockA = a.stock_quantity || a.stock_level || 0
            const stockB = b.stock_quantity || b.stock_level || 0
            return stockA - stockB
          case 'stock_high':
            const stockLowA = a.stock_quantity || a.stock_level || 0
            const stockLowB = b.stock_quantity || b.stock_level || 0
            return stockLowB - stockLowA
          case 'updated_desc':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          case 'updated_asc':
            return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          default:
            return 0
        }
      })

      return sorted
    },
    [products, searchQuery, categoryFilter, sortBy, includeArchived]
  )

  // For backward compatibility, keep filteredProducts reference
  const filteredProducts = filteredAndSortedProducts

  // 🔄 RESET PAGE: Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, sortBy])

  // 📄 PAGINATION CALCULATIONS: Slice data for current page
  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, pageSize])

  // 🚨 ENTERPRISE ERROR LOGGING: Detailed console logs with timestamps
  // MUST be defined BEFORE any handlers that use it to avoid temporal dead zone
  const logError = useCallback((context: string, error: any, additionalInfo?: any) => {
    const timestamp = new Date().toISOString()
    const errorLog = {
      timestamp,
      context,
      error: {
        message: error?.message || String(error),
        stack: error?.stack,
        code: error?.code,
        name: error?.name
      },
      additionalInfo,
      organizationId,
      page: 'products'
    }

    console.error('🚨 [HERA Products Error]', errorLog)

    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Error Details')
      console.log('Context:', context)
      console.log('Message:', error?.message)
      console.log('Stack:', error?.stack)
      console.log('Additional Info:', additionalInfo)
      console.groupEnd()
    }

    return errorLog
  }, [organizationId])

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
        logError(editingProduct ? 'Update Product Failed' : 'Create Product Failed', error, {
          productName: data.name,
          productData: data
        })
        removeToast(loadingId)
        showError(
          editingProduct ? 'Failed to update product' : 'Failed to create product',
          error.message || 'Please check the console for detailed error information and try again'
        )
      }
    },
    [editingProduct, updateProduct, createProduct, showLoading, removeToast, showSuccess, showError, logError]
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
      logError('Delete Product Failed', error, {
        productId: productToDelete.id,
        productName: productToDelete.entity_name
      })
      removeToast(loadingId)
      showError('Failed to delete product', error.message || 'Please check the console for details')
    } finally {
      setIsDeleting(false)
    }
  }, [productToDelete, deleteProduct, showLoading, removeToast, showSuccess, showError, logError])

  const handleArchive = useCallback(
    async (product: Product) => {
      const loadingId = showLoading('Archiving product...', 'Please wait')

      try {
        await archiveProduct(product.id)
        removeToast(loadingId)
        showSuccess('Product archived', `${product.entity_name} has been archived`)
      } catch (error: any) {
        logError('Archive Product Failed', error, {
          productId: product.id,
          productName: product.entity_name
        })
        removeToast(loadingId)
        showError('Failed to archive product', error.message || 'Please check the console for details')
      }
    },
    [archiveProduct, showLoading, removeToast, showSuccess, showError, logError]
  )

  const handleRestore = useCallback(
    async (product: Product) => {
      const loadingId = showLoading('Restoring product...', 'Please wait')

      try {
        await restoreProduct(product.id)
        removeToast(loadingId)
        showSuccess('Product restored', `${product.entity_name} has been restored`)
      } catch (error: any) {
        logError('Restore Product Failed', error, {
          productId: product.id,
          productName: product.entity_name
        })
        removeToast(loadingId)
        showError('Failed to restore product', error.message || 'Please check the console for details')
      }
    },
    [restoreProduct, showLoading, removeToast, showSuccess, showError, logError]
  )

  // ✅ ENTERPRISE EXPORT: Simplified using enterprise system
  const handleExport = useCallback(async () => {
    if (!products || products.length === 0) {
      showError('No products to export', 'Please add some products first')
      return
    }

    try {
      const { fileName } = await exportData()
      showSuccess('Export completed', `Exported ${products.length} products to ${fileName}`)
    } catch (error: any) {
      logError('Export Products Failed', error, { productCount: products.length })
      showError('Failed to export products', error.message || 'Please try again')
    }
  }, [exportData, products, showSuccess, showError, logError])

  // Handle barcode scanned product - open in edit mode
  const handleProductScanned = useCallback(
    (product: any) => {
      setShowScanner(false)
      showSuccess('Product found', `Found: ${product.entity_name}`)

      // Open product in edit modal
      setEditingProduct(product)
      setModalOpen(true)
    },
    [showSuccess]
  )

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
      logError(editingCategory ? 'Update Category Failed' : 'Create Category Failed', error, {
        categoryName: data.name,
        categoryData: data
      })
      removeToast(loadingId)
      showError(
        editingCategory ? 'Failed to update category' : 'Failed to create category',
        error.message || 'Please check the console for detailed error information'
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

      // ✅ CRITICAL FIX: Manually refetch categories to ensure deleted category is removed from UI
      // React Query cache update might not be instant, so we force a refetch
      await refetchCategories()

      removeToast(loadingId)
      showSuccess('Category deleted', `${categoryToDelete.entity_name} has been removed`)
      setCategoryDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      logError('Delete Category Failed', error, {
        categoryId: categoryToDelete.id,
        categoryName: categoryToDelete.entity_name
      })
      removeToast(loadingId)
      showError('Failed to delete category', error.message || 'Please check the console for details')
    } finally {
      setIsDeletingCategory(false)
    }
  }

  // ✅ ENTERPRISE IMPORT: Simplified template download using enterprise system
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const { fileName } = await downloadTemplate()
      showSuccess('Template downloaded', 'Fill in the Excel template with your products and import it back')
    } catch (error: any) {
      logError('Download Template Failed', error, {
        categoryCount: productCategories.length
      })
      showError('Failed to download template', error.message || 'Please try again')
    }
  }, [downloadTemplate, productCategories, showSuccess, showError, logError])

  // ✅ ENTERPRISE IMPORT: Simplified using enterprise system
  const handleImport = useCallback(
    async (file: File) => {
      try {
        const results = await importFile(file)

        if (results.success > 0 && results.failed === 0) {
          showSuccess('Import successful', `Imported ${results.success} product${results.success > 1 ? 's' : ''}`)
        } else if (results.success > 0 && results.failed > 0) {
          showSuccess(
            'Partial import',
            `${results.success} product${results.success > 1 ? 's' : ''} succeeded, ${results.failed} failed`
          )
        } else {
          showError('Import failed', results.errors[0] || 'No products were imported')
        }
      } catch (error: any) {
        logError('Import Products Failed', error, { fileName: file.name, fileSize: file.size })
        showError('Failed to import products', error.message || 'Please check the file format')
      }
    },
    [importFile, showSuccess, showError, logError]
  )

  // Calculate stats
  const activeCount = products.filter(p => p.status === 'active').length
  const archivedCount = products.filter(p => p.status === 'archived').length
  const categoriesCount = productCategories.length
  const avgPrice = products.length > 0
    ? products.reduce((sum, product) => sum + (product.price_market || product.selling_price || 0), 0) / products.length
    : 0

  // Calculate profit margin: ((selling_price - cost_price) / selling_price) * 100
  const profitMargin = useMemo(() => {
    const productsWithPrices = products.filter(p =>
      (p.price_market || p.selling_price) && (p.price_cost || p.cost_price)
    )

    if (productsWithPrices.length === 0) return 0

    const totalMargin = productsWithPrices.reduce((sum, product) => {
      const sellingPrice = product.price_market || product.selling_price || 0
      const costPrice = product.price_cost || product.cost_price || 0

      if (sellingPrice === 0) return sum

      const margin = ((sellingPrice - costPrice) / sellingPrice) * 100
      return sum + margin
    }, 0)

    return totalMargin / productsWithPrices.length
  }, [products])

  return (
    <SalonLuxePage
      title="Products"
      description={`${products.length} products | ${activeCount} active | ${archivedCount} archived`}
      maxWidth="full"
      padding="lg"
      actions={
        <div className="hidden md:block">
          <SalonIconButtonGroup spacing="md">
            {/* Navigation to Inventory - HIDDEN until inventory system is complete */}
            {false && (
              <>
                <Link href="/salon/inventory">
                  <SalonIconButton
                    icon={Package2}
                    label="View Inventory"
                    onClick={() => {}}
                    color="#3B82F6"
                    textColor={COLORS.champagne}
                  />
                </Link>
                <SalonIconButtonDivider />
              </>
            )}

            {/* Primary Actions */}
            <SalonIconButton
              icon={Plus}
              label="New Product"
              onClick={() => {
                setEditingProduct(null)
                setModalOpen(true)
              }}
              color="#D4AF37"
              textColor={COLORS.black}
            />

            <SalonIconButton
              icon={FolderPlus}
              label="New Category"
              onClick={() => {
                setEditingCategory(null)
                setCategoryModalOpen(true)
              }}
              color="#0F6F5C"
              textColor={COLORS.champagne}
            />

            <SalonIconButton
              icon={Scan}
              label={showScanner ? 'Close Scanner' : 'Scan Barcode'}
              onClick={() => {
                console.log('🔍🔍🔍 SCAN BUTTON CLICKED - Desktop', { currentState: showScanner })
                setShowScanner(!showScanner)
              }}
              color={showScanner ? '#D4AF37' : '#B794F4'}
              textColor={COLORS.champagne}
            />

            <SalonIconButtonDivider />

            {/* Import/Export */}
            <SalonIconButton
              icon={Upload}
              label="Import Products"
              onClick={() => setImportModalOpen(true)}
              color="#E8B4B8"
              textColor={COLORS.charcoal}
            />

            <SalonIconButton
              icon={Download}
              label="Export Products"
              onClick={handleExport}
              color="#10B981"
              textColor={COLORS.champagne}
              loading={isExporting}
            />
          </SalonIconButtonGroup>
        </div>
      }
    >
      {/* ✅ ENTERPRISE: Premium Mobile Header */}
      <PremiumMobileHeader
        title="Products"
        subtitle={`${products.length} items`}
        showNotifications={false}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => {
              setEditingProduct(null)
              setModalOpen(true)
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="Add new product"
            style={{ boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)' }}
          >
            <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        }
      />

      {/* ✅ MOBILE: Quick actions - Icon Buttons */}
      <div className="md:hidden px-4 pb-4 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-16 -mb-14 scrollbar-hide">
          <SalonIconButtonGroup spacing="md">
            {/* Navigation to Inventory - HIDDEN until inventory system is complete */}
            {false && (
              <>
                <Link href="/salon/inventory">
                  <SalonIconButton
                    icon={Package2}
                    label="View Inventory"
                    onClick={() => {}}
                    color="#3B82F6"
                    textColor={COLORS.champagne}
                    size="md"
                  />
                </Link>
                <SalonIconButtonDivider />
              </>
            )}

            {/* Primary Actions */}
            <SalonIconButton
              icon={Scan}
              label={showScanner ? 'Close Scanner' : 'Scan Barcode'}
              onClick={() => {
                console.log('🔍🔍🔍 SCAN BUTTON CLICKED - Mobile', { currentState: showScanner })
                setShowScanner(!showScanner)
              }}
              color={showScanner ? '#D4AF37' : '#B794F4'}
              textColor={COLORS.champagne}
              size="md"
            />

            <SalonIconButton
              icon={FolderPlus}
              label="New Category"
              onClick={() => {
                setEditingCategory(null)
                setCategoryModalOpen(true)
              }}
              color="#0F6F5C"
              textColor={COLORS.champagne}
              size="md"
            />

            <SalonIconButtonDivider />

            {/* Import/Export */}
            <SalonIconButton
              icon={Upload}
              label="Import Products"
              onClick={() => setImportModalOpen(true)}
              color="#E8B4B8"
              textColor={COLORS.charcoal}
              size="md"
            />

            <SalonIconButton
              icon={Download}
              label="Export Products"
              onClick={handleExport}
              color="#10B981"
              textColor={COLORS.champagne}
              loading={isExporting}
              size="md"
            />
          </SalonIconButtonGroup>
        </div>
      </div>

      {/* Barcode Scanner - Collapsible (Both Mobile & Desktop) */}
      {showScanner && (
        <div className="mx-6 mt-4">
          <div
            className="p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              backgroundColor: COLORS.charcoalLight + 'ee',
              borderColor: COLORS.gold + '40',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5" style={{ color: COLORS.gold }} />
                <h3 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                  Barcode Scanner
                </h3>
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="p-1 rounded-lg hover:bg-gold/10 transition-colors"
                title="Close scanner"
              >
                <X className="w-4 h-4" style={{ color: COLORS.gold }} />
              </button>
            </div>
            <ScanToCart
              organizationId={organizationId}
              onProductFound={handleProductScanned}
              onError={(message) => showError('Scanner error', message)}
            />
          </div>
        </div>
      )}

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

          {/* Highlight Banner - Product Details */}
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
                      Showing highlighted product
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

          {/* ✅ ENTERPRISE: Categories Section with Animations */}
          {productCategories.length > 0 && (
            <div className="mx-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: COLORS.gold }} />
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                    Categories ({productCategories.length})
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {productCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="group relative px-3 py-1.5 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-left-2"
                    style={{
                      backgroundColor: category.color + '15',
                      borderColor: category.color + '40',
                      color: COLORS.champagne,
                      animationDelay: `${index * 50}ms`
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

          {/* ✅ ENTERPRISE: KPI Cards - Product Catalog Overview */}
          <div className="mx-6 mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <SalonLuxeKPICard
              title="Total Products"
              value={products.length}
              icon={Package}
              color={COLORS.bronze}
              description="Across all categories"
              animationDelay={0}
            />
            <SalonLuxeKPICard
              title="Active Products"
              value={activeCount}
              icon={Sparkles}
              color={COLORS.emerald}
              description="Ready for sale"
              animationDelay={100}
              badge={
                products.length > 0
                  ? `${((activeCount / products.length) * 100).toFixed(0)}%`
                  : undefined
              }
            />
            <SalonLuxeKPICard
              title="Profit Margin"
              value={`${profitMargin.toFixed(1)}%`}
              icon={TrendingUp}
              color={COLORS.emerald}
              description="Average across products"
              animationDelay={200}
            />
            <SalonLuxeKPICard
              title="Average Price"
              value={`${currency || 'AED'} ${avgPrice.toFixed(0)}`}
              icon={DollarSign}
              color={COLORS.gold}
              description="Catalog pricing"
              animationDelay={300}
              highlight
            />
          </div>

          {/* Top Control Bar - Search, Tabs, Filters & View Controls */}
          <div className="mx-6 mt-6">
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: COLORS.charcoalLight + 'ee',
                border: `1px solid ${COLORS.bronze}30`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {/* Row 1: Search Bar (Full Width) */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.gold }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by name or code..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      borderColor: COLORS.bronze + '40',
                      color: COLORS.champagne
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" style={{ color: COLORS.bronze }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Filters and View Controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: Status Tabs, Location Filter & Category Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Status Tabs */}
                  <Tabs
                    value={includeArchived ? 'all' : 'active'}
                    onValueChange={v => setIncludeArchived(v === 'all')}
                  >
                    <TabsList style={{ backgroundColor: COLORS.charcoalLight }}>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="all">All Products</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Location Filter */}
                  <Select
                    value={localBranchFilter || '__ALL__'}
                    onValueChange={value => setLocalBranchFilter(value === '__ALL__' ? null : value)}
                  >
                    <SelectTrigger
                      className="w-full sm:w-52 border"
                      style={{
                        backgroundColor: COLORS.charcoal,
                        borderColor: COLORS.bronze + '40',
                        color: COLORS.champagne
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: COLORS.gold }} />
                        <span className="truncate">
                          <SelectValue placeholder="All Locations" />
                        </span>
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
                      {isLoadingBranches ? (
                        <div
                          className="px-2 py-3 text-center text-sm"
                          style={{ color: COLORS.bronze }}
                        >
                          Loading...
                        </div>
                      ) : availableBranches.length === 0 ? (
                        <div
                          className="px-2 py-3 text-center text-sm"
                          style={{ color: COLORS.bronze }}
                        >
                          No branches
                        </div>
                      ) : (
                        availableBranches.map(branch => (
                          <SelectItem
                            key={branch.id}
                            value={branch.id}
                            className="salon-luxe-select-item"
                            style={{ color: COLORS.champagne }}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" style={{ color: COLORS.gold }} />
                              <div className="flex flex-col">
                                <span className="font-medium">{branch.entity_name}</span>
                                {branch.entity_code && (
                                  <span className="text-xs opacity-60">{branch.entity_code}</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {/* Category Filter */}
                  <Select
                    value={categoryFilter || '__ALL__'}
                    onValueChange={value => setCategoryFilter(value === '__ALL__' ? '' : value)}
                  >
                    <SelectTrigger
                      className="w-full sm:w-48 border"
                      style={{
                        backgroundColor: COLORS.charcoal,
                        borderColor: COLORS.bronze + '40',
                        color: COLORS.champagne
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Tag className="h-4 w-4 flex-shrink-0" style={{ color: COLORS.gold }} />
                        <span className="truncate">
                          <SelectValue placeholder="All Categories" />
                        </span>
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
                        All Categories
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

                {/* Right: Sort & View Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger
                      className="w-full sm:w-44 border"
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
                      <SelectItem value="price_low" className="salon-luxe-select-item">
                        Price (Low to High)
                      </SelectItem>
                      <SelectItem value="price_high" className="salon-luxe-select-item">
                        Price (High to Low)
                      </SelectItem>
                      <SelectItem value="updated_desc" className="salon-luxe-select-item">
                        Updated (Newest)
                      </SelectItem>
                      <SelectItem value="updated_asc" className="salon-luxe-select-item">
                        Updated (Oldest)
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Grid/List Toggle */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                      style={{ color: viewMode === 'grid' ? COLORS.gold : COLORS.lightText }}
                      title="Grid view"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold/20' : 'hover:bg-white/10'}`}
                      style={{ color: viewMode === 'list' ? COLORS.gold : COLORS.lightText }}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Info Bar */}
          {(includeArchived && archivedCount > 0) && (
            <div className="mx-6 mt-4 flex items-center gap-3">
              {/* Archived Products Info Badge */}
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
                  : 'Create your first product to build your catalog'}
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
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl animate-pulse"
                  style={{ backgroundColor: COLORS.charcoalLight }}
                />
              ))}
            </div>
          }>
            <ProductList
              products={paginatedProducts}
              organizationId={organizationId}
              loading={isLoading}
              viewMode={viewMode}
              selectedBranchId={selectedBranchId} // ✅ Pass from context to prevent infinite loop
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />

            {/* 📄 PAGINATION CONTROLS: Enterprise-grade pagination */}
            {filteredProducts.length > 0 && (
              <div className="mt-6">
                <SalonPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  pageSize={pageSize}
                  pageSizeOptions={[25, 50, 100]}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize)
                    setCurrentPage(1) // Reset to first page when changing page size
                  }}
                  itemsName="products"
                />
              </div>
            )}
          </Suspense>
        )}
      </div>

      {/* ✅ SUSPENSE: Wrap lazy-loaded modals */}
      <Suspense fallback={null}>
        <ProductModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditingProduct(null)
          }}
          product={editingProduct}
          onSave={handleSave}
        />
      </Suspense>

      <Suspense fallback={null}>
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
      </Suspense>

      <Suspense fallback={null}>
        <ProductCategoryModal
          open={categoryModalOpen}
          onClose={() => {
            setCategoryModalOpen(false)
            setEditingCategory(null)
          }}
          category={editingCategory}
          onSave={handleSaveCategory}
        />
      </Suspense>

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

      {/* ✅ ENTERPRISE IMPORT MODAL: Replaces manual import implementation */}
      <HeraImportModal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false)
          resetImport()
        }}
        entityName={productImportExportConfig.entityName}
        entityNamePlural={productImportExportConfig.entityNamePlural}
        isImporting={isImporting}
        importProgress={importProgress}
        importResults={importResults}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
      />

      {/* ✅ MOBILE: Bottom spacing for mobile scrolling */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}

function SalonProductsContent() {
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

export default function SalonProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SalonProductsContent />
    </Suspense>
  )
}
