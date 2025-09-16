import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/src/lib/universal-api'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      status = 'draft',
      journalDate,
      reference,
      description,
      journalType = 'standard',
      lines
    } = body

    // Validate required fields
    if (!organizationId || !journalDate || !description || !lines || lines.length < 2) {
      return NextResponse.json(
        {
          error: 'Missing required fields'
        },
        { status: 400 }
      )
    }

    // Calculate totals to ensure balance
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0)
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0)

    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
      return NextResponse.json(
        {
          error: 'Journal entry must be balanced'
        },
        { status: 400 }
      )
    }

    // Generate journal entry code
    const journalCode =
      reference || `JE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    // Create the journal entry transaction
    const journalTransaction = await universalApi.createTransaction({
      organization_id: organizationId,
      transaction_type: 'journal_entry',
      transaction_code: journalCode,
      transaction_date: new Date(journalDate),
      description: description,
      total_amount: totalDebit,
      status: status,
      smart_code: `HERA.FIN.GL.JE.${journalType.toUpperCase()}.v1`,
      metadata: {
        journal_type: journalType,
        posting_status: status,
        created_by: 'digital_accountant',
        created_at: new Date().toISOString()
      }
    })

    if (!journalTransaction.id) {
      throw new Error('Failed to create journal transaction')
    }

    // Create transaction lines
    const linePromises = lines.map(async (line: any, index: number) => {
      // Get GL account entity
      const { data: glAccount } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'gl_account')
        .eq('entity_code', line.accountCode)
        .single()

      if (!glAccount) {
        throw new Error(`GL Account ${line.accountCode} not found`)
      }

      return universalApi.createTransactionLine({
        transaction_id: journalTransaction.id,
        line_number: index + 1,
        line_entity_id: glAccount.id,
        description: line.description || description,
        quantity: 1,
        unit_price: line.debit > 0 ? line.debit : line.credit,
        line_amount: line.debit > 0 ? line.debit : -line.credit,
        metadata: {
          account_code: line.accountCode,
          account_name: line.accountName,
          debit_amount: line.debit || 0,
          credit_amount: line.credit || 0,
          line_type: line.debit > 0 ? 'debit' : 'credit'
        }
      })
    })

    await Promise.all(linePromises)

    // If posting immediately, trigger the auto-journal processing
    if (status === 'posted') {
      try {
        const processResult = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/transactions/auto-journal`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: journalTransaction.id,
              organizationId
            })
          }
        )

        const processData = await processResult.json()
        console.log('Auto-journal processing result:', processData)
      } catch (error) {
        console.error('Auto-journal processing error:', error)
        // Don't fail the request if auto-journal fails
      }
    }

    return NextResponse.json({
      success: true,
      journalId: journalTransaction.id,
      journalCode: journalCode,
      status: status,
      message:
        status === 'posted'
          ? `Journal entry ${journalCode} has been posted successfully`
          : `Journal entry ${journalCode} has been saved as draft`,
      transaction: journalTransaction
    })
  } catch (error) {
    console.error('Journal entry error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create journal entry'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const journalId = searchParams.get('journalId')
    const status = searchParams.get('status')

    if (!organizationId) {
      return NextResponse.json(
        {
          error: 'Organization ID is required'
        },
        { status: 400 }
      )
    }

    // If specific journal ID requested
    if (journalId) {
      const { data: journal, error } = await supabase
        .from('universal_transactions')
        .select(
          `
          *,
          universal_transaction_lines (
            *,
            line_entity:core_entities (
              entity_code,
              entity_name
            )
          )
        `
        )
        .eq('id', journalId)
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'journal_entry')
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        journal
      })
    }

    // List journal entries
    let query = supabase
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines (
          *,
          line_entity:core_entities (
            entity_code,
            entity_name
          )
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'journal_entry')
      .order('transaction_date', { ascending: false })
      .limit(50)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: journals, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      journals,
      count: journals.length
    })
  } catch (error) {
    console.error('Journal fetch error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch journal entries'
      },
      { status: 500 }
    )
  }
}
