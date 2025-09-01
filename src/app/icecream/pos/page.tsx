'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
// TODO: Re-enable once React 18 onboarding is ready
// import { useOnboarding } from '@/lib/onboarding'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Snowflake,
  Package,
  Search,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Kochi Ice Cream Org ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

interface Product {
  id: string
  entity_name: string
  entity_code: string
  metadata: any
}

interface CartItem {
  product: Product
  quantity: number
  price: number
  total: number
}

interface PaymentMethod {
  id: string
  entity_name: string
  entity_code: string
  metadata: any
}

export default function POSTerminalPage() {
  // TODO: Re-enable once React 18 onboarding is ready
  // const { startTour, isActive } = useOnboarding()
  const isActive = false // temporary placeholder
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOutlet, setSelectedOutlet] = useState<string>('')
  const [outlets, setOutlets] = useState<any[]>([])
  const [terminals, setTerminals] = useState<any[]>([])

  useEffect(() => {
    fetchPOSData()
  }, [])

  async function fetchPOSData() {
    try {
      // Fetch products with POS enabled
      const { data: productData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'product')
        .not('metadata->price', 'is', null)
        .order('entity_name')

      // Fetch categories
      const { data: categoryData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'pos_category')
        .order('metadata->>sort_order')

      // Fetch payment methods
      const { data: paymentData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'payment_method')
        .eq('metadata->>enabled', 'true')

      // Fetch terminals
      const { data: terminalData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'pos_terminal')

      // Fetch outlets
      const { data: outletData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'location')
        .like('entity_code', 'OUTLET%')

      setProducts(productData || [])
      setCategories(categoryData || [])
      setPaymentMethods(paymentData || [])
      setTerminals(terminalData || [])
      setOutlets(outletData || [])
      
      // Set default outlet
      if (outletData && outletData.length > 0) {
        setSelectedOutlet(outletData[0].id)
      }
    } catch (error) {
      console.error('Error fetching POS data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      product.metadata?.pos_category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Cart functions
  function addToCart(product: Product) {
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      const price = product.metadata?.price || 0
      setCart([...cart, {
        product,
        quantity: 1,
        price,
        total: price
      }])
    }
  }

  function updateQuantity(productId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ))
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  function clearCart() {
    setCart([])
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const gstRate = 0.05 // 5% GST for food items
  const gstAmount = subtotal * gstRate
  const total = subtotal + gstAmount

  async function processSale(paymentMethod: string) {
    if (cart.length === 0 || !selectedOutlet) return

    try {
      // Create POS sale transaction
      const billNo = `BILL-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      
      const { data: transaction, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORG_ID,
          transaction_type: 'pos_sale',
          transaction_code: billNo,
          transaction_date: new Date().toISOString(),
          total_amount: total,
          smart_code: 'HERA.RETAIL.POS.SALE.v1',
          metadata: {
            outlet_id: selectedOutlet,
            payment_method: paymentMethod,
            subtotal,
            gst_amount: gstAmount,
            gst_rate: gstRate,
            items_count: cart.length
          }
        })
        .select()
        .single()

      if (error) throw error

      // Create transaction lines
      const lines = cart.map((item, index) => ({
        transaction_id: transaction.id,
        line_entity_id: item.product.id,
        line_number: index + 1,
        quantity: item.quantity,
        unit_price: item.price,
        line_amount: item.total,
        smart_code: 'HERA.RETAIL.POS.LINE.v1',
        metadata: {
          product_name: item.product.entity_name,
          product_code: item.product.entity_code
        }
      }))

      await supabase
        .from('universal_transaction_lines')
        .insert(lines)

      // Clear cart after successful sale
      clearCart()
      alert(`Sale completed! Bill No: ${billNo}`)
    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Error processing sale. Please try again.')
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)]">
      {/* Products Section */}
      <div className="flex-1 pr-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="mb-4" data-testid="pos-header">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            POS Terminal
          </h1>
          <div className="flex items-center justify-between mt-2">
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800"
              data-testid="outlet-selector"
            >
              {outlets.map(outlet => (
                <option key={outlet.id} value={outlet.id}>{outlet.entity_name}</option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              {/* TODO: Re-enable once React 18 onboarding is ready */}
              {/* <Button
                onClick={() => startTour('HERA.UI.ONBOARD.ICECREAM.POS.v1')}
                variant="outline"
                size="sm"
                disabled={isActive}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                {isActive ? 'Tour Running...' : 'Help'}
              </Button> */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="product-search"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" data-testid="category-filters">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
              selectedCategory === 'all'
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <span className="mr-2">🍦</span>
            All Items
          </button>
          {categories.map((category) => {
            const categoryKey = category.metadata?.icon === '🍦' ? 'cups' :
                               category.metadata?.icon === '👨‍👩‍👧‍👦' ? 'family_packs' :
                               category.metadata?.icon === '🪣' ? 'tubs' :
                               category.metadata?.icon === '🍡' ? 'kulfi' :
                               category.metadata?.icon === '🍃' ? 'sugar_free' :
                               category.metadata?.icon === '🍫' ? 'bars' :
                               category.metadata?.icon === '🍋' ? 'sorbet' : 'other';
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(categoryKey)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
                  selectedCategory === categoryKey
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <span className="mr-2">{category.metadata?.icon}</span>
                {category.entity_name}
              </button>
            )
          })}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto" data-testid="products-grid">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse">Loading products...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mb-3">
                        <Snowflake className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-medium text-sm mb-1">{product.entity_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {product.entity_code}
                      </p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        ₹{product.metadata?.price || 0}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {product.metadata?.pos_category || 'item'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-gray-800 flex flex-col" data-testid="cart-section">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Current Order
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-4" />
              <p>Cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.product.id} className="backdrop-blur-xl bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{item.product.entity_name}</h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-semibold">₹{item.total.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (5%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-purple-600 dark:text-purple-400">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-2" data-testid="payment-buttons">
              {paymentMethods.slice(0, 4).map((method) => {
                const Icon = method.metadata?.icon === '💵' ? Banknote :
                             method.metadata?.icon === '💳' ? CreditCard :
                             method.metadata?.icon === '📱' ? Smartphone :
                             method.metadata?.icon === '📲' ? Receipt : Banknote;
                
                const gradient = method.entity_code === 'PAY-CASH' ? 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' :
                                method.entity_code === 'PAY-CARD' ? 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' :
                                method.entity_code === 'PAY-UPI' ? 'from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600' :
                                'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600';
                
                return (
                  <Button
                    key={method.id}
                    onClick={() => processSale(method.entity_code)}
                    className={`bg-gradient-to-r ${gradient} text-white`}
                    data-testid={`payment-${method.entity_code.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {method.entity_name}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}