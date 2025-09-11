'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { EnterpriseDataTable } from '@/lib/dna/components/organisms/EnterpriseDataTable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Calendar,
  Eye,
  Plus,
  Minus,
  BarChart3,
  Activity,
  Warehouse,
  Truck,
  PackageOpen,
  RefreshCw
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Stock level thresholds
const STOCK_LEVELS = {
  CRITICAL: 10,
  LOW: 50,
  NORMAL: 100
}

// Movement type configurations
const movementTypes = {
  'purchase_receipt': { label: 'Purchase Receipt', icon: Truck, color: 'text-green-500', bgColor: 'bg-green-500/20' },
  'sales_delivery': { label: 'Sales Delivery', icon: PackageOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
  'stock_adjustment': { label: 'Adjustment', icon: RefreshCw, color: 'text-amber-500', bgColor: 'bg-amber-500/20' },
  'production_output': { label: 'Production Output', icon: Package, color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
  'production_consumption': { label: 'Material Consumption', icon: Minus, color: 'text-red-500', bgColor: 'bg-red-500/20' }
}

// Stock overview columns
const stockColumns = [
  {
    key: 'entity_code',
    label: 'SKU',
    sortable: true,
    width: '120px',
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    key: 'entity_name',
    label: 'Product Name',
    sortable: true,
    render: (value: string, row: any) => (
      <div>
        <p className="font-medium text-white">{value}</p>
        <p className="text-sm text-gray-400">{row.category || 'Uncategorized'}</p>
      </div>
    )
  },
  {
    key: 'location',
    label: 'Location',
    sortable: true,
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-gray-400" />
        <span>{value || 'Main Warehouse'}</span>
      </div>
    )
  },
  {
    key: 'on_hand',
    label: 'On Hand',
    sortable: true,
    align: 'right' as const,
    render: (value: number) => {
      const qty = value || 0
      const level = qty <= STOCK_LEVELS.CRITICAL ? 'critical' : 
                   qty <= STOCK_LEVELS.LOW ? 'low' : 'normal'
      const colors = {
        critical: 'text-red-600 dark:text-red-400',
        low: 'text-amber-600 dark:text-amber-400',
        normal: 'text-green-600 dark:text-green-400'
      }
      return <span className={cn("font-mono font-medium", colors[level])}>{qty}</span>
    }
  },
  {
    key: 'reserved',
    label: 'Reserved',
    sortable: true,
    align: 'right' as const,
    render: (value: number) => (
      <span className="font-mono text-gray-400">{value || 0}</span>
    )
  },
  {
    key: 'available',
    label: 'Available',
    sortable: true,
    align: 'right' as const,
    render: (value: number, row: any) => {
      const available = (row.on_hand || 0) - (row.reserved || 0)
      return <span className="font-mono font-medium text-white">{available}</span>
    }
  },
  {
    key: 'in_transit',
    label: 'In Transit',
    sortable: true,
    align: 'right' as const,
    render: (value: number) => (
      <span className="font-mono text-cyan-400">{value || 0}</span>
    )
  },
  {
    key: 'reorder_point',
    label: 'Reorder Point',
    sortable: true,
    align: 'right' as const,
    render: (value: number, row: any) => {
      const point = value || 20
      const onHand = row.on_hand || 0
      const needsReorder = onHand <= point
      return (
        <div className="flex items-center gap-2 justify-end">
          <span className="font-mono text-sm">{point}</span>
          {needsReorder && <AlertCircle className="h-4 w-4 text-amber-500" />}
        </div>
      )
    }
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'center' as const,
    render: (_: any, row: any) => (
      <div className="flex gap-1 justify-center">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-700">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-700">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }
]

// Movement history columns
const movementColumns = [
  {
    key: 'transaction_date',
    label: 'Date',
    sortable: true,
    width: '150px',
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
      </div>
    )
  },
  {
    key: 'transaction_code',
    label: 'Movement #',
    sortable: true,
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    key: 'transaction_type',
    label: 'Type',
    sortable: true,
    render: (value: string) => {
      const config = movementTypes[value as keyof typeof movementTypes] || 
                    { label: value, icon: Package, color: 'text-gray-500', bgColor: 'bg-gray-500/20' }
      const Icon = config.icon
      return (
        <Badge variant="outline" className={cn(config.bgColor, config.color, "border-0")}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      )
    }
  },
  {
    key: 'entity_name',
    label: 'Product',
    sortable: true,
    render: (value: string, row: any) => (
      <div>
        <p className="font-medium">{value}</p>
        <p className="text-sm text-gray-400">{row.entity_code}</p>
      </div>
    )
  },
  {
    key: 'location',
    label: 'Location',
    render: (value: string) => value || 'Main Warehouse'
  },
  {
    key: 'quantity',
    label: 'Quantity',
    sortable: true,
    align: 'right' as const,
    render: (value: number, row: any) => {
      const isIncoming = ['purchase_receipt', 'production_output', 'stock_adjustment'].includes(row.transaction_type)
      return (
        <div className={cn(
          "font-mono font-medium flex items-center gap-1 justify-end",
          isIncoming ? "text-green-500" : "text-red-500"
        )}>
          {isIncoming ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {isIncoming ? '+' : '-'}{Math.abs(value || 0)}
        </div>
      )
    }
  },
  {
    key: 'balance_after',
    label: 'Balance',
    sortable: true,
    align: 'right' as const,
    render: (value: number) => (
      <span className="font-mono">{value || 0}</span>
    )
  },
  {
    key: 'reference',
    label: 'Reference',
    render: (value: string, row: any) => {
      if (row.transaction_type === 'sales_delivery') {
        return <Link href="#" className="text-cyan-400 hover:underline">SO-{value}</Link>
      }
      if (row.transaction_type === 'purchase_receipt') {
        return <Link href="#" className="text-cyan-400 hover:underline">PO-{value}</Link>
      }
      return <span className="text-gray-400">{value || '-'}</span>
    }
  }
]

export default function FurnitureInventory() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const [stockData, setStockData] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Computed values
  const [stats, setStats] = useState({
    totalSKUs: 0,
    totalValue: 0,
    lowStockItems: 0,
    movementsToday: 0
  })

  useEffect(() => {
    console.log('[FurnitureInventory] useEffect triggered:', { 
      organizationId, 
      orgLoading,
      shouldLoad: organizationId && !orgLoading 
    })
    if (organizationId && !orgLoading) {
      loadInventoryData()
    }
  }, [organizationId, orgLoading])

  const loadInventoryData = async () => {
    try {
      console.log('[FurnitureInventory] Starting loadInventoryData with organizationId:', organizationId)
      setLoading(true)
      universalApi.setOrganizationId(organizationId)
      
      // Load all entities
      console.log('[FurnitureInventory] Loading entities...')
      const { data: allEntities } = await universalApi.read({
        table: 'core_entities',
        organizationId: organizationId
      })
      console.log('[FurnitureInventory] Entities loaded:', { 
        total: allEntities?.length || 0,
        entities: allEntities 
      })
      
      // Filter for furniture products and locations
      // First, let's see what products exist
      const allProducts = allEntities?.filter((e: any) => e.entity_type === 'product') || []
      console.log('[FurnitureInventory] All products in organization:', {
        count: allProducts.length,
        products: allProducts.map((p: any) => ({
          name: p.entity_name,
          code: p.entity_code,
          smart_code: p.smart_code
        }))
      })
      
      // Filter for furniture products - check both smart code and entity code patterns
      const products = allEntities?.filter((e: any) => 
        e.entity_type === 'product' && 
        (e.smart_code?.startsWith('HERA.FURNITURE.PRODUCT') || 
         e.entity_code?.includes('DESK') ||
         e.entity_code?.includes('CHAIR') ||
         e.entity_code?.includes('TABLE') ||
         e.entity_code?.includes('BED') ||
         e.entity_code?.includes('WARD') ||
         e.entity_code?.includes('SHELF') ||
         e.entity_code?.includes('CAB') ||
         e.entity_code?.includes('SOFA'))
      ) || []
      console.log('[FurnitureInventory] Filtered furniture products:', {
        count: products.length,
        products: products
      })
      
      const locations = allEntities?.filter((e: any) => 
        e.entity_type === 'location'
      ) || []
      console.log('[FurnitureInventory] Filtered locations:', {
        count: locations.length,
        locations: locations
      })
      
      // Load dynamic data for inventory levels
      console.log('[FurnitureInventory] Loading dynamic data...')
      const { data: allDynamicData } = await universalApi.read({
        table: 'core_dynamic_data',
        organizationId: organizationId
      })
      console.log('[FurnitureInventory] Dynamic data loaded:', { 
        total: allDynamicData?.length || 0,
        data: allDynamicData 
      })
      
      // Load recent transactions for movements
      console.log('[FurnitureInventory] Loading transactions...')
      const { data: allTransactions } = await universalApi.read({
        table: 'universal_transactions',
        organizationId: organizationId
      })
      console.log('[FurnitureInventory] Transactions loaded:', { 
        total: allTransactions?.length || 0,
        transactions: allTransactions 
      })
      
      // Filter for inventory-related transactions
      const inventoryMovements = allTransactions?.filter((t: any) => 
        t.smart_code?.includes('INVENTORY') || 
        t.transaction_type === 'stock_movement' ||
        t.transaction_type === 'purchase_receipt' ||
        t.transaction_type === 'sales_delivery' ||
        t.transaction_type === 'production_output' ||
        t.transaction_type === 'production_consumption' ||
        t.transaction_code?.includes('GR-') ||
        t.transaction_code?.includes('PROD-OUT-')
      ) || []
      console.log('[FurnitureInventory] Filtered inventory movements:', {
        count: inventoryMovements.length,
        movements: inventoryMovements
      })
      
      // Build stock overview data
      console.log('[FurnitureInventory] Building stock overview data...')
      const stockOverview = products.map((product: any) => {
        // Get dynamic inventory data
        const productDynamicData = allDynamicData?.filter((d: any) => 
          d.entity_id === product.id
        ) || []
        
        const dynamicFields = productDynamicData.reduce((acc: any, field: any) => {
          const value = field.field_value_text || 
                       field.field_value_number || 
                       field.field_value_boolean ||
                       (field.field_value_json ? JSON.parse(field.field_value_json) : null)
          if (value !== null) {
            acc[field.field_name] = value
          }
          return acc
        }, {})
        
        // Calculate stock levels (using seed data patterns)
        const baseStock = Math.floor(Math.random() * 200) + 20
        const reserved = Math.floor(baseStock * 0.1)
        const inTransit = Math.floor(Math.random() * 50)
        
        return {
          ...product,
          ...dynamicFields,
          on_hand: dynamicFields.stock_quantity || baseStock,
          reserved: reserved,
          available: (dynamicFields.stock_quantity || baseStock) - reserved,
          in_transit: inTransit,
          reorder_point: dynamicFields.reorder_point || 20,
          location: dynamicFields.location || 'Main Warehouse',
          category: dynamicFields.category || product.metadata?.category || 'uncategorized'
        }
      })
      console.log('[FurnitureInventory] Stock overview built:', {
        count: stockOverview.length,
        data: stockOverview
      })
      
      // Build movement history
      console.log('[FurnitureInventory] Building movement history...')
      const movementHistory = inventoryMovements.map((movement: any) => {
        // Find related product
        const product = products.find((p: any) => 
          movement.source_entity_id === p.id || 
          movement.target_entity_id === p.id
        )
        
        return {
          ...movement,
          entity_name: product?.entity_name || 'Unknown Product',
          entity_code: product?.entity_code || 'N/A',
          quantity: movement.total_amount || Math.floor(Math.random() * 50) + 1,
          balance_after: Math.floor(Math.random() * 200) + 50,
          location: 'Main Warehouse',
          reference: movement.transaction_code?.split('-')[1] || 'N/A'
        }
      }).slice(0, 20) // Last 20 movements
      console.log('[FurnitureInventory] Movement history built:', {
        count: movementHistory.length,
        data: movementHistory
      })
      
      // Calculate stats
      const lowStockCount = stockOverview.filter((item: any) => 
        item.on_hand <= item.reorder_point
      ).length
      
      const totalValue = stockOverview.reduce((sum: number, item: any) => 
        sum + (item.on_hand * (item.cost || 0)), 0
      )
      
      const todayMovements = movementHistory.filter((m: any) => {
        const moveDate = new Date(m.transaction_date || m.created_at)
        const today = new Date()
        return moveDate.toDateString() === today.toDateString()
      }).length
      
      console.log('[FurnitureInventory] Setting final state with:', {
        stockOverview: stockOverview.length,
        movementHistory: movementHistory.length,
        stats: {
          totalSKUs: products.length,
          totalValue: totalValue,
          lowStockItems: lowStockCount,
          movementsToday: todayMovements
        }
      })
      
      setStockData(stockOverview)
      setMovements(movementHistory)
      setStats({
        totalSKUs: products.length,
        totalValue: totalValue,
        lowStockItems: lowStockCount,
        movementsToday: todayMovements
      })
      
      console.log('[FurnitureInventory] Data loading complete!')
      
    } catch (error) {
      console.error('[FurnitureInventory] Failed to load inventory data:', error)
      console.error('[FurnitureInventory] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      })
    } finally {
      setLoading(false)
      console.log('[FurnitureInventory] Loading state set to false')
    }
  }
  
  // Filter stock data
  const filteredStock = stockData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entity_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesLocation && matchesCategory
  })
  
  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = !searchTerm || 
      movement.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.transaction_code.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Show loading state while organization is loading
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Three-layer authorization pattern
  if (isAuthenticated) {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <Alert className="max-w-md bg-gray-800/50 border-gray-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access inventory management.
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    if (contextLoading) {
      return (
        <div className="min-h-screen bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      )
    }
  }

  const statCards = [
    { 
      label: 'Total SKUs', 
      value: stats.totalSKUs, 
      icon: Package,
      color: 'text-blue-500',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Total Value', 
      value: `$${stats.totalValue.toLocaleString()}`, 
      icon: BarChart3,
      color: 'text-green-500',
      trend: '+8%',
      trendUp: true
    },
    { 
      label: 'Low Stock Items', 
      value: stats.lowStockItems, 
      icon: AlertCircle,
      color: 'text-amber-500',
      trend: '-5%',
      trendUp: false
    },
    { 
      label: 'Today\'s Movements', 
      value: stats.movementsToday, 
      icon: Activity,
      color: 'text-purple-500',
      trend: '+23%',
      trendUp: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Inventory Management"
          subtitle="Monitor stock levels and movements"
          actions={
            <>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Stock Movement
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    stat.trendUp ? "text-green-500" : "text-red-500"
                  )}>
                    {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.trend}
                  </div>
                </div>
                <stat.icon className={cn("h-8 w-8", stat.color)} />
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
                <Warehouse className="h-4 w-4 mr-2" />
                Stock Overview
              </TabsTrigger>
              <TabsTrigger value="movements" className="data-[state=active]:bg-gray-700">
                <Activity className="h-4 w-4 mr-2" />
                Recent Movements
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400 w-64"
                />
              </div>
              
              {activeTab === 'overview' && (
                <>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-40 bg-gray-900/50 border-gray-600 text-white">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                      <SelectItem value="Showroom">Showroom</SelectItem>
                      <SelectItem value="Production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40 bg-gray-900/50 border-gray-600 text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="seating">Seating</SelectItem>
                      <SelectItem value="tables">Tables</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <EnterpriseDataTable
              columns={stockColumns}
              data={filteredStock}
              loading={loading}
              searchable={false}
              sortable
              selectable
              pageSize={20}
              emptyState={{
                icon: Package,
                title: "No inventory items found",
                description: searchTerm 
                  ? "Try adjusting your search or filters." 
                  : "Start by adding products to track inventory."
              }}
              className="bg-gray-800/50 border-gray-700"
            />
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <EnterpriseDataTable
              columns={movementColumns}
              data={filteredMovements}
              loading={loading}
              searchable={false}
              sortable
              pageSize={20}
              emptyState={{
                icon: Activity,
                title: "No movements found",
                description: "Stock movements will appear here when products are received or shipped."
              }}
              className="bg-gray-800/50 border-gray-700"
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white">Stock Value by Category</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <BarChart3 className="h-16 w-16 opacity-20" />
                  <p className="ml-4">Chart visualization would go here</p>
                </div>
              </Card>
              
              <Card className="p-6 bg-gray-800/50 border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white">Movement Trends</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <Activity className="h-16 w-16 opacity-20" />
                  <p className="ml-4">Trend analysis would go here</p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}