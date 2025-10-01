import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { EngagementJourney } from '@/types/engagement'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const searchParams = request.nextUrl.searchParams
    const subjectId = searchParams.get('subject_id')
    const subjectType = searchParams.get('subject_type') as 'constituent' | 'organization'

    if (!subjectId) {
      return NextResponse.json({ error: 'subject_id is required' }, { status: 400 })
    }

    // Find journey for subject
    const { data: journeys, error } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_journey')
      .eq('metadata->>subject_id', subjectId)

    if (error) {
      throw error
    }

    if (!journeys || journeys.length === 0) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 })
    }

    // Find active journey or most recent
    const activeJourney =
      journeys.find(journey => {
        const dynamicData = journey.core_dynamic_data || []
        const isActive =
          dynamicData.find((d: any) => d.field_name === 'is_active')?.field_value_text === 'true'
        return isActive
      }) || journeys[0]

    // Transform to EngagementJourney type
    const dynamicData = activeJourney.core_dynamic_data || []
    const getFieldValue = (fieldName: string, type: 'text' | 'number' | 'json' = 'text') => {
      const field = dynamicData.find((d: any) => d.field_name === fieldName)
      if (!field) return undefined
      switch (type) {
        case 'number':
          return field.field_value_number
        case 'json':
          return field.field_value_json
        default:
          return field.field_value_text
      }
    }

    // Get current stage name
    const currentStageId = getFieldValue('current_stage_id')
    let currentStageName = ''
    if (currentStageId) {
      const { data: stageData } = await supabase
        .from('core_entities')
        .select('entity_name')
        .eq('id', currentStageId)
        .single()
      if (stageData) {
        currentStageName = stageData.entity_name
      }
    }

    // Get subject name
    let subjectName = ''
    const { data: subjectData } = await supabase
      .from('core_entities')
      .select('entity_name')
      .eq('id', subjectId)
      .single()
    if (subjectData) {
      subjectName = subjectData.entity_name
    }

    const journey: EngagementJourney = {
      id: activeJourney.id,
      entity_code: activeJourney.entity_code,
      entity_name: activeJourney.entity_name,
      smart_code: activeJourney.smart_code || 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.JOURNEY.V1',
      subject_id: subjectId,
      subject_type:
        (getFieldValue('subject_type') as 'constituent' | 'organization') ||
        subjectType ||
        'constituent',
      subject_name: subjectName,
      program_ids: getFieldValue('program_ids', 'json') || [],
      current_stage_id: currentStageId || '',
      current_stage_name: currentStageName,
      entered_at: getFieldValue('entered_at') || activeJourney.created_at,
      score: getFieldValue('score', 'number') || 0,
      score_history: getFieldValue('score_history', 'json') || [],
      next_best_action: getFieldValue('next_best_action', 'json'),
      stage_history: getFieldValue('stage_history', 'json') || [],
      is_active: getFieldValue('is_active') === 'true',
      created_at: activeJourney.created_at,
      updated_at: activeJourney.updated_at
    }

    return NextResponse.json(journey)
  } catch (error) {
    console.error('Error fetching journey by subject:', error)
    return NextResponse.json({ error: 'Failed to fetch journey' }, { status: 500 })
  }
}
