import { NextRequest, NextResponse } from 'next/server'
import { heraCode } from '@/lib/smart-codes'
import { createServiceSupabaseClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')
    const product_id = searchParams.get('product_id')
    const branch_id = searchParams.get('branch_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Build query
    let query = supabase
      .from('universal_transactions')
      .select(
        `
        id,
        transaction_code,
        transaction_type,
        transaction_date,
        smart_code,
        metadata,
        created_at,
        universal_transaction_lines!inner(
          id,
          line_entity_id,
          quantity,
          unit_price,
          line_amount,
          metadata
        ),
        from_entity:from_entity_id(
          entity_name,
          entity_code
        ),
        to_entity:to_entity_id(
          entity_name,
          entity_code
        )
      `
      )
      .eq('organization_id', organization_id)
      .in('transaction_type', ['goods_receipt', 'stock_adjustment', 'sale', 'stock_transfer'])
      .order('transaction_date', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    // Filter by product if specified
    if (product_id) {
      query = query.eq('universal_transaction_lines.line_entity_id', product_id)
    }

    // Filter by branch if specified
    if (branch_id) {
      query = query.or(`from_entity_id.eq.${branch_id},to_entity_id.eq.${branch_id}`)
    }

    const { data: movements, error } = await query

    if (error) {
      console.error('Error fetching stock movements:', error)
      return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
    }

    // Transform the data to a cleaner format
    const formattedMovements =
      movements
        ?.map(movement => {
          const lines = movement.universal_transaction_lines || []
          return lines.map((line: any) => ({
            id: line.id,
            transaction_id: movement.id,
            transaction_code: movement.transaction_code,
            transaction_type: movement.transaction_type,
            transaction_date: movement.transaction_date,
            product_id: line.line_entity_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total_value: line.line_amount,
            from_location: movement.from_entity?.entity_name || 'External',
            to_location: movement.to_entity?.entity_name || 'External',
            created_at: movement.created_at,
            metadata: {
              ...movement.metadata,
              ...line.metadata
            }
          }))
        })
        .flat() || []

    return NextResponse.json({
      movements: formattedMovements,
      total: formattedMovements.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('Stock movements error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
