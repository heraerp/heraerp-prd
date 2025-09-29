// ================================================================================
// HERA POS PRODUCT SELECTOR
// Smart Code: HERA.UI.POS.PRODUCT_SELECTOR.v1
// Product selection with inventory tracking
// ================================================================================

'use client'

import { useState } from 'react'
import { Search, Package, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/lib/hooks/usePos'
import { ProductPrice } from '@/lib/schemas/pos'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ProductSelectorProps {
  products: ProductPrice[]
}

export function ProductSelector({ products }: ProductSelectorProps) {
  const [search, setSearch] = useState('')
  const addProduct = useCartStore(state => state.addProduct)

  // Group products by category
  const categories = Array.from(new Set(products.map(p => p.category || 'Other')))
  const productsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = products.filter(p => (p.category || 'Other') === category)
      return acc
    },
    {} as Record<string, ProductPrice[]>
  )

  // Filter products by search
  const filteredProducts = (categoryProducts: ProductPrice[]) => {
    if (!search) return categoryProducts
    return categoryProducts.filter(
      product =>
        product.product_name.toLowerCase().includes(search.toLowerCase()) ||
        product.product_sku.toLowerCase().includes(search.toLowerCase())
    )
  }

  const handleAddProduct = (product: ProductPrice) => {
    if (product.on_hand === 0) return

    addProduct({
      kind: 'item',
      product_sku: product.product_sku,
      product_name: product.product_name,
      qty: 1,
      unit_price: product.price,
      on_hand: product.on_hand
    })
  }

  const getStockStatus = (onHand: number) => {
    if (onHand === 0) return { label: 'Out of Stock', color: 'destructive' }
    if (onHand <= 10) return { label: 'Low Stock', color: 'warning' }
    return { label: 'In Stock', color: 'default' }
  }

  const ProductCard = ({ product }: { product: ProductPrice }) => {
    const stockStatus = getStockStatus(product.on_hand)
    const isOutOfStock = product.on_hand === 0

    return (
      <Card
        className={cn(
          'p-4 cursor-pointer transition-all',
          isOutOfStock ? 'opacity-50' : 'hover:shadow-md'
        )}
        onClick={() => !isOutOfStock && handleAddProduct(product)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-800">{product.product_name}</h4>
          <Badge variant="secondary" className="bg-primary text-white">
            AED {product.price}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono ink-muted">{product.product_sku}</span>
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 ink-muted" />
            <Badge
              variant={stockStatus.color as any}
              className={cn(
                'text-xs',
                stockStatus.color === 'warning' &&
                  'bg-yellow-100 text-yellow-800 border-yellow-200',
                stockStatus.color === 'destructive' && 'bg-red-100 text-red-800 border-red-200'
              )}
            >
              {product.on_hand} units
            </Badge>
          </div>
        </div>
        {isOutOfStock && (
          <div className="flex items-center gap-1 mt-2 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">Out of stock</span>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 ink-muted h-4 w-4" />
        <Input
          type="search"
          placeholder="Search products..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {search ? (
        // Show all filtered results when searching
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products
            .filter(
              product =>
                product.product_name.toLowerCase().includes(search.toLowerCase()) ||
                product.product_sku.toLowerCase().includes(search.toLowerCase())
            )
            .map(product => (
              <ProductCard key={product.product_sku} product={product} />
            ))}
          {products.filter(
            product =>
              product.product_name.toLowerCase().includes(search.toLowerCase()) ||
              product.product_sku.toLowerCase().includes(search.toLowerCase())
          ).length === 0 && (
            <p className="ink-muted col-span-2 text-center py-8">
              No products found matching "{search}"
            </p>
          )}
        </div>
      ) : (
        // Show categorized view when not searching
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList
            className="grid w-full"
            style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
          >
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productsByCategory[category].map(product => (
                  <ProductCard key={product.product_sku} product={product} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
