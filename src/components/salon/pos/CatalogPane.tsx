'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  Scissors,
  Package,
  Tag,
  Star,
  Building2,
  MapPin,
  X,
  Loader2,
  User
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useSalonPOS, type PosItem } from '@/hooks/useSalonPOS'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { ScanToCart } from '@/components/salon/pos/ScanToCart'
import { cn } from '@/lib/utils'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C'
}

interface CatalogPaneProps {
  organizationId: string
  onAddItem: (item: PosItem, staffId?: string, staffName?: string) => void
  currentCustomerId?: string
  currentAppointmentId?: string
  defaultStylistId?: string
  defaultStylistName?: string
  onBranchChange?: (branchId: string) => void // Callback to sync branch with parent context
  contextBranchId?: string // Current branch from context to prevent infinite loops
}

export function CatalogPane({
  organizationId,
  onAddItem,
  currentCustomerId,
  currentAppointmentId,
  defaultStylistId,
  defaultStylistName,
  onBranchChange,
  contextBranchId
}: CatalogPaneProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services')

  // Memoize options to prevent infinite re-renders
  const posOptions = useMemo(() => ({
    search: searchQuery,
    organizationId
  }), [searchQuery, organizationId])

  // Use composition hook for POS data
  const { items, staff, branchId, branches, isLoading, setBranchId } = useSalonPOS(posOptions)

  // ✅ FIXED: Initialize branch from context ONCE on mount or when context changes
  // Use useRef to track if we're internally changing the branch to prevent ping-pong
  const isInternalChange = useRef(false)
  const prevContextBranchId = useRef(contextBranchId)

  useEffect(() => {
    // Only update if contextBranchId actually changed (not from our own onBranchChange call)
    if (contextBranchId && contextBranchId !== prevContextBranchId.current && branches.length > 0) {
      const branchExists = branches.some(b => b.id === contextBranchId)
      if (branchExists && contextBranchId !== branchId) {
        console.log('[CatalogPane] 🏢 Setting branch from context (appointment):', contextBranchId)
        isInternalChange.current = true
        setBranchId(contextBranchId)
        prevContextBranchId.current = contextBranchId
      }
    }
  }, [contextBranchId, branchId, branches, setBranchId])

  // ✅ FIXED: Only sync to parent if user manually changed the branch (not from context)
  useEffect(() => {
    // Skip if this was an internal change from context
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }

    // Only notify parent if branch actually changed and it's different from context
    if (branchId && onBranchChange && branchId !== contextBranchId) {
      console.log('[CatalogPane] ✅ Branch changed by user, syncing to context:', branchId)
      onBranchChange(branchId)
    }
  }, [branchId, contextBranchId, onBranchChange])

  // Filter items by tab and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Tab filter
      const matchesTab =
        activeTab === 'services' ? item.__kind === 'SERVICE' : item.__kind === 'PRODUCT'

      // Category filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

      return matchesTab && matchesCategory
    })
  }, [items, activeTab, selectedCategory])

  // Get unique categories for the current tab
  const categories = useMemo(() => {
    const tabItems = items.filter(item =>
      activeTab === 'services' ? item.__kind === 'SERVICE' : item.__kind === 'PRODUCT'
    )
    const cats = Array.from(new Set(tabItems.map(item => item.category || 'General')))
    return ['all', ...cats.sort()]
  }, [items, activeTab])

  // Count items by type
  const { servicesCount, productsCount } = useMemo(() => {
    return {
      servicesCount: items.filter(i => i.__kind === 'SERVICE').length,
      productsCount: items.filter(i => i.__kind === 'PRODUCT').length
    }
  }, [items])

  const handleAddItem = (item: PosItem) => {
    // Pass item to parent - parent will handle BillSetupModal if needed
    // Parent will show BillSetupModal for first item or when branch/customer/stylist is missing
    onAddItem(item, defaultStylistId, defaultStylistName)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (isLoading) {
    return (
      <div
        className="h-full flex items-center justify-center animate-fadeIn"
        style={{ backgroundColor: COLORS.charcoal }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}40 0%, ${COLORS.goldDark}40 100%)`,
              boxShadow: `0 8px 32px ${COLORS.gold}20`
            }}
          >
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.gold }} />
          </div>
          <p className="mt-4" style={{ color: COLORS.bronze }}>
            Loading catalog...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: COLORS.charcoal,
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Enterprise Header - Minimal & Clean */}
      <div
        className="p-6 border-b"
        style={{
          borderColor: `${COLORS.gold}15`,
          background: COLORS.charcoal
        }}
      >
        {/* Bill Stylist Badge - Top Right */}
        {defaultStylistName && (
          <div className="flex items-center justify-end mb-3 animate-fadeIn">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.goldDark}10 100%)`,
                border: `1px solid ${COLORS.gold}50`,
                boxShadow: `0 2px 8px ${COLORS.gold}20`
              }}
            >
              <User className="w-4 h-4" style={{ color: COLORS.gold }} />
              <span className="text-xs font-semibold" style={{ color: COLORS.champagne }}>
                Bill Stylist: {defaultStylistName}
              </span>
            </div>
          </div>
        )}

        {/* Combined Search and Branch Filter Row */}
        <div className="flex gap-3 mb-3">
          {/* Enhanced Search - Compact */}
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: COLORS.gold }}
            />
            <input
              id="catalog-search"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2.5 rounded-lg border text-sm w-full focus:outline-none focus:ring-2 transition-all"
              style={
                {
                  borderColor: `${COLORS.gold}40`,
                  backgroundColor: COLORS.charcoalDark,
                  color: COLORS.champagne,
                  boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 0 0 1px ${COLORS.gold}20`,
                  '--tw-ring-color': `${COLORS.gold}60`
                } as React.CSSProperties
              }
            />
          </div>

          {/* Branch Filter - Expanded */}
          {branches.length > 0 && (
            <div className="flex-1">
              <Select
                value={branchId || ''}
                onValueChange={value => value && setBranchId(value)}
              >
                <SelectTrigger
                  className="h-[42px] transition-all duration-300"
                  style={{
                    backgroundColor: COLORS.charcoalDark,
                    borderColor: branchId ? `${COLORS.gold}40` : `${COLORS.bronze}60`,
                    color: COLORS.champagne
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" style={{ color: COLORS.gold }} />
                    <SelectValue placeholder="Select Branch" />
                  </div>
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" style={{ color: COLORS.gold }} />
                        <span className="font-medium">{branch.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Branch Selection Warning */}
        {!branchId && branches.length > 0 && (
          <div
            className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 animate-fadeIn"
            style={{
              background: `linear-gradient(135deg, ${COLORS.emerald}15 0%, ${COLORS.emerald}10 100%)`,
              border: `1px solid ${COLORS.emerald}40`
            }}
          >
            <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.emerald }} />
            <span className="text-xs font-medium" style={{ color: COLORS.champagne }}>
              Please select a branch to view available items
            </span>
          </div>
        )}

        {/* Barcode Scanner */}
        {branchId && (
          <div className="mb-3">
            <ScanToCart
              organizationId={organizationId}
              onProductFound={product => {
                // Transform product to PosItem format and add to cart
                const posItem: PosItem = {
                  id: product.id,
                  entity_id: product.id,
                  title: product.entity_name,
                  price: product.price_market || product.selling_price || 0,
                  __kind: 'PRODUCT',
                  category: product.category || 'General',
                  raw: product
                }
                handleAddItem(posItem)
              }}
            />
          </div>
        )}

        {/* Compact Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList
            className="grid w-full grid-cols-2 p-1 h-auto rounded-lg mb-3"
            style={{
              backgroundColor: `${COLORS.charcoalDark}80`,
              border: `1px solid ${COLORS.gold}20`
            }}
          >
            <TabsTrigger
              value="services"
              className="rounded-md px-4 py-2 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
              style={{
                backgroundColor: activeTab === 'services' ? `${COLORS.gold}25` : 'transparent',
                color: activeTab === 'services' ? COLORS.champagne : `${COLORS.gold}90`,
                border: activeTab === 'services' ? `1px solid ${COLORS.gold}50` : '1px solid transparent',
                fontWeight: activeTab === 'services' ? '600' : '500'
              }}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Services</span>
              <Badge
                className="ml-1 h-5 px-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: activeTab === 'services' ? COLORS.gold : `${COLORS.charcoalLight}`,
                  color: activeTab === 'services' ? COLORS.black : COLORS.bronze,
                  border: 'none'
                }}
              >
                {servicesCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="rounded-md px-4 py-2 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
              style={{
                backgroundColor: activeTab === 'products' ? `${COLORS.gold}25` : 'transparent',
                color: activeTab === 'products' ? COLORS.champagne : `${COLORS.gold}90`,
                border: activeTab === 'products' ? `1px solid ${COLORS.gold}50` : '1px solid transparent',
                fontWeight: activeTab === 'products' ? '600' : '500'
              }}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products</span>
              <Badge
                className="ml-1 h-5 px-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: activeTab === 'products' ? COLORS.gold : `${COLORS.charcoalLight}`,
                  color: activeTab === 'products' ? COLORS.black : COLORS.bronze,
                  border: 'none'
                }}
              >
                {productsCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Compact Category Filter */}
      <div
        className="px-4 py-2 border-b"
        style={{
          borderColor: `${COLORS.gold}15`,
          backgroundColor: COLORS.charcoal
        }}
      >
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isSelected = selectedCategory === category
            return (
              <SalonLuxeButton
                key={category}
                variant={isSelected ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category === 'all' ? 'All' : category}
              </SalonLuxeButton>
            )
          })}
        </div>
      </div>

      {/* Items List - Compact */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.charcoalLight }}
            >
              {activeTab === 'services' ? (
                <Scissors className="w-6 h-6" style={{ color: COLORS.bronze }} />
              ) : (
                <Package className="w-6 h-6" style={{ color: COLORS.bronze }} />
              )}
            </div>
            <h3 className="text-sm font-medium mb-1" style={{ color: COLORS.champagne }}>
              No items found
            </h3>
            <p className="text-xs" style={{ color: COLORS.lightText, opacity: 0.7 }}>
              {searchQuery
                ? 'Try adjusting your search'
                : !branchId
                  ? 'Select a branch to view items'
                  : `No ${activeTab} in this category`}
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredItems.map((item, index) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight}E6 0%, ${COLORS.charcoal}E6 100%)`,
                  borderColor: `${COLORS.gold}25`,
                  boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 1px ${COLORS.gold}10`
                }}
                onClick={() => handleAddItem(item)}
                onMouseMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - rect.left) / rect.width) * 100
                  const y = ((e.clientY - rect.top) / rect.height) * 100
                  e.currentTarget.style.background = `
                    radial-gradient(circle at ${x}% ${y}%,
                      rgba(212,175,55,0.15) 0%,
                      rgba(212,175,55,0.08) 25%,
                      rgba(35,35,35,0.9) 50%,
                      rgba(26,26,26,0.9) 100%
                    )
                  `
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.charcoalLight}E6 0%, ${COLORS.charcoal}E6 100%)`
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Compact Icon/Image */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                        style={{
                          border: `1px solid ${COLORS.gold}25`
                        }}
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.gold}15 0%, ${COLORS.bronze}10 100%)`,
                          border: `1px solid ${COLORS.gold}25`
                        }}
                      >
                        {item.__kind === 'SERVICE' ? (
                          <Scissors className="w-6 h-6" style={{ color: COLORS.gold }} />
                        ) : (
                          <Package className="w-6 h-6" style={{ color: COLORS.gold }} />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="font-medium text-sm truncate"
                          style={{ color: COLORS.champagne }}
                        >
                          {item.title}
                        </h3>
                        {item.category && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4"
                            style={{
                              background: `${COLORS.gold}15`,
                              color: COLORS.gold,
                              border: `1px solid ${COLORS.gold}30`
                            }}
                          >
                            {item.category}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div
                          className="flex items-center gap-1 font-semibold"
                          style={{ color: COLORS.gold }}
                        >
                          <Tag className="w-3 h-3" />
                          AED {item.price?.toFixed(2) || '0.00'}
                        </div>
                        {item.__kind === 'SERVICE' && item.duration && (
                          <div
                            className="flex items-center gap-1 font-medium"
                            style={{ color: COLORS.champagne, opacity: 0.7 }}
                          >
                            <Star className="w-3 h-3" style={{ color: COLORS.gold }} />
                            {formatDuration(item.duration)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-70 group-hover:opacity-100 transition-all shrink-0 h-8 w-8 p-0"
                      style={{
                        background: `${COLORS.gold}15`,
                        color: COLORS.gold,
                        border: `1px solid ${COLORS.gold}30`
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
