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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params
    const body = await request.json()

    const organizationId = body.p_organization_id
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Build update object from provided fields
    const updateData: any = {}
    if (body.p_transaction_date) updateData.transaction_date = body.p_transaction_date
    if (body.p_source_entity_id !== undefined) updateData.source_entity_id = body.p_source_entity_id
    if (body.p_target_entity_id !== undefined) updateData.target_entity_id = body.p_target_entity_id
    if (body.p_total_amount !== undefined) updateData.total_amount = body.p_total_amount
    if (body.p_status !== undefined) updateData.transaction_status = body.p_status
    if (body.p_metadata !== undefined) updateData.business_context = body.p_metadata
    if (body.p_smart_code !== undefined) updateData.smart_code = body.p_smart_code

    // Update transaction
    const { data, error } = await supabase
      .from('universal_transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating transaction:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('[API] Error updating transaction:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
