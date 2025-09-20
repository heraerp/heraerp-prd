import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { GrantApplicationDetail } from '@/types/crm-grants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Demo organization fallback
const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

function getOrgId(request: NextRequest): string {
  return request.headers.get('X-Organization-Id') || DEMO_ORG_ID
}

// GET /api/crm/grants/[id] - Get specific grant application
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = getOrgId(request)
    const applicationId = params.id

    // Get the grant application entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', applicationId)
      .eq('entity_type', 'grant_application')
      .single()

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Grant application not found' }, { status: 404 })
    }

    // Get dynamic data for the application
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_id', applicationId)

    // Get relationships to find applicant and round details
    const { data: relationships } = await supabase
      .from('core_relationships')
      .select(
        `
        relationship_type,
        to_entity_id,
        core_entities!core_relationships_to_entity_id_fkey (
          id,
          entity_name,
          entity_code,
          entity_type,
          metadata
        )
      `
      )
      .eq('organization_id', orgId)
      .eq('from_entity_id', applicationId)
      .in('relationship_type', ['has_applicant', 'belongs_to_round'])

    // Extract applicant and round information
    const applicantRel = relationships?.find(r => r.relationship_type === 'has_applicant')
    const roundRel = relationships?.find(r => r.relationship_type === 'belongs_to_round')

    // Build dynamic data lookup
    const dynamicFields =
      dynamicData?.reduce((acc, field) => {
        acc[field.field_name] =
          field.field_value_text || field.field_value_number || field.field_value_boolean
        return acc
      }, {} as any) || {}

    // Get tags from dynamic data
    const tags =
      dynamicData
        ?.filter(d => d.field_name === 'tag')
        .map(d => d.field_value_text)
        .filter(Boolean) || []

    // Build the application detail response
    const application: GrantApplicationDetail = {
      id: entity.id,
      applicant: {
        id: applicantRel?.core_entities?.id || entity.metadata?.applicant_id || '',
        type: entity.metadata?.applicant_type || 'constituent',
        name:
          applicantRel?.core_entities?.entity_name ||
          entity.metadata?.applicant_name ||
          `${entity.metadata?.applicant_type} - ${entity.metadata?.applicant_id}`
      },
      round: {
        id: roundRel?.core_entities?.id || entity.metadata?.round_id || '',
        round_code:
          roundRel?.core_entities?.entity_code ||
          entity.metadata?.round_code ||
          `ROUND-${entity.metadata?.round_id}`
      },
      program: {
        id: entity.metadata?.program_id || 'program-id',
        title: entity.metadata?.program_title || 'Program Title',
        code: entity.metadata?.program_code || 'PROG-CODE'
      },
      status: (entity.status as any) || 'draft',
      amount_requested: entity.metadata?.amount_requested || dynamicFields.amount_requested,
      amount_awarded: entity.metadata?.amount_awarded,
      score: entity.metadata?.score,
      last_action_at: entity.metadata?.last_action_at,
      summary: entity.metadata?.summary || dynamicFields.summary,
      documents: entity.metadata?.documents || [],
      tags: tags.length > 0 ? tags : entity.metadata?.tags,
      scoring: entity.metadata?.scoring,
      pending_step: entity.metadata?.pending_step,
      smart_code: entity.smart_code,
      created_at: entity.created_at
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error getting grant application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
