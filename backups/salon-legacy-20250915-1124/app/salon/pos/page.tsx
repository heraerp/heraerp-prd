'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { universalApi } from '@/lib/universal-api'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  DollarSign,
  User,
  Receipt,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SalonCard } from '@/components/salon/SalonCard'

const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b'

interface CartItem {
  id: string
  entity_id: string
  entity_name: string
  entity_type: 'service' | 'product'
  quantity: number
  unit_price: number
  total_price: number
}

interface Entity {
  id: string
  entity_name: string
  entity_code: string
  entity_type: string
  smart_code: string
}

export default function POSCheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [services, setServices] = useState<Entity[]>([])
  const [products, setProducts] = useState<Entity[]>([])
  const [customers, setCustomers] = useState<Entity[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [searchTerm, setSearchTerm] = useState('')
  const [priceData, setPriceData] = useState<Record<string, number>>({})

  useEffect(() => {
    universalApi.setOrganizationId(SALON_ORG_ID)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load entities
      const entitiesData = await universalApi.read('core_entities')
      const allEntities = entitiesData.data.filter((e: any) => e.organization_id === SALON_ORG_ID)
      
      // Filter by type
      setServices(allEntities.filter((e: any) => e.entity_type === 'service'))
      setProducts(allEntities.filter((e: any) => e.entity_type === 'product'))
      setCustomers(allEntities.filter((e: any) => e.entity_type === 'customer'))
      
      // Load prices from dynamic data
      const dynamicData = await universalApi.read('core_dynamic_data')
      const priceFields = dynamicData.data.filter(
        (d: any) => d.organization_id === SALON_ORG_ID && 
                    (d.field_name === 'base_price' || d.field_name === 'retail_price')
      )
      
      // Build price map
      const prices: Record<string, number> = {}
      priceFields.forEach((d: any) => {
        prices[d.entity_id] = d.field_value_number || 0
      })
      setPriceData(prices)
      
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (entity: Entity) => {
    const existingItem = cart.find(item => item.entity_id === entity.id)
    const price = priceData[entity.id] || 0
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1)
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        entity_id: entity.id,
        entity_name: entity.entity_name,
        entity_type: entity.entity_type as 'service' | 'product',
        quantity: 1,
        unit_price: price,
        total_price: price
      }
      setCart([...cart, newItem])
    }
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }
    
    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
        : item
    ))
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.05 // 5% VAT
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!selectedCustomer) {
      alert('Please select a customer')
      return
    }

    try {
      const total = calculateTotal()
      
      // Create POS sale transaction
      const sale = await universalApi.createTransaction({
        transaction_type: 'pos_sale',
        transaction_date: new Date().toISOString(),
        transaction_code: `POS-${Date.now()}`,
        smart_code: 'HERA.SALON.POS.SALE.CREATE.V1',
        source_entity_id: selectedCustomer,
        target_entity_id: selectedCustomer, // Could be staff ID if tracking who made the sale
        total_amount: total,
        transaction_currency_code: 'AED',
        business_context: {
          payment_method: paymentMethod,
          items: cart.map(item => ({
            entity_id: item.entity_id,
            entity_name: item.entity_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total_price
          }))
        }
      })

      // Create transaction lines
      if (sale.id) {
        let lineNumber = 1
        
        // Add cart items as lines
        for (const item of cart) {
          await universalApi.createTransactionLine({
            transaction_id: sale.id,
            line_number: lineNumber++,
            line_type: item.entity_type.toUpperCase(),
            entity_id: item.entity_id,
            quantity: item.quantity,
            unit_amount: item.unit_price,
            line_amount: item.total_price,
            smart_code: `HERA.SALON.POS.LINE.${item.entity_type.toUpperCase()}.V1`,
            line_data: {
              item_name: item.entity_name
            }
          })
        }
        
        // Add tax line
        const taxAmount = calculateTax()
        if (taxAmount > 0) {
          await universalApi.createTransactionLine({
            transaction_id: sale.id,
            line_number: lineNumber++,
            line_type: 'TAX',
            entity_id: null,
            quantity: 1,
            unit_amount: taxAmount,
            line_amount: taxAmount,
            smart_code: 'HERA.SALON.POS.LINE.TAX.V1',
            line_data: {
              tax_base: calculateSubtotal(),
              tax_rate: 0.05
            }
          })
        }
        
        // Add payment line
        await universalApi.createTransactionLine({
          transaction_id: sale.id,
          line_number: lineNumber++,
          line_type: 'PAYMENT',
          entity_id: null,
          quantity: 1,
          unit_amount: -total,
          line_amount: -total,
          smart_code: `HERA.SALON.POS.LINE.PAYMENT.${paymentMethod.toUpperCase()}.V1`,
          line_data: {
            payment_method: paymentMethod
          }
        })
      }

      // Success - clear cart and show receipt
      setCart([])
      router.push(`/salon/pos/receipt/${sale.id}`)
      
    } catch (error) {
      console.error('Error processing checkout:', error)
      alert('Failed to process checkout. Please try again.')
    }
  }

  const filteredServices = services.filter(s => 
    s.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredProducts = products.filter(p => 
    p.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DD97E2]"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel - Services & Products */}
      <div className="lg:col-span-2 space-y-6 overflow-auto">
        {/* Search */}
        <SalonCard>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services or products..."
              className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#DD97E2]"
            />
          </div>
        </SalonCard>

        {/* Services */}
        <SalonCard>
          <h2 className="text-xl font-bold text-white mb-4">Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredServices.map((service) => (
              <button
                key={service.id}
                onClick={() => addToCart(service)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
              >
                <p className="text-white font-medium text-sm">{service.entity_name}</p>
                <p className="text-[#DD97E2] text-xs mt-1">AED {priceData[service.id] || 0}</p>
              </button>
            ))}
          </div>
        </SalonCard>

        {/* Products */}
        <SalonCard>
          <h2 className="text-xl font-bold text-white mb-4">Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all text-left"
              >
                <p className="text-white font-medium text-sm">{product.entity_name}</p>
                <p className="text-[#DD97E2] text-xs mt-1">AED {priceData[product.id] || 0}</p>
              </button>
            ))}
          </div>
        </SalonCard>
      </div>

      {/* Right Panel - Cart */}
      <SalonCard className="flex flex-col h-full p-0">
        {/* Cart Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Cart
          </h2>
        </div>

        {/* Customer Selection */}
        <div className="p-6 border-b border-white/10">
          <label className="text-white/60 text-sm font-medium mb-2 block">Customer</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#DD97E2]"
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.entity_name}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-6">
          {cart.length === 0 ? (
            <p className="text-white/60 text-center">Cart is empty</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">{item.entity_name}</p>
                      <p className="text-white/60 text-xs">AED {item.unit_price.toFixed(2)} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <span className="text-white text-sm w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <p className="text-white font-medium">AED {item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="p-6 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span className="text-white">AED {calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">VAT (5%)</span>
            <span className="text-white">AED {calculateTax().toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-[#DD97E2]">AED {calculateTotal().toFixed(2)}</span>
          </div>

          {/* Payment Method */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "flex-1 py-2 rounded-lg border transition-all flex items-center justify-center gap-2",
                paymentMethod === 'cash'
                  ? "bg-[#DD97E2]/20 border-[#DD97E2] text-white"
                  : "bg-white/5 border-white/10 text-white/60"
              )}
            >
              <DollarSign className="w-4 h-4" />
              Cash
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "flex-1 py-2 rounded-lg border transition-all flex items-center justify-center gap-2",
                paymentMethod === 'card'
                  ? "bg-[#DD97E2]/20 border-[#DD97E2] text-white"
                  : "bg-white/5 border-white/10 text-white/60"
              )}
            >
              <CreditCard className="w-4 h-4" />
              Card
            </button>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || !selectedCustomer}
            className="w-full bg-[#DD97E2] text-white rounded-lg py-3 font-medium hover:shadow-lg hover:shadow-[#DD97E2]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            Checkout
          </button>
        </div>
      </SalonCard>
    </div>
  )
}