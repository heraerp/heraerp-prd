// ================================================================================
// TRANSACTION DETAIL API ROUTE
// Smart Code: HERA.API.TXN.DETAIL.V2
// Fetches single transaction with all lines using RPC API v2
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIX: Next.js 15 requires awaiting params
    const { id: transactionId } = await params
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // ✅ Fetch transaction header
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('organization_id', organizationId)
      .single()

    if (txnError || !transaction) {
      console.error('[API] Transaction not found:', txnError)
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // ✅ Fetch transaction lines
    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('organization_id', organizationId)
      .order('line_number', { ascending: true })

    if (linesError) {
      console.error('[API] Error fetching lines:', linesError)
      return NextResponse.json(
        { error: 'Failed to fetch transaction lines' },
        { status: 500 }
      )
    }

    console.log('[API] Transaction detail fetched:', {
      id: transactionId,
      code: transaction.transaction_code,
      lines_count: lines?.length || 0
    })

    return NextResponse.json({
      transaction,
      lines: lines || []
    })
  } catch (error: any) {
    console.error('[API] Error fetching transaction detail:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
