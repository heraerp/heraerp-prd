/**
 * Retail POS Main Interface
 * Integrated with Universal Dynamic Masterdata System
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { UniversalEntityListShell } from '@/components/universal/UniversalEntityListShell'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  Search, 
  Plus,
  Scan,
  Calculator,
  Receipt,
  Settings
} from 'lucide-react'

// Sample products data with Indian pricing and GST rates
const sampleProducts = [
  { id: 1, name: 'Premium Coffee Beans', sku: 'PRD001', price: 899, category: 'beverages', gstRate: 5, hsn: '090111' },
  { id: 2, name: 'Organic Tea Selection', sku: 'PRD002', price: 699, category: 'beverages', gstRate: 5, hsn: '090210' },
  { id: 3, name: 'Artisan Chocolate Bar', sku: 'PRD003', price: 299, category: 'snacks', gstRate: 18, hsn: '180690' },
  { id: 4, name: 'Bluetooth Headphones', sku: 'PRD004', price: 2999, category: 'electronics', gstRate: 18, hsn: '851830' },
  { id: 5, name: 'Wireless Mouse', sku: 'PRD005', price: 1299, category: 'electronics', gstRate: 18, hsn: '847330' },
  { id: 6, name: 'Cotton T-Shirt', sku: 'PRD006', price: 799, category: 'clothing', gstRate: 12, hsn: '610910' },
  { id: 7, name: 'Protein Bars', sku: 'PRD007', price: 449, category: 'snacks', gstRate: 18, hsn: '190590' },
  { id: 8, name: 'Energy Drink', sku: 'PRD008', price: 149, category: 'beverages', gstRate: 28, hsn: '220210' }
]

// Cart item interface
interface CartItem {
  id: number
  name: string
  sku: string
  price: number
  quantity: number
  total: number
  gstRate: number
  hsn: string
}

// GST calculation utilities
const calculateGST = (amount: number, gstRate: number) => {
  const gstAmount = (amount * gstRate) / 100
  return {
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    cgst: parseFloat((gstAmount / 2).toFixed(2)),
    sgst: parseFloat((gstAmount / 2).toFixed(2)),
    totalWithGST: parseFloat((amount + gstAmount).toFixed(2))
  }
}

// Receipt printing utility
const printReceipt = (cartItems: CartItem[], customerName = 'Walk-in Customer') => {
  let receiptContent = `
=========================================
           RETAIL STORE
         GST: 29AAAAA0000A1Z5
        Phone: +91 98765 43210
=========================================

Date: ${new Date().toLocaleString('en-IN')}
Customer: ${customerName}
Cashier: Demo User

-----------------------------------------
ITEMS:
-----------------------------------------`

  let subtotal = 0
  let totalGST = 0

  cartItems.forEach(item => {
    const lineTotal = item.quantity * item.price
    const gst = calculateGST(lineTotal, item.gstRate)
    
    subtotal += lineTotal
    totalGST += gst.gstAmount
    
    receiptContent += `
${item.name}
HSN: ${item.hsn} | GST: ${item.gstRate}%
Qty: ${item.quantity} x ₹${item.price} = ₹${lineTotal}
CGST: ₹${gst.cgst} | SGST: ₹${gst.sgst}
-----------------------------------------`
  })

  const grandTotal = subtotal + totalGST

  receiptContent += `

SUMMARY:
-----------------------------------------
Subtotal:                     ₹${subtotal.toFixed(2)}
Total GST:                    ₹${totalGST.toFixed(2)}
GRAND TOTAL:                  ₹${grandTotal.toFixed(2)}

-----------------------------------------
         THANK YOU!
    Please visit us again!
=========================================
`

  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 10px;
              line-height: 1.3;
            }
            pre {
              white-space: pre-wrap;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <pre>${receiptContent}</pre>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }
}

// POS-specific components
const POSCartPanel = ({ cartItems, updateQuantity, removeItem, total, onCheckout }) => {

  return (
    <div className="h-full bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Shopping Cart</h2>
          <p className="text-xs text-slate-600">{cartItems.length} items</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 mb-6 min-h-[300px]">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Cart is empty</p>
            <p className="text-xs text-slate-500">Scan or search products to add</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">{item.name}</p>
                  <p className="text-slate-600 text-sm">SKU: {item.sku}</p>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  ×
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-slate-600 hover:bg-slate-300"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="text-slate-900 font-medium min-w-[20px] text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-slate-600 hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-slate-600 text-sm">₹{item.price} each</p>
                  <p className="text-blue-600 font-bold">₹{item.total}</p>
                  <p className="text-slate-500 text-xs">GST: {item.gstRate}%</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Total */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-slate-900">Total:</span>
          <span className="text-2xl font-bold text-blue-600">₹{total}</span>
        </div>
        
        <button 
          onClick={onCheckout}
          className="w-full min-h-[48px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50 hover:from-blue-700 hover:to-indigo-700"
          disabled={cartItems.length === 0}
        >
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Checkout ({cartItems.length} items)
          </div>
        </button>
      </div>
    </div>
  )
}

