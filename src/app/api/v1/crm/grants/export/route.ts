import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ExportGrantsRequest, GrantFilters } from '@/types/crm-grants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Demo organization fallback
const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

function getOrgId(request: NextRequest): string {
  return request.headers.get('X-Organization-Id') || DEMO_ORG_ID;
}

// POST /api/crm/grants/export - Export grant applications
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgId(request);
    const body: ExportGrantsRequest = await request.json();
    const { filters, format } = body;

    // Build query for grant applications
    let query = supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        entity_code,
        status,
        smart_code,
        created_at,
        updated_at,
        metadata
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_application');

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    // Apply search filter
    if (filters.q) {
      query = query.or(`entity_name.ilike.%${filters.q}%,entity_code.ilike.%${filters.q}%`);
    }

    // Get all matching records (no pagination for export)
    query = query.order('created_at', { ascending: false });

    const { data: entities, error } = await query;

    if (error) {
      console.error('Error fetching grant applications for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch grant applications' },
        { status: 500 }
      );
    }

    if (!entities || entities.length === 0) {
      return NextResponse.json(
        { error: 'No grant applications found to export' },
        { status: 404 }
      );
    }

    // Transform to export format
    const exportData = entities.map(entity => ({
      id: entity.id,
      entity_code: entity.entity_code,
      entity_name: entity.entity_name,
      status: entity.status,
      applicant_id: entity.metadata?.applicant_id || '',
      applicant_type: entity.metadata?.applicant_type || '',
      applicant_name: entity.metadata?.applicant_name || '',
      round_id: entity.metadata?.round_id || '',
      round_code: entity.metadata?.round_code || '',
      program_id: entity.metadata?.program_id || '',
      program_title: entity.metadata?.program_title || '',
      program_code: entity.metadata?.program_code || '',
      summary: entity.metadata?.summary || '',
      amount_requested: entity.metadata?.amount_requested || 0,
      amount_awarded: entity.metadata?.amount_awarded || 0,
      score: entity.metadata?.score || 0,
      tags: Array.isArray(entity.metadata?.tags) ? entity.metadata.tags.join(', ') : '',
      review_action: entity.metadata?.review_action || '',
      review_notes: entity.metadata?.review_notes || '',
      smart_code: entity.smart_code,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      last_action_at: entity.metadata?.last_action_at || '',
    }));

    // Apply additional filters in JavaScript
    let filteredData = exportData;

    if (filters.round_id) {
      filteredData = filteredData.filter(item => item.round_id === filters.round_id);
    }

    if (filters.program_id) {
      filteredData = filteredData.filter(item => item.program_id === filters.program_id);
    }

    if (filters.amount_min !== undefined) {
      filteredData = filteredData.filter(item => item.amount_requested >= filters.amount_min!);
    }

    if (filters.amount_max !== undefined) {
      filteredData = filteredData.filter(item => item.amount_requested <= filters.amount_max!);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.tags!.some(tag => 
          item.tags.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    if (format === 'csv') {
      return exportAsCSV(filteredData);
    } else {
      return NextResponse.json({
        data: filteredData,
        count: filteredData.length,
        exported_at: new Date().toISOString(),
        filters: filters,
      });
    }
  } catch (error) {
    console.error('Error exporting grant applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function exportAsCSV(data: any[]): NextResponse {
  if (data.length === 0) {
    return NextResponse.json(
      { error: 'No data to export' },
      { status: 400 }
    );
  }

  // Generate CSV headers
  const headers = [
    'ID',
    'Entity Code',
    'Entity Name',
    'Status',
    'Applicant ID',
    'Applicant Type',
    'Applicant Name',
    'Round ID',
    'Round Code',
    'Program ID',
    'Program Title',
    'Program Code',
    'Summary',
    'Amount Requested',
    'Amount Awarded',
    'Score',
    'Tags',
    'Review Action',
    'Review Notes',
    'Smart Code',
    'Created At',
    'Updated At',
    'Last Action At',
  ];

  // Generate CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      item.id,
      item.entity_code,
      `"${item.entity_name.replace(/"/g, '""')}"`,
      item.status,
      item.applicant_id,
      item.applicant_type,
      `"${item.applicant_name.replace(/"/g, '""')}"`,
      item.round_id,
      item.round_code,
      item.program_id,
      `"${item.program_title.replace(/"/g, '""')}"`,
      item.program_code,
      `"${item.summary.replace(/"/g, '""')}"`,
      item.amount_requested,
      item.amount_awarded,
      item.score,
      `"${item.tags.replace(/"/g, '""')}"`,
      item.review_action,
      `"${item.review_notes.replace(/"/g, '""')}"`,
      item.smart_code,
      item.created_at,
      item.updated_at,
      item.last_action_at,
    ].join(','))
  ].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="grants-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}