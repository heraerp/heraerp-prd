'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Separator } from '@/src/components/ui/separator'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/src/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { universalApi } from '@/src/lib/universal-api'
import { formatCurrency, extractData } from '@/src/lib/universal-helpers'
import Image from 'next/image'
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
  Table,
  ImageIcon,
  Upload,
  Star,
  Sparkles,
  ShoppingBag,
  CoffeeIcon
} from 'lucide-react'
import { formatDate } from '@/src/lib/date-utils'
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
    rating?: number
    popular?: boolean
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

// Custom Dialog Components with forced dark theme
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-lg duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2',
        'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'rounded-lg bg-background border border-border text-foreground',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none text-foreground hover:text-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

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

// Beautiful gradient backgrounds for categories
const CATEGORY_GRADIENTS: Record<string, string> = {
  Appetizers: 'from-amber-400/20 to-orange-500/20',
  Salads: 'from-emerald-400/20 to-green-500/20',
  Pizza: 'from-red-400/20 to-orange-500/20',
  Pasta: 'from-yellow-400/20 to-amber-500/20',
  'Main Course': 'from-rose-400/20 to-pink-500/20',
  Seafood: 'from-cyan-400/20 to-blue-500/20',
  Desserts: 'from-purple-400/20 to-pink-500/20',
  Beverages: 'from-indigo-400/20 to-purple-500/20'
}

