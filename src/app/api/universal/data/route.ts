import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/src/lib/supabase-lazy'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('org_id')
  const table = searchParams.get('table')
  const entityType = searchParams.get('entity_type')
  const transactionType = searchParams.get('transaction_type')
  const limit = searchParams.get('limit') || '100'

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 })
  }

  try {
    console.log('API: Universal data request:', {
      organizationId,
      table,
      entityType,
      transactionType,
      limit: parseInt(limit)
    })

    const db = getSupabaseClient()
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    let query = db
      .from(table)
      .select('*')
      .eq('organization_id', organizationId)
      .limit(parseInt(limit))

    // Add entity_type filter if specified
    if (entityType && table === 'core_entities') {
      query = query.eq('entity_type', entityType)
    }

    // Add transaction_type filter if specified
    if (transactionType && table === 'universal_transactions') {
      query = query.eq('transaction_type', transactionType)
    }

    // Add order by for transactions
    if (table === 'universal_transactions') {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('API: Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`API: Found ${data?.length || 0} records`)

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    })
  } catch (error) {
    console.error('API: Request error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, table, data: insertData } = body

    if (!organizationId || !table || !insertData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('API: Universal data insert:', {
      organizationId,
      table,
      recordCount: Array.isArray(insertData) ? insertData.length : 1
    })

    // Ensure organization_id is set on all records
    const dataWithOrgId = Array.isArray(insertData)
      ? insertData.map(record => ({ ...record, organization_id: organizationId }))
      : { ...insertData, organization_id: organizationId }

    const db = getSupabaseClient()
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data, error } = await db.from(table).insert(dataWithOrgId).select()

    if (error) {
      console.error('API: Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`API: Inserted ${data?.length || 0} records`)

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    })
  } catch (error) {
    console.error('API: Insert request error:', error)
    return NextResponse.json({ error: 'Failed to insert data' }, { status: 500 })
  }
}
