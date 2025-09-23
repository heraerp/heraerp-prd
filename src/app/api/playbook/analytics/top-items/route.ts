import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch transaction lines with entity info
    let query = supabase
      .from('universal_transaction_lines')
      .select(`
        line_entity_id,
        quantity,
        unit_price,
        line_amount,
        transaction_id,
        universal_transactions!inner(
          transaction_date,
          transaction_type,
          status,
          organization_id
        ),
        core_entities!line_entity_id(
          id,
          entity_name,
          entity_type
        )
      `)
      .eq('universal_transactions.organization_id', orgId)
      .eq('universal_transactions.transaction_type', 'sale')
      .in('core_entities.entity_type', ['product', 'salon_service', 'service', 'svc'])

    if (startDate) {
      query = query.gte('universal_transactions.transaction_date', startDate)
    }
    if (endDate) {
      query = query.lte('universal_transactions.transaction_date', endDate)
    }

    const { data: lines, error } = await query

    if (error) {
      console.error('Failed to fetch transaction lines:', error)
      return NextResponse.json(
        { error: 'Failed to fetch top items', details: error.message },
        { status: 500 }
      )
    }

    // Group by entity and calculate totals
    const itemStats = new Map<string, {
      item_id: string
      item_name: string
      entity_type: string
      times_sold: Set<string>
      total_quantity: number
      total_revenue: number
      unit_prices: number[]
    }>()

    lines?.forEach(line => {
      const entity = line.core_entities
      if (!entity) return

      if (!itemStats.has(entity.id)) {
        itemStats.set(entity.id, {
          item_id: entity.id,
          item_name: entity.entity_name,
          entity_type: entity.entity_type,
          times_sold: new Set(),
          total_quantity: 0,
          total_revenue: 0,
          unit_prices: []
        })
      }

      const stats = itemStats.get(entity.id)!
      stats.times_sold.add(line.transaction_id)
      stats.total_quantity += line.quantity || 0
      stats.total_revenue += line.line_amount || 0
      if (line.unit_price) stats.unit_prices.push(line.unit_price)
    })

    // Convert to array and calculate averages
    const items = Array.from(itemStats.values())
      .map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        entity_type: item.entity_type,
        times_sold: item.times_sold.size,
        total_quantity: item.total_quantity,
        total_revenue: item.total_revenue,
        average_price: item.unit_prices.length > 0
          ? item.unit_prices.reduce((a, b) => a + b, 0) / item.unit_prices.length
          : 0
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit)

    return NextResponse.json({
      items,
      total: items.length,
      limit
    })
  } catch (error) {
    console.error('Unexpected error in top items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}