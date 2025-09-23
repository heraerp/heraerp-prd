import { NextRequest, NextResponse } from 'next/server'
import { heraCode } from '@/lib/smart-codes'
import { createServiceSupabaseClient } from '@/lib/supabase/service-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, product_ids, branch_id, entity_type = 'product' } = body

    if (!organization_id || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'organization_id and product_ids array are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // Try to use the new function first
    const { data: stockData, error } = await supabase.rpc('fn_entities_with_soh', {
      org_id: organization_id,
      entity_type_filter: entity_type,
      smart_prefixes: ['HERA.SALON.PRODUCT.%', 'HERA.SPA.PRODUCT.%', 'HERA.RETAIL.PRODUCT.%'],
      branch_entity_id: branch_id || null,
      branch_relationship_type: branch_id ? 'branch_of' : null,
      limit_rows: 1000,
      offset_rows: 0
    })

    if (error) {
      console.error('Error with fn_entities_with_soh:', error)

      // Fallback to legacy function
      const { data: fallbackData, error: fallbackError } = await supabase.rpc(
        'calculate_stock_on_hand',
        {
          p_organization_id: organization_id,
          p_product_ids: product_ids,
          p_branch_id: branch_id || null
        }
      )

      if (!fallbackError && fallbackData) {
        // Format response to match expected structure
        const stockLevels =
          fallbackData?.map((item: any) => ({
            product_id: item.product_id,
            stock_on_hand: item.stock_on_hand || 0,
            entity_name: null,
            attributes: {}
          })) || []

        return NextResponse.json({ stock_levels: stockLevels })
      }

      // Final fallback to simple query
      const { data: simpleFallbackData, error: simpleFallbackError } = await supabase
        .from('universal_transaction_lines')
        .select(
          `
          line_entity_id,
          quantity,
          universal_transactions!inner(
            organization_id,
            transaction_type,
            smart_code,
            metadata
          )
        `
        )
        .eq('universal_transactions.organization_id', organization_id)
        .in('line_entity_id', product_ids)
        .in('universal_transactions.transaction_type', [
          'goods_receipt',
          'stock_adjustment',
          'sale'
        ])

      if (simpleFallbackError) {
        return NextResponse.json({ error: 'Failed to fetch stock levels' }, { status: 500 })
      }

      // Calculate stock manually
      const stockMap = new Map<string, number>()

      simpleFallbackData?.forEach(line => {
        const productId = line.line_entity_id
        const quantity = line.quantity || 0
        const txnType = line.universal_transactions.transaction_type

        if (!stockMap.has(productId)) {
          stockMap.set(productId, 0)
        }

        // Add for receipts, subtract for sales
        if (txnType === 'goods_receipt' || txnType === 'stock_adjustment') {
          stockMap.set(productId, (stockMap.get(productId) || 0) + quantity)
        } else if (txnType === 'sale') {
          stockMap.set(productId, (stockMap.get(productId) || 0) - quantity)
        }
      })

      const stockLevels = Array.from(stockMap.entries()).map(([productId, stock]) => ({
        product_id: productId,
        stock_on_hand: Math.max(0, stock) // Don't show negative stock
      }))

      return NextResponse.json({ stock_levels: stockLevels })
    }

    // Filter by requested product IDs and format response
    const stockLevels =
      stockData
        ?.filter((item: any) => product_ids.includes(item.id))
        ?.map((item: any) => ({
          product_id: item.id,
          stock_on_hand: item.qty_on_hand || 0,
          entity_name: item.entity_name,
          entity_code: item.entity_code,
          status: item.status,
          attributes: item.attributes || {}
        })) || []

    return NextResponse.json({ stock_levels: stockLevels })
  } catch (error) {
    console.error('Stock query error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
