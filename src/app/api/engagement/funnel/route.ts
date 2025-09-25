import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { EngagementFunnel, FunnelStage } from '@/types/engagement';

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
    const programIds = searchParams.get('program_ids')?.split(',').filter(Boolean);
    
    // Fetch all stages
    const { data: stages, error: stagesError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*)
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_stage')
      .order('created_at', { ascending: true });
    
    if (stagesError) {
      throw stagesError;
    }
    
    // Fetch all journeys
    let journeyQuery = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data(*)
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_journey');
    
    const { data: journeys, error: journeysError } = await journeyQuery;
    
    if (journeysError) {
      throw journeysError;
    }
    
    // Process stages and count journeys
    const stageMap = new Map<string, FunnelStage>();
    const orderedStages: any[] = [];
    
    (stages || []).forEach((stage) => {
      const dynamicData = stage.core_dynamic_data || [];
      const getFieldValue = (fieldName: string, type: 'text' | 'number' | 'json' = 'text') => {
        const field = dynamicData.find((d: any) => d.field_name === fieldName);
        if (!field) return undefined;
        switch (type) {
          case 'number': return field.field_value_number;
          case 'json': return field.field_value_json;
          default: return field.field_value_text;
        }
      };
      
      const ordinal = getFieldValue('ordinal', 'number') || 1;
      orderedStages.push({
        id: stage.id,
        name: stage.entity_name,
        ordinal,
      });
      
      stageMap.set(stage.id, {
        stage_id: stage.id,
        stage_name: stage.entity_name,
        count: 0,
        percentage: 0,
        avg_time_in_stage: 0,
        conversion_rate: 0,
      });
    });
    
    // Sort stages by ordinal
    orderedStages.sort((a, b) => a.ordinal - b.ordinal);
    
    // Count journeys per stage
    let totalJourneys = 0;
    const stageTimings = new Map<string, number[]>();
    
    (journeys || []).forEach((journey) => {
      const dynamicData = journey.core_dynamic_data || [];
      const getFieldValue = (fieldName: string, type: 'text' | 'number' | 'json' = 'text') => {
        const field = dynamicData.find((d: any) => d.field_name === fieldName);
        if (!field) return undefined;
        switch (type) {
          case 'number': return field.field_value_number;
          case 'json': return field.field_value_json;
          default: return field.field_value_text;
        }
      };
      
      const currentStageId = getFieldValue('current_stage_id');
      const isActive = getFieldValue('is_active') === 'true';
      const enteredAt = getFieldValue('entered_at') || journey.created_at;
      const programIdList = getFieldValue('program_ids', 'json') || [];
      
      // Filter by program if specified
      if (programIds?.length && !programIdList.some((pid: string) => programIds.includes(pid))) {
        return;
      }
      
      if (isActive && currentStageId && stageMap.has(currentStageId)) {
        const stage = stageMap.get(currentStageId)!;
        stage.count++;
        totalJourneys++;
        
        // Calculate time in stage
        const timeInStage = Math.floor(
          (Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (!stageTimings.has(currentStageId)) {
          stageTimings.set(currentStageId, []);
        }
        stageTimings.get(currentStageId)!.push(timeInStage);
      }
    });
    
    // Calculate percentages and average times
    let previousCount = totalJourneys;
    const funnelStages: FunnelStage[] = [];
    
    orderedStages.forEach((orderedStage, index) => {
      const stage = stageMap.get(orderedStage.id)!;
      
      // Calculate percentage
      stage.percentage = totalJourneys > 0 ? Math.round((stage.count / totalJourneys) * 100) : 0;
      
      // Calculate average time
      const timings = stageTimings.get(orderedStage.id) || [];
      if (timings.length > 0) {
        stage.avg_time_in_stage = Math.round(
          timings.reduce((sum, time) => sum + time, 0) / timings.length
        );
      }
      
      // Calculate conversion rate to next stage
      if (index < orderedStages.length - 1) {
        const nextStage = stageMap.get(orderedStages[index + 1].id)!;
        stage.conversion_rate = stage.count > 0 
          ? Math.round((nextStage.count / stage.count) * 100)
          : 0;
      }
      
      funnelStages.push(stage);
    });
    
    // Calculate overall conversion rate (from first to last stage)
    const firstStage = funnelStages[0];
    const lastStage = funnelStages[funnelStages.length - 1];
    const conversionRate = firstStage?.count > 0
      ? Math.round((lastStage?.count || 0) / firstStage.count * 100)
      : 0;
    
    // Calculate average time to convert
    let avgTimeToConvert = 0;
    if (lastStage && stageTimings.has(lastStage.stage_id)) {
      const timings = stageTimings.get(lastStage.stage_id)!;
      avgTimeToConvert = timings.length > 0
        ? Math.round(timings.reduce((sum, time) => sum + time, 0) / timings.length)
        : 0;
    }
    
    const funnel: EngagementFunnel = {
      stages: funnelStages,
      total_journeys: totalJourneys,
      conversion_rate: conversionRate,
      avg_time_to_convert: avgTimeToConvert,
    };
    
    return NextResponse.json(funnel);
  } catch (error) {
    console.error('Error fetching engagement funnel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement funnel' },
      { status: 500 }
    );
  }
}