const POSProductGrid = ({ addToCart }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Filter products based on search and category
  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="h-full">
      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or scan barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[48px] pl-10 pr-4 bg-white/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <button className="min-w-[48px] min-h-[48px] bg-blue-100 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 active:scale-95 transition-transform hover:bg-blue-200">
          <Scan className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'beverages', 'snacks', 'electronics', 'clothing'].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`min-h-[40px] px-4 rounded-lg font-medium transition-all active:scale-95 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white/70 text-slate-700 border border-slate-200 hover:bg-blue-50'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer active:scale-95"
            onClick={() => addToCart(product)}
          >
            <div className="aspect-square bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-slate-600 text-sm mb-2">SKU: {product.sku}</p>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-bold">₹{product.price}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  addToCart(product)
                }}
                className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 active:scale-95 transition-transform hover:bg-blue-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {/* No products found message */}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No products found</p>
            <p className="text-xs text-slate-500">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  )
}

const POSActionPanel = ({ cartItems, clearCart, onPrintReceipt }) => {
  return (
    <div className="h-full bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-xl p-6 shadow-lg">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Customer Lookup */}
        <button className="w-full min-h-[56px] bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 px-4 text-left hover:bg-blue-100 active:scale-95 transition-all">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-slate-900">Customer Lookup</p>
            <p className="text-xs text-slate-600">Search or add customer</p>
          </div>
        </button>

        {/* Calculator */}
        <button className="w-full min-h-[56px] bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 px-4 text-left hover:bg-purple-100 active:scale-95 transition-all">
          <Calculator className="w-5 h-5 text-purple-600" />
          <div>
            <p className="font-medium text-slate-900">Calculator</p>
            <p className="text-xs text-slate-600">Price calculations</p>
          </div>
        </button>

        {/* Receipt Printer */}
        <button 
          onClick={onPrintReceipt}
          disabled={cartItems.length === 0}
          className="w-full min-h-[56px] bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 px-4 text-left hover:bg-green-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Receipt className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-slate-900">Print Receipt</p>
            <p className="text-xs text-slate-600">{cartItems.length > 0 ? 'Print current cart' : 'Add items to print'}</p>
          </div>
        </button>

        {/* Settings */}
        <button className="w-full min-h-[56px] bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 px-4 text-left hover:bg-amber-100 active:scale-95 transition-all">
          <Settings className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-slate-900">POS Settings</p>
            <p className="text-xs text-slate-600">Configure terminal</p>
          </div>
        </button>

        {/* Clear Cart */}
        <button 
          onClick={clearCart}
          disabled={cartItems.length === 0}
          className="w-full min-h-[56px] bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 px-4 text-left hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-slate-900">Clear Cart</p>
            <p className="text-xs text-slate-600">Remove all items</p>
          </div>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Current Cart</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600 text-sm">Items:</span>
            <span className="text-slate-900 font-medium">{cartItems.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 text-sm">Subtotal:</span>
            <span className="text-blue-600 font-bold">₹{cartItems.reduce((sum, item) => sum + item.total, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 text-sm">GST:</span>
            <span className="text-slate-900">₹{cartItems.reduce((sum, item) => {
              const gst = calculateGST(item.total, item.gstRate)
              return sum + gst.gstAmount
            }, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-700 font-medium">Grand Total:</span>
            <span className="text-slate-900 font-bold">₹{cartItems.reduce((sum, item) => {
              const gst = calculateGST(item.total, item.gstRate)
              return sum + item.total + gst.gstAmount
            }, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function POSMainPage() {
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)

  // Calculate total whenever cart items change
  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => sum + item.total, 0)
    setTotal(newTotal)
  }, [cartItems])

  // Add product to cart
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id)
      
      if (existingItem) {
        // Update quantity and total for existing item
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      } else {
        // Add new item
        return [...prevItems, {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          total: product.price,
          gstRate: product.gstRate,
          hsn: product.hsn
        }]
      }
    })
  }

  // Update item quantity
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    )
  }

  // Remove item from cart
  const removeItem = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  // Clear entire cart
  const clearCart = () => {
    setCartItems([])
  }

  // Handle print receipt
  const handlePrintReceipt = () => {
    if (cartItems.length === 0) return
    printReceipt(cartItems)
  }

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) return
    
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0)
    const totalGST = cartItems.reduce((sum, item) => {
      const gst = calculateGST(item.total, item.gstRate)
      return sum + gst.gstAmount
    }, 0)
    const grandTotal = subtotal + totalGST
    
    // Auto-print receipt after checkout
    setTimeout(() => {
      printReceipt(cartItems)
    }, 500)
    
    alert(`Checkout successful!\nSubtotal: ₹${subtotal}\nGST: ₹${totalGST.toFixed(2)}\nGrand Total: ₹${grandTotal.toFixed(2)}\nItems: ${cartItems.length}\n\nReceipt will be printed automatically.`)
    clearCart()
  }

  // Authentication guards
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Authentication Required</h1>
          <p className="text-bronze">Please log in to access the POS system</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Organization Required</h1>
          <p className="text-bronze">Please select an organization to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Status Bar */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile POS Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">POS Terminal</h1>
              <p className="text-xs text-slate-600">{organization.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-600">Cashier</p>
          </div>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="container mx-auto px-4 py-6">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Point of Sale</h1>
            <p className="text-slate-600">Complete retail transaction processing</p>
          </div>
          <div className="text-right">
            <p className="text-slate-900 font-medium">{organization.name}</p>
            <p className="text-slate-600 text-sm">Terminal • {user.name}</p>
          </div>
        </div>

        {/* Three-Panel POS Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Cart (Mobile: Full width, Desktop: 3 columns) */}
          <div className="lg:col-span-3 order-3 lg:order-1">
            <POSCartPanel 
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              total={total}
              onCheckout={handleCheckout}
            />
          </div>

          {/* Center Panel - Product Selection (Mobile: Full width, Desktop: 6 columns) */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <POSProductGrid addToCart={addToCart} />
          </div>

          {/* Right Panel - Actions & Info (Mobile: Full width, Desktop: 3 columns) */}
          <div className="lg:col-span-3 order-2 lg:order-3">
            <POSActionPanel cartItems={cartItems} clearCart={clearCart} onPrintReceipt={handlePrintReceipt} />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Spacing */}
      <div className="h-24 md:h-0" />
    </div>
  )
}