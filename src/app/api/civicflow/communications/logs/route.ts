import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    const event_type = searchParams.getAll('event_type');
    const entity_id = searchParams.get('entity_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');
    const offset = (page - 1) * page_size;
    
    // Build query for communication-related logs
    let query = supabase
      .from('universal_transactions')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('transaction_type', [
        'comm_template_created',
        'comm_template_updated',
        'comm_template_deleted',
        'comm_audience_created',
        'comm_audience_updated',
        'comm_audience_deleted',
        'comm_campaign_created',
        'comm_campaign_scheduled',
        'comm_campaign_sent',
        'comm_campaign_cancelled',
        'comm_message_out',
        'comm_message_in',
        'comm_message_delivered',
        'comm_message_bounced',
        'comm_message_opened',
        'comm_message_clicked',
      ])
      .order('created_at', { ascending: false })
      .range(offset, offset + page_size - 1);
    
    // Apply filters
    if (event_type.length > 0) {
      query = query.in('transaction_type', event_type);
    }
    if (entity_id) {
      query = query.eq('reference_entity_id', entity_id);
    }
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      query = query.lte('created_at', date_to);
    }
    
    const { data: logs, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Transform logs to include entity names
    const transformedLogs = await Promise.all(
      logs?.map(async (log) => {
        let entity_name = null;
        let entity_code = null;
        
        if (log.reference_entity_id) {
          const { data: entity } = await supabase
            .from('core_entities')
            .select('entity_name, entity_code')
            .eq('id', log.reference_entity_id)
            .single();
          
          if (entity) {
            entity_name = entity.entity_name;
            entity_code = entity.entity_code;
          }
        }
        
        return {
          ...log,
          entity_name,
          entity_code,
        };
      }) || []
    );
    
    return NextResponse.json({
      items: transformedLogs,
      total: count || 0,
      page,
      page_size,
    });
  } catch (error) {
    console.error('Error fetching communication logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}