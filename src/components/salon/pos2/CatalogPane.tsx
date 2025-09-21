'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Scissors, Package, Tag, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { universalApi } from '@/lib/universal-api-v2'
import { useSalonPosIntegration } from '@/lib/playbook/salon-pos-integration'
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

interface CatalogItem {
  id: string
  name: string
  entity_type: 'service' | 'product'
  code?: string
  smart_code: string
  price?: number
  duration_mins?: number
  category?: string
  description?: string
  status?: 'active' | 'archived'
  metadata?: any
}

interface CatalogPaneProps {
  organizationId: string
  onAddItem: (item: {
    entity_id: string
    entity_type: 'service' | 'product'
    entity_name: string
    quantity: number
    unit_price: number
    stylist_id?: string
    appointment_id?: string
  }) => void
  currentCustomerId?: string
  currentAppointmentId?: string
}

export function CatalogPane({
  organizationId,
  onAddItem,
  currentCustomerId,
  currentAppointmentId
}: CatalogPaneProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services')
  const [services, setServices] = useState<CatalogItem[]>([])
  const [products, setProducts] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pricingLoading, setPricingLoading] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<CatalogItem | null>(null)
  const [showStylistModal, setShowStylistModal] = useState(false)

  const { getServicePricing } = useSalonPosIntegration(organizationId)

  // Load catalog data using universal API
  useEffect(() => {
    const loadCatalogData = async () => {
      try {
        setLoading(true)

        // Set organization context
        universalApi.setOrganizationId(organizationId)

        // Load services from core_entities
        const servicesResponse = await universalApi.getEntities({
          filters: {
            entity_type: 'service'
          },
          pageSize: 100
        })

        if (servicesResponse.success && servicesResponse.data) {
          console.log('Raw service entities from database:', servicesResponse.data.slice(0, 2)) // Log first 2 entities

          // Convert entities to catalog format
          const servicesData = servicesResponse.data.map(entity => {
            // Extract pricing from metadata or dynamic data
            // First try metadata, then fall back to a default if needed
            let price = entity.metadata?.price || entity.metadata?.base_price || 0

            // If no price in metadata, use a default based on service name
            if (price === 0 && entity.entity_type === 'service') {
              // Default prices for common services
              const defaultPrices: Record<string, number> = {
                cut: 60,
                color: 200,
                highlight: 280,
                treatment: 100,
                blowout: 75,
                style: 120,
                manicure: 45,
                pedicure: 65,
                facial: 180,
                massage: 200
              }

              const nameLower = entity.entity_name.toLowerCase()
              for (const [keyword, defaultPrice] of Object.entries(defaultPrices)) {
                if (nameLower.includes(keyword)) {
                  price = defaultPrice
                  console.log(`Using default price for ${entity.entity_name}: $${price}`)
                  break
                }
              }

              // If still no price, use a generic default
              if (price === 0) {
                price = 75
                console.log(`Using generic default price for ${entity.entity_name}: $${price}`)
              }
            }
            const duration = entity.metadata?.duration_mins || entity.metadata?.duration || 60
            const category = entity.metadata?.category || 'General'
            const description = entity.metadata?.description || ''

            return {
              id: entity.id || '',
              name: entity.entity_name,
              entity_type: 'service' as const,
              code: entity.entity_code,
              smart_code: entity.smart_code,
              price: price,
              duration_mins: duration,
              category: category,
              description: description,
              status: entity.metadata?.status || 'active',
              metadata: entity.metadata,
              is_active:
                entity.metadata?.status !== 'inactive' && entity.metadata?.status !== 'archived'
            }
          })

          console.log(
            `Loaded ${servicesData.length} services from database:`,
            servicesData.map(s => ({
              name: s.name,
              price: s.price,
              metadata: s.metadata
            }))
          )

          // Load dynamic pricing data if available
          if (servicesData.length > 0) {
            try {
              // Query each service's dynamic fields
              // Note: The universal API doesn't have a bulk query for dynamic data,
              // so we'll skip this for now and rely on metadata pricing
              console.log('Using metadata pricing for services')

              // Alternative: If you need dynamic pricing, you could:
              // 1. Loop through services and call getDynamicFields for each
              // 2. Or store pricing in entity metadata (recommended)
              // 3. Or use the Playbook API if configured
            } catch (error) {
              console.error('Error loading dynamic pricing:', error)
            }
          }

          setServices(servicesData)
        } else {
          console.error('Failed to load services:', servicesResponse.error)
          setServices([])
        }

        // Load products from core_entities
        const productsResponse = await universalApi.getEntities({
          filters: {
            entity_type: 'product'
          },
          pageSize: 100
        })

        if (productsResponse.success && productsResponse.data) {
          const productsData = productsResponse.data.map(entity => {
            let price = entity.metadata?.price || entity.metadata?.base_price || 0

            // If no price in metadata, use a default for products
            if (price === 0 && entity.entity_type === 'product') {
              const defaultProductPrices: Record<string, number> = {
                shampoo: 45,
                conditioner: 45,
                mask: 65,
                oil: 55,
                cream: 38,
                spray: 35,
                serum: 58,
                treatment: 48
              }

              const nameLower = entity.entity_name.toLowerCase()
              for (const [keyword, defaultPrice] of Object.entries(defaultProductPrices)) {
                if (nameLower.includes(keyword)) {
                  price = defaultPrice
                  console.log(`Using default price for ${entity.entity_name}: $${price}`)
                  break
                }
              }

              // Generic product default
              if (price === 0) {
                price = 40
                console.log(`Using generic default price for ${entity.entity_name}: $${price}`)
              }
            }
            const category = entity.metadata?.category || 'General'
            const description = entity.metadata?.description || ''

            return {
              id: entity.id || '',
              name: entity.entity_name,
              entity_type: 'product' as const,
              code: entity.entity_code,
              smart_code: entity.smart_code,
              price: price,
              category: category,
              description: description,
              status: entity.metadata?.status || 'active',
              metadata: entity.metadata,
              is_active:
                entity.metadata?.status !== 'inactive' && entity.metadata?.status !== 'archived'
            }
          })

          console.log(`Loaded ${productsData.length} products from database`)
          setProducts(productsData)
        } else {
          console.log('No products found or error loading products')
          setProducts([])
        }
      } catch (error) {
        console.error('Error loading catalog data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      loadCatalogData()
    }
  }, [organizationId])

  // Get current items based on active tab
  const currentItems = activeTab === 'services' ? services : products

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(currentItems.map(item => item.category || 'General')))
    return ['all', ...cats.sort()]
  }, [currentItems])

  // Filter items
  const filteredItems = useMemo(() => {
    const filtered = currentItems.filter(item => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

      return matchesSearch && matchesCategory && item.is_active
    })

    console.log(`Filtering: ${currentItems.length} total items, ${filtered.length} after filtering`)
    console.log(
      'Filtered items:',
      filtered.map(item => ({
        name: item.name,
        price: item.price,
        is_active: item.is_active,
        category: item.category
      }))
    )

    return filtered
  }, [currentItems, searchQuery, selectedCategory])

  const handleAddItem = async (item: CatalogItem) => {
    // For services, show stylist selection modal
    if (item.entity_type === 'service') {
      setSelectedService(item)
      setShowStylistModal(true)
      return
    }

    // For products, add directly to cart
    let finalPrice = item.price || 0

    console.log('Adding product to cart:', {
      name: item.name,
      price: finalPrice
    })

    onAddItem({
      entity_id: item.id,
      entity_type: item.entity_type,
      entity_name: item.name,
      quantity: 1,
      unit_price: finalPrice
    })
  }

  const handleStylistConfirm = (data: any) => {
    console.log('Adding service with stylist:', data)
    onAddItem(data)
    setSelectedService(null)
    setShowStylistModal(false)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: COLORS.charcoal }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: COLORS.gold }}
          ></div>
          <p style={{ color: COLORS.lightText }}>Loading catalog...</p>
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
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{
          borderColor: COLORS.bronze + '20',
          backgroundColor: COLORS.charcoalLight,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: COLORS.champagne }}>
          Catalog
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: COLORS.bronze }}
          />
          <input
            id="catalog-search"
            placeholder="Search services and products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border text-sm w-full"
            style={{
              borderColor: COLORS.bronze + '33',
              backgroundColor: COLORS.charcoalDark,
              color: COLORS.lightText,
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>

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
                Services ({services.length})
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
                Products ({products.length})
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

      {/* Category Filter */}
      <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.bronze + '20' }}>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                selectedCategory === category ? '' : ''
              )}
              style={{
                backgroundColor: selectedCategory === category ? COLORS.gold : 'transparent',
                color: selectedCategory === category ? COLORS.black : COLORS.champagne,
                borderColor: COLORS.bronze + '50'
              }}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Categories' : category}
            </Badge>
          ))}
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
          <div className="grid gap-3">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="group hover:shadow-md transition-all duration-200 cursor-pointer backdrop-blur-sm"
                style={{
                  backgroundColor: COLORS.charcoalLight + '80',
                  borderColor: COLORS.bronze + '33',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
                onClick={() => handleAddItem(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate" style={{ color: COLORS.champagne }}>
                          {item.name}
                        </h3>
                        {item.category && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: COLORS.charcoalDark,
                              color: COLORS.champagne,
                              border: `1px solid ${COLORS.gold}33`
                            }}
                          >
                            {item.category}
                          </Badge>
                        )}
                      </div>

                      {item.description && (
                        <p
                          className="text-sm line-clamp-2 mb-2"
                          style={{ color: COLORS.lightText, opacity: 0.8 }}
                        >
                          {item.description}
                        </p>
                      )}

                      <div
                        className="flex items-center gap-4 text-sm"
                        style={{ color: COLORS.bronze }}
                      >
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />${item.price?.toFixed(2) || '0.00'}
                        </div>
                        {activeTab === 'services' && item.duration_mins && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {formatDuration(item.duration_mins)}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                      style={{
                        color: COLORS.gold
                      }}
                      disabled={pricingLoading === item.id}
                    >
                      {pricingLoading === item.id ? (
                        <div
                          className="animate-spin rounded-full h-4 w-4 border-b-2"
                          style={{ borderColor: COLORS.gold }}
                        ></div>
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stylist Selection Modal */}
        {selectedService && (
          <StylistSelectionModal
            open={showStylistModal}
            onClose={() => {
              setShowStylistModal(false)
              setSelectedService(null)
            }}
            service={selectedService}
            organizationId={organizationId}
            onConfirm={handleStylistConfirm}
          />
        )}
      </div>
    </div>
  )
}