export function POSTerminalGlass({
  organizationId,
  smartCodes,
  isDemoMode = false
}: POSTerminalProps) {
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

  // Generate demo menu items with images
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
        preparation_time: 10,
        image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
        rating: 4.5,
        popular: true
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
        preparation_time: 15,
        image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
        rating: 4.7
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
        preparation_time: 8,
        image_url: 'https://images.unsplash.com/photo-1619531040576-f9416aeaec92?w=400',
        rating: 4.3
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
        preparation_time: 10,
        image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400',
        rating: 4.6
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
        preparation_time: 10,
        image_url: 'https://images.unsplash.com/photo-1608032077018-c9aaa7c7b9dc?w=400',
        rating: 4.8,
        popular: true
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
        preparation_time: 20,
        image_url: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400',
        rating: 4.9,
        popular: true
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
        preparation_time: 20,
        image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
        rating: 4.7
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
        preparation_time: 20,
        image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400',
        rating: 4.6
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
        preparation_time: 15,
        image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
        rating: 4.8,
        popular: true
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
        preparation_time: 15,
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
        rating: 4.5
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
        preparation_time: 15,
        image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400',
        rating: 4.6
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
        preparation_time: 25,
        image_url: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400',
        rating: 4.9,
        popular: true
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
        preparation_time: 20,
        image_url: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400',
        rating: 4.7
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
        preparation_time: 30,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
        rating: 4.8
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
        preparation_time: 5,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
        rating: 4.9,
        popular: true
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
        preparation_time: 5,
        image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
        rating: 4.6
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
        preparation_time: 2,
        image_url: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400',
        rating: 4.7
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
        preparation_time: 1,
        image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
        rating: 4.2
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
        preparation_time: 2,
        image_url: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400',
        rating: 4.5
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
        preparation_time: 2,
        image_url: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400',
        rating: 4.8
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
        preparation_time: 3,
        image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
        rating: 4.7
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

    return matchesCategory && matchesSearch && (item.metadata as any)?.available
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
      alert('Please select a table')
      return
    }

    if (orderType === 'delivery' && (!customerName || !customerPhone || !deliveryAddress)) {
      alert('Please fill in delivery details')
      return
    }

    if (orderType === 'takeout' && (!customerName || !customerPhone)) {
      alert('Please fill in customer details')
      return
    }

    setProcessing(true)
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
          payment_status: 'paid',
          payment_method: paymentMethod,
          items_count: cart.length,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          created_at: new Date().toISOString()
        }
      }

      // Create transaction
      const result = await universalApi.createTransaction(orderData)

      if (result.success && result.data) {
        // Create line items
        const transactionId = result.data.id

        const linePromises = cart.map((item, index) =>
          universalApi.createTransactionLine({
            transaction_id: transactionId,
            line_number: index + 1,
            line_entity_id: item.menuItem.id,
            quantity: item.quantity,
            unit_price: (item.menuItem.metadata as any)?.price || 0,
            line_amount: item.lineTotal,
            smart_code: smartCodes.ORDER_LINE,
            metadata: {
              item_name: item.menuItem.entity_name,
              modifiers: item.modifiers,
              special_instructions: item.specialInstructions
            }
          })
        )

        await Promise.all(linePromises)

        alert(`Order ${orderNumber} created successfully!`)

        // Clear cart and reset
        clearCart()
        setShowPayment(false)
        setShowCheckout(false)
      } else {
        throw new Error(result.error || 'Failed to create order')
      }
    } catch (err) {
      console.error('Error processing order:', err)
      alert('Failed to process order: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-foreground/70">Loading POS Terminal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Panel - Menu Items */}
      <div className="flex-1 flex flex-col z-10">
        {/* Glass Header */}
        <div className="backdrop-blur-xl bg-background/10 border-b border-border/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/restaurant">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground/80 hover:text-foreground hover:bg-background/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-400" />
                Point of Sale
              </h1>
              <Badge className="bg-background/20 text-foreground border-white/30">
                {formatDate(new Date(), 'MMM dd, yyyy HH:mm')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={
                  viewMode === 'grid'
                    ? 'bg-background/20 text-foreground'
                    : 'text-foreground/70 hover:text-foreground hover:bg-background/10'
                }
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={
                  viewMode === 'list'
                    ? 'bg-background/20 text-foreground'
                    : 'text-foreground/70 hover:text-foreground hover:bg-background/10'
                }
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/10 border-border/20 text-foreground placeholder:text-foreground/50 focus:bg-background/20"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] bg-background/10 border-border/20 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-border/20">
                {categories.map(category => {
                  const Icon = category === 'all' ? ShoppingBag : CATEGORY_ICONS[category] || Coffee
                  return (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-foreground hover:bg-background/10"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {category === 'all' ? 'All Categories' : category}
                      </div>
                    </SelectItem>
                  )
                })}
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
                  <div
                    key={item.id}
                    className="group relative backdrop-blur-xl bg-background/10 rounded-2xl border border-border/20 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-background/20"
                    onClick={() => addToCart(item)}
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden">
                      {(item.metadata as any)?.image_url ? (
                        <Image
                          src={item.metadata.image_url}
                          alt={item.entity_name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br ${CATEGORY_GRADIENTS[(item.metadata as any)?.category || ''] || 'from-gray-400/20 to-gray-9000/20'} flex items-center justify-center`}
                        >
                          <Icon className="h-16 w-16 text-foreground/30" />
                        </div>
                      )}

                      {/* Popular badge */}
                      {(item.metadata as any)?.popular && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}

                      {/* Price overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-foreground text-xl font-bold">
                          {formatCurrency((item.metadata as any)?.price || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-1">{item.entity_name}</h3>
                      <p className="text-xs text-foreground/70 line-clamp-2 mb-2">
                        {(item.metadata as any)?.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {(item.metadata as any)?.rating && (
                            <>
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-foreground/70">{item.metadata.rating}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {(item.metadata as any)?.preparation_time && (
                            <div className="flex items-center gap-1 text-xs text-foreground/50">
                              <Clock className="h-3 w-3" />
                              {item.metadata.preparation_time}m
                            </div>
                          )}

                          {(item.metadata as any)?.modifiers &&
                            item.metadata.modifiers.length > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs border-white/30 text-foreground/70"
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Custom
                              </Badge>
                            )}
                        </div>
                      </div>

                      {/* Add button overlay on hover */}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button className="bg-background text-white hover:bg-gray-700">
                          <Plus className="h-5 w-5 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => {
                const Icon = CATEGORY_ICONS[(item.metadata as any)?.category || ''] || Coffee
                return (
                  <div
                    key={item.id}
                    className="group backdrop-blur-xl bg-background/10 rounded-xl border border-border/20 p-3 cursor-pointer transition-all hover:bg-background/20"
                    onClick={() => addToCart(item)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                        {(item.metadata as any)?.image_url ? (
                          <Image
                            src={item.metadata.image_url}
                            alt={item.entity_name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div
                            className={`h-full w-full bg-gradient-to-br ${CATEGORY_GRADIENTS[(item.metadata as any)?.category || ''] || 'from-gray-400/20 to-gray-9000/20'} flex items-center justify-center`}
                          >
                            <Icon className="h-8 w-8 text-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              {item.entity_name}
                              {(item.metadata as any)?.popular && (
                                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-foreground/70">
                              {(item.metadata as any)?.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {(item.metadata as any)?.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-foreground/70">
                                    {item.metadata.rating}
                                  </span>
                                </div>
                              )}
                              {(item.metadata as any)?.preparation_time && (
                                <div className="flex items-center gap-1 text-xs text-foreground/50">
                                  <Clock className="h-3 w-3" />
                                  {item.metadata.preparation_time}m
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-foreground text-lg">
                            {formatCurrency((item.metadata as any)?.price || 0)}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="bg-background/20 hover:bg-background/30 text-foreground border-0"
                        onClick={e => {
                          e.stopPropagation()
                          addToCart(item)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 backdrop-blur-xl bg-background/10 border-l border-border/20 flex flex-col z-10">
        {/* Order Type Selector */}
        <div className="p-4 border-b border-border/20">
          <Label className="text-sm font-medium mb-2 block text-foreground/80">Order Type</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={orderType === 'dine-in' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOrderType('dine-in')}
              className={
                orderType === 'dine-in'
                  ? 'bg-background/20 text-foreground border-0'
                  : 'text-foreground/70 hover:text-foreground hover:bg-background/10'
              }
            >
              <Utensils className="h-4 w-4 mr-1" />
              Dine-in
            </Button>
            <Button
              variant={orderType === 'takeout' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOrderType('takeout')}
              className={
                orderType === 'takeout'
                  ? 'bg-background/20 text-foreground border-0'
                  : 'text-foreground/70 hover:text-foreground hover:bg-background/10'
              }
            >
              <Package className="h-4 w-4 mr-1" />
              Takeout
            </Button>
            <Button
              variant={orderType === 'delivery' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOrderType('delivery')}
              className={
                orderType === 'delivery'
                  ? 'bg-background/20 text-foreground border-0'
                  : 'text-foreground/70 hover:text-foreground hover:bg-background/10'
              }
            >
              <Truck className="h-4 w-4 mr-1" />
              Delivery
            </Button>
          </div>
        </div>

        {/* Table Selection for Dine-in */}
        {orderType === 'dine-in' && (
          <div className="p-4 border-b border-border/20">
            <Label className="text-sm font-medium mb-2 block text-foreground/80">Select Table</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="bg-background/10 border-border/20 text-foreground">
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-border/20">
                {tables
                  .filter(table => (table.metadata as any)?.status === 'available')
                  .map(table => (
                    <SelectItem
                      key={table.id}
                      value={table.id}
                      className="text-foreground hover:bg-background/10"
                    >
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        {table.entity_name} - {(table.metadata as any)?.section}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Customer Info for Takeout/Delivery */}
        {(orderType === 'takeout' || orderType === 'delivery') && (
          <div className="p-4 border-b border-border/20 space-y-3">
            <div>
              <Label className="text-sm text-foreground/80">Customer Name</Label>
              <Input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="bg-background/10 border-border/20 text-foreground placeholder:text-foreground/50"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground/80">Phone Number</Label>
              <Input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+1-555-0123"
                className="bg-background/10 border-border/20 text-foreground placeholder:text-foreground/50"
              />
            </div>
            {orderType === 'delivery' && (
              <div>
                <Label className="text-sm text-foreground/80">Delivery Address</Label>
                <Input
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="123 Main St, City"
                  className="bg-background/10 border-border/20 text-foreground placeholder:text-foreground/50"
                />
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Items
          </h3>
          {cart.length === 0 ? (
            <div className="text-center text-foreground/50 py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Cart is empty</p>
              <p className="text-xs mt-1">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div
                  key={item.menuItem.id}
                  className="backdrop-blur-sm bg-background/5 rounded-lg p-3 border border-border/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.menuItem.entity_name}</h4>
                      <p className="text-sm text-foreground/60">
                        {formatCurrency((item.menuItem.metadata as any)?.price || 0)} each
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.menuItem.id)}
                      className="text-foreground/60 hover:text-foreground hover:bg-background/10"
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
                        className="h-7 w-7 p-0 bg-background/10 border-border/20 text-foreground hover:bg-background/20"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center text-foreground font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="h-7 w-7 p-0 bg-background/10 border-border/20 text-foreground hover:bg-background/20"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals and Actions */}
        <div className="border-t border-border/20 p-4 backdrop-blur-sm bg-background/5 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-foreground/80">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground/80">
              <span>Tax (5%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator className="bg-background/20" />
            <div className="flex justify-between text-lg font-semibold text-foreground">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className="bg-background/10 border-border/20 text-foreground hover:bg-background/20 hover:text-foreground disabled:opacity-50"
            >
              <Percent className="h-4 w-4 mr-1" />
              Discount
            </Button>
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={cart.length === 0}
              className="bg-background/10 border-border/20 text-foreground hover:bg-background/20 hover:text-foreground disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground border-0"
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
            <DialogTitle className="text-xl font-semibold">Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 font-medium mb-2 block">Discount Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={e => setDiscountPercent(parseInt(e.target.value) || 0)}
                className="bg-muted border-input text-foreground placeholder:text-muted-foreground focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(percent => (
                  <Button
                    key={percent}
                    variant={discountPercent === percent ? 'default' : 'outline'}
                    onClick={() => setDiscountPercent(percent)}
                    className={
                      discountPercent === percent
                        ? 'bg-purple-600 hover:bg-purple-700 text-foreground border-purple-500'
                        : 'bg-muted hover:bg-slate-700 border-input text-gray-300 hover:text-foreground'
                    }
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>
            {discountPercent > 0 && (
              <div className="p-3 bg-muted rounded-lg border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Discount Amount:</span>
                  <span className="text-emerald-400 font-semibold">
                    -{formatCurrency(subtotal * (discountPercent / 100))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              className="bg-muted hover:bg-slate-700 border-input text-gray-300 hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowCheckout(false)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground border-0"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-6 bg-muted rounded-xl border border-border">
              <p className="text-sm text-muted-foreground mb-2">Total Amount Due</p>
              <p className="text-5xl font-bold text-foreground">{formatCurrency(total)}</p>
            </div>
            <div>
              <Label className="text-gray-300 font-medium mb-3 block">Select Payment Method</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className={
                    paymentMethod === 'cash'
                      ? 'bg-purple-600 hover:bg-purple-700 text-foreground border-purple-500'
                      : 'bg-muted hover:bg-slate-700 border-input text-gray-300 hover:text-foreground'
                  }
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Cash
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className={
                    paymentMethod === 'card'
                      ? 'bg-purple-600 hover:bg-purple-700 text-foreground border-purple-500'
                      : 'bg-muted hover:bg-slate-700 border-input text-gray-300 hover:text-foreground'
                  }
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Card
                </Button>
                <Button
                  variant={paymentMethod === 'online' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('online')}
                  className={
                    paymentMethod === 'online'
                      ? 'bg-purple-600 hover:bg-purple-700 text-foreground border-purple-500'
                      : 'bg-muted hover:bg-slate-700 border-input text-gray-300 hover:text-foreground'
                  }
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Online
                </Button>
              </div>
            </div>
            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300 font-medium mb-2 block">Cash Received</Label>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder="Enter amount received"
                    className="text-lg bg-muted border-input text-foreground placeholder:text-muted-foreground focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                {cashAmount > 0 && (
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Change Due:</span>
                      <span
                        className={`text-2xl font-bold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {change >= 0 ? '' : '-'}
                        {formatCurrency(Math.abs(change))}
                      </span>
                    </div>
                    {change < 0 && (
                      <p className="text-xs text-rose-400 mt-2">Insufficient amount received</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPayment(false)}
              className="bg-muted hover:bg-slate-700 border-input text-gray-300 hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={processOrder}
              disabled={processing || (paymentMethod === 'cash' && change < 0)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
