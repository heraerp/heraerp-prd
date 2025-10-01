'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { X, Star, Award, ShoppingCart } from 'lucide-react'

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

interface ProductDetailModalProps {
  product: MobileProduct
  onClose: () => void
  onAddToCart: (product: MobileProduct) => void
}

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image */}
        <div className="relative h-80 bg-gradient-to-br from-jewelry-cream to-jewelry-blue-50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="400px"
            priority
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          {!product.inventory.inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold px-4 py-2 bg-red-500 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold jewelry-text-royal mb-2">
              {product.name}
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold jewelry-text-gold">
                ${product.price.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-1">({product.reviews})</span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold jewelry-text-royal">Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 block">Metal</span>
                <span className="font-medium jewelry-text-royal">{product.specifications.metal}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block">Purity</span>
                <span className="font-medium jewelry-text-royal">{product.specifications.purity}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 block">Weight</span>
                <span className="font-medium jewelry-text-royal">{product.specifications.weight}</span>
              </div>
              {product.specifications.stones && (
                <div>
                  <span className="text-sm text-gray-600 block">Stones</span>
                  <span className="font-medium jewelry-text-royal">{product.specifications.stones}</span>
                </div>
              )}
              {product.specifications.size && (
                <div>
                  <span className="text-sm text-gray-600 block">Size</span>
                  <span className="font-medium jewelry-text-royal">{product.specifications.size}</span>
                </div>
              )}
            </div>
          </div>

          {/* Certification */}
          {product.certification && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold jewelry-text-royal">Certification</h3>
              <div className="jewelry-glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 jewelry-text-gold" />
                  <div>
                    <span className="font-semibold jewelry-text-royal block">{product.certification.lab}</span>
                    <span className="text-sm text-gray-600">{product.certification.number}</span>
                    {product.certification.grade && (
                      <span className="text-sm text-gray-600 block">Grade: {product.certification.grade}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold jewelry-text-royal">Availability</h3>
            <div className="flex items-center justify-between jewelry-glass-card p-4 rounded-xl">
              <div>
                <span className="font-medium jewelry-text-royal block">
                  {product.inventory.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                <span className="text-sm text-gray-600">
                  Location: {product.inventory.location}
                </span>
                {product.inventory.inStock && (
                  <span className="text-sm text-gray-600 block">
                    Quantity: {product.inventory.quantity}
                  </span>
                )}
              </div>
              <div className={`w-3 h-3 rounded-full ${product.inventory.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              className="flex-1 jewelry-glass-btn py-4 rounded-xl font-medium jewelry-text-royal hover:bg-jewelry-gold-100 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            {product.inventory.inStock && (
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white py-4 rounded-xl font-medium hover:from-jewelry-gold-500 hover:to-jewelry-gold-700 transition-all shadow-lg"
              >
                <ShoppingCart className="h-5 w-5 inline mr-2" />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}