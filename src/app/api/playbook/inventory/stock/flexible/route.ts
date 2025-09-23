import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      organization_id,
      entity_type = 'product',
      smart_code_patterns = ['HERA.SALON.PRODUCT.%'],
      branch_id,
      branch_relationship_type = 'branch_of',
      limit = 500,
      offset = 0
    } = body

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // Use the flexible entities with SOH function
    const { data: stockData, error } = await supabase
      .rpc('fn_entities_with_soh', {
        org_id: organization_id,
        entity_type_filter: entity_type,
        smart_prefixes: smart_code_patterns,
        branch_entity_id: branch_id || null,
        branch_relationship_type: branch_id ? branch_relationship_type : null,
        limit_rows: limit,
        offset_rows: offset
      })

    if (error) {
      console.error('Error fetching entities with SOH:', error)
      
      // Fallback to manual calculation
      let query = supabase
        .from('core_entities')
        .select(`
          *,
          universal_transaction_lines!inner(
            quantity,
            universal_transactions!inner(
              transaction_type,
              status
            )
          )
        `)
        .eq('organization_id', organization_id)
        .eq('entity_type', entity_type)

      // Apply smart code filters
      if (smart_code_patterns && smart_code_patterns.length > 0) {
        const orConditions = smart_code_patterns
          .map(pattern => `smart_code.ilike.${pattern}`)
          .join(',')
        query = query.or(orConditions)
      }

      // Apply branch filter if provided
      if (branch_id) {
        query = query.eq('branch_id', branch_id)
      }

      const { data: entities, error: entitiesError } = await query
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (entitiesError) {
        return NextResponse.json(
          { error: 'Failed to fetch entities' },
          { status: 500 }
        )
      }

      // Calculate stock manually
      const stockLevels = entities?.map(entity => {
        const stock = entity.universal_transaction_lines?.reduce((sum: number, line: any) => {
          const txn = line.universal_transactions
          if (txn.status === 'draft' || txn.status === 'cancelled') return sum
          
          const qty = line.quantity || 0
          if (txn.transaction_type === 'sale' || 
              txn.transaction_type === 'stock_adjustment_out' ||
              txn.transaction_type === 'damage' ||
              txn.transaction_type === 'loss') {
            return sum - Math.abs(qty)
          }
          return sum + Math.abs(qty)
        }, 0) || 0

        return {
          id: entity.id,
          entity_code: entity.entity_code,
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          status: entity.status,
          smart_code: entity.smart_code,
          qty_on_hand: stock,
          attributes: entity.metadata || {}
        }
      }) || []

      return NextResponse.json({ 
        entities_with_stock: stockLevels,
        total: stockLevels.length,
        limit,
        offset
      })
    }

    return NextResponse.json({ 
      entities_with_stock: stockData || [],
      total: stockData?.length || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Stock query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for simpler queries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const organization_id = searchParams.get('organization_id')
  const entity_type = searchParams.get('entity_type') || 'product'
  const branch_id = searchParams.get('branch_id')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!organization_id) {
    return NextResponse.json(
      { error: 'organization_id is required' },
      { status: 400 }
    )
  }

  // Determine smart code patterns based on entity type
  let smart_code_patterns: string[] = []
  switch (entity_type) {
    case 'product':
      smart_code_patterns = ['HERA.SALON.PRODUCT.%', 'HERA.SPA.PRODUCT.%', 'HERA.RETAIL.PRODUCT.%']
      break
    case 'material':
      smart_code_patterns = ['HERA.MFG.MATERIAL.%', 'HERA.CONSTRUCTION.MATERIAL.%']
      break
    case 'supply':
      smart_code_patterns = ['HERA.HEALTHCARE.SUPPLY.%', 'HERA.DENTAL.SUPPLY.%']
      break
    default:
      smart_code_patterns = [`%.${entity_type.toUpperCase()}.%`]
  }

  // Call the POST endpoint with constructed parameters
  const response = await POST(new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      organization_id,
      entity_type,
      smart_code_patterns,
      branch_id,
      limit,
      offset
    })
  }))

  return response
}