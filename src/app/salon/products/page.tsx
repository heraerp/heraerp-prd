/**
 * Products Management Page
 * Comprehensive inventory management for salon products
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, TrendingUp } from 'lucide-react'
import { CurrencyDisplay } from '@/components/ui/currency-input'

export default function ProductsPage() {
  const unitOptions = [
    { value: 'PCS', label: 'Pieces' },
    { value: 'ML', label: 'Milliliters' },
    { value: 'L', label: 'Liters' },
    { value: 'G', label: 'Grams' },
    { value: 'KG', label: 'Kilograms' },
    { value: 'OZ', label: 'Ounces' },
    { value: 'BOX', label: 'Box' },
    { value: 'TUBE', label: 'Tube' },
    { value: 'BOTTLE', label: 'Bottle' }
  ]

  const categoryOptions = [
    { value: 'HAIR_CARE', label: 'Hair Care' },
    { value: 'HAIR_COLOR', label: 'Hair Color' },
    { value: 'HAIR_STYLING', label: 'Hair Styling' },
    { value: 'SKIN_CARE', label: 'Skin Care' },
    { value: 'NAIL_CARE', label: 'Nail Care' },
    { value: 'NAIL_POLISH', label: 'Nail Polish' },
    { value: 'TOOLS', label: 'Tools & Equipment' },
    { value: 'ACCESSORIES', label: 'Accessories' },
    { value: 'CONSUMABLES', label: 'Consumables' },
    { value: 'RETAIL', label: 'Retail Products' }
  ]

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.PRODUCT_ITEM}
        apiEndpoint="/api/v1/salon/products"
        additionalFields={[
          // Basic Information
          {
            name: 'sku',
            label: 'SKU',
            type: 'text',
            required: true,
            placeholder: 'PRD-001',
            helpText: 'Stock Keeping Unit - unique product identifier'
          },
          {
            name: 'barcode',
            label: 'Barcode',
            type: 'text',
            placeholder: 'Scan or enter barcode',
            helpText: 'EAN/UPC barcode for scanning'
          },
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: categoryOptions,
            required: true,
            defaultValue: 'HAIR_CARE'
          },
          {
            name: 'brand',
            label: 'Brand',
            type: 'text',
            placeholder: 'Brand name',
            helpText: 'Product manufacturer or brand'
          },
          
          // Pricing Information
          {
            name: 'cost_price',
            label: 'Cost Price',
            type: 'currency',
            required: true,
            defaultValue: 0,
            helpText: 'Purchase cost from supplier'
          },
          {
            name: 'retail_price',
            label: 'Retail Price',
            type: 'currency',
            required: true,
            defaultValue: 0,
            helpText: 'Price for retail customers'
          },
          {
            name: 'professional_price',
            label: 'Professional Price',
            type: 'currency',
            defaultValue: 0,
            helpText: 'Price when used in services'
          },
          
          // Stock Management
          {
            name: 'min_stock',
            label: 'Minimum Stock',
            type: 'number',
            defaultValue: 5,
            min: 0,
            helpText: 'Alert when stock falls below this level'
          },
          {
            name: 'max_stock',
            label: 'Maximum Stock',
            type: 'number',
            defaultValue: 50,
            min: 0,
            helpText: 'Maximum quantity to keep in stock'
          },
          {
            name: 'reorder_point',
            label: 'Reorder Point',
            type: 'number',
            defaultValue: 10,
            min: 0,
            helpText: 'Automatically suggest reorder at this level'
          },
          {
            name: 'unit_of_measure',
            label: 'Unit of Measure',
            type: 'select',
            options: unitOptions,
            defaultValue: 'PCS',
            required: true
          },
          
          // Product Attributes
          {
            name: 'is_consumable',
            label: 'Professional Use Only',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Used by staff during services (not for retail)'
          },
          {
            name: 'is_retail',
            label: 'Available for Retail',
            type: 'checkbox',
            defaultValue: true,
            helpText: 'Can be sold to customers'
          },
          {
            name: 'expiry_tracking',
            label: 'Track Expiry Dates',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Enable batch and expiry date tracking'
          },
          {
            name: 'preferred_supplier',
            label: 'Preferred Supplier',
            type: 'text',
            placeholder: 'Supplier name or code',
            helpText: 'Default supplier for reordering'
          }
        ]}
        customColumns={[
          {
            key: 'sku',
            header: 'SKU',
            render: (item) => (
              <code className="text-xs font-mono">{item.sku || 'N/A'}</code>
            )
          },
          {
            key: 'stock_status',
            header: 'Stock Status',
            render: (item) => {
              // This would normally come from actual stock data
              const currentStock = Math.floor(Math.random() * 30)
              const minStock = item.min_stock || 5
              const reorderPoint = item.reorder_point || 10
              
              if (currentStock === 0) {
                return <Badge variant="destructive">Out of Stock</Badge>
              } else if (currentStock < minStock) {
                return (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                    <Badge variant="destructive">{currentStock} Low</Badge>
                  </div>
                )
              } else if (currentStock <= reorderPoint) {
                return <Badge variant="secondary">{currentStock} Reorder</Badge>
              } else {
                return <Badge variant="default">{currentStock} In Stock</Badge>
              }
            }
          },
          {
            key: 'pricing',
            header: 'Pricing',
            render: (item) => (
              <div className="space-y-0.5 text-sm">
                <div>
                  <span className="text-muted-foreground">Cost:</span>{' '}
                  <CurrencyDisplay value={item.cost_price || 0} />
                </div>
                <div className="font-medium">
                  <span className="text-muted-foreground">Retail:</span>{' '}
                  <CurrencyDisplay value={item.retail_price || 0} />
                </div>
              </div>
            )
          },
          {
            key: 'margin',
            header: 'Margin',
            render: (item) => {
              const cost = item.cost_price || 0
              const retail = item.retail_price || 0
              const margin = cost > 0 ? ((retail - cost) / retail) * 100 : 0
              
              return (
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-3 h-3 ${margin > 50 ? 'text-green-600' : margin > 30 ? 'text-blue-600' : 'text-amber-600'}`} />
                  <span className={`text-sm font-medium ${margin > 50 ? 'text-green-600' : margin > 30 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {margin.toFixed(1)}%
                  </span>
                </div>
              )
            }
          },
          {
            key: 'type',
            header: 'Type',
            render: (item) => (
              <div className="flex gap-1">
                {item.is_consumable && (
                  <Badge variant="outline" className="text-xs">
                    Professional
                  </Badge>
                )}
                {item.is_retail && (
                  <Badge variant="outline" className="text-xs">
                    Retail
                  </Badge>
                )}
              </div>
            )
          }
        ]}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Inventory Overview',
          metrics: [
            {
              label: 'Total Products',
              value: (items) => items.length
            },
            {
              label: 'Total Value',
              value: (items) => {
                const totalValue = items.reduce((sum, item) => {
                  // This would use actual stock quantities
                  const stock = Math.floor(Math.random() * 30)
                  return sum + (stock * (item.cost_price || 0))
                }, 0)
                return <CurrencyDisplay value={totalValue} />
              }
            },
            {
              label: 'Low Stock Items',
              value: (items) => {
                // This would check actual stock levels
                return Math.floor(items.length * 0.2) // Mock: 20% low stock
              }
            }
          ]
        }}
      />
    </div>
  )
}