'use client'

/**
 * HERA Enterprise Inventory Management Page
 *
 * ✅ Uses useUniversalEntity (NO direct Supabase)
 * ✅ Enterprise-grade UI with glassmorphic design
 * ✅ Multi-branch inventory tracking
 * ✅ Stock movements with audit trail
 * ✅ Low stock alerts
 * ✅ Inventory valuation
 */

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonPagination } from '@/components/salon/ui/Pagination'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useStockLevels } from '@/hooks/useStockLevels'
import { useHeraStockMovements } from '@/hooks/useHeraInventory'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { BranchStockManager } from '@/components/salon/products/BranchStockManager'
import { getProductInventory, setBranchStock, adjustStock } from '@/lib/services/inventory-service'
import type { ProductInventory } from '@/types/inventory'
import {
  Package2,
  TruckIcon,
  BarChart,
  Plus,
  Upload,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Archive,
  RefreshCw,
  Download,
  Edit,
  ExternalLink,
  ArrowLeft,
  Package
} from 'lucide-react'
import {
  SalonIconButton,
  SalonIconButtonGroup,
  SalonIconButtonDivider
} from '@/components/salon/shared/SalonIconButton'
import { cn } from '@/lib/utils'

const COLORS = {
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  plum: '#B794F4'
}

// Phase 2 Inventory Item type
interface InventoryItem {
  id: string
  entity_name: string
  entity_code?: string
  smart_code?: string
  status: string
  stock_quantity: number
  reorder_level: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  stock_value: number
  price_cost: number
  price_market: number
  created_at: string
  updated_at: string
  relationships?: any
  product_id?: string
  product_name?: string
  location_id?: string
  location_name?: string
  sku?: string
  category?: string
}

