import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const entityType = searchParams.get('entityType')

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const offset = (page - 1) * pageSize

    // Build base query
    let query = supabase
      .from('universal_transaction_lines')
      .select(`
        id,
        quantity,
        unit_price,
        line_amount,
        smart_code,
        metadata,
        line_number,
        universal_transactions!inner(
          transaction_date,
          transaction_code,
          transaction_type,
          status,
          organization_id
        ),
        core_entities!line_entity_id(
          entity_name,
          entity_type
        )
      `, { count: 'exact' })
      .eq('universal_transactions.organization_id', orgId)
      .neq('universal_transactions.status', 'cancelled')

    if (startDate) {
      query = query.gte('universal_transactions.transaction_date', startDate)
    }
    if (endDate) {
      query = query.lte('universal_transactions.transaction_date', endDate)
    }
    if (entityType) {
      query = query.eq('core_entities.entity_type', entityType)
    }

    // Apply ordering and pagination
    query = query
      .order('transaction_date', { foreignTable: 'universal_transactions', ascending: false })
      .order('transaction_code', { foreignTable: 'universal_transactions', ascending: false })
      .order('line_number', { ascending: true })
      .range(offset, offset + pageSize - 1)

    const { data: lines, count, error } = await query

    if (error) {
      console.error('Failed to fetch transaction lines:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transaction lines', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data to match expected format
    const items = lines?.map(line => ({
      id: line.id,
      transaction_date: line.universal_transactions?.transaction_date,
      transaction_code: line.universal_transactions?.transaction_code,
      transaction_type: line.universal_transactions?.transaction_type,
      item_name: line.core_entities?.entity_name || null,
      entity_type: line.core_entities?.entity_type || null,
      quantity: line.quantity,
      unit_price: line.unit_price,
      line_amount: line.line_amount,
      smart_code: line.smart_code,
      metadata: line.metadata
    })) || []

    const totalPages = Math.ceil((count || 0) / pageSize)

    return NextResponse.json({
      items,
      total: count || 0,
      page,
      pageSize,
      totalPages
    })
  } catch (error) {
    console.error('Unexpected error in transaction lines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}