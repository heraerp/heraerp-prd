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

// POS-specific components
const POSCartPanel = () => {
  const [cartItems, setCartItems] = useState([])
  const [total, setTotal] = useState(0)

  return (
    <div className="h-full bg-gradient-to-br from-charcoal/90 to-black/95 backdrop-blur-lg border border-gold/20 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-champagne">Shopping Cart</h2>
          <p className="text-xs text-bronze">{cartItems.length} items</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 mb-6 min-h-[300px]">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-bronze/50 mx-auto mb-3" />
            <p className="text-bronze/70">Cart is empty</p>
            <p className="text-xs text-bronze/50">Scan or search products to add</p>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div key={index} className="bg-charcoal/50 rounded-lg p-3 border border-gold/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-champagne font-medium">{item.name}</p>
                  <p className="text-bronze text-sm">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-bold">${item.price}</p>
                  <p className="text-bronze text-sm">Qty: {item.quantity}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Total */}
      <div className="border-t border-gold/20 pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-champagne">Total:</span>
          <span className="text-2xl font-bold text-gold">${total.toFixed(2)}</span>
        </div>
        
        <button 
          className="w-full min-h-[48px] bg-gradient-to-r from-gold to-champagne text-charcoal font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          disabled={cartItems.length === 0}
        >
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Checkout
          </div>
        </button>
      </div>
    </div>
  )
}

const POSProductGrid = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="h-full">
      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-bronze" />
          <input
            type="text"
            placeholder="Search products by name or scan barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[48px] pl-10 pr-4 bg-charcoal/50 border border-gold/20 rounded-xl text-champagne placeholder-bronze focus:border-gold/50 focus:outline-none"
          />
        </div>
        <button className="min-w-[48px] min-h-[48px] bg-gold/20 border border-gold/30 rounded-xl flex items-center justify-center text-gold active:scale-95 transition-transform">
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
                ? 'bg-gold text-charcoal'
                : 'bg-charcoal/50 text-bronze border border-gold/20 hover:bg-gold/10'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Sample product items */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="bg-gradient-to-br from-charcoal/90 to-black/95 backdrop-blur-lg border border-gold/20 rounded-xl p-4 hover:border-gold/40 transition-all cursor-pointer active:scale-95"
          >
            <div className="aspect-square bg-gold/10 rounded-lg mb-3 flex items-center justify-center">
              <Package className="w-8 h-8 text-gold" />
            </div>
            <h3 className="font-medium text-champagne mb-1 line-clamp-2">Sample Product {item}</h3>
            <p className="text-bronze text-sm mb-2">SKU: PRD{item.toString().padStart(3, '0')}</p>
            <div className="flex justify-between items-center">
              <span className="text-gold font-bold">${(item * 9.99).toFixed(2)}</span>
              <button className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center text-gold active:scale-95 transition-transform">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const POSActionPanel = () => {
  return (
    <div className="h-full bg-gradient-to-br from-charcoal/90 to-black/95 backdrop-blur-lg border border-gold/20 rounded-xl p-6">
      <h2 className="text-lg font-bold text-champagne mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Customer Lookup */}
        <button className="w-full min-h-[56px] bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center gap-3 px-4 text-left text-blue-300 hover:bg-blue-500/30 active:scale-95 transition-all">
          <Users className="w-5 h-5" />
          <div>
            <p className="font-medium">Customer Lookup</p>
            <p className="text-xs opacity-70">Search or add customer</p>
          </div>
        </button>

        {/* Calculator */}
        <button className="w-full min-h-[56px] bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center gap-3 px-4 text-left text-purple-300 hover:bg-purple-500/30 active:scale-95 transition-all">
          <Calculator className="w-5 h-5" />
          <div>
            <p className="font-medium">Calculator</p>
            <p className="text-xs opacity-70">Price calculations</p>
          </div>
        </button>

        {/* Receipt Printer */}
        <button className="w-full min-h-[56px] bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3 px-4 text-left text-green-300 hover:bg-green-500/30 active:scale-95 transition-all">
          <Receipt className="w-5 h-5" />
          <div>
            <p className="font-medium">Print Receipt</p>
            <p className="text-xs opacity-70">Reprint last receipt</p>
          </div>
        </button>

        {/* Settings */}
        <button className="w-full min-h-[56px] bg-gold/20 border border-gold/30 rounded-xl flex items-center gap-3 px-4 text-left text-gold hover:bg-gold/30 active:scale-95 transition-all">
          <Settings className="w-5 h-5" />
          <div>
            <p className="font-medium">POS Settings</p>
            <p className="text-xs opacity-70">Configure terminal</p>
          </div>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gold/20">
        <h3 className="text-sm font-medium text-bronze mb-3">Today's Sales</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-bronze text-sm">Transactions:</span>
            <span className="text-champagne font-medium">24</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bronze text-sm">Revenue:</span>
            <span className="text-gold font-bold">$2,450.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bronze text-sm">Average Sale:</span>
            <span className="text-champagne">$102.08</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function POSMainPage() {
  const { user, organization, isAuthenticated } = useHERAAuth()

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
    <div className="min-h-screen bg-gradient-to-br from-black via-charcoal to-black">
      {/* Mobile Status Bar */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile POS Header */}
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-champagne">POS Terminal</h1>
              <p className="text-xs text-bronze">{organization.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-champagne">{user.name}</p>
            <p className="text-xs text-bronze">Cashier</p>
          </div>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="container mx-auto px-4 py-6">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-champagne mb-2">Point of Sale</h1>
            <p className="text-bronze">Complete retail transaction processing</p>
          </div>
          <div className="text-right">
            <p className="text-champagne font-medium">{organization.name}</p>
            <p className="text-bronze text-sm">Terminal • {user.name}</p>
          </div>
        </div>

        {/* Three-Panel POS Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Cart (Mobile: Full width, Desktop: 3 columns) */}
          <div className="lg:col-span-3 order-3 lg:order-1">
            <POSCartPanel />
          </div>

          {/* Center Panel - Product Selection (Mobile: Full width, Desktop: 6 columns) */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <POSProductGrid />
          </div>

          {/* Right Panel - Actions & Info (Mobile: Full width, Desktop: 3 columns) */}
          <div className="lg:col-span-3 order-2 lg:order-3">
            <POSActionPanel />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Spacing */}
      <div className="h-24 md:h-0" />
    </div>
  )
}