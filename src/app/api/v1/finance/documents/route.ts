/**
 * HERA Financial Documents API
 * Smart Code: HERA.FIN.API.DOCS.v1
 *
 * Retrieve financial documents with advanced filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization ID is required'
        },
        { status: 400 }
      )
    }

    // Build query
    let query = supabaseAdmin
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines (
          id,
          line_number,
          entity_id,
          line_type,
          description,
          quantity,
          unit_amount,
          line_amount,
          discount_amount,
          tax_amount,
          metadata
        )
      `
      )
      .eq('organization_id', organizationId)
      .order('transaction_date', { ascending: false })

    // Apply filters
    const documentNumber = searchParams.get('documentNumber')
    if (documentNumber) {
      query = query.ilike('transaction_code', `%${documentNumber}%`)
    }

    const fiscalYear = searchParams.get('fiscalYear')
    if (fiscalYear) {
      query = query
        .gte('transaction_date', `${fiscalYear}-01-01`)
        .lte('transaction_date', `${fiscalYear}-12-31`)
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      query = query.gte('transaction_date', dateFrom)
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      query = query.lte('transaction_date', dateTo)
    }

    const documentType = searchParams.get('documentType')
    if (documentType) {
      query = query.eq('transaction_type', documentType)
    }

    const minAmount = searchParams.get('minAmount')
    if (minAmount) {
      query = query.gte('total_amount', parseFloat(minAmount))
    }

    const maxAmount = searchParams.get('maxAmount')
    if (maxAmount) {
      query = query.lte('total_amount', parseFloat(maxAmount))
    }

    const status = searchParams.get('status')
    if (status) {
      query = query.eq('metadata->status', status)
    }

    // Execute query
    const { data: transactions, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch documents'
        },
        { status: 500 }
      )
    }

    // Transform transactions to documents format
    const documents =
      transactions?.map(tx => ({
        id: tx.id,
        transaction_code: tx.transaction_code,
        transaction_type: tx.transaction_type,
        transaction_date: tx.transaction_date,
        total_amount: tx.total_amount,
        currency: tx.transaction_currency_code || 'AED',
        status: (tx.metadata as any)?.status || 'draft',
        description: tx.description,
        reference_number: tx.reference_number,
        smart_code: tx.smart_code,
        created_by: tx.created_by,
        created_at: tx.created_at,
        fiscal_year: tx.fiscal_year || new Date(tx.transaction_date).getFullYear(),
        fiscal_period: tx.fiscal_period,
        posting_date: (tx.metadata as any)?.posted_at || tx.transaction_date,
        metadata: tx.metadata,
        lines: tx.universal_transaction_lines?.map((line: any, index: number) => ({
          id: line.id,
          line_number: line.line_number || index + 1,
          account_code: (line.metadata as any)?.account_code || line.entity_id,
          account_name: (line.metadata as any)?.account_name || line.description,
          description: line.description,
          debit_amount:
            (line.metadata as any)?.debit || (line.line_amount > 0 ? line.line_amount : 0),
          credit_amount:
            (line.metadata as any)?.credit ||
            (line.line_amount < 0 ? Math.abs(line.line_amount) : 0),
          quantity: line.quantity,
          unit_amount: line.unit_amount,
          line_amount: line.line_amount,
          cost_center: (line.metadata as any)?.cost_center,
          profit_center: (line.metadata as any)?.profit_center
        }))
      })) || []

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
