'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Scissors, Package, Tag, Star, Building2, MapPin, X, Loader2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalonPOS, type PosItem } from '@/hooks/useSalonPOS'
import { StylistSelectionModal } from './StylistSelectionModal'
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
}

export function CatalogPane({
  organizationId,
  onAddItem,
  currentCustomerId,
  currentAppointmentId,
  defaultStylistId,
  defaultStylistName
}: CatalogPaneProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services')
  const [selectedItem, setSelectedItem] = useState<PosItem | null>(null)
  const [showStylistModal, setShowStylistModal] = useState(false)

  // Use composition hook for POS data
  const {
    items,
    staff,
    branchId,
    branches,
    isLoading,
    setBranchId
  } = useSalonPOS({
    search: searchQuery,
    organizationId
  })

  // Filter items by tab and category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Tab filter
      const matchesTab = activeTab === 'services' ? item.__kind === 'SERVICE' : item.__kind === 'PRODUCT'

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
    // For services: if we have a default stylist, use it directly; otherwise show modal
    if (item.__kind === 'SERVICE') {
      if (defaultStylistId && defaultStylistName) {
        // Use default stylist automatically
        onAddItem(item, defaultStylistId, defaultStylistName)
      } else {
        // Show modal to select first stylist
        setSelectedItem(item)
        setShowStylistModal(true)
      }
      return
    }

    // For products, add directly (staff optional)
    onAddItem(item)
  }

  const handleStylistConfirm = (staffId: string, staffName?: string) => {
    if (selectedItem) {
      onAddItem(selectedItem, staffId, staffName)
      setSelectedItem(null)
      setShowStylistModal(false)
    }
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
      {/* Enhanced Header with Gradient */}
      <div
        className="p-6 border-b"
        style={{
          borderColor: `${COLORS.gold}30`,
          background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px ${COLORS.gold}10`
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{
              background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em'
            }}
          >
            Catalog
          </h2>
          {defaultStylistName && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg animate-fadeIn"
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
          )}
        </div>

        {/* Enhanced Search with Glow */}
        <div className="relative mb-5">
          <Search
            className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5"
            style={{ color: COLORS.gold }}
          />
          <input
            id="catalog-search"
            placeholder="Search services and products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 py-3 rounded-xl border text-sm w-full focus:outline-none focus:ring-2 transition-all placeholder:text-opacity-60"
            style={
              {
                borderColor: `${COLORS.gold}40`,
                backgroundColor: COLORS.charcoalDark,
                color: COLORS.champagne,
                boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 0 0 1px ${COLORS.gold}20`,
                '--tw-ring-color': `${COLORS.gold}60`,
                '--tw-ring-offset-color': 'transparent'
              } as React.CSSProperties
            }
          />
          <style jsx>{`
            #catalog-search::placeholder {
              color: ${COLORS.champagne};
              opacity: 0.5;
            }
            #catalog-search:focus {
              box-shadow:
                inset 0 2px 4px rgba(0, 0, 0, 0.4),
                0 0 0 2px ${COLORS.gold}40,
                0 0 16px ${COLORS.gold}20;
            }
          `}</style>
        </div>

        {/* Branch Filter */}
        {branches.length > 1 && (
          <div className="mb-4 animate-slideDown">
            <Select
              value={branchId === undefined || branchId === 'all' ? 'all' : branchId}
              onValueChange={value => setBranchId(value === 'all' ? undefined : value)}
            >
              <SelectTrigger
                className="w-full transition-all duration-300 hover:scale-[1.01]"
                style={{
                  backgroundColor: `${COLORS.black}CC`,
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" style={{ color: COLORS.gold }} />
                  <SelectValue placeholder="All Locations" />
                </div>
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  All Locations
                </SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" style={{ color: COLORS.gold }} />
                      <div className="flex flex-col">
                        <span className="font-medium">{branch.name}</span>
                        {branch.code && <span className="text-xs opacity-60">{branch.code}</span>}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active Branch Badge */}
            {branchId && branchId !== 'all' && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs" style={{ color: COLORS.bronze }}>
                  Filtered by:
                </span>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105"
                  style={{
                    background: `${COLORS.gold}20`,
                    border: `1px solid ${COLORS.gold}40`,
                    boxShadow: `0 2px 8px ${COLORS.gold}20`
                  }}
                >
                  <Building2 className="h-3 w-3" style={{ color: COLORS.gold }} />
                  <span className="text-xs font-medium" style={{ color: COLORS.champagne }}>
                    {branches.find(b => b.id === branchId)?.name || branchId}
                  </span>
                  <button
                    onClick={() => setBranchId(undefined)}
                    className="ml-1 hover:opacity-70 transition-opacity"
                    style={{ color: COLORS.gold }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList
            className="grid w-full grid-cols-2 p-0 border-b w-full justify-start h-auto rounded-none"
            style={{
              borderColor: COLORS.bronze + '33',
              backgroundColor: COLORS.charcoalLight,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            <TabsTrigger
              value="services"
              className="rounded-none px-6 py-3 relative transition-colors flex items-center gap-2"
              style={{
                backgroundColor: activeTab === 'services' ? COLORS.charcoal : 'transparent'
              }}
            >
              <Scissors
                className="w-4 h-4"
                style={{ color: activeTab === 'services' ? COLORS.gold : COLORS.champagne }}
              />
              <span
                style={{ color: activeTab === 'services' ? COLORS.champagne : COLORS.lightText }}
              >
                Services ({servicesCount})
              </span>
              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-0.5 transition-all',
                  activeTab === 'services' ? 'opacity-100' : 'opacity-0'
                )}
                style={{ backgroundColor: COLORS.gold }}
              />
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="rounded-none px-6 py-3 relative transition-colors flex items-center gap-2"
              style={{
                backgroundColor: activeTab === 'products' ? COLORS.charcoal : 'transparent'
              }}
            >
              <Package
                className="w-4 h-4"
                style={{ color: activeTab === 'products' ? COLORS.gold : COLORS.champagne }}
              />
              <span
                style={{ color: activeTab === 'products' ? COLORS.champagne : COLORS.lightText }}
              >
                Products ({productsCount})
              </span>
              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-0.5 transition-all',
                  activeTab === 'products' ? 'opacity-100' : 'opacity-0'
                )}
                style={{ backgroundColor: COLORS.gold }}
              />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Enhanced Category Filter with Luxury Styling */}
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: `${COLORS.gold}20`,
          background: `linear-gradient(to bottom, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`
        }}
      >
        <div className="flex flex-wrap gap-2.5">
          {categories.map(category => {
            const isSelected = selectedCategory === category
            return (
              <Badge
                key={category}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:scale-105 px-4 py-2 text-sm font-medium border',
                  isSelected ? 'shadow-lg' : 'hover:shadow-md'
                )}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                    : `${COLORS.charcoalDark}80`,
                  color: isSelected ? COLORS.black : COLORS.champagne,
                  borderColor: isSelected ? COLORS.gold : `${COLORS.gold}40`,
                  boxShadow: isSelected
                    ? `0 4px 12px ${COLORS.gold}40, 0 0 0 1px ${COLORS.gold}`
                    : `0 0 0 1px ${COLORS.gold}20`
                }}
                onClick={() => setSelectedCategory(category)}
              >
                <span style={{ color: isSelected ? COLORS.black : COLORS.champagne }}>
                  {category === 'all' ? 'All Categories' : category}
                </span>
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.charcoalLight }}
            >
              {activeTab === 'services' ? (
                <Scissors className="w-8 h-8" style={{ color: COLORS.bronze }} />
              ) : (
                <Package className="w-8 h-8" style={{ color: COLORS.bronze }} />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
              No items found
            </h3>
            <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : `No ${activeTab} available in this category`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item, index) => (
              <Card
                key={item.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer backdrop-blur-sm hover:scale-[1.02] animate-fadeInUp"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight}E6 0%, ${COLORS.charcoal}E6 100%)`,
                  borderColor: `${COLORS.gold}30`,
                  boxShadow: `0 4px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px ${COLORS.gold}15`,
                  transition: 'all 0.3s ease',
                  animationDelay: `${Math.min(index * 50, 300)}ms`
                }}
                onClick={() => handleAddItem(item)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-24 h-24 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                        style={{
                          border: `1px solid ${COLORS.gold}30`,
                          boxShadow: `0 4px 12px ${COLORS.gold}20`
                        }}
                        onError={e => {
                          // Hide broken images
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.bronze}15 100%)`,
                          border: `1px solid ${COLORS.gold}30`,
                          boxShadow: `0 4px 12px ${COLORS.gold}15`
                        }}
                      >
                        {item.__kind === 'SERVICE' ? (
                          <Scissors className="w-10 h-10" style={{ color: COLORS.gold }} />
                        ) : (
                          <Package className="w-10 h-10" style={{ color: COLORS.gold }} />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3
                          className="font-semibold text-base truncate"
                          style={{ color: COLORS.champagne }}
                        >
                          {item.title}
                        </h3>
                        {item.category && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2.5 py-0.5 transition-all duration-200 hover:scale-105"
                            style={{
                              background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                              color: COLORS.gold,
                              border: `1px solid ${COLORS.gold}40`,
                              fontWeight: 500
                            }}
                          >
                            {item.category}
                          </Badge>
                        )}
                      </div>

                      {item.description && (
                        <p
                          className="text-sm line-clamp-2 mb-3"
                          style={{ color: COLORS.champagne, opacity: 0.7 }}
                        >
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-5 text-sm">
                        <div
                          className="flex items-center gap-2 font-bold text-lg transition-all duration-200 hover:scale-105"
                          style={{ color: COLORS.gold }}
                        >
                          <Tag className="w-4 h-4" />
                          AED {item.price?.toFixed(2) || '0.00'}
                        </div>
                        {item.__kind === 'SERVICE' && item.duration && (
                          <div
                            className="flex items-center gap-1.5 font-medium"
                            style={{ color: COLORS.champagne, opacity: 0.8 }}
                          >
                            <Star className="w-4 h-4" style={{ color: COLORS.gold }} />
                            {formatDuration(item.duration)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-60 group-hover:opacity-100 transition-all shrink-0 hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                        color: COLORS.gold,
                        border: `1px solid ${COLORS.gold}40`,
                        padding: '0.5rem',
                        borderRadius: '0.75rem'
                      }}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stylist Selection Modal */}
        {selectedItem && (
          <StylistSelectionModal
            open={showStylistModal}
            onClose={() => {
              setShowStylistModal(false)
              setSelectedItem(null)
            }}
            service={selectedItem.raw}
            organizationId={organizationId}
            branchId={branchId}
            onConfirm={handleStylistConfirm}
          />
        )}
      </div>
    </div>
  )
}
