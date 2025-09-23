'use client'

import React from 'react'
import { Product } from '@/types/salon-product'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Trash2, Package, AlertTriangle } from 'lucide-react'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface DeleteProductDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  product: Product | null
  loading?: boolean
}

export function DeleteProductDialog({
  open,
  onClose,
  onConfirm,
  product,
  loading = false
}: DeleteProductDialogProps) {
  if (!product) return null

  const stockValue = (product.price || 0) * product.qty_on_hand

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.bronze}40`,
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
        }}
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: '#FF6B6B20',
                border: '1px solid #FF6B6B40'
              }}
            >
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <AlertDialogTitle
                className="text-xl font-semibold"
                style={{ color: COLORS.champagne }}
              >
                Delete Product
              </AlertDialogTitle>
              <p className="text-sm opacity-60 mt-1" style={{ color: COLORS.lightText }}>
                This action cannot be undone
              </p>
            </div>
          </div>

          <AlertDialogDescription className="space-y-4" style={{ color: COLORS.lightText }}>
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: COLORS.gold + '20',
                    border: `1px solid ${COLORS.gold}40`
                  }}
                >
                  <Package className="w-4 h-4" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: COLORS.champagne }}>
                    {product.entity_name}
                  </p>
                  {product.entity_code && (
                    <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                      {product.entity_code}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs opacity-60" style={{ color: COLORS.lightText }}>
                    Stock
                  </p>
                  <p className="font-semibold mt-1" style={{ color: COLORS.champagne }}>
                    {product.qty_on_hand}
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-60" style={{ color: COLORS.lightText }}>
                    Price
                  </p>
                  <p className="font-semibold mt-1" style={{ color: COLORS.gold }}>
                    AED {(product.price || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-60" style={{ color: COLORS.lightText }}>
                    Value
                  </p>
                  <p className="font-semibold mt-1" style={{ color: COLORS.champagne }}>
                    AED {stockValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: '#FF6B6B10',
                borderColor: '#FF6B6B30'
              }}
            >
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-red-400 mb-2">Warning: Permanent Deletion</p>
                  <ul className="text-sm space-y-1 opacity-80" style={{ color: COLORS.lightText }}>
                    <li>• Product information will be permanently removed</li>
                    <li>• Stock history and transaction records will remain for audit</li>
                    <li>• This action cannot be undone</li>
                    {product.qty_on_hand > 0 && (
                      <li className="text-red-400">
                        • {product.qty_on_hand} units of stock will be lost
                      </li>
                    )}
                    {stockValue > 0 && (
                      <li className="text-red-400">
                        • AED {stockValue.toFixed(2)} in inventory value will be lost
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div
              className="p-3 rounded-lg"
              style={{
                backgroundColor: COLORS.black + '30',
                border: '1px solid ' + COLORS.bronze + '33'
              }}
            >
              <p className="text-sm opacity-70" style={{ color: COLORS.lightText }}>
                <strong>Alternative:</strong> Consider archiving this product instead to preserve
                historical data while removing it from active use.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            onClick={onClose}
            disabled={loading}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white border-none"
          >
            {loading ? 'Deleting...' : 'Delete Product'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
