import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Template } from '@/types/communications';

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
    const is_active = searchParams.get('is_active');
    const page = parseInt(searchParams.get('page') || '1');
    const page_size = parseInt(searchParams.get('page_size') || '20');
    const offset = (page - 1) * page_size;
    
    // Build query
    let query = supabase
      .from('core_entities')
      .select('*, core_dynamic_data!inner(*)', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_template')
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
    
    // Transform to Template type
    const templates: Template[] = entities?.map((entity: any) => {
      // Extract dynamic fields
      const dynamicFields = entity.core_dynamic_data?.reduce((acc: any, field: any) => {
        acc[field.field_name] = field.field_value_text || 
                                field.field_value_number || 
                                field.field_value_boolean || 
                                field.field_value_json;
        return acc;
      }, {}) || {};
      
      return {
        id: entity.id,
        entity_code: entity.entity_code,
        entity_name: entity.entity_name,
        smart_code: entity.smart_code,
        channel: dynamicFields.channel || 'email',
        version: dynamicFields.version || 1,
        is_active: dynamicFields.is_active !== false,
        subject: dynamicFields.subject,
        body_text: dynamicFields.body_text,
        body_html: dynamicFields.body_html,
        variables: dynamicFields.variables || [],
        tags: dynamicFields.tags || [],
        created_at: entity.created_at,
        updated_at: entity.updated_at,
      };
    }) || [];
    
    return NextResponse.json({
      items: templates,
      total: count || 0,
      page,
      page_size,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}