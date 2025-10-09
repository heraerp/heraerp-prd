import { NextRequest, NextResponse } from 'next/server'
import { validateEvent, preflight } from '@/lib/guardrail'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid_json' }, { status: 400 })

  // JSON Schema validation
  const valid = validateEvent(body)
  if (!valid) {
    return NextResponse.json(
      { error: 'schema_validation_failed', details: (validateEvent as any).errors },
      { status: 400 }
    )
  }

  // Guardrail checks
  const checks = preflight(body)
  if (checks.length) {
    return NextResponse.json({ error: 'guardrail_failed', details: checks }, { status: 400 })
  }

  try {
    // Step 1: Insert transaction header
    // Generate transaction number
    const transactionNumber = `${body.transaction_type}-${Date.now().toString().slice(-8)}`

    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: body.organization_id,
        transaction_type: body.transaction_type,
        transaction_code: transactionNumber,
        transaction_date: body.transaction_date,
        source_entity_id: body.source_entity_id || null,
        target_entity_id: body.target_entity_id || null,
        transaction_status: body.business_context?.status || 'completed',
        smart_code: body.smart_code,
        total_amount: 0, // Will be calculated from lines
        metadata: body.business_context || {}
      })
      .select('id')
      .single()

    if (txnError) {
      console.error('Error inserting transaction:', txnError)
      throw new Error(txnError.message)
    }

    const transactionId = transaction.id

    // Step 2: Insert transaction lines
    if (body.lines && body.lines.length > 0) {
      const lines = body.lines.map((line: any, index: number) => {
        const quantity = line.quantity || 1
        const unitAmount = line.unit_amount || 0
        const lineAmount = line.line_amount || (quantity * unitAmount)

        return {
          transaction_id: transactionId,
          organization_id: body.organization_id,
          line_number: index + 1,
          entity_id: line.entity_id || null,
          line_type: line.line_type || 'item',
          description: line.description || line.line_type || 'Transaction line',
          quantity,
          unit_amount: unitAmount,
          line_amount: lineAmount,
          discount_amount: line.discount_amount || 0,
          tax_amount: line.tax_amount || 0,
          smart_code: line.smart_code || body.smart_code || 'HERA.TXN.LINE.DEFAULT.V1',
          line_data: { line_type: line.line_type }
        }
      })

      const { error: linesError } = await supabase
        .from('universal_transaction_lines')
        .insert(lines)

      if (linesError) {
        console.error('Error inserting transaction lines:', linesError)
        // Rollback transaction by deleting it
        await supabase
          .from('universal_transactions')
          .delete()
          .eq('id', transactionId)
        throw new Error(linesError.message)
      }

      // Step 3: Update total amount
      const totalAmount = lines.reduce((sum, line) => sum + (line.line_amount || 0), 0)
      await supabase
        .from('universal_transactions')
        .update({ total_amount: totalAmount })
        .eq('id', transactionId)
    }

    return NextResponse.json(
      {
        api_version: 'v2',
        transaction_id: transactionId
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in txn-emit:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
