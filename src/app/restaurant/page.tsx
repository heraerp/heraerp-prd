'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * HERA Restaurant FOH & Sales Module
 * Smart Code: HERA.RESTAURANT.FOH.POS.v1
 *
 * Front of House operations using Sacred Six Tables
 */

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { universalApi } from '@/src/lib/universal-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import {
  Coffee,
  ShoppingCart,
  Users,
  CreditCard,
  Clock,
  AlertCircle,
  ChefHat,
  TableProperties,
  Receipt,
  DollarSign,
  Loader2
} from 'lucide-react'

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

// Import restaurant components
import { RestaurantDashboard } from '@/src/components/restaurant/RestaurantDashboard'
import { POSTerminal } from '@/src/components/restaurant/POSTerminal'
import { MenuManagement } from '@/src/components/restaurant/MenuManagement'
import { TableManagement } from '@/src/components/restaurant/TableManagement'
import { KitchenDisplay } from '@/src/components/restaurant/KitchenDisplay'
import { PaymentProcessing } from '@/src/components/restaurant/PaymentProcessing'
import { InventoryManagement } from '@/src/components/restaurant/InventoryManagement'
import { SuppliersManagement } from '@/src/components/restaurant/SuppliersManagement'
import { OrderManagement } from '@/src/components/restaurant/OrderManagement'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Entity smart codes
    MENU_ITEM: 'HERA.RESTAURANT.FOH.MENU.ITEM.v1',
    TABLE: 'HERA.RESTAURANT.FOH.TABLE.v1',
    KITCHEN_STATION: 'HERA.RESTAURANT.FOH.KITCHEN.STATION.v1',

    // Transaction smart codes
    SALE: 'HERA.RESTAURANT.FOH.POS.SALE.v1',
    REFUND: 'HERA.RESTAURANT.FOH.POS.REFUND.v1',
    PREAUTH: 'HERA.RESTAURANT.FOH.POS.PREAUTH.v1',

    // Line item smart codes
    LINE_ITEM: 'HERA.RESTAURANT.FOH.POS.LINE.ITEM.v1',
    LINE_MODIFIER: 'HERA.RESTAURANT.FOH.POS.LINE.MODIFIER.v1',
    LINE_DISCOUNT: 'HERA.RESTAURANT.FOH.POS.LINE.DISCOUNT.v1',
    LINE_TAX: 'HERA.RESTAURANT.FOH.POS.LINE.TAX.v1',
    LINE_TIP: 'HERA.RESTAURANT.FOH.POS.LINE.TIP.v1',

    // Inventory smart codes
    INVENTORY_ITEM: 'HERA.RESTAURANT.INV.ITEM.v1',
    SUPPLIER: 'HERA.RESTAURANT.INV.SUPPLIER.v1',
    INVENTORY_LOCATION: 'HERA.RESTAURANT.INV.LOCATION.v1',
    PURCHASE_ORDER: 'HERA.RESTAURANT.INV.PO.v1',
    GOODS_RECEIPT: 'HERA.RESTAURANT.INV.RECEIPT.v1',
    INVENTORY_ADJUSTMENT: 'HERA.RESTAURANT.INV.ADJUSTMENT.v1',
    INVENTORY_COUNT: 'HERA.RESTAURANT.INV.COUNT.v1',
    INVENTORY_TRANSFER: 'HERA.RESTAURANT.INV.TRANSFER.v1',

    // Supplier smart codes
    SUPPLIER_CONTACT: 'HERA.RESTAURANT.SUP.CONTACT.v1',
    SUPPLIER_CATEGORY: 'HERA.RESTAURANT.SUP.CATEGORY.v1',
    PURCHASE_INVOICE: 'HERA.RESTAURANT.SUP.INVOICE.v1',
    SUPPLIER_PAYMENT: 'HERA.RESTAURANT.SUP.PAYMENT.v1',
    SUPPLIER_RETURN: 'HERA.RESTAURANT.SUP.RETURN.v1'
  }
}

function RestaurantContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState({
    tables: 0,
    menuItems: 0,
    openOrders: 0,
    dailySales: 0
  })

  // Always use demo mode (like salon-data)
  const isDemoMode = true

  useEffect(() => {
    if (!isDemoMode) {
      // Set organization context for API calls
      universalApi.setOrganizationId(RESTAURANT_CONFIG.organizationId)
      loadSystemStatus()
    } else {
      // Set demo data
      setSystemStatus({
        tables: 24,
        menuItems: 87,
        openOrders: 12,
        dailySales: 15487.5
      })
    }
  }, [isDemoMode])

  const loadSystemStatus = async () => {
    setIsLoading(true)
    try {
      // Load tables
      const tables = await universalApi.getEntities({
        entity_type: 'table',
        smart_code: RESTAURANT_CONFIG.smartCodes.TABLE
      })

      // Load menu items
      const menuItems = await universalApi.getEntities({
        entity_type: 'menu_item',
        smart_code: RESTAURANT_CONFIG.smartCodes.MENU_ITEM
      })

      // Load today's transactions
      const today = new Date().toISOString().split('T')[0]
      const sales = await universalApi.getTransactions({
        transaction_type: 'sale',
        smart_code: RESTAURANT_CONFIG.smartCodes.SALE,
        date_from: today
      })

      // Calculate open orders (sales without completion relationship)
      const openOrders = sales.filter(s => s.status !== 'completed').length
      const dailySalesTotal = sales
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.total_amount || 0), 0)

      setSystemStatus({
        tables: tables.length,
        menuItems: menuItems.length,
        openOrders,
        dailySales: dailySalesTotal
      })
    } catch (err) {
      setError('Failed to load restaurant status')
      console.error('Error loading status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
          <ChefHat className="h-10 w-10 text-primary" />
          Restaurant FOH & Sales
        </h1>
        <p className="text-muted-foreground">
          {isDemoMode ? "Demo Mode - Mario's Authentic Italian Restaurant" : 'Live System'}
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TableProperties className="h-4 w-4" />
              Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{systemStatus.tables}</p>
            <p className="text-xs text-muted-foreground">Total tables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Menu Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{systemStatus.menuItems}</p>
            <p className="text-xs text-muted-foreground">Active items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Open Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{systemStatus.openOrders}</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${systemStatus.dailySales.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-9 w-full mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <RestaurantDashboard
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="pos">
          <POSTerminal
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="menu">
          <MenuManagement
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="tables">
          <TableManagement
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="kitchen">
          <KitchenDisplay
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentProcessing
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagement
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>

        <TabsContent value="suppliers">
          <SuppliersManagement
            organizationId={RESTAURANT_CONFIG.organizationId}
            smartCodes={RESTAURANT_CONFIG.smartCodes}
            isDemoMode={isDemoMode}
          />
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're viewing the restaurant module in demo mode. Sign in to access the live system.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function RestaurantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="mt-2 text-muted-foreground dark:text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <RestaurantContent />
    </Suspense>
  )
}
