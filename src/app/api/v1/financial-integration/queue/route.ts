import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const filter = searchParams.get('filter') || 'all'

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build query
    let query = supabase
      .from('universal_transactions')
      .select(
        `
        id,
        transaction_code,
        transaction_date,
        transaction_type,
        total_amount,
        transaction_status,
        smart_code,
        description,
        metadata,
        created_at
      `
      )
      .eq('organization_id', organizationId)
      .like('smart_code', 'HERA.ERP.FI.%')

    // Apply filter
    switch (filter) {
      case 'pending':
        query = query.in('transaction_status', ['pending', 'validated'])
        break
      case 'error':
        query = query.eq('transaction_status', 'error')
        break
      case 'posted':
        query = query.eq('transaction_status', 'posted')
        break
    }

    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Calculate stats
    const stats = {
      total: transactions?.length || 0,
      pending:
        transactions?.filter(t => ['pending', 'validated'].includes(t.transaction_status)).length ||
        0,
      posted: transactions?.filter(t => t.transaction_status === 'posted').length || 0,
      error: transactions?.filter(t => t.transaction_status === 'error').length || 0,
      processing: transactions?.filter(t => t.transaction_status === 'posting').length || 0
    }

    return NextResponse.json({
      transactions: transactions || [],
      stats
    })
  } catch (error: any) {
    console.error('Queue API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
