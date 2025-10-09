/**
 * HERA Enterprise Inventory Levels Analytics Endpoint
 * Smart Code: HERA.API.ANALYTICS.INVENTORY.LEVELS.V1
 *
 * Optimized endpoint for fetching real-time inventory levels
 * Uses Universal API v2 patterns with intelligent aggregation
 *
 * Features:
 * - Per-product, per-branch stock levels
 * - Automatic organization filtering
 * - Efficient batch queries
 * - Cache-friendly responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productIdsParam = searchParams.get('product_ids')
    const productIds = productIdsParam ? productIdsParam.split(',').filter(Boolean) : undefined
    const branchId = searchParams.get('branch_id') || undefined
    const organizationId = searchParams.get('organization_id')

    console.log('[Analytics Inventory Levels] Request:', {
      productIds,
      branchId,
      organizationId
    })

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Query dynamic data for stock quantities
    // Stock levels are stored as dynamic fields: stock_qty_{branch_id}
    let query = supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_number, updated_at')
      .eq('organization_id', organizationId)
      .like('field_name', 'stock_qty_%')

    if (productIds && productIds.length > 0) {
      query = query.in('entity_id', productIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Analytics Inventory Levels] Query error:', error)
      throw error
    }

    console.log('[Analytics Inventory Levels] Raw data rows:', data?.length || 0)

    // Transform to inventory levels format
    const levels = (data || []).map(row => {
      // Extract branch ID from field name (format: stock_qty_{branch_id})
      const branchIdFromField = row.field_name.replace('stock_qty_', '')

      return {
        product_id: row.entity_id,
        branch_id: branchIdFromField,
        on_hand: row.field_value_number || 0,
        reserved: 0, // TODO: Calculate from reservations
        available: row.field_value_number || 0,
        last_updated: row.updated_at || new Date().toISOString()
      }
    })

    // Filter by branch if specified
    const filteredLevels = branchId ? levels.filter(l => l.branch_id === branchId) : levels

    console.log('[Analytics Inventory Levels] Filtered levels:', filteredLevels.length)

    return NextResponse.json(
      {
        items: filteredLevels,
        total_count: filteredLevels.length,
        cached_at: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30', // 30 second cache
          'x-hera-api-version': 'v2'
        }
      }
    )
  } catch (error) {
    console.error('[Analytics Inventory Levels] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory levels',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
