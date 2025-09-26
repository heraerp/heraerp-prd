import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const isDemo = isDemoMode(orgId)

    // Fetch organization with all necessary data for overview
    const { data: entity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'ps_org')
      .single()

    if (!entity) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Fetch all dynamic fields
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', entityId)
      .eq('organization_id', orgId)

    const dynamicData: any = {}
    dynamicFields?.forEach(field => {
      const value = field.field_value_text || field.field_value_number || field.field_value_json
      dynamicData[field.field_name] = value
    })

    // Fetch program relationships
    const { data: programRels } = await supabase
      .from('core_relationships')
      .select(
        `
        *,
        to_entity:to_entity_id(
          id,
          entity_name,
          entity_code
        )
      `
      )
      .eq('from_entity_id', entityId)
      .eq('relationship_type', 'enrolled_in_program')
      .eq('organization_id', orgId)

    const programs =
      programRels?.map(rel => ({
        id: rel.to_entity.id,
        name: rel.to_entity.entity_name,
        code: rel.to_entity.entity_code,
        enrolled_date: rel.created_at,
        status: rel.relationship_data?.status || 'active'
      })) || []

    // Calculate KPIs
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Count messages in last 30 days
    const { count: messageCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'comm_message')
      .eq('organization_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .or(
        `metadata->subject_id.eq.${entityId},metadata->from_entity_id.eq.${entityId},metadata->to_entity_id.eq.${entityId}`
      )

    // Count open cases
    const { data: caseRels } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('to_entity_id', entityId)
      .eq('relationship_type', 'case_for_entity')
      .eq('organization_id', orgId)

    const caseIds = caseRels?.map(rel => rel.from_entity_id) || []

    let openCasesCount = 0
    if (caseIds.length > 0) {
      const { data: cases } = await supabase
        .from('core_entities')
        .select('id')
        .in('id', caseIds)
        .eq('organization_id', orgId)

      // Check status in dynamic data
      for (const caseEntity of cases || []) {
        const { data: statusField } = await supabase
          .from('core_dynamic_data')
          .select('field_value_text')
          .eq('entity_id', caseEntity.id)
          .eq('field_name', 'status')
          .eq('organization_id', orgId)
          .single()

        if (
          statusField?.field_value_text &&
          ['open', 'pending', 'in_progress'].includes(statusField.field_value_text)
        ) {
          openCasesCount++
        }
      }
    }

    // Count active grants
    const { count: activeGrantsCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', 'grant_award')
      .eq('organization_id', orgId)
      .or(`metadata->recipient_id.eq.${entityId}`)

    // Calculate total funding
    let totalFunding = 0
    if (isDemo) {
      totalFunding = 450000
    }

    const overview = {
      identity: {
        id: entity.id,
        entity_code: entity.entity_code,
        entity_name: entity.entity_name,
        smart_code: entity.smart_code,
        type: dynamicData.type || 'partner',
        status: dynamicData.status || 'active',
        sector: dynamicData.sector,
        sub_sector: dynamicData.sub_sector,
        registry_no: dynamicData.registry_no,
        website: dynamicData.website,
        address: dynamicData.address,
        description: dynamicData.description
      },
      edi_flags: dynamicData.edi_flags || {},
      tags: dynamicData.tags ? dynamicData.tags.split(',').map((t: string) => t.trim()) : [],
      programs,
      kpis: {
        last_contact_at:
          dynamicData.last_contact_at ||
          new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        total_events_attended: isDemo ? 12 : 0,
        messages_last_30d: messageCount || (isDemo ? 8 : 0),
        open_cases_count: openCasesCount || (isDemo ? 2 : 0),
        active_grants_count: activeGrantsCount || (isDemo ? 3 : 0),
        total_funding_received: totalFunding,
        programs_enrolled: programs.length
      }
    }

    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error fetching organization overview:', error)
    return NextResponse.json({ error: 'Failed to fetch overview data' }, { status: 500 })
  }
}
