'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { CreditCard, User, Package } from 'lucide-react'

interface MobileProduct {
  id: string
  name: string
  category: string
  price: number
  image: string
  specifications: {
    metal: string
    purity: string
    weight: string
    stones?: string
    size?: string
  }
  inventory: {
    inStock: boolean
    quantity: number
    location: string
  }
  certification?: {
    lab: string
    number: string
    grade?: string
  }
  rating: number
  reviews: number
}

interface MobileCustomer {
  id: string
  name: string
  phone: string
  email?: string
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  totalSpent: number
  lastPurchase?: string
  preferences: {
    metals: string[]
    styles: string[]
    priceRange: { min: number; max: number }
  }
}

interface CartItem {
  product: MobileProduct
  quantity: number
  notes?: string
  customizations?: {
    engraving?: string
    sizing?: string
    modifications?: string
  }
}

interface MobileOrder {
  id: string
  customer: MobileCustomer
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  status: 'pending' | 'processing' | 'completed'
  timestamp: string
}

interface PaymentReceiptModalProps {
  order: MobileOrder
  onClose: () => void
}

export default function PaymentReceiptModal({ order, onClose }: PaymentReceiptModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl overflow-hidden max-w-sm w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CreditCard className="h-8 w-8" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-white/90">Thank you for your purchase</p>
        </div>

        {/* Receipt Details */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="text-center border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold jewelry-text-royal">Order #{order.id}</h3>
            <p className="text-sm text-gray-600">
              {new Date(order.timestamp).toLocaleDateString()} at{' '}
              {new Date(order.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Customer Info */}
          <div className="jewelry-glass-card p-4 rounded-xl">
            <h4 className="font-semibold jewelry-text-royal mb-2">Customer Information</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-medium jewelry-text-royal block">{order.customer.name}</span>
                <span className="text-sm text-gray-600">{order.customer.phone}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.customer.vipTier === 'Platinum'
                        ? 'bg-gray-800 text-white'
                        : order.customer.vipTier === 'Gold'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.customer.vipTier === 'Silver'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {order.customer.vipTier} Member
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="font-semibold jewelry-text-royal">Items Purchased</h4>
            {order.items.map(item => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 jewelry-glass-card p-3 rounded-xl"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
                <div className="flex-1">
                  <span className="font-medium jewelry-text-royal block text-sm">
                    {item.product.name}
                  </span>
                  <span className="text-xs text-gray-600">{item.product.specifications.metal}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium jewelry-text-royal block">
                    ${item.product.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="jewelry-glass-card p-4 rounded-xl space-y-3">
            <h4 className="font-semibold jewelry-text-royal">Payment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="jewelry-text-royal font-medium">
                  ${order.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8%)</span>
                <span className="jewelry-text-royal font-medium">${order.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold jewelry-text-royal">Total</span>
                <span className="font-bold jewelry-text-gold text-lg">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Paid with {order.paymentMethod}</span>
              <span className="text-sm font-medium text-green-600 ml-auto">✓ Completed</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              className="flex-1 jewelry-glass-btn py-4 rounded-xl font-medium jewelry-text-royal hover:bg-jewelry-gold-100 transition-colors"
              onClick={() => {
                window.print()
              }}
            >
              <Package className="h-5 w-5 inline mr-2" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white py-4 rounded-xl font-medium hover:from-jewelry-gold-500 hover:to-jewelry-gold-700 transition-all shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
