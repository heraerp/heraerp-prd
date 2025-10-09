import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'
import { callFunction } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Auth verification
    const authResult = await verifyAuth(req)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Get transaction_id from query params
    const { searchParams } = new URL(req.url)
    const transactionId = searchParams.get('transaction_id')

    if (!transactionId) {
      return NextResponse.json({ error: 'transaction_id required' }, { status: 400 })
    }

    // Fetch journal entries for the transaction
    // This would typically call a stored function to get the GL postings
    const journalEntries = await callFunction('hera_get_journal_entries_v1', {
      p_transaction_id: transactionId
    })

    // Mock journal entries for now since we don't have the function yet
    const mockJournalEntries = [
      {
        account_code: '1100000',
        account_name: 'Cash',
        debit: 180.0,
        credit: 0,
        description: 'Service revenue posting'
      },
      {
        account_code: '4110000',
        account_name: 'Service Revenue',
        debit: 0,
        credit: 180.0,
        description: 'Service revenue posting'
      }
    ]

    return NextResponse.json({
      api_version: 'v2',
      journal_entries: journalEntries || mockJournalEntries
    })
  } catch (error: any) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch journal entries', message: error.message },
      { status: 500 }
    )
  }
}
