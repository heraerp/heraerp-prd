import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/v1/transactions - Universal transaction fetch
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const transaction_type = searchParams.get('transaction_type')
    const transaction_id = searchParams.get('transaction_id')
    const status = searchParams.get('status')
    const include_lines = searchParams.get('include_lines') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get organization_id from mock context (in production, extract from JWT)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    // Build transaction query
    let query = supabaseAdmin
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('transaction_date', { ascending: false })
      .limit(limit)

    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type)
    }

    if (transaction_id) {
      query = query.eq('id', transaction_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // If including transaction lines
    if (include_lines && transactions && transactions.length > 0) {
      const transactionIds = transactions.map(t => t.id)

      const { data: transactionLines, error: linesError } = await supabaseAdmin
        .from('universal_transaction_lines')
        .select(
          `
          *,
          entity:core_entities!universal_transaction_lines_entity_id_fkey(
            id, 
            entity_name, 
            entity_code, 
            entity_category,
            entity_subcategory
          )
        `
        )
        .in('transaction_id', transactionIds)
        .order('line_order', { ascending: true })

      if (linesError) {
        console.error('Error fetching transaction lines:', linesError)
        return NextResponse.json(
          { success: false, message: 'Failed to fetch transaction lines' },
          { status: 500 }
        )
      }

      // Combine transactions with their lines
      const transactionsWithLines = transactions.map(transaction => {
        const lines = transactionLines?.filter(line => line.transaction_id === transaction.id) || []

        return {
          ...transaction,
          lines: lines.map(line => ({
            id: line.id,
            line_order: line.line_order,
            entity_id: line.entity_id,
            entity_name: line.entity?.entity_name || 'Unknown Item',
            entity_code: line.entity?.entity_code,
            entity_category: line.entity?.entity_category,
            entity_subcategory: line.entity?.entity_subcategory,
            line_description: line.line_description,
            quantity: line.quantity || 0,
            unit_price: line.unit_price || 0,
            line_total: line.line_amount || line.quantity * line.unit_price || 0,
            discount_amount: line.discount_amount || 0,
            tax_amount: line.tax_amount || 0,
            line_data: line.metadata || {},
            special_instructions: (line.metadata as any)?.special_instructions || null,
            modifications: (line.metadata as any)?.modifications || []
          }))
        }
      })

      return NextResponse.json({
        success: true,
        data: transaction_id ? transactionsWithLines[0] : transactionsWithLines,
        count: transactionsWithLines.length
      })
    }

    return NextResponse.json({
      success: true,
      data: transaction_id ? transactions[0] : transactions,
      count: transactions?.length || 0
    })
  } catch (error) {
    console.error('Universal transactions API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/transactions - Universal transaction update
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    const { id, status, transaction_data, notes, tags } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Update transaction
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (status !== undefined) updateData.status = status
    if (transaction_data !== undefined) updateData.transaction_data = transaction_data
    if (notes !== undefined) updateData.notes = notes
    if (tags !== undefined) updateData.tags = tags

    const { error: updateError } = await supabaseAdmin
      .from('universal_transactions')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully'
    })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/transactions - Universal transaction creation
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    const {
      transaction_type,
      reference_number,
      counterparty_id,
      items,
      transaction_data = {},
      notes,
      tags = [],
      status = 'pending'
    } = body

    if (!transaction_type) {
      return NextResponse.json(
        { success: false, message: 'Transaction type is required' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal =
      items?.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0) || 0
    const total_amount = subtotal // TODO: Add tax and discount calculations

    // Generate transaction number if not provided
    const transaction_number =
      reference_number || `TXN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type,
        transaction_number,
        reference_number: reference_number || transaction_number,
        counterparty_id,
        transaction_date: new Date().toISOString(),
        subtotal_amount: subtotal,
        total_amount,
        status,
        transaction_data,
        notes,
        tags
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json(
        { success: false, message: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // Create transaction lines if provided
    if (items && items.length > 0) {
      const lineItems = items.map((item: any, index: number) => ({
        transaction_id: transaction.id,
        organization_id: organizationId,
        line_order: index + 1,
        entity_id: item.entity_id,
        line_description: item.description || item.name || 'Transaction Item',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        line_amount: (item.quantity || 1) * (item.unit_price || 0),
        metadata: item.line_data || {}
      }))

      const { error: linesError } = await supabaseAdmin
        .from('universal_transaction_lines')
        .insert(lineItems)

      if (linesError) {
        console.error('Error creating transaction lines:', linesError)
        return NextResponse.json(
          { success: false, message: 'Failed to create transaction items' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id,
        transaction_number,
        reference_number: transaction.reference_number,
        total_amount,
        status
      }
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
