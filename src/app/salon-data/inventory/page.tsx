'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Salon Inventory Management
 * Smart Code: HERA.SALON.INVENTORY.MODULE.v1
 *
 * Complete inventory system with reporting, commissions, alerts,
 * product ownership, and integrations - all on 6-table foundation
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { handleError } from '@/lib/salon/error-handler'
import type { Product, ProductFormData } from '@/types/salon.types'
import {
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  User,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Bell,
  ArrowLeft,
  ArrowRight,
  Scissors,
  Sparkles,
  Home,
  UserCheck,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Edit,
  Trash2,
  Save,
  Mail,
  X,
  Hash,
  Percent,
  Award,
  Webhook,
  Link,
  ExternalLink,
  FileText,
  Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------

interface InventoryItem {
  id: string
  entity_type: 'product'
  entity_name: string
  entity_code?: string
  smart_code: string
  category_id?: string
  category_name?: string
  // Dynamic data fields
  barcode?: string
  sku?: string
  stock_on_hand: number
  reorder_point: number
  reorder_quantity: number
  unit_cost: number
  retail_price: number
  commission_rate: number
  commission_type: 'percentage' | 'fixed'
  owner_id?: string
  owner_name?: string
  ownership_type?: 'salon' | 'booth_renter' | 'consignment'
  last_restock_date?: Date
  last_sale_date?: Date
  usage_type: 'retail' | 'professional' | 'both'
  location_id?: string
  location_name?: string
}

interface StockMovement {
  id: string
  transaction_type: string
  transaction_date: Date
  smart_code: string
  product_id: string
  product_name: string
  quantity: number
  movement_type: 'in' | 'out' | 'adjustment'
  reason?: string
  staff_id?: string
  staff_name?: string
  reference_number?: string
  unit_cost?: number
  total_value?: number
}

interface CommissionRule {
  id: string
  product_id: string
  staff_id?: string
  commission_rate: number
  commission_type: 'percentage' | 'fixed'
  effective_from: Date
  effective_to?: Date
  minimum_quantity?: number
  maximum_discount_allowed?: number
}

interface LowStockAlert {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  reorder_point: number
  alert_date: Date
  alert_status: 'active' | 'acknowledged' | 'resolved'
  assigned_to?: string
}

interface WebhookIntegration {
  id: string
  integration_type: 'shopify' | 'intuit' | 'mailchimp' | 'custom'
  webhook_url: string
  api_key?: string
  active: boolean
  events: string[]
  last_sync?: Date
  sync_status?: 'success' | 'failed' | 'pending'
}

// ----------------------------- Mock Data ------------------------------------

const mockInventory: InventoryItem[] = [
  {
    id: '1',
    entity_type: 'product',
    entity_name: 'Aloe Vera Shampoo 250ml',
    entity_code: 'PRD-001',
    smart_code: 'HERA.SALON.PRODUCT.SHAMPOO.ALOE.V1',
    barcode: '6291234567890',
    sku: 'SH-ALOE-250',
    stock_on_hand: 24,
    reorder_point: 10,
    reorder_quantity: 50,
    unit_cost: 15,
    retail_price: 45,
    commission_rate: 15,
    commission_type: 'percentage',
    owner_id: 'SALON-001',
    owner_name: 'Hair Talkz Salon',
    ownership_type: 'salon',
    usage_type: 'retail',
    category_id: '1',
    category_name: 'Hair Care',
    last_restock_date: new Date('2024-02-15'),
    last_sale_date: new Date('2024-03-01')
  },
  {
    id: '2',
    entity_type: 'product',
    entity_name: 'Argan Oil Hair Mask 200ml',
    entity_code: 'PRD-002',
    smart_code: 'HERA.SALON.PRODUCT.MASK.ARGAN.V1',
    barcode: '6291234567891',
    sku: 'HM-ARGAN-200',
    stock_on_hand: 8,
    reorder_point: 10,
    reorder_quantity: 30,
    unit_cost: 25,
    retail_price: 85,
    commission_rate: 20,
    commission_type: 'percentage',
    owner_id: 'STAFF-002',
    owner_name: 'Sarah Johnson',
    ownership_type: 'booth_renter',
    usage_type: 'retail',
    category_id: '1',
    category_name: 'Hair Care',
    last_restock_date: new Date('2024-02-20'),
    last_sale_date: new Date('2024-02-28')
  },
  {
    id: '3',
    entity_type: 'product',
    entity_name: 'Professional Hair Color Kit',
    entity_code: 'PRO-001',
    smart_code: 'HERA.SALON.PRODUCT.COLOR.PRO.V1',
    stock_on_hand: 45,
    reorder_point: 20,
    reorder_quantity: 100,
    unit_cost: 8,
    retail_price: 0, // Professional use only
    commission_rate: 0,
    commission_type: 'fixed',
    owner_id: 'SALON-001',
    owner_name: 'Hair Talkz Salon',
    ownership_type: 'salon',
    usage_type: 'professional',
    category_id: '2',
    category_name: 'Professional Supplies',
    last_restock_date: new Date('2024-02-10')
  },
  {
    id: '4',
    entity_type: 'product',
    entity_name: 'Luxury Face Serum 30ml',
    entity_code: 'SPA-001',
    smart_code: 'HERA.SALON.PRODUCT.SERUM.LUXURY.V1',
    barcode: '6291234567892',
    sku: 'FS-LUX-30',
    stock_on_hand: 3,
    reorder_point: 5,
    reorder_quantity: 20,
    unit_cost: 45,
    retail_price: 150,
    commission_rate: 25,
    commission_type: 'percentage',
    owner_id: 'CONSIGN-001',
    owner_name: 'Beauty Brands LLC',
    ownership_type: 'consignment',
    usage_type: 'retail',
    category_id: '3',
    category_name: 'Spa Products',
    last_sale_date: new Date('2024-02-25')
  }
]

const mockMovements: StockMovement[] = [
  {
    id: '1',
    transaction_type: 'STOCK_IN',
    transaction_date: new Date('2024-03-01T10:00:00'),
    smart_code: 'HERA.SALON.INVENTORY.MOVEMENT.PURCHASE.V1',
    product_id: '1',
    product_name: 'Aloe Vera Shampoo 250ml',
    quantity: 50,
    movement_type: 'in',
    reason: 'Purchase Order #PO-2024-001',
    staff_id: 'STAFF-001',
    staff_name: 'John Admin',
    reference_number: 'PO-2024-001',
    unit_cost: 15,
    total_value: 750
  },
  {
    id: '2',
    transaction_type: 'SALE',
    transaction_date: new Date('2024-03-01T14:30:00'),
    smart_code: 'HERA.SALON.INVENTORY.MOVEMENT.SALE.V1',
    product_id: '1',
    product_name: 'Aloe Vera Shampoo 250ml',
    quantity: 2,
    movement_type: 'out',
    reason: 'Retail Sale #R-100234',
    staff_id: 'STAFF-003',
    staff_name: 'Emily Davis',
    reference_number: 'R-100234'
  }
]

const mockAlerts: LowStockAlert[] = [
  {
    id: '1',
    product_id: '2',
    product_name: 'Argan Oil Hair Mask 200ml',
    current_stock: 8,
    reorder_point: 10,
    alert_date: new Date('2024-03-01'),
    alert_status: 'active',
    assigned_to: 'STAFF-001'
  },
  {
    id: '2',
    product_id: '4',
    product_name: 'Luxury Face Serum 30ml',
    current_stock: 3,
    reorder_point: 5,
    alert_date: new Date('2024-02-28'),
    alert_status: 'active'
  }
]

const categories = [
  { id: '1', name: 'Hair Care', color: '#8B5CF6' },
  { id: '2', name: 'Professional Supplies', color: '#3B82F6' },
  { id: '3', name: 'Spa Products', color: '#10B981' },
  { id: '4', name: 'Styling Tools', color: '#F59E0B' },
  { id: '5', name: 'Nail Products', color: '#EC4899' }
]

// ----------------------------- Utility Functions ------------------------------------

const formatCurrency = (amount: number, currency: string = 'AED') => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const getStockStatus = (current: number, reorderPoint: number) => {
  const ratio = current / reorderPoint
  if (ratio <= 0.5)
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
  if (ratio <= 1)
    return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' }
  if (ratio <= 2)
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' }
  return { status: 'excess', color: 'text-primary', bg: 'bg-blue-100 dark:bg-blue-900/30' }
}

// ----------------------------- Main Component ------------------------------------

export default function SalonInventoryManagement() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [organizationId, setOrganizationId] = useState<string>('')

  // State Management
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'movements' | 'reports' | 'settings'
  >('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedOwnership, setSelectedOwnership] = useState<string>('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Set organization ID
  useEffect(() => {
    if (currentOrganization?.id) {
      setOrganizationId(currentOrganization.id)
    }
  }, [currentOrganization])

  // ----------------------------- Computed Values ------------------------------------

  const filteredInventory = useMemo(() => {
    return mockInventory.filter(item => {
      const matchesSearch =
        item.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.entity_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.includes(searchQuery) ||
        item.sku?.includes(searchQuery)
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory
      const matchesOwnership = !selectedOwnership || item.ownership_type === selectedOwnership
      const matchesLowStock = !showLowStockOnly || item.stock_on_hand <= item.reorder_point

      return matchesSearch && matchesCategory && matchesOwnership && matchesLowStock
    })
  }, [searchQuery, selectedCategory, selectedOwnership, showLowStockOnly])

  const inventoryMetrics = useMemo(() => {
    const totalValue = mockInventory.reduce(
      (sum, item) => sum + item.stock_on_hand * item.unit_cost,
      0
    )
    const retailValue = mockInventory.reduce(
      (sum, item) => sum + item.stock_on_hand * item.retail_price,
      0
    )
    const lowStockCount = mockInventory.filter(
      item => item.stock_on_hand <= item.reorder_point
    ).length
    const outOfStockCount = mockInventory.filter(item => item.stock_on_hand === 0).length

    return {
      totalItems: mockInventory.length,
      totalValue,
      retailValue,
      lowStockCount,
      outOfStockCount,
      avgMargin: ((retailValue - totalValue) / retailValue) * 100 || 0
    }
  }, [])

  const ownershipBreakdown = useMemo(() => {
    const breakdown = mockInventory.reduce(
      (acc, item) => {
        const type = item.ownership_type || 'salon'
        if (!acc[type]) {
          acc[type] = { count: 0, value: 0 }
        }
        acc[type].count++
        acc[type].value += item.stock_on_hand * item.unit_cost
        return acc
      },
      {} as Record<string, { count: number; value: number }>
    )

    return breakdown
  }, [])

  // ----------------------------- Event Handlers ------------------------------------

  const handleStockAdjustment = async (productId: string, adjustment: number, reason: string) => {
    // Create stock movement transaction
    const movement = {
      organization_id: organizationId,
      transaction_type: 'STOCK_ADJUSTMENT',
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.SALON.INVENTORY.ADJUSTMENT.MANUAL.V1',
      metadata: {
        product_id: productId,
        quantity: adjustment,
        reason: reason
      }
    }

    // Here you would call universalApi to create stock adjustment
    // await universalApi.createTransaction(movement)
  }

  const handleReorder = async (productId: string) => {
    const product = mockInventory.find(p => p.id === productId)
    if (!product) return

    // Create purchase order transaction
    const purchaseOrder = {
      organization_id: organizationId,
      transaction_type: 'PURCHASE_ORDER',
      smart_code: 'HERA.PROCURE.PO.HEADER.v1',
      total_amount: product.reorder_quantity * product.unit_cost,
      metadata: {
        vendor_id: 'VENDOR-001',
        product_id: productId,
        quantity: product.reorder_quantity
      }
    }

    // In production, this would create the purchase order via API
    handleError(new Error(`Reorder initiated for ${product.entity_name}`), 'inventory-reorder', {
      showToast: true,
      fallbackMessage: `Reorder initiated for ${product.entity_name}`
    })
  }

  const generateCommissionReport = () => {
    // Calculate commissions based on sales and commission rules
    const report = mockInventory
      .map(item => {
        if (item.commission_rate > 0) {
          return {
            product: item.entity_name,
            owner: item.owner_name,
            rate: item.commission_rate,
            type: item.commission_type,
            estimatedMonthly:
              item.commission_type === 'percentage'
                ? item.retail_price * 0.15 * 30 // Assume 15% of stock sells monthly
                : item.commission_rate * 30
          }
        }
        return null
      })
      .filter(Boolean)

    // Commission report generated
    // In production, this would be saved or exported
  }

  // ----------------------------- UI Components ------------------------------------

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                Total Inventory Value
              </CardTitle>
              <Package className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(inventoryMetrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
              Cost basis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                Retail Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(inventoryMetrics.retailValue)}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
              {inventoryMetrics.avgMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                Low Stock Items
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics.lowStockCount}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
              Need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                Total Products
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics.totalItems}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
              Active items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {mockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Low Stock Alerts
              <Badge variant="destructive">{mockAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAlerts.map(alert => (
                <Alert key={alert.id} className="border-orange-200 dark:border-orange-800">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{alert.product_name}</span>
                      <span className="text-sm text-muted-foreground dark:text-muted-foreground ml-2">
                        Current: {alert.current_stock} | Reorder at: {alert.reorder_point}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReorder(alert.product_id)}
                    >
                      Reorder Now
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ownership Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Ownership Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(ownershipBreakdown).map(([type, data]) => (
              <div
                key={type}
                className="flex items-center justify-between p-4 bg-muted dark:bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {type === 'salon' && <Home className="w-5 h-5 text-purple-500" />}
                  {type === 'booth_renter' && <UserCheck className="w-5 h-5 text-blue-500" />}
                  {type === 'consignment' && <Package className="w-5 h-5 text-green-500" />}
                  <div>
                    <h4 className="font-medium capitalize">{type.replace('_', ' ')}</h4>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {data.count} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(data.value)}</p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {((data.value / inventoryMetrics.totalValue) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMovements.slice(0, 5).map(movement => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {movement.movement_type === 'in' ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Minus className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{movement.product_name}</p>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {movement.reason} • By {movement.staff_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {movement.movement_type === 'in' ? '+' : '-'}
                    {movement.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {movement.transaction_date.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ProductsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, code, barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-background dark:bg-muted-foreground/10 border border-border dark:border-border rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedOwnership}
                onChange={e => setSelectedOwnership(e.target.value)}
                className="px-3 py-2 bg-background dark:bg-muted-foreground/10 border border-border dark:border-border rounded-md text-sm"
              >
                <option value="">All Ownership</option>
                <option value="salon">Salon Owned</option>
                <option value="booth_renter">Booth Renter</option>
                <option value="consignment">Consignment</option>
              </select>

              <Button
                variant={showLowStockOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Low Stock Only
              </Button>

              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInventory.map(item => {
          const stockStatus = getStockStatus(item.stock_on_hand, item.reorder_point)

          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted dark:bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-100 dark:text-foreground">
                            {item.entity_name}
                          </h3>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor:
                                categories.find(c => c.id === item.category_id)?.color + '40',
                              backgroundColor:
                                categories.find(c => c.id === item.category_id)?.color + '10'
                            }}
                          >
                            {item.category_name}
                          </Badge>
                          {item.usage_type === 'professional' && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                              Professional
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
                          {item.entity_code && (
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {item.entity_code}
                            </span>
                          )}
                          {item.barcode && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {item.barcode}
                            </span>
                          )}
                          {item.sku && (
                            <span className="flex items-center gap-1">SKU: {item.sku}</span>
                          )}
                        </div>

                        {/* Ownership Info */}
                        <div className="mt-2 flex items-center gap-2">
                          {item.ownership_type === 'salon' && (
                            <Home className="w-4 h-4 text-purple-500" />
                          )}
                          {item.ownership_type === 'booth_renter' && (
                            <UserCheck className="w-4 h-4 text-blue-500" />
                          )}
                          {item.ownership_type === 'consignment' && (
                            <Package className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm">
                            {item.owner_name} ({item.ownership_type?.replace('_', ' ')})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Pricing Info */}
                  <div className="ml-6 text-right">
                    <div className={cn('text-2xl font-bold mb-1', stockStatus.color)}>
                      {item.stock_on_hand}
                    </div>
                    <Badge className={cn('mb-2', stockStatus.bg)}>{stockStatus.status}</Badge>

                    <div className="space-y-1 text-sm">
                      <div className="text-muted-foreground dark:text-muted-foreground">
                        Reorder at: {item.reorder_point}
                      </div>
                      <div className="text-muted-foreground dark:text-muted-foreground">
                        Cost: {formatCurrency(item.unit_cost)}
                      </div>
                      {item.retail_price > 0 && (
                        <div className="font-semibold">
                          Retail: {formatCurrency(item.retail_price)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Commission Info */}
                {item.commission_rate > 0 && (
                  <div className="mt-4 pt-4 border-t border-border dark:border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">Commission</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {item.commission_type === 'percentage' ? (
                          <>{item.commission_rate}% of sale</>
                        ) : (
                          <>{formatCurrency(item.commission_rate)} per unit</>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-border dark:border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.last_sale_date && (
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Last sale: {item.last_sale_date.toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStockAdjustment(item.id, 0, 'Manual adjustment')}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Adjust
                    </Button>
                    {item.stock_on_hand <= item.reorder_point && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReorder(item.id)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Reorder
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground mb-2">
            No products found
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Try adjusting your filters or add new products to inventory.
          </p>
        </div>
      )}
    </div>
  )

  const MovementsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Movement History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMovements.map(movement => (
              <div
                key={movement.id}
                className="border border-border dark:border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {movement.movement_type === 'in' ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-green-600" />
                      </div>
                    ) : movement.movement_type === 'out' ? (
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-primary" />
                      </div>
                    )}

                    <div className="flex-1">
                      <h4 className="font-semibold">{movement.product_name}</h4>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {movement.reason}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {movement.staff_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {movement.transaction_date.toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {movement.transaction_date.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        'text-xl font-bold',
                        movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {movement.movement_type === 'in' ? '+' : '-'}
                      {movement.quantity}
                    </p>
                    {movement.reference_number && (
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Ref: {movement.reference_number}
                      </p>
                    )}
                    {movement.total_value && (
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(movement.total_value)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ReportsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Valuation Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Inventory Valuation Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-muted-foreground">
                  Total Cost Value
                </span>
                <span className="font-semibold">{formatCurrency(inventoryMetrics.totalValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-muted-foreground">
                  Total Retail Value
                </span>
                <span className="font-semibold">
                  {formatCurrency(inventoryMetrics.retailValue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-muted-foreground">
                  Potential Profit
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(inventoryMetrics.retailValue - inventoryMetrics.totalValue)}
                </span>
              </div>
              <div className="pt-3 border-t border-border dark:border-border">
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Full Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Commission Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInventory
                .filter(item => item.commission_rate > 0)
                .slice(0, 3)
                .map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2 bg-muted dark:bg-muted rounded"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.entity_name}</p>
                      <p className="text-xs text-muted-foreground">{item.owner_name}</p>
                    </div>
                    <Badge>
                      {item.commission_type === 'percentage'
                        ? `${item.commission_rate}%`
                        : formatCurrency(item.commission_rate)}
                    </Badge>
                  </div>
                ))}
              <div className="pt-3 border-t border-border dark:border-border">
                <Button className="w-full" variant="outline" onClick={generateCommissionReport}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Calculate Commissions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COGS Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Cost of Goods Sold (COGS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Track product costs and profitability over time
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">This Month</p>
                  <p className="text-xl font-bold">{formatCurrency(12450)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Month</p>
                  <p className="text-xl font-bold">{formatCurrency(10280)}</p>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                View COGS Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Product Usage Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Professional Products</span>
                  <span className="font-medium">
                    {mockInventory.filter(i => i.usage_type === 'professional').length} items
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Retail Products</span>
                  <span className="font-medium">
                    {mockInventory.filter(i => i.usage_type === 'retail').length} items
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dual Use</span>
                  <span className="font-medium">
                    {mockInventory.filter(i => i.usage_type === 'both').length} items
                  </span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Usage Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const SettingsTab = () => (
    <div className="space-y-6">
      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Low Stock Alert Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Configure when to receive low stock notifications
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts for low stock
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg">
                <div>
                  <p className="font-medium">SMS Alerts</p>
                  <p className="text-sm text-muted-foreground">Get SMS for critical stock levels</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Dashboard Alerts</p>
                  <p className="text-sm text-muted-foreground">Show alerts on main dashboard</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Connect with external systems for automated inventory sync
            </p>
            <div className="space-y-3">
              {/* Shopify */}
              <div className="flex items-center justify-between p-4 border border-border dark:border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Shopify</h4>
                    <p className="text-sm text-muted-foreground">Sync products and inventory</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* QuickBooks */}
              <div className="flex items-center justify-between p-4 border border-border dark:border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">QuickBooks</h4>
                    <p className="text-sm text-muted-foreground">Sync inventory valuation</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Link className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>

              {/* Mailchimp */}
              <div className="flex items-center justify-between p-4 border border-border dark:border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Mailchimp</h4>
                    <p className="text-sm text-muted-foreground">Product recommendations</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Link className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Commission Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Set default commission rates for product categories
            </p>
            <div className="space-y-3">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="15"
                      className="w-20 h-8 text-center"
                      defaultValue={15}
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Commission Rules
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ----------------------------- Product Modal Component ------------------------------------

  const ProductModal = () => {
    const [formData, setFormData] = useState({
      entity_name: '',
      entity_code: '',
      barcode: '',
      sku: '',
      category_id: '',
      ownership_type: 'salon' as 'salon' | 'consignment',
      owner_name: '',
      usage_type: 'retail' as 'retail' | 'professional',
      unit_cost: 0,
      retail_price: 0,
      stock_on_hand: 0,
      reorder_point: 10,
      reorder_quantity: 20,
      commission_rate: 0,
      commission_type: 'percentage' as 'percentage' | 'fixed'
    })

    const handleSaveProduct = async () => {
      setIsLoading(true)
      try {
        // Here you would call universalApi to create the product
        // In production, save product via API
        // await universalApi.createEntity(productEntity)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Close modal and refresh
        setShowProductModal(false)
        setFormData({
          entity_name: '',
          entity_code: '',
          barcode: '',
          sku: '',
          category_id: '',
          ownership_type: 'salon',
          owner_name: '',
          usage_type: 'retail',
          unit_cost: 0,
          retail_price: 0,
          stock_on_hand: 0,
          reorder_point: 10,
          reorder_quantity: 20,
          commission_rate: 0,
          commission_type: 'percentage'
        })
      } catch (error) {
        console.error('Error saving product:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!showProductModal) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedProduct ? 'Pencil Product' : 'Add New Product'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowProductModal(false)
                  setSelectedProduct(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <Input
                    value={formData.entity_name}
                    onChange={e => setFormData({ ...formData, entity_name: e.target.value })}
                    placeholder="e.g., Argan Oil Shampoo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Code *</label>
                  <Input
                    value={formData.entity_code}
                    onChange={e => setFormData({ ...formData, entity_code: e.target.value })}
                    placeholder="e.g., PRD-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Barcode</label>
                  <Input
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., SH-ARG-250"
                  />
                </div>
              </div>
            </div>

            {/* Category and Ownership */}
            <div className="space-y-4">
              <h3 className="font-semibold">Category & Ownership</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ownership Type</label>
                  <select
                    value={formData.ownership_type}
                    onChange={e =>
                      setFormData({ ...formData, ownership_type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="salon">Salon Owned</option>
                    <option value="consignment">Consignment</option>
                  </select>
                </div>
                {formData.ownership_type === 'consignment' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Owner Name</label>
                    <Input
                      value={formData.owner_name}
                      onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder="e.g., Beauty Brands LLC"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Usage Type</label>
                  <select
                    value={formData.usage_type}
                    onChange={e => setFormData({ ...formData, usage_type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="retail">Retail Sale</option>
                    <option value="professional">Professional Use Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="space-y-4">
              <h3 className="font-semibold">Pricing & Stock</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Cost</label>
                  <Input
                    type="number"
                    value={formData.unit_cost}
                    onChange={e =>
                      setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
                {formData.usage_type === 'retail' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Retail Price</label>
                    <Input
                      type="number"
                      value={formData.retail_price}
                      onChange={e =>
                        setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Stock</label>
                  <Input
                    type="number"
                    value={formData.stock_on_hand}
                    onChange={e =>
                      setFormData({ ...formData, stock_on_hand: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reorder Point</label>
                  <Input
                    type="number"
                    value={formData.reorder_point}
                    onChange={e =>
                      setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })
                    }
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reorder Quantity</label>
                  <Input
                    type="number"
                    value={formData.reorder_quantity}
                    onChange={e =>
                      setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })
                    }
                    placeholder="20"
                  />
                </div>
              </div>
            </div>

            {/* Commission Settings */}
            {formData.usage_type === 'retail' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Commission Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Commission Type</label>
                    <select
                      value={formData.commission_type}
                      onChange={e =>
                        setFormData({ ...formData, commission_type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Commission{' '}
                      {formData.commission_type === 'percentage' ? 'Rate (%)' : 'Amount (AED)'}
                    </label>
                    <Input
                      type="number"
                      value={formData.commission_rate}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          commission_rate: parseFloat(e.target.value) || 0
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductModal(false)
                  setSelectedProduct(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={
                  isLoading ||
                  !formData.entity_name ||
                  !formData.entity_code ||
                  !formData.category_id
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {selectedProduct ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ----------------------------- Main Render ------------------------------------

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-50/30 dark:from-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 dark:bg-background/80 backdrop-blur-xl border-b border-border dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Inventory Management
                </h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Track products, manage stock, and monitor commissions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-foreground"
                onClick={() => setShowProductModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="movements">
            <MovementsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Modal */}
      <ProductModal />
    </div>
  )
}
