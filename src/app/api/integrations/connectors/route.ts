import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Connector } from '@/types/integrations';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    
    // Query connector entities
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'connector')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Get dynamic data for each connector
    const connectorIds = entities?.map(e => e.id) || [];
    let dynamicData: any[] = [];
    
    if (connectorIds.length > 0) {
      const { data: dynData, error: dynError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .in('entity_id', connectorIds);
      
      if (!dynError && dynData) {
        dynamicData = dynData;
      }
    }
    
    // Transform to Connector type
    const connectors: Connector[] = entities?.map((entity: any) => {
      // Aggregate dynamic data fields
      const entityDynamicData = dynamicData.filter(d => d.entity_id === entity.id);
      const dynamicFields: any = {};
      
      entityDynamicData.forEach((field: any) => {
        if (field.field_name === 'oauth_token' && field.field_value_text) {
          dynamicFields.oauth_token = field.is_encrypted ? '••••••••' : field.field_value_text;
        } else if (field.field_name === 'oauth_refresh_token' && field.field_value_text) {
          dynamicFields.oauth_refresh_token = field.is_encrypted ? '••••••••' : field.field_value_text;
        } else if (field.field_name === 'oauth_expires_at' && field.field_value_text) {
          dynamicFields.oauth_expires_at = field.field_value_text;
        } else if (field.field_name === 'account_id' && field.field_value_text) {
          dynamicFields.account_id = field.field_value_text;
        } else if (field.field_name === 'account_name' && field.field_value_text) {
          dynamicFields.account_name = field.field_value_text;
        } else if (field.field_name === 'scopes' && field.field_value_json) {
          dynamicFields.scopes = field.field_value_json;
        } else if (field.field_name === 'sync_cursor' && field.field_value_json) {
          dynamicFields.sync_cursor = field.field_value_json;
        } else if (field.field_name === 'last_sync_at' && field.field_value_text) {
          dynamicFields.last_sync_at = field.field_value_text;
        } else if (field.field_name === 'next_sync_at' && field.field_value_text) {
          dynamicFields.next_sync_at = field.field_value_text;
        } else if (field.field_name === 'sync_schedule' && field.field_value_text) {
          dynamicFields.sync_schedule = field.field_value_text;
        }
      });
      
      // Extract vendor from smart_code (e.g., HERA.INTEGRATION.CONNECTOR.MAILCHIMP.v1 -> mailchimp)
      const vendor = entity.smart_code?.split('.')[3]?.toLowerCase() || '';
      
      // Determine status based on token expiry
      let status = 'active';
      if (dynamicFields.oauth_expires_at) {
        const expiresAt = new Date(dynamicFields.oauth_expires_at);
        if (expiresAt < new Date()) {
          status = 'expired';
        }
      }
      if (!dynamicFields.oauth_token) {
        status = 'inactive';
      }
      
      return {
        id: entity.id,
        entity_code: entity.entity_code,
        entity_name: entity.entity_name,
        smart_code: entity.smart_code,
        vendor: vendor as any,
        status: status as any,
        ...dynamicFields,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
      };
    }) || [];
    
    return NextResponse.json({
      items: connectors,
      total: connectors.length,
    });
  } catch (error) {
    console.error('Error fetching connectors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connectors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const body = await request.json();
    
    // Create a new connector entity using v2 API
    const response = await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify({
        entity_type: 'connector',
        entity_name: `${body.vendor} Integration`,
        entity_code: `CONN-${body.vendor.toUpperCase()}-${Date.now()}`,
        smart_code: `HERA.INTEGRATION.CONNECTOR.${body.vendor.toUpperCase()}.v1`,
        organization_id: orgId,
        metadata: body.metadata || {},
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create connector');
    }
    
    const result = await response.json();
    
    // Emit CREATED transaction
    await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify({
        smart_code: 'HERA.INTEGRATION.CONNECTOR.CREATED.v1',
        metadata: {
          connector_id: result.data.id,
          vendor: body.vendor,
        },
      }),
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating connector:', error);
    return NextResponse.json(
      { error: 'Failed to create connector' },
      { status: 500 }
    );
  }
}