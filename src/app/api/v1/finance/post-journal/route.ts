import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const {
      organizationId,
      transactionId,
      journalEntry,
      amount,
      postingDate,
      reference,
      smartCode
    } = await request.json()

    // Validate required fields
    if (!organizationId || !journalEntry || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the main journal entry transaction
    const { data: journalTransaction, error: journalError } = await supabaseAdmin
      .from('universal_transactions')
      .insert({
        transaction_type: 'journal_entry',
        transaction_code: `JE-${Date.now()}`,
        transaction_date: postingDate || new Date().toISOString(),
        organization_id: organizationId,
        total_amount: amount,
        description: reference || `Manual Journal Entry`,
        smart_code: smartCode || 'HERA.SALON.JOURNAL.MANUAL.V1',
        status: 'posted',
        metadata: {
          source: 'salon_digital_accountant',
          original_transaction_id: transactionId,
          journal_type: 'manual_posting',
          posted_by: 'salon_digital_accountant',
          posting_date: postingDate || new Date().toISOString()
        }
      })
      .select()
      .single()

    if (journalError) {
      console.error('Error creating journal transaction:', journalError)
      return NextResponse.json(
        { success: false, error: 'Failed to create journal entry' },
        { status: 500 }
      )
    }

    // Create journal entry lines for debits and credits
    const journalLines = []
    let lineNumber = 1

    // Add debit lines
    if (journalEntry.debits) {
      for (const debit of journalEntry.debits) {
        journalLines.push({
          transaction_id: journalTransaction.id,
          line_number: lineNumber++,
          line_type: 'debit',
          line_amount: debit.amount,
          description: `DR: ${debit.account}`,
          metadata: {
            account_name: debit.account,
            account_type: 'debit',
            gl_account: debit.account,
            debit_amount: debit.amount,
            credit_amount: 0
          }
        })
      }
    }

    // Add credit lines
    if (journalEntry.credits) {
      for (const credit of journalEntry.credits) {
        journalLines.push({
          transaction_id: journalTransaction.id,
          line_number: lineNumber++,
          line_type: 'credit',
          line_amount: credit.amount,
          description: `CR: ${credit.account}`,
          metadata: {
            account_name: credit.account,
            account_type: 'credit',
            gl_account: credit.account,
            debit_amount: 0,
            credit_amount: credit.amount
          }
        })
      }
    }

    // Insert all journal lines
    if (journalLines.length > 0) {
      const { error: linesError } = await supabaseAdmin
        .from('universal_transaction_lines')
        .insert(journalLines)

      if (linesError) {
        console.error('Error creating journal lines:', linesError)
        return NextResponse.json(
          { success: false, error: 'Failed to create journal entry lines' },
          { status: 500 }
        )
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      glEntryId: journalTransaction.transaction_code,
      transactionId: journalTransaction.id,
      postingDate: journalTransaction.transaction_date,
      message: 'Journal entry posted successfully'
    })
  } catch (error) {
    console.error('Error in post-journal API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
