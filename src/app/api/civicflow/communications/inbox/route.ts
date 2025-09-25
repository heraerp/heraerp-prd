import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Message } from '@/types/communications'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const searchParams = request.nextUrl.searchParams

    const q = searchParams.get('q')
    const channel = searchParams.getAll('channel')
    const status = searchParams.getAll('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const page_size = parseInt(searchParams.get('page_size') || '20')
    const offset = (page - 1) * page_size

    // Build query for inbound messages
    let query = supabase
      .from('universal_transactions')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('transaction_type', 'comm_message_in')
      .order('created_at', { ascending: false })
      .range(offset, offset + page_size - 1)

    // Apply filters
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const { data: transactions, error, count } = await query

    if (error) {
      throw error
    }

    // Transform to Message type
    const messages: Message[] =
      transactions?.map((txn: any) => {
        const metadata = txn.metadata || {}

        return {
          id: txn.id,
          entity_code: txn.transaction_code || '',
          smart_code: txn.smart_code || '',
          direction: 'in' as const,
          channel: (metadata.channel || 'email') as any,
          to: 'CivicFlow',
          from: metadata.sender || metadata.from || '',
          subject: metadata.subject,
          body_preview: metadata.body_preview || metadata.body_text?.substring(0, 200),
          status: (metadata.status || 'received') as any,
          provider_ids: metadata.provider_ids,
          error: metadata.error_message,
          meta: metadata,
          campaign_id: metadata.campaign_id,
          campaign_name: metadata.campaign_name,
          subject_id: metadata.subject_id,
          subject_type: metadata.subject_type,
          subject_name: metadata.subject_name,
          created_at: txn.created_at,
          updated_at: txn.updated_at
        }
      }) || []

    return NextResponse.json({
      items: messages,
      total: count || 0,
      page,
      page_size
    })
  } catch (error) {
    console.error('Error fetching inbox messages:', error)
    return NextResponse.json({ error: 'Failed to fetch inbox messages' }, { status: 500 })
  }
}
