import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Campaign } from '@/types/communications';

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
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');
    const offset = (page - 1) * page_size;
    
    // Build query
    let query = supabase
      .from('core_entities')
      .select('*, core_dynamic_data!inner(*)', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_campaign')
      .order('created_at', { ascending: false })
      .range(offset, offset + page_size - 1);
    
    // Apply filters
    if (q) {
      query = query.or(`entity_name.ilike.%${q}%`);
    }
    
    const { data: entities, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Transform to Campaign type
    const campaigns: Campaign[] = entities?.map((entity: any) => {
      // Extract dynamic fields
      const dynamicFields = entity.core_dynamic_data?.reduce((acc: any, field: any) => {
        acc[field.field_name] = field.field_value_text || field.field_value_number || field.field_value_json;
        return acc;
      }, {}) || {};
      
      return {
        id: entity.id,
        entity_code: entity.entity_code,
        entity_name: entity.entity_name,
        smart_code: entity.smart_code,
        channel: dynamicFields.channel || 'email',
        template_id: dynamicFields.template_id,
        template_name: dynamicFields.template_name,
        audience_id: dynamicFields.audience_id,
        audience_name: dynamicFields.audience_name,
        audience_size: dynamicFields.audience_size || 0,
        schedule_at: dynamicFields.schedule_at,
        throttle_per_min: dynamicFields.throttle_per_min,
        ab_variants: dynamicFields.ab_variants,
        utm: dynamicFields.utm,
        status: dynamicFields.status || entity.status || 'draft',
        metrics: dynamicFields.metrics || {
          sent: 0,
          delivered: 0,
          bounced: 0,
          failed: 0,
          opened: 0,
          clicked: 0,
        },
        created_at: entity.created_at,
        updated_at: entity.updated_at,
      };
    }) || [];
    
    return NextResponse.json({
      items: campaigns,
      total: count || 0,
      page,
      page_size,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}