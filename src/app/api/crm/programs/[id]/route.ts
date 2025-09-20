import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProgramDetail } from '@/types/crm-programs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const orgId = request.headers.get('X-Organization-Id');
  
  if (!orgId) {
    return NextResponse.json(
      { error: 'Organization ID required' },
      { status: 400 }
    );
  }

  try {
    // Get program entity
    const { data: program, error: programError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'program')
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Get dynamic data
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', program.id)
      .eq('organization_id', orgId);

    const fields: Record<string, any> = {};
    dynamicData?.forEach(field => {
      fields[field.field_name] = field.field_value_text || 
                                field.field_value_number || 
                                field.field_value_boolean ||
                                field.field_value_date ||
                                field.field_value_json;
    });

    // Get sponsor organization if exists
    let sponsorOrgName = undefined;
    if (fields.sponsor_org_id) {
      const { data: sponsor } = await supabase
        .from('core_entities')
        .select('entity_name')
        .eq('id', fields.sponsor_org_id)
        .eq('organization_id', orgId)
        .single();
      
      sponsorOrgName = sponsor?.entity_name;
    }

    // Get grant rounds
    const { data: rounds } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_round')
      .eq('metadata->program_id', program.id)
      .order('created_at', { ascending: false });

    const grantRounds = await Promise.all((rounds || []).map(async (round) => {
      // Get round's dynamic data
      const { data: roundDynamic } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', round.id)
        .eq('organization_id', orgId);

      const roundFields: Record<string, any> = {};
      roundDynamic?.forEach(field => {
        roundFields[field.field_name] = field.field_value_text || 
                                       field.field_value_number || 
                                       field.field_value_date ||
                                       field.field_value_json;
      });

      return {
        id: round.id,
        round_code: round.entity_code,
        window_open: roundFields.window_open || round.metadata?.window_open,
        window_close: roundFields.window_close || round.metadata?.window_close,
        budget: roundFields.budget,
        kpis: roundFields.kpis || {},
      };
    }));

    const response: ProgramDetail = {
      id: program.id,
      code: program.entity_code,
      title: program.entity_name,
      status: fields.status || 'active',
      sponsor_org_name: sponsorOrgName,
      sponsor_org_id: fields.sponsor_org_id,
      tags: fields.tags || [],
      budget: fields.budget,
      rounds_count: grantRounds.length,
      smart_code: program.smart_code,
      created_at: program.created_at,
      description: fields.description,
      eligibility_rules: fields.eligibility_rules || {},
      grant_rounds: grantRounds,
    };

    // Find next upcoming window
    const now = new Date();
    const nextRound = grantRounds.find(round => 
      new Date(round.window_open) > now
    );
    
    if (nextRound) {
      response.next_window = {
        open: nextRound.window_open,
        close: nextRound.window_close,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}