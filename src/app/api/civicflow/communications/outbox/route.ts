import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Message } from '@/types/communications';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const searchParams = request.nextUrl.searchParams;
    
    const q = searchParams.get('q');
    const channel = searchParams.getAll('channel');
    const status = searchParams.getAll('status');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');
    const offset = (page - 1) * page_size;
    
    // Build query for outbound messages
    let query = supabase
      .from('universal_transactions')
      .select('*, core_entities!reference_entity_id(*)', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('transaction_type', 'comm_message_out')
      .order('created_at', { ascending: false })
      .range(offset, offset + page_size - 1);
    
    // Apply filters
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      query = query.lte('created_at', date_to);
    }
    
    const { data: transactions, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Transform to Message type
    const messages: Message[] = transactions?.map((txn: any) => {
      const metadata = txn.metadata || {};
      
      return {
        id: txn.id,
        transaction_code: txn.transaction_code,
        direction: 'out',
        channel: metadata.channel || 'email',
        status: metadata.status || 'pending',
        recipient: metadata.recipient || '',
        sender: metadata.sender || 'CivicFlow',
        subject: metadata.subject,
        body_text: metadata.body_text,
        campaign_id: metadata.campaign_id,
        campaign_name: metadata.campaign_name,
        template_id: metadata.template_id,
        template_name: metadata.template_name,
        sent_at: metadata.sent_at,
        delivered_at: metadata.delivered_at,
        opened_at: metadata.opened_at,
        clicked_at: metadata.clicked_at,
        bounced_at: metadata.bounced_at,
        failed_at: metadata.failed_at,
        error_message: metadata.error_message,
        created_at: txn.created_at,
        updated_at: txn.updated_at,
      };
    }) || [];
    
    return NextResponse.json({
      items: messages,
      total: count || 0,
      page,
      page_size,
    });
  } catch (error) {
    console.error('Error fetching outbox messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outbox messages' },
      { status: 500 }
    );
  }
}