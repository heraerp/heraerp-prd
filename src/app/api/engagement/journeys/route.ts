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

    // Parse filters
    const programIds = searchParams.get('program_ids')?.split(',').filter(Boolean)
    const stageIds = searchParams.get('stage_ids')?.split(',').filter(Boolean)
    const subjectType = searchParams.get('subject_type') as 'constituent' | 'organization' | null
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const scoreRange = searchParams.get('score_range')
      ? JSON.parse(searchParams.get('score_range')!)
      : null
    const dateRange = searchParams.get('date_range')
      ? JSON.parse(searchParams.get('date_range')!)
      : null
    const isActive = searchParams.get('is_active') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    // Build query
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_journey')

    // Apply filters via dynamic data
    if (isActive) {
      query = query.eq('metadata->>is_active', 'true')
    }

    // Pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    // Execute query
    const { data: journeys, count, error } = await query

    if (error) {
      throw error
    }

    // Transform to EngagementJourney type
    const transformedJourneys: EngagementJourney[] = await Promise.all(
      (journeys || []).map(async journey => {
        // Extract dynamic data
        const dynamicData = journey.core_dynamic_data || []
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
        const subjectId = getFieldValue('subject_id')
        let subjectName = ''
        if (subjectId) {
          const { data: subjectData } = await supabase
            .from('core_entities')
            .select('entity_name')
            .eq('id', subjectId)
            .single()
          if (subjectData) {
            subjectName = subjectData.entity_name
          }
        }

        return {
          id: journey.id,
          entity_code: journey.entity_code,
          entity_name: journey.entity_name,
          smart_code: journey.smart_code || 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.JOURNEY.v1',
          subject_id: subjectId || '',
          subject_type:
            (getFieldValue('subject_type') as 'constituent' | 'organization') || 'constituent',
          subject_name: subjectName,
          program_ids: getFieldValue('program_ids', 'json') || [],
          current_stage_id: currentStageId || '',
          current_stage_name: currentStageName,
          entered_at: getFieldValue('entered_at') || journey.created_at,
          score: getFieldValue('score', 'number') || 0,
          score_history: getFieldValue('score_history', 'json') || [],
          next_best_action: getFieldValue('next_best_action', 'json'),
          stage_history: getFieldValue('stage_history', 'json') || [],
          is_active: getFieldValue('is_active') === 'true',
          created_at: journey.created_at,
          updated_at: journey.updated_at
        }
      })
    )

    // Apply post-transform filters
    let filteredJourneys = transformedJourneys

    if (programIds?.length) {
      filteredJourneys = filteredJourneys.filter(j =>
        j.program_ids?.some(pid => programIds.includes(pid))
      )
    }

    if (stageIds?.length) {
      filteredJourneys = filteredJourneys.filter(j => stageIds.includes(j.current_stage_id))
    }

    if (subjectType) {
      filteredJourneys = filteredJourneys.filter(j => j.subject_type === subjectType)
    }

    if (scoreRange) {
      filteredJourneys = filteredJourneys.filter(
        j => j.score >= scoreRange.min && j.score <= scoreRange.max
      )
    }

    if (dateRange) {
      const fromDate = new Date(dateRange.from).getTime()
      const toDate = new Date(dateRange.to).getTime()
      filteredJourneys = filteredJourneys.filter(j => {
        const createdAt = new Date(j.created_at).getTime()
        return createdAt >= fromDate && createdAt <= toDate
      })
    }

    return NextResponse.json({
      items: filteredJourneys,
      total: count || 0
    })
  } catch (error) {
    console.error('Error fetching engagement journeys:', error)
    return NextResponse.json({ error: 'Failed to fetch engagement journeys' }, { status: 500 })
  }
}
