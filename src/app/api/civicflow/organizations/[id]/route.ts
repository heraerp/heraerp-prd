import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { OrgProfile } from '@/types/organizations'

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

    // Fetch organization entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'ps_org')
      .single()

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Fetch dynamic fields
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', entityId)
      .eq('organization_id', orgId)

    // Build dynamic data object
    const dynamicData: any = {}
    dynamicFields?.forEach(field => {
      const value = field.field_value_text || field.field_value_number || field.field_value_json
      if (field.field_name === 'tags' && typeof value === 'string') {
        dynamicData[field.field_name] = value.split(',').map(t => t.trim())
      } else {
        dynamicData[field.field_name] = value
      }
    })

    // Fetch manager relationship
    const { data: managerRel } = await supabase
      .from('core_relationships')
      .select(
        `
        *,
        to_entity:to_entity_id(
          entity_name,
          entity_code
        )
      `
      )
      .eq('from_entity_id', entityId)
      .eq('relationship_type', 'has_manager')
      .eq('organization_id', orgId)
      .single()

    let manager = null
    if (managerRel?.to_entity) {
      // Get user details from dynamic data
      const { data: userFields } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', managerRel.to_entity_id)
        .eq('organization_id', orgId)
        .in('field_name', ['email', 'avatar_url'])

      const userEmail = userFields?.find(f => f.field_name === 'email')?.field_value_text
      const avatarUrl = userFields?.find(f => f.field_name === 'avatar_url')?.field_value_text

      manager = {
        user_id: managerRel.to_entity_id,
        user_name: managerRel.to_entity.entity_name,
        user_email: userEmail || '',
        avatar_url: avatarUrl,
        assigned_at: managerRel.created_at
      }
    }

    // Fetch primary contact
    const { data: contactRels } = await supabase
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
      .eq('relationship_type', 'has_contact')
      .eq('organization_id', orgId)

    const primaryContactRel = contactRels?.find(rel => rel.relationship_data?.is_primary === true)

    let primaryContact = null
    if (primaryContactRel?.to_entity) {
      const { data: contactFields } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', primaryContactRel.to_entity_id)
        .eq('organization_id', orgId)
        .in('field_name', ['email', 'phone'])

      const email = contactFields?.find(f => f.field_name === 'email')?.field_value_text
      const phone = contactFields?.find(f => f.field_name === 'phone')?.field_value_text

      primaryContact = {
        id: primaryContactRel.id,
        constituent_id: primaryContactRel.to_entity_id,
        constituent_name: primaryContactRel.to_entity.entity_name,
        email,
        phone,
        role: primaryContactRel.relationship_data?.role || 'Primary Contact',
        is_primary: true,
        linked_at: primaryContactRel.created_at
      }
    }

    // Fetch engagement summary (simplified for now)
    const engagement = isDemo
      ? {
          stage: 'Active',
          stage_ordinal: 3,
          score: 75,
          score_trend: 'up' as const,
          last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          next_best_actions: ['Schedule quarterly review', 'Share impact report']
        }
      : null

    // Calculate overview KPIs
    const metrics = {
      last_contact_at:
        dynamicData.last_contact_at || new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      total_events_attended: isDemo ? 12 : 0,
      messages_last_30d: isDemo ? 8 : 0,
      open_cases_count: isDemo ? 2 : 0,
      active_grants_count: isDemo ? 3 : 0,
      total_funding_received: isDemo ? 450000 : 0,
      programs_enrolled: isDemo ? 4 : 0
    }

    const orgProfile: OrgProfile = {
      id: entity.id,
      entity_code: entity.entity_code,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      organization_id: entity.organization_id,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      type: dynamicData.type || 'partner',
      status: dynamicData.status || 'active',
      sector: dynamicData.sector,
      sub_sector: dynamicData.sub_sector,
      registry_no: dynamicData.registry_no,
      website: dynamicData.website,
      address: dynamicData.address,
      tags: dynamicData.tags || [],
      edi_flags: dynamicData.edi_flags,
      manager,
      primary_contact: primaryContact,
      engagement,
      metrics
    }

    return NextResponse.json(orgProfile)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}
