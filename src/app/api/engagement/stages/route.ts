import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { EngagementStage } from '@/types/engagement'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID

    // Fetch engagement stages
    const { data: stages, error } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'engagement_stage')
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // Transform to EngagementStage type
    const transformedStages: EngagementStage[] = (stages || []).map(stage => {
      // Extract dynamic data
      const dynamicData = stage.core_dynamic_data || []
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

      return {
        id: stage.id,
        entity_code: stage.entity_code,
        entity_name: stage.entity_name,
        smart_code: stage.smart_code || 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.STAGE.v1',
        ordinal: getFieldValue('ordinal', 'number') || 1,
        description: getFieldValue('description'),
        color: getFieldValue('color') || 'bg-gray-500',
        icon: getFieldValue('icon'),
        entry_criteria: getFieldValue('entry_criteria', 'json'),
        exit_criteria: getFieldValue('exit_criteria', 'json'),
        scoring_rules: getFieldValue('scoring_rules', 'json') || [],
        status: getFieldValue('status') || 'active',
        created_at: stage.created_at,
        updated_at: stage.updated_at
      }
    })

    // Sort by ordinal
    transformedStages.sort((a, b) => a.ordinal - b.ordinal)

    return NextResponse.json(transformedStages)
  } catch (error) {
    console.error('Error fetching engagement stages:', error)
    return NextResponse.json({ error: 'Failed to fetch engagement stages' }, { status: 500 })
  }
}