function SalonInventoryContent() {
  const { organizationId } = useSecuredSalonContext()
  const { user } = useHERAAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const deepProductId = searchParams.get('productId')
  const deepBranchId = searchParams.get('branchId')
  const contextLoading = !organizationId

  const [activeTab, setActiveTab] = useState('items')
  const [searchQuery, setSearchQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [currentInventory, setCurrentInventory] = useState<ProductInventory | null>(null)
  const [loadingInventory, setLoadingInventory] = useState(false)

  // 🚀 PAGINATION STATE: Enterprise-grade pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50) // 50 inventory items per page

  // Branch filter
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches,
    setSelectedBranchId
  } = useBranchFilter(undefined, 'salon-inventory', organizationId)

  // Apply deep link branch filter
  useEffect(() => {
    if (deepBranchId && deepBranchId !== branchId) {
      console.log('[Inventory] Setting branch from deep link:', deepBranchId)
      setSelectedBranchId(deepBranchId)
    }
  }, [deepBranchId, branchId, setSelectedBranchId])

  // Debug branch filter state
  useEffect(() => {
    console.log('[Inventory] Branch filter state:', {
      branchId,
      branches: branches.map(b => ({ id: b.id, name: b.entity_name || b.name })),
      hasMultipleBranches
    })
  }, [branchId, branches, hasMultipleBranches])

  // ✅ PHASE 2: Stock Level Entities (Direct)
  const {
    stockLevels,
    isLoading: itemsLoading,
    error: itemsError,
    refetch,
    createStockLevel,
    adjustStock: adjustStockLevel,
    incrementStock,
    decrementStock,
    isAdjusting
  } = useStockLevels({
    organizationId,
    locationId: branchId && branchId !== 'all' ? branchId : undefined
  })

  // Map stock levels to inventory items format
  const items = useMemo(() => {
    console.log('[Inventory Page] 📊 Stock Levels Data:', {
      total: (stockLevels || []).length,
      sampleStockLevel: stockLevels?.[0],
      allEntityTypes: [...new Set((stockLevels || []).map((sl: any) => sl.entity_type))],
      sampleDynamicFields: stockLevels?.[0] ? {
        quantity: stockLevels[0].quantity,
        reorder_level: stockLevels[0].reorder_level,
        cost_price: stockLevels[0].cost_price,
        selling_price: stockLevels[0].selling_price
      } : undefined,
      // 🔍 DETAILED RELATIONSHIP INSPECTION
      firstThreeStockLevels: (stockLevels || []).slice(0, 3).map((sl: any) => {
        const rels = sl.relationships || {}
        return {
          id: sl.id,
          entity_name: sl.entity_name,
          relationships_FULL: rels,  // Full relationships object
          relationships_keys: Object.keys(rels),
          // Check all possible key variations
          STOCK_OF_PRODUCT: rels.STOCK_OF_PRODUCT,
          stock_of_product: rels.stock_of_product,
          STOCK_AT_LOCATION: rels.STOCK_AT_LOCATION,
          stock_at_location: rels.stock_at_location,
          // Check for the actual keys
          all_rel_entries: Object.entries(rels).map(([key, value]) => ({
            key,
            isArray: Array.isArray(value),
            length: Array.isArray(value) ? value.length : 0,
            sample: Array.isArray(value) && value.length > 0 ? value[0] : value
          }))
        }
      })
    })

    const mapped = (stockLevels || []).map((sl: any, index: any) => {
      // 🔍 Debug first 3 stock levels in detail
      if (index < 3) {
        const rels = sl.relationships || {}
        const relKeys = Object.keys(rels)

        console.log(`[Inventory Page] 🔬 Stock Level #${index} Detailed Inspection:`, {
          id: sl.id,
          entity_name: sl.entity_name,
          relationships_keys: relKeys,
          // Log each relationship key and its value
          ...Object.fromEntries(
            relKeys.map(key => [
              key,
              {
                isArray: Array.isArray(rels[key]),
                length: Array.isArray(rels[key]) ? rels[key].length : 'not-array',
                firstItem: Array.isArray(rels[key]) && rels[key].length > 0 ? rels[key][0] : null
              }
            ])
          )
        })
      }

      // ✅ UPPERCASE-ONLY: Use uppercase relationship keys for consistency
      const productRels = sl.relationships?.STOCK_OF_PRODUCT || []
      const productRel = Array.isArray(productRels) && productRels.length > 0 ? productRels[0] : null

      const locationRels = sl.relationships?.STOCK_AT_LOCATION || []
      const locationRel = Array.isArray(locationRels) && locationRels.length > 0 ? locationRels[0] : null

      // Extract product and location info
      let productName = 'Unknown Product'
      let productId: string | undefined = undefined
      let locationName = 'Unknown Location'
      let locationId: string | undefined = undefined

      // Try to get from relationships first
      if (productRel) {
        productName = productRel.to_entity?.entity_name || productRel.entity_name || productName
        productId = productRel.to_entity?.id || productRel.to_entity_id || productRel.target_entity_id
      }

      if (locationRel) {
        locationName = locationRel.to_entity?.entity_name || locationRel.entity_name || locationName
        locationId = locationRel.to_entity?.id || locationRel.to_entity_id || locationRel.target_entity_id
      }

      // 🔧 FALLBACK: Parse entity_name if relationships are empty
      // Format: "Stock: PRODUCT_NAME @ LOCATION_NAME"
      if (!productId || !locationId) {
        const match = sl.entity_name?.match(/^Stock: (.+?) @ (.+?)$/)
        if (match) {
          if (!productId) {
            productName = match[1]
            // Try to find product ID by name (not ideal but better than undefined)
            // For now, we'll leave it undefined and show the name
          }
          if (!locationId) {
            locationName = match[2]
            // Try to match with loaded branches
            const matchingBranch = branches.find(b =>
              b.name === match[2] || b.entity_name === match[2]
            )
            if (matchingBranch) {
              locationId = matchingBranch.id
            }
          }
        }
      }

      if (index < 3) {
        console.log(`[Inventory Page] 🔬 Stock Level #${index} Final Extraction:`, {
          productName,
          productId: productId || 'PARSED_FROM_NAME',
          locationName,
          locationId: locationId || 'PARSED_FROM_NAME',
          usedFallback: !productRel || !locationRel
        })
      }

      return {
        id: sl.id,
        entity_name: `${productName} @ ${locationName}`,
        entity_code: sl.entity_code,
        smart_code: sl.smart_code,
        status: sl.status || 'active',
        stock_quantity: sl.quantity || 0,
        reorder_level: sl.reorder_level || 10,
        stock_status: (sl.quantity || 0) === 0 ? 'out_of_stock' : (sl.quantity || 0) <= (sl.reorder_level || 10) ? 'low_stock' : 'in_stock',
        stock_value: (sl.quantity || 0) * (sl.cost_price || 0),
        price_cost: sl.cost_price || 0,
        price_market: sl.selling_price || 0,
        created_at: sl.created_at,
        updated_at: sl.updated_at,
        relationships: sl.relationships,
        product_id: productId,
        product_name: productName,
        location_id: locationId,
        location_name: locationName
      }
    })

    // Deduplicate by product_name + location_name combination (more reliable than IDs)
    const deduped = mapped.reduce((acc, item) => {
      // Use entity_name as the key since it contains "Product @ Location"
      const key = item.entity_name
      if (!acc.has(key)) {
        acc.set(key, item)
      } else {
        // Keep the one with the highest quantity (most recent/accurate)
        const existing = acc.get(key)!
        if (item.stock_quantity > existing.stock_quantity) {
          console.log('[Inventory Page] ⚠️ Duplicate found, keeping higher quantity:', {
            key,
            existingQty: existing.stock_quantity,
            newQty: item.stock_quantity
          })
          acc.set(key, item)
        }
      }
      return acc
    }, new Map())

    const dedupedArray = Array.from(deduped.values())

    console.log('[Inventory Page] 📦 Mapped Items:', {
      count: mapped.length,
      dedupedCount: dedupedArray.length,
      sampleItem: dedupedArray[0],
      uniqueProducts: [...new Set(dedupedArray.map(m => m.product_name))].length,
      uniqueLocations: [...new Set(dedupedArray.map(m => m.location_name))].length,
      duplicatesRemoved: mapped.length - dedupedArray.length,
      productNames: [...new Set(dedupedArray.map(m => m.product_name))],
      locationNames: [...new Set(dedupedArray.map(m => m.location_name))]
    })

    return dedupedArray
  }, [stockLevels])

  // Calculate metrics
  const lowStockCount = useMemo(() => {
    return items.filter(i => i.stock_status === 'low_stock' || i.stock_status === 'out_of_stock').length
  }, [items])

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.stock_value || 0), 0)
  }, [items])

  const phase = 'phase2' as const

  // Stock movements hook
  const {
    movements,
    isLoading: movementsLoading,
    createMovement
  } = useHeraStockMovements({
    organizationId,
    branchId: branchId && branchId !== 'all' ? branchId : undefined, // ✅ FIX: Pass undefined for 'all'
    filters: {
      include_dynamic: true
    }
  })

  // Filter items when productId is present (deep link)
  const displayItems = useMemo(() => {
    let filtered = items

    console.log('[Inventory Page] 🔍 Display Items Before Filter:', {
      itemsCount: items.length,
      deepProductId,
      hasDeepProduct: !!deepProductId
    })

    // Filter by deep link product ID
    if (deepProductId) {
      filtered = filtered.filter(item => item.id === deepProductId)
      console.log('[Inventory Page] 🔍 Display Items After Deep Product Filter:', filtered.length)
    }

    console.log('[Inventory Page] 🔍 Final Display Items:', {
      count: filtered.length,
      sample: filtered[0]
    })

    return filtered
  }, [items, deepProductId])

  // 🔄 RESET PAGE: Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, deepProductId])

  // 📄 PAGINATION CALCULATIONS: Slice data for current page
  const totalPages = Math.ceil(displayItems.length / pageSize)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return displayItems.slice(startIndex, endIndex)
  }, [displayItems, currentPage, pageSize])

  // Calculate summary metrics
  const activeItems = useMemo(
    () => displayItems.filter(item => item.status === 'active').length,
    [displayItems]
  )

  const outOfStockCount = useMemo(
    () => displayItems.filter(item => item.stock_status === 'out_of_stock').length,
    [displayItems]
  )

  // Handle opening stock management modal - memoized for performance
  const handleManageStock = useCallback(
    async (item: InventoryItem) => {
      if (!organizationId) return

      setSelectedItem(item)
      setStockModalOpen(true)

      console.log('Item relationships:', (item as any).relationships)
      console.log('Available branches:', branches)

      // Build inventory from current item data
      const stockAtRels =
        (item as any).relationships?.stock_at || (item as any).relationships?.STOCK_AT || []
      console.log('Stock at relationships:', stockAtRels)

      // If no stock relationships, create entries for all available branches
      let branchStocks = []

      if (Array.isArray(stockAtRels) && stockAtRels.length > 0) {
        branchStocks = stockAtRels.map((rel: any) => ({
          branch_id: rel.to_entity?.id || '',
          branch_name: rel.to_entity?.entity_name || 'Unknown Branch',
          quantity: item.stock_quantity || 0,
          reorder_level: item.reorder_level || 10,
          status: item.stock_status || 'in_stock',
          value: (item.stock_quantity || 0) * (item.price_cost || 0)
        }))
      } else {
        // No stock relationships - create entries for all branches
        branchStocks = branches.map(branch => ({
          branch_id: branch.id,
          branch_name: branch.name,
          quantity: 0,
          reorder_level: 10,
          status: 'out_of_stock' as const,
          value: 0
        }))
      }

      console.log('Branch stocks:', branchStocks)

      const inventory: ProductInventory = {
        product_id: item.id,
        product_name: item.entity_name,
        product_code: item.entity_code,
        total_quantity: item.stock_quantity || 0,
        total_value: item.stock_value || 0,
        cost_price: item.price_cost || 0,
        selling_price: item.price_market || 0,
        branch_stocks: branchStocks,
        requires_inventory: true,
        track_by: 'unit'
      }

      console.log('Final inventory:', inventory)
      setCurrentInventory(inventory)
    },
    [organizationId, branches]
  )

  // Handle stock update - memoized for performance
  const handleStockUpdate = useCallback(
    async (branchId: string, quantity: number, reorderLevel: number) => {
      if (!organizationId || !selectedItem) return

      try {
        // Check if Phase 2 - use STOCK_LEVEL entity update
        if (phase === 'phase2' && adjustStockLevel) {
          // Find the stock level ID for this product and branch
          const stockLevelId = selectedItem.id // In Phase 2, the item IS the stock level

          console.log('[Phase 2] Updating stock level:', {
            stockLevelId,
            branchId,
            quantity,
            reorderLevel
          })

          // Update the stock level entity directly
          await adjustStockLevel({
            stock_level_id: stockLevelId,
            product_id: selectedItem.product_id || selectedItem.id,
            location_id: branchId,
            movement: {
              movement_type: 'adjust_in', // Will be calculated based on difference
              quantity,
              reason: 'Manual stock update'
            },
            current_quantity: selectedItem.stock_quantity || 0
          })
        } else {
          // Phase 1 - use legacy setBranchStock
          await setBranchStock(organizationId, selectedItem.id, branchId, {
            branch_id: branchId,
            quantity,
            reorder_level: reorderLevel
          })
        }

        // Refetch items to get updated stock
        await refetch()

        // Update current inventory display
        if (currentInventory) {
          const updatedBranchStocks = currentInventory.branch_stocks.map(bs =>
            bs.branch_id === branchId ? { ...bs, quantity, reorder_level: reorderLevel } : bs
          )
          setCurrentInventory({
            ...currentInventory,
            branch_stocks: updatedBranchStocks,
            total_quantity: updatedBranchStocks.reduce((sum, bs) => sum + bs.quantity, 0),
            total_value: updatedBranchStocks.reduce((sum, bs) => sum + bs.value, 0)
          })
        }
      } catch (error) {
        console.error('Failed to update stock:', error)
      }
    },
    [organizationId, selectedItem, refetch, currentInventory, phase, adjustStockLevel]
  )

  // Handle quick stock adjustment - memoized for performance
  const handleQuickAdjust = useCallback(
    async (branchId: string, type: 'increase' | 'decrease', amount: number) => {
      if (!organizationId || !selectedItem || !user?.id) return

      const currentQty =
        currentInventory?.branch_stocks.find(bs => bs.branch_id === branchId)?.quantity || 0
      const newQty = type === 'increase' ? currentQty + amount : currentQty - amount

      try {
        // Check if Phase 2 - use STOCK_LEVEL entity adjustment
        if (phase === 'phase2' && adjustStockLevel) {
          const stockLevelId = selectedItem.id

          await adjustStockLevel({
            stock_level_id: stockLevelId,
            product_id: selectedItem.product_id || selectedItem.id,
            location_id: branchId,
            movement: {
              movement_type: type === 'increase' ? 'adjust_in' : 'adjust_out',
              quantity: amount,
              reason: 'Quick adjustment'
            },
            current_quantity: currentQty
          })
        } else {
          // Phase 1 - use legacy adjustStock
          await adjustStock(organizationId, user.id, {
            product_id: selectedItem.id,
            branch_id: branchId,
            adjustment_type: 'set',
            quantity: Math.max(0, newQty),
            reason: 'Quick adjustment'
          })
        }

        // Refetch items to get updated stock
        await refetch()

        // Update current inventory display
        if (currentInventory) {
          const updatedBranchStocks = currentInventory.branch_stocks.map(bs =>
            bs.branch_id === branchId
              ? {
                  ...bs,
                  quantity: Math.max(0, newQty),
                  value: Math.max(0, newQty) * (currentInventory.cost_price || 0)
                }
              : bs
          )
          setCurrentInventory({
            ...currentInventory,
            branch_stocks: updatedBranchStocks,
            total_quantity: updatedBranchStocks.reduce((sum, bs) => sum + bs.quantity, 0),
            total_value: updatedBranchStocks.reduce((sum, bs) => sum + bs.value, 0)
          })
        }
      } catch (error) {
        console.error('Failed to adjust stock:', error)
      }
    },
    [organizationId, selectedItem, user?.id, currentInventory, refetch, phase, adjustStockLevel]
  )

  // Authentication checks
  if (!organizationId) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: COLORS.charcoalDark }}
      >
        <div
          className="text-center p-8 rounded-xl"
          style={{ backgroundColor: COLORS.charcoalLight }}
        >
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.gold }}>
            No organization context found
          </h2>
          <p style={{ color: COLORS.lightText + '80' }}>
            Please select an organization to continue
          </p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: COLORS.charcoalDark }}
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.gold }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.charcoalDark }}>
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 80%, ${COLORS.gold}08 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, ${COLORS.bronze}05 0%, transparent 50%)`
        }}
      />

      {/* Content */}
      <div className="container mx-auto px-6 py-8 relative">
        {/* Header */}
        <div
          className="mb-8 p-6 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${COLORS.gold}40`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <span style={{ color: COLORS.bronze }}>HERA</span>
            <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
            <span style={{ color: COLORS.bronze }}>SALON OS</span>
            <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
            <span style={{ color: COLORS.gold }}>Inventory</span>
          </div>

          {/* Title and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.gold }}>
                Inventory Management
              </h1>
              <p className="text-sm" style={{ color: COLORS.lightText + '80' }}>
                Enterprise-grade multi-branch inventory tracking
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Branch Selector */}
              {hasMultipleBranches && (
                <Select value={branchId || 'all'} onValueChange={setBranchId}>
                  <SelectTrigger
                    className="w-48"
                    style={{
                      backgroundColor: COLORS.charcoalDark,
                      borderColor: COLORS.gold + '40',
                      color: COLORS.lightText
                    }}
                  >
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.entity_name || branch.name || branch.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: COLORS.gold }}
                />
                <Input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  style={{
                    backgroundColor: COLORS.charcoalDark,
                    borderColor: COLORS.gold + '40',
                    color: COLORS.lightText
                  }}
                />
              </div>

              {/* Icon Button Actions */}
              <SalonIconButtonGroup spacing="md">
                {/* Navigation to Products */}
                <Link href="/salon/products">
                  <SalonIconButton
                    icon={Package}
                    label="View Products"
                    onClick={() => {}}
                    color="#3B82F6"
                    textColor={COLORS.champagne}
                  />
                </Link>

                <SalonIconButtonDivider />

                {/* Actions */}
                <SalonIconButton
                  icon={Upload}
                  label="Stock Movement"
                  onClick={() => {}}
                  color="#B794F4"
                  textColor={COLORS.champagne}
                />

                <SalonIconButton
                  icon={Plus}
                  label="New Item"
                  onClick={() => {}}
                  color="#D4AF37"
                  textColor={COLORS.charcoalDark}
                />
              </SalonIconButtonGroup>
            </div>
          </div>
        </div>


        {/* Focused Product Banner */}
        {deepProductId && (
          <div className="mb-6">
            <div
              className="p-4 rounded-xl border"
              style={{
                borderColor: COLORS.gold + '40',
                backgroundColor: COLORS.gold + '10',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package2 className="w-5 h-5" style={{ color: COLORS.gold }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: COLORS.gold }}>
                      Focused on Product
                    </p>
                    <code className="text-xs font-mono" style={{ color: COLORS.lightText + '80' }}>
                      {displayItems.find(i => i.id === deepProductId)?.entity_name || deepProductId}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/salon/products?productId=${deepProductId}`}
                    className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{
                      color: COLORS.gold,
                      backgroundColor: COLORS.charcoalDark,
                      border: `1px solid ${COLORS.gold}40`
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Edit Product
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.delete('productId')
                      url.searchParams.delete('branchId')
                      window.history.pushState({}, '', url.toString())
                      window.location.reload()
                    }}
                    style={{ color: COLORS.lightText }}
                    className="hover:opacity-70"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${COLORS.gold}40`
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Package2 className="w-5 h-5" style={{ color: COLORS.gold }} />
              <span className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                Total Items
              </span>
            </div>
            <div className="text-3xl font-bold" style={{ color: COLORS.gold }}>
              {activeItems}
            </div>
            <div className="text-xs mt-1" style={{ color: COLORS.lightText + '60' }}>
              Active inventory items
            </div>
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${COLORS.emerald}40`
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5" style={{ color: COLORS.emerald }} />
              <span className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                Total Value
              </span>
            </div>
            <div className="text-3xl font-bold" style={{ color: COLORS.emerald }}>
              AED {totalValue.toFixed(2)}
            </div>
            <div className="text-xs mt-1" style={{ color: COLORS.lightText + '60' }}>
              Current inventory value
            </div>
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${COLORS.rose}40`
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.rose }} />
              <span className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                Low Stock
              </span>
            </div>
            <div className="text-3xl font-bold" style={{ color: COLORS.rose }}>
              {lowStockCount}
            </div>
            <div className="text-xs mt-1" style={{ color: COLORS.lightText + '60' }}>
              Items need restocking
            </div>
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid #EF444440`
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#EF4444' }} />
              <span className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                Out of Stock
              </span>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#EF4444' }}>
              {outOfStockCount}
            </div>
            <div className="text-xs mt-1" style={{ color: COLORS.lightText + '60' }}>
              Items unavailable
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="mb-6"
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderBottom: `1px solid ${COLORS.gold}20`
            }}
          >
            <TabsTrigger
              value="items"
              className="relative"
              style={{
                color: activeTab === 'items' ? COLORS.gold : COLORS.lightText
              }}
            >
              <Package2 className="w-4 h-4 mr-2" />
              Items
              <Badge className="ml-2" style={{ backgroundColor: COLORS.charcoalDark }}>
                {activeItems}
              </Badge>
              {lowStockCount > 0 && (
                <Badge className="ml-1" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>
                  {lowStockCount}
                </Badge>
              )}
              {activeTab === 'items' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: COLORS.gold }}
                />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="movements"
              className="relative"
              style={{
                color: activeTab === 'movements' ? COLORS.gold : COLORS.lightText
              }}
            >
              <TruckIcon className="w-4 h-4 mr-2" />
              Movements
              <Badge className="ml-2" style={{ backgroundColor: COLORS.charcoalDark }}>
                {movements.length}
              </Badge>
              {activeTab === 'movements' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: COLORS.gold }}
                />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="valuation"
              className="relative"
              style={{
                color: activeTab === 'valuation' ? COLORS.gold : COLORS.lightText
              }}
            >
              <BarChart className="w-4 h-4 mr-2" />
              Valuation
              {activeTab === 'valuation' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: COLORS.gold }}
                />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items">
            <div
              className="rounded-xl p-6"
              style={{
                background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              {/* Filters */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant={includeArchived ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIncludeArchived(!includeArchived)}
                    style={{
                      borderColor: COLORS.gold + '40',
                      backgroundColor: includeArchived ? COLORS.gold : 'transparent',
                      color: includeArchived ? COLORS.charcoalDark : COLORS.lightText
                    }}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    {includeArchived ? 'Hide Archived' : 'Show Archived'}
                  </Button>

                  {lowStockCount > 0 && (
                    <Badge
                      className="cursor-pointer"
                      style={{
                        backgroundColor: '#EF444420',
                        color: '#EF4444',
                        borderColor: '#EF444450'
                      }}
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      {lowStockCount} Low Stock
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  style={{ borderColor: COLORS.gold + '40', color: COLORS.lightText }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Items List */}
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin" style={{ color: COLORS.gold }} />
                </div>
              ) : displayItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package2
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: COLORS.gold + '40' }}
                  />
                  <p style={{ color: COLORS.lightText }}>
                    {deepProductId ? 'Product not found in inventory' : 'No inventory items found'}
                  </p>
                  <p className="text-sm mt-2" style={{ color: COLORS.lightText + '60' }}>
                    {deepProductId
                      ? 'This product may not have inventory tracking enabled'
                      : 'Add your first item to get started'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedItems.map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-lg hover:bg-opacity-70 transition-all"
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          border: `1px solid ${
                            item.stock_status === 'out_of_stock'
                              ? '#EF4444'
                              : item.stock_status === 'low_stock'
                                ? '#F59E0B'
                                : COLORS.gold
                          }30`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium" style={{ color: COLORS.lightText }}>
                                {item.entity_name}
                              </h3>
                              {item.sku && (
                                <Badge
                                  variant="outline"
                                  style={{ borderColor: COLORS.bronze + '40' }}
                                >
                                  {item.sku}
                                </Badge>
                              )}
                              <Badge
                                style={{
                                  backgroundColor:
                                    item.stock_status === 'out_of_stock'
                                      ? '#EF444420'
                                      : item.stock_status === 'low_stock'
                                        ? '#F59E0B20'
                                        : '#10B98120',
                                  color:
                                    item.stock_status === 'out_of_stock'
                                      ? '#EF4444'
                                      : item.stock_status === 'low_stock'
                                        ? '#F59E0B'
                                        : '#10B981'
                                }}
                              >
                                {item.stock_status === 'out_of_stock'
                                  ? 'Out of Stock'
                                  : item.stock_status === 'low_stock'
                                    ? 'Low Stock'
                                    : 'In Stock'}
                              </Badge>
                            </div>
                            <div
                              className="flex items-center gap-6 mt-2 text-sm"
                              style={{ color: COLORS.lightText + '80' }}
                            >
                              <span>
                                Qty: <strong>{item.stock_quantity || 0}</strong>
                              </span>
                              <span>
                                Cost: <strong>AED {(item.price_cost || 0).toFixed(2)}</strong>
                              </span>
                              <span>
                                Value: <strong>AED {(item.stock_value || 0).toFixed(2)}</strong>
                              </span>
                              {item.category && (
                                <span>
                                  Category: <strong>{item.category}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleManageStock(item)}
                            style={{
                              backgroundColor: COLORS.gold,
                              color: COLORS.charcoalDark
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Manage Stock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 📄 PAGINATION CONTROLS: Enterprise-grade pagination */}
                  {displayItems.length > 0 && (
                    <div className="mt-6">
                      <SalonPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={displayItems.length}
                        pageSize={pageSize}
                        pageSizeOptions={[25, 50, 100]}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(newSize) => {
                          setPageSize(newSize)
                          setCurrentPage(1)
                        }}
                        itemsName="items"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements">
            <div
              className="rounded-xl p-6"
              style={{
                background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              {movementsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin" style={{ color: COLORS.gold }} />
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12">
                  <TruckIcon
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: COLORS.gold + '40' }}
                  />
                  <p style={{ color: COLORS.lightText }}>No stock movements recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {movements.map(movement => (
                    <div
                      key={movement.id}
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: COLORS.charcoalDark,
                        border: `1px solid ${COLORS.gold}30`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium" style={{ color: COLORS.lightText }}>
                            {movement.entity_name}
                          </h3>
                          <p className="text-sm mt-1" style={{ color: COLORS.lightText + '80' }}>
                            Type: {movement.movement_type} • Qty: {movement.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm" style={{ color: COLORS.lightText }}>
                            AED {(movement.quantity * movement.unit_cost).toFixed(2)}
                          </div>
                          <div className="text-xs mt-1" style={{ color: COLORS.lightText + '60' }}>
                            {new Date(movement.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Valuation Tab */}
          <TabsContent value="valuation">
            <div
              className="rounded-xl p-6"
              style={{
                background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              <div className="text-center py-12">
                <BarChart className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.gold }} />
                <h3 className="text-xl font-medium mb-2" style={{ color: COLORS.gold }}>
                  Inventory Valuation: AED {totalValue.toFixed(2)}
                </h3>
                <p style={{ color: COLORS.lightText + '80' }}>
                  Total value across {activeItems} active items
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Stock Management Modal */}
        <SalonLuxeModal
          open={stockModalOpen}
          onClose={() => setStockModalOpen(false)}
          title={`Manage Stock - ${selectedItem?.entity_name || ''}`}
          description="Update stock levels and reorder points for each branch"
          icon={<Package2 className="w-6 h-6" />}
          size="xl"
        >
          {loadingInventory ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: COLORS.gold }} />
            </div>
          ) : currentInventory && selectedItem ? (
            <BranchStockManager
              productId={selectedItem.id}
              inventory={currentInventory}
              onStockUpdate={handleStockUpdate}
              onQuickAdjust={handleQuickAdjust}
            />
          ) : (
            <div className="text-center py-12">
              <Package2
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: COLORS.gold + '40' }}
              />
              <p style={{ color: COLORS.lightText }}>No inventory data available</p>
            </div>
          )}
        </SalonLuxeModal>
      </div>
    </div>
  )
}

export default function SalonInventoryPage() {
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
      <SalonInventoryContent />
    </Suspense>
  )
}
