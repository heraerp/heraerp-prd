import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ExportProgramsRequest } from '@/types/crm-programs';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const orgId = request.headers.get('X-Organization-Id');
  
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization ID required' },
      { status: 400 }
    );
  }

  try {
    const body: ExportProgramsRequest = await request.json();
    const { filters, format } = body;

    // Build query
    let query = supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'program')
      .order('created_at', { ascending: false });

    // Get all programs first (no limit for export)
    const { data: programs, error } = await query;

    if (error) {
      throw error;
    }

    // Get dynamic data for all programs
    const programIds = programs?.map(p => p.id) || [];
    let dynamicData: any[] = [];
    
    if (programIds.length > 0) {
      const { data } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', orgId)
        .in('entity_id', programIds);
      
      dynamicData = data || [];
    }

    // Build field map
    const fieldMap: Record<string, Record<string, any>> = {};
    dynamicData.forEach(field => {
      if (!fieldMap[field.entity_id]) {
        fieldMap[field.entity_id] = {};
      }
      fieldMap[field.entity_id][field.field_name] = 
        field.field_value_text || 
        field.field_value_number || 
        field.field_value_boolean ||
        field.field_value_date ||
        field.field_value_json;
    });

    // Apply filters
    let filteredPrograms = programs?.filter(program => {
      const fields = fieldMap[program.id] || {};

      // Search filter
      if (filters.q) {
        const searchTerm = filters.q.toLowerCase();
        const matchesSearch = 
          program.entity_name.toLowerCase().includes(searchTerm) ||
          program.entity_code.toLowerCase().includes(searchTerm) ||
          (fields.tags || []).some((tag: string) => 
            tag.toLowerCase().includes(searchTerm)
          );
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status?.length) {
        const status = fields.status || 'active';
        if (!filters.status.includes(status)) return false;
      }

      // Tags filter
      if (filters.tags?.length) {
        const programTags = fields.tags || [];
        const hasMatchingTag = filters.tags.some(tag => 
          programTags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Budget filters
      if (filters.budget_min !== undefined && fields.budget < filters.budget_min) {
        return false;
      }
      if (filters.budget_max !== undefined && fields.budget > filters.budget_max) {
        return false;
      }

      return true;
    }) || [];

    // Format response based on requested format
    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Program Code',
        'Title',
        'Status',
        'Budget',
        'Tags',
        'Created Date',
        'Smart Code',
      ];
      
      const rows = filteredPrograms.map(program => {
        const fields = fieldMap[program.id] || {};
        return [
          program.entity_code,
          program.entity_name,
          fields.status || 'active',
          fields.budget || '',
          (fields.tags || []).join('; '),
          new Date(program.created_at).toLocaleDateString(),
          program.smart_code,
        ];
      });

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => 
            typeof cell === 'string' && cell.includes(',') 
              ? `"${cell}"` 
              : cell
          ).join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="programs-export-${new Date().toISOString()}.csv"`,
        },
      });
    } else {
      // Return JSON
      const jsonData = filteredPrograms.map(program => {
        const fields = fieldMap[program.id] || {};
        return {
          id: program.id,
          code: program.entity_code,
          title: program.entity_name,
          status: fields.status || 'active',
          tags: fields.tags || [],
          budget: fields.budget,
          smart_code: program.smart_code,
          created_at: program.created_at,
          description: fields.description,
          sponsor_org_id: fields.sponsor_org_id,
        };
      });

      return NextResponse.json({
        programs: jsonData,
        count: jsonData.length,
        exported_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error exporting programs:', error);
    return NextResponse.json(
      { error: 'Failed to export programs' },
      { status: 500 }
    );
  }
}