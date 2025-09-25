import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const body = await request.json();
    const { subject_id, subject_type = 'constituent' } = body;
    
    if (!subject_id) {
      return NextResponse.json(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }
    
    // Check if journey exists
    const { data: existingJourneys, error: searchError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*)
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_journey')
      .eq('metadata->>subject_id', subject_id);
    
    if (searchError) {
      throw searchError;
    }
    
    // Find active journey
    const activeJourney = existingJourneys?.find(journey => {
      const dynamicData = journey.core_dynamic_data || [];
      const isActive = dynamicData.find(
        (d: any) => d.field_name === 'is_active'
      )?.field_value_text === 'true';
      return isActive;
    });
    
    if (activeJourney) {
      // Return existing journey
      const dynamicData = activeJourney.core_dynamic_data || [];
      const getFieldValue = (fieldName: string, type: 'text' | 'number' | 'json' = 'text') => {
        const field = dynamicData.find((d: any) => d.field_name === fieldName);
        if (!field) return undefined;
        switch (type) {
          case 'number': return field.field_value_number;
          case 'json': return field.field_value_json;
          default: return field.field_value_text;
        }
      };
      
      return NextResponse.json({
        id: activeJourney.id,
        entity_code: activeJourney.entity_code,
        entity_name: activeJourney.entity_name,
        subject_id,
        subject_type,
        current_stage_id: getFieldValue('current_stage_id'),
        score: getFieldValue('score', 'number') || 0,
        is_active: true,
      });
    }
    
    // Create new journey
    // First get the subject name
    const { data: subject } = await supabase
      .from('core_entities')
      .select('entity_name')
      .eq('id', subject_id)
      .single();
    
    const subjectName = subject?.entity_name || 'Unknown';
    
    // Get first stage
    const { data: stages } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*)
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_stage')
      .order('created_at', { ascending: true })
      .limit(1);
    
    const firstStage = stages?.[0];
    if (!firstStage) {
      return NextResponse.json(
        { error: 'No engagement stages found. Please create stages first.' },
        { status: 400 }
      );
    }
    
    // Create journey entity
    const journeyData = {
      entity_type: 'engagement_journey',
      entity_name: `${subjectName} - Journey`,
      entity_code: `JOURNEY-${subject_id}-${Date.now()}`,
      smart_code: 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.JOURNEY.v1',
      organization_id: orgId,
      metadata: {
        subject_id,
      },
    };
    
    const journeyResponse = await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify(journeyData),
    });
    
    if (!journeyResponse.ok) {
      throw new Error('Failed to create journey');
    }
    
    const journeyResult = await journeyResponse.json();
    const journeyId = journeyResult.data.id;
    
    // Add dynamic data fields
    const dynamicFields = [
      { field_name: 'subject_id', field_value_text: subject_id },
      { field_name: 'subject_type', field_value_text: subject_type },
      { field_name: 'current_stage_id', field_value_text: firstStage.id },
      { field_name: 'entered_at', field_value_text: new Date().toISOString() },
      { field_name: 'score', field_value_number: 0 },
      { field_name: 'score_history', field_value_json: [] },
      { field_name: 'stage_history', field_value_json: [] },
      { field_name: 'is_active', field_value_text: 'true' },
    ];
    
    // Use Supabase client for dynamic data
    for (const field of dynamicFields) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          entity_id: journeyId,
          ...field,
          organization_id: orgId,
        }),
      });
    }
    
    // Emit transaction
    await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify({
        smart_code: 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.JOURNEY.CREATED.v1',
        metadata: {
          journey_id: journeyId,
          subject_id,
          subject_type,
          subject_name: subjectName,
          initial_stage_id: firstStage.id,
          initial_stage_name: firstStage.entity_name,
        },
      }),
    });
    
    return NextResponse.json({
      id: journeyId,
      entity_code: journeyData.entity_code,
      entity_name: journeyData.entity_name,
      subject_id,
      subject_type,
      current_stage_id: firstStage.id,
      score: 0,
      is_active: true,
    });
  } catch (error) {
    console.error('Error finding/creating journey:', error);
    return NextResponse.json(
      { error: 'Failed to find or create journey' },
      { status: 500 }
    );
  }
}