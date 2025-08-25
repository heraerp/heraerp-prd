/**
 * Stock Levels API
 * Calculate current stock levels from stock movements
 */

import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')
    const productId = searchParams.get('product_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(organizationId)

    // Fetch all stock movements
    const { data: movements } = await universalApi.queryUniversal({
      table: 'universal_transactions',
      filters: {
        transaction_type: 'stock_movement'
      }
    })

    // Fetch all products
    const { data: products } = await universalApi.queryUniversal({
      table: 'core_entities',
      filters: {
        entity_type: 'product'
      }
    })

    // Calculate stock levels
    const stockLevels: Record<string, number> = {}
    
    // Initialize all products with 0 stock
    products?.forEach(product => {
      stockLevels[product.id] = 0
    })

    // Calculate stock from movements
    movements?.forEach(movement => {
      const productId = movement.reference_entity_id
      if (!productId) return

      const quantity = movement.metadata?.quantity || 0
      const movementType = movement.metadata?.movement_type

      if (movementType === 'in') {
        stockLevels[productId] = (stockLevels[productId] || 0) + quantity
      } else if (movementType === 'out') {
        stockLevels[productId] = (stockLevels[productId] || 0) - quantity
      } else if (movementType === 'adjustment') {
        // For adjustments, the quantity is the new stock level
        stockLevels[productId] = quantity
      }
    })

    // If specific product requested
    if (productId) {
      return NextResponse.json({
        productId,
        currentStock: stockLevels[productId] || 0
      })
    }

    // Return all stock levels with product details
    const stockData = products?.map(product => ({
      id: product.id,
      name: product.entity_name,
      sku: product.sku || product.entity_code,
      currentStock: stockLevels[product.id] || 0,
      minStock: product.min_stock || 0,
      maxStock: product.max_stock || 0,
      reorderPoint: product.reorder_point || 0,
      isLowStock: (stockLevels[product.id] || 0) < (product.min_stock || 10),
      isOutOfStock: (stockLevels[product.id] || 0) === 0
    }))

    return NextResponse.json({
      stockLevels: stockData,
      summary: {
        totalProducts: products?.length || 0,
        lowStockCount: stockData?.filter(p => p.isLowStock).length || 0,
        outOfStockCount: stockData?.filter(p => p.isOutOfStock).length || 0
      }
    })
  } catch (error) {
    console.error('Stock levels error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate stock levels' },
      { status: 500 }
    )
  }
}