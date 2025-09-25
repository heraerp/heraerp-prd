import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SyncJob } from '@/types/integrations';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { vendor: string } }
) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const searchParams = request.nextUrl.searchParams;
    const connectorId = searchParams.get('connector_id');
    
    if (!connectorId) {
      return NextResponse.json(
        { error: 'connector_id is required' },
        { status: 400 }
      );
    }
    
    // Get the most recent sync job for this connector
    const { data: syncJobs, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'sync_job')
      .eq('metadata->>connector_id', connectorId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    if (!syncJobs || syncJobs.length === 0) {
      // No sync job found, return idle status
      return NextResponse.json({
        id: '',
        entity_code: '',
        entity_name: 'No sync job',
        smart_code: '',
        connector_id: connectorId,
        status: 'idle',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as SyncJob);
    }
    
    const syncJob = syncJobs[0];
    const metadata = syncJob.metadata || {};
    
    // Transform to SyncJob type
    const job: SyncJob = {
      id: syncJob.id,
      entity_code: syncJob.entity_code,
      entity_name: syncJob.entity_name,
      smart_code: syncJob.smart_code,
      connector_id: metadata.connector_id || connectorId,
      status: metadata.status || 'idle',
      started_at: metadata.started_at || syncJob.created_at,
      completed_at: metadata.completed_at,
      items_processed: metadata.items_processed,
      items_created: metadata.items_created,
      items_updated: metadata.items_updated,
      items_failed: metadata.items_failed,
      error_message: metadata.error_message,
      sync_cursor: metadata.sync_cursor,
      created_at: syncJob.created_at,
      updated_at: syncJob.updated_at,
    };
    
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}