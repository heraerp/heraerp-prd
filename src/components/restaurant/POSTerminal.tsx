'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { universalApi } from '@/lib/universal-api'
import { formatCurrency, extractData } from '@/lib/universal-helpers'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  DollarSign,
  Percent,
  User,
  Search,
  Coffee,
  Pizza,
  Salad,
  IceCream,
  Wine,
  Soup,
  Beef,
  Fish,
  Receipt,
  Calculator,
  Loader2,
  Check,
  ArrowLeft,
  Grid3x3,
  List,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  Home,
  Package,
  Truck,
  Utensils,
  Hash,
  AlertCircle,
  Trash2,
  Edit,
  UserPlus,
  Table
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import Link from 'next/link'

interface POSTerminalProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

interface MenuItem {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    category?: string
    price?: number
    description?: string
    image_url?: string
    available?: boolean
    modifiers?: string[]
    preparation_time?: number
    calories?: number
    tags?: string[]
  }
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  modifiers: string[]
  specialInstructions?: string
  lineTotal: number
}

interface RestaurantTable {
  id: string
  entity_name: string
  metadata?: {
    table_number?: number
    section?: string
    status?: string
  }
}

interface Customer {
  id: string
  entity_name: string
  metadata?: {
    phone?: string
    email?: string
    address?: string
    loyalty_points?: number
  }
}

// Category icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Appetizers: Coffee,
  Salads: Salad,
  Pizza: Pizza,
  Pasta: Soup,
  'Main Course': Beef,
  Seafood: Fish,
  Desserts: IceCream,
  Beverages: Wine
}

export function POSTerminal({ organizationId, smartCodes, isDemoMode = false }: POSTerminalProps) {
  const [loading, setLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [cashReceived, setCashReceived] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
    }
    loadData()
  }, [isDemoMode, organizationId])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        // Use demo data
        setMenuItems(generateDemoMenuItems())
        setTables(generateDemoTables())
      } else {
        // Load real data from database
        // Load menu items
        const menuResponse = await universalApi.getEntities({
          entity_type: 'menu_item',
          smart_code: smartCodes.MENU_ITEM
        })
        const menuData = extractData(menuResponse) as MenuItem[]

        // Create default items if none exist
        if (!menuData || menuData.length === 0) {
          await createDefaultMenuItems()
        } else {
          setMenuItems(menuData)
        }

        // Load tables
        const tableResponse = await universalApi.getEntities({
          entity_type: 'table',
          smart_code: smartCodes.TABLE
        })
        const tableData = extractData(tableResponse) as RestaurantTable[]

        if (!tableData || tableData.length === 0) {
          await createDefaultTables()
        } else {
          setTables(tableData)
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please refresh.')
      // Fall back to demo data on error
      setMenuItems(generateDemoMenuItems())
      setTables(generateDemoTables())
    } finally {
      setLoading(false)
    }
  }

  const createDefaultMenuItems = async () => {
    const defaultItems = generateDemoMenuItems()
    const createdItems: MenuItem[] = []

    for (const item of defaultItems.slice(0, 10)) {
      // Create first 10 items
      try {
        const result = await universalApi.createEntity({
          entity_type: 'menu_item',
          entity_name: item.entity_name,
          entity_code: item.entity_code,
          smart_code: smartCodes.MENU_ITEM,
          metadata: item.metadata
        })

        if (result.success && result.data) {
          createdItems.push(result.data as MenuItem)
        }
      } catch (err) {
        console.error('Error creating menu item:', err)
      }
    }

    setMenuItems(createdItems.length > 0 ? createdItems : defaultItems)
  }

  const createDefaultTables = async () => {
    const defaultTables = generateDemoTables()
    const createdTables: RestaurantTable[] = []

    for (const table of defaultTables.slice(0, 8)) {
      // Create first 8 tables
      try {
        const result = await universalApi.createEntity({
          entity_type: 'table',
          entity_name: table.entity_name,
          entity_code: `TBL-${(table.metadata as any)?.table_number?.toString().padStart(3, '0')}`,
          smart_code: smartCodes.TABLE,
          metadata: table.metadata
        })

        if (result.success && result.data) {
          createdTables.push(result.data as RestaurantTable)
        }
      } catch (err) {
        console.error('Error creating table:', err)
      }
    }

    setTables(createdTables.length > 0 ? createdTables : defaultTables)
  }

  // Generate demo menu items
  const generateDemoMenuItems = (): MenuItem[] => [
    // Appetizers
    {
      id: '1',
      entity_name: 'Bruschetta',
      entity_code: 'APP-001',
      metadata: {
        category: 'Appetizers',
        price: 8.5,
        description: 'Toasted bread with tomatoes and basil',
        available: true,
        preparation_time: 10
      }
    },
    {
      id: '2',
      entity_name: 'Calamari Fritti',
      entity_code: 'APP-002',
      metadata: {
        category: 'Appetizers',
        price: 12.5,
        description: 'Crispy fried calamari with marinara',
        available: true,
        preparation_time: 15
      }
    },
    {
      id: '3',
      entity_name: 'Garlic Bread',
      entity_code: 'APP-003',
      metadata: {
        category: 'Appetizers',
        price: 6.5,
        description: 'Fresh baked with garlic butter',
        available: true,
        preparation_time: 8
      }
    },

    // Salads
    {
      id: '4',
      entity_name: 'Caesar Salad',
      entity_code: 'SAL-001',
      metadata: {
        category: 'Salads',
        price: 11.0,
        description: 'Romaine, parmesan, croutons',
        available: true,
        modifiers: ['Add Chicken +$5', 'Add Shrimp +$8'],
        preparation_time: 10
      }
    },
    {
      id: '5',
      entity_name: 'Caprese Salad',
      entity_code: 'SAL-002',
      metadata: {
        category: 'Salads',
        price: 12.0,
        description: 'Fresh mozzarella, tomatoes, basil',
        available: true,
        preparation_time: 10
      }
    },

    // Pizza
    {
      id: '6',
      entity_name: 'Margherita Pizza',
      entity_code: 'PIZ-001',
      metadata: {
        category: 'Pizza',
        price: 16.0,
        description: 'Fresh mozzarella, tomato, basil',
        available: true,
        modifiers: ['Small -$3', 'Large +$4', 'Extra Cheese +$2'],
        preparation_time: 20
      }
    },
    {
      id: '7',
      entity_name: 'Pepperoni Pizza',
      entity_code: 'PIZ-002',
      metadata: {
        category: 'Pizza',
        price: 18.0,
        description: 'Mozzarella, pepperoni, tomato sauce',
        available: true,
        modifiers: ['Small -$3', 'Large +$4', 'Extra Cheese +$2'],
        preparation_time: 20
      }
    },
    {
      id: '8',
      entity_name: 'Quattro Formaggi',
      entity_code: 'PIZ-003',
      metadata: {
        category: 'Pizza',
        price: 19.0,
        description: 'Four cheese blend',
        available: true,
        modifiers: ['Small -$3', 'Large +$4'],
        preparation_time: 20
      }
    },

    // Pasta
    {
      id: '9',
      entity_name: 'Spaghetti Carbonara',
      entity_code: 'PAS-001',
      metadata: {
        category: 'Pasta',
        price: 15.0,
        description: 'Egg, pancetta, parmesan',
        available: true,
        preparation_time: 15
      }
    },
    {
      id: '10',
      entity_name: 'Penne Arrabbiata',
      entity_code: 'PAS-002',
      metadata: {
        category: 'Pasta',
        price: 13.0,
        description: 'Spicy tomato sauce',
        available: true,
        modifiers: ['Extra Spicy', 'Add Sausage +$4'],
        preparation_time: 15
      }
    },
    {
      id: '11',
      entity_name: 'Fettuccine Alfredo',
      entity_code: 'PAS-003',
      metadata: {
        category: 'Pasta',
        price: 14.0,
        description: 'Cream sauce with parmesan',
        available: true,
        modifiers: ['Add Chicken +$5', 'Add Shrimp +$8'],
        preparation_time: 15
      }
    },

    // Main Course
    {
      id: '12',
      entity_name: 'Grilled Salmon',
      entity_code: 'MAIN-001',
      metadata: {
        category: 'Main Course',
        price: 26.0,
        description: 'With lemon butter sauce',
        available: true,
        preparation_time: 25
      }
    },
    {
      id: '13',
      entity_name: 'Chicken Parmigiana',
      entity_code: 'MAIN-002',
      metadata: {
        category: 'Main Course',
        price: 22.0,
        description: 'Breaded chicken with marinara',
        available: true,
        preparation_time: 20
      }
    },
    {
      id: '14',
      entity_name: 'Osso Buco',
      entity_code: 'MAIN-003',
      metadata: {
        category: 'Main Course',
        price: 32.0,
        description: 'Braised veal shanks',
        available: true,
        preparation_time: 30
      }
    },

    // Desserts
    {
      id: '15',
      entity_name: 'Tiramisu',
      entity_code: 'DES-001',
      metadata: {
        category: 'Desserts',
        price: 8.0,
        description: 'Classic Italian dessert',
        available: true,
        preparation_time: 5
      }
    },
    {
      id: '16',
      entity_name: 'Panna Cotta',
      entity_code: 'DES-002',
      metadata: {
        category: 'Desserts',
        price: 7.0,
        description: 'With berry sauce',
        available: true,
        preparation_time: 5
      }
    },
    {
      id: '17',
      entity_name: 'Gelato',
      entity_code: 'DES-003',
      metadata: {
        category: 'Desserts',
        price: 6.0,
        description: 'Choice of flavors',
        available: true,
        modifiers: ['Vanilla', 'Chocolate', 'Pistachio', 'Strawberry'],
        preparation_time: 2
      }
    },

    // Beverages
    {
      id: '18',
      entity_name: 'Soft Drinks',
      entity_code: 'BEV-001',
      metadata: {
        category: 'Beverages',
        price: 3.5,
        description: 'Coke, Sprite, Orange',
        available: true,
        preparation_time: 1
      }
    },
    {
      id: '19',
      entity_name: 'Italian Soda',
      entity_code: 'BEV-002',
      metadata: {
        category: 'Beverages',
        price: 4.5,
        description: 'Various flavors',
        available: true,
        preparation_time: 2
      }
    },
    {
      id: '20',
      entity_name: 'Espresso',
      entity_code: 'BEV-003',
      metadata: {
        category: 'Beverages',
        price: 3.0,
        description: 'Double shot',
        available: true,
        preparation_time: 2
      }
    },
    {
      id: '21',
      entity_name: 'Cappuccino',
      entity_code: 'BEV-004',
      metadata: {
        category: 'Beverages',
        price: 4.5,
        description: 'With steamed milk',
        available: true,
        preparation_time: 3
      }
    }
  ]

  // Generate demo tables
  const generateDemoTables = (): RestaurantTable[] => [
    {
      id: 't1',
      entity_name: 'Table 1',
      metadata: { table_number: 1, section: 'Main Dining', status: 'available' }
    },
    {
      id: 't2',
      entity_name: 'Table 2',
      metadata: { table_number: 2, section: 'Main Dining', status: 'occupied' }
    },
    {
      id: 't3',
      entity_name: 'Table 3',
      metadata: { table_number: 3, section: 'Main Dining', status: 'available' }
    },
    {
      id: 't4',
      entity_name: 'Table 4',
      metadata: { table_number: 4, section: 'Main Dining', status: 'available' }
    },
    {
      id: 't5',
      entity_name: 'Table 5',
      metadata: { table_number: 5, section: 'Private Dining', status: 'available' }
    },
    {
      id: 't6',
      entity_name: 'Table 6',
      metadata: { table_number: 6, section: 'Private Dining', status: 'occupied' }
    },
    {
      id: 't7',
      entity_name: 'Table 7',
      metadata: { table_number: 7, section: 'Patio', status: 'available' }
    },
    {
      id: 't8',
      entity_name: 'Table 8',
      metadata: { table_number: 8, section: 'Patio', status: 'available' }
    }
  ]

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(c => c.menuItem.id === item.id)

    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1)
    } else {
      setCart([
        ...cart,
        {
          menuItem: item,
          quantity: 1,
          modifiers: [],
          lineTotal: (item.metadata as any)?.price || 0
        }
      ])
    }
  }

  // Update quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(
      cart.map(item =>
        item.menuItem.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * ((item.menuItem.metadata as any)?.price || 0)
            }
          : item
      )
    )
  }

  // Remove from cart
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.menuItem.id !== itemId))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    setSelectedTable('')
    setCustomerName('')
    setCustomerPhone('')
    setDeliveryAddress('')
    setDiscountPercent(0)
    setCashReceived('')
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const discountAmount = subtotal * (discountPercent / 100)
  const taxAmount = (subtotal - discountAmount) * 0.05 // 5% tax
  const total = subtotal - discountAmount + taxAmount

  // Calculate change for cash payment
  const cashAmount = parseFloat(cashReceived) || 0
  const change = cashAmount - total

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory =
      selectedCategory === 'all' || (item.metadata as any)?.category === selectedCategory
    const matchesSearch =
      searchTerm === '' ||
      item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.metadata as any)?.description?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCategory && matchesSearch && (item.metadata as any)?.available !== false
  })

  // Get categories
  const categories = [
    'all',
    ...Array.from(new Set(menuItems.map(item => (item.metadata as any)?.category).filter(Boolean)))
  ]

  // Process order
  const processOrder = async () => {
    if (cart.length === 0) return

    // Validate required fields
    if (orderType === 'dine-in' && !selectedTable) {
      setError('Please select a table')
      return
    }

    if (orderType === 'delivery' && (!customerName || !customerPhone || !deliveryAddress)) {
      setError('Please fill in delivery details')
      return
    }

    if (orderType === 'takeout' && (!customerName || !customerPhone)) {
      setError('Please fill in customer details')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Create order transaction
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

      const orderData = {
        transaction_type: 'sale',
        transaction_code: orderNumber,
        smart_code: smartCodes.ORDER_SALE,
        total_amount: total,
        metadata: {
          order_number: orderNumber,
          order_type: orderType,
          table_number: orderType === 'dine-in' ? parseInt(selectedTable.split('-')[1]) : undefined,
          customer_name: customerName || 'Walk-in',
          customer_phone: customerPhone,
          delivery_address: orderType === 'delivery' ? deliveryAddress : undefined,
          status: 'new',
          kitchen_status: 'pending',
          payment_status: 'paid',
          payment_method: paymentMethod,
          items_count: cart.length,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          subtotal: subtotal,
          created_at: new Date().toISOString()
        }
      }

      if (!isDemoMode) {
        // Create transaction with line items
        const lineItems = cart.map((item, index) => ({
          line_number: index + 1,
          line_entity_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: (item.menuItem.metadata as any)?.price || 0,
          line_amount: item.lineTotal,
          smart_code: smartCodes.ORDER_LINE,
          metadata: {
            item_name: item.menuItem.entity_name,
            item_code: item.menuItem.entity_code,
            category: (item.menuItem.metadata as any)?.category,
            modifiers: item.modifiers,
            special_requests: item.specialInstructions
          }
        }))

        const result = await universalApi.createTransactionWithLines(orderData, lineItems)

        if (result.success) {
          alert(`Order ${orderNumber} created successfully!`)
          clearCart()
          setShowPayment(false)
        } else {
          throw new Error('Failed to create order')
        }
      } else {
        // Demo mode - simulate success
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert(`Order ${orderNumber} created successfully!`)
        clearCart()
        setShowPayment(false)
      }
    } catch (err) {
      console.error('Error processing order:', err)
      setError('Failed to process order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full bg-muted dark:bg-background">
      {/* Left Panel - Menu Items */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-background dark:bg-muted border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/restaurant">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">POS Terminal</h1>
              <Badge variant="outline" className="text-sm">
                {formatDate(new Date(), 'MMM dd, yyyy HH:mm')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const Icon = CATEGORY_ICONS[(item.metadata as any)?.category || ''] || Coffee
                return (
                  <Card
                    key={item.id}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => addToCart(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-lg font-bold">
                          {formatCurrency((item.metadata as any)?.price || 0)}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{item.entity_name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {(item.metadata as any)?.description}
                      </p>
                      {(item.metadata as any)?.modifiers && item.metadata.modifiers.length > 0 && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Customizable
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => {
                const Icon = CATEGORY_ICONS[(item.metadata as any)?.category || ''] || Coffee
                return (
                  <Card key={item.id} className="cursor-pointer" onClick={() => addToCart(item)}>
                    <CardContent className="p-3 flex items-center gap-4">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{item.entity_name}</h3>
                          <span className="font-bold">
                            {formatCurrency((item.metadata as any)?.price || 0)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(item.metadata as any)?.description}
                        </p>
                      </div>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 bg-background dark:bg-muted border-l flex flex-col">
        {/* Order Type Selector */}
        <div className="p-4 border-b">
          <Label className="text-sm font-medium mb-2 block">Order Type</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={orderType === 'dine-in' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('dine-in')}
            >
              <Utensils className="h-4 w-4 mr-1" />
              Dine-in
            </Button>
            <Button
              variant={orderType === 'takeout' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('takeout')}
            >
              <Package className="h-4 w-4 mr-1" />
              Takeout
            </Button>
            <Button
              variant={orderType === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('delivery')}
            >
              <Truck className="h-4 w-4 mr-1" />
              Delivery
            </Button>
          </div>
        </div>

        {/* Table Selection for Dine-in */}
        {orderType === 'dine-in' && (
          <div className="p-4 border-b">
            <Label className="text-sm font-medium mb-2 block">Select Table</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent>
                {tables
                  .filter(table => (table.metadata as any)?.status === 'available')
                  .map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.entity_name} - {(table.metadata as any)?.section}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Customer Info for Takeout/Delivery */}
        {(orderType === 'takeout' || orderType === 'delivery') && (
          <div className="p-4 border-b space-y-3">
            <div>
              <Label className="text-sm">Customer Name</Label>
              <Input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label className="text-sm">Phone Number</Label>
              <Input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+1-555-0123"
              />
            </div>
            {orderType === 'delivery' && (
              <div>
                <Label className="text-sm">Delivery Address</Label>
                <Input
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="123 Main St, City"
                />
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          <h3 className="font-semibold mb-3">Order Items</h3>
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <Card key={item.menuItem.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.menuItem.entity_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency((item.menuItem.metadata as any)?.price || 0)} each
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.menuItem.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals and Actions */}
        <div className="border-t p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
            >
              <Percent className="h-4 w-4 mr-1" />
              Discount
            </Button>
            <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0 || processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Charge {formatCurrency(total)}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Discount Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map(percent => (
                <Button key={percent} variant="outline" onClick={() => setDiscountPercent(percent)}>
                  {percent}%
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCheckout(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{formatCurrency(total)}</p>
              <p className="text-muted-foreground">Total Amount Due</p>
            </div>
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Card
                </Button>
                <Button
                  variant={paymentMethod === 'online' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('online')}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Online
                </Button>
              </div>
            </div>
            {paymentMethod === 'cash' && (
              <div>
                <Label>Cash Received</Label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="Enter amount received"
                  className="text-lg"
                />
                {cashAmount > 0 && (
                  <div className="mt-2 p-3 bg-muted dark:bg-background/20 rounded">
                    <div className="flex justify-between items-center">
                      <span>Change:</span>
                      <span
                        className={`text-lg font-bold ${change >= 0 ?'text-emerald-600' : 'text-rose-600'}`}
                      >
                        {formatCurrency(Math.abs(change))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>
              Cancel
            </Button>
            <Button
              onClick={processOrder}
              disabled={processing || (paymentMethod === 'cash' && change < 0)}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Complete Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
