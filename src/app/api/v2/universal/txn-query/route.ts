import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSchema, queryParamsSchema } from '@/lib/v2/validation'
import { withTxnLogging } from '@/lib/v2/logging/structured-logger'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Zod schema for transaction query payload
const txnQuerySchema = z.object({
  organization_id: z.string().uuid(),
  source_entity_id: z.string().uuid().optional(),
  target_entity_id: z.string().uuid().optional(),
  transaction_type: z.string().optional(),
  smart_code_like: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  include_lines: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Validate payload
    const validation = validateSchema(txnQuerySchema, payload)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validation_errors: validation.errors
        },
        { status: 400 }
      )
    }

    const validatedPayload = validation.data!

    // Build query using direct Supabase table access
    let query = supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', validatedPayload.organization_id)

    // Apply filters
    if (validatedPayload.source_entity_id) {
      query = query.eq('source_entity_id', validatedPayload.source_entity_id)
    }
    if (validatedPayload.target_entity_id) {
      query = query.eq('target_entity_id', validatedPayload.target_entity_id)
    }
    if (validatedPayload.transaction_type) {
      query = query.eq('transaction_type', validatedPayload.transaction_type)
    }
    if (validatedPayload.smart_code_like) {
      query = query.like('notes', `%${validatedPayload.smart_code_like}%`)
    }
    if (validatedPayload.date_from) {
      query = query.gte('transaction_date', validatedPayload.date_from)
    }
    if (validatedPayload.date_to) {
      query = query.lte('transaction_date', validatedPayload.date_to)
    }

    // Apply pagination
    query = query
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(
        validatedPayload.offset || 0,
        (validatedPayload.offset || 0) + (validatedPayload.limit || 100) - 1
      )

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    let transactions = data || []

    // If include_lines is requested, fetch lines for all transactions in ONE query
    if (validatedPayload.include_lines && transactions.length > 0) {
      const transactionIds = transactions.map((txn: any) => txn.id)

      // Single query to fetch all lines for all transactions
      const { data: linesData, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select(
          `
          id,
          transaction_id,
          line_number,
          entity_id,
          line_type,
          description,
          quantity,
          unit_amount,
          line_amount,
          discount_amount,
          tax_amount,
          smart_code,
          line_data,
          metadata,
          ai_confidence,
          created_at,
          updated_at
        `
        )
        .eq('organization_id', validatedPayload.organization_id)
        .in('transaction_id', transactionIds)
        .order('transaction_id')
        .order('line_number')

      if (!linesError && linesData) {
        // ✅ DEBUG: Log first payment line structure
        const firstPaymentLine = linesData.find((l: any) => l.line_type === 'payment')
        if (firstPaymentLine) {
          console.log('[txn-query] 🔍 DEBUG - First payment line structure:', {
            line_type: firstPaymentLine.line_type,
            has_metadata: !!firstPaymentLine.metadata,
            has_line_data: !!firstPaymentLine.line_data,
            metadata_keys: firstPaymentLine.metadata ? Object.keys(firstPaymentLine.metadata) : [],
            line_data_keys: firstPaymentLine.line_data ? Object.keys(firstPaymentLine.line_data) : [],
            payment_method_in_metadata: firstPaymentLine.metadata?.payment_method,
            payment_method_in_line_data: firstPaymentLine.line_data?.payment_method
          })
        }

        // Group lines by transaction_id (optimized grouping)
        const linesByTxn = linesData.reduce((acc: Record<string, any[]>, line: any) => {
          if (!acc[line.transaction_id]) {
            acc[line.transaction_id] = []
          }
          acc[line.transaction_id].push(line)
          return acc
        }, {})

        // Attach lines to each transaction (maintains order)
        transactions = transactions.map((txn: any) => ({
          ...txn,
          lines: linesByTxn[txn.id] || []
        }))
      }
    }

    return NextResponse.json({
      api_version: 'v2',
      transactions,
      total: transactions.length,
      limit: validatedPayload.limit || 100,
      offset: validatedPayload.offset || 0
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